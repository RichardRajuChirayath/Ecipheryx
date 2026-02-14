"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Key, Cpu, ExternalLink, Link as LinkIcon, User, Shield, Activity, Fingerprint, AlertTriangle, Blocks, Globe, CheckCircle2, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getVaultData } from "@/app/actions/vault";

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
        <div className="min-h-screen bg-zinc-950 ecipheryx-grid p-6 md:p-10 font-sans text-zinc-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative group">
                            <ShieldCheck className="w-10 h-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-zinc-950" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Ecipheryx Sanctuary</h1>
                            {data?.user && (
                                <p className="text-[11px] text-emerald-500/70 font-mono tracking-widest uppercase mt-1">
                                    IDENTITY_LINKED: {data.user.name?.toUpperCase()} // {data.user.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsWalletConnected(!isWalletConnected)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] border transition-all ${isWalletConnected
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                                }`}
                        >
                            {isWalletConnected ? "WALLET READY (0x71...3f9a)" : "CONNECT SOLANA PROTOCOL"}
                        </button>
                        <Link href="/" className="px-8 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all text-[10px] font-black tracking-[0.2em]">TERMINATE</Link>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(6,182,212,0.2)]" />
                        <p className="text-cyan-500/50 text-[10px] font-mono tracking-[0.4em] uppercase animate-pulse">Syncing Sanctuary Data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Stats - Left Rail */}
                        <div className="lg:col-span-3 space-y-6">
                            <StatCard icon={<Shield className="w-5 h-5 text-emerald-400" />} label="Liveness Security" value={passedSessions.length > 0 ? "TIER_1" : "NONE"} color="emerald" subtitle="Multi-Factor Auth Active" />
                            <StatCard icon={<Blocks className="w-5 h-5 text-amber-400" />} label="On-Chain Tokens" value={`${data?.tokens.filter(t => t.solanaTx).length || 0}`} color="amber" subtitle="Solana Devnet Assets" />
                            <StatCard icon={<Activity className="w-5 h-5 text-cyan-400" />} label="Biometric Confidence" value={`${(avgConfidence * 100).toFixed(0)}%`} color="cyan" subtitle="Llama 3.3 Auditor Analysis" />
                            <StatCard icon={<Fingerprint className="w-5 h-5 text-fuchsia-400" />} label="Global Sessions" value={`${data?.sessions.length || 0}`} color="fuchsia" subtitle="Proof of Life Attempts" />
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-9 space-y-8">
                            {/* DECENTRALIZED ASSETS */}
                            <section className="glass-card rounded-[2.5rem] p-10 overflow-hidden relative border border-white/5 shadow-2xl">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                        <Globe className="w-6 h-6 text-cyan-400" />
                                        Decentralized Access Layer
                                    </h2>
                                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Mainnet Emulation Active
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {data?.tokens && data.tokens.length > 0 ? (
                                        data.tokens.map((token, i) => (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={token.id} className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-cyan-500/20 transition-all group overflow-hidden relative">
                                                {token.solanaTx ? (
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-transform duration-500 ${token.solanaTx.startsWith('L2_') ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 'bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 text-cyan-400 border-white/10'}`}>
                                                                {token.solanaTx.startsWith('L2_') ? <Shield className="w-7 h-7" /> : <Key className="w-7 h-7" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-black text-white tracking-tight">
                                                                    {token.solanaTx.startsWith('L2_') ? "Off-Chain Cryptographic Proof" : "Identity-Scoped Access Token"}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest">
                                                                        {token.solanaTx.startsWith('L2_') ? "ECIPHERYX_L2_PROTOCOL" : "SPL-SBT TOKEN"}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                                        {token.solanaMint?.slice(0, 16)}...
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-8">
                                                            <div className="hidden sm:block text-right">
                                                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                                                                    {token.solanaTx.startsWith('L2_') ? <ShieldCheck className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                                                    {token.solanaTx.startsWith('L2_') ? "LOCAL_ATTESTATION" : "ON_CHAIN_TRANSACTION"}
                                                                </p>
                                                                <p className={`text-[11px] font-mono truncate max-w-[150px] ${token.solanaTx.startsWith('L2_') ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
                                                                    {token.solanaTx}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (!token.solanaTx?.startsWith('L2_')) {
                                                                        window.open(`https://explorer.solana.com/tx/${token.solanaTx}?cluster=devnet`, '_blank');
                                                                    }
                                                                }}
                                                                className={`px-6 py-3 font-black rounded-xl uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl ${token.solanaTx.startsWith('L2_') ? 'bg-zinc-800 text-zinc-400 border border-white/5 cursor-default' : 'bg-cyan-500 text-black shadow-cyan-500/20'}`}
                                                            >
                                                                {token.solanaTx.startsWith('L2_') ? "Awaiting Batch" : "Verify Chain"}
                                                                {!token.solanaTx.startsWith('L2_') && <ExternalLink className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between animate-pulse p-2">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-amber-500 uppercase tracking-widest">On-Chain Protocol Syncing...</p>
                                                                <p className="text-[9px] text-zinc-600 font-mono mt-1">ESTABLISHING GENESIS BLOCK // DEVNET</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="h-2 w-24 bg-zinc-800 rounded shadow-inner" />
                                                            <div className="h-2 w-16 bg-zinc-800/50 rounded shadow-inner" />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-xs">Awaiting On-Chain Minting...</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* INTELLIGENCE LAYER LOGS */}
                                <section className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-8 relative z-10">
                                        <Cpu className="w-6 h-6 text-fuchsia-400" />
                                        Auditor Logs
                                    </h2>
                                    <div className="space-y-4 relative z-10">
                                        {/* Security Benchmarks Integration */}
                                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 mb-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Benchmarks</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Face Verification</p>
                                                    <p className="text-[11px] text-emerald-400 font-black font-mono">LFW_COMPLIANT</p>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Anti-Spoofing</p>
                                                    <p className="text-[11px] text-fuchsia-400 font-black font-mono">CELEB_DF_AUDIT</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Temporal Consistency Active</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse delay-75" />
                                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Micro-Jitter Detection</span>
                                                </div>
                                            </div>
                                        </div>

                                        {data?.sessions && data.sessions.length > 0 ? (
                                            data.sessions.slice(0, 4).map((session, i) => (
                                                <div key={session.id} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-fuchsia-500/20 transition-all">
                                                    {/* ... same original code ... */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-lg ${session.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{session.challengeType}</p>
                                                        </div>
                                                        <span className="text-[10px] text-zinc-600 font-mono">{new Date(session.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 leading-relaxed italic border-l-2 border-white/5 pl-4 mt-2">
                                                        {session.landmarkLog?.auditorNote || "Biometric pattern analyzed and stored."}
                                                    </p>
                                                    {session.landmarkLog?.securityFlag && (
                                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-fuchsia-400/70 uppercase tracking-[0.2em]">
                                                            <Search className="w-3.5 h-3.5" /> FLAG: {session.landmarkLog.securityFlag}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px] pt-10 text-center">No Audit Telemetry</p>
                                        )}
                                    </div>
                                </section>

                                {/* IDENTITY PROFILE */}
                                <section className="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 mb-8">
                                        <User className="w-6 h-6 text-emerald-400" />
                                        Identity Core
                                    </h2>
                                    {data?.user && (
                                        <div className="space-y-5">
                                            <ProfileField label="Identity Hash" value={data.user.id.toUpperCase()} mono />
                                            <ProfileField label="Enrolled Identity" value={data.user.name || "UNIDENTIFIED"} />
                                            <ProfileField label="Secure Gateway" value={data.user.email} mono />
                                            <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 mt-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-emerald-500/50 font-black uppercase tracking-widest leading-none">Status</p>
                                                    <p className="text-xl font-black text-emerald-400 tracking-tighter uppercase leading-none">Verified</p>
                                                </div>
                                                <ShieldCheck className="w-12 h-12 text-emerald-500/20" />
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(23, 23, 23, 0.4);
                    backdrop-filter: blur(20px);
                }
            `}</style>
        </div>
    );
}

function StatCard({ icon, label, value, color, subtitle }: { icon: any; label: string; value: string; color: string, subtitle: string }) {
    const colors: Record<string, string> = {
        cyan: "border-cyan-500/20 text-cyan-400",
        fuchsia: "border-fuchsia-500/20 text-fuchsia-400",
        emerald: "border-emerald-500/20 text-emerald-400",
        amber: "border-amber-500/20 text-amber-400",
    };

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`p-8 rounded-[2rem] glass-card border-l-4 ${colors[color]} shadow-xl group hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center gap-5 mb-3">
                <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/5">{icon}</div>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-black text-white tracking-widest uppercase">{value}</p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-1 group-hover:text-zinc-500 transition-colors">{subtitle}</p>
        </motion.div>
    );
}

function ProfileField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 transition-all">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1.5">{label}</p>
            <p className={`text-white font-black truncate ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</p>
        </div>
    );
}
