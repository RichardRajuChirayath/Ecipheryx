"use server";

import { prisma } from "@/lib/prisma";

export async function getVaultData(email?: string) {
    try {
        // Get the most recently verified user
        const latestSession = await prisma.verificationSession.findFirst({
            where: { status: "PASSED" },
            orderBy: { createdAt: "desc" },
            include: { user: true },
        });

        if (!latestSession) {
            return { user: null, sessions: [], tokens: [] };
        }

        const user = latestSession.user;

        // Get all verification sessions for this user
        const sessions = await prisma.verificationSession.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        // Get proof of life tokens
        const tokens = await prisma.proofOfLifeToken.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
            },
            sessions: sessions.map((s) => ({
                id: s.id,
                challengeType: s.challengeType,
                status: s.status,
                confidence: s.confidence,
                createdAt: s.createdAt.toISOString(),
            })),
            tokens: tokens.map((t) => ({
                id: t.id,
                token: t.token,
                solanaTx: t.solanaTx,
                solanaMint: t.solanaMint,
                createdAt: t.createdAt.toISOString(),
                expiresAt: t.expiresAt.toISOString(),
            })),
        };
    } catch (error) {
        console.error("Vault data fetch error:", error);
        return { user: null, sessions: [], tokens: [] };
    }
}
