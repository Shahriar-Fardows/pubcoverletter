"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Download,
  ExternalLink,
  FolderDot,
  GraduationCap,
  Image as ImageIcon,
  Link2,
  Mail,
  MapPin,
  Move,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Trash2,
  ZoomIn,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

// ─── Types ──────────────────────────────────────────────────────────────────
type BasicInfo = {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
};
type Experience = {
  id: string;
  role: string;
  company: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  desc: string;
  link: string;
};
type Project = {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  link: string;
};
type Education = {
  id: string;
  degree: string;
  institute: string;
  location: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
};
type Language = { id: string; name: string; proficiency: string };
type Certification = {
  id: string;
  title: string;
  platform: string;
  year: string;
};
type CustomSection = { id: string; title: string; desc: string };

type CropState = { x: number; y: number; zoom: number };

type ResumeData = {
  profileImage: string;
  cropState: CropState;
  imageShape: "square" | "rounded" | "circle";
  colors: { primary: string; text: string; heading: string };
  basicInfo: BasicInfo;
  summary: string;
  experiences: Experience[];
  projects: Project[];
  skills: string[];
  educations: Education[];
  languages: Language[];
  certifications: Certification[];
  customSections: CustomSection[];
};

const genId = () => Math.random().toString(36).substr(2, 9);

const INITIAL: ResumeData = {
  profileImage: "",
  cropState: { x: 0, y: 0, zoom: 1 },
  imageShape: "circle",
  colors: { primary: "#2563eb", text: "#374151", heading: "#111827" },
  basicInfo: {
    name: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    address: "",
  },
  summary: "",
  experiences: [],
  projects: [],
  skills: [],
  educations: [],
  languages: [],
  certifications: [],
  customSections: [],
};

const fmtDate = (d: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

// ─── Image Cropper ───────────────────────────────────────────────────────────
function ImageCropper({
  src,
  cropState,
  shape,
  onChange,
}: {
  src: string;
  cropState: CropState;
  shape: string;
  onChange: (c: CropState) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      onChange({ ...cropState, x: cropState.x + dx, y: cropState.y + dy });
    },
    [cropState, onChange],
  );
  const onMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove]);

  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
        ? "rounded-2xl"
        : "rounded-none";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Preview */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Preview
        </p>
        <div
          className={`w-28 h-28 overflow-hidden border-2 border-blue-300 cursor-move bg-slate-100 ${shapeClass}`}
          ref={containerRef}
          onMouseDown={onMouseDown}
          style={{ userSelect: "none" }}
        >
          <img
            src={src}
            alt="crop-preview"
            style={{
              transform: `translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.zoom})`,
              transformOrigin: "center center",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
              transition: "none",
            }}
          />
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <Move size={11} /> Drag image to reposition
        </p>
      </div>

      {/* Controls */}
      <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <ZoomIn size={12} /> Zoom
            </label>
            <span className="text-xs font-mono text-blue-600">
              {(cropState?.zoom ?? 1).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.05"
            value={cropState?.zoom ?? 1}
            onChange={(e) =>
              onChange({
                ...(cropState || { x: 0, y: 0, zoom: 1 }),
                zoom: parseFloat(e.target.value),
              })
            }
            className="w-full accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              X Position
            </label>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={cropState?.x ?? 0}
              onChange={(e) =>
                onChange({
                  ...(cropState || { x: 0, y: 0, zoom: 1 }),
                  x: parseInt(e.target.value),
                })
              }
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Y Position
            </label>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={cropState?.y ?? 0}
              onChange={(e) =>
                onChange({
                  ...(cropState || { x: 0, y: 0, zoom: 1 }),
                  y: parseInt(e.target.value),
                })
              }
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <button
          onClick={() => onChange({ x: 0, y: 0, zoom: 1 })}
          className="w-full py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw size={13} /> Reset Position
        </button>
      </div>
    </div>
  );
}

// ─── Section Heading (Resume) ────────────────────────────────────────────────
function SectionHeading({
  icon,
  label,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
      <span style={{ color: primary }}>{icon}</span>
      <h3
        className="text-[13px] font-black uppercase tracking-[0.12em]"
        style={{ color: primary }}
      >
        {label}
      </h3>
    </div>
  );
}

