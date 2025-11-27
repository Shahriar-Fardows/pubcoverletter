// pages/api/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";
import { Server as IOServer } from "socket.io";
import type { Socket as NetSocket } from "net";
import { cloudinary } from "../../../lib/cloudinary";

export const config = {
  api: {
    bodyParser: false, // socket.io er jonno bodyParser off
  },
};

type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io?: IOServer;
    };
  };
};

// File info type – ichchha moto extend korte parba
export type FileInfo = {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  [key: string]: unknown;
};

export type FileInfoEventPayload = {
  roomId: string;   // eta sessionId hobe
  fileInfo: FileInfo;
  publicId: string; // cloudinary public_id
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log("🔌 Initializing Socket.io...");

    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("✅ User connected:", socket.id);

      // client theke:
      // socket.emit("join-room", sessionId)
      socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        console.log(`👥 ${socket.id} joined room ${roomId}`);

        // onno device ke notify
        socket.to(roomId).emit("user-connected", socket.id);
      });

      // client theke:
      // socket.emit("file-info", { roomId, fileInfo, publicId })
      socket.on("file-info", async (data: FileInfoEventPayload) => {
        console.log("📁 File-info received:", data.publicId);

        // oi room e onno device ke file info pathao
        socket.to(data.roomId).emit("file-received", data.fileInfo);

        // 3 min pore file delete + file-expired event
        const TTL_MS = 3 * 60 * 1000; // iccha hole 10 min etc korte parba

        setTimeout(async () => {
          try {
            const result = await cloudinary.uploader.destroy(data.publicId);
            console.log(`🗑️ File deleted: ${data.publicId}`, result);

            // room er shob client ke bolo je file expire
            io.to(data.roomId).emit("file-expired", data.publicId);
          } catch (error) {
            console.error("❌ Failed to delete file:", error);
          }
        }, TTL_MS);
      });

      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
      });
    });
  } else {
    console.log("♻️ Socket.io already running");
  }

  res.end();
}
