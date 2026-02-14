# ECIPHERYX 🛡️
### The Zero-Knowledge Anti-Deepfake Identity Protocol

**Ecipheryx** is a state-of-the-art security platform designed to protect digital identity in an era of synthetic media and deepfake Coercion. By combining **Zero-Knowledge Biometrics**, **Multi-Modal Forensics**, and **Soulbound Token Attestations**, Ecipheryx creates a "Biological Firewall" for high-value digital assets.

---

## 🚀 Key Features

### 1. Project Prism (ZK-Biometrics) 🧬
The crown jewel of Ecipheryx. It allows users to prove their identity without transmitting a single pixel of biometric data.
- **Client-Side Landmark Extraction**: 468 facial points processed locally via MediaPipe.
- **SHA-256 Commitment**: Biometric data is converted into an irreversible cryptographic hash.
- **Zero-Knowledge Proofs**: Server verifies the mathematical "proof of knowledge" without ever seeing the user's face.
- **Spectral Analysis**: Detects replay attacks by analyzing frequency-domain biometric signatures.

### 2. Neural Forensic Lab 🔍
A multi-modal audit suite to detect AI-generated manipulation.
- **Image/Audio/Video Forensics**: Hunts for frame-splicing, biometric drift, and synthetic artifacts.
- **MoE Reasoning**: Uses Mixture-of-Experts AI models to provide technical reasoning for every "SPOOF" or "TRUST" verdict.

### 3. Liveness Rituals (MFA) 🕯️
Sequential biometric challenges to ensure "Proof of Life" in real-time.
- **Dynamic Challenges**: Wave, Smile, Nod sequences with real-time telemetry audit.
- **RPPG Detection**: (Vascular Pulse) Microscopic color change analysis to detect a living heartbeat.

### 4. Soulbound Proof-of-Life 🔗
Tokenized identity on the **Solana Blockchain**.
- **SBT Minting**: Successful rituals mint a non-transferable "Proof of Life" token.
- **Sanctuary Dashboard**: A high-fidelity HUD for managing decentralized identity assets.

---

## 🛠️ Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Custom HUD Utilities
- **Animations**: Framer Motion
- **AI/ML**: MediaPipe (FaceMesh/Hands) + Groq SDK (Llama-3.3-70B)
- **Blockchain**: Solana Web3.js + SPL Token Protocol
- **Database**: Prisma + PostgreSQL
- **Zero-Knowledge**: Custom ZK-Proof Protocol (ECC/SHA-256 Commitments)

---

## 🔒 Security First

- **Zero Biometric Retention**: Raw landmarks and images are destroyed instantly after local processing.
- **Privacy by Design**: The server never sees the user's face — only cryptographic attestations.
- **Encrypted Transmission**: All communication is secured via high-entropy encryption channels.

---

## 🚦 Getting Started

1. **Environment Setup**:
   Copy `.env.example` to `.env` and configure your `GROQ_API_KEY` and `SOLANA_PRIVATE_KEY`.

2. **Run Development Server**:
   ```bash
   npm install
   npx prisma generate
   npm run dev
   ```

3. **Access Ecipheryx**:
   Navigate to `http://localhost:3000` to initiate the protocol.

---

*Built for the future of digital sovereignty.*

*“Zero-Knowledge. Infinite Assurance.”*
