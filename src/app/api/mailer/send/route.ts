import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  generateMaintenanceReminderHtml,
  generateExpenseNotificationHtml,
  generatePaymentReceiptHtml,
  EmailAttachment,
} from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      recipients,
      society,
      expenseData,
      announcementData,
    } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: "No recipients provided" },
        { status: 400 }
      );
    }

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

    const results = [];
    const now = new Date();
    // Next scheduled reminder is tomorrow at 09:00 AM IST
    const nextScheduled = new Date(now);
    nextScheduled.setDate(nextScheduled.getDate() + 1);
    nextScheduled.setHours(9, 0, 0, 0);

    for (const item of recipients) {
      if (!item.email) {
        results.push({
          recipient: item.name || "Unknown",
          email: "",
          flat: item.flatNumber || "-",
          status: "FAILED",
          error: "No email address found for resident",
        });
        continue;
      }

      let subject = "";
      let html = "";
      let emailAttachments: EmailAttachment[] = [];

      if (type === "PAYMENT_RECEIPT") {
        subject = item.subject || `Official Maintenance Receipt – ${item.receiptNumber || "Cleared"} – Flat ${item.flatNumber}`;
        html = generatePaymentReceiptHtml({
          residentName: item.name || "Resident",
          flatNumber: item.flatNumber || "-",
          societyName: societyInfo.name,
          societyAddress: societyInfo.address,
          societyEmail: societyInfo.email,
          societyContact: societyInfo.contact_number,
          receiptNumber: item.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
          paymentDate: item.paymentDate || now.toISOString().split("T")[0],
          amountPaid: Number(item.amountPaid || item.totalOutstanding || 1100),
          paymentMethod: item.paymentMethod || "Online / UPI Transfer",
          transactionRef: item.transactionRef || null,
          paidMonths: item.paidMonths || (item.billingMonth ? [`${item.billingMonth} ${item.billingYear || now.getFullYear()}`] : ["Current Month"]),
          description: item.description,
        });

        // Attach Invoice PDF if provided
        if (item.invoicePdfBase64) {
          const rawBase64 = item.invoicePdfBase64.includes(",")
            ? item.invoicePdfBase64.split(",")[1]
            : item.invoicePdfBase64;
          emailAttachments.push({
            filename: `Maintenance_Invoice_${item.receiptNumber || item.flatNumber}.pdf`,
            content: Buffer.from(rawBase64, "base64"),
            contentType: "application/pdf",
          });
        }
      } else if (type === "DUE_REMINDER") {
        // Re-check: If total outstanding is 0 or flat is already paid, do not send reminder
        if (Number(item.totalOutstanding || 0) <= 0) {
          results.push({
            recipient: item.name,
            email: item.email,
            flat: item.flatNumber,
            status: "SKIPPED",
            error: "Maintenance is already fully paid. Reminder stopped.",
          });
          continue;
        }

        subject = `Maintenance Payment Reminder – ${item.billingMonth || "Current Month"} – Flat ${item.flatNumber}`;
        html = generateMaintenanceReminderHtml({
          residentName: item.name || "Resident",
          flatNumber: item.flatNumber || "A-Wing",
          societyName: societyInfo.name,
          societyAddress: societyInfo.address,
          societyEmail: societyInfo.email,
          societyContact: societyInfo.contact_number,
          billingMonth: item.billingMonth || "Current Month",
          billingYear: item.billingYear || now.getFullYear(),
          dueDate: item.dueDate || "10th of the month",
          totalOutstanding: Number(item.totalOutstanding || 1100),
          pendingMonths: item.pendingMonths || [],
          bankName: societyInfo.bank_name,
          accountHolderName: societyInfo.account_holder_name,
          accountNumber: societyInfo.account_number,
          ifscCode: societyInfo.ifsc_code,
          branchName: societyInfo.branch_name,
          upiId: societyInfo.upi_id,
        });
      } else if (type === "EXPENSE_ALERT") {
        subject = `Society Expenditure Notification: ${expenseData?.title || "Common Expense"} (₹${Number(expenseData?.amount || 0).toLocaleString()})`;
        html = generateExpenseNotificationHtml({
          societyName: societyInfo.name,
          societyAddress: societyInfo.address,
          societyEmail: societyInfo.email,
          title: expenseData?.title || "Society Common Maintenance",
          category: expenseData?.category || "General Maintenance",
          amount: Number(expenseData?.amount || 0),
          expenseDate: expenseData?.expenseDate || now.toISOString().split("T")[0],
          vendorName: expenseData?.vendorName,
          invoiceBillNo: expenseData?.invoiceBillNo,
          description: expenseData?.description,
        });
      } else {
        // General Announcement
        subject = announcementData?.subject || `Notice from ${societyInfo.name}`;
        html = `
          <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0;">${escape(societyInfo.name)}</h2>
              <div style="padding: 12px; background: #eff6ff; border-left: 4px solid #2563eb; margin: 16px 0; font-weight: 600;">
                ${escape(announcementData?.title || subject)}
              </div>
              <div style="line-height: 1.6; font-size: 14px;">
                ${escape(announcementData?.message || "").replace(/\n/g, "<br>")}
              </div>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
                ${escape(societyInfo.name)} &bull; ${escape(societyInfo.address)}
              </div>
            </div>
          </div>
        `;
      }

      // Dispatch through Nodemailer
      const sendResult = await sendEmail({
        to: item.email,
        subject,
        html,
        attachments: emailAttachments,
      });

      results.push({
        id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        recipient: item.name || "Resident",
        recipient_email: item.email,
        flat_number: item.flatNumber || "-",
        subject,
        email_type: type,
        related_maintenance_month: item.month || null,
        related_maintenance_year: item.year || null,
        amount_due: item.totalOutstanding || null,
        status: sendResult.success ? "SENT" : "FAILED",
        sent_at: now.toISOString(),
        last_attempt: now.toISOString(),
        next_scheduled_at: (type === "DUE_REMINDER" && sendResult.success) ? nextScheduled.toISOString() : null,
        retry_count: sendResult.success ? 0 : 1,
        error_message: sendResult.error || null,
      });
    }

    const sentCount = results.filter((r) => r.status === "SENT").length;
    const failedCount = results.filter((r) => r.status === "FAILED").length;
    const skippedCount = results.filter((r) => r.status === "SKIPPED").length;

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      skippedCount,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending email";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

function escape(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

