"use server";

export async function sendVerificationSuccessEmail(toEmail: string, userName: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { success: false, error: "Brevo API Key not configured." };

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #0A0F14; color: #ffffff; padding: 40px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 12px; background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px;">
          <span style="font-size: 32px;">🛡️</span>
        </div>
      </div>
      <h1 style="color: #00F0FF; text-transform: uppercase; letter-spacing: 3px; font-size: 24px; text-align: center; margin-bottom: 8px;">Identity Verified</h1>
      <p style="color: #71717a; text-align: center; font-size: 14px; margin-bottom: 30px;">Proof of Life Protocol Complete</p>
      <p style="color: #d4d4d8;">Hello <strong style="color: white;">${userName}</strong>,</p>
      <p style="color: #a1a1aa; line-height: 1.7;">Your <strong style="color: #00F0FF;">Proof of Life</strong> ritual was successful. Your digital identity has been verified as authentic and human-led.</p>
      <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.15); padding: 20px; border-radius: 12px; margin: 24px 0;">
        <p style="margin: 0 0 4px 0; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">Access Token</p>
        <p style="margin: 0; font-size: 14px; color: #00F0FF; font-family: monospace;">POL_${Date.now().toString(36).toUpperCase()}_VERIFIED</p>
      </div>
      <p style="color: #a1a1aa; font-size: 14px;">You now have access to the <strong style="color: white;">Ecipheryx Sanctuary</strong> and all secured digital assets.</p>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
      <p style="font-size: 11px; color: #52525b; text-align: center;">Automated security notification from Ecipheryx • Anti-Deepfake Identity Protocol</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "Ecipheryx", email: process.env.EMAIL_FROM },
        to: [{ email: toEmail, name: userName }],
        subject: "🛡️ Ecipheryx: Digital Identity Verified",
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Brevo API Error:", error);
      return { success: false, error: "Failed to send verification email." };
    }

    return { success: true };
  } catch (error) {
    console.error("Brevo Email Error:", error);
    return { success: false, error: "Failed to send verification email." };
  }
}
