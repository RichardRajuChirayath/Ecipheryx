# The Vault: AI Skills & Logic Patterns

This document defines the specialized logic used in "The Vault" for Multi-Factor Proof of Life and Anti-Deepfake verification.

## 1. Liveness Detection Patterns (MediaPipe)
When a visual challenge is issued, we capture a sequence of facial landmarks locally in the browser.

### Gesture Verification Matrix:
- **Blink**: Vertical distance between `top_eyelid` and `bottom_eyelid` < 0.02.
- **Smile**: `mouth_width` increase > 15% from neutral state.
- **Nod**: Y-axis landmarks for `nose_tip` show a oscillating pattern with a range > 20px.
- **Head Pivot**: Horizontal distance between `nose_tip` and `ear_landmark` drastically shifts.

## 2. Groq Verification Logic (Llama 3.3 70B)
We use Groq to analyze Landmark Data Log (LDL) rather than video frames to minimize latency and ensure privacy.

### The Verification Prompt:
> "Analyze this sequence of facial landmark deltas collected over 5 seconds. The challenge given was 'BLINK TWICE'. Landmarks show Eye-Closure peaks at 1.2s and 2.4s. Symmetry is observed. No sudden coordinate jumps (indicative of frame-splicing). Is this a valid human response?"

## 3. Identity Confirmation Ritual (Brevo)
Upon successful verification, a security notification is sent via Brevo SMTP.
- **Sender**: `richurichard06@gmail.com`
- **Protocol**: Transactional Email with a simulated Access Token.

## 4. The "High-Vault" Design System
- **Colors**: Deep Matrix (#0A0F14), Cyber Cyan (#00F0FF), Crimson Alert (#FF2A6D).
- **Glassmorphism**: 10% opacity white overlays with 15px backdrop-blur.
- **Animations**: Framer Motion `staggerChildren` for the scanning sequence and `animatePresence` for transition between Ritual -> Vault.

## 5. Persistence Layer (Neon + Prisma)
- **Schema**: `User`, `VerificationSession`, `ProofOfLifeToken`.
- **Note**: Ensure `DATABASE_URL` in `.env` is updated with real credentials replacing `REAL_PASSWORD` and `xxxx`.
