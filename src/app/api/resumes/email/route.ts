import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Setup Resend
const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key");

// Mongo collections
const getEmailMetricsCollection = () =>
  mongoose.connection.collection("email_metrics");
const getResumeCollection = () =>
  mongoose.connection.collection("generated_resumes");

const MAX_EMAILS_PER_MONTH = 3000;

export async function POST(req: Request) {
  try {
    await connectDB();

    // Rate Limiting Logic (3000 max/month)
    const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const metricsCollection = getEmailMetricsCollection();

    let metrics = await metricsCollection.findOne({ month: currentYearMonth });
    if (!metrics) {
      await metricsCollection.insertOne({ month: currentYearMonth, count: 0 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metrics = { month: currentYearMonth, count: 0 } as any;
    }

    if (metrics!.count >= MAX_EMAILS_PER_MONTH) {
      return NextResponse.json(
        {
          error:
            "Monthly global email limit of 3000 has been reached. Please try later or download PDF.",
        },
        { status: 429 },
      );
    }

    // Process Payload
    const { recipient, studentName, pdfDataUri } = await req.json();

    if (!recipient || !pdfDataUri) {
      return NextResponse.json(
        { error: "Recipient and PDF payload are required." },
        { status: 400 },
      );
    }

    // Extract base64 from dataURI (data:image/jpeg;base64,...)
    const base64Content = pdfDataUri.split(",")[1] || pdfDataUri;

    // Send Email with Professional Design
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      (process.env.RESEND_DOMAIN
        ? `resumes@${process.env.RESEND_DOMAIN}`
        : "onboarding@resend.dev");

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <div style="width: 70px; height: 70px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; line-height: 70px; text-align: center;">
                      <span style="font-size: 32px; color: #ffffff;">📄</span>
                    </div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Resume Attached</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Professional Document</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; font-size: 16px; color: #2d3748; line-height: 1.6;">
                      Hello! 👋
                    </p>
                    <p style="margin: 0 0 20px; font-size: 15px; color: #4a5568; line-height: 1.7;">
                      Please find the generated resume for <strong style="color: #2d3748;">${studentName || "the candidate"}</strong> attached to this email.
                    </p>
                    
                    <!-- Info Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-left: 4px solid #667eea; border-radius: 6px; padding: 20px; margin: 25px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <p style="margin: 0; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Candidate Name</p>
                                <p style="margin: 5px 0 0; font-size: 15px; color: #2d3748; font-weight: 600;">${studentName || "Not provided"}</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin: 0; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Sent To</p>
                                <p style="margin: 5px 0 0; font-size: 15px; color: #2d3748; font-weight: 600;">${recipient}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 25px 0 0; font-size: 14px; color: #4a5568; line-height: 1.7;">
                      The PDF document is attached to this email. You can download and view it at your convenience.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 13px; color: #718096; line-height: 1.5;">
                      📧 This is an automated email from <strong style="color: #4a5568;">Resume Builder</strong>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                      Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const { data, error } = await resend.emails.send({
      from: `Resume Builder <${fromEmail}>`,
      to: [recipient],
      subject: `📄 ${studentName || "Student"} - Resume Attached`,
      html: emailHtml,
      attachments: [
        {
          filename: `${studentName?.replace(/\s+/g, "_") || "Resume"}.pdf`,
          content: base64Content,
        },
      ],
    });

    if (error) {
      console.error("Resend delivery failed:", error);

      // Handle common Resend onboarding restriction
      if (fromEmail === "onboarding@resend.dev") {
        return NextResponse.json(
          {
            error:
              "Resend Free tier limit: You can ONLY send emails to the email address you registered your Resend account with. To send to anyone else, verify your domain in Resend.com!",
          },
          { status: 403 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update internal counter
    await metricsCollection.updateOne(
      { month: currentYearMonth },
      { $inc: { count: 1 } },
    );

    // Log tracking for admin analytics
    await getResumeCollection().insertOne({
      studentName: studentName || "Anonymous Sender",
      department: `Sent to ${recipient}`,
      createdAt: new Date().toISOString(),
      action: "EMAIL_SENT",
    });

    return NextResponse.json(
      { message: "Email dispatched successfully!", id: data?.id },
      { status: 200 },
    );
  } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Email API Route Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 },
    );
  }
}
