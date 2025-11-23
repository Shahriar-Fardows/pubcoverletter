import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const collection = () => mongoose.connection.collection("students");

/* ======================================================
   GET → List + Search  + Sorting
====================================================== */

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Filters
    const name = searchParams.get("name") ?? undefined;
    const id = searchParams.get("id") ?? undefined;
    const course = searchParams.get("course") ?? undefined;

    // Sorting (TypeScript-safe)
    const sortOption = searchParams.get("sort") ?? "newest";
    const sortQuery =
      sortOption === "oldest"
        ? ({ _id: "asc" } as const)
        : ({ _id: "desc" } as const);

    // Query Builder
    const query: Record<string, unknown> = {};

    if (name) query.studentName = { $regex: name, $options: "i" };
    if (id) query.studentId = id;
    if (course) query.courseName = { $regex: course, $options: "i" };

    const total = await collection().countDocuments(query);

    const students = await collection()
      .find(query)
      .sort(sortQuery)
      .toArray(); // ← pagination removed

    return NextResponse.json({
      total,
      data: students, // ← only data + total
    });
  } catch (error) {
    return NextResponse.json(
      { message: "GET Error", error },
      { status: 500 }
    );
  }
}


/* ======================================================
   POST → Insert student
====================================================== */
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const payload = {
      studentId: body.studentId,
      studentName: body.studentName,
      section: body.section,
      department: body.department,
      courseName: body.courseName,
      teacherName: body.teacherName,
      createDate: new Date().toISOString(),
    };

    const result = await collection().insertOne(payload);

    return NextResponse.json(
      { message: "Student saved!", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "POST Error", error },
      { status: 500 }
    );
  }
}

/* ======================================================
   PUT → Update student (Requires ?id=)
====================================================== */
export async function PUT(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Student ID is required!" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = await collection().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: body }
    );

    return NextResponse.json({
      message: "Student updated!",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "PUT Error", error },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE → Delete student (Requires ?id=)
====================================================== */
export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Student ID is required!" },
        { status: 400 }
      );
    }

    const result = await collection().deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    return NextResponse.json({
      message: "Student deleted!",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "DELETE Error", error },
      { status: 500 }
    );
  }
}
