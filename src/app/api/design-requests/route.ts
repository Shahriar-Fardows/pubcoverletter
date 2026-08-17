import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

const collection = () => mongoose.connection.collection("design_requests")

// 5 MB — ei ta theke boro file cloudinary te pathabo na
const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]

// DD/MM/YYYY — site er baki jaygar moto same format
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${date.getFullYear()}`
}

type UploadResult = { url: string; publicId: string }

// Cloudinary env missing thakle purro route jate crash na kore — lazy import
const uploadToCloudinary = async (file: File): Promise<UploadResult | null> => {
  try {
    const { cloudinary } = await import("@/lib/cloudinary")

    const bytes = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "pubcoverletter/design-requests",
      resource_type: "auto",
    })

    return { url: result.secure_url, publicId: result.public_id }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return null
  }
}

/* ======================================================
   GET → shob design request (admin panel er jonno)
====================================================== */
export async function GET() {
  try {
    const connected = await connectDB()

    if (!connected) {
      return NextResponse.json(
        { data: [], total: 0, message: "Database not connected" },
        { status: 200 },
      )
    }

    const total = await collection().countDocuments()
    const requests = await collection().find({}).sort({ _id: -1 }).toArray()

    return NextResponse.json({ total, data: requests })
  } catch (error) {
    console.error("GET Design Request Error:", error)
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
   POST → notun design request (file upload soho)
====================================================== */
export async function POST(request: Request) {
  try {
    const connected = await connectDB()

    if (!connected) {
      return NextResponse.json(
        { message: "Database not connected" },
        { status: 503 },
      )
    }

    const formData = await request.formData()

    // Honeypot — bot filled korle chup chap reject
    const honeypot = String(formData.get("website") || "")
    if (honeypot.trim() !== "") {
      return NextResponse.json({ message: "Spam detected" }, { status: 400 })
    }

    const name = String(formData.get("name") || "").trim()
    const studentId = String(formData.get("studentId") || "").trim()
    const email = String(formData.get("email") || "").trim()
    const department = String(formData.get("department") || "").trim()
    const templateName = String(formData.get("templateName") || "").trim()
    const description = String(formData.get("description") || "").trim()
    const referenceLink = String(formData.get("referenceLink") || "").trim()

    if (!name || !studentId || !email || !description) {
      return NextResponse.json(
        { message: "Name, student ID, email and description are required!" },
        { status: 400 },
      )
    }

    const file = formData.get("designFile")
    let design: UploadResult | null = null
    let fileName = ""

    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { message: "Only PNG, JPG, WEBP or PDF files are allowed." },
          { status: 400 },
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "File is too large. Maximum size is 5 MB." },
          { status: 400 },
        )
      }

      fileName = file.name
      design = await uploadToCloudinary(file)

      if (!design) {
        return NextResponse.json(
          { message: "Could not upload the design file. Please try again." },
          { status: 502 },
        )
      }
    }

    // File nai, link o nai — tahole amra kichu dekhte parbo na
    if (!design && !referenceLink) {
      return NextResponse.json(
        { message: "Please upload a design file or share a reference link." },
        { status: 400 },
      )
    }

    const now = new Date()

    const result = await collection().insertOne({
      name,
      studentId,
      email,
      department,
      templateName,
      description,
      referenceLink,
      fileName,
      designUrl: design?.url || "",
      designPublicId: design?.publicId || "",
      status: "pending", // pending | in-progress | published | rejected
      createDate: formatDate(now),
      createdAt: now.toISOString(),
    })

    return NextResponse.json(
      { message: "Design request submitted!", id: result.insertedId },
      { status: 201 },
    )
  } catch (error) {
    console.error("POST Design Request Error:", error)
    return NextResponse.json(
      {
        message: "POST Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
