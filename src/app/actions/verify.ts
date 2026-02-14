"use server";

import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { mintProofOfLifeToken } from "@/lib/solana";

interface ChallengeResult {
    type: "WAVE" | "SMILE" | "NOD";
    data: { t: number; v: number }[];
    baseline: number;
}

interface VerificationPayload {
    sequence: ChallengeResult[];
}

export async function verifyLiveness(
    payload: VerificationPayload,
    challengeLabel: string,
    userInfo: { name: string; email: string }
) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { verified: false, confidence: 0, reasoning: "Missing API credentials." };

    const groq = new Groq({ apiKey });
    const { sequence } = payload;

    if (!sequence || sequence.length < 2) {
        return { verified: false, confidence: 0, reasoning: "Incomplete multi-factor sequence." };
    }

    try {
        const breakdown = sequence.map((stage, i) => {
            const vals = stage.data.map(d => d.v);
            return {
                stage: i + 1,
                type: stage.type,
                baseline: stage.baseline.toFixed(4),
                min: Math.min(...vals).toFixed(4),
                max: Math.max(...vals).toFixed(4),
                variance: (Math.max(...vals) - Math.min(...vals)).toFixed(4),
                point_count: vals.length
            };
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a high-security Biometric Auditor. 
                    
                    AUDIT GUIDELINES (SENSITIVITY ADJUSTED):
                    - Acknowledge that users may perform SUBTLE movements. 
                    - WAVE: Accept X-axis variance as low as 0.03 (if consistent).
                    - SMILE: Accept 6%+ increase from baseline.
                    - NOD: Accept pitch variance as low as 0.01.
                    
                    DEEPFAKE vs. HUMAN REASONING:
                    - PHOTO: Reject only if variance is effectively 0.0000 or noise is perfectly flat.
                    - VIDEO REPLAY: Reject if the motion curve is an infinite loop.
                    - DEEPFAKE: Look for "Micro-Jitter" (random pixel jumps) or "Ghosting".
                    - HUMAN: Biological movement is often small but follows a smooth deceleration arc. 
                    
                    IMPORTANT: Do not flag as "DEEPFAKE" just because the movement magnitude is low. Low magnitude is "Uncertain", not "Fake". 
                    Only flag "DEEPFAKE_DETECTED" if there is positive evidence of synthetic artifacts.
                    
                    RESPONSE FORMAT (JSON):
                    { 
                      "verified": boolean, 
                      "confidence": number, 
                      "reasoning": "Technical explanation.",
                      "human_flag": "FLAG_CODE" 
                    }`
                },
                {
                    role: "user",
                    content: `Audit sequence: ${JSON.stringify(breakdown)}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        if (result.verified) {
            const user = await prisma.user.upsert({
                where: { email: userInfo.email },
                update: { name: userInfo.name },
                create: { email: userInfo.email, name: userInfo.name },
            });

            await prisma.verificationSession.create({
                data: {
                    userId: user.id,
                    challengeType: "SEQUENTIAL_MFA",
                    status: "PASSED",
                    confidence: result.confidence || 0.95,
                    landmarkLog: {
                        auditorNote: result.reasoning,
                        securityFlag: result.human_flag,
                        stages: breakdown
                    } as any,
                },
            });

            const token = await prisma.proofOfLifeToken.create({
                data: {
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            try {
                const onChainData = await mintProofOfLifeToken(userInfo.name);
                await prisma.proofOfLifeToken.update({
                    where: { id: token.id },
                    data: {
                        solanaTx: onChainData?.txHash,
                        solanaMint: onChainData?.mint,
                    }
                });
            } catch (e) {
                const localSignature = `L2_${Buffer.from(token.id + userInfo.email).toString('hex').slice(0, 32)}`;
                await prisma.proofOfLifeToken.update({
                    where: { id: token.id },
                    data: {
                        solanaTx: localSignature,
                        solanaMint: "OFF_CHAIN_CRYPTO_NODE",
                    }
                });
            }
        }

        return {
            verified: result.verified === true,
            confidence: result.confidence ?? 0,
            reasoning: result.reasoning ?? "Audit complete."
        };
    } catch (error) {
        console.error("Auditor error:", error);
        return { verified: false, confidence: 0, reasoning: "Biometric Audit Failed: Telemetry inconsistent." };
    }
}
