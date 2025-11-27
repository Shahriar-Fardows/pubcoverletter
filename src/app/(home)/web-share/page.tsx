"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import QRCode from "qrcode";
import {
  Download,
  Share2,
  Wifi,
  Clock,
  Users,
  Upload,
  Copy,
  Check,
} from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  url: string;
  publicId: string;
  uploadedBy?: string;
  expiresAt?: number;
}

interface ConnectedDevice {
  userId: string;
  socketId: string;
}

export default function WebSharePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>(
    []
  );
  const [receivedFiles, setReceivedFiles] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // 1) Session create
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        setSessionId(data.sessionId);
      } catch (err) {
        console.error("Session create error:", err);
      }
    };
    createSession();
  }, []);

  // 2) QR code generate
  useEffect(() => {
    if (!sessionId) return;

    const joinUrl = `${window.location.origin}/web-share/join?session=${sessionId}`;

    QRCode.toDataURL(joinUrl, (err, url) => {
      if (err) console.error(err);
      else setQrCodeUrl(url);
    });
  }, [sessionId]);

  // 3) Socket connection
  useEffect(() => {
    if (!sessionId) return;

    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ PC connected:", socket.id);
      // ✅ FIX: userId bhejcho (generate korchi or session use korchi)
      socket.emit("join-room", sessionId, `web-${sessionId.slice(0, 8)}`);
      setIsConnected(true);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err);
      setIsConnected(false);
    });

    socket.on("user-connected", (data: ConnectedDevice) => {
      setConnectedDevices((prev) => {
        const exists = prev.some((d) => d.userId === data.userId);
        return exists ? prev : [...prev, data];
      });
    });

    socket.on("existing-files", (files: FileInfo[]) => {
      setReceivedFiles(files);
    });

    // ✅ FIX: Proper file-received payload handling
    socket.on("file-received", (fileInfo: FileInfo) => {
      setReceivedFiles((prev) => [...prev, fileInfo]);

      // ✅ Start 3-minute countdown timer
      if (fileInfo.expiresAt) {
        const timeoutId = setTimeout(() => {
          setReceivedFiles((prev) =>
            prev.filter((f) => f.publicId !== fileInfo.publicId)
          );
          fileTimersRef.current.delete(fileInfo.publicId);
        }, Math.max(0, fileInfo.expiresAt - Date.now()));

        fileTimersRef.current.set(fileInfo.publicId, timeoutId);
      }
    });

    // ✅ FIX: Handle file expiration event
    socket.on("file-expired", (data: { publicId: string; message?: string }) => {
      setReceivedFiles((prev) =>
        prev.filter((f) => f.publicId !== data.publicId)
      );
      fileTimersRef.current.delete(data.publicId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      fileTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, [sessionId]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!sessionId || !socketRef.current) {
      alert("⏳ Session loading... Please wait.");
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      alert("📦 File size must be less than 1GB");
      return;
    }

    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "temp_shares" }),
      });

      if (!signRes.ok) throw new Error("Failed to get signature");

      const {
        signature,
        timestamp,
        cloud_name,
        api_key,
        folder,
      }: {
        signature: string;
        timestamp: number;
        cloud_name: string;
        api_key: string;
        folder?: string;
      } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder || "temp_shares");

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        true
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onerror = () => {
        console.error("Upload failed");
        setUploadProgress(0);
        alert("❌ Upload failed. Please try again.");
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            url: response.secure_url,
            publicId: response.public_id,
          };

          socketRef.current?.emit("file-info", {
            roomId: sessionId,
            fileInfo,
            publicId: response.public_id,
            userId: `web-${sessionId.slice(0, 8)}`,
          });

          setUploadProgress(0);
        } else {
          console.error("Upload error:", xhr.responseText);
          setUploadProgress(0);
          alert("❌ Upload failed. Please try again.");
        }
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(0);
      alert("❌ Something went wrong. Please try again.");
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeRemaining = (expiresAt?: number) => {
    if (!expiresAt) return "∞";
    const remaining = Math.max(0, expiresAt - Date.now());
    return `${Math.ceil(remaining / 1000)}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">
              Web Share Session
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Share Files Instantly
          </h1>
          <p className="text-gray-600">
            Scan QR or share code • Auto-delete in 3 minutes • Up to 1GB
          </p>
        </div>

        {!sessionId ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
            <p className="mt-4 text-center text-gray-600">
              Creating your session...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR & Session Code Card */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* QR Code */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Scan QR Code
                </h2>
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="h-48 w-48 rounded-lg border-2 border-gray-100"
                    />
                  </div>
                )}
              </div>

              {/* Session Code */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Session Code
                </h2>
                <div className="space-y-3">
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <p className="font-mono text-2xl font-bold text-blue-600">
                      {sessionId}
                    </p>
                  </div>
                  <button
                    onClick={copySessionId}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2 text-white transition hover:bg-blue-600"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Status & Devices */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Connection Badge */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connection Status</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-3 ${
                      isConnected ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Wifi
                      className={`h-6 w-6 ${
                        isConnected ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Connected Devices */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connected Devices</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {connectedDevices.length}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                {connectedDevices.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    {connectedDevices.map((device) => (
                      <div
                        key={device.userId}
                        className="rounded bg-blue-50 px-3 py-2 text-xs text-gray-600"
                      >
                        {device.userId}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Section */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Share a File
              </h2>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-8 transition hover:border-blue-500 hover:bg-blue-100"
              >
                <Upload className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-blue-600">
                  Click to select file (max 1GB)
                </span>
              </label>

              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-semibold text-gray-900">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Received Files */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                📥 Received Files ({receivedFiles.length})
              </h2>

              {receivedFiles.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-8 text-center">
                  <p className="text-gray-600">
                    No files received yet. Waiting for files...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedFiles.map((file) => (
                    <div
                      key={file.publicId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 transition hover:border-gray-300"
                    >
                      <div className="flex-1 min-w-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-medium text-blue-600 underline hover:text-blue-700"
                          title={file.name}
                        >
                          📄 {file.name}
                        </a>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          {file.uploadedBy && (
                            <span>From: {file.uploadedBy}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {getTimeRemaining(file.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download={file.name}
                        className="ml-4 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}