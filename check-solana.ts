import { Connection, Keypair, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from 'fs';

async function check() {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const secretKey = JSON.parse(fs.readFileSync("solana-authority.json", 'utf-8'));
    const authority = Keypair.fromSecretKey(Uint8Array.from(secretKey));

    console.log("Authority Address:", authority.publicKey.toBase58());
    const balance = await connection.getBalance(authority.publicKey);
    console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");
}

check();
