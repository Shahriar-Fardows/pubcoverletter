import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    const connected = await connectDB();
    if (!connected) return NextResponse.json({ data: [], total: 0, message: "Database not connected" }, { status: 200 });

    const data = await mongoose.connection.db!
      .collection("pageviews")
      .find({ type: "yearly" })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Analytics Yearly Error:", error);
    return NextResponse.json({ data: [], message: "Internal server error" }, { status: 500 });
  }
}
