"use client";

import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, RefreshCw, Hand, ShieldCheck, Smile, MoveDown, ChevronRight, User, Mail, Scan, Shield, Activity, Camera } from "lucide-react";
import { verifyLiveness } from "@/app/actions/verify";
import { sendVerificationSuccessEmail } from "@/app/actions/email";
import Link from "next/link";

type ChallengeType = "WAVE" | "SMILE" | "NOD";

const CHALLENGES: { type: ChallengeType; label: string; target: number; icon: any }[] = [
    { type: "WAVE", label: "Wave Your Hand", target: 1, icon: <Hand className="w-6 h-6" /> },
    { type: "SMILE", label: "Broad Smile", target: 1, icon: <Smile className="w-6 h-6" /> },
    { type: "NOD", label: "Vertical Nod", target: 1, icon: <MoveDown className="w-6 h-6" /> },
];

// Helper: Calculate Smile Ratio (Mouth Width / Eye Distance)
function computeSmile(landmarks: any) {
    const dist = (a: any, b: any) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const leftCorner = landmarks[61], rightCorner = landmarks[291];
    const leftEye = landmarks[33], rightEye = landmarks[263];
    const mouthWidth = dist(leftCorner, rightCorner);
    const eyeDist = dist(leftEye, rightEye);
    return mouthWidth / (eyeDist || 1);
}

