import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  generateMaintenanceReminderHtml,
} from "@/lib/email/mailer";

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  try {
    // Optional secret check
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized cron trigger" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { flatsWithDues, society } = body;

    const societyInfo = society || {
      name: "Parijat Cooperative Housing Society - A Wing",
      address: "Survey No. 42/1, Parijat Enclave, Kothrud, Pune - 411038",
      email: "parijatsociety@gmail.com",
      contact_number: "+91 98220 12345",
      bank_name: "HDFC Bank",
      account_holder_name: "Parijat Cooperative Housing Society Ltd",
      account_number: "5020008910291",
      ifsc_code: "HDFC0001234",
      branch_name: "Kothrud Branch, Pune",
      upi_id: "parijatsociety@okhdfcbank",
    };

    const targetFlats = flatsWithDues || [];
    const results = [];
    const now = new Date();

    // Next scheduled reminder is tomorrow at 09:00 AM IST
    const nextScheduled = new Date(now);
    nextScheduled.setDate(nextScheduled.getDate() + 1);
    nextScheduled.setHours(9, 0, 0, 0);

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Duplicate prevention for the same flat in this run
    const processedFlats = new Set<string>();

    for (const flat of targetFlats) {
      if (processedFlats.has(flat.flatId || flat.flatNumber)) {
        continue;
      }
      processedFlats.add(flat.flatId || flat.flatNumber);

      // Verify that total due is actually greater than 0
      const totalDue = Number(flat.outstandingDues || flat.totalDue || 0);
      if (totalDue <= 0) {
        results.push({
          flat: flat.flatNumber,
          recipient: flat.residentName,
          status: "SKIPPED",
          reason: "Maintenance fully paid. Daily reminder stopped.",
        });
        continue;
      }

      if (!flat.residentEmail) {
        results.push({
          flat: flat.flatNumber,
          recipient: flat.residentName,
          status: "FAILED",
          reason: "No resident email found for flat",
        });
        continue;
      }

      const billingMonthName = flat.billingMonth || MONTH_NAMES[now.getMonth()];
      const subject = `[Daily Maintenance Reminder - 9:00 AM] Pending Dues for Flat ${flat.flatNumber}`;

      const html = generateMaintenanceReminderHtml({
        residentName: flat.residentName || "Resident",
        flatNumber: flat.flatNumber,
        societyName: societyInfo.name,
        societyAddress: societyInfo.address,
        societyEmail: societyInfo.email,
        societyContact: societyInfo.contact_number,
        billingMonth: billingMonthName,
        billingYear: flat.billingYear || now.getFullYear(),
        dueDate: flat.dueDate || "10th of this month",
        totalOutstanding: totalDue,
        pendingMonths: flat.pendingMonths || [],
        bankName: societyInfo.bank_name,
        accountHolderName: societyInfo.account_holder_name,
        accountNumber: societyInfo.account_number,
        ifscCode: societyInfo.ifsc_code,
        branchName: societyInfo.branch_name,
        upiId: societyInfo.upi_id,
      });

      const emailResult = await sendEmail({
        to: flat.residentEmail,
        subject,
        html,
      });

      results.push({
        id: "log-cron-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        recipient: flat.residentName,
        recipient_email: flat.residentEmail,
        flat_number: flat.flatNumber,
        subject,
        email_type: "DUE_REMINDER",
        amount_due: totalDue,
        status: emailResult.success ? "SENT" : "FAILED",
        sent_at: now.toISOString(),
        last_attempt: now.toISOString(),
        next_scheduled_at: emailResult.success ? nextScheduled.toISOString() : null,
        retry_count: emailResult.success ? 0 : 1,
        error_message: emailResult.error || null,
      });
    }

    return NextResponse.json({
      success: true,
      executionTimestamp: now.toISOString(),
      timezone: "Asia/Kolkata",
      schedule: "Every day at 09:00 AM IST",
      processedCount: results.length,
      sentCount: results.filter((r) => r.status === "SENT").length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Cron execution error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

