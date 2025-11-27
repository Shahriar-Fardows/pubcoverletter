import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as IOServer } from "socket.io"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = Number.parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const activeFiles = new Map<
  string,
  {
    publicId: string
    roomId: string
    expiresAt: number
    timeoutId: NodeJS.Timeout
  }
>()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Initialize Socket.io
  const io = new IOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectTimeout: 100000,
    pingInterval: 25000,
    pingTimeout: 60000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e9, // 1GB
  })

  // Socket.io connection handler
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id)

    socket.on("join-room", (roomId: string, userId: string) => {
      socket.join(roomId)
      socket.data.userId = userId
      socket.data.roomId = roomId
      console.log(`👥 User ${userId} joined room ${roomId}`)

      // Notify others
      socket.to(roomId).emit("user-connected", {
        userId,
        socketId: socket.id,
      })

      // Send existing files
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roomFiles: any[] = []
      activeFiles.forEach((file) => {
        if (file.roomId === roomId) {
          roomFiles.push({
            publicId: file.publicId,
            expiresAt: file.expiresAt,
          })
        }
      })
      socket.emit("existing-files", roomFiles)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("file-info", (data: any) => {
      console.log("📁 File received:", data.publicId, "by", data.userId)
      const expiresAt = Date.now() + 3 * 60 * 1000 // 3 minutes
      const timeoutId = setTimeout(
        () => {
          deleteFile(data.publicId, data.roomId, io)
        },
        3 * 60 * 1000,
      )

      activeFiles.set(data.publicId, {
        publicId: data.publicId,
        roomId: data.roomId,
        expiresAt,
        timeoutId,
      })

      socket.to(data.roomId).emit("file-received", {
        ...data.fileInfo,
        uploadedBy: data.userId,
        expiresAt,
      })
    })

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id)
    })

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error)
    })
  })

  async function deleteFile(publicId: string, roomId: string, io: IOServer) {
    try {
      const { cloudinary } = await import("@/lib/cloudinary")
      const result = await cloudinary.uploader.destroy(publicId)
      console.log(`🗑️ File deleted: ${publicId}`, result)
      activeFiles.delete(publicId)
      io.to(roomId).emit("file-expired", {
        publicId,
        message: "File expired after 3 minutes",
      })
    } catch (error) {
      console.error("❌ Delete error:", error)
    }
  }

  httpServer.listen(port, () => {
    console.log(`🚀 Server running at http://${hostname}:${port}`)
  })
})
