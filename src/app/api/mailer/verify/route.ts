import { NextRequest, NextResponse } from "next/server";
import { verifySmtpConnection, getSmtpConfig } from "@/lib/email/mailer";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const sessionRes = await verifySessionToken(token);
    if (!sessionRes.valid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Valid authenticated session required" },
        { status: 401 }
      );
    }

    const config = getSmtpConfig();
    const result = await verifySmtpConnection();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      smtp: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        // PASSWORD IS NEVER EXPOSED TO CLIENT
        configured: Boolean(config.user && config.pass),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SMTP verification failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

