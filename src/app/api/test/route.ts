import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  const connected = await connectDB();

  if (!connected) return NextResponse.json({ data: [], total: 0, message: "Database not connected" }, { status: 200 });

  return NextResponse.json({ message: "Database connected successfully!" });
}
