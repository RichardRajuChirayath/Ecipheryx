"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert, Search, Cpu, FileText, ImageIcon,
    Video, RefreshCw, ShieldCheck, ChevronLeft,
    CheckCircle, Terminal, Activity, Zap, BarChart3,
    Fingerprint, AlertTriangle, Shield, Globe
} from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/ui/NeuralBackground";

export default function DeepfakeForensics() {
    const [mode, setMode] = useState<"IMAGE" | "AUDIO" | "VIDEO">("IMAGE");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "ANALYZING" | "COMPLETED">("IDLE");
    const [result, setResult] = useState<{ score: number; verdict: string; details: string; flag: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            if (selected.type.startsWith('audio')) {
                setPreview("AUDIO_MODE");
            } else {
                setPreview(URL.createObjectURL(selected));
            }
            setResult(null);
            setStatus("IDLE");
        }
    };

    const extractVideoFrame = (videoFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;

            video.onloadeddata = () => {
                video.currentTime = Math.min(1, video.duration * 0.1);
            };

            video.onseeked = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1024;
                const scale = Math.min(MAX_WIDTH / video.videoWidth, 1);
                canvas.width = video.videoWidth * scale;
                canvas.height = video.videoHeight * scale;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
                URL.revokeObjectURL(video.src);
                resolve(base64);
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                reject(new Error("Playback error"));
            };

            video.src = URL.createObjectURL(videoFile);
        });
    };

    const startForensics = async () => {
        if (!file) return;
        setStatus("PROCESSING");

        const performAudit = async (base64: string, overrideType?: string) => {
            setStatus("ANALYZING");
            try {
                const { verifyMedia } = await import("@/app/actions/forensics");
                const formData = new FormData();
                formData.append("base64", base64);
                formData.append("fileName", file.name);
                formData.append("fileType", overrideType || file.type);
                formData.append("mode", mode);

                const forensicResult = await verifyMedia(formData);

                setResult({
                    score: forensicResult.score,
                    verdict: forensicResult.verdict,
                    details: forensicResult.details,
                    flag: forensicResult.flag
                });
                setStatus("COMPLETED");
            } catch (err) {
                console.error(err);
                setResult({
                    score: 0,
                    verdict: "ANALYSIS_FAULT",
                    details: "The media payload could not be fully analyzed by the neural core.",
                    flag: "SYSTEM_ERR"
                });
                setStatus("COMPLETED");
            }
        };

        try {
            if (mode === "VIDEO") {
                const frameBase64 = await extractVideoFrame(file);
                await performAudit(frameBase64, "image/jpeg");
            } else if (mode === "AUDIO") {
                const audioMeta = JSON.stringify({
                    fileName: file.name,
                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    fileType: file.type,
                    lastModified: new Date(file.lastModified).toISOString(),
                });
                await performAudit(audioMeta, "text/plain");
            } else {
                const reader = new FileReader();
                reader.onload = async () => {
                    const img = new Image();
                    img.onload = async () => {
                        const canvas = document.createElement("canvas");
                        const MAX_WIDTH = 1024;
                        const scale = Math.min(MAX_WIDTH / img.width, 1);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext("2d");
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const optimizedBase64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
                        await performAudit(optimizedBase64);
                    };
                    img.src = reader.result as string;
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            console.error(err);
            setResult({
                score: 0,
                verdict: "INPUT_FAULT",
                details: `Error processing ${mode.toLowerCase()} input.`,
                flag: "FILE_IO_ERR"
            });
            setStatus("COMPLETED");
        }
    };

    return (
        <div className="min-h-screen bg-[#050a14] text-zinc-300 font-sans p-6 md:p-12 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none noise-bg z-0" />
            <NeuralBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-2xl hover:bg-cyan-500/10 transition-all shadow-lg p-3">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white text-outlined-purple leading-none mb-1" style={{ letterSpacing: '-0.1em' }}>ECIPHERYX<span className="logo-dot">.</span></span>
                            <span className="text-[10px] text-cyan-500/60 font-mono tracking-[0.4em] uppercase font-bold">Forensic_Analysis_Lab</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full flex items-center gap-6 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protocol: Active</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">NODE_L4</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Panel: Media Ingestion */}
                    <div className="lg:col-span-8 glass-panel rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 scanner-grid opacity-10 pointer-events-none" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                {["IMAGE", "AUDIO", "VIDEO"].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => { setMode(m as any); setFile(null); setPreview(null); setResult(null); setStatus("IDLE"); }}
                                        className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${mode === m ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300"}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="text-[9px] font-mono text-cyan-500/40 uppercase tracking-widest">
                                Protocol_v4.2.0
                            </div>
                        </div>

                        <div
                            onClick={() => status === "IDLE" && fileInputRef.current?.click()}
                            className={`flex-1 min-h-[450px] rounded-[2rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center overflow-hidden relative ${status !== "IDLE" ? 'opacity-50 border-white/5' : 'cursor-pointer border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02]'}`}
                        >
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/30 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/30 rounded-br-lg" />

                            {preview ? (
                                <div className="w-full h-full relative group">
                                    {mode === "VIDEO" ? (
                                        <video src={preview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                    ) : mode === "AUDIO" ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0c1425] relative">
                                            <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20">
                                                <Activity className="w-10 h-10 text-cyan-400 animate-pulse" />
                                            </div>
                                            <span className="text-cyan-500/60 font-mono uppercase tracking-widest text-[10px]">{file?.name}</span>
                                        </div>
                                    ) : (
                                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <span className="px-8 py-3 bg-cyan-500 text-[#050a14] font-black uppercase tracking-widest text-[10px] rounded-xl">Replace Signal</span>
                                    </div>
                                    <div className="scan-line-v2 opacity-40" />
                                </div>
                            ) : (
                                <div className="text-center p-12 space-y-4 opacity-40">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-zinc-500 mx-auto border border-white/10">
                                        <UploadIcon mode={mode} />
                                    </div>
                                    <p className="text-white font-bold uppercase tracking-[0.3em] text-[11px]">Inject Target Stream</p>
                                    <p className="text-zinc-600 text-[9px] font-mono tracking-widest uppercase">Select media file for biometric audit</p>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept={mode === "IMAGE" ? "image/*" : mode === "AUDIO" ? "audio/*" : "video/*"} onChange={handleFile} />
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); startForensics(); }}
                            disabled={!file || status !== "IDLE"}
                            className={`mt-8 py-5 font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 relative overflow-hidden shadow-2xl ${!file || status !== "IDLE" ? 'bg-zinc-900/50 text-zinc-700 border border-white/5' : 'bg-cyan-500 text-[#050a14] hover:bg-cyan-400 active:scale-[0.98]'}`}
                        >
                            {status === "IDLE" ? (
                                <>Run Forensic Audit <ShieldCheck className="w-4 h-4" /></>
                            ) : (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> {status === "PROCESSING" ? "Ingesting Payload..." : "Neural Scanning..."}</>
                            )}
                        </button>
                    </div>

                    {/* Right Panel: Analytics */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="glass-panel p-8 rounded-[2.5rem] flex-1 flex flex-col gap-10">
                            <div>
                                <h3 className="text-lg text-white mb-1">Audit Analytics</h3>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-8">Deepfake signature assessment</p>

                                <AnimatePresence mode="wait">
                                    {status === "IDLE" && !result ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                                            <Terminal className="w-12 h-12 text-zinc-700 mb-6" />
                                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase leading-relaxed">
                                                System standby. Inject media payload to initiate forensic kernel.
                                            </p>
                                        </motion.div>
                                    ) : (status === "PROCESSING" || status === "ANALYZING") ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="loading" className="space-y-12 py-10">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                                    <span>Neural Scanning</span>
                                                    <span className="animate-pulse">Active</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        animate={{ width: ["0%", "40%", "70%", "90%"] }}
                                                        transition={{ duration: 5, repeat: Infinity }}
                                                        className="h-full bg-cyan-400 shadow-[0_0_15px_#00e5ff]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin" />
                                                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Processing_Neural_Clusters</span>
                                            </div>
                                        </motion.div>
                                    ) : result ? (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key="result" className="space-y-8">
                                            <div className={`p-6 rounded-3xl border ${result.score > 50 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'} text-center`}>
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2">{result.verdict}</p>
                                                <p className="text-5xl font-black italic">{result.score}%</p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest mt-2">{result.score > 50 ? "Manipulation Detected" : "Low Risk Signature"}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Audit Report</span>
                                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">{result.details}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                    <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Status</p>
                                                    <p className="text-[10px] text-white font-mono uppercase">Audited_L4</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-right">
                                                    <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Flag</p>
                                                    <p className="text-[10px] text-cyan-500 font-mono uppercase">{result.flag}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => { setStatus("IDLE"); setFile(null); setPreview(null); setResult(null); }}
                                                className="w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                                            >
                                                Reset Forensic Kernel
                                            </button>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>

                            {/* Signal Markers */}
                            <div className="mt-auto space-y-4 pt-10 border-t border-white/5 opacity-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">Pixel_Entropy_Scan</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#8b5cf6]" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">GAN_Artifact_Audit</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">Temporal_Coherence_Sync</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadIcon({ mode }: { mode: string }) {
    if (mode === "IMAGE") return <ImageIcon className="w-6 h-6" />;
    if (mode === "AUDIO") return <Activity className="w-6 h-6" />;
    return <Video className="w-6 h-6" />;
}
