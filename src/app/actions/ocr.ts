"use server";

export async function processID(imageDataUrl: string) {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) return { error: "OCR API Key not configured." };

    try {
        const formData = new FormData();
        formData.append("base64Image", imageDataUrl);
        formData.append("apikey", apiKey);
        formData.append("OSR", "true"); // Optimize for Speed

        const response = await fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
            return { error: result.ErrorMessage };
        }

        const text = result.ParsedResults[0].ParsedText;
        return { text, success: true };
    } catch (error) {
        console.error("OCR Error:", error);
        return { error: "Failed to process identity document." };
    }
}
