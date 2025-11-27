"use client"

import type React from "react"

import { useState, useEffect } from "react"
import QRCode from "qrcode"
import { Download, Share2, Wifi, Clock, Users, Upload, Copy, Check, AlertCircle } from "lucide-react"

interface FileInfo {
  name: string
  size: number
  url: string
  publicId: string
  uploadedBy?: string
  expiresAt?: number
}

interface ConnectedDevice {
  userId: string
  timestamp: number
}

export default function WebSharePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([])
  const [receivedFiles, setReceivedFiles] = useState<FileInfo[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isConnected, setIsConnected] = useState(true)
  const [copied, setCopied] = useState(false)

  // Create session
  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch("/api/session")
        const data = await res.json()
        setSessionId(data.sessionId)
      } catch (err) {
        console.error("[v0] Session create error:", err)
      }
    }
    createSession()
  }, [])

  // Generate QR code
  useEffect(() => {
    if (!sessionId) return

    // Get the current protocol and host (works with ngrok)
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    const joinUrl = `${baseUrl}/join?session=${sessionId}`

    console.log("[v0] Generated QR URL:", joinUrl)

    QRCode.toDataURL(joinUrl, (err, url) => {
      if (err) console.error("[v0] QR Code error:", err)
      else setQrCodeUrl(url)
    })
  }, [sessionId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!sessionId) {
      alert("Session loading... Please wait.")
      return
    }

    if (file.size > 1024 * 1024 * 1024) {
      alert("File size must be less than 1GB")
      return
    }

    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "temp_shares" }),
      })

      if (!signRes.ok) throw new Error("Failed to get signature")

      const {
        signature,
        timestamp,
        cloud_name,
        api_key,
        folder,
      }: {
        signature: string
        timestamp: number
        cloud_name: string
        api_key: string
        folder?: string
      } = await signRes.json()

      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", api_key)
      formData.append("timestamp", timestamp.toString())
      formData.append("signature", signature)
      formData.append("folder", folder || "temp_shares")

      const xhr = new XMLHttpRequest()
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, true)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onerror = () => {
        console.error("[v0] Upload failed")
        setUploadProgress(0)
        alert("Upload failed. Please try again.")
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          const fileInfo: FileInfo = {
            name: file.name,
            size: file.size,
            url: response.secure_url,
            publicId: response.public_id,
          }

          fetch("/api/socket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "file-info",
              data: {
                roomId: sessionId,
                fileInfo,
                publicId: response.public_id,
                userId: `web-${sessionId.slice(0, 8)}`,
              },
            }),
          }).catch(console.error)

          setReceivedFiles((prev) => [...prev, fileInfo])
          setUploadProgress(0)
        } else {
          setUploadProgress(0)
          alert("Upload failed. Please try again.")
        }
      }

      xhr.send(formData)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      setUploadProgress(0)
      alert("Something went wrong. Please try again.")
    }
  }

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getTimeRemaining = (expiresAt?: number) => {
    if (!expiresAt) return "∞"
    const remaining = Math.max(0, expiresAt - Date.now())
    return `${Math.ceil(remaining / 1000)}s`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Web Share Session</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Share Files Instantly</h1>
          <p className="text-gray-600">Scan QR or share code • Auto-delete in 3 minutes • Up to 1GB</p>
        </div>

        {!sessionId ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
            <p className="mt-4 text-center text-gray-600">Creating your session...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Scan QR Code</h2>
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="QR Code"
                      className="h-48 w-48 rounded-lg border-2 border-gray-100"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Session Code</h2>
                <div className="space-y-3">
                  <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <p className="font-mono text-2xl font-bold text-blue-600">{sessionId}</p>
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

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connection Status</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                    </p>
                  </div>
                  <div className={`rounded-full p-3 ${isConnected ? "bg-green-100" : "bg-red-100"}`}>
                    <Wifi className={`h-6 w-6 ${isConnected ? "text-green-600" : "text-red-600"}`} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Connected Devices</p>
                    <p className="text-2xl font-bold text-gray-900">{connectedDevices.length}</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Share a File</h2>
              <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-8 transition hover:border-blue-500 hover:bg-blue-100"
              >
                <Upload className="h-6 w-6 text-blue-600" />
                <span className="font-medium text-blue-600">Click to select file (max 1GB)</span>
              </label>
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-semibold text-gray-900">{uploadProgress}%</span>
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

            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Received Files ({receivedFiles.length})</h2>
              {receivedFiles.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-8 text-center">
                  <p className="text-gray-600">No files received yet. Waiting for files...</p>
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
                          <span>{formatFileSize(file.size)}</span>
                          {file.uploadedBy && <span>From: {file.uploadedBy}</span>}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeRemaining(file.expiresAt)}</span>
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

            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-800">
                  <p className="font-semibold mb-1">Auto-Delete in 3 Minutes</p>
                  <p>Files automatically delete after 3 minutes for privacy. Download before time runs out!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
