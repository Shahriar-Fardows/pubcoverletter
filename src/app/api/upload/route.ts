// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export async function POST() {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // optional: jodi client theke folder name pathate chao,
    // tokhon Request body parse kore nite hobe.
    const folder = "temp_shares";

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Signature error:", error);
    return NextResponse.json(
      { error: "Failed to get signature" },
      { status: 500 }
    );
  }
}
