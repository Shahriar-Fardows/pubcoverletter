"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Share2,
  Wifi,
  Clock,
  Upload,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  url: string;
  publicId: string;
  uploadedBy?: string;
  expiresAt?: number;
}

export default function JoinSharePage() {
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get("session");

  const [sessionId, setSessionId] = useState<string | null>(
    sessionFromUrl || null
  );
  const [manualInput, setManualInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Map<string, number>>(
    new Map()
  );
  const fileTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newMap = new Map(prev);
        let hasExpired = false;

        newMap.forEach((time, key) => {
          const newTime = time - 1;
          if (newTime <= 0) {
            newMap.delete(key);
            hasExpired = true;
          } else {
            newMap.set(key, newTime);
          }
        });

        if (hasExpired) {
          setReceivedFiles((prevFiles) =>
            prevFiles.filter((f) => newMap.has(f.publicId))
          );
        }

        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket connection
  useEffect(() => {
    if (!sessionId) return;

    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Mobile connected:", socket.id);
      socket.emit("join-room", sessionId, `mobile-${sessionId.slice(0, 8)}`);
      setIsConnected(true);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err);
      setIsConnected(false);
    });

    socket.on("existing-files", (files: FileInfo[]) => {
      setReceivedFiles(files);
      const timings = new Map<string, number>();
      files.forEach((f) => {
        if (f.expiresAt) {
          const remaining = Math.max(
            0,
            Math.ceil((f.expiresAt - Date.now()) / 1000)
          );
          timings.set(f.publicId, remaining);
        }
      });
      setTimeRemaining(timings);
    });

    socket.on("file-received", (fileInfo: FileInfo) => {
      setReceivedFiles((prev) => [...prev, fileInfo]);

      if (fileInfo.expiresAt) {
        const remaining = Math.max(
          0,
          Math.ceil((fileInfo.expiresAt - Date.now()) / 1000)
        );
        setTimeRemaining((prev) =>
          new Map(prev).set(fileInfo.publicId, remaining)
        );

        const timeoutId = setTimeout(() => {
          setReceivedFiles((prev) =>
            prev.filter((f) => f.publicId !== fileInfo.publicId)
          );
          setTimeRemaining((prev) => {
            const newMap = new Map(prev);
            newMap.delete(fileInfo.publicId);
            return newMap;
          });
          fileTimersRef.current.delete(fileInfo.publicId);
        }, Math.max(0, fileInfo.expiresAt - Date.now()));

        fileTimersRef.current.set(fileInfo.publicId, timeoutId);
      }
    });

    socket.on("file-expired", (data: { publicId: string; message?: string }) => {
      setReceivedFiles((prev) =>
        prev.filter((f) => f.publicId !== data.publicId)
      );
      setTimeRemaining((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.publicId);
        return newMap;
      });
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

  const handleManualJoin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setSessionId(manualInput.trim());
      setManualInput("");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!sessionId || !socketRef.current) {
      alert("⏳ Not connected yet");
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
        alert("❌ Upload failed");
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
            userId: `mobile-${sessionId.slice(0, 8)}`,
          });

          setUploadProgress(0);
          alert("✅ File shared successfully!");
        } else {
          setUploadProgress(0);
          alert("❌ Upload failed");
        }
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(0);
      alert("❌ Upload error");
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    );
  };

  // ============================================================
  // Join Screen (if no sessionId)
  // ============================================================
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">
              Join Session
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Join a Share Session
          </h1>
          <p className="mb-6 text-gray-600">
            Enter the session code to join and start sharing files instantly.
          </p>

          <form onSubmit={handleManualJoin} className="space-y-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              placeholder="Enter session code"
              maxLength={36}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-lg focus:border-purple-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-semibold text-white transition hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Session
            </button>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs text-gray-500 text-center mb-3">
              Or scan QR code from the other device
            </p>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600">
                Ask the sender to show you the QR code
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Connected Screen (after sessionId set)
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-600">
              Session Connected
            </span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {isConnected ? "🟢 Ready to Share" : "⏳ Connecting..."}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Session Code:</span>
            <code className="rounded bg-purple-100 px-3 py-1 font-mono text-sm font-semibold text-purple-600">
              {sessionId}
            </code>
            <button
              onClick={copySessionId}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="Copy session code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Connection Status Card */}
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

          {/* Upload Section */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              📤 Send a File
            </h2>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="mobile-file-upload"
              disabled={!isConnected}
            />
            <label
              htmlFor="mobile-file-upload"
              className={`flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed py-8 transition ${
                isConnected
                  ? "border-purple-300 bg-purple-50 hover:border-purple-500 hover:bg-purple-100"
                  : "border-gray-300 bg-gray-50 cursor-not-allowed"
              }`}
            >
              <Upload
                className={`h-6 w-6 ${
                  isConnected ? "text-purple-600" : "text-gray-400"
                }`}
              />
              <span
                className={`font-medium ${
                  isConnected ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {isConnected
                  ? "Select file to send (max 1GB)"
                  : "Connecting..."}
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
                    className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Received Files Section */}
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              📥 Received Files ({receivedFiles.length})
            </h2>

            {receivedFiles.length === 0 ? (
              <div className="rounded-lg bg-gray-50 py-12 text-center">
                <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  No files received yet. Waiting for files to be shared...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedFiles.map((file) => {
                  const timeLeft = timeRemaining.get(file.publicId) ?? 0;
                  const isExpiringSoon = timeLeft <= 30;

                  return (
                    <div
                      key={file.publicId}
                      className={`flex flex-col gap-3 rounded-lg border p-4 transition ${
                        isExpiringSoon
                          ? "border-orange-200 bg-gradient-to-r from-orange-50 to-red-50"
                          : "border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
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
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span>{formatFileSize(file.size)}</span>
                            {file.uploadedBy && (
                              <span className="px-2 py-1 rounded bg-gray-200 text-gray-700">
                                From: {file.uploadedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            isExpiringSoon
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{timeLeft}s</span>
                        </div>
                        <a
                          href={file.url}
                          download={file.name}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-600 active:scale-95"
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-800">
                <p className="font-semibold mb-1">
                  ⏰ Auto-Delete in 3 Minutes
                </p>
                <p>
                  Files automatically delete after 3 minutes for privacy.
                  Download before time runs out!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}