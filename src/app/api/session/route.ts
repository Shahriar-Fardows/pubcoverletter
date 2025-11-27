import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const sessionId = uuidv4()

    const response = NextResponse.json({
      sessionId,
      createdAt: new Date().toISOString(),
    })

    response.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
