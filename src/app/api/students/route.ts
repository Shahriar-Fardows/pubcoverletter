import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

const collection = () => mongoose.connection.collection("students");

// Interface for type safety
interface StudentPayload {
  studentId: string | number;
  studentName: string;
  section: string;
  batch: string;
  department: string;
  courseName: string;
  teacherName: string;
  createDate?: string;
}

// Helper: Convert ISO date to DD/MM/YYYY
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/* ======================================================
   GET → List + Search + Sorting
====================================================== */
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Filters
    const name = searchParams.get("name") ?? undefined;
    const id = searchParams.get("id") ?? undefined;
    const course = searchParams.get("course") ?? undefined;

    // Sorting
    const sortOption = searchParams.get("sort") ?? "newest";
    const sortQuery: { [key: string]: 1 | -1 } = sortOption === "oldest" ? { _id: 1 } : { _id: -1 };

    // Query Builder
    const query: Record<string, unknown> = {};

    if (name) query.studentName = { $regex: name, $options: "i" };
    if (id) query.studentId = id;
    if (course) query.courseName = { $regex: course, $options: "i" };

    const total = await collection().countDocuments(query);

    const students = await collection()
      .find(query)
      .sort(sortQuery)
      .toArray();

    return NextResponse.json({
      total,
      data: students,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      {
        message: "GET Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
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

    // ✅ Strict Validation - Required fields must not be empty
    if (!body.studentId || body.studentId.toString().trim() === "") {
      return NextResponse.json(
        { message: "studentId is required!" },
        { status: 400 }
      );
    }

    if (!body.studentName || body.studentName.trim() === "") {
      return NextResponse.json(
        { message: "studentName is required!" },
        { status: 400 }
      );
    }

    if (!body.courseName || body.courseName.trim() === "") {
      return NextResponse.json(
        { message: "courseName is required!" },
        { status: 400 }
      );
    }

    if (!body.department || body.department.toString().trim() === "") {
      return NextResponse.json(
        { message: "department is required!" },
        { status: 400 }
      );
    }

    // Format date as DD/MM/YYYY if not already
    let createDate = body.createDate || formatDate(new Date());
    
    // If date comes in ISO format, convert it
    if (createDate.includes("T")) {
      createDate = formatDate(createDate);
    }

    const payload: StudentPayload = {
      studentId: body.studentId.toString(),
      studentName: body.studentName.trim(),
      section: body.section?.trim() || "",
      batch: body.batch?.trim() || "",
      department: body.department.trim(),
      courseName: body.courseName.trim(),
      teacherName: body.teacherName?.trim() || "",
      createDate: createDate,
    };

    const result = await collection().insertOne(payload);

    return NextResponse.json(
      { message: "Student saved!", id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      {
        message: "POST Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
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

    // Type-safe update payload
    const updatePayload: Partial<StudentPayload> = {};

    if (body.studentId !== undefined) updatePayload.studentId = body.studentId;
    if (body.studentName !== undefined) updatePayload.studentName = body.studentName;
    if (body.section !== undefined) updatePayload.section = body.section;
    if (body.department !== undefined) updatePayload.department = body.department;
    if (body.courseName !== undefined) updatePayload.courseName = body.courseName;
    if (body.teacherName !== undefined) updatePayload.teacherName = body.teacherName;

    // Handle date conversion
    if (body.createDate !== undefined) {
      // If date comes from frontend as YYYY-MM-DD, convert to DD/MM/YYYY
      if (body.createDate.includes("-")) {
        const parts = body.createDate.split("-");
        updatePayload.createDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      } else {
        // If already in correct format, keep it
        updatePayload.createDate = body.createDate;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    const result = await collection().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Student updated!",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      {
        message: "PUT Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
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

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Student deleted!",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      {
        message: "DELETE Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}