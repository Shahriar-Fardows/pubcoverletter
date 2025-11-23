import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

const collection = () => mongoose.connection.collection("students")

interface StudentPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// Helper: Convert ISO date to DD/MM/YYYY
const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/* ======================================================
   GET → List ALL data (NO LIMIT) + Advanced Search + Multi-field Filtering + Sorting
====================================================== */
export async function GET(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}

    // All normal filters except special keys (sort / search)
    for (const [key, value] of searchParams.entries()) {
      if (!["sort", "sortField", "searchFields", "searchQuery"].includes(key)) {
        if (value && value.trim()) {
          if (
            key === "name" ||
            key === "studentName" ||
            key === "courseName" ||
            key === "teacherName" ||
            key === "department" ||
            key === "section"
          ) {
            // Text fields → case-insensitive regex search
            query[key] = { $regex: value, $options: "i" }
          } else {
            // Exact match for other fields
            query[key] = value
          }
        }
      }
    }

    // Global search across multiple fields
    const searchQuery = searchParams.get("searchQuery")
    const searchFields = searchParams.get("searchFields")?.split(",") || ["studentName"]

    if (searchQuery && searchQuery.trim()) {
      query.$or = searchFields.map((field) => ({
        [field]: { $regex: searchQuery, $options: "i" },
      }))
    }

    // Sorting
    const sortOption = searchParams.get("sort") ?? "newest" // newest | oldest
    const sortField = searchParams.get("sortField") ?? "_id"
    const sortQuery: { [key: string]: 1 | -1 } =
      sortOption === "oldest" ? { [sortField]: 1 } : { [sortField]: -1 }

    // Count total matched documents
    const total = await collection().countDocuments(query)

    // NO LIMIT → সব ডাটা একসাথে
    const students = await collection().find(query).sort(sortQuery).toArray()

    return NextResponse.json({
      total,
      data: students,
    })
  } catch (error) {
    console.error("GET Error:", error)
    return NextResponse.json(
      {
        message: "GET Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/* ======================================================
   POST → Insert with flexible fields
====================================================== */
export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ message: "Request body cannot be empty!" }, { status: 400 })
    }

    const payload: StudentPayload = { ...body }

    // Auto-format date fields (ISO → DD/MM/YYYY)
    for (const [key, value] of Object.entries(payload)) {
      if ((key.toLowerCase().includes("date") || key === "createDate") && value) {
        if (typeof value === "string" && value.includes("T")) {
          payload[key] = formatDate(value)
        }
      }
    }

    const result = await collection().insertOne(payload)

    return NextResponse.json({ message: "Record saved!", id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("POST Error:", error)
    return NextResponse.json(
      {
        message: "POST Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/* ======================================================
   PUT → Update with flexible fields
====================================================== */
export async function PUT(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "ID is required!" }, { status: 400 })
    }

    const body = await request.json()

    const updatePayload: StudentPayload = { ...body }

    // Date string (YYYY-MM-DD) → DD/MM/YYYY
    for (const [key, value] of Object.entries(updatePayload)) {
      if (key.toLowerCase().includes("date") && value) {
        if (typeof value === "string" && value.includes("-") && !value.includes("/")) {
          const parts = value.split("-")
          updatePayload[key] = `${parts[2]}/${parts[1]}/${parts[0]}`
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 })
    }

    const result = await collection().updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updatePayload },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Record updated!",
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error("PUT Error:", error)
    return NextResponse.json(
      {
        message: "PUT Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

/* ======================================================
   DELETE → Delete with flexible ID support
====================================================== */
export async function DELETE(request: Request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ message: "ID is required!" }, { status: 400 })
    }

    const result = await collection().deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Record deleted!",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("DELETE Error:", error)
    return NextResponse.json(
      {
        message: "DELETE Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
