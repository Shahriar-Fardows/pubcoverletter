import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const activeFiles = new Map<
  string,
  {
    publicId: string
    roomId: string
    expiresAt: number
  }
>()

export async function GET(req: NextRequest) {
  console.log("[v0] Socket API endpoint called")
  return NextResponse.json({ message: "Socket.io endpoint" })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (action === "file-info") {
      const expiresAt = Date.now() + 3 * 60 * 1000
      activeFiles.set(data.publicId, {
        publicId: data.publicId,
        roomId: data.roomId,
        expiresAt,
      })

      setTimeout(
        () => {
          activeFiles.delete(data.publicId)
        },
        3 * 60 * 1000,
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false })
  } catch (error) {
    console.error("[v0] Socket API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
