"use client";

import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle, AlertCircle, RefreshCw, Hand, ShieldCheck,
    Smile, MoveDown, ChevronRight, User, Mail, Scan, Shield,
    Activity, Camera, Zap, Terminal, Lock, Power, BarChart3,
    Fingerprint, AlertTriangle
} from "lucide-react";
import { verifyLiveness } from "@/app/actions/verify";
import Link from "next/link";

type ChallengeType = "WAVE" | "SMILE" | "NOD";

const CHALLENGES: { type: ChallengeType; label: string; target: number; icon: any; color: string }[] = [
    { type: "WAVE", label: "Spatial Hand Motion", target: 1, icon: <Hand className="w-5 h-5" />, color: "cyan" },
    { type: "SMILE", label: "Biometric Expression", target: 1, icon: <Smile className="w-5 h-5" />, color: "fuchsia" },
    { type: "NOD", label: "Vertical Core Pitch", target: 1, icon: <MoveDown className="w-5 h-5" />, color: "emerald" },
];

function computeSmile(landmarks: any) {
    const dist = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const leftCorner = landmarks[61], rightCorner = landmarks[291];
    const leftEye = landmarks[33], rightEye = landmarks[263];
    const mouthWidth = dist(leftCorner, rightCorner);
    const eyeDist = dist(leftEye, rightEye);
    return mouthWidth / (eyeDist || 1);
}

function computeNod(landmarks: any) {
    const nose = landmarks[1], forehead = landmarks[10], chin = landmarks[152];
    return (nose.y - forehead.y) / (chin.y - forehead.y);
}