// ─── Form Input ──────────────────────────────────────────────────────────────
function FInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(INITIAL);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [isSending, setIsSending] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  // ── Persistence ──
  useEffect(() => {
    const saved = localStorage.getItem("resume_v3");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          ...INITIAL,
          ...parsed,
          cropState: parsed.cropState || { x: 0, y: 0, zoom: 1 },
        });
      } catch {}
    }
    setIsLoaded(true);
  }, []);
  useEffect(() => {
    if (isLoaded) localStorage.setItem("resume_v3", JSON.stringify(data));
  }, [data, isLoaded]);

  // ── Helpers ──
  const upd = (p: Partial<ResumeData>) => setData((d) => ({ ...d, ...p }));
  const updBasic = (k: keyof BasicInfo, v: string) =>
    upd({ basicInfo: { ...data.basicInfo, [k]: v } });
  const addItem = (k: keyof ResumeData, empty: any) =>
    upd({ [k]: [...(data[k] as any[]), { ...empty, id: genId() }] });
  const delItem = (k: keyof ResumeData, id: string) =>
    upd({ [k]: (data[k] as any[]).filter((i: any) => i.id !== id) });
  const updItem = (k: keyof ResumeData, id: string, f: string, v: any) =>
    upd({
      [k]: (data[k] as any[]).map((i: any) =>
        i.id === id ? { ...i, [f]: v } : i,
      ),
    });

  const shapeClass =
    data.imageShape === "circle"
      ? "rounded-full"
      : data.imageShape === "rounded"
        ? "rounded-2xl"
        : "rounded-none";

  // ── Image Display (resume preview) ──
  const safeCrop = data.cropState || { x: 0, y: 0, zoom: 1 };
  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    transform: `translate(${safeCrop.x * 0.5}px, ${safeCrop.y * 0.5}px) scale(${safeCrop.zoom})`,
    transformOrigin: "center center",
  };
  const shapeStyle: React.CSSProperties = {
    borderRadius:
      data.imageShape === "circle"
        ? "9999px"
        : data.imageShape === "rounded"
          ? "16px"
          : "0px",
    overflow: "hidden",
  };

  // ── Shared canvas capture ──
  const captureCanvas = async (scale: number) => {
    if (!resumeRef.current) throw new Error("Resume not ready");

    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
      });
      return canvas;
    } catch (err: unknown) {
      // Fallback: retry with different options if iframe clone fails
      console.warn("First canvas capture attempt failed, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(resumeRef.current, {
        scale,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
      });
      return canvas;
    }
  };

  // ── Export ──
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCanvas(2);
      const pdf = new jsPDF("p", "mm", "a4");
      const A4_W = pdf.internal.pageSize.getWidth(); // 210mm
      const A4_H = pdf.internal.pageSize.getHeight(); // 297mm
      const imgW = A4_W;
      const imgH = (canvas.height * A4_W) / canvas.width;
      // If resume is taller than A4, scale it down to fit
      const finalW = imgH > A4_H ? (A4_H * A4_W) / imgH : imgW;
      const finalH = imgH > A4_H ? A4_H : imgH;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.97),
        "JPEG",
        0,
        0,
        finalW,
        finalH,
      );
      pdf.save(`${data.basicInfo.name || "Resume"}.pdf`);
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Export Error",
        text: e.message || "Export failed. Use Print instead.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Email" });
      return;
    }
    setIsSending(true);
    try {
      const canvas = await captureCanvas(2);
      const pdf = new jsPDF("p", "mm", "a4");
      const A4_W = pdf.internal.pageSize.getWidth();
      const A4_H = pdf.internal.pageSize.getHeight();
      const imgW = A4_W;
      const imgH = (canvas.height * A4_W) / canvas.width;
      const finalW = imgH > A4_H ? (A4_H * A4_W) / imgH : imgW;
      const finalH = imgH > A4_H ? A4_H : imgH;
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.9),
        "JPEG",
        0,
        0,
        finalW,
        finalH,
      );

      const res = await fetch("/api/resumes/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: emailTo,
          studentName: data.basicInfo.name || "User",
          pdfDataUri: pdf.output("datauristring"),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Email failed");
      Swal.fire({
        icon: "success",
        title: "Sent! ✉️",
        text: `Resume PDF sent to ${emailTo}`,
      });
      setEmailTo("");
    } catch (e: any) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Email Error", text: e.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded) return null;

  const STEPS = [
    "Appearance",
    "Basic Info",
    "Summary",
    "Experience",
    "Projects",
    "Skills",
    "Education",
    "Languages",
    "Certifications",
    "Export",
  ];
  const pct = Math.round((step / 10) * 100);

  return (
    <>
      {/* ── Print Styles: only resume, A4 ── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0mm; }
          html, body { margin: 0; padding: 0; }
          body > * { display: none !important; }
          #resume-print-wrapper {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 99999 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            transform: scale(0.998) !important;
            transform-origin: top left !important;
          }
          #resume-print-wrapper * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* Screen: hide the print wrapper but keep it renderable for html2canvas */
        #resume-print-wrapper {
          position: absolute !important;
          left: 0 !important;
          top: -99999px !important;
          pointer-events: none;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}</style>

      {/* Hidden target - for PDF generation and Printing */}
      <div id="resume-print-wrapper" ref={resumeRef}>
        <ResumeDocument
          data={data}
          shapeStyle={shapeStyle}
          imgStyle={imgStyle}
        />
      </div>

      {/* ── Main UI ── */}
      <div
        className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex flex-col"
        style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif" }}
      >
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">R</span>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">
                Resume Builder
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Professional CV Generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {STEPS[step - 1]}
            </span>
            <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
              {step}/10
            </span>
          </div>
        </header>

        {/* Progress */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 print:hidden">
          <div className="flex gap-0.5 items-center">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i + 1)}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < step ? "bg-blue-600" : i === step - 1 ? "bg-blue-400" : "bg-slate-200"}`}
                title={s}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400 font-medium">
              {STEPS[step - 1]}
            </span>
            <span className="text-[10px] text-blue-600 font-bold">
              {pct}% complete
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden print:hidden">
          {/* ── FORM PANEL ── */}
          <div className="w-full lg:w-[420px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-lg">
            <div
              className="flex-1 overflow-y-auto p-6 space-y-5"
              style={{ scrollbarWidth: "thin" }}
            >
              {/* Step 1: Appearance */}
              {step === 1 && (
                <div className="space-y-5">
                  <StepHeader n={1} title="Appearance & Profile Photo" />

                  {/* Colors */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Color Scheme
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "primary", label: "Accent" },
                        { key: "heading", label: "Headings" },
                        { key: "text", label: "Body Text" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">
                            {label}
                          </label>
                          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg overflow-hidden bg-white px-2 h-9">
                            <input
                              type="color"
                              value={(data.colors as any)[key]}
                              onChange={(e) =>
                                upd({
                                  colors: {
                                    ...data.colors,
                                    [key]: e.target.value,
                                  },
                                })
                              }
                              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <span className="text-[10px] font-mono text-slate-500">
                              {(data.colors as any)[key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Presets */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-2">
                        Quick Presets
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          {
                            p: "#2563eb",
                            h: "#111827",
                            t: "#374151",
                            name: "Classic Blue",
                          },
                          {
                            p: "#059669",
                            h: "#064e3b",
                            t: "#1f2937",
                            name: "Emerald",
                          },
                          {
                            p: "#7c3aed",
                            h: "#1e1b4b",
                            t: "#374151",
                            name: "Violet",
                          },
                          {
                            p: "#dc2626",
                            h: "#111827",
                            t: "#374151",
                            name: "Crimson",
                          },
                          {
                            p: "#0891b2",
                            h: "#0c4a6e",
                            t: "#1e293b",
                            name: "Ocean",
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() =>
                              upd({
                                colors: {
                                  primary: preset.p,
                                  heading: preset.h,
                                  text: preset.t,
                                },
                              })
                            }
                            className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all"
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.p }}
                            ></span>
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Upload & Crop */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Profile Photo
                    </p>

                    {data.profileImage ? (
                      <>
                        <ImageCropper
                          src={data.profileImage}
                          cropState={data.cropState}
                          shape={data.imageShape}
                          onChange={(cs) => upd({ cropState: cs })}
                        />

                        {/* Shape */}
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-2">
                            Photo Shape
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {(["circle", "rounded", "square"] as const).map(
                              (s) => (
                                <button
                                  key={s}
                                  onClick={() => upd({ imageShape: s })}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${data.imageShape === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            upd({
                              profileImage: "",
                              cropState: { x: 0, y: 0, zoom: 1 },
                            })
                          }
                          className="w-full py-2 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={12} /> Remove Photo
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <ImageIcon
                            size={24}
                            className="text-slate-400 group-hover:text-blue-500"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">
                            Click to upload photo
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = (ev) => {
                                upd({
                                  profileImage: ev.target?.result as string,
                                  cropState: { x: 0, y: 0, zoom: 1 },
                                });
                              };
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Basic Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <StepHeader n={2} title="Basic Information" />
                  <FInput
                    label="Full Name"
                    value={data.basicInfo.name}
                    onChange={(e) => updBasic("name", e.target.value)}
                    placeholder="John Doe"
                  />
                  <FInput
                    label="Professional Title"
                    value={data.basicInfo.title}
                    onChange={(e) => updBasic("title", e.target.value)}
                    placeholder="Senior Software Engineer"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FInput
                      label="Phone"
                      value={data.basicInfo.phone}
                      onChange={(e) => updBasic("phone", e.target.value)}
                      placeholder="+880 1..."
                    />
                    <FInput
                      label="Email"
                      value={data.basicInfo.email}
                      onChange={(e) => updBasic("email", e.target.value)}
                      placeholder="you@email.com"
                    />
                  </div>
                  <FInput
                    label="Website / Portfolio"
                    value={data.basicInfo.website}
                    onChange={(e) => updBasic("website", e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                  <FInput
                    label="Location / Address"
                    value={data.basicInfo.address}
                    onChange={(e) => updBasic("address", e.target.value)}
                    placeholder="Dhaka, Bangladesh"
                  />
                </div>
              )}

              {/* Step 3: Summary */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepHeader n={3} title="Professional Summary" />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Summary (max 600 chars)
                    </label>
                    <textarea
                      value={data.summary}
                      onChange={(e) =>
                        upd({ summary: e.target.value.slice(0, 600) })
                      }
                      rows={9}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      placeholder="Driven engineer with 3+ years of experience..."
                    />
                    <div className="flex justify-end mt-1">
                      <span
                        className={`text-xs font-bold ${data.summary.length > 550 ? "text-orange-500" : "text-slate-400"}`}
                      >
                        {data.summary.length}/600
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Experience */}
              {step === 4 && (
                <div className="space-y-4">
                  <StepHeader n={4} title="Work Experience">
                    <button
                      onClick={() =>
                        addItem("experiences", {
                          role: "",
                          company: "",
                          startMonth: "",
                          endMonth: "",
                          isCurrent: false,
                          desc: "",
                          link: "",
                        })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </StepHeader>
                  {data.experiences.length === 0 && (
                    <EmptyState
                      icon={<Briefcase size={28} />}
                      label="No experience added yet"
                    />
                  )}
                  {data.experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative"
                    >
                      <button
                        onClick={() => delItem("experiences", exp.id)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <input
                        value={exp.role}
                        onChange={(e) =>
                          updItem("experiences", exp.id, "role", e.target.value)
                        }
                        placeholder="Role / Title"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 bg-white pr-10"
                      />
                      <input
                        value={exp.company}
                        onChange={(e) =>
                          updItem(
                            "experiences",
                            exp.id,
                            "company",
                            e.target.value,
                          )
                        }
                        placeholder="Company Name"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={exp.startMonth}
                            onChange={(e) =>
                              updItem(
                                "experiences",
                                exp.id,
                                "startMonth",
                                e.target.value,
                              )
                            }
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              End Date
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exp.isCurrent}
                                onChange={(e) =>
                                  updItem(
                                    "experiences",
                                    exp.id,
                                    "isCurrent",
                                    e.target.checked,
                                  )
                                }
                                className="accent-blue-600"
                              />
                              Present
                            </label>
                          </div>
                          <input
                            type="date"
                            value={exp.endMonth}
                            disabled={exp.isCurrent}
                            onChange={(e) =>
                              updItem(
                                "experiences",
                                exp.id,
                                "endMonth",
                                e.target.value,
                              )
                            }
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <textarea
                        value={exp.desc}
                        onChange={(e) =>
                          updItem("experiences", exp.id, "desc", e.target.value)
                        }
                        rows={4}
                        placeholder="• Describe your responsibilities (new line = new bullet)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 bg-white resize-none"
                      />
                      <input
                        value={exp.link}
                        onChange={(e) =>
                          updItem("experiences", exp.id, "link", e.target.value)
                        }
                        placeholder="Link (optional)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-600 outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5: Projects */}
              {step === 5 && (
                <div className="space-y-4">
                  <StepHeader n={5} title="Key Projects">
                    <button
                      onClick={() =>
                        addItem("projects", {
                          name: "",
                          desc: "",
                          tags: [],
                          link: "",
                        })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </StepHeader>
                  {data.projects.length === 0 && (
                    <EmptyState
                      icon={<FolderDot size={28} />}
                      label="No projects added yet"
                    />
                  )}
                  {data.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative"
                    >
                      <button
                        onClick={() => delItem("projects", proj.id)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <input
                        value={proj.name}
                        onChange={(e) =>
                          updItem("projects", proj.id, "name", e.target.value)
                        }
                        placeholder="Project Name"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 bg-white pr-10"
                      />
                      <textarea
                        value={proj.desc}
                        onChange={(e) =>
                          updItem("projects", proj.id, "desc", e.target.value)
                        }
                        rows={3}
                        placeholder="• What you built (new line = bullet)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 bg-white resize-none"
                      />
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {proj.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() => {
                                  const t = [...proj.tags];
                                  t.splice(i, 1);
                                  updItem("projects", proj.id, "tags", t);
                                }}
                                className="hover:text-red-500 ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          value={tagInputs[proj.id] || ""}
                          onChange={(e) =>
                            setTagInputs((prev) => ({
                              ...prev,
                              [proj.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              (tagInputs[proj.id] || "").trim()
                            ) {
                              e.preventDefault();
                              const val = (tagInputs[proj.id] || "").trim();
                              if (!proj.tags.includes(val))
                                updItem("projects", proj.id, "tags", [
                                  ...proj.tags,
                                  val,
                                ]);
                              setTagInputs((prev) => ({
                                ...prev,
                                [proj.id]: "",
                              }));
                            }
                          }}
                          placeholder="Add tech tag & press Enter (e.g. React)"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                        />
                      </div>
                      <input
                        value={proj.link}
                        onChange={(e) =>
                          updItem("projects", proj.id, "link", e.target.value)
                        }
                        placeholder="Live Link / Repo URL"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-600 outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 6: Skills */}
              {step === 6 && (
                <div className="space-y-4">
                  <StepHeader n={6} title="Skills" />
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {data.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                        >
                          {skill}
                          <button
                            onClick={() =>
                              upd({
                                skills: data.skills.filter((_, j) => j !== i),
                              })
                            }
                            className="w-4 h-4 bg-blue-500 hover:bg-red-400 rounded-full flex items-center justify-center transition-colors text-[10px]"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      {data.skills.length === 0 && (
                        <p className="text-xs text-slate-400 font-medium">
                          No skills added yet...
                        </p>
                      )}
                    </div>
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillInput.trim()) {
                          e.preventDefault();
                          if (!data.skills.includes(skillInput.trim()))
                            upd({
                              skills: [...data.skills, skillInput.trim()],
                            });
                          setSkillInput("");
                        }
                      }}
                      placeholder="Type skill + Enter (e.g. React, Node.js)"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
                    />
                    <p className="text-[11px] text-slate-400">
                      Press{" "}
                      <kbd className="bg-slate-200 rounded px-1 py-0.5 font-mono">
                        Enter
                      </kbd>{" "}
                      to add each skill
                    </p>
                  </div>
                </div>
              )}

              {/* Step 7: Education */}
              {step === 7 && (
                <div className="space-y-4">
                  <StepHeader n={7} title="Education">
                    <button
                      onClick={() =>
                        addItem("educations", {
                          degree: "",
                          institute: "",
                          location: "",
                          startMonth: "",
                          endMonth: "",
                          isCurrent: false,
                        })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </StepHeader>
                  {data.educations.length === 0 && (
                    <EmptyState
                      icon={<GraduationCap size={28} />}
                      label="No education added yet"
                    />
                  )}
                  {data.educations.map((edu) => (
                    <div
                      key={edu.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative"
                    >
                      <button
                        onClick={() => delItem("educations", edu.id)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <input
                        value={edu.degree}
                        onChange={(e) =>
                          updItem(
                            "educations",
                            edu.id,
                            "degree",
                            e.target.value,
                          )
                        }
                        placeholder="Degree / Certificate"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-400 bg-white pr-10"
                      />
                      <input
                        value={edu.institute}
                        onChange={(e) =>
                          updItem(
                            "educations",
                            edu.id,
                            "institute",
                            e.target.value,
                          )
                        }
                        placeholder="Institute / University"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                      />
                      <input
                        value={edu.location}
                        onChange={(e) =>
                          updItem(
                            "educations",
                            edu.id,
                            "location",
                            e.target.value,
                          )
                        }
                        placeholder="Location (optional)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                            Start
                          </label>
                          <input
                            type="date"
                            value={edu.startMonth}
                            onChange={(e) =>
                              updItem(
                                "educations",
                                edu.id,
                                "startMonth",
                                e.target.value,
                              )
                            }
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              End
                            </label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={edu.isCurrent}
                                onChange={(e) =>
                                  updItem(
                                    "educations",
                                    edu.id,
                                    "isCurrent",
                                    e.target.checked,
                                  )
                                }
                                className="accent-blue-600"
                              />
                              Present
                            </label>
                          </div>
                          <input
                            type="date"
                            value={edu.endMonth}
                            disabled={edu.isCurrent}
                            onChange={(e) =>
                              updItem(
                                "educations",
                                edu.id,
                                "endMonth",
                                e.target.value,
                              )
                            }
                            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white disabled:opacity-40"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 8: Languages */}
              {step === 8 && (
                <div className="space-y-4">
                  <StepHeader n={8} title="Languages">
                    <button
                      onClick={() =>
                        addItem("languages", { name: "", proficiency: "" })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </StepHeader>
                  <div className="space-y-2">
                    {data.languages.map((lang) => (
                      <div key={lang.id} className="flex gap-2 items-center">
                        <input
                          value={lang.name}
                          onChange={(e) =>
                            updItem(
                              "languages",
                              lang.id,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="Language"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
                        />
                        <select
                          value={lang.proficiency}
                          onChange={(e) =>
                            updItem(
                              "languages",
                              lang.id,
                              "proficiency",
                              e.target.value,
                            )
                          }
                          className="w-36 border border-slate-200 rounded-lg px-2 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-white text-slate-700"
                        >
                          <option value="">Level</option>
                          <option value="Native / Bilingual">
                            Native / Bilingual
                          </option>
                          <option value="Fluent">Fluent</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Basic">Basic</option>
                        </select>
                        <button
                          onClick={() => delItem("languages", lang.id)}
                          className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 9: Certifications */}
              {step === 9 && (
                <div className="space-y-4">
                  <StepHeader n={9} title="Certifications">
                    <button
                      onClick={() =>
                        addItem("certifications", {
                          title: "",
                          platform: "",
                          year: "",
                        })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </StepHeader>
                  <div className="space-y-2">
                    {data.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="grid grid-cols-[1fr_120px_64px_36px] gap-2 items-center"
                      >
                        <input
                          value={cert.title}
                          onChange={(e) =>
                            updItem(
                              "certifications",
                              cert.id,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder="Certificate Title"
                          className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                        />
                        <input
                          value={cert.platform}
                          onChange={(e) =>
                            updItem(
                              "certifications",
                              cert.id,
                              "platform",
                              e.target.value,
                            )
                          }
                          placeholder="Platform"
                          className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                        />
                        <input
                          value={cert.year}
                          onChange={(e) =>
                            updItem(
                              "certifications",
                              cert.id,
                              "year",
                              e.target.value,
                            )
                          }
                          placeholder="Year"
                          className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white"
                        />
                        <button
                          onClick={() => delItem("certifications", cert.id)}
                          className="w-9 h-9 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 10: Export */}
              {step === 10 && (
                <div className="space-y-5">
                  <StepHeader n={10} title="Export Resume" />

                  {/* Custom Sections */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Extra Sections (Optional)
                      </p>
                      <button
                        onClick={() =>
                          addItem("customSections", { title: "", desc: "" })
                        }
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    {data.customSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 relative"
                      >
                        <button
                          onClick={() => delItem("customSections", sec.id)}
                          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input
                          value={sec.title}
                          onChange={(e) =>
                            updItem(
                              "customSections",
                              sec.id,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder="Section Title"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-400 bg-white pr-10"
                        />
                        <textarea
                          value={sec.desc}
                          onChange={(e) =>
                            updItem(
                              "customSections",
                              sec.id,
                              "desc",
                              e.target.value,
                            )
                          }
                          rows={3}
                          placeholder="Description (new line = bullet)"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200 pt-5 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Download Options
                    </p>

                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-200 text-sm"
                    >
                      <Printer size={18} /> Print / Save as PDF (Recommended)
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Opens browser print dialog → Save as PDF for best quality
                    </p>

                    <button
                      onClick={handleDownload}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all text-sm disabled:opacity-60"
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      {isExporting
                        ? "Generating PDF..."
                        : "Direct Export (Canvas PDF)"}
                    </button>
                  </div>

                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Send via Email
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recipient@email.com"
                        className="flex-1 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white"
                      />
                      <button
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-emerald-400 border-t-white rounded-full animate-spin" />
                        ) : null}
                        {isSending ? "Sending..." : "Send Email"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs text-amber-700 font-medium">
                      💡 All data is auto-saved in your browser. Come back
                      anytime to continue editing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Nav */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => setStep((s) => Math.min(10, s + 1))}
                disabled={step === 10}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-200 transition-all disabled:opacity-40"
              >
                Next <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* ── PREVIEW PANEL ── */}
          <div
            className="flex-1 overflow-auto bg-slate-200 flex items-start justify-center p-6"
            style={{
              background:
                "repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 10px,#d1d9e0 10px,#d1d9e0 20px)",
            }}
          >
            <div
              style={{
                transform: "scale(0.82)",
                transformOrigin: "top center",
                marginBottom: "-18%",
              }}
            >
              <ResumeDocument
                data={data}
                shapeStyle={shapeStyle}
                imgStyle={imgStyle}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Resume Document (shared between preview + print) ────────────────────────
function ResumeDocument({
  data,
  shapeStyle,
  imgStyle,
}: {
  data: ResumeData;
  shapeStyle: React.CSSProperties;
  imgStyle: React.CSSProperties;
}) {
  const p = data.colors.primary;
  const h = data.colors.heading;
  const t = data.colors.text;

  return (
    <div
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#fff",
        display: "flex",
        fontFamily: "'DM Sans', 'Nunito', sans-serif",
        color: t,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          minHeight: "100%",
          background: "#f8fafc",
          borderRight: "1px solid #e2e8f0",
          padding: "36px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flexShrink: 0,
        }}
      >
        {/* Photo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {data.profileImage ? (
            <div
              style={{
                ...shapeStyle,
                width: 100,
                height: 100,
                flexShrink: 0,
                border: `3px solid ${p}`,
              }}
            >
              <img src={data.profileImage} alt="Profile" style={imgStyle} />
            </div>
          ) : (
            <div
              style={{
                ...shapeStyle,
                width: 100,
                height: 100,
                background: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ImageIcon size={32} color="#94a3b8" />
            </div>
          )}
        </div>

        {/* Contact */}
        <SideSection title="Contact" primary={p} heading={h}>
          {[
            data.basicInfo.email && {
              icon: <Mail size={12} />,
              val: data.basicInfo.email,
            },
            data.basicInfo.phone && {
              icon: <Phone size={12} />,
              val: data.basicInfo.phone,
            },
            data.basicInfo.address && {
              icon: <MapPin size={12} />,
              val: data.basicInfo.address,
            },
            data.basicInfo.website && {
              icon: <ExternalLink size={12} />,
              val: data.basicInfo.website,
              color: p,
            },
          ]
            .filter(Boolean)
            .map((item: any, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    color: p,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    marginTop: 2,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    wordBreak: "break-all",
                    color: item.color || t,
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
        </SideSection>

        {/* Skills */}
        {data.skills.length > 0 && (
          <SideSection title="Skills" primary={p} heading={h}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {data.skills.map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: p,
                      flexShrink: 0,
                    }}
                  ></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <SideSection title="Languages" primary={p} heading={h}>
            {data.languages.map((l) => (
              <div key={l.id} style={{ marginBottom: 6 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: h,
                    lineHeight: "1.3",
                  }}
                >
                  {l.name}
                </p>
                <p style={{ fontSize: 10, color: t, opacity: 0.7 }}>
                  {l.proficiency}
                </p>
              </div>
            ))}
          </SideSection>
        )}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${p}`, paddingBottom: 16 }}>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: h,
              lineHeight: 1.05,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {data.basicInfo.name || "YOUR NAME"}
          </h1>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: p,
              marginTop: 6,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {data.basicInfo.title || "Your Professional Title"}
          </p>
        </div>

        {/* Summary */}
        {data.summary && (
          <p style={{ fontSize: 12, lineHeight: "1.75", color: t, margin: 0 }}>
            {data.summary}
          </p>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <MainSection
            icon={<Briefcase size={15} />}
            title="Work Experience"
            primary={p}
            heading={h}
          >
            {data.experiences.map((exp) => (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 2,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: h }}>
                      {exp.role}
                    </span>
                    {exp.company && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: p }}>
                        {" "}
                        · {exp.company}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: t,
                      opacity: 0.6,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtDate(exp.startMonth)} –{" "}
                    {exp.isCurrent ? "Present" : fmtDate(exp.endMonth)}
                  </span>
                </div>
                {exp.desc
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          color: p,
                          fontSize: 10,
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      >
                        •
                      </span>
                      <span
                        style={{ fontSize: 11, color: t, lineHeight: "1.6" }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                {exp.link && (
                  <p
                    style={{
                      fontSize: 10,
                      color: p,
                      marginTop: 4,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Link2 size={10} />
                    </span>
                    <span style={{ wordBreak: "break-all" }}>{exp.link}</span>
                  </p>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <MainSection
            icon={<FolderDot size={15} />}
            title="Key Projects"
            primary={p}
            heading={h}
          >
            {data.projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: h,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {proj.name}
                  </span>
                  {proj.link && (
                    <span
                      style={{
                        fontSize: 10,
                        color: p,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <Link2 size={9} />
                      </span>
                      <span>View</span>
                    </span>
                  )}
                </div>
                {proj.desc
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          color: p,
                          fontSize: 10,
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      >
                        •
                      </span>
                      <span
                        style={{ fontSize: 11, color: t, lineHeight: "1.6" }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                {proj.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 5,
                    }}
                  >
                    {proj.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: "#f1f5f9",
                          color: h,
                          borderRadius: 4,
                          padding: "2px 6px",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {/* Education */}
        {data.educations.length > 0 && (
          <MainSection
            icon={<GraduationCap size={15} />}
            title="Education"
            primary={p}
            heading={h}
          >
            {data.educations.map((edu) => (
              <div
                key={edu.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: h,
                      margin: 0,
                    }}
                  >
                    {edu.degree}
                  </p>
                  <p style={{ fontSize: 11, color: t, margin: "2px 0 0" }}>
                    {edu.institute}
                    {edu.location ? ` — ${edu.location}` : ""}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: t,
                    opacity: 0.6,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(edu.startMonth)} –{" "}
                  {edu.isCurrent ? "Present" : fmtDate(edu.endMonth)}
                </span>
              </div>
            ))}
          </MainSection>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <MainSection
            icon={<Award size={15} />}
            title="Certifications"
            primary={p}
            heading={h}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 16px",
              }}
            >
              {data.certifications.map((cert) => (
                <div
                  key={cert.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 5 }}
                >
                  <span style={{ color: p, fontSize: 10, marginTop: 3 }}>
                    •
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: h,
                        margin: 0,
                      }}
                    >
                      {cert.title}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: t,
                        opacity: 0.7,
                        margin: 0,
                      }}
                    >
                      {cert.platform} {cert.year && `(${cert.year})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </MainSection>
        )}

        {/* Custom Sections */}
        {data.customSections.map(
          (sec) =>
            sec.title && (
              <MainSection
                key={sec.id}
                icon={<Sparkles size={15} />}
                title={sec.title}
                primary={p}
                heading={h}
              >
                {sec.desc
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          color: p,
                          fontSize: 10,
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      >
                        •
                      </span>
                      <span
                        style={{ fontSize: 11, color: t, lineHeight: "1.6" }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
              </MainSection>
            ),
        )}
      </div>
    </div>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────────────
function StepHeader({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-black">{n}</span>
        </div>
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-slate-300">
      {icon}
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

function SideSection({
  title,
  primary,
  heading,
  children,
}: {
  title: string;
  primary: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: `1px solid #e2e8f0`,
          paddingBottom: 6,
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: primary,
            margin: 0,
          }}
        >
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function MainSection({
  icon,
  title,
  primary,
  heading,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  primary: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          borderBottom: `1.5px solid ${primary}20`,
          paddingBottom: 8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            color: primary,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {icon}
        </span>
        <p
          style={{
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: heading,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
