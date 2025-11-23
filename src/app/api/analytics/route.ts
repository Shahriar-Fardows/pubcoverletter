import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { path } = await req.json();

    if (!path) {
      return NextResponse.json({ message: "Path is required" }, { status: 400 });
    }

    await connectDB();

    const db = mongoose.connection.db!;
    const collection = db.collection("pageviews");

    const now = new Date();

    // Daily format (YYYY-MM-DD)
    const day = now.toISOString().split("T")[0];

    // Monthly format (YYYY-MM)
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Yearly format (YYYY)
    const year = `${now.getFullYear()}`;

    // 1️⃣ Daily increment
    await collection.updateOne(
      { type: "daily", path, date: day },
      { $inc: { views: 1 }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // 2️⃣ Monthly increment
    await collection.updateOne(
      { type: "monthly", path, date: month },
      { $inc: { views: 1 }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // 3️⃣ Yearly increment
    await collection.updateOne(
      { type: "yearly", path, date: year },
      { $inc: { views: 1 }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    return NextResponse.json({ message: "Tracked" });
  } catch (err) {
    console.error("Analytics Error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
