import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const getResumeCollection = () => mongoose.connection.collection("generated_resumes");

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Sorting
    const sortOption = searchParams.get("sort") ?? "newest"; // newest | oldest
    const sortQuery: { [key: string]: 1 | -1 } = sortOption === "oldest" ? { _id: 1 } : { _id: -1 };

    const total = await getResumeCollection().countDocuments();
    const resumes = await getResumeCollection().find({}).sort(sortQuery).toArray();

    return NextResponse.json({
      total,
      data: resumes,
    });
  } catch (error) {
    console.error("GET Resume Error:", error);
    return NextResponse.json(
      { message: "GET Error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body || !body.studentName) {
      return NextResponse.json({ message: "Student Name is required!" }, { status: 400 });
    }

    const payload = {
      ...body,
      createdAt: new Date().toISOString()
    };

    const result = await getResumeCollection().insertOne(payload);

    return NextResponse.json({ message: "Resume generation tracked!", id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("POST Resume Error:", error);
    return NextResponse.json(
      { message: "POST Error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
