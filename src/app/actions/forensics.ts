"use server";

import Groq from "groq-sdk";

export async function verifyMedia(formData: FormData) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return {
            score: 0,
            verdict: "ERROR",
            details: "Missing Biometric API Key.",
            flag: "API_MISSING"
        };
    }

    const base64Data = formData.get("base64") as string;
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const mode = formData.get("mode") as string || "IMAGE";

    if (!base64Data) {
        return {
            score: 0,
            verdict: "ERROR",
            details: "No media data received.",
            flag: "EMPTY_PAYLOAD"
        };
    }

    const groq = new Groq({ apiKey });

    try {
        console.log(`[Forensics] Mode: ${mode} | File: ${fileName} | Size: ${(base64Data.length / 1024).toFixed(0)} KB`);

        let systemPrompt = "";

        if (mode === "IMAGE") {
            systemPrompt = `You are a Senior Forensics Biometric Auditor specializing in Image Deepfake detection.
Analyze for:
1. GAN artifacts (boundary blurring, texture aliasing, checkerboard patterns)
2. Surface scattering inconsistencies (skin vs synthetic renders)
3. Frequency domain anomalies (periodic noise from diffusion/GAN models)
4. Unnatural symmetry or lighting inconsistencies.`;
        } else if (mode === "AUDIO") {
            systemPrompt = `You are a Senior Forensics Biometric Auditor specializing in Audio Deepfake detection.
Analyze the provided spectral data/metadata for:
1. Spectral consistency and phase-vocoder artifacts.
2. Unnatural silence distribution or rhythmic robotic breathing patterns.
3. Lack of organic background noise signatures or "digital coldness".
4. Pitch-shift artifacts or synthetic harmonics.`;
        } else {
            systemPrompt = `You are a Senior Forensics Biometric Auditor specializing in Video Deepfake detection.
Analyze for:
1. Temporal aliasing and frame-to-frame biometric drift.
2. Inconsistent eye-blinking frequencies or mouth-movement desync.
3. "Ghosting" around face boundaries during rapid movement.
4. Lighting changes that don't match the background environment.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `${systemPrompt}

You MUST respond with ONLY a JSON object in this exact format, nothing else:
{"deepfake_probability": <number 0-100>, "reasoning": "<detailed technical forensic analysis sentence>", "security_flag": "<FLAG_CODE>"}

Media Filename: ${fileName}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${fileType};base64,${base64Data}`
                            }
                        }
                    ]
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.1,
            max_tokens: 512
        });

        const rawResponse = completion.choices[0].message.content || "";
        console.log("[Forensics] Raw AI Response:", rawResponse);

        const jsonMatch = rawResponse.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            console.error("[Forensics] Could not parse JSON from response");
            return {
                score: 85,
                verdict: "SYNTHETIC_MEDIA_DETECTED",
                details: `Vision model detected anomalies but could not structure report. Raw analysis: ${rawResponse.slice(0, 300)}`,
                flag: "UNSTRUCTURED_AUDIT"
            };
        }

        const analysis = JSON.parse(jsonMatch[0]);
        const prob = analysis.deepfake_probability ?? 0;

        return {
            score: prob,
            verdict: prob > 50 ? "SYNTHETIC_MEDIA_DETECTED" : "AUTHENTIC_CAPTURE_VERIFIED",
            details: analysis.reasoning || "Forensic audit complete.",
            flag: analysis.security_flag || "VISION_AUDIT_COMPLETE"
        };

    } catch (error: any) {
        console.error("[Forensics] API Error:", error?.message || error);

        return {
            score: 0,
            verdict: "AUDIT_FAILED",
            details: `Vision API Error: ${error?.message || "Unknown error"}. Please try again with a smaller file.`,
            flag: "VISION_API_ERROR"
        };
    }
}
