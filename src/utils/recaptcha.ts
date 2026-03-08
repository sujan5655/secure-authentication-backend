const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Verify Google reCAPTCHA v2 token with Google's API.
 * Returns true if verification succeeds, false otherwise.
 */
export async function verifyRecaptcha(token: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("RECAPTCHA_SECRET_KEY is not set; reCAPTCHA verification skipped.");
    return true; // Allow in dev when key not set
  }

  if (!token || typeof token !== "string" || token.length < 10) {
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    if (remoteip) params.append("remoteip", remoteip);

    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}
