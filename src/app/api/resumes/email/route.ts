import { NextResponse } from "next/server";
import { Resend } from "resend";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// Setup Resend
const resend = new Resend(process.env.RESEND_API_KEY || "fallback_key");

// Mongo collections
const getEmailMetricsCollection = () => mongoose.connection.collection("email_metrics");
const getResumeCollection = () => mongoose.connection.collection("generated_resumes");

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
      metrics = { month: currentYearMonth, count: 0 } as any;
    }

    if (metrics!.count >= MAX_EMAILS_PER_MONTH) {
      return NextResponse.json(
        { error: "Monthly global email limit of 3000 has been reached. Please try later or download PDF." },
        { status: 429 }
      );
    }

    // Process Payload
    const { recipient, studentName, pdfDataUri } = await req.json();

    if (!recipient || !pdfDataUri) {
      return NextResponse.json({ error: "Recipient and PDF payload are required." }, { status: 400 });
    }

    // Extract base64 from dataURI (data:image/jpeg;base64,...)
    const base64Content = pdfDataUri.split(",")[1] || pdfDataUri;

    // Send Email
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { data, error } = await resend.emails.send({
      from: `Resume Builder <${fromEmail}>`,
      to: [recipient],
      subject: `${studentName || 'Student'} - Resume attached`,
      html: `<p>Hello!</p><p>Please find the generated resume for <b>${studentName || "the candidate"}</b> attached to this email.</p><br/><i>Auto-generated Document</i>`,
      attachments: [
        {
          filename: `${studentName?.replace(/\s+/g, '_') || "Resume"}.jpeg`,
          content: base64Content,
        },
      ],
    });

    if (error) {
       console.error("Resend delivery failed:", error);
       
       // Handle common Resend onboarding restriction
       if (fromEmail === "onboarding@resend.dev") {
           return NextResponse.json({ error: "Resend Free tier limit: You can ONLY send emails to the email address you registered your Resend account with. To send to anyone else, verify your domain in Resend.com!" }, { status: 403 });
       }
       
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update internal counter
    await metricsCollection.updateOne(
      { month: currentYearMonth },
      { $inc: { count: 1 } }
    );
    
    // Log tracking for admin analytics
    await getResumeCollection().insertOne({
       studentName: studentName || "Anonymous Sender",
       department: `Sent to ${recipient}`,
       createdAt: new Date().toISOString(),
       action: "EMAIL_SENT"
    });

    return NextResponse.json({ message: "Email dispatched successfully!", id: data?.id }, { status: 200 });

  } catch (err: any) {
    console.error("Email API Route Error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}
