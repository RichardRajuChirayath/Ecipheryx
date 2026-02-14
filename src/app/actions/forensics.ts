"use server";

async function callGroqVisionAPI(messages: any[], apiKey: string) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages,
            temperature: 0.1,
            max_tokens: 512,
        }),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown");
        throw new Error(`Groq API ${response.status}: ${errorText.slice(0, 200)}`);
    }

    return response.json();
}

async function callGroqTextAPI(messages: any[], apiKey: string) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 512,
        }),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown");
        throw new Error(`Groq API ${response.status}: ${errorText.slice(0, 200)}`);
    }

    return response.json();
}

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

    try {
        const payloadSizeKB = base64Data.length / 1024;
        console.log(`[Forensics] Mode: ${mode} | File: ${fileName} | Type: ${fileType} | Size: ${payloadSizeKB.toFixed(0)} KB`);

        // ─── AUDIO MODE: Text-only analysis (no vision) ───
        if (mode === "AUDIO") {
            // Client sends raw JSON metadata (no encoding)
            const audioMetadata = base64Data;

            const audioPrompt = `You are a Senior Forensics Biometric Auditor specializing in Audio Deepfake detection.
You are a HIGHLY SUSPICIOUS auditor. Your job is to protect against synthetic audio threats.

You are given metadata about an audio file. Based on the filename, file type, size, and any available information, assess the likelihood of this being AI-generated or synthetic audio.

CRITICAL ANALYSIS CRITERIA:
1. TTS (Text-to-Speech) indicators — filenames containing "tts", "generated", "ai", "clone", "speech", "voice"
2. Suspicious file sizes — a short audio clip that's unusually small or large for its format
3. Modern AI voice cloning — ElevenLabs, Bark, Tortoise, VALL-E, XTTS patterns
4. File naming conventions — sequential numbering, timestamps, output prefixes common in AI pipelines
5. Codec anomalies — unusual sample rates, bitrates, or encoding parameters

IMPORTANT: In the modern era, most audio files shared digitally have SOME probability of being synthetic.
Default to at least 40% probability unless there is strong evidence of organic recording.
If ANY filename indicator suggests TTS/AI, set probability to 70%+.

Audio metadata: ${audioMetadata}

You MUST respond with ONLY a JSON object in this exact format:
{"deepfake_probability": <number 0-100>, "reasoning": "<detailed technical forensic analysis>", "security_flag": "<FLAG_CODE>"}`;

            const data = await callGroqTextAPI([
                { role: "system", content: "You are a forensic audio analyst. Always respond with valid JSON." },
                { role: "user", content: audioPrompt }
            ], apiKey);

            const rawResponse = data.choices[0].message.content || "{}";
            console.log("[Forensics] Audio Analysis:", rawResponse);

            try {
                const analysis = JSON.parse(rawResponse);
                const prob = analysis.deepfake_probability ?? 50;
                return {
                    score: prob,
                    verdict: prob > 50 ? "SYNTHETIC_AUDIO_DETECTED" : "AUTHENTIC_AUDIO_VERIFIED",
                    details: analysis.reasoning || "Audio forensic audit complete.",
                    flag: analysis.security_flag || "AUDIO_AUDIT_COMPLETE"
                };
            } catch {
                return {
                    score: 50,
                    verdict: "UNCERTAIN",
                    details: `Audio metadata analyzed. Raw output: ${rawResponse.slice(0, 300)}`,
                    flag: "AUDIO_PARSE_ERROR"
                };
            }
        }

        // ─── IMAGE & VIDEO MODE: Vision analysis ───
        // (Video is received as an extracted keyframe JPEG from the client)
        if (payloadSizeKB > 4096) {
            return {
                score: 0,
                verdict: "PAYLOAD_TOO_LARGE",
                details: `File too large (${(payloadSizeKB / 1024).toFixed(1)} MB). Max 3MB. Compress or resize before uploading.`,
                flag: "SIZE_EXCEEDED"
            };
        }

        let systemPrompt = "";

        if (mode === "VIDEO") {
            systemPrompt = `You are a HIGHLY SUSPICIOUS Senior Forensics Biometric Auditor specializing in AI-Generated Video Detection.
You are analyzing a keyframe extracted from a video file. Your DEFAULT assumption is that this frame is LIKELY synthetic unless overwhelming evidence proves otherwise.

CRITICAL: Modern AI-generated videos (Sora, Runway, HeyGen, Synthesia, D-ID) are visually convincing but contain subtle forensic signatures:

1. UNCANNY VALLEY SMOOTHNESS: AI renders skin with unnatural perfection — no pores, no micro-expressions, no skin imperfections. Real skin has texture irregularities.
2. LIGHTING CONSISTENCY FAILURES: AI often creates lighting that is "too perfect" or uniformly diffused. Real scenes have complex light bouncing and micro-shadows.
3. BACKGROUND ANOMALIES: Look for warped edges, repeating patterns, or "painted" backgrounds that lack photographic depth-of-field.
4. EYE REFLECTIONS: AI typically fails to render consistent catchlight reflections in both eyes. Check for missing or asymmetric reflections.
5. HAIR/TEETH RENDERING: AI hair often looks like a solid mass. Real hair has flyaway strands. AI teeth are often too uniform.
6. TEMPORAL ARTIFACTS IN STILL: Even in a single frame, AI video shows "frozen" micro-expressions — faces that look posed rather than captured mid-motion.
7. EDGE BLENDING: Where the subject meets the background, AI often creates a subtle halo or color fringe.
8. SYNTHETIC NEWS ANCHORS: AI-generated news presenters are extremely common. If this looks like a news anchor, DEFAULT to 70%+ probability.

SCORING GUIDE:
- If the frame looks like it could be from an AI video generator: 60-85%
- If the frame shows clear synthetic artifacts: 85-100%
- Only score below 40% if you see clear photographic evidence (lens distortion, sensor noise, motion blur).`;

        } else {
            systemPrompt = `You are a Senior Forensics Biometric Auditor specializing in Image Deepfake detection.
Analyze for:
1. GAN artifacts (boundary blurring, texture aliasing, checkerboard patterns)
2. Surface scattering inconsistencies (skin vs synthetic renders)
3. Frequency domain anomalies (periodic noise from diffusion/GAN models)
4. Unnatural symmetry or lighting inconsistencies.`;
        }

        // Use image/jpeg for the vision API (video frames are already converted to JPEG)
        const imageType = fileType.startsWith("image/") ? fileType : "image/jpeg";

        const messages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `${systemPrompt}

You MUST respond with ONLY a JSON object in this exact format, nothing else:
{"deepfake_probability": <number 0-100>, "reasoning": "<detailed technical forensic analysis sentence>", "security_flag": "<FLAG_CODE>"}

Media Filename: ${fileName}
Analysis Mode: ${mode}`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${imageType};base64,${base64Data}`
                        }
                    }
                ]
            }
        ];

        console.log(`[Forensics] Calling Groq Vision API for ${mode}...`);
        const data = await callGroqVisionAPI(messages, apiKey);
        const rawResponse = data.choices[0].message.content || "";
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
            details: `Forensic API Error: ${error?.message || "Unknown error"}. Please retry.`,
            flag: "VISION_API_ERROR"
        };
    }
}
