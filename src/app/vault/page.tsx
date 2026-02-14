"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, Key, Cpu, ExternalLink, Link as LinkIcon,
    User, Shield, Activity, Fingerprint, AlertTriangle,
    Blocks, Globe, CheckCircle2, Search, RefreshCw,
    Zap, Terminal, Network, Lock, ChevronLeft, BarChart3
} from "lucide-react";
import Link from "next/link";
import { getVaultData } from "@/app/actions/vault";
import NeuralBackground from "@/components/ui/NeuralBackground";

interface VaultData {
    user: { id: string; name: string | null; email: string; createdAt: string } | null;
    sessions: {
        id: string;
        challengeType: string;
        status: string;
        confidence: number | null;
        createdAt: string;
        landmarkLog: any;
    }[];
    tokens: { id: string; token: string; solanaTx: string | null; solanaMint: string | null; createdAt: string; expiresAt: string }[];
}

export default function EcipheryxDashboard() {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [data, setData] = useState<VaultData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const result = await getVaultData();
            setData(result as any);
            setLoading(false);
        })();
    }, []);

    const passedSessions = data?.sessions.filter((s) => s.status === "PASSED") || [];
    const avgConfidence = passedSessions.length > 0
        ? (passedSessions.reduce((acc, s) => acc + (s.confidence || 0), 0) / passedSessions.length)
        : 0;

    return (
        <div className="min-h-screen bg-[#050a14] text-zinc-300 font-sans p-6 md:p-12 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none noise-bg z-0" />
            <NeuralBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row items-center justify-between mb-20 gap-10">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-cyan-500/10 transition-all shadow-lg p-3">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white text-outlined-purple leading-none mb-1" style={{ letterSpacing: '-0.1em' }}>ECIPHERYX<span className="logo-dot">.</span></span>
                            <span className="text-[10px] text-cyan-500/60 font-mono tracking-[0.4em] uppercase font-bold">Identity_Security_Vault</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full flex items-center gap-6 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Storage: Encrypted</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">NODE_D2</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsWalletConnected(!isWalletConnected)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest border transition-all duration-500 uppercase flex items-center gap-3 shadow-xl ${isWalletConnected
                                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                : "bg-cyan-500 text-[#050a14] hover:bg-cyan-400"
                                }`}
                        >
                            {isWalletConnected ? (
                                <><Network className="w-4 h-4" /> Node Active</>
                            ) : (
                                <><Key className="w-4 h-4" /> Link Protocol</>
                            )}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                        <p className="text-[10px] text-cyan-500/60 font-black uppercase tracking-[0.6em] animate-pulse">Syncing_Encrypted_Manifest</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Summary Rails */}
                        <div className="lg:col-span-3 space-y-6">
                            <StatCard label="Security Level" value={passedSessions.length > 0 ? "Tier 4" : "Level 0"} subtitle="Verification Status" color="cyan" />
                            <StatCard label="Identity Tokens" value={`${data?.tokens.filter(t => t.solanaTx).length || 0}`} subtitle="On-Chain Attestations" color="purple" />
                            <StatCard label="Neural Confidence" value={`${(avgConfidence * 100).toFixed(0)}%`} subtitle="Analysis Accuracy" color="emerald" />
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-9 space-y-8">
                            {/* Attestation Feed */}
                            <div className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden">
                                <div className="absolute inset-0 scanner-grid opacity-10 pointer-events-none" />

                                <div className="flex items-center justify-between mb-12 relative z-10">
                                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-4 uppercase">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-cyan-400">
                                            <Globe className="w-6 h-6" />
                                        </div>
                                        On-Chain Identity Feed
                                    </h2>
                                    <div className="text-[9px] font-mono text-cyan-500/40 uppercase tracking-widest">
                                        Subnet_Logs_v4.2
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {data?.tokens && data.tokens.length > 0 ? (
                                        data.tokens.map((token, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                key={token.id}
                                                className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-300 group"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                                                            <Shield className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-bold text-white tracking-tight mb-1 uppercase">
                                                                {token.solanaTx?.startsWith('L2_') ? "Identity Attestation" : "On-Chain Vitality Proof"}
                                                            </p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-mono tracking-widest text-cyan-500/60 uppercase">TX: {token.solanaTx?.slice(0, 15)}...</span>
                                                                <span className="text-[10px] font-mono text-zinc-600">{new Date(token.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {token.solanaTx && !token.solanaTx.startsWith('L2_') && (
                                                        <button
                                                            onClick={() => window.open(`https://explorer.solana.com/tx/${token.solanaTx}?cluster=devnet`, '_blank')}
                                                            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                                                        >
                                                            View Block <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4 opacity-30">
                                            <AlertTriangle className="w-10 h-10 text-zinc-700" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]">No active attestations found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Profile Summary */}
                                <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-4 mb-10 uppercase">
                                        <User className="w-5 h-5 text-cyan-500" />
                                        Identity Profile
                                    </h3>
                                    <div className="space-y-4 flex-1">
                                        <ProfileInfo label="Subject Index" value={data?.user?.id || '—'} mono />
                                        <ProfileInfo label="Identity Name" value={data?.user?.name || 'Anonymous User'} />
                                        <ProfileInfo label="Secure Router" value={data?.user?.email || '—'} mono />
                                    </div>
                                </div>

                                {/* Audit Highlights */}
                                <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col">
                                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-4 mb-10 uppercase">
                                        <Activity className="w-5 h-5 text-purple-500" />
                                        Audit Records
                                    </h3>
                                    <div className="space-y-4 flex-1">
                                        {data?.sessions.slice(0, 3).map((session, i) => (
                                            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{session.challengeType}</span>
                                                    <span className="text-[9px] text-zinc-600 font-mono italic">{new Date(session.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                                    <div className="h-full bg-purple-500" style={{ width: `${(session.confidence || 0) * 100}%` }} />
                                                </div>
                                                <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Confidence score: <span className="text-purple-400">{(session.confidence || 0) * 100}%</span></p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, subtitle, color }: { label: string; value: string; subtitle: string; color: string }) {
    const colorClasses: Record<string, string> = {
        cyan: "text-cyan-400 border-cyan-500/20",
        purple: "text-purple-400 border-purple-500/20",
        emerald: "text-emerald-400 border-emerald-500/20"
    };

    return (
        <div className={`p-10 rounded-[2.5rem] glass-panel transition-all duration-500 group hover:-translate-y-1`}>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.4em] mb-4">{label}</p>
            <p className={`text-4xl font-black tracking-tighter mb-2 ${colorClasses[color].split(' ')[0]}`}>{value}</p>
            <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
    );
}

function ProfileInfo({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-colors">
            <p className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-1.5">{label}</p>
            <p className={`text-white font-bold tracking-tight ${mono ? 'font-mono text-[10px] opacity-60' : 'text-sm'}`}>{value}</p>
        </div>
    );
}
