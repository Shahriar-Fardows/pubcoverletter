import { NextResponse } from "next/server"

const roomsData = new Map<
  string,
  {
    files: Array<{
      name: string
      size: number
      url: string
      publicId: string
      uploadedBy: string
      uploadedAt: number
      expiresAt: number
    }>
    createdAt: number
  }
>()

// Cleanup expired files
setInterval(() => {
  const now = Date.now()
  roomsData.forEach((room, roomId) => {
    room.files = room.files.filter((file) => file.expiresAt > now)
    if (room.files.length === 0 && now - room.createdAt > 30 * 60 * 1000) {
      roomsData.delete(roomId)
    }
  })
}, 10000) // Cleanup every 10 seconds

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const room = roomsData.get(roomId)

    if (!room) {
      return NextResponse.json({ files: [] })
    }

    // Filter out expired files
    const now = Date.now()
    const activeFiles = room.files.filter((file) => file.expiresAt > now)

    return NextResponse.json({
      files: activeFiles.map((file) => ({
        ...file,
        timeRemaining: Math.max(0, file.expiresAt - now),
      })),
    })
  } catch (error) {
    console.error("[v0] GET room error:", error)
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const body = await request.json()
    const { fileInfo, userId } = body

    if (!fileInfo || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Initialize room if not exists
    if (!roomsData.has(roomId)) {
      roomsData.set(roomId, {
        files: [],
        createdAt: Date.now(),
      })
    }

    const room = roomsData.get(roomId)!
    const expiresAt = Date.now() + 3 * 60 * 1000 // 3 minutes

    const newFile = {
      name: fileInfo.name,
      size: fileInfo.size,
      url: fileInfo.url,
      publicId: fileInfo.publicId,
      uploadedBy: userId,
      uploadedAt: Date.now(),
      expiresAt,
    }

    room.files.push(newFile)

    console.log(`[v0] File added to room ${roomId}: ${fileInfo.name}`)

    return NextResponse.json({
      success: true,
      file: {
        ...newFile,
        timeRemaining: expiresAt - Date.now(),
      },
    })
  } catch (error) {
    console.error("[v0] POST room error:", error)
    return NextResponse.json({ error: "Failed to add file" }, { status: 500 })
  }
}
