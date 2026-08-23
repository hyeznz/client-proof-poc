import "server-only";
import { createHmac, randomBytes } from "crypto";

// Solapi 단문 발송 — SDK 없이 REST 직접 호출 (의존성 0, 30줄).
// 인증: HMAC-SHA256(date + salt) 를 API Secret 으로 서명.
export async function sendSms(to: string, text: string) {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !from) throw new Error("SOLAPI env 누락");

  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to: to.replace(/\D/g, ""), from, text } }),
  });
  if (!res.ok) throw new Error(`solapi ${res.status}: ${await res.text()}`);
  return res.json();
}
