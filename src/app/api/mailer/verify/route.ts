import { NextResponse } from "next/server";
import { verifySmtpConnection, getSmtpConfig } from "@/lib/email/mailer";

export async function GET() {
  try {
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

