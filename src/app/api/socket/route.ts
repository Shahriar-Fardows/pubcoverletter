import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Server as NetServer } from "http";
import { Server as IOServer } from "socket.io";
import type { Socket as NetSocket } from "net";
import { cloudinary } from "@/lib/cloudinary";

// ✅ FIX: App Router doesn't need bodyParser config

type NextApiResponseServerIO = {
  socket: NetSocket & {
    server: NetServer & {
      io?: IOServer;
    };
  };
};

export type FileInfo = {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  publicId?: string;
  uploadedAt?: number;
  [key: string]: unknown;
};

export type FileInfoEventPayload = {
  roomId: string;
  fileInfo: FileInfo;
  publicId: string;
  userId: string;
};

// ✅ In-memory tracking
const activeFiles = new Map<
  string,
  {
    publicId: string;
    roomId: string;
    expiresAt: number;
    timeoutId: NodeJS.Timeout;
  }
>();

export async function GET(request: NextRequest) {
  return handleSocket(request);
}

export async function POST(request: NextRequest) {
  return handleSocket(request);
}

async function handleSocket(request: NextRequest) {
  // Get the raw Node.js request/response from the adapter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socket = (request as any).socket as NetSocket | undefined;

  if (!socket) {
    return NextResponse.json(
      { error: "WebSocket not supported" },
      { status: 400 }
    );
  }

  const res = {
    socket: socket as NetSocket & {
      server: NetServer & {
        io?: IOServer;
      };
    },
  };

  if (!res.socket.server.io) {
    console.log("🔌 Initializing Socket.io...");

    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      transports: ["polling", "websocket"],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      connectTimeout: 10000,
      pingInterval: 25000,
      pingTimeout: 60000,
      allowUpgrades: true,
      maxHttpBufferSize: 1e9, // 1GB
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("✅ Connected:", socket.id, "Transport:", socket.conn.transport.name);

      // Join room with user identification
      socket.on("join-room", (roomId: string, userId: string) => {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;

        console.log(`👥 User ${userId} joined room ${roomId}`);

        // Broadcast to others in room
        socket.to(roomId).emit("user-connected", {
          userId,
          socketId: socket.id,
        });

        // Send existing files list to new user
        const roomFiles: FileInfo[] = [];
        activeFiles.forEach((file) => {
          if (file.roomId === roomId) {
            roomFiles.push({
              publicId: file.publicId,
              expiresAt: file.expiresAt,
            });
          }
        });
        socket.emit("existing-files", roomFiles);
      });

      // File upload info
      socket.on("file-info", (data: FileInfoEventPayload) => {
        console.log("📁 File received:", data.publicId, "by", data.userId);

        // Track this file
        const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes
        const timeoutId = setTimeout(() => {
          deleteFile(data.publicId, data.roomId, io);
        }, 3 * 60 * 1000);

        activeFiles.set(data.publicId, {
          publicId: data.publicId,
          roomId: data.roomId,
          expiresAt,
          timeoutId,
        });

        // Send to all in room with extra info
        socket.to(data.roomId).emit("file-received", {
          ...data.fileInfo,
          uploadedBy: data.userId,
          expiresAt,
        });
      });

      socket.on("disconnect", () => {
        console.log("❌ Disconnected:", socket.id);
      });

      socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });
    });
  } else {
    console.log("♻️ Socket.io already running");
  }

  // ✅ Return empty response for Socket.io handler
  return new NextResponse("WebSocket connection", { status: 200 });
}

// ✅ Separate delete function
async function deleteFile(
  publicId: string,
  roomId: string,
  io: IOServer
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ File deleted: ${publicId}`);

    // Remove from tracking
    activeFiles.delete(publicId);

    // Notify all users in room
    io.to(roomId).emit("file-expired", {
      publicId,
      message: "File expired after 3 minutes",
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
  }
}