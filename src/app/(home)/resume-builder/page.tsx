"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @next/next/no-img-element */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Nunito } from "next/font/google";
import {
  ArrowLeft, ArrowRight, Award, Briefcase, Download, ExternalLink,
  FolderDot, GraduationCap, Image as ImageIcon, Link2, Linkedin,
  Mail, MapPin, Move, Phone, Plus, Printer, RotateCcw, Sparkles, Trash2, ZoomIn,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

// ─── Types ────────────────────────────────────────────────────────────────────
type BasicInfo = {
  name: string; title: string; phone: string; email: string;
  linkedin: string; website: string; address: string;
};
type Experience = {
  id: string; role: string; company: string;
  startMonth: string; endMonth: string; isCurrent: boolean; desc: string; link: string;
};
type Project = { id: string; name: string; desc: string; tags: string[]; link: string };
type Education = {
  id: string; degree: string; institute: string; location: string;
  startMonth: string; endMonth: string; isCurrent: boolean;
};
type Language = { id: string; name: string; proficiency: string };
type Certification = { id: string; title: string; platform: string; year: string };
type CustomSection = { id: string; title: string; desc: string };
type CropState = { x: number; y: number; zoom: number };
type Template = "dark-sidebar" | "light-sidebar" | "classic";

type ResumeData = {
  profileImage: string; cropState: CropState;
  imageShape: "square" | "rounded" | "circle";
  imageRadius?: number;
  imageSize: number;
  template: Template;
  colors: { primary: string; text: string; heading: string };
  basicInfo: BasicInfo; summary: string;
  experiences: Experience[]; projects: Project[]; skills: string[];
  educations: Education[]; languages: Language[];
  certifications: Certification[]; customSections: CustomSection[];
};

const genId = () => Math.random().toString(36).substr(2, 9);

const INITIAL: ResumeData = {
  profileImage: "", cropState: { x: 0, y: 0, zoom: 1 },
  imageShape: "circle", imageSize: 96, template: "dark-sidebar",
  colors: { primary: "#1e3a5f", text: "#374151", heading: "#0f172a" },
  basicInfo: { name: "", title: "", phone: "", email: "", linkedin: "", website: "", address: "" },
  summary: "", experiences: [], projects: [], skills: [],
  educations: [], languages: [], certifications: [], customSections: [],
};

const PRESETS = [
  { name: "Navy",    p: "#1e3a5f", h: "#0f172a", t: "#374151" },
  { name: "Blue",    p: "#1d4ed8", h: "#1e1b4b", t: "#1e293b" },
  { name: "Emerald", p: "#065f46", h: "#064e3b", t: "#1f2937" },
  { name: "Violet",  p: "#4c1d95", h: "#1e1b4b", t: "#374151" },
  { name: "Crimson", p: "#881337", h: "#0f172a", t: "#374151" },
  { name: "Slate",   p: "#1e293b", h: "#0f172a", t: "#334155" },
];

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";

// ─── ImageCropper ─────────────────────────────────────────────────────────────
function ImageCropper({ src, cropState, shape, onChange }: {
  src: string; cropState: CropState; shape: string; onChange: (c: CropState) => void;
}) {
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    onChange({ ...cropState, x: cropState.x + dx, y: cropState.y + dy });
  }, [cropState, onChange]);
  const onMouseUp = () => { dragging.current = false; };
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [onMouseMove]);
  const sc = shape === "circle" ? "rounded-full" : shape === "rounded" ? "rounded-2xl" : "rounded-none";
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Move size={10} /> Drag to reposition</p>
        <div className={`w-24 h-24 overflow-hidden border-2 border-blue-400 cursor-move bg-slate-100 ${sc}`} onMouseDown={onMouseDown} style={{ userSelect: "none" }}>
          <img src={src} alt="" style={{ transform: `translate(${cropState.x}px,${cropState.y}px) scale(${cropState.zoom})`, transformOrigin: "center", width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
        </div>
      </div>
      <div className="w-full space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><ZoomIn size={11} />Zoom</label>
            <span className="text-[10px] font-mono text-blue-600">{(cropState.zoom ?? 1).toFixed(2)}x</span>
          </div>
          <input type="range" min="0.5" max="4" step="0.05" value={cropState.zoom ?? 1}
            onChange={(e) => onChange({ ...cropState, zoom: parseFloat(e.target.value) })}
            className="w-full accent-blue-600" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([["X", "x"], ["Y", "y"]] as const).map(([label, field]) => (
            <div key={field}>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">{label} Offset</label>
              <input type="range" min="-200" max="200" step="1" value={(cropState as any)[field] ?? 0}
                onChange={(e) => onChange({ ...cropState, [field]: parseInt(e.target.value) })}
                className="w-full accent-blue-600" />
            </div>
          ))}
        </div>
        <button onClick={() => onChange({ x: 0, y: 0, zoom: 1 })}
          className="w-full py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────
function FInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white placeholder:text-slate-300" />
    </div>
  );
}
function StepHeader({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
          <span className="text-white text-xs font-black">{n}</span>
        </div>
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex flex-col items-center gap-2 py-10 text-slate-300">{icon}<p className="text-xs font-medium text-slate-400">{label}</p></div>;
}
function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
      <Plus size={13} /> Add
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ResumeData>(INITIAL);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [saved, setSaved] = useState(true);
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("resume_v4");
    if (raw) { try { const p = JSON.parse(raw); setData({ ...INITIAL, ...p, cropState: p.cropState || { x: 0, y: 0, zoom: 1 } }); } catch {} }
    setIsLoaded(true);
  }, []);
  useEffect(() => {
    if (!isLoaded) return;
    setSaved(false);
    const t = setTimeout(() => { localStorage.setItem("resume_v4", JSON.stringify(data)); setSaved(true); }, 700);
    return () => clearTimeout(t);
  }, [data, isLoaded]);

  const upd = (p: Partial<ResumeData>) => setData((d) => ({ ...d, ...p }));
  const updBasic = (k: keyof BasicInfo, v: string) => upd({ basicInfo: { ...data.basicInfo, [k]: v } });
  const addItem = (k: keyof ResumeData, empty: any) => upd({ [k]: [...(data[k] as any[]), { ...empty, id: genId() }] });
  const delItem = (k: keyof ResumeData, id: string) => upd({ [k]: (data[k] as any[]).filter((i: any) => i.id !== id) });
  const updItem = (k: keyof ResumeData, id: string, f: string, v: any) =>
    upd({ [k]: (data[k] as any[]).map((i: any) => i.id === id ? { ...i, [f]: v } : i) });

  const safeCrop = data.cropState || { x: 0, y: 0, zoom: 1 };
  const sz = data.imageSize || 96;
  const radius = data.imageRadius ?? (data.imageShape === "circle" ? 50 : data.imageShape === "rounded" ? 15 : 0);
  const shapeStyle: React.CSSProperties = {
    borderRadius: `${radius}%`,
    overflow: "hidden",
  };
  const imgStyle: React.CSSProperties = {
    width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none",
    transform: `translate(${safeCrop.x * (sz / 192)}px,${safeCrop.y * (sz / 192)}px) scale(${safeCrop.zoom})`,
    transformOrigin: "center",
  };

  const captureCanvas = async (scale: number) => {
    if (!resumeRef.current) throw new Error("Resume not ready");
    return html2canvas(resumeRef.current, {
      scale, useCORS: true, backgroundColor: "#fff", logging: false, allowTaint: true,
      foreignObjectRendering: false,
      onclone: (_doc, el) => {
        el.style.cssText = "position:absolute;top:0;left:0;visibility:visible;opacity:1;z-index:0;";
      },
    });
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCanvas(2);
      const pdf = new jsPDF("p", "mm", "a4");
      const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * W) / canvas.width;
      const fW = imgH > H ? (H * W) / imgH : W, fH = imgH > H ? H : imgH;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, fW, fH);
      pdf.save(`${data.basicInfo.name || "Resume"}.pdf`);
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Export Failed", text: e.message || "Try Print instead." });
    } finally { setIsExporting(false); }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) { Swal.fire({ icon: "warning", title: "Enter recipient email" }); return; }
    setIsSending(true);
    try {
      const canvas = await captureCanvas(2);
      const pdf = new jsPDF("p", "mm", "a4");
      const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * W) / canvas.width;
      const fW = imgH > H ? (H * W) / imgH : W, fH = imgH > H ? H : imgH;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, fW, fH);
      const res = await fetch("/api/resumes/email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: emailTo, studentName: data.basicInfo.name || "User", pdfDataUri: pdf.output("datauristring") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Email failed");
      Swal.fire({ icon: "success", title: "Sent!", text: `Resume sent to ${emailTo}` });
      setEmailTo("");
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Email Error", text: e.message });
    } finally { setIsSending(false); }
  };

  if (!isLoaded) return null;

  const STEPS = ["Appearance","Basic Info","Summary","Experience","Projects","Skills","Education","Languages","Certifications","Export"];
  const pct = Math.round((step / 10) * 100);

  const TEMPLATES: { id: Template; label: string; desc: string; preview: React.ReactNode }[] = [
    {
      id: "dark-sidebar",
      label: "Dark Sidebar",
      desc: "Colored sidebar",
      preview: (
        <div className="w-full h-10 rounded overflow-hidden flex">
          <div className="w-5 h-full rounded-l" style={{ background: data.colors.primary }} />
          <div className="flex-1 h-full bg-white rounded-r flex flex-col justify-center px-1.5 gap-0.5">
            <div className="h-1 w-10 bg-slate-300 rounded" />
            <div className="h-0.5 w-7 bg-slate-200 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: "light-sidebar",
      label: "Light Sidebar",
      desc: "Clean minimal",
      preview: (
        <div className="w-full h-10 rounded overflow-hidden flex">
          <div className="w-5 h-full bg-slate-100 rounded-l" style={{ borderLeft: `3px solid ${data.colors.primary}` }} />
          <div className="flex-1 h-full bg-white rounded-r flex flex-col justify-center px-1.5 gap-0.5">
            <div className="h-1 w-10 bg-slate-300 rounded" />
            <div className="h-0.5 w-7 bg-slate-200 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: "classic",
      label: "Classic",
      desc: "Header banner",
      preview: (
        <div className="w-full h-10 rounded overflow-hidden flex flex-col">
          <div className="h-4 w-full rounded-t flex items-center px-1.5 gap-1" style={{ background: data.colors.primary }}>
            <div className="w-2.5 h-2.5 rounded-full bg-white/30 flex-shrink-0" />
            <div className="h-1 w-8 bg-white/50 rounded" />
          </div>
          <div className="flex-1 bg-white rounded-b flex flex-col justify-center px-1.5 gap-0.5">
            <div className="h-0.5 w-full bg-slate-200 rounded" />
            <div className="h-0.5 w-8 bg-slate-200 rounded" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0mm; }
          html, body { margin: 0 !important; padding: 0 !important; }
          body > * { visibility: hidden !important; }
          #rp-wrap, #rp-wrap * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #rp-wrap {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
        #rp-wrap {
          position: fixed !important;
          left: -9999px !important;
          top: 0 !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: none;
          z-index: -1 !important;
        }
      `}</style>

      <div id="rp-wrap" ref={resumeRef}>
        <ResumeDocument data={data} shapeStyle={shapeStyle} imgStyle={imgStyle} fontClass={nunito.className} />
      </div>

      <div className={`min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex flex-col ${nunito.className}`}>

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: data.colors.primary }}>
              <span className="text-white font-black text-sm">R</span>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">Resume Builder</h1>
              <p className="text-[11px] text-slate-400 font-medium">Professional CV Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-[10px] font-bold transition-colors ${saved ? "text-emerald-500" : "text-amber-500"}`}>
              {saved ? "● Saved" : "● Saving..."}
            </span>
            <button
              onClick={() => Swal.fire({ title: "Reset Resume?", text: "All data will be cleared.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Yes, reset" })
                .then(r => { if (r.isConfirmed) { setData(INITIAL); setStep(1); localStorage.removeItem("resume_v4"); } })}
              className="text-xs font-bold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-2.5 py-1 rounded-lg transition-all">
              Reset
            </button>
            <span className="hidden sm:block text-xs font-bold text-slate-500">{STEPS[step - 1]}</span>
            <span className="text-white text-xs font-black px-2.5 py-1 rounded-full" style={{ background: data.colors.primary }}>{step}/10</span>
          </div>
        </header>

        {/* Progress */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 print:hidden">
          <div className="flex gap-0.5">
            {STEPS.map((s, i) => (
              <button key={i} onClick={() => setStep(i + 1)} title={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < step ? "bg-blue-600" : i === step - 1 ? "bg-blue-400" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-500 font-semibold">{STEPS[step - 1]}</span>
            <span className="text-[10px] text-blue-600 font-bold">{pct}%</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden print:hidden">

          {/* FORM */}
          <div className="w-full lg:w-[430px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-lg">
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "thin" }}>

              {/* ── STEP 1: Appearance ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <StepHeader n={1} title="Appearance" />

                  {/* Templates */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Resume Template</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TEMPLATES.map((t) => (
                        <button key={t.id} onClick={() => upd({ template: t.id })}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${data.template === t.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          {t.preview}
                          <span className={`text-[10px] font-bold ${data.template === t.id ? "text-blue-600" : "text-slate-500"}`}>{t.label}</span>
                          <span className="text-[9px] text-slate-400">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Color Presets</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESETS.map((pr) => (
                        <button key={pr.name} onClick={() => upd({ colors: { primary: pr.p, heading: pr.h, text: pr.t } })}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-bold transition-all ${data.colors.primary === pr.p ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"}`}>
                          <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/50 shadow-sm" style={{ background: pr.p }} />
                          {pr.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Custom Colors</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ key: "primary", label: "Accent" }, { key: "heading", label: "Headings" }, { key: "text", label: "Body" }].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">{label}</label>
                          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2 h-9 bg-white">
                            <input type="color" value={(data.colors as any)[key]} onChange={(e) => upd({ colors: { ...data.colors, [key]: e.target.value } })} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0" />
                            <span className="text-[9px] font-mono text-slate-400">{(data.colors as any)[key]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Profile Photo</p>
                    {data.profileImage ? (
                      <>
                        <ImageCropper src={data.profileImage} cropState={data.cropState} shape={data.imageShape} onChange={(cs) => upd({ cropState: cs })} />

                        {/* Shape */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Border Radius</p>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[{ label: "Square", val: 0 }, { label: "Rounded", val: 15 }, { label: "Circle", val: 50 }].map(({ label, val }) => {
                              const curr = data.imageRadius ?? (data.imageShape === "circle" ? 50 : data.imageShape === "rounded" ? 15 : 0);
                              return (
                                <button key={label} onClick={() => upd({ imageRadius: val, imageShape: val === 50 ? "circle" : val === 0 ? "square" : "rounded" })}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${curr === val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                  <span className={`w-4 h-4 border-2 flex-shrink-0 ${val === 50 ? "rounded-full" : val > 0 ? "rounded" : "rounded-none"} ${curr === val ? "border-white" : "border-slate-400"}`} />
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-500">Custom Radius</label>
                              <span className="text-[10px] font-mono text-blue-600">{data.imageRadius ?? (data.imageShape === "circle" ? 50 : data.imageShape === "rounded" ? 15 : 0)}%</span>
                            </div>
                            <input type="range" min="0" max="50" step="1" 
                              value={data.imageRadius ?? (data.imageShape === "circle" ? 50 : data.imageShape === "rounded" ? 15 : 0)}
                              onChange={(e) => upd({ imageRadius: parseInt(e.target.value) })}
                              className="w-full accent-blue-600" />
                          </div>
                        </div>

                        {/* Size */}
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Photo Size</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[{ label: "Small", val: 72 }, { label: "Medium", val: 96 }, { label: "Large", val: 120 }].map(({ label, val }) => (
                              <button key={val} onClick={() => upd({ imageSize: val })}
                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${data.imageSize === val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                {label}
                                <span className="block text-[9px] opacity-60 font-normal">{val}px</span>
                              </button>
                            ))}
                          </div>
                          {/* Custom size slider */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-500">Custom</label>
                              <span className="text-[10px] font-mono text-blue-600">{data.imageSize}px</span>
                            </div>
                            <input type="range" min="48" max="150" step="4" value={data.imageSize}
                              onChange={(e) => upd({ imageSize: parseInt(e.target.value) })}
                              className="w-full accent-blue-600" />
                          </div>
                        </div>

                        <button onClick={() => upd({ profileImage: "", cropState: { x: 0, y: 0, zoom: 1 } })}
                          className="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors">
                          <Trash2 size={12} /> Remove Photo
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <ImageIcon size={22} className="text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700">Upload Photo</p>
                          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG up to 5MB</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) { const r = new FileReader(); r.onload = (ev) => upd({ profileImage: ev.target?.result as string, cropState: { x: 0, y: 0, zoom: 1 } }); r.readAsDataURL(f); }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="space-y-4">
                  <StepHeader n={2} title="Basic Information" />
                  <FInput label="Full Name" value={data.basicInfo.name} onChange={(e) => updBasic("name", e.target.value)} placeholder="John Doe" />
                  <FInput label="Professional Title" value={data.basicInfo.title} onChange={(e) => updBasic("title", e.target.value)} placeholder="Senior Software Engineer" />
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Phone" value={data.basicInfo.phone} onChange={(e) => updBasic("phone", e.target.value)} placeholder="+880 1..." />
                    <FInput label="Email" value={data.basicInfo.email} onChange={(e) => updBasic("email", e.target.value)} placeholder="you@email.com" />
                  </div>
                  <FInput label="LinkedIn" value={data.basicInfo.linkedin} onChange={(e) => updBasic("linkedin", e.target.value)} placeholder="linkedin.com/in/yourname" />
                  <FInput label="Website / Portfolio" value={data.basicInfo.website} onChange={(e) => updBasic("website", e.target.value)} placeholder="yoursite.com" />
                  <FInput label="Location / Address" value={data.basicInfo.address} onChange={(e) => updBasic("address", e.target.value)} placeholder="Dhaka, Bangladesh" />
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepHeader n={3} title="Professional Summary" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Summary <span className="text-slate-300 normal-case font-normal">(max 600)</span></label>
                    <textarea value={data.summary} onChange={(e) => upd({ summary: e.target.value.slice(0, 600) })} rows={9}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none placeholder:text-slate-300"
                      placeholder="Results-driven engineer with 3+ years building scalable web applications..." />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-bold ${data.summary.length > 550 ? "text-orange-500" : "text-slate-300"}`}>{data.summary.length}/600</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4 ── */}
              {step === 4 && (
                <div className="space-y-4">
                  <StepHeader n={4} title="Work Experience">
                    <AddBtn onClick={() => addItem("experiences", { role: "", company: "", startMonth: "", endMonth: "", isCurrent: false, desc: "", link: "" })} />
                  </StepHeader>
                  {data.experiences.length === 0 && <EmptyState icon={<Briefcase size={28} />} label="No experience added yet" />}
                  {data.experiences.map((exp) => (
                    <div key={exp.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative">
                      <button onClick={() => delItem("experiences", exp.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      <input value={exp.role} onChange={(e) => updItem("experiences", exp.id, "role", e.target.value)} placeholder="Job Title / Role" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 bg-white pr-10 placeholder:text-slate-300" />
                      <input value={exp.company} onChange={(e) => updItem("experiences", exp.id, "company", e.target.value)} placeholder="Company Name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start</label>
                          <input type="date" value={exp.startMonth} onChange={(e) => updItem("experiences", exp.id, "startMonth", e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">End</label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer">
                              <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updItem("experiences", exp.id, "isCurrent", e.target.checked)} className="accent-blue-600" /> Present
                            </label>
                          </div>
                          <input type="date" value={exp.endMonth} disabled={exp.isCurrent} onChange={(e) => updItem("experiences", exp.id, "endMonth", e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white disabled:opacity-40" />
                        </div>
                      </div>
                      <textarea value={exp.desc} onChange={(e) => updItem("experiences", exp.id, "desc", e.target.value)} rows={4}
                        placeholder="• Describe responsibilities (new line = new bullet)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 bg-white resize-none placeholder:text-slate-300" />
                      <input value={exp.link} onChange={(e) => updItem("experiences", exp.id, "link", e.target.value)} placeholder="Link (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-600 outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 5 ── */}
              {step === 5 && (
                <div className="space-y-4">
                  <StepHeader n={5} title="Key Projects">
                    <AddBtn onClick={() => addItem("projects", { name: "", desc: "", tags: [], link: "" })} />
                  </StepHeader>
                  {data.projects.length === 0 && <EmptyState icon={<FolderDot size={28} />} label="No projects added yet" />}
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative">
                      <button onClick={() => delItem("projects", proj.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      <input value={proj.name} onChange={(e) => updItem("projects", proj.id, "name", e.target.value)} placeholder="Project Name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 bg-white pr-10 placeholder:text-slate-300" />
                      <textarea value={proj.desc} onChange={(e) => updItem("projects", proj.id, "desc", e.target.value)} rows={3}
                        placeholder="• What you built (new line = bullet)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 bg-white resize-none placeholder:text-slate-300" />
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {proj.tags.map((tag, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              {tag}
                              <button onClick={() => { const t = [...proj.tags]; t.splice(i, 1); updItem("projects", proj.id, "tags", t); }} className="hover:text-red-500">&times;</button>
                            </span>
                          ))}
                        </div>
                        <input value={tagInputs[proj.id] || ""} onChange={(e) => setTagInputs(p => ({ ...p, [proj.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (tagInputs[proj.id] || "").trim()) {
                              e.preventDefault();
                              const val = tagInputs[proj.id].trim();
                              if (!proj.tags.includes(val)) updItem("projects", proj.id, "tags", [...proj.tags, val]);
                              setTagInputs(p => ({ ...p, [proj.id]: "" }));
                            }
                          }}
                          placeholder="Add tech tag → Enter (e.g. React)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                      </div>
                      <input value={proj.link} onChange={(e) => updItem("projects", proj.id, "link", e.target.value)} placeholder="Live URL / Repo" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-blue-600 outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 6 ── */}
              {step === 6 && (
                <div className="space-y-4">
                  <StepHeader n={6} title="Skills" />
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap gap-2 min-h-[44px]">
                      {data.skills.map((sk, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: data.colors.primary }}>
                          {sk}
                          <button onClick={() => upd({ skills: data.skills.filter((_, j) => j !== i) })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/20">&times;</button>
                        </span>
                      ))}
                      {data.skills.length === 0 && <p className="text-xs text-slate-400 self-center">No skills yet...</p>}
                    </div>
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && skillInput.trim()) { e.preventDefault(); if (!data.skills.includes(skillInput.trim())) upd({ skills: [...data.skills, skillInput.trim()] }); setSkillInput(""); } }}
                      placeholder="Type skill → press Enter" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                    <p className="text-[11px] text-slate-400">Press <kbd className="bg-slate-200 rounded px-1 font-mono text-[10px]">Enter</kbd> to add each skill</p>
                  </div>
                </div>
              )}

              {/* ── STEP 7 ── */}
              {step === 7 && (
                <div className="space-y-4">
                  <StepHeader n={7} title="Education">
                    <AddBtn onClick={() => addItem("educations", { degree: "", institute: "", location: "", startMonth: "", endMonth: "", isCurrent: false })} />
                  </StepHeader>
                  {data.educations.length === 0 && <EmptyState icon={<GraduationCap size={28} />} label="No education added yet" />}
                  {data.educations.map((edu) => (
                    <div key={edu.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 relative">
                      <button onClick={() => delItem("educations", edu.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      <input value={edu.degree} onChange={(e) => updItem("educations", edu.id, "degree", e.target.value)} placeholder="Degree / Certificate" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-400 bg-white pr-10 placeholder:text-slate-300" />
                      <input value={edu.institute} onChange={(e) => updItem("educations", edu.id, "institute", e.target.value)} placeholder="University / Institute" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                      <input value={edu.location} onChange={(e) => updItem("educations", edu.id, "location", e.target.value)} placeholder="Location (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start</label>
                          <input type="date" value={edu.startMonth} onChange={(e) => updItem("educations", edu.id, "startMonth", e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">End</label>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 cursor-pointer">
                              <input type="checkbox" checked={edu.isCurrent} onChange={(e) => updItem("educations", edu.id, "isCurrent", e.target.checked)} className="accent-blue-600" /> Present
                            </label>
                          </div>
                          <input type="date" value={edu.endMonth} disabled={edu.isCurrent} onChange={(e) => updItem("educations", edu.id, "endMonth", e.target.value)} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white disabled:opacity-40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP 8 ── */}
              {step === 8 && (
                <div className="space-y-4">
                  <StepHeader n={8} title="Languages">
                    <AddBtn onClick={() => addItem("languages", { name: "", proficiency: "" })} />
                  </StepHeader>
                  {data.languages.length === 0 && <EmptyState icon={<span className="text-4xl font-black text-slate-200">Aa</span>} label="No languages added yet" />}
                  <div className="space-y-2">
                    {data.languages.map((lang) => (
                      <div key={lang.id} className="flex gap-2 items-center">
                        <input value={lang.name} onChange={(e) => updItem("languages", lang.id, "name", e.target.value)} placeholder="Language" className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                        <select value={lang.proficiency} onChange={(e) => updItem("languages", lang.id, "proficiency", e.target.value)} className="w-36 border border-slate-200 rounded-lg px-2 py-2.5 text-xs font-bold outline-none focus:border-blue-400 bg-white text-slate-700">
                          <option value="">Level</option>
                          <option>Native / Bilingual</option>
                          <option>Fluent</option>
                          <option>Intermediate</option>
                          <option>Basic</option>
                        </select>
                        <button onClick={() => delItem("languages", lang.id)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 9 ── */}
              {step === 9 && (
                <div className="space-y-4">
                  <StepHeader n={9} title="Certifications">
                    <AddBtn onClick={() => addItem("certifications", { title: "", platform: "", year: "" })} />
                  </StepHeader>
                  {data.certifications.length === 0 && <EmptyState icon={<Award size={28} />} label="No certifications added yet" />}
                  <div className="space-y-2">
                    {data.certifications.map((cert) => (
                      <div key={cert.id} className="grid grid-cols-[1fr_100px_58px_36px] gap-2 items-center">
                        <input value={cert.title} onChange={(e) => updItem("certifications", cert.id, "title", e.target.value)} placeholder="Title" className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                        <input value={cert.platform} onChange={(e) => updItem("certifications", cert.id, "platform", e.target.value)} placeholder="Platform" className="border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                        <input value={cert.year} onChange={(e) => updItem("certifications", cert.id, "year", e.target.value)} placeholder="Year" className="border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-400 bg-white placeholder:text-slate-300" />
                        <button onClick={() => delItem("certifications", cert.id)} className="w-9 h-9 flex items-center justify-center border border-red-200 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 10 ── */}
              {step === 10 && (
                <div className="space-y-5">
                  <StepHeader n={10} title="Export Resume" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Extra Sections (Optional)</p>
                      <AddBtn onClick={() => addItem("customSections", { title: "", desc: "" })} />
                    </div>
                    {data.customSections.map((sec) => (
                      <div key={sec.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 relative">
                        <button onClick={() => delItem("customSections", sec.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                        <input value={sec.title} onChange={(e) => updItem("customSections", sec.id, "title", e.target.value)} placeholder="Section Title" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-400 bg-white pr-10 placeholder:text-slate-300" />
                        <textarea value={sec.desc} onChange={(e) => updItem("customSections", sec.id, "desc", e.target.value)} rows={3} placeholder="Content (new line = bullet)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 bg-white resize-none placeholder:text-slate-300" />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-5 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Download</p>
                    <button onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white text-sm transition-all"
                      style={{ background: data.colors.primary, boxShadow: `0 4px 14px ${data.colors.primary}50` }}>
                      <Printer size={17} /> Print / Save as PDF
                      <span className="text-[10px] opacity-60 font-normal">(Best quality)</span>
                    </button>
                    <button onClick={handleDownload} disabled={isExporting}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white text-sm transition-all disabled:opacity-60">
                      {isExporting ? <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                      {isExporting ? "Generating..." : "Direct Download (Canvas PDF)"}
                    </button>
                  </div>
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2.5">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Send via Email</p>
                    <div className="flex gap-2">
                      <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@email.com"
                        className="flex-1 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white placeholder:text-slate-300" />
                      <button onClick={handleSendEmail} disabled={isSending}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                        {isSending ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-white rounded-full animate-spin" /> : <Mail size={14} />}
                        {isSending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-700">💡 All data auto-saves in your browser. Return anytime to continue editing.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Nav */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => setStep(s => Math.min(10, s + 1))} disabled={step === 10}
                className="flex items-center gap-1.5 px-5 py-2 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-40 shadow-sm"
                style={{ background: data.colors.primary }}>
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-700 px-4 py-1.5 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-bold text-slate-300">Live Preview · {TEMPLATES.find(t => t.id === data.template)?.label}</span>
              <span className="text-[10px] text-slate-500">A4 · 794 × 1123px</span>
            </div>
            <div className="flex-1 overflow-auto flex items-start justify-center p-6"
              style={{ background: "repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0 10px,#d1d9e0 10px,#d1d9e0 20px)" }}>
              <div style={{ transform: "scale(0.82)", transformOrigin: "top center", marginBottom: "-18%" }}>
                <ResumeDocument data={data} shapeStyle={shapeStyle} imgStyle={imgStyle} fontClass={nunito.className} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Resume Document Router ───────────────────────────────────────────────────
function ResumeDocument({ data, shapeStyle, imgStyle, fontClass }: {
  data: ResumeData; shapeStyle: React.CSSProperties; imgStyle: React.CSSProperties; fontClass: string;
}) {
  if (data.template === "light-sidebar") return <LightSidebarResume data={data} shapeStyle={shapeStyle} imgStyle={imgStyle} fontClass={fontClass} />;
  if (data.template === "classic") return <ClassicResume data={data} shapeStyle={shapeStyle} imgStyle={imgStyle} fontClass={fontClass} />;
  return <DarkSidebarResume data={data} shapeStyle={shapeStyle} imgStyle={imgStyle} fontClass={fontClass} />;
}

// ─── Shared resume props type ─────────────────────────────────────────────────
type RProps = { data: ResumeData; shapeStyle: React.CSSProperties; imgStyle: React.CSSProperties; fontClass: string };

// ─── Shared helpers ───────────────────────────────────────────────────────────
function DateRange({ start, end, isCurrent }: { start: string; end: string; isCurrent: boolean }) {
  const s = fmtDate(start), e = isCurrent ? "Present" : fmtDate(end);
  if (!s && !e) return null;
  return <>{s}{s || e ? " – " : ""}{e}</>;
}

function BulletLines({ text, color, textColor }: { text: string; color: string; textColor: string }) {
  return (
    <>
      {text.split("\n").filter(Boolean).map((line, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 2 }}>
          <span style={{ color, fontSize: 9, marginTop: 4, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: 11, color: textColor, lineHeight: "1.65" }}>{line}</span>
        </div>
      ))}
    </>
  );
}

// ─── Template 1: Dark Sidebar ─────────────────────────────────────────────────
function DarkSidebarResume({ data, shapeStyle, imgStyle, fontClass }: RProps) {
  const p = data.colors.primary, h = data.colors.heading, t = data.colors.text;
  const sz = data.imageSize || 96;
  const sW = "rgba(255,255,255,0.88)", sSub = "rgba(255,255,255,0.5)", sDiv = "rgba(255,255,255,0.18)";

  return (
    <div className={fontClass} style={{ width: 794, minHeight: 1123, background: "#fff", display: "flex", color: t, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      {/* Sidebar */}
      <div style={{ width: 230, background: p, padding: "40px 22px", display: "flex", flexDirection: "column", gap: 26, flexShrink: 0, alignSelf: "stretch" }}>
        {/* Photo + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {data.profileImage ? (
            <div style={{ ...shapeStyle, width: sz, height: sz, border: "3px solid rgba(255,255,255,0.35)", flexShrink: 0 }}>
              <img src={data.profileImage} alt="" style={imgStyle} />
            </div>
          ) : (
            <div style={{ ...shapeStyle, width: sz, height: sz, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={Math.max(20, sz * 0.3)} color="rgba(255,255,255,0.4)" />
            </div>
          )}
          {data.basicInfo.name && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.25, wordBreak: "break-word" }}>{data.basicInfo.name}</p>
              {data.basicInfo.title && <p style={{ fontSize: 9.5, fontWeight: 600, color: sSub, margin: "4px 0 0", letterSpacing: "0.04em", wordBreak: "break-word" }}>{data.basicInfo.title}</p>}
            </div>
          )}
        </div>
        <SideBlock title="Contact" divider={sDiv} tc={sW}>
          {[
            data.basicInfo.email    && { icon: <Mail size={11} />,         val: data.basicInfo.email },
            data.basicInfo.phone    && { icon: <Phone size={11} />,        val: data.basicInfo.phone },
            data.basicInfo.address  && { icon: <MapPin size={11} />,       val: data.basicInfo.address },
            data.basicInfo.linkedin && { icon: <Linkedin size={11} />,     val: data.basicInfo.linkedin },
            data.basicInfo.website  && { icon: <ExternalLink size={11} />, val: data.basicInfo.website },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 8 }}>
              <span style={{ color: sSub, flexShrink: 0, display: "flex", marginTop: 2 }}>{item.icon}</span>
              <span style={{ fontSize: 10, lineHeight: 1.5, color: sW, wordBreak: "break-all" }}>{item.val}</span>
            </div>
          ))}
        </SideBlock>
        {data.skills.length > 0 && (
          <SideBlock title="Skills" divider={sDiv} tc={sW}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {data.skills.map((sk, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: sSub, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: sW }}>{sk}</span>
                </div>
              ))}
            </div>
          </SideBlock>
        )}
        {data.languages.length > 0 && (
          <SideBlock title="Languages" divider={sDiv} tc={sW}>
            {data.languages.map((l) => (
              <div key={l.id} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: sW, margin: 0, lineHeight: 1.3 }}>{l.name}</p>
                {l.proficiency && <p style={{ fontSize: 9.5, color: sSub, margin: "1px 0 0" }}>{l.proficiency}</p>}
              </div>
            ))}
          </SideBlock>
        )}
      </div>
      {/* Main */}
      <MainArea data={data} p={p} h={h} t={t} />
    </div>
  );
}

// ─── Template 2: Light Sidebar ────────────────────────────────────────────────
function LightSidebarResume({ data, shapeStyle, imgStyle, fontClass }: RProps) {
  const p = data.colors.primary, h = data.colors.heading, t = data.colors.text;
  const sz = data.imageSize || 96;

  return (
    <div className={fontClass} style={{ width: 794, minHeight: 1123, background: "#fff", display: "flex", color: t, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      {/* Sidebar */}
      <div style={{ width: 230, background: "#f8fafc", borderRight: `1px solid #e2e8f0`, borderLeft: `4px solid ${p}`, padding: "40px 22px", display: "flex", flexDirection: "column", gap: 26, flexShrink: 0, alignSelf: "stretch" }}>
        {/* Photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {data.profileImage ? (
            <div style={{ ...shapeStyle, width: sz, height: sz, border: `3px solid ${p}`, flexShrink: 0 }}>
              <img src={data.profileImage} alt="" style={imgStyle} />
            </div>
          ) : (
            <div style={{ ...shapeStyle, width: sz, height: sz, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={Math.max(20, sz * 0.3)} color="#94a3b8" />
            </div>
          )}
          {data.basicInfo.name && (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 900, color: h, margin: 0, lineHeight: 1.25, wordBreak: "break-word" }}>{data.basicInfo.name}</p>
              {data.basicInfo.title && <p style={{ fontSize: 9.5, fontWeight: 600, color: p, margin: "4px 0 0", letterSpacing: "0.04em", wordBreak: "break-word" }}>{data.basicInfo.title}</p>}
            </div>
          )}
        </div>
        <SideBlock title="Contact" divider="#e2e8f0" tc={t} titleColor={p}>
          {[
            data.basicInfo.email    && { icon: <Mail size={11} />,         val: data.basicInfo.email },
            data.basicInfo.phone    && { icon: <Phone size={11} />,        val: data.basicInfo.phone },
            data.basicInfo.address  && { icon: <MapPin size={11} />,       val: data.basicInfo.address },
            data.basicInfo.linkedin && { icon: <Linkedin size={11} />,     val: data.basicInfo.linkedin },
            data.basicInfo.website  && { icon: <ExternalLink size={11} />, val: data.basicInfo.website },
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 8 }}>
              <span style={{ color: p, flexShrink: 0, display: "flex", marginTop: 2 }}>{item.icon}</span>
              <span style={{ fontSize: 10, lineHeight: 1.5, color: t, wordBreak: "break-all" }}>{item.val}</span>
            </div>
          ))}
        </SideBlock>
        {data.skills.length > 0 && (
          <SideBlock title="Skills" divider="#e2e8f0" tc={t} titleColor={p}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {data.skills.map((sk, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 600, background: `${p}14`, color: p, border: `1px solid ${p}28`, borderRadius: 4, padding: "2px 7px" }}>{sk}</span>
              ))}
            </div>
          </SideBlock>
        )}
        {data.languages.length > 0 && (
          <SideBlock title="Languages" divider="#e2e8f0" tc={t} titleColor={p}>
            {data.languages.map((l) => (
              <div key={l.id} style={{ marginBottom: 7 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: h, margin: 0 }}>{l.name}</p>
                {l.proficiency && <p style={{ fontSize: 9.5, color: t, opacity: 0.6, margin: "1px 0 0" }}>{l.proficiency}</p>}
              </div>
            ))}
          </SideBlock>
        )}
      </div>
      {/* Main */}
      <MainArea data={data} p={p} h={h} t={t} />
    </div>
  );
}

// ─── Template 3: Classic (top banner) ────────────────────────────────────────
function ClassicResume({ data, shapeStyle, imgStyle, fontClass }: RProps) {
  const p = data.colors.primary, h = data.colors.heading, t = data.colors.text;
  const sz = data.imageSize || 96;
  const bi = data.basicInfo;

  const contactItems = [
    bi.email    && { icon: <Mail size={10} />,         val: bi.email },
    bi.phone    && { icon: <Phone size={10} />,        val: bi.phone },
    bi.linkedin && { icon: <Linkedin size={10} />,     val: bi.linkedin },
    bi.website  && { icon: <ExternalLink size={10} />, val: bi.website },
    bi.address  && { icon: <MapPin size={10} />,       val: bi.address },
  ].filter(Boolean) as { icon: React.ReactNode; val: string }[];

  return (
    <div className={fontClass} style={{ width: 794, minHeight: 1123, background: "#fff", display: "flex", flexDirection: "column", color: t, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      {/* Header Banner */}
      <div style={{ background: p, padding: "28px 36px", display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
        {data.profileImage ? (
          <div style={{ ...shapeStyle, width: sz, height: sz, border: "3px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
            <img src={data.profileImage} alt="" style={imgStyle} />
          </div>
        ) : (
          <div style={{ ...shapeStyle, width: sz, height: sz, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ImageIcon size={Math.max(20, sz * 0.3)} color="rgba(255,255,255,0.5)" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.3px", textTransform: "uppercase", lineHeight: 1.05 }}>
            {bi.name || "YOUR NAME"}
          </h1>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {bi.title || "Your Professional Title"}
          </p>
        </div>
      </div>

      {/* Contact bar */}
      {contactItems.length > 0 && (
        <div style={{ background: "#f8fafc", borderBottom: `1px solid #e2e8f0`, padding: "8px 36px", display: "flex", flexWrap: "wrap", gap: "6px 20px", alignItems: "center" }}>
          {contactItems.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: p, display: "flex" }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: t }}>{item.val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content area: two columns */}
      <div style={{ flex: 1, display: "flex", padding: "28px 36px", gap: 28, minHeight: 0 }}>

        {/* Left main (65%) */}
        <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {data.summary && (
            <div>
              <ClassicSectionTitle title="Summary" primary={p} heading={h} />
              <p style={{ fontSize: 11.5, lineHeight: "1.8", color: t, margin: 0 }}>{data.summary}</p>
            </div>
          )}
          {data.experiences.length > 0 && (
            <div>
              <ClassicSectionTitle title="Work Experience" primary={p} heading={h} icon={<Briefcase size={12} />} />
              {data.experiences.map((exp, idx) => (
                <div key={exp.id} style={{ marginBottom: idx < data.experiences.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: h }}>{exp.role}</span>
                      {exp.company && <span style={{ fontSize: 11, fontWeight: 600, color: p }}> · {exp.company}</span>}
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: t, opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap" }}>
                      <DateRange start={exp.startMonth} end={exp.endMonth} isCurrent={exp.isCurrent} />
                    </span>
                  </div>
                  <BulletLines text={exp.desc} color={p} textColor={t} />
                  {exp.link && <p style={{ fontSize: 9.5, color: p, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><Link2 size={9} /><span style={{ wordBreak: "break-all" }}>{exp.link}</span></p>}
                </div>
              ))}
            </div>
          )}
          {data.projects.length > 0 && (
            <div>
              <ClassicSectionTitle title="Key Projects" primary={p} heading={h} icon={<FolderDot size={12} />} />
              {data.projects.map((proj, idx) => (
                <div key={proj.id} style={{ marginBottom: idx < data.projects.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: h, textTransform: "uppercase", letterSpacing: "0.03em" }}>{proj.name}</span>
                    {proj.link && <span style={{ fontSize: 9.5, color: p, display: "flex", alignItems: "center", gap: 3 }}><Link2 size={9} /> View</span>}
                  </div>
                  <BulletLines text={proj.desc} color={p} textColor={t} />
                  {proj.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                      {proj.tags.map((tag, i) => <span key={i} style={{ fontSize: 9, fontWeight: 700, background: `${p}18`, color: p, borderRadius: 3, padding: "2px 6px", border: `1px solid ${p}28` }}>{tag}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {data.customSections.map(sec => sec.title && (
            <div key={sec.id}>
              <ClassicSectionTitle title={sec.title} primary={p} heading={h} icon={<Sparkles size={12} />} />
              <BulletLines text={sec.desc} color={p} textColor={t} />
            </div>
          ))}
        </div>

        {/* Right sidebar (35%) */}
        <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {data.skills.length > 0 && (
            <div>
              <ClassicSectionTitle title="Skills" primary={p} heading={h} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {data.skills.map((sk, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 600, background: `${p}12`, color: p, border: `1px solid ${p}25`, borderRadius: 4, padding: "2px 7px" }}>{sk}</span>
                ))}
              </div>
            </div>
          )}
          {data.educations.length > 0 && (
            <div>
              <ClassicSectionTitle title="Education" primary={p} heading={h} icon={<GraduationCap size={12} />} />
              {data.educations.map((edu, idx) => (
                <div key={edu.id} style={{ marginBottom: idx < data.educations.length - 1 ? 10 : 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: h, margin: 0 }}>{edu.degree}</p>
                  <p style={{ fontSize: 10, color: t, margin: "1px 0 0" }}>{edu.institute}{edu.location ? `, ${edu.location}` : ""}</p>
                  <p style={{ fontSize: 9.5, color: t, opacity: 0.5, margin: "1px 0 0" }}><DateRange start={edu.startMonth} end={edu.endMonth} isCurrent={edu.isCurrent} /></p>
                </div>
              ))}
            </div>
          )}
          {data.languages.length > 0 && (
            <div>
              <ClassicSectionTitle title="Languages" primary={p} heading={h} />
              {data.languages.map(l => (
                <div key={l.id} style={{ marginBottom: 6 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: h, margin: 0 }}>{l.name}</p>
                  {l.proficiency && <p style={{ fontSize: 9.5, color: t, opacity: 0.6, margin: 0 }}>{l.proficiency}</p>}
                </div>
              ))}
            </div>
          )}
          {data.certifications.length > 0 && (
            <div>
              <ClassicSectionTitle title="Certifications" primary={p} heading={h} icon={<Award size={12} />} />
              {data.certifications.map(cert => (
                <div key={cert.id} style={{ display: "flex", alignItems: "flex-start", gap: 5, marginBottom: 7 }}>
                  <span style={{ color: p, fontSize: 9, marginTop: 3 }}>▸</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: h, margin: 0 }}>{cert.title}</p>
                    <p style={{ fontSize: 9.5, color: t, opacity: 0.6, margin: 0 }}>{cert.platform}{cert.year ? ` (${cert.year})` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MainArea (shared between dark+light sidebar templates) ───────────────────
function MainArea({ data, p, h, t }: { data: ResumeData; p: string; h: string; t: string }) {
  return (
    <div style={{ flex: 1, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
      {/* Header */}
      <div style={{ borderBottom: `2.5px solid ${p}`, paddingBottom: 14 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: h, lineHeight: 1.05, letterSpacing: "-0.3px", textTransform: "uppercase", margin: 0 }}>
          {data.basicInfo.name || "YOUR NAME"}
        </h1>
        <p style={{ fontSize: 12, fontWeight: 700, color: p, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {data.basicInfo.title || "Your Professional Title"}
        </p>
      </div>
      {data.summary && <p style={{ fontSize: 11.5, lineHeight: "1.8", color: t, margin: 0 }}>{data.summary}</p>}

      {data.experiences.length > 0 && (
        <MainBlock icon={<Briefcase size={13} />} title="Work Experience" p={p} h={h}>
          {data.experiences.map((exp, idx) => (
            <div key={exp.id} style={{ marginBottom: idx < data.experiences.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: h }}>{exp.role}</span>
                  {exp.company && <span style={{ fontSize: 11, fontWeight: 600, color: p }}> · {exp.company}</span>}
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: t, opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap" }}>
                  <DateRange start={exp.startMonth} end={exp.endMonth} isCurrent={exp.isCurrent} />
                </span>
              </div>
              <BulletLines text={exp.desc} color={p} textColor={t} />
              {exp.link && <p style={{ fontSize: 9.5, color: p, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><Link2 size={9} /><span style={{ wordBreak: "break-all" }}>{exp.link}</span></p>}
            </div>
          ))}
        </MainBlock>
      )}

      {data.projects.length > 0 && (
        <MainBlock icon={<FolderDot size={13} />} title="Key Projects" p={p} h={h}>
          {data.projects.map((proj, idx) => (
            <div key={proj.id} style={{ marginBottom: idx < data.projects.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: h, textTransform: "uppercase", letterSpacing: "0.03em" }}>{proj.name}</span>
                {proj.link && <span style={{ fontSize: 9.5, color: p, display: "flex", alignItems: "center", gap: 3 }}><Link2 size={9} /> View</span>}
              </div>
              <BulletLines text={proj.desc} color={p} textColor={t} />
              {proj.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                  {proj.tags.map((tag, i) => <span key={i} style={{ fontSize: 9, fontWeight: 700, background: `${p}18`, color: p, borderRadius: 3, padding: "2px 6px", border: `1px solid ${p}28` }}>{tag}</span>)}
                </div>
              )}
            </div>
          ))}
        </MainBlock>
      )}

      {data.educations.length > 0 && (
        <MainBlock icon={<GraduationCap size={13} />} title="Education" p={p} h={h}>
          {data.educations.map((edu, idx) => (
            <div key={edu.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: idx < data.educations.length - 1 ? 10 : 0 }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: h, margin: 0 }}>{edu.degree}</p>
                <p style={{ fontSize: 11, color: t, margin: "2px 0 0" }}>{edu.institute}{edu.location ? ` — ${edu.location}` : ""}</p>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: t, opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap" }}>
                <DateRange start={edu.startMonth} end={edu.endMonth} isCurrent={edu.isCurrent} />
              </span>
            </div>
          ))}
        </MainBlock>
      )}

      {data.certifications.length > 0 && (
        <MainBlock icon={<Award size={13} />} title="Certifications" p={p} h={h}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
            {data.certifications.map((cert) => (
              <div key={cert.id} style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                <span style={{ color: p, fontSize: 9, marginTop: 4 }}>▸</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: h, margin: 0 }}>{cert.title}</p>
                  <p style={{ fontSize: 9.5, color: t, opacity: 0.6, margin: 0 }}>{cert.platform}{cert.year ? ` (${cert.year})` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </MainBlock>
      )}

      {data.customSections.map(sec => sec.title && (
        <MainBlock key={sec.id} icon={<Sparkles size={13} />} title={sec.title} p={p} h={h}>
          <BulletLines text={sec.desc} color={p} textColor={t} />
        </MainBlock>
      ))}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SideBlock({ title, divider, tc, titleColor, children }: {
  title: string; divider: string; tc: string; titleColor?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ borderBottom: `1px solid ${divider}`, paddingBottom: 5, marginBottom: 10 }}>
        <p style={{ fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: titleColor || tc, margin: 0, opacity: titleColor ? 1 : 0.75 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function MainBlock({ icon, title, p, h, children }: {
  icon: React.ReactNode; title: string; p: string; h: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 7, marginBottom: 12, borderBottom: `2px solid ${p}` }}>
        <span style={{ color: p, display: "flex" }}>{icon}</span>
        <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: h, margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function ClassicSectionTitle({ title, primary, heading, icon }: {
  title: string; primary: string; heading: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: `1.5px solid ${primary}`, paddingBottom: 5, marginBottom: 10 }}>
      {icon && <span style={{ color: primary, display: "flex" }}>{icon}</span>}
      <p style={{ fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: heading, margin: 0 }}>{title}</p>
    </div>
  );
}
