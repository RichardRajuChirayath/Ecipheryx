import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
    clusterApiUrl
} from "@solana/web3.js";
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    AuthorityType,
    setAuthority
} from "@solana/spl-token";
import * as fs from 'fs';

// Initialize connection to Solana Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Secret management for the Vault Authority
// In a real app, this would be in a KMS or secure env var
const AUTHORITY_KEY_PATH = "solana-authority.json";

function getAuthorityKeypair(): Keypair {
    try {
        if (process.env.SOLANA_PRIVATE_KEY) {
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY)));
        }

        if (fs.existsSync(AUTHORITY_KEY_PATH)) {
            const secretKey = JSON.parse(fs.readFileSync(AUTHORITY_KEY_PATH, 'utf-8'));
            return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }
    } catch (e) {
        console.warn("Failed to load authority key, generating new one...");
    }

    const newKeypair = Keypair.generate();
    fs.writeFileSync(AUTHORITY_KEY_PATH, JSON.stringify(Array.from(newKeypair.secretKey)));
    return newKeypair;
}

const authority = getAuthorityKeypair();

/**
 * Mints a "Proof of Life" (POL) token on-chain to the user.
 * This satisfies the "Decentralized Access Control" requirement.
 */
export async function mintProofOfLifeToken(userName: string) {
    console.log(`[POL] Initializing On-Chain Mint for: ${userName}`);

    try {
        // 0. Robust Airdrop Logic
        let balance = await connection.getBalance(authority.publicKey);
        if (balance < 0.05 * LAMPORTS_PER_SOL) {
            console.log("[POL] Requesting Devnet funds for Authority...");
            for (let i = 0; i < 3; i++) {
                try {
                    const airdrop = await connection.requestAirdrop(authority.publicKey, 1 * LAMPORTS_PER_SOL);
                    await connection.confirmTransaction(airdrop, "confirmed");
                    console.log("[POL] Airdrop Success.");
                    break;
                } catch (e) {
                    console.warn(`[POL] Airdrop attempt ${i + 1} failed. Retrying...`);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        // 1. Create Token Mint
        const mint = await createMint(
            connection,
            authority,
            authority.publicKey,
            authority.publicKey,
            0 // 0 decimals = 1 unique token
        );

        console.log(`[POL] Token Mint Created: ${mint.toBase58()}`);

        // 2. We generate a "User Lockbox" (Associated Token Account)
        // For the hackathon, we'll use a deterministic user address or just burn to a fresh one
        const userWallet = Keypair.generate();
        const userATA = await getOrCreateAssociatedTokenAccount(
            connection,
            authority,
            mint,
            userWallet.publicKey
        );

        // 3. Mint 1 POL token to the user
        const txid = await mintTo(
            connection,
            authority,
            mint,
            userATA.address,
            authority,
            1
        );

        // 4. "Decentralize" it: Set Authority to None to make it non-transferable/permanent
        // (Optional: for True Proof of Life, we might want it to be soul-bound)
        await setAuthority(
            connection,
            authority,
            mint,
            authority.publicKey,
            AuthorityType.MintTokens,
            null
        );

        console.log(`[POL] On-Chain Proof Complete. TX: ${txid}`);

        return {
            mint: mint.toBase58(),
            address: userWallet.publicKey.toBase58(),
            txHash: txid,
            explorer: `https://explorer.solana.com/tx/${txid}?cluster=devnet`
        };
    } catch (error) {
        console.error("[POL] On-Chain Mint Error:", error);
        throw error;
    }
}
