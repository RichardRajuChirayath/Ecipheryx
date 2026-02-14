"use client";

import { motion } from "framer-motion";
import { Shield, Fingerprint, Zap, MousePointer2 } from "lucide-react";

export default function EcipheryxHero() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 80, damping: 15 }
        },
    };

    const titleChars = "ECIPHERYX".split("");

    return (
        <div className="relative pt-48 pb-32 flex flex-col items-center justify-center overflow-hidden min-h-[85vh]">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-20 text-center px-6 max-w-7xl w-full"
            >
                {/* Advanced Status Badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-12 backdrop-blur-3xl shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#00e5ff] animate-pulse" />
                    <span className="text-[10px] text-zinc-400 font-mono tracking-[0.4em] uppercase font-bold">
                        SYSTEM_STATUS: SECURED
                    </span>
                    <div className="w-px h-3 bg-white/10 mx-2" />
                    <span className="text-[10px] text-purple-500/80 font-mono uppercase tracking-widest font-black">
                        PRO_NODE_v4.2
                    </span>
                </motion.div>

                <motion.div variants={itemVariants} className="relative mb-12 flex flex-col items-center">
                    {/* Official Cyber-Chameleon Logo centerpiece */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative w-56 h-56 mb-12 group"
                    >
                        <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-1000" />
                        <img
                            src="/logo.png"
                            alt="Ecipheryx Chameleon"
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,229,255,0.4)] group-hover:scale-105 transition-all duration-500"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{
                            delay: 0.5,
                            duration: 1.2,
                            ease: [0.23, 1, 0.32, 1]
                        }}
                        className="text-8xl md:text-[13rem] font-black leading-none select-none text-outlined-purple text-center"
                    >
                        ECIPHERYX<span className="logo-dot">.</span>
                    </motion.h1>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        className="absolute top-48 left-1/2 -translate-x-1/2 text-[15rem] font-black text-purple-500 blur-[120px] pointer-events-none"
                    >
                        AI
                    </motion.span>
                </motion.div>

                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-zinc-500 font-medium max-w-3xl mx-auto mb-20 leading-relaxed tracking-wide"
                >
                    The next-generation <span className="text-white font-black px-2 py-0.5 bg-white/5 rounded border border-white/10">Biometric Verification Layer</span>.
                    Real-time liveness assessment, deepfake detection, and distributed identity rituals.
                </motion.p>

                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap justify-center gap-6"
                >
                    <div className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-cyan-500/30 transition-all cursor-default text-zinc-400 hover:text-cyan-400">
                        <Fingerprint className="w-5 h-5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Biometric Integrity</span>
                    </div>
                    <div className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-purple-500/30 transition-all cursor-default text-zinc-400 hover:text-purple-400">
                        <Zap className="w-5 h-5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Neural Analysis</span>
                    </div>
                    <div className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:border-emerald-500/30 transition-all cursor-default text-zinc-400 hover:text-emerald-400">
                        <Shield className="w-5 h-5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">On-Chain Proof</span>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-32 flex flex-col items-center gap-4 opacity-20 group cursor-pointer hover:opacity-100 transition-all">
                    <p className="text-[10px] font-mono tracking-[0.8em] uppercase text-zinc-500 font-bold">Initiate Protocol</p>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <MousePointer2 className="w-4 h-4 text-zinc-400" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
