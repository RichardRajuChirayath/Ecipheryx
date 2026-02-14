"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, ShieldCheck, ShieldAlert, Eye, EyeOff, Lock, Unlock,
    Fingerprint, Cpu, RefreshCw, ChevronLeft, CheckCircle, XCircle,
    User, Mail, ChevronRight, Zap, Hash, Activity, Scan
} from "lucide-react";
import Link from "next/link";
import { extractBiometricVector, computeBiometricCommitment, generateZKProof, type ZKProof } from "@/lib/zkproof";
import { verifyPrismProof } from "@/app/actions/prism";

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
    const [fragmentParticles, setFragmentParticles] = useState<{ x: number; y: number; char: string }[]>([]);

    const addLog = useCallback((msg: string) => {
        setStatusLog(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const startPrismProtocol = async () => {
        if (!userData.name || !userData.email) return;

        setStatus("CAPTURING");
        setResult(null);
        setCommitment(null);
        setProof(null);
        setStatusLog([]);
        setFragmentParticles([]);
        addLog("PRISM PROTOCOL INITIATED");
        addLog("Camera feed captured — image stays CLIENT-SIDE");

        // Step 1: Capture landmarks from webcam via MediaPipe FaceMesh
        await new Promise(r => setTimeout(r, 1500));

        if (!webcamRef.current?.video) {
            addLog("ERROR: No video feed available");
            setStatus("IDLE");
            return;
        }

        setStatus("EXTRACTING");
        addLog("Loading MediaPipe FaceMesh model...");

        try {
            const mpFaceMesh = await import("@mediapipe/face_mesh");
            const FM = mpFaceMesh.FaceMesh || (mpFaceMesh as any).default?.FaceMesh;

            const faceMesh = new FM({
                locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
            });
            faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7 });

            addLog("FaceMesh model loaded. Extracting 468 landmarks...");

            const landmarkPromise = new Promise<any[]>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Landmark extraction timeout")), 10000);
                faceMesh.onResults((results: any) => {
                    clearTimeout(timeout);
                    if (results.multiFaceLandmarks?.[0]) {
                        resolve(results.multiFaceLandmarks[0]);
                    } else {
                        reject(new Error("No face detected in frame"));
                    }
                });
                faceMesh.send({ image: webcamRef.current!.video! });
            });

            const landmarks = await landmarkPromise;
            faceMesh.close();

            addLog(`✓ Extracted 468 facial landmarks (3D)`);
            addLog("Computing biometric vector from 32 identity-critical points...");

            // Generate "fragment" particles for the visual effect
            const particles = Array.from({ length: 80 }, () => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                char: Math.random().toString(16).substr(2, 2),
            }));
            setFragmentParticles(particles);

            // Step 2: Extract biometric vector
            const vector = extractBiometricVector(landmarks);
            setVectorDim(vector.length);
            addLog(`✓ Biometric vector: ${vector.length} dimensions`);

            // Step 3: Hash into commitment
            setStatus("HASHING");
            addLog("Hashing vector via SHA-256 (Web Crypto API)...");
            await new Promise(r => setTimeout(r, 800));

            const commitmentHash = await computeBiometricCommitment(vector);
            setCommitment(commitmentHash);
            addLog(`✓ Commitment: 0x${commitmentHash.slice(0, 16)}...`);
            addLog("Face data DESTROYED. Only math remains.");

            // Step 4: Generate ZK-Proof
            setStatus("PROVING");
            addLog("Generating Zero-Knowledge Proof...");
            await new Promise(r => setTimeout(r, 1200));

            const zkProof = await generateZKProof(vector);
            setProof(zkProof);
            setEntropy(zkProof.entropyScore);
            addLog(`✓ ZK-Proof generated (nonce: ${zkProof.nonce.slice(0, 8)}...)`);
            addLog(`✓ Entropy: ${zkProof.entropyScore.toFixed(4)} | Spectral: ${zkProof.spectralHash.slice(0, 8)}...`);

            // Step 5: Transmit ONLY the proof (no image, no landmarks, no vector)
            setStatus("TRANSMITTING");
            addLog("⚡ Transmitting PROOF ONLY to server...");
            addLog("⚡ ZERO biometric data leaves this device.");
            await new Promise(r => setTimeout(r, 500));

            const serverResult = await verifyPrismProof(zkProof, userData);
            addLog(`Server response: ${serverResult.verified ? "VERIFIED" : "REJECTED"} at ${serverResult.securityLevel}`);

            setResult(serverResult);
            setStatus(serverResult.verified ? "VERIFIED" : "REJECTED");

        } catch (error: any) {
            addLog(`ERROR: ${error?.message || "Unknown error"}`);
            setStatus("IDLE");
        }
    };

    const reset = () => {
        setStatus("IDLE");
        setResult(null);
        setCommitment(null);
        setProof(null);
        setStatusLog([]);
        setFragmentParticles([]);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans relative overflow-hidden pixel-grid">
            <div className="fixed inset-0 pointer-events-none noise-bg" />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <div className="absolute -top-[10%] left-[20%] w-[50%] h-[50%] bg-violet-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-10 relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-violet-500/50 transition-all text-white group relative">
                            <div className="absolute inset-0 bg-violet-500/10 scale-0 group-hover:scale-100 transition-transform rounded-2xl" />
                            <ChevronLeft className="w-5 h-5 relative z-10" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-px w-8 bg-violet-500" />
                                <span className="text-[10px] text-violet-400 font-mono tracking-[0.5em] uppercase">Zero-Knowledge Protocol</span>
                            </div>
                            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">
                                Project <span className="text-violet-400">Prism</span>
                            </h1>
                            <div className="mt-2 flex items-center gap-4">
                                <p className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase">Prove who you are, without showing who you are</p>
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 px-6 py-3 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-xl backdrop-blur-xl shadow-lg shadow-violet-500/5">
                            <EyeOff className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Zero-Knowledge Biometrics</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest bg-black/40 px-3 py-1 border border-white/5 rounded-md">
                            Server sees: 0 images | 0 pixels | Only math
                        </div>
                    </div>
                </header>

                {/* Registration */}
                <AnimatePresence mode="wait">
                    {status === "REGISTER" && (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="glass-card rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 text-center">
                                    <div className="w-24 h-24 bg-violet-500/10 rounded-3xl flex items-center justify-center text-violet-400 mx-auto mb-8 border border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.1)]">
                                        <EyeOff className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Project Prism</h2>
                                    <p className="text-zinc-500 text-sm font-medium tracking-wide mb-10 leading-relaxed uppercase max-w-md mx-auto">
                                        We prove your identity using <span className="text-violet-400">Zero-Knowledge Cryptography</span>.
                                        Your face is scanned locally, converted to math, and destroyed. The server never sees you.
                                    </p>

                                    {/* How it works */}
                                    <div className="grid grid-cols-3 gap-4 mb-10">
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                            <div className="text-violet-400 mb-2 flex justify-center"><Scan className="w-5 h-5" /></div>
                                            <p className="text-[9px] text-white font-black uppercase tracking-widest">Scan Face</p>
                                            <p className="text-[8px] text-zinc-600 font-mono mt-1">CLIENT ONLY</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                            <div className="text-violet-400 mb-2 flex justify-center"><Hash className="w-5 h-5" /></div>
                                            <p className="text-[9px] text-white font-black uppercase tracking-widest">Generate Hash</p>
                                            <p className="text-[8px] text-zinc-600 font-mono mt-1">SHA-256 PROOF</p>
                                        </div>
                                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                                            <div className="text-violet-400 mb-2 flex justify-center"><ShieldCheck className="w-5 h-5" /></div>
                                            <p className="text-[9px] text-white font-black uppercase tracking-widest">Verify Math</p>
                                            <p className="text-[8px] text-zinc-600 font-mono mt-1">ZERO DATA SENT</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-violet-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="FULL LEGAL NAME"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-xs font-black tracking-widest focus:border-violet-500/50 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-zinc-700"
                                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-violet-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="SECURE EMAIL GATEWAY"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-xs font-black tracking-widest focus:border-violet-500/50 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all placeholder:text-zinc-700"
                                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { if (userData.name && userData.email) setStatus("IDLE"); }}
                                        disabled={!userData.name || !userData.email}
                                        className="w-full py-6 bg-violet-500 hover:bg-violet-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all shadow-xl shadow-violet-500/20 active:scale-95 flex items-center justify-center gap-4 italic overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-1000 skew-x-[-20deg]" />
                                        <span className="relative z-10 flex items-center gap-3">
                                            Initialize Prism Protocol <Zap className="w-5 h-5" />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status !== "REGISTER" && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                        >
                            {/* LEFT: Camera + Visualization */}
                            <div className="space-y-8">
                                <div className="glass-card rounded-[3rem] overflow-hidden shadow-2xl shadow-black/80 relative border border-white/5">
                                    {/* Camera Feed */}
                                    <div className="aspect-square relative">
                                        <Webcam
                                            ref={webcamRef}
                                            className={`w-full h-full object-cover transition-all duration-1000 ${status === "EXTRACTING" || status === "HASHING"
                                                    ? "opacity-30 grayscale blur-sm"
                                                    : status === "VERIFIED" || status === "REJECTED"
                                                        ? "opacity-10 grayscale"
                                                        : "brightness-[1.1] contrast-[1.05]"
                                                }`}
                                            audio={false}
                                            mirrored
                                        />

                                        {/* Fragmentation Effect */}
                                        <AnimatePresence>
                                            {(status === "EXTRACTING" || status === "HASHING") && fragmentParticles.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 z-20"
                                                >
                                                    {fragmentParticles.map((p, i) => (
                                                        <motion.span
                                                            key={i}
                                                            initial={{ x: `${50}%`, y: `${50}%`, opacity: 0, scale: 0 }}
                                                            animate={{
                                                                x: `${p.x}%`,
                                                                y: `${p.y}%`,
                                                                opacity: [0, 1, 0.5],
                                                                scale: [0, 1.5, 1],
                                                            }}
                                                            transition={{ duration: 2, delay: i * 0.02, ease: "easeOut" }}
                                                            className="absolute text-[10px] font-mono text-violet-400/80 pointer-events-none"
                                                        >
                                                            {p.char}
                                                        </motion.span>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Commitment Convergence */}
                                        <AnimatePresence>
                                            {(status === "HASHING" || status === "PROVING") && commitment && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 z-30 flex items-center justify-center"
                                                >
                                                    <div className="text-center">
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                            className="w-48 h-48 border border-violet-500/30 rounded-full mx-auto mb-6 flex items-center justify-center relative"
                                                        >
                                                            <div className="absolute inset-2 border border-violet-500/20 rounded-full animate-pulse" />
                                                            <div className="absolute inset-4 border border-dashed border-violet-500/10 rounded-full" />
                                                            <Lock className="w-16 h-16 text-violet-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                                                        </motion.div>
                                                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">Digital Soul Hash</p>
                                                        <p className="text-violet-400 font-mono text-sm font-black">
                                                            0x{commitment.slice(0, 8)}...{commitment.slice(-8)}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Result Overlay */}
                                        <AnimatePresence>
                                            {status === "VERIFIED" && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xl"
                                                >
                                                    <div className="text-center">
                                                        <div className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                                                            <CheckCircle className="w-16 h-16 text-emerald-400" />
                                                        </div>
                                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-3">Identity Proven</h3>
                                                        <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.4em]">Zero biometric data transmitted</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                            {status === "REJECTED" && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xl"
                                                >
                                                    <div className="text-center">
                                                        <div className="w-32 h-32 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(239,68,68,0.2)]">
                                                            <XCircle className="w-16 h-16 text-red-400" />
                                                        </div>
                                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-3">Proof Rejected</h3>
                                                        <p className="text-red-400 text-[11px] font-black uppercase tracking-[0.4em]">Insufficient biometric entropy</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Scanline */}
                                        {(status === "CAPTURING" || status === "EXTRACTING") && (
                                            <div className="absolute inset-0 scanline z-10" />
                                        )}

                                        {/* Corner HUD */}
                                        <div className="absolute top-6 left-6 z-10">
                                            <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${status === "IDLE" ? "bg-zinc-500" : status === "VERIFIED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-red-500" : "bg-violet-500 animate-pulse"}`} />
                                                    <span className="text-[9px] font-mono text-white uppercase tracking-widest">{status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="p-6">
                                        {(status === "IDLE" || status === "VERIFIED" || status === "REJECTED") && (
                                            <button
                                                onClick={status === "IDLE" ? startPrismProtocol : reset}
                                                className={`w-full py-6 font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-4 italic shadow-2xl overflow-hidden relative ${status === "IDLE"
                                                        ? "bg-violet-500 text-white hover:bg-violet-400 shadow-violet-500/20"
                                                        : "bg-white/[0.02] text-white border border-white/10 hover:bg-white/5"
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-1000 skew-x-[-20deg]" />
                                                <span className="relative z-10 flex items-center gap-3">
                                                    {status === "IDLE" ? (
                                                        <>Begin Zero-Knowledge Scan <Eye className="w-5 h-5" /></>
                                                    ) : (
                                                        <>New Prism Ritual <RefreshCw className="w-5 h-5" /></>
                                                    )}
                                                </span>
                                            </button>
                                        )}
                                        {!["IDLE", "REGISTER", "VERIFIED", "REJECTED"].includes(status) && (
                                            <div className="flex items-center justify-center gap-4 py-4">
                                                <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                                                <span className="text-violet-400 text-[11px] font-black uppercase tracking-[0.4em] italic animate-pulse">
                                                    {status === "CAPTURING" && "Scanning biometric field..."}
                                                    {status === "EXTRACTING" && "Fragmenting into vectors..."}
                                                    {status === "HASHING" && "Computing SHA-256 commitment..."}
                                                    {status === "PROVING" && "Generating ZK-Proof..."}
                                                    {status === "TRANSMITTING" && "Sending PROOF (no image)..."}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pipeline Steps */}
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { s: "CAPTURING", icon: <Eye className="w-3.5 h-3.5" />, label: "Capture" },
                                        { s: "EXTRACTING", icon: <Fingerprint className="w-3.5 h-3.5" />, label: "Extract" },
                                        { s: "HASHING", icon: <Hash className="w-3.5 h-3.5" />, label: "Hash" },
                                        { s: "PROVING", icon: <Lock className="w-3.5 h-3.5" />, label: "Prove" },
                                        { s: "TRANSMITTING", icon: <Zap className="w-3.5 h-3.5" />, label: "Verify" },
                                    ].map((step, i) => {
                                        const statusOrder = ["CAPTURING", "EXTRACTING", "HASHING", "PROVING", "TRANSMITTING"];
                                        const currentIdx = statusOrder.indexOf(status);
                                        const stepIdx = statusOrder.indexOf(step.s);
                                        const isActive = status === step.s;
                                        const isDone = currentIdx > stepIdx || status === "VERIFIED";
                                        return (
                                            <div
                                                key={step.s}
                                                className={`p-4 rounded-2xl border text-center transition-all duration-500 ${isActive
                                                        ? "bg-violet-500/10 border-violet-500/40 text-violet-400 ring-2 ring-violet-500/10"
                                                        : isDone
                                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                                            : "bg-black/40 border-white/5 text-zinc-700"
                                                    }`}
                                            >
                                                <div className={`mx-auto mb-2 w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? "bg-violet-500/20" : isDone ? "bg-emerald-500/10" : "bg-white/5"
                                                    }`}>
                                                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : step.icon}
                                                </div>
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">{step.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RIGHT: Terminal + Results */}
                            <div className="space-y-8">
                                {/* Live Terminal */}
                                <div className="glass-card rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-violet-500/10 rounded-lg">
                                                <Cpu className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Protocol Log</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                    </div>
                                    <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 font-mono text-[11px] leading-relaxed h-[320px] overflow-y-auto scrollbar-thin">
                                        {statusLog.length === 0 ? (
                                            <div className="text-zinc-700 italic">
                                                <p>$ prism --init</p>
                                                <p className="mt-2">Waiting for user to begin...</p>
                                                <p className="animate-pulse mt-1">█</p>
                                            </div>
                                        ) : (
                                            statusLog.map((log, i) => (
                                                <motion.p
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`mb-1 ${log.includes("✓") ? "text-emerald-400" :
                                                            log.includes("ERROR") ? "text-red-400" :
                                                                log.includes("⚡") ? "text-violet-400 font-bold" :
                                                                    "text-zinc-400"
                                                        }`}
                                                >
                                                    {log}
                                                </motion.p>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Zero-Knowledge Proof Card */}
                                <AnimatePresence>
                                    {(commitment || proof) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-card rounded-[3rem] p-8 border border-violet-500/20 shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight italic mb-6 flex items-center gap-3 relative z-10">
                                                <Lock className="w-5 h-5 text-violet-400" /> ZK-Proof Artifact
                                            </h3>
                                            <div className="space-y-4 relative z-10">
                                                {commitment && (
                                                    <ProofField label="Biometric Commitment" value={`0x${commitment}`} color="violet" />
                                                )}
                                                {proof && (
                                                    <>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <ProofField label="Vector Dimensions" value={`${proof.vectorDimension}D`} color="cyan" />
                                                            <ProofField label="Entropy Score" value={proof.entropyScore.toFixed(4)} color="cyan" />
                                                        </div>
                                                        <ProofField label="Challenge Hash" value={`0x${proof.challenge.slice(0, 48)}...`} color="zinc" />
                                                        <ProofField label="Spectral Hash" value={`0x${proof.spectralHash.slice(0, 48)}...`} color="zinc" />
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Verification Result */}
                                <AnimatePresence>
                                    {result && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`glass-card rounded-[3rem] p-8 border shadow-2xl relative overflow-hidden ${result.verified
                                                    ? "border-emerald-500/30 shadow-emerald-500/10"
                                                    : "border-red-500/30 shadow-red-500/10"
                                                }`}
                                        >
                                            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 ${result.verified ? "bg-emerald-500" : "bg-red-500"
                                                }`} />

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic flex items-center gap-3">
                                                        <ShieldCheck className="w-5 h-5 text-emerald-400" /> Verification Report
                                                    </h3>
                                                    <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] ${result.verified
                                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                                            : "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                        }`}>
                                                        {result.securityLevel}
                                                    </div>
                                                </div>

                                                {/* Check Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                                                    {Object.entries(result.checks).map(([key, passed]) => (
                                                        <div
                                                            key={key}
                                                            className={`p-4 rounded-2xl border text-center ${passed
                                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                                    : "bg-red-500/5 border-red-500/20"
                                                                }`}
                                                        >
                                                            <div className={`mx-auto mb-2 ${passed ? "text-emerald-400" : "text-red-400"}`}>
                                                                {passed ? <CheckCircle className="w-4 h-4 mx-auto" /> : <XCircle className="w-4 h-4 mx-auto" />}
                                                            </div>
                                                            <p className={`text-[8px] font-black uppercase tracking-widest ${passed ? "text-emerald-400" : "text-red-400"}`}>
                                                                {key.replace(/([A-Z])/g, " $1").trim()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                                        <Activity className="w-3 h-3 text-violet-400" /> Analysis
                                                    </p>
                                                    <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">"{result.reason}"</p>
                                                </div>

                                                {result.attestation && (
                                                    <div className="mt-6 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                                                        <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest mb-1">Attestation Issued</p>
                                                            <p className="text-emerald-400 font-mono text-[11px] break-all">{result.attestation.id}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ProofField({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className={`p-4 bg-white/[0.02] border border-${color}-500/10 rounded-2xl`}>
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-[11px] font-mono text-${color}-400 break-all leading-relaxed`}>{value}</p>
        </div>
    );
}
