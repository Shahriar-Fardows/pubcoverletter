import { NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { folder = "temp_shares" } = body

    if (!process.env.CLOUDINARY_API_SECRET) {
      throw new Error("CLOUDINARY_API_SECRET missing")
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET)

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    })
  } catch (error) {
    console.error("Signature error:", error)
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 })
  }
}
