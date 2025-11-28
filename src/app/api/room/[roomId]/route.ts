import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

// Initialize Redis client using Upstash environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

interface StoredFile {
  name: string
  size: number
  url: string
  publicId: string
  uploadedBy: string
  uploadedAt: number
  expiresAt: number
}

interface RoomData {
  files: StoredFile[]
  createdAt: number
}

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params

    const roomKey = `room:${roomId}`
    const roomData = (await redis.get(roomKey)) as RoomData | null

    if (!roomData) {
      return NextResponse.json({ files: [] })
    }

    // Filter out expired files
    const now = Date.now()
    const activeFiles = roomData.files.filter((file) => file.expiresAt > now)

    // Update room data if expired files were removed
    if (activeFiles.length !== roomData.files.length) {
      if (activeFiles.length === 0) {
        await redis.del(roomKey)
      } else {
        await redis.setex(roomKey, 30 * 60, JSON.stringify({ ...roomData, files: activeFiles }))
      }
    }

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

    const roomKey = `room:${roomId}`
    let roomData = (await redis.get(roomKey)) as RoomData | null

    if (!roomData) {
      roomData = {
        files: [],
        createdAt: Date.now(),
      }
    }

    const expiresAt = Date.now() + 3 * 60 * 1000 // 3 minutes

    const newFile: StoredFile = {
      name: fileInfo.name,
      size: fileInfo.size,
      url: fileInfo.url,
      publicId: fileInfo.publicId,
      uploadedBy: userId,
      uploadedAt: Date.now(),
      expiresAt,
    }

    roomData.files.push(newFile)

    // Store in Redis with 30 minute expiration
    await redis.setex(roomKey, 30 * 60, JSON.stringify(roomData))

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
