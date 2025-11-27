'use client';

import { useState, useEffect, useRef } from 'react'; // useRef ইমপোর্ট করা হয়েছে
import { io, Socket } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';

interface FileInfo {
  name: string;
  size: number;
  url: string;
  publicId: string;
}

export default function JoinPage() {
  // useState এর পরিবর্তে useRef ব্যবহার করা হচ্ছে
  const socketRef = useRef<Socket | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<FileInfo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get('session');

  useEffect(() => {
    if (!sessionIdFromUrl) return;

    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL!, { path: '/api/socket' });
    // সরাসরি স্টেট আপডেট করার পরিবর্তে ref এ রাখা হচ্ছে
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      newSocket.emit('join-room', sessionIdFromUrl);
    });

    newSocket.on('file-received', (fileInfo: FileInfo) => {
      setReceivedFiles(prev => [...prev, fileInfo]);
    });

    newSocket.on('file-expired', (publicId: string) => {
        setReceivedFiles(prev => prev.filter(file => file.publicId !== publicId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionIdFromUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionIdFromUrl) return;
    if (file.size > 1024 * 1024 * 1024) {
      alert('File size must be less than 1GB');
      return;
    }
    const signRes = await fetch('/api/upload/sign', { method: 'POST' });
    const { signature, timestamp, cloud_name, api_key } = await signRes.json();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'temp_shares');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const fileInfo = { name: file.name, size: file.size, url: response.secure_url, publicId: response.public_id };
        // socket এর পরিবর্তে socketRef.current ব্যবহার করা হচ্ছে
        socketRef.current?.emit('file-info', { roomId: sessionIdFromUrl, fileInfo, publicId: response.public_id });
        setUploadProgress(0);
      }
    };
    xhr.send(formData);
  };

  if (!sessionIdFromUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-500">Invalid or missing session ID.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Connected to Session</h1>
        
        <div className="mb-4">
          <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload-join" />
          <label htmlFor="file-upload-join" className="block w-full text-center bg-green-500 text-white py-2 px-4 rounded cursor-pointer hover:bg-green-600">
            Choose File to Share
          </label>
        </div>

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-semibold mt-2">Received Files:</h2>
          <ul>
            {receivedFiles.map((file, index) => (
              <li key={index} className="mt-2">
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-green-500 underline">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}