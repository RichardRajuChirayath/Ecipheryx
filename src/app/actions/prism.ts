"use server";

import { verifyZKProof, type ZKProof, type VerificationResult } from "@/lib/zkproof";
import { prisma } from "@/lib/prisma";

/**
 * PROJECT PRISM — Server-Side ZK Verification Action
 * 
 * This action receives ONLY the mathematical proof from the client.
 * It NEVER sees the user's face, image, or biometric vector.
 * The server verifies the cryptographic proof and issues an attestation.
 */
export async function verifyPrismProof(
    proof: ZKProof,
    userInfo: { name: string; email: string }
): Promise<{
    verified: boolean;
    securityLevel: string;
    reason: string;
    checks: VerificationResult["checks"];
    attestation: {
        id: string;
        commitment: string;
        issuedAt: string;
        expiresAt: string;
    } | null;
}> {
    try {
        console.log(`[PRISM] ZK-Proof received for: ${userInfo.email}`);
        console.log(`[PRISM] Commitment: ${proof.commitment.slice(0, 16)}...`);
        console.log(`[PRISM] Dimensions: ${proof.vectorDimension} | Entropy: ${proof.entropyScore.toFixed(4)}`);
        console.log(`[PRISM] ZERO biometric data transmitted. Server sees ONLY math.`);

        // Verify the ZK-Proof (pure math, no biometric data)
        const result = await verifyZKProof(proof);

        console.log(`[PRISM] Verification: ${result.valid ? "✅ PASSED" : "❌ FAILED"} at ${result.securityLevel}`);

        if (result.valid) {
            // Create or get user
            const user = await prisma.user.upsert({
                where: { email: userInfo.email },
                update: { name: userInfo.name },
                create: { email: userInfo.email, name: userInfo.name },
            });

            // Log the ZK verification session
            const session = await prisma.verificationSession.create({
                data: {
                    userId: user.id,
                    challengeType: "ZK_BIOMETRIC_PROOF",
                    status: "PASSED",
                    confidence: proof.entropyScore / 5.0, // Normalize entropy to 0-1
                    landmarkLog: {
                        protocol: "PROJECT_PRISM",
                        commitment: proof.commitment,
                        securityLevel: result.securityLevel,
                        checks: result.checks,
                        vectorDimension: proof.vectorDimension,
                        entropyScore: proof.entropyScore,
                        proofAge: Date.now() - proof.timestamp,
                        note: "ZERO biometric data stored. Only cryptographic attestation."
                    } as any,
                },
            });

            // Create a Proof of Life token
            const token = await prisma.proofOfLifeToken.create({
                data: {
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    solanaTx: `ZK_${proof.commitment.slice(0, 32)}`,
                    solanaMint: `PRISM_L${result.securityLevel.replace("L", "")}_ATTESTATION`,
                },
            });

            return {
                verified: true,
                securityLevel: result.securityLevel,
                reason: result.reason,
                checks: result.checks,
                attestation: {
                    id: session.id,
                    commitment: proof.commitment,
                    issuedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
            };
        }

        return {
            verified: false,
            securityLevel: result.securityLevel,
            reason: result.reason,
            checks: result.checks,
            attestation: null,
        };
    } catch (error: any) {
        console.error("[PRISM] Error:", error?.message || error);
        return {
            verified: false,
            securityLevel: "L1",
            reason: `System error: ${error?.message || "Unknown"}`,
            checks: {
                freshness: false,
                entropy: false,
                dimensionality: false,
                challengeIntegrity: false,
                spectralConsistency: false,
            },
            attestation: null,
        };
    }
}
