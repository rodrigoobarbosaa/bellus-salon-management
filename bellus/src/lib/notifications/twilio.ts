/**
 * Twilio integration for WhatsApp and SMS notifications.
 * All env vars are optional — if not configured, functions return gracefully.
 */

interface SendResult {
  success: boolean;
  sid?: string;
  error?: string;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
  const smsFrom = process.env.TWILIO_SMS_FROM; // e.g. "+14155238886"

  return { accountSid, authToken, whatsappFrom, smsFrom };
}

function isTwilioConfigured(): boolean {
  const { accountSid, authToken } = getTwilioConfig();
  return Boolean(accountSid && authToken);
}

/**
 * Send a WhatsApp message via Twilio API.
 * Uses fetch directly to avoid bundling the full twilio SDK.
 */
export async function sendWhatsApp(to: string, message: string): Promise<SendResult> {
  const { accountSid, authToken, whatsappFrom } = getTwilioConfig();

  if (!accountSid || !authToken || !whatsappFrom) {
    return { success: false, error: "Twilio WhatsApp not configured" };
  }

  // Normalize phone number for WhatsApp
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : `+${to}`}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      From: whatsappFrom,
      To: whatsappTo,
      Body: message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message ?? `HTTP ${response.status}` };
    }

    return { success: true, sid: data.sid };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send an SMS via Twilio API.
 */
export async function sendSMS(to: string, message: string): Promise<SendResult> {
  const { accountSid, authToken, smsFrom } = getTwilioConfig();

  if (!accountSid || !authToken || !smsFrom) {
    return { success: false, error: "Twilio SMS not configured" };
  }

  const smsTo = to.startsWith("+") ? to : `+${to}`;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      From: smsFrom,
      To: smsTo,
      Body: message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message ?? `HTTP ${response.status}` };
    }

    return { success: true, sid: data.sid };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export { isTwilioConfigured };
