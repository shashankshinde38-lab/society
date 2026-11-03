import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = (process.env.SMTP_USER || "").trim();
  // Strip quotes and internal spaces (Google App Passwords are 16 letters displayed as 4 groups of 4)
  const pass = (process.env.SMTP_PASSWORD || "").replace(/['"]/g, "").replace(/\s+/g, "").trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || "parijatsociety@gmail.com";
  const fromName = process.env.SMTP_FROM_NAME?.replace(/['"]/g, "") || "Parijat Society Office";

  return { host, port, secure, user, pass, fromEmail, fromName };
}

export function getTransporter(): Transporter {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      // Do not fail on invalid certs in test environments
      rejectUnauthorized: false,
    },
  });
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = getSmtpConfig();
    if (!config.user || !config.pass) {
      return { success: false, message: "SMTP credentials not configured in environment." };
    }
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: `SMTP connection established successfully via ${config.host}:${config.port}` };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown SMTP verification error";
    return { success: false, message: errMsg };
  }
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getSmtpConfig();
  const transporter = getTransporter();

  // Retry up to 2 times for transient network issues
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        replyTo: replyTo || config.fromEmail,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ""),
        attachments: attachments || [],
      });
      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < 2) {
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  return { success: false, error: lastError };
}

// ====================================================================
// DYNAMIC & RESPONSIVE HTML EMAIL TEMPLATES
// Compatible with all major email clients (Gmail, Outlook, iOS, Apple Mail)
// ====================================================================

export interface PendingMonthItem {
  month: number;
  monthName: string;
  year: number;
  amount: number;
  status: string;
}

export interface ReminderEmailParams {
  residentName: string;
  flatNumber: string;
  societyName: string;
  societyAddress: string;
  societyEmail: string;
  societyContact?: string | null;
  billingMonth: string;
  billingYear: number;
  dueDate: string;
  totalOutstanding: number;
  pendingMonths?: PendingMonthItem[];
  // Bank Details from App Setup
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
  qrCodeUrl?: string | null;
}