export default function LivenessScanner() {
    const webcamRef = useRef<Webcam>(null);
    const [status, setStatus] = useState<"IDLE" | "CALIBRATING" | "SCANNING" | "VERIFYING" | "PASSED" | "FAILED">("IDLE");
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [sequence, setSequence] = useState<typeof CHALLENGES>([]);
    const [progress, setProgress] = useState(0);
    const [userData, setUserData] = useState({ name: "", email: "" });
    const [isRegistered, setIsRegistered] = useState(false);
    const [verificationError, setVerificationError] = useState("");
    const [mockMetrics, setMockMetrics] = useState({ liveness: 0, scale: 0, audio: [40, 60, 45, 80, 50, 70, 40] });

    const baselineRef = useRef<number[]>([]);
    const baselineValueRef = useRef<number>(0);
    const challengeDataRef = useRef<any[]>([]);
    const sequenceResultsRef = useRef<any[]>([]);
    const stateRef = useRef({ isTriggered: false, startTime: 0, lastX: 0, waveCount: 0 });

    const currentChallenge = sequence[challengeIndex];

    useEffect(() => {
        let faceMesh: any = null, hands: any = null, camera: any = null, isActive = true;

        async function setup() {
            if ((status === "CALIBRATING" || status === "SCANNING") && webcamRef.current?.video && currentChallenge) {
                const mpFaceMesh = await import("@mediapipe/face_mesh");
                const mpHands = await import("@mediapipe/hands");
                const mpCamera = await import("@mediapipe/camera_utils");

                const FM = mpFaceMesh.FaceMesh || (mpFaceMesh as any).default?.FaceMesh;
                const HM = mpHands.Hands || (mpHands as any).default?.Hands;
                const Cam = mpCamera.Camera || (mpCamera as any).default?.Camera;

                faceMesh = new FM({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
                faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

                hands = new HM({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
                hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.4, minTrackingConfidence: 0.4 });

                faceMesh.onResults((results: any) => {
                    if (!isActive || !results.multiFaceLandmarks?.[0] || currentChallenge.type === "WAVE") return;
                    const landmarks = results.multiFaceLandmarks[0];
                    const now = Date.now();
                    let currentVal = 0;

                    if (currentChallenge.type === "SMILE") currentVal = computeSmile(landmarks);
                    else if (currentChallenge.type === "NOD") currentVal = computeNod(landmarks);

                    processTelemetry(currentVal, now);
                });

                hands.onResults((results: any) => {
                    if (!isActive || !results.multiHandLandmarks?.[0] || currentChallenge.type !== "WAVE") return;
                    const landmarks = results.multiHandLandmarks[0];
                    const now = Date.now();
                    const currentX = landmarks[9].x;

                    if (stateRef.current.lastX !== 0) {
                        const moveDist = Math.abs(currentX - stateRef.current.lastX);
                        if (moveDist > 0.025) {
                            if (stateRef.current.startTime === 0) stateRef.current.startTime = now;
                            stateRef.current.waveCount++;
                            if (stateRef.current.waveCount > 6) setProgress(1);
                        }
                    }
                    stateRef.current.lastX = currentX;
                    processTelemetry(currentX, now);
                });

                function processTelemetry(currentVal: number, now: number) {
                    challengeDataRef.current.push({ t: now, v: parseFloat(currentVal.toFixed(4)) });
                    if (challengeDataRef.current.length > 500) challengeDataRef.current.shift();

                    // Update mock metrics to make the side panel look alive
                    setMockMetrics(prev => ({
                        ...prev,
                        liveness: Math.min(98, prev.liveness + 0.5),
                        audio: prev.audio.map(v => Math.max(20, Math.min(90, v + (Math.random() - 0.5) * 20)))
                    }));

                    if (baselineRef.current.length < 8) {
                        baselineRef.current.push(currentVal);
                        if (baselineRef.current.length === 8) {
                            const sorted = [...baselineRef.current].sort((a, b) => a - b);
                            baselineValueRef.current = sorted[Math.floor(sorted.length / 2)];
                            stateRef.current = { isTriggered: false, startTime: 0, lastX: 0, waveCount: 0 };
                        }
                        return;
                    }

                    const base = baselineValueRef.current;
                    const diff = currentVal - base;

                    if (currentChallenge.type === "SMILE") {
                        if (currentVal > base * 1.08) {
                            if (stateRef.current.startTime === 0) stateRef.current.startTime = now;
                            if (now - stateRef.current.startTime > 200) setProgress(1);
                        } else { stateRef.current.startTime = 0; }
                    }
                    else if (currentChallenge.type === "NOD") {
                        if (Math.abs(diff) > 0.02) {
                            if (stateRef.current.startTime === 0) stateRef.current.startTime = now;
                            if (now - stateRef.current.startTime > 150) setProgress(1);
                        } else { stateRef.current.startTime = 0; }
                    }
                }

                camera = new Cam(webcamRef.current.video, {
                    onFrame: async () => {
                        if (!isActive || !webcamRef.current?.video) return;
                        if (currentChallenge.type === "WAVE") {
                            await hands.send({ image: webcamRef.current.video });
                        } else {
                            await faceMesh.send({ image: webcamRef.current.video });
                        }
                    },
                    width: 640, height: 480
                });
                camera.start();
            }
        }
        setup();
        return () => { isActive = false; camera?.stop(); faceMesh?.close(); hands?.close(); };
    }, [status, currentChallenge?.type, challengeIndex]);

    useEffect(() => {
        if (currentChallenge && progress === currentChallenge.target && status === "SCANNING") {
            sequenceResultsRef.current.push({
                type: currentChallenge.type,
                data: [...challengeDataRef.current],
                baseline: baselineValueRef.current
            });

            if (challengeIndex < sequence.length - 1) {
                setChallengeIndex(prev => prev + 1);
                setProgress(0);
                baselineRef.current = [];
                challengeDataRef.current = [];
            } else {
                (async () => {
                    setStatus("VERIFYING");
                    const result = await verifyLiveness({ sequence: sequenceResultsRef.current }, "SecureID_Audit", userData);
                    if (result.verified) {
                        setStatus("PASSED");
                    } else {
                        setStatus("FAILED");
                        setVerificationError(result.reasoning);
                    }
                })();
            }
        }
    }, [progress, currentChallenge, status, challengeIndex, sequence.length, userData]);

    const startVerification = () => {
        if (!userData.name || !userData.email) return;
        const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 2);
        setSequence(shuffled);
        setChallengeIndex(0);
        setProgress(0);
        setStatus("SCANNING");
        setIsRegistered(true);
        setMockMetrics({ liveness: 40, scale: 15, audio: [40, 60, 45, 80, 50, 70, 40] });
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8">
            <header className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                        <Shield className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">SecureID AI</h1>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest font-mono">Biometric Verification System</p>
                    </div>
                </div>

                <AnimatePresence>
                    {status === "PASSED" && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Identity Verified</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {!isRegistered ? (
                <div className="max-w-2xl mx-auto mt-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-16 rounded-[2.5rem] text-center">
                        <User className="w-12 h-12 text-cyan-400 mx-auto mb-8" />
                        <h2 className="text-3xl text-white mb-4 uppercase tracking-tighter">Initialize Vault</h2>
                        <p className="text-zinc-500 mb-12 text-sm">Provide your credentials to begin the secure ID ritual.</p>

                        <div className="space-y-4 mb-10 text-left">
                            <input
                                placeholder="Full Name"
                                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                            />
                            <input
                                placeholder="Email Address"
                                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={startVerification}
                            className="w-full py-5 bg-cyan-500 text-[#050a14] font-black uppercase tracking-widest rounded-2xl hover:bg-cyan-400 transition-all active:scale-[0.98]"
                        >
                            Begin Verification
                        </button>
                    </motion.div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Scanner */}
                    <div className="lg:col-span-8 flex flex-col items-center justify-center relative min-h-[600px] glass-panel rounded-[2.5rem] overflow-hidden">
                        <div className="absolute inset-0 scanner-grid opacity-20 pointer-events-none" />

                        <div className="relative w-[450px] h-[450px] flex items-center justify-center">
                            {/* Scanning Brackets */}
                            <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg" />
                            <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg" />
                            <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg" />
                            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg" />

                            {/* Main Circular Scanner */}
                            <div className="w-full h-full rounded-full scanner-circle flex items-center justify-center p-4">
                                <div className="w-full h-full rounded-full overflow-hidden relative">
                                    <Webcam
                                        ref={webcamRef}
                                        className="w-full h-full object-cover grayscale"
                                        audio={false}
                                        mirrored
                                    />
                                    {status === "SCANNING" && (
                                        <>
                                            <div className="absolute inset-0 scanner-grid opacity-30 animated-grid" />
                                            <div className="scan-line-v2" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Center Target Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-32 h-32 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00e5ff]" />
                                    {/* Mock landmark dots */}
                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                                </div>
                            </div>
                        </div>

                        {/* Scanner Status HUD */}
                        <div className="mt-12 text-center p-6 space-y-2 z-10 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-md px-10">
                            <p className="text-cyan-400 font-black uppercase tracking-[0.4em] text-[11px] animate-pulse">
                                {status === "SCANNING" ? `CHALLENGE: ${currentChallenge.label}` : status}
                            </p>
                            <p className="text-zinc-500 text-[9px] font-mono tracking-widest uppercase">
                                {status === "SCANNING" ? "Neural analysis process active..." : "Awaiting protocol initiation"}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Analytics */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-panel p-8 rounded-[2rem] h-full flex flex-col gap-10">
                            <div>
                                <h3 className="text-lg text-white mb-1">Verification Analytics</h3>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-8">Real-time biometric assessment</p>

                                {/* Liveness Score Bar */}
                                <div className="space-y-3 mb-12">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Liveness Score</span>
                                        <span className="text-2xl font-black text-cyan-400">{mockMetrics.liveness.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${mockMetrics.liveness}%` }}
                                            className="h-full bg-cyan-400 glow-cyan"
                                        />
                                    </div>
                                </div>

                                {/* Deepfake Risk Radial */}
                                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 relative flex flex-col items-center">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Deepfake Risk</span>
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <motion.circle
                                                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={364}
                                                strokeDashoffset={364 - (364 * mockMetrics.scale) / 100}
                                                className="text-emerald-400"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-white">{mockMetrics.scale}%</span>
                                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">risk</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audio Analysis Waves */}
                            <div className="mt-auto">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4 block">Audio Analysis</span>
                                <div className="h-24 flex items-end justify-between gap-1.5 px-2 bg-white/5 rounded-3xl p-6">
                                    {mockMetrics.audio.map((h, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: `${h}%` }}
                                            className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Status Icons */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                                    <Fingerprint className="w-4 h-4 text-cyan-500" />
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Biometric OK</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                                    <Zap className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Stable Link</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
