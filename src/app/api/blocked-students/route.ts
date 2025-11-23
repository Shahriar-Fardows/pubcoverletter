import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

// Mongo collection
const collection = () => mongoose.connection.collection("blocked_students")

interface BlockPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

/* ======================================================
   GET → Get all blocked students OR by studentId
   - GET /api/blocked-students
   - GET /api/blocked-students?studentId=12345
====================================================== */
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    const query: Record<string, unknown> = {}

    if (studentId) {
      query.studentId = studentId
    }

    const blocks = await collection().find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      total: blocks.length,
      data: blocks,
    })
  } catch (error) {
    console.error("BLOCK GET Error:", error)
    return NextResponse.json(
      {
        message: "BLOCK GET Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/* ======================================================
   POST → Add studentId to block list
   - POST /api/blocked-students
   body: { studentId: "12345", reason?: "Spam", note?: "optional" }
====================================================== */
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()

    const payload: BlockPayload = { ...body }

    const studentId = payload.studentId

    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      return NextResponse.json(
        { message: "studentId is required" },
        { status: 400 },
      )
    }

    // optional: prevent duplicate block for same studentId
    const existing = await collection().findOne({ studentId })
    if (existing) {
      return NextResponse.json(
        { message: "This studentId is already blocked", id: existing._id },
        { status: 200 },
      )
    }

    payload.studentId = studentId.trim()
    payload.createdAt = new Date().toISOString()

    const result = await collection().insertOne(payload)

    return NextResponse.json(
      {
        message: "Student blocked successfully",
        id: result.insertedId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("BLOCK POST Error:", error)
    return NextResponse.json(
      {
        message: "BLOCK POST Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/* ======================================================
   DELETE → Remove from block list
   - DELETE /api/blocked-students?id=<mongoId>
   - OR DELETE /api/blocked-students?studentId=12345
====================================================== */
export async function DELETE(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const studentId = searchParams.get("studentId")

    if (!id && !studentId) {
      return NextResponse.json(
        { message: "Either id or studentId is required" },
        { status: 400 },
      )
    }

    const query: Record<string, unknown> = {}

    if (id) {
      query._id = new mongoose.Types.ObjectId(id)
    } else if (studentId) {
      query.studentId = studentId
    }

    const result = await collection().deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Blocked record not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      message: "Unblocked successfully",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("BLOCK DELETE Error:", error)
    return NextResponse.json(
      {
        message: "BLOCK DELETE Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
