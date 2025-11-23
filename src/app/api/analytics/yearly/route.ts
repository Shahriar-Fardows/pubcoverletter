import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  await connectDB();
  const data = await mongoose.connection.db!
    .collection("pageviews")
    .find({ type: "yearly" })
    .sort({ date: -1 })
    .toArray();

  return NextResponse.json(data);
}