export function generateMaintenanceReminderHtml(params: ReminderEmailParams): string {
  const monthRows = params.pendingMonths && params.pendingMonths.length > 0
    ? params.pendingMonths.map(
      (m) => `
        <tr>
          <td style="padding: 13px 16px; border-bottom: 1px solid #edf1f6; color: #243247; font-size: 14px; font-weight: 600;">
            ${m.monthName} ${m.year}
          </td>
          <td align="right" style="padding: 13px 16px; border-bottom: 1px solid #edf1f6; color: #b42318; font-size: 14px; font-weight: 700; white-space: nowrap;">
            ₹${m.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `
    ).join("")
    : `
      <tr>
        <td style="padding: 13px 16px; border-bottom: 1px solid #edf1f6; color: #243247; font-size: 14px; font-weight: 600;">
          ${params.billingMonth} ${params.billingYear}
        </td>
        <td align="right" style="padding: 13px 16px; border-bottom: 1px solid #edf1f6; color: #b42318; font-size: 14px; font-weight: 700; white-space: nowrap;">
          ₹${params.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Maintenance Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f6fa; font-family: Arial, Helvetica, sans-serif; color: #243247;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f6fa" style="width: 100%; background-color: #f3f6fa;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; background-color: #ffffff; border: 1px solid #e5ebf2; border-radius: 16px; overflow: hidden;">

          <!-- Brand accent -->
          <tr>
            <td height="6" bgcolor="#16a085" style="height: 6px; background-color: #16a085; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td bgcolor="#142b45" style="padding: 30px 32px 28px; background-color: #142b45;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 6px 10px; background-color: #21435f; border: 1px solid #37617d; border-radius: 20px; color: #b9f3e4; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                      Maintenance reminder
                    </span>
                    <h1 style="margin: 16px 0 6px; color: #ffffff; font-size: 25px; line-height: 1.25; font-weight: 700;">
                      ${escapeHtml(params.societyName)}
                    </h1>
                    <p style="margin: 0; color: #c1ceda; font-size: 13px; line-height: 1.6;">
                      Your society maintenance statement for ${escapeHtml(params.billingMonth)} ${params.billingYear}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 30px 32px 32px;">
              <p style="margin: 0 0 10px; color: #172b43; font-size: 17px; line-height: 1.5;">
                Hello <strong>${escapeHtml(params.residentName)}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #637286; font-size: 14px; line-height: 1.75;">
                This is a friendly reminder that maintenance dues for <strong style="color: #243247;">Flat ${escapeHtml(params.flatNumber)}</strong> are currently pending. Your contribution helps us maintain society facilities, elevators, 24/7 security, and clean common premises.
              </p>

              <!-- Outstanding amount -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#fdf1f0" style="width: 100%; margin: 0 0 28px; background-color: #fdf1f0; border: 1px solid #f5d2ce; border-radius: 13px;">
                <tr>
                  <td style="padding: 22px 24px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="middle">
                          <p style="margin: 0 0 7px; color: #9e342c; font-size: 10px; line-height: 1.4; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                            Total outstanding amount
                          </p>
                          <div style="color: #a52c25; font-size: 30px; line-height: 1.2; font-weight: 800;">
                            ₹${params.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td align="right" valign="middle" style="padding-left: 10px;">
                          <span style="display: inline-block; padding: 8px 11px; background-color: #ffffff; border: 1px solid #efc1bc; border-radius: 8px; color: #9e342c; font-size: 11px; line-height: 1.4; font-weight: 700; white-space: nowrap;">
                            Due: ${escapeHtml(params.dueDate)}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Month-wise breakdown -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin: 0 0 28px; border: 1px solid #e5ebf2; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td colspan="2" bgcolor="#f7f9fc" style="padding: 15px 16px; background-color: #f7f9fc; border-bottom: 1px solid #e5ebf2;">
                    <span style="color: #243b53; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Pending month(s) breakdown</span>
                  </td>
                </tr>
                <tr bgcolor="#fbfcfe">
                  <th align="left" style="padding: 11px 16px; background-color: #fbfcfe; color: #7a899b; font-size: 10px; letter-spacing: 0.7px; text-transform: uppercase; font-weight: 700;">Billing period</th>
                  <th align="right" style="padding: 11px 16px; background-color: #fbfcfe; color: #7a899b; font-size: 10px; letter-spacing: 0.7px; text-transform: uppercase; font-weight: 700;">Due amount</th>
                </tr>
                <tbody>
                  ${monthRows}
                </tbody>
              </table>

              <!-- Payment details -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f0f8f6" style="width: 100%; margin: 0 0 22px; background-color: #f0f8f6; border: 1px solid #cfe8df; border-radius: 13px;">
                <tr>
                  <td style="padding: 22px 24px 20px;">
                    <p style="margin: 0 0 4px; color: #16745f; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Secure payment information</p>
                    <h2 style="margin: 0 0 16px; color: #174b42; font-size: 17px; line-height: 1.4; font-weight: 700;">Official Society Bank Details</h2>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; color: #29483f; font-size: 13px; line-height: 1.6;">
                      <tr>
                        <td width="38%" style="padding: 7px 8px 7px 0; color: #688078;">Bank name</td>
                        <td style="padding: 7px 0; color: #183b33; font-weight: 700;">${escapeHtml(params.bankName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #688078;">Account holder</td>
                        <td style="padding: 7px 0; color: #183b33; font-weight: 700;">${escapeHtml(params.accountHolderName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #688078;">Account number</td>
                        <td style="padding: 7px 0; color: #183b33; font-family: monospace; font-size: 14px; font-weight: 700;">${escapeHtml(params.accountNumber)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #688078;">IFSC code</td>
                        <td style="padding: 7px 0; color: #183b33; font-family: monospace; font-weight: 700;">${escapeHtml(params.ifscCode)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #688078;">Branch</td>
                        <td style="padding: 7px 0; color: #183b33;">${escapeHtml(params.branchName)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 11px 8px 0 0; color: #16745f; font-weight: 700;">UPI ID</td>
                        <td style="padding: 11px 0 0;">
                          <span style="display: inline-block; padding: 7px 10px; background-color: #ffffff; border: 1px solid #b9ddd0; border-radius: 7px; color: #176c58; font-family: monospace; font-size: 13px; font-weight: 700;">
                            ${escapeHtml(params.upiId)}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Payment note -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                <tr>
                  <td width="30" valign="top" style="padding: 1px 10px 0 0; color: #16856b; font-size: 18px;">&#9432;</td>
                  <td style="color: #68788b; font-size: 12px; line-height: 1.7;">
                    After initiating the payment, please share the transaction reference / UTR number with the society management office so that an official receipt can be issued and recorded.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f7f9fc" style="padding: 23px 28px; background-color: #f7f9fc; border-top: 1px solid #e8edf3; text-align: center; color: #718096; font-size: 12px; line-height: 1.8;">
              <strong style="color: #243b53; font-size: 13px;">${escapeHtml(params.societyName)}</strong><br>
              ${escapeHtml(params.societyAddress)}<br>
              Email: <a href="mailto:${escapeHtml(params.societyEmail)}" style="color: #16856b; text-decoration: none;">${escapeHtml(params.societyEmail)}</a>
              ${params.societyContact ? ` &nbsp;|&nbsp; Contact: ${escapeHtml(params.societyContact)}` : ""}
              <p style="margin: 12px 0 0; color: #9aa6b4; font-size: 10px; line-height: 1.6;">
                This is an automated maintenance billing notification sent to registered occupants of Flat ${escapeHtml(params.flatNumber)}.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 14px 0 0; color: #9aa6b4; font-size: 10px; line-height: 1.5; text-align: center;">Please do not reply to this automated notification unless instructed by the society office.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface ExpenseNotificationParams {
  societyName: string;
  societyAddress: string;
  societyEmail: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  vendorName?: string | null;
  invoiceBillNo?: string | null;
  description?: string | null;
}

export function generateExpenseNotificationHtml(params: ExpenseNotificationParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Society Expenditure Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f6fa; font-family: Arial, Helvetica, sans-serif; color: #243247;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f6fa" style="width: 100%; background-color: #f3f6fa;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; background-color: #ffffff; border: 1px solid #e5ebf2; border-radius: 16px; overflow: hidden;">

          <!-- Brand accent -->
          <tr>
            <td height="6" bgcolor="#d99a35" style="height: 6px; background-color: #d99a35; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td bgcolor="#142b45" style="padding: 30px 32px 28px; background-color: #142b45;">
              <span style="display: inline-block; padding: 6px 10px; background-color: #3d3b2e; border: 1px solid #756642; border-radius: 20px; color: #f6d99b; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                Society expenditure notice
              </span>
              <h1 style="margin: 16px 0 6px; color: #ffffff; font-size: 25px; line-height: 1.25; font-weight: 700;">
                ${escapeHtml(params.societyName)}
              </h1>
              <p style="margin: 0; color: #c1ceda; font-size: 13px; line-height: 1.6;">
                Financial transparency &bull; Common area expenditure update
              </p>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 30px 32px 32px;">
              <p style="margin: 0 0 10px; color: #172b43; font-size: 17px; line-height: 1.5;">
                Dear Society Residents,
              </p>
              <p style="margin: 0 0 24px; color: #637286; font-size: 14px; line-height: 1.75;">
                In line with our commitment to financial transparency, please be informed that a society common expenditure has been approved and disbursed. The details are provided below for your reference.
              </p>

              <!-- Expense summary -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#fff8eb" style="width: 100%; margin: 0 0 22px; background-color: #fff8eb; border: 1px solid #f1dfbd; border-radius: 13px;">
                <tr>
                  <td style="padding: 22px 24px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="top" style="padding-right: 12px;">
                          <p style="margin: 0 0 7px; color: #9b702c; font-size: 10px; line-height: 1.4; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Expense title</p>
                          <div style="color: #573f1c; font-size: 19px; line-height: 1.4; font-weight: 700;">${escapeHtml(params.title)}</div>
                        </td>
                        <td align="right" valign="top" style="white-space: nowrap;">
                          <p style="margin: 0 0 7px; color: #9b702c; font-size: 10px; line-height: 1.4; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Amount</p>
                          <div style="color: #93621b; font-size: 25px; line-height: 1.25; font-weight: 800;">₹${params.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-top: 20px; border-top: 1px solid #efdfc2; color: #59482e; font-size: 13px; line-height: 1.65;">
                      <tr>
                        <td width="38%" style="padding: 12px 8px 7px 0; color: #94794f;">Category</td>
                        <td style="padding: 12px 0 7px; color: #49391f; font-weight: 700;">${escapeHtml(params.category)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #94794f;">Expense date</td>
                        <td style="padding: 7px 0; color: #49391f;">${escapeHtml(params.expenseDate)}</td>
                      </tr>
                      ${params.vendorName ? `
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #94794f;">Vendor / service provider</td>
                        <td style="padding: 7px 0; color: #49391f; font-weight: 600;">${escapeHtml(params.vendorName)}</td>
                      </tr>` : ""}
                      ${params.invoiceBillNo ? `
                      <tr>
                        <td style="padding: 7px 8px 7px 0; color: #94794f;">Bill / invoice number</td>
                        <td style="padding: 7px 0; color: #49391f; font-family: monospace;">${escapeHtml(params.invoiceBillNo)}</td>
                      </tr>` : ""}
                      ${params.description ? `
                      <tr>
                        <td valign="top" style="padding: 7px 8px 0 0; color: #94794f;">Description</td>
                        <td style="padding: 7px 0 0; color: #49391f;">${escapeHtml(params.description)}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Transparency notice -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f2f7fb" style="width: 100%; background-color: #f2f7fb; border: 1px solid #dce8f1; border-left: 4px solid #3d8ba8; border-radius: 9px;">
                <tr>
                  <td style="padding: 15px 17px; color: #52677b; font-size: 12px; line-height: 1.7;">
                    <strong style="color: #294c63;">Please note:</strong> This notification is shared for transparency regarding society maintenance operations. This is <strong>not</strong> an individual bill or maintenance due for your flat.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f7f9fc" style="padding: 23px 28px; background-color: #f7f9fc; border-top: 1px solid #e8edf3; text-align: center; color: #718096; font-size: 12px; line-height: 1.8;">
              <strong style="color: #243b53; font-size: 13px;">${escapeHtml(params.societyName)}</strong><br>
              ${escapeHtml(params.societyAddress)}<br>
              Email: <a href="mailto:${escapeHtml(params.societyEmail)}" style="color: #16856b; text-decoration: none;">${escapeHtml(params.societyEmail)}</a>
            </td>
          </tr>
        </table>
        <p style="margin: 14px 0 0; color: #9aa6b4; font-size: 10px; line-height: 1.5; text-align: center;">A society communication for your information and records.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface PaymentReceiptParams {
  residentName: string;
  flatNumber: string;
  societyName: string;
  societyAddress: string;
  societyEmail: string;
  societyContact?: string | null;
  receiptNumber: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  transactionRef?: string | null;
  paidMonths?: string[];
  description?: string | null;
}

export function generatePaymentReceiptHtml(params: PaymentReceiptParams): string {
  const monthsList =
    params.paidMonths && params.paidMonths.length > 0
      ? params.paidMonths.join(", ")
      : "Current Maintenance Period";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received – Maintenance Receipt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);">
          
          <!-- Green Success Header -->
          <tr>
            <td bgcolor="#0f172a" style="background: linear-gradient(135deg, #0f172a 0%, #065f46 100%); padding: 32px 28px; color: #ffffff;">
              <div style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
                &#10003; Payment Received &amp; Cleared
              </div>
              <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.25;">
                ${escapeHtml(params.societyName)}
              </h1>
              <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                Official Maintenance Payment Receipt &bull; ${escapeHtml(params.receiptNumber)}
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
                Dear <strong>${escapeHtml(params.residentName)}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
                Thank you! We have successfully received and processed your society maintenance payment for <strong>Flat ${escapeHtml(params.flatNumber)}</strong>. Below are your official payment and clearance details:
              </p>

              <!-- Payment Summary Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                      Total Amount Received &amp; Settled
                    </div>
                    <div style="font-size: 28px; font-weight: 800; color: #065f46; font-family: monospace; line-height: 1.2;">
                      &#8377;${params.amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #047857; font-weight: 600;">
                      &#10003; Maintenance Dues Cleared for: <span style="background-color: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">${escapeHtml(monthsList)}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Detailed Receipt Table -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; font-size: 13px;">
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600; width: 40%;">Receipt Number</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; font-family: monospace;">${escapeHtml(params.receiptNumber)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Payment Date</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${escapeHtml(params.paymentDate)}</td>
                </tr>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Payment Mode</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${escapeHtml(params.paymentMethod)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Transaction / Ref #</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-family: monospace;">${escapeHtml(params.transactionRef || "N/A (Direct Clearance)")}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Flat &amp; Occupant</td>
                  <td style="padding: 10px 14px; color: #0f172a;">Flat ${escapeHtml(params.flatNumber)} &bull; ${escapeHtml(params.residentName)}</td>
                </tr>
              </table>

              <!-- Attachment Banner -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2563eb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; color: #1e40af; line-height: 1.5;">
                    <strong>Invoice Attachment Included:</strong><br>
                    Your official maintenance receipt invoice PDF is attached to this email. Please download and preserve it for your taxation and society records.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                Automated payment reminders for this billing period have now been halted. Thank you for your prompt payment and contribution towards society maintenance.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.7;">
              <strong style="color: #0f172a;">${escapeHtml(params.societyName)}</strong><br>
              ${escapeHtml(params.societyAddress)}<br>
              Email: <a href="mailto:${escapeHtml(params.societyEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(params.societyEmail)}</a>
              ${params.societyContact ? ` &bull; Tel: ${escapeHtml(params.societyContact)}` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