// Helper: Calculate Head Pitch Ratio
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
    const [calibPercent, setCalibPercent] = useState(0);

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

                // Initialize FaceMesh for Smile/Nod
                faceMesh = new FM({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
                faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

                // Initialize Hands for Waving (Lowered confidence for motion blur/low light)
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
                        if (moveDist > 0.025) { // More sensitive horizontal movement
                            if (stateRef.current.startTime === 0) stateRef.current.startTime = now;
                            stateRef.current.waveCount++;
                            if (stateRef.current.waveCount > 6) setProgress(1); // Faster detection (6 oscillations)
                        }
                    }
                    stateRef.current.lastX = currentX;
                    processTelemetry(currentX, now);
                });

                function processTelemetry(currentVal: number, now: number) {
                    challengeDataRef.current.push({ t: now, v: parseFloat(currentVal.toFixed(4)) });
                    if (challengeDataRef.current.length > 500) challengeDataRef.current.shift();

                    // Ultra-fast Silent Calibration: First 8 frames
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
                        if (currentVal > base * 1.08) { // 8% increase instead of 12%
                            if (stateRef.current.startTime === 0) stateRef.current.startTime = now;
                            if (now - stateRef.current.startTime > 200) setProgress(1);
                        } else { stateRef.current.startTime = 0; }
                    }
                    else if (currentChallenge.type === "NOD") {
                        if (Math.abs(diff) > 0.02) { // 2% pitch shift instead of 3.5%
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
                setCalibPercent(0);
                baselineRef.current = [];
                challengeDataRef.current = [];
            } else {
                (async () => {
                    setStatus("VERIFYING");
                    const result = await verifyLiveness({ sequence: sequenceResultsRef.current }, "Sequential MFA", userData);
                    if (result.verified) {
                        setStatus("PASSED");
                        await sendVerificationSuccessEmail(userData.email, userData.name);
                    } else {
                        setStatus("FAILED");
                        setVerificationError(result.reasoning);
                    }
                })();
            }
        }
    }, [progress, currentChallenge, status, challengeIndex, sequence.length, userData]);

    const startRitual = () => {
        if (!userData.name || !userData.email) return;
        const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 2);
        setSequence(shuffled);
        setChallengeIndex(0);
        setProgress(0);
        setCalibPercent(0);
        baselineRef.current = [];
        challengeDataRef.current = [];
        sequenceResultsRef.current = [];
        setStatus("SCANNING");
        setIsRegistered(true);
    };

    const reset = () => {
        setStatus("IDLE");
        setChallengeIndex(0);
        setProgress(0);
        setCalibPercent(0);
        baselineRef.current = [];
        challengeDataRef.current = [];
        sequenceResultsRef.current = [];
    };

    return (
        <section className="max-w-4xl mx-auto py-12 px-6">
            {!isRegistered ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[2.5rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden bg-zinc-900/40 backdrop-blur-3xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 max-w-lg mx-auto text-center">
                        <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 mx-auto mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                            <Shield className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Register Identity</h2>
                        <p className="text-zinc-500 text-sm font-medium tracking-wide mb-10 leading-relaxed uppercase">Initiate the biometric enrollment protocol to link your physical presence to the blockchain.</p>

                        <div className="space-y-4 mb-10">
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-cyan-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="FULL LEGAL NAME"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-xs font-black tracking-widest focus:border-cyan-500/50 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-zinc-700"
                                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-cyan-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="ENCRYPTION EMAIL GATEWAY"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white text-xs font-black tracking-widest focus:border-cyan-500/50 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-zinc-700"
                                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={startRitual}
                            disabled={!userData.name || !userData.email}
                            className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            Begin Liveness Ritual <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
                                <Scan className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Verification Current State</h3>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest">SID_{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Status</p>
                                <p className={`text-xs font-black uppercase tracking-tighter ${status === "PASSED" ? "text-emerald-400" : status === "FAILED" ? "text-red-400" : "text-cyan-400 animate-pulse"}`}>
                                    {status === "CALIBRATING" ? "SCANNING" : status}
                                </p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${status === "PASSED" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : status === "FAILED" ? "bg-red-500" : "bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"}`} />
                        </div>
                    </div>

                    <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-zinc-950 group">
                        <Webcam
                            ref={webcamRef}
                            className={`w-full h-full object-cover transition-all duration-1000 ${status === "VERIFYING" || status === "PASSED" || status === "FAILED" ? "opacity-20 grayscale" : "brightness-[1.10] contrast-[1.05]"}`}
                            audio={false}
                            mirrored
                        />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-30">
                            <AnimatePresence mode="wait">

                                {status === "SCANNING" && (
                                    <motion.div key="task" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full max-w-sm">
                                        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                                    {currentChallenge.icon}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Challenge {challengeIndex + 1}/{sequence.length}</p>
                                                    <p className="text-xl font-black text-white italic uppercase">{currentChallenge.label}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-zinc-500">Motion Detection</span>
                                                    <span className="text-cyan-400">{progress ? "LOCKED" : "WAITING"}</span>
                                                </div>
                                                <div className="h-4 bg-zinc-900 rounded-full border border-white/5 p-1">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: progress ? "100%" : "0%" }} className="h-full bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {status === "VERIFYING" && (
                                    <motion.div key="verify" className="text-center">
                                        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                            <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
                                            <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
                                        </div>
                                        <h4 className="text-white font-black text-2xl uppercase tracking-tighter italic">Analyzing Motion</h4>
                                        <p className="text-cyan-500/70 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Llama 3.3 Validating Authenticity</p>
                                    </motion.div>
                                )}

                                {status === "PASSED" && (
                                    <motion.div key="pass" className="text-center max-w-sm">
                                        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                            <CheckCircle className="w-12 h-12" />
                                        </div>
                                        <h4 className="text-white font-black text-3xl uppercase tracking-tighter italic mb-4">Identity Unlocked</h4>
                                        <p className="text-emerald-500/70 text-[10px] font-black uppercase tracking-[0.3em] mb-10 leading-loose">Blockchain Token Securely Minted.</p>
                                        <Link href="/vault" className="inline-flex items-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group">
                                            Enter Ecipheryx <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </Link>
                                    </motion.div>
                                )}

                                {status === "FAILED" && (
                                    <motion.div key="fail" className="text-center max-w-sm px-6">
                                        <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                                            <AlertCircle className="w-12 h-12" />
                                        </div>
                                        <h4 className="text-white font-black text-3xl uppercase tracking-tighter italic mb-3">Audit Rejected</h4>
                                        <p className="text-red-400/90 text-[10px] font-black uppercase tracking-[0.3em] font-mono mb-8 border border-red-500/20 bg-red-500/5 p-4 rounded-xl leading-relaxed">
                                            {verificationError || "SPOOF_SIGNATURE_DETECTED"}
                                        </p>
                                        <button onClick={reset} className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3">
                                            Try Again <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InstructionCard active={status === "SCANNING" && sequence[challengeIndex]?.type === "WAVE"} step="01" label="Hand Wave" sub="Spatial Motion" />
                        <InstructionCard active={status === "SCANNING" && sequence[challengeIndex]?.type === "SMILE"} step="02" label="Smile" sub="Mouth Ratio" />
                        <InstructionCard active={status === "SCANNING" && sequence[challengeIndex]?.type === "NOD"} step="03" label="Nod" sub="Spatial Pitch" />
                    </div>
                </div>
            )}
        </section>
    );
}

function InstructionCard({ active, step, label, sub }: { active: boolean, step: string, label: string, sub: string }) {
    return (
        <div className={`p-6 rounded-3xl border transition-all duration-500 ${active ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]" : "bg-black/40 border-white/5 opacity-40 grayscale"}`}>
            <p className="text-[10px] font-mono text-cyan-400/50 mb-1 leading-none">{step}</p>
            <p className="text-sm font-black text-white uppercase tracking-tighter leading-tight italic">{label}</p>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mt-1">{sub}</p>
        </div>
    );
}
