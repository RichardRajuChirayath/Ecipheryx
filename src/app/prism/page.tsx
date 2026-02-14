"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, ShieldCheck, Eye, EyeOff, Lock, Unlock,
    Fingerprint, Cpu, RefreshCw, ChevronLeft, CheckCircle, XCircle,
    User, Mail, Zap, Hash, Activity, Scan, Terminal, Globe, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { extractBiometricVector, computeBiometricCommitment, generateZKProof, type ZKProof } from "@/lib/zkproof";
import { verifyPrismProof } from "@/app/actions/prism";
import NeuralBackground from "@/components/ui/NeuralBackground";

type PrismStatus =
    | "REGISTER"
    | "IDLE"
    | "CAPTURING"
    | "EXTRACTING"
    | "HASHING"
    | "PROVING"
    | "TRANSMITTING"
    | "VERIFIED"
    | "REJECTED";

interface PrismResult {
    verified: boolean;
    securityLevel: string;
    reason: string;
    checks: Record<string, boolean>;
    attestation: { id: string; commitment: string; issuedAt: string; expiresAt: string } | null;
}

export default function ProjectPrism() {
    const webcamRef = useRef<Webcam>(null);
    const [status, setStatus] = useState<PrismStatus>("REGISTER");
    const [userData, setUserData] = useState({ name: "", email: "" });
    const [result, setResult] = useState<PrismResult | null>(null);
    const [commitment, setCommitment] = useState<string | null>(null);
    const [proof, setProof] = useState<ZKProof | null>(null);
    const [vectorDim, setVectorDim] = useState(0);
    const [entropy, setEntropy] = useState(0);
    const [statusLog, setStatusLog] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setStatusLog(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const startPrismProtocol = async () => {
        if (!userData.name || !userData.email) return;

        setStatus("CAPTURING");
        setResult(null);
        setCommitment(null);
        setProof(null);
        setStatusLog([]);
        addLog("PROTOCOL INITIALIZED");
        addLog("Securing Client-Side Capture");

        await new Promise(r => setTimeout(r, 1200));

        if (!webcamRef.current?.video) {
            addLog("ERROR: Signal Lost");
            setStatus("IDLE");
            return;
        }

        setStatus("EXTRACTING");
        addLog("Decomposing Biometric Markers");

        try {
            const mpFaceMesh = await import("@mediapipe/face_mesh");
            const FM = mpFaceMesh.FaceMesh || (mpFaceMesh as any).default?.FaceMesh;

            const faceMesh = new FM({
                locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
            });
            faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7 });

            const landmarkPromise = new Promise<any[]>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout")), 8000);
                faceMesh.onResults((results: any) => {
                    clearTimeout(timeout);
                    if (results.multiFaceLandmarks?.[0]) resolve(results.multiFaceLandmarks[0]);
                    else reject(new Error("Subject Lost"));
                });
                faceMesh.send({ image: webcamRef.current!.video! });
            });

            const landmarks = await landmarkPromise;
            faceMesh.close();

            addLog(`Biometric Vector Formed`);

            const vector = extractBiometricVector(landmarks);
            setVectorDim(vector.length);

            setStatus("HASHING");
            addLog("Calculating SHA-256 Commitment");
            await new Promise(r => setTimeout(r, 1000));

            const commitmentHash = await computeBiometricCommitment(vector);
            setCommitment(commitmentHash);
            addLog(`Commitment Anchored`);

            setStatus("PROVING");
            addLog("Synthesizing ZK-Proof");
            await new Promise(r => setTimeout(r, 1200));

            const zkProof = await generateZKProof(vector);
            setProof(zkProof);
            setEntropy(zkProof.entropyScore);

            setStatus("TRANSMITTING");
            addLog("Transmitting Anonymous Proof");
            await new Promise(r => setTimeout(r, 800));

            const serverResult = await verifyPrismProof(zkProof, userData);
            addLog(`Consensus: ${serverResult.verified ? "VERIFIED" : "REJECTED"}`);

            setResult(serverResult);
            setStatus(serverResult.verified ? "VERIFIED" : "REJECTED");

        } catch (error: any) {
            addLog(`ERR: ${error?.message || "Internal Fault"}`);
            setStatus("IDLE");
        }
    };

    const reset = () => {
        setStatus("IDLE");
        setResult(null);
        setCommitment(null);
        setProof(null);
        setStatusLog([]);
    };

    return (
        <main className="min-h-screen bg-[#050a14] text-zinc-300 font-sans relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none noise-bg z-0" />
            <NeuralBackground />

            <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
                <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-cyan-500/10 transition-all shadow-lg p-3">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white text-outlined-purple leading-none mb-1.5">ECIPHERYX<span className="logo-dot">.</span></span>
                            <span className="text-[10px] text-cyan-500/60 font-mono tracking-[0.4em] uppercase font-bold">Project_Prism_ZKP</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full flex items-center gap-6 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocol: Anonymous</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">ZK_CORE_L4</span>
                            </div>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {status === "REGISTER" && (
                        <motion.div key="register" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-3xl mx-auto">
                            <div className="glass-panel rounded-[3rem] p-16 relative overflow-hidden text-center">
                                <div className="absolute inset-0 scanner-grid opacity-10 pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="w-20 h-20 bg-cyan-500/10 rounded-[1.8rem] flex items-center justify-center text-cyan-400 mx-auto mb-10 border border-cyan-500/20 shadow-xl">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">Anonymous Identity</h2>
                                    <p className="text-zinc-500 text-[14px] font-medium tracking-wide mb-12 opacity-80 leading-relaxed max-w-lg mx-auto">
                                        Prove your identity without ever exposing your biometric data.
                                        Markers are processed locally into temporary, anonymous mathematical proofs.
                                    </p>

                                    <div className="grid grid-cols-3 gap-6 mb-12">
                                        <Badge icon={<Scan className="w-4 h-4" />} label="ZK Scan" />
                                        <Badge icon={<Lock className="w-4 h-4" />} label="Privacy" />
                                        <Badge icon={<Hash className="w-4 h-4" />} label="Secured" />
                                    </div>

                                    <div className="space-y-4 mb-12 text-left">
                                        <input
                                            placeholder="Subject Name"
                                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all font-bold placeholder:text-zinc-700"
                                            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                        />
                                        <input
                                            placeholder="Subject Gateway Address"
                                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all font-bold placeholder:text-zinc-700"
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        onClick={() => { if (userData.name && userData.email) setStatus("IDLE"); }}
                                        className="w-full py-6 bg-cyan-500 text-[#050a14] font-black uppercase tracking-widest rounded-2xl hover:bg-cyan-400 transition-all active:scale-[0.98] disabled:opacity-50"
                                        disabled={!userData.name || !userData.email}
                                    >
                                        Initialize ZK Kernel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status !== "REGISTER" && (
                        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Panel: Viewport */}
                            <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                                <div className="glass-panel rounded-[2.5rem] overflow-hidden relative min-h-[500px] flex items-center justify-center">
                                    <div className="absolute inset-0 scanner-grid opacity-10 pointer-events-none" />

                                    <div className="relative w-full aspect-video md:aspect-auto md:h-[600px] flex items-center justify-center p-12">
                                        <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg z-20" />
                                        <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg z-20" />
                                        <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg z-20" />
                                        <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg z-20" />

                                        <Webcam
                                            ref={webcamRef}
                                            className={`rounded-[2rem] w-full h-full object-cover grayscale transition-all duration-1000 ${["EXTRACTING", "HASHING", "PROVING"].includes(status) ? "blur-2xl opacity-20" : status === "VERIFIED" ? "opacity-10 blur-md" : "opacity-80"}`}
                                            audio={false}
                                            mirrored
                                        />

                                        {["EXTRACTING", "HASHING", "PROVING"].includes(status) && (
                                            <div className="absolute inset-0 flex items-center justify-center z-30">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin" />
                                                    <p className="text-cyan-400 font-black tracking-[0.6em] text-[11px] uppercase animate-pulse">{status}...</p>
                                                </div>
                                            </div>
                                        )}

                                        {status === "VERIFIED" && <FeedbackOverlay icon={<CheckCircle className="w-16 h-16" />} title="Proof Accepted" color="emerald" />}
                                        {status === "REJECTED" && <FeedbackOverlay icon={<XCircle className="w-16 h-16" />} title="Proof Rejected" color="red" />}

                                        <div className="absolute top-16 left-16 z-[35]">
                                            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${status === "IDLE" ? "bg-zinc-600" : status === "VERIFIED" ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"}`} />
                                                <span className="text-[10px] font-black text-white tracking-widest uppercase">{status}</span>
                                            </div>
                                        </div>

                                        {status === "CAPTURING" && <div className="scan-line-v2 opacity-50" />}
                                    </div>
                                </div>

                                <div className="glass-panel p-10 rounded-[2.5rem]">
                                    {["IDLE", "VERIFIED", "REJECTED"].includes(status) ? (
                                        <button
                                            onClick={status === "IDLE" ? startPrismProtocol : reset}
                                            className="w-full py-5 bg-cyan-500 text-[#050a14] font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:bg-cyan-400 transition-all active:scale-[0.98]"
                                        >
                                            {status === "IDLE" ? "Initiate Biometric Proof" : "Restart Encryption Ritual"}
                                        </button>
                                    ) : (
                                        <div className="h-14 flex items-center justify-center gap-6 opacity-40">
                                            <Activity className="w-5 h-5 animate-pulse text-cyan-400" />
                                            <span className="text-[10px] font-black tracking-[0.6em] uppercase text-zinc-400">Authenticating Pulse</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel: Terminal & Data */}
                            <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                                <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col gap-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-cyan-500">
                                            <Terminal className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">ZK Pipeline</h3>
                                            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Client-Side Logs</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 rounded-3xl p-6 border border-white/5 font-mono text-[10px] h-[300px] overflow-y-auto custom-scrollbar relative">
                                        {statusLog.map((log, i) => (
                                            <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-zinc-500 flex gap-3">
                                                <span className="text-cyan-500/40">{`>`}</span>
                                                {log}
                                            </motion.p>
                                        ))}
                                        {statusLog.length === 0 && <p className="text-zinc-800 italic opacity-20">_Awaiting linkage...</p>}
                                    </div>
                                </div>

                                {result && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`glass-panel rounded-[2.5rem] p-8 border ${result.verified ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-2xl ${result.verified ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                                    {result.verified ? <ShieldCheck className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                                </div>
                                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Audit Summary</h3>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${result.verified ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                                {result.securityLevel}
                                            </span>
                                        </div>
                                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <p className="text-zinc-400 text-xs italic leading-relaxed font-medium">"{result.reason}"</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="p-8 glass-panel rounded-[2.5rem] space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Vector Dimensions</span>
                                        <span className="text-[11px] font-mono text-cyan-500">{vectorDim || "—"} ops</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: vectorDim ? "100%" : "0%" }} className="h-full bg-cyan-500 shadow-[0_0_10px_#00e5ff]" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entropy Score</span>
                                        <span className="text-[11px] font-mono text-purple-500">{entropy ? `${(entropy * 100).toFixed(1)}%` : "—"}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${entropy * 100}%` }} className="h-full bg-purple-500 shadow-[0_0_10px_#8b5cf6]" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

function Badge({ icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500">
                {icon}
            </div>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
        </div>
    );
}

function FeedbackOverlay({ icon, title, color }: { icon: any, title: string, color: string }) {
    const colorClasses: any = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    }
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-[#050a14]/95 backdrop-blur-2xl p-12">
            <div className="text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 border-2 ${colorClasses[color]}`}>
                    {icon}
                </div>
                <h3 className="text-5xl font-black text-white tracking-tighter uppercase">{title}</h3>
                <p className="mt-4 text-[10px] text-zinc-500 font-mono tracking-[0.4em] uppercase">Security Protocol Successful</p>
            </div>
        </motion.div>
    );
}
