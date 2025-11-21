import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type FeedbackBody = {
  name?: string;
  email?: string;
  message?: string;
  humanAnswer?: string;
  challengeA?: string | number;
  challengeB?: string | number;
  honeypot?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FeedbackBody;
    const {
      name,
      email,
      message,
      humanAnswer,
      challengeA,
      challengeB,
      honeypot,
    } = body;

    // Honeypot check – jodi filled thake tahole bot dhore reject
    if (honeypot && honeypot.trim() !== "") {
      return NextResponse.json(
        { error: "Spam detected" },
        { status: 400 }
      );
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Human verification (simple math)
    const a = Number(challengeA);
    const b = Number(challengeB);
    const ans = Number(humanAnswer);

    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(ans)) {
      return NextResponse.json(
        { error: "Invalid verification data" },
        { status: 400 }
      );
    }

    if (a + b !== ans) {
      return NextResponse.json(
        { error: "Human verification failed" },
        { status: 400 }
      );
    }

    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;

    if (!formspreeEndpoint) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Submit to Formspree
    const formData = new URLSearchParams({
      name,
      email,
      message,
    });

    const fsRes = await fetch(formspreeEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!fsRes.ok) {
      return NextResponse.json(
        { error: "Formspree error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
