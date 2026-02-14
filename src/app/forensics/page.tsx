"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ShieldAlert, Search, Cpu, FileText, ImageIcon, Video, RefreshCw, AlertTriangle, ShieldCheck, ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

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

    const startForensics = async () => {
        if (!file) return;
        setStatus("PROCESSING");

        const reader = new FileReader();
        reader.onload = async () => {
            let optimizedBase64 = "";

            if (mode === "IMAGE") {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1024;
                    const scale = Math.min(MAX_WIDTH / img.width, 1);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    optimizedBase64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
                    await performAudit(optimizedBase64);
                };
                img.src = reader.result as string;
            } else {
                optimizedBase64 = (reader.result as string).split(",")[1];
                await performAudit(optimizedBase64);
            }
        };

        const performAudit = async (base64: string) => {
            setStatus("ANALYZING");
            try {
                const { verifyMedia } = await import("@/app/actions/forensics");
                const formData = new FormData();
                formData.append("base64", base64);
                formData.append("fileName", file.name);
                formData.append("fileType", file.type);
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
                    verdict: "AUDIT_FAILED",
                    details: "The media payload could not be processed by the neural kernel.",
                    flag: "GATEWAY_TIMEOUT"
                });
                setStatus("COMPLETED");
            }
        };

        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-6 md:p-10 relative overflow-hidden pixel-grid">
            {/* Background Layers */}
            <div className="fixed inset-0 pointer-events-none noise-bg" />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-red-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/50 transition-all text-white group relative">
                            <div className="absolute inset-0 bg-cyan-500/10 scale-0 group-hover:scale-100 transition-transform rounded-2xl" />
                            <ChevronLeft className="w-5 h-5 relative z-10" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-px w-8 bg-cyan-500" />
                                <span className="text-[10px] text-cyan-500 font-mono tracking-[0.5em] uppercase">Security Level 4</span>
                            </div>
                            <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic glitch-cyan">Forensic Lab</h1>
                            <div className="mt-2 flex items-center gap-4">
                                <p className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase">Neural-Link: ESTABLISHED</p>
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl backdrop-blur-xl hud-corner hud-corner-tl hud-corner-br shadow-lg shadow-red-500/5">
                            <ShieldAlert className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Biometric Breach Monitoring Active</span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest bg-black/40 px-3 py-1 border border-white/5 rounded-md">
                            Kernel: Llama 4 Scout // MoE-17B
                        </div>
                    </div>
                </header>

                {/* Mode Switcher HUD */}
                <div className="flex flex-wrap gap-4 mb-16 relative">
                    <div className="absolute -inset-4 border border-white/[0.03] rounded-[3rem] pointer-events-none" />
                    {["IMAGE", "AUDIO", "VIDEO"].map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m as any); setFile(null); setPreview(null); setResult(null); setStatus("IDLE"); }}
                            className={`relative flex-1 py-5 px-8 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-500 hud-border ${mode === m ? "bg-cyan-500 text-black shadow-2xl shadow-cyan-500/40 translate-y-[-4px]" : "bg-white/[0.02] text-zinc-600 hover:text-white hover:bg-white/5"}`}
                        >
                            {m === "IMAGE" && <ImageIcon className="w-4 h-4" />}
                            {m === "AUDIO" && <Search className="w-4 h-4" />}
                            {m === "VIDEO" && <Video className="w-4 h-4" />}
                            {m}
                            {mode === m && <motion.div layoutId="mode-dot" className="absolute -bottom-2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]" />}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section className="space-y-10">
                        {/* Interactive Upload HUD */}
                        <div className="glass-card rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl shadow-black/80">
                            <div className="absolute top-0 right-0 p-8 text-zinc-800 font-mono text-[80px] leading-none opacity-10 pointer-events-none select-none font-black italic">
                                {mode.substring(0, 3)}
                            </div>

                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-4 relative z-10 italic">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <Upload className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    Neural Ingestion
                                </h2>
                                <div className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest px-3 py-1 border border-cyan-500/20 rounded-full">
                                    Queue: Ready
                                </div>
                            </div>

                            <div
                                onClick={() => status === "IDLE" && fileInputRef.current?.click()}
                                className={`relative z-10 aspect-square rounded-[2.5rem] border transition-all duration-700 flex flex-col items-center justify-center overflow-hidden ${status !== "IDLE" ? 'cursor-wait border-white/5 opacity-50' : 'cursor-pointer'} ${preview ? 'border-cyan-500/30' : 'border-white/10 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02]'}`}
                            >
                                {preview ? (
                                    <div className="w-full h-full relative">
                                        <div className="absolute inset-0 scanline z-20" />
                                        {mode === "VIDEO" ? (
                                            <video src={preview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                        ) : mode === "AUDIO" ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] relative">
                                                <div className="absolute inset-0 opacity-20 pixel-grid" />
                                                <div className="w-48 h-48 bg-cyan-500/5 rounded-full flex items-center justify-center mb-8 relative border border-cyan-500/10">
                                                    <div className="absolute inset-0 bg-cyan-400/10 rounded-full animate-ping" />
                                                    <Search className="w-20 h-20 text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                                                </div>
                                                <span className="text-cyan-400 font-mono uppercase tracking-[0.4em] text-xs font-black">{file?.name.substring(0, 20)}...</span>
                                            </div>
                                        ) : (
                                            <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                        )}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-500 z-30">
                                            <RefreshCw className="w-12 h-12 text-white mb-4 animate-[spin_10s_linear_infinite]" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic bg-white/10 px-6 py-2 rounded-full border border-white/20">Flush Data Buffer</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-12 group/upload">
                                        <div className="w-24 h-24 bg-white/[0.03] rounded-3xl flex items-center justify-center text-zinc-700 mx-auto mb-8 border border-white/5 group-hover/upload:border-cyan-500/40 group-hover/upload:text-cyan-500 transition-all duration-500 rotate-45 group-hover/upload:rotate-0">
                                            <div className="-rotate-45 group-hover/upload:rotate-0 transition-transform duration-500">
                                                {mode === "IMAGE" ? <ImageIcon className="w-10 h-10" /> : mode === "AUDIO" ? <Search className="w-10 h-10" /> : <Video className="w-10 h-10" />}
                                            </div>
                                        </div>
                                        <p className="text-white font-black uppercase tracking-[0.4em] text-xs mb-3 italic">Inject Biometric Stream</p>
                                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] font-mono opacity-60">
                                            DRAG & DROP {mode} // MAX 50MB
                                        </p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept={mode === "IMAGE" ? "image/*" : mode === "AUDIO" ? "audio/*" : "video/*"} onChange={handleFile} />
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); startForensics(); }}
                                disabled={!file || status !== "IDLE"}
                                className={`w-full mt-10 py-6 font-black uppercase tracking-[0.4em] text-xs rounded-2xl transition-all duration-700 active:scale-95 flex items-center justify-center gap-4 relative z-20 shadow-2xl overflow-hidden ${!file || status !== "IDLE" ? 'bg-zinc-900 text-zinc-600' : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/30'}`}
                            >
                                <div className="absolute inset-0 bg-white/20 -translate-x-full hover:translate-x-full transition-transform duration-1000 skew-x-[-20deg]" />
                                {status === "IDLE" ? (
                                    <span className="flex items-center gap-4 italic">
                                        Launch {mode} Protocol <Search className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-4 italic animate-pulse">
                                        Neural Kernel Operating... <RefreshCw className="w-4 h-4 animate-spin" />
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <AuditStep active={status === "PROCESSING"} icon={<FileText className="w-4 h-4" />} label="Spectral Mapping" progress={status === "PROCESSING" ? "SCANNED" : "WAITING"} />
                            <AuditStep active={status === "ANALYZING"} icon={<Cpu className="w-4 h-4" />} label="Forensic Audit" progress={status === "ANALYZING" ? "COMPUTING" : "WAITING"} />
                        </div>
                    </section>

                    <section>
                        <AnimatePresence mode="wait">
                            {status === "IDLE" && !result && (
                                <motion.div key="idle-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[3rem] bg-black/40 backdrop-blur-3xl relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-zinc-950 rounded-2xl border border-white/5">
                                        <ShieldCheck className="w-10 h-10 text-zinc-800" />
                                    </div>
                                    <h3 className="text-zinc-500 font-black uppercase tracking-[0.5em] text-[11px] mb-4 italic">Waiting for Telemetry Input</h3>
                                    <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-[0.2em] max-w-sm leading-loose">The forensic gateway is clear. Connect a biometric data stream to begin neural-pixel authenticity verification.</p>
                                    <div className="mt-12 flex items-center gap-2 opacity-20">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-6 h-1 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                                    </div>
                                </motion.div>
                            )}

                            {(status === "PROCESSING" || status === "ANALYZING") && (
                                <motion.div key="loading-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center space-y-12 glass-card rounded-[3rem] border border-cyan-500/20 p-12 relative overflow-hidden">
                                    <div className="absolute inset-0 scanline opacity-50" />
                                    <div className="relative w-64 h-64">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="1" fill="transparent" className="text-white/5" />
                                            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={754} strokeDashoffset={200} className="text-cyan-500 animate-[spin_4s_linear_infinite]" strokeLinecap="round" />
                                            <circle cx="128" cy="128" r="100" stroke="currentColor" strokeWidth="1" fill="transparent" strokeDasharray="4 8" className="text-zinc-700" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-2">Audit Phase</p>
                                                <p className="text-6xl font-black text-white italic tracking-tighter uppercase glitch-cyan">L4</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-black uppercase tracking-tighter text-3xl italic mb-4">Neural Scanning</h3>
                                        <div className="inline-flex items-center gap-3 bg-cyan-500/10 px-6 py-2 rounded-full border border-cyan-500/20 animate-pulse">
                                            <Cpu className="w-4 h-4 text-cyan-400" />
                                            <span className="text-cyan-400 text-[11px] font-black uppercase tracking-[0.4em]">Running Deep-Pixel Audit</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {status === "COMPLETED" && result && (
                                <motion.div key="result-state" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                    <div className={`glass-card rounded-[3rem] p-12 border shadow-2xl relative overflow-hidden hud-corner hud-corner-tl hud-corner-br ${result.score > 50 ? 'border-red-500/40 shadow-red-500/10' : 'border-emerald-500/40 shadow-emerald-500/10'}`}>
                                        <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 ${result.score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />

                                        <div className="flex items-center justify-between mb-12 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${result.score > 50 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Forensic Integrity Report</h3>
                                            </div>
                                            <div className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg ${result.score > 50 ? 'bg-red-600 text-white shadow-red-600/20' : 'bg-emerald-600 text-white shadow-emerald-600/20'}`}>
                                                VERDICT: {result.verdict}
                                            </div>
                                        </div>

                                        <div className="mb-10 relative z-10 text-center py-16 bg-[#030303] rounded-[2.5rem] border border-white/5 relative group">
                                            <div className="absolute inset-4 border border-white/[0.02] rounded-[2rem] pointer-events-none" />
                                            <p className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.5em] mb-6 italic">Deepfake Signal Probability</p>
                                            <div className={`text-8xl font-black italic tracking-tighter text-glow-${result.score > 50 ? 'red' : 'cyan'} ${result.score > 50 ? 'text-red-500' : 'text-cyan-500'}`}>
                                                {result.score}%
                                            </div>
                                            <div className="mt-8 flex justify-center gap-1">
                                                {Array.from({ length: 20 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1 h-3 rounded-full transition-all duration-1000 ${i < (result.score / 5) ? (result.score > 50 ? 'bg-red-500' : 'bg-cyan-500') : 'bg-zinc-800'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-8 relative z-10">
                                            <div className="relative">
                                                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                    <Search className="w-3 h-3 text-cyan-500" /> Neural Analysis Output
                                                </p>
                                                <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 relative group overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30 group-hover:bg-cyan-500" />
                                                    <p className="text-[15px] text-zinc-200 leading-relaxed font-medium italic">
                                                        "{result.details}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 flex items-center gap-4 text-[10px] font-mono text-cyan-400/90 uppercase tracking-[0.2em] bg-cyan-500/5 p-5 rounded-2xl border border-cyan-500/10">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <div>
                                                        <p className="text-zinc-600 text-[8px] mb-1 italic">Security Signature</p>
                                                        {result.flag}
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex items-center gap-4 text-[10px] font-mono text-emerald-400/90 uppercase tracking-[0.2em] bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <div>
                                                        <p className="text-zinc-600 text-[8px] mb-1 italic">Audit Node</p>
                                                        VERIFIED_L4_KERNEL
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setStatus("IDLE"); setFile(null); setPreview(null); setResult(null); }}
                                        className="w-full py-6 bg-white/[0.02] hover:bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.4em] text-[11px] rounded-3xl transition-all active:scale-95 flex items-center justify-center gap-5 italic group shadow-2xl"
                                    >
                                        Initiate New Forensic Ritual <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </div>
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(9, 9, 11, 0.6);
                    backdrop-filter: blur(40px);
                }
            `}</style>
        </div>
    );
}

function AuditStep({ active, icon, label, progress = "WAITING" }: { active: boolean; icon: any; label: string; progress?: string }) {
    return (
        <div className={`p-6 rounded-2xl border transition-all duration-700 flex flex-col gap-4 relative overflow-hidden hud-corner hud-corner-tl hud-corner-br ${active ? "bg-cyan-500/[0.08] border-cyan-500/40 text-cyan-400 ring-4 ring-cyan-500/10" : "bg-black/60 border-white/5 text-zinc-700"}`}>
            {active && <div className="absolute inset-0 scanline opacity-30" />}
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${active ? "bg-cyan-500/20 shadow-lg shadow-cyan-500/20" : "bg-white/5"}`}>
                    {icon}
                </div>
                <span className={`text-[8px] font-mono tracking-widest px-2 py-0.5 rounded border transition-colors ${active ? "border-cyan-500 text-cyan-500 animate-pulse" : "border-zinc-800 text-zinc-800"}`}>
                    {progress}
                </span>
            </div>
            <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-1 ${active ? "text-cyan-400" : "text-zinc-700"}`}>{label}</span>
                <div className={`h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden`}>
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: active ? "0%" : "-100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full w-full bg-cyan-500/40"
                    />
                </div>
            </div>
        </div>
    );
}
