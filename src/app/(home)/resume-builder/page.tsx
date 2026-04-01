"use client";

import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Swal from "sweetalert2";
import { 
  Download, Image as ImageIcon, MapPin, Mail, Phone, ExternalLink, 
  Trash2, Plus, ArrowRight, ArrowLeft, Send, Briefcase, GraduationCap, 
  Settings, FolderDot, Link2, Sparkles, Award
} from "lucide-react";

// Types
type BasicInfo = { name: string; title: string; phone: string; email: string; website: string; address: string };
type Experience = { id: string; role: string; company: string; startMonth: string; endMonth: string; isCurrent: boolean; desc: string; link: string };
type Project = { id: string; name: string; desc: string; tags: string[]; link: string };
type Education = { id: string; degree: string; institute: string; location: string; startMonth: string; endMonth: string; isCurrent: boolean; };
type Language = { id: string; name: string; proficiency: string };
type Certification = { id: string; title: string; platform: string; year: string };
type CustomSection = { id: string; title: string; desc: string };

type ResumeData = {
  profileImage: string;
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

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: ResumeData = {
  profileImage: "",
  basicInfo: { name: "", title: "", phone: "", email: "", website: "", address: "" },
  summary: "",
  experiences: [],
  projects: [],
  skills: [],
  educations: [],
  languages: [],
  certifications: [],
  customSections: []
};

// Date Formatter helper
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function ResumeBuilder() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [projectTagInput, setProjectTagInput] = useState("");

  const resumeRef = useRef<HTMLDivElement>(null);

  const nextStep = () => setStep(s => Math.min(10, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  // Auto-Save: Load
  useEffect(() => {
    const saved = localStorage.getItem("tf_resumeBuilderData");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Local storage parse error");
      }
    }
    setIsLoaded(true);
    
    fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Anonymous Visitor",
        department: "Page Visit",
        action: "VISIT"
      }),
    }).catch(() => {});
  }, []);

  // Auto-Save: Save
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("tf_resumeBuilderData", JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateData = (updates: Partial<ResumeData>) => setData({ ...data, ...updates });
  const updateBasicInfo = (key: keyof BasicInfo, value: string) => updateData({ basicInfo: { ...data.basicInfo, [key]: value } });

  const addArrayItem = (key: keyof ResumeData, emptyObj: any) => {
    const newArr = [...(data[key] as any[]), { ...emptyObj, id: generateId() }];
    updateData({ [key]: newArr });
  };
  const removeArrayItem = (key: keyof ResumeData, id: string) => {
    const newArr = (data[key] as any[]).filter(item => item.id !== id);
    updateData({ [key]: newArr });
  };
  const updateArrayItem = (key: keyof ResumeData, id: string, field: string, value: any) => {
    const newArr = (data[key] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item);
    updateData({ [key]: newArr });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => updateData({ profileImage: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSkillAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!data.skills.includes(skillInput.trim())) {
        updateData({ skills: [...data.skills, skillInput.trim()] });
      }
      setSkillInput("");
    }
  };

  const handleProjectTagAdd = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === "Enter" && projectTagInput.trim()) {
      e.preventDefault();
      const proj = data.projects.find(p => p.id === projectId);
      if (proj && !proj.tags.includes(projectTagInput.trim())) {
        updateArrayItem("projects", projectId, "tags", [...proj.tags, projectTagInput.trim()]);
      }
      setProjectTagInput("");
    }
  };

  const removeProjectTag = (projectId: string, tagIndex: number) => {
    const proj = data.projects.find(p => p.id === projectId);
    if (proj) {
       const newTags = [...proj.tags];
       newTags.splice(tagIndex, 1);
       updateArrayItem("projects", projectId, "tags", newTags);
    }
  };

  const logMetric = (action: string, target?: string) => {
    fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: data.basicInfo.name || "Anonymous",
        department: target || "Action Link",
        action: action
      }),
    }).catch(() => {});
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      logMetric("DOWNLOAD_PDF");

      if (resumeRef.current) {
        // Find and replace any non-hex Tailwind color vars automatically rendered via css if needed. 
        // We use pure hex codes now to prevent the 'lab' CSS var error inside html2canvas.
        const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${data.basicInfo.name || "Resume"}.pdf`);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to generate PDF. Lab color issue fixed." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      Swal.fire({ icon: "warning", title: "Missing Email", text: "Please enter a destination email." });
      return;
    }
    setIsSending(true);
    try {
      if (resumeRef.current) {
        const canvas = await html2canvas(resumeRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
        const pdfDataUri = canvas.toDataURL("image/jpeg", 0.6);

        const res = await fetch("/api/resumes/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: emailTo,
            studentName: data.basicInfo.name,
            pdfDataUri: pdfDataUri
          }),
        });
        const respData = await res.json();
        
        if (!res.ok) throw new Error(respData.error || "Email failed");
        
        Swal.fire({ icon: "success", title: "Sent!", text: `Resume sent safely.` });
        setEmailTo("");
        logMetric("EMAIL_SENT", emailTo);
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Limitation Details", text: err.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pt-4 px-2 pb-10 font-sans">
      
      {/* GLOBAL PROGRESS BAR */}
      <div className="max-w-[1400px] w-full mx-auto mb-4 px-2">
         <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-extrabold text-slate-800">Pro Resume Generator</h1>
            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Step {step} of 10</span>
         </div>
         <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(step / 10) * 100}%` }}></div>
         </div>
      </div>

      <div className="container mx-auto max-w-[1400px] h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6">
        
        {/* LEFT MULTI-STEP FORM */}
        <div className="w-full lg:w-[45%] flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           
          <div className="flex-1 overflow-y-auto w-full p-6 space-y-6 hide-scrollbar custom-form">
            
            {/* Step 1: Profile Image */}
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-5">1. Profile Image</h3>
                <div className="flex flex-col gap-4 items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                  {data.profileImage ? (
                    <div className="relative">
                      <img src={data.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                      <button onClick={() => updateData({ profileImage: "" })} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600"><Trash2 size={14}/></button>
                    </div>
                  ) : (
                    <ImageIcon className="text-slate-400 w-16 h-16" />
                  )}
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition shadow-md">
                    Upload Local Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-400">Optimal ratio 1:1, Max 2MB</p>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-5">2. Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                    <input type="text" value={data.basicInfo.name} onChange={(e) => updateBasicInfo('name', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Job Title</label>
                    <input type="text" value={data.basicInfo.title} onChange={(e) => updateBasicInfo('title', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="Junior Software Engineer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                      <input type="text" value={data.basicInfo.phone} onChange={(e) => updateBasicInfo('phone', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="+880 1..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                      <input type="email" value={data.basicInfo.email} onChange={(e) => updateBasicInfo('email', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="you@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Website / Portfolio</label>
                    <input type="text" value={data.basicInfo.website} onChange={(e) => updateBasicInfo('website', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Full Address</label>
                    <input type="text" value={data.basicInfo.address} onChange={(e) => updateBasicInfo('address', e.target.value)} className="w-full border border-slate-300 rounded p-2.5 mt-1 outline-none focus:border-blue-500" placeholder="Dhaka, Bangladesh" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-5">3. Professional Summary</h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Summary (Max 500 chars)</label>
                  <textarea 
                    value={data.summary} 
                    onChange={(e) => updateData({ summary: e.target.value.substring(0, 500) })} 
                    rows={8} 
                    className="w-full border border-slate-300 rounded p-2.5 outline-none focus:border-blue-500 resize-none text-sm leading-relaxed" 
                    placeholder="Results-driven software engineer..."
                  />
                  <div className="text-right text-xs font-semibold text-slate-400">
                    {data.summary.length}/500
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Work Experience */}
            {step === 4 && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">4. Work Experience</h3>
                    <button onClick={() => addArrayItem("experiences", {role: "", company: "", startMonth: "", endMonth: "", isCurrent: false, desc: "", link: ""})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Experience</button>
                 </div>
                 <div className="space-y-4">
                    {data.experiences.map((exp) => (
                      <div key={exp.id} className="border border-slate-200 p-4 rounded-xl bg-slate-50 relative space-y-3">
                        <button onClick={() => removeArrayItem("experiences", exp.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        <input type="text" value={exp.role} onChange={(e) => updateArrayItem('experiences', exp.id, 'role', e.target.value)} placeholder="Role (e.g. Junior Web Developer)" className="w-full border border-slate-300 rounded p-2 text-sm font-semibold pr-8" />
                        <input type="text" value={exp.company} onChange={(e) => updateArrayItem('experiences', exp.id, 'company', e.target.value)} placeholder="Company Name" className="w-full border border-slate-300 rounded p-2 text-sm" />
                        
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                              <input type="month" value={exp.startMonth} onChange={(e) => updateArrayItem('experiences', exp.id, 'startMonth', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm" />
                           </div>
                           <div>
                              <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block">End Date</label>
                                <label className="text-[10px] font-bold text-blue-600 flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateArrayItem('experiences', exp.id, 'isCurrent', e.target.checked)} />
                                  Present
                                </label>
                              </div>
                              <input type="month" value={exp.endMonth} onChange={(e) => updateArrayItem('experiences', exp.id, 'endMonth', e.target.value)} disabled={exp.isCurrent} className="w-full border border-slate-300 rounded p-2 text-sm disabled:opacity-50" />
                           </div>
                        </div>

                        <textarea value={exp.desc} onChange={(e) => updateArrayItem('experiences', exp.id, 'desc', e.target.value)} placeholder="Role description..." rows={3} className="w-full border border-slate-300 rounded p-2 text-sm resize-none" />
                        <input type="text" value={exp.link} onChange={(e) => updateArrayItem('experiences', exp.id, 'link', e.target.value)} placeholder="Link (Optional) https://..." className="w-full border border-slate-300 rounded p-2 text-sm text-green-700" />
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 5: Projects */}
            {step === 5 && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">5. Projects</h3>
                    <button onClick={() => addArrayItem("projects", {name: "", desc: "", tags: [], link: ""})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Project</button>
                 </div>
                 <div className="space-y-4">
                    {data.projects.map((proj) => (
                      <div key={proj.id} className="border border-slate-200 p-4 rounded-xl bg-slate-50 relative space-y-3">
                        <button onClick={() => removeArrayItem("projects", proj.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        <input type="text" value={proj.name} onChange={(e) => updateArrayItem('projects', proj.id, 'name', e.target.value)} placeholder="Project Name" className="w-full border border-slate-300 rounded p-2 text-sm font-semibold pr-8" />
                        <textarea value={proj.desc} onChange={(e) => updateArrayItem('projects', proj.id, 'desc', e.target.value)} placeholder="Project description..." rows={2} className="w-full border border-slate-300 rounded p-2 text-sm resize-none" />
                        
                        {/* Tech Tags */}
                        <div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {proj.tags.map((tag, i) => (
                               <span key={i} className="bg-slate-200 text-slate-700 px-2 py-1 text-xs rounded-md flex items-center gap-1">
                                 {tag} <button onClick={() => removeProjectTag(proj.id, i)} className="text-slate-500 hover:text-red-500">&times;</button>
                               </span>
                            ))}
                          </div>
                          <input type="text" value={projectTagInput} onChange={(e) => setProjectTagInput(e.target.value)} onKeyDown={(e) => handleProjectTagAdd(e, proj.id)} placeholder="Type tech stack & Press Enter..." className="w-full border border-slate-300 rounded p-2 text-xs" />
                        </div>
                        
                        <input type="text" value={proj.link} onChange={(e) => updateArrayItem('projects', proj.id, 'link', e.target.value)} placeholder="Live Link / Repo" className="w-full border border-slate-300 rounded p-2 text-sm text-green-700" />
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 6: Skills */}
            {step === 6 && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-5">6. Skills</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-semibold">
                        {skill}
                        <button onClick={() => updateData({ skills: data.skills.filter((_, i) => i !== index) })} className="bg-blue-200 hover:bg-red-400 hover:text-white rounded-full p-0.5 transition"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    value={skillInput} 
                    onChange={e => setSkillInput(e.target.value)} 
                    onKeyDown={handleSkillAdd} 
                    placeholder="Type a skill and press Enter (e.g. React, Node.js)" 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" 
                  />
                  <p className="text-xs font-semibold text-slate-400">Press enter to lock in a new skill.</p>
                </div>
              </div>
            )}

            {/* Step 7: Education */}
            {step === 7 && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">7. Education</h3>
                    <button onClick={() => addArrayItem("educations", {degree: "", institute: "", location: "", startMonth: "", endMonth: "", isCurrent: false})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Education</button>
                 </div>
                 <div className="space-y-4">
                    {data.educations.map((edu) => (
                      <div key={edu.id} className="border border-slate-200 p-4 rounded-xl bg-slate-50 relative space-y-3">
                        <button onClick={() => removeArrayItem("educations", edu.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        <input type="text" value={edu.degree} onChange={(e) => updateArrayItem('educations', edu.id, 'degree', e.target.value)} placeholder="Degree / Title" className="w-full border border-slate-300 rounded p-2 text-sm font-semibold pr-8" />
                        <input type="text" value={edu.institute} onChange={(e) => updateArrayItem('educations', edu.id, 'institute', e.target.value)} placeholder="Institute Name" className="w-full border border-slate-300 rounded p-2 text-sm" />
                        <input type="text" value={edu.location} onChange={(e) => updateArrayItem('educations', edu.id, 'location', e.target.value)} placeholder="Location" className="w-full border border-slate-300 rounded p-2 text-sm" />
                        
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                              <input type="month" value={edu.startMonth} onChange={(e) => updateArrayItem('educations', edu.id, 'startMonth', e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm" />
                           </div>
                           <div>
                              <div className="flex justify-between items-end mb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block">End Date</label>
                                <label className="text-[10px] font-bold text-blue-600 flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={edu.isCurrent} onChange={(e) => updateArrayItem('educations', edu.id, 'isCurrent', e.target.checked)} />
                                  Present
                                </label>
                              </div>
                              <input type="month" value={edu.endMonth} onChange={(e) => updateArrayItem('educations', edu.id, 'endMonth', e.target.value)} disabled={edu.isCurrent} className="w-full border border-slate-300 rounded p-2 text-sm disabled:opacity-50" />
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 8: Languages */}
            {step === 8 && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">8. Languages</h3>
                    <button onClick={() => addArrayItem("languages", {name: "", proficiency: ""})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Language</button>
                 </div>
                 <div className="space-y-3">
                    {data.languages.map((lang) => (
                      <div key={lang.id} className="flex gap-2">
                        <input type="text" value={lang.name} onChange={(e) => updateArrayItem('languages', lang.id, 'name', e.target.value)} placeholder="Language Name" className="flex-1 border border-slate-300 rounded p-2 text-sm" />
                        <select value={lang.proficiency} onChange={(e) => updateArrayItem('languages', lang.id, 'proficiency', e.target.value)} className="w-[140px] border border-slate-300 rounded p-2 text-sm outline-none">
                           <option value="">Select Level</option>
                           <option value="Native or Bilingual">Native / Bilingual</option>
                           <option value="Fluent">Fluent</option>
                           <option value="Intermediate">Intermediate</option>
                           <option value="Basic">Basic</option>
                        </select>
                        <button onClick={() => removeArrayItem("languages", lang.id)} className="p-2 border border-slate-200 rounded text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 9: Certifications */}
            {step === 9 && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">9. Certifications (Optional)</h3>
                    <button onClick={() => addArrayItem("certifications", {title: "", platform: "", year: ""})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Cert</button>
                 </div>
                 <div className="space-y-3">
                    {data.certifications.map((cert) => (
                      <div key={cert.id} className="flex gap-2 border p-3 rounded-lg border-slate-200 bg-slate-50 relative pr-10">
                        <input type="text" value={cert.title} onChange={(e) => updateArrayItem('certifications', cert.id, 'title', e.target.value)} placeholder="Title" className="flex-1 border border-slate-300 rounded p-2 text-sm" />
                        <input type="text" value={cert.platform} onChange={(e) => updateArrayItem('certifications', cert.id, 'platform', e.target.value)} placeholder="Platform" className="w-[120px] border border-slate-300 rounded p-2 text-sm" />
                        <input type="text" value={cert.year} onChange={(e) => updateArrayItem('certifications', cert.id, 'year', e.target.value)} placeholder="Year" className="w-[80px] border border-slate-300 rounded p-2 text-sm" />
                        <button onClick={() => removeArrayItem("certifications", cert.id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 10: Extra Sections / Output */}
            {step === 10 && (
              <div className="animate-in fade-in duration-300 pb-20">
                 <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800">10. Custom Extra Section (Optional)</h3>
                    <button onClick={() => addArrayItem("customSections", {title: "", desc: ""})} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded flex items-center gap-1"><Plus size={14}/> Add Item</button>
                 </div>
                 <p className="text-xs text-slate-500 mb-4">Use this to add achievements, generic freelance details, or interests.</p>
                 <div className="space-y-4 mb-8">
                    {data.customSections.map((sec) => (
                      <div key={sec.id} className="border border-slate-200 p-3 rounded-lg relative">
                         <button onClick={() => removeArrayItem("customSections", sec.id)} className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                         <input type="text" value={sec.title} onChange={(e) => updateArrayItem('customSections', sec.id, 'title', e.target.value)} placeholder="Section Title (e.g. Winner of Hackathon)" className="w-full border border-slate-300 rounded p-2 text-sm mb-2 pr-10 font-bold" />
                         <textarea value={sec.desc} onChange={(e) => updateArrayItem('customSections', sec.id, 'desc', e.target.value)} placeholder="Description..." rows={2} className="w-full border border-slate-300 rounded p-2 text-sm resize-none" />
                      </div>
                    ))}
                 </div>

                 {/* FINAL OUTPUT ACTION */}
                 <div className="pt-6 border-t border-slate-200">
                   <h3 className="text-2xl font-black text-slate-800 mb-2">Completion Action!</h3>
                   <p className="text-sm text-slate-500 mb-6">Your data is auto-saved locally. Export to PDF or send via Email below.</p>
                   
                   <div className="grid grid-cols-1 gap-4">
                     <button onClick={handleDownload} disabled={isGenerating} className="flex justify-center items-center gap-2 w-full py-4 rounded-xl font-bold bg-slate-900 text-white shadow hover:bg-slate-800 transition">
                       {isGenerating ? <div className="h-5 w-5 animate-spin border-2 border-slate-400 border-t-white rounded-full"></div> : <Download size={20} />}
                       {isGenerating ? "Processing Direct PDF..." : "Download High-Quality PDF"}
                     </button>
                     
                     <div className="border border-blue-200 bg-blue-50 p-4 rounded-xl flex items-center gap-2 shadow-inner">
                        <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="Enter email to receive file" className="flex-1 p-3 rounded bg-white border border-blue-200 outline-none text-sm" />
                        <button onClick={handleSendEmail} disabled={isSending} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold shadow-md transition disabled:opacity-50 min-w-[120px] flex justify-center items-center">
                          {isSending ? <div className="h-5 w-5 animate-spin border-2 border-blue-400 border-t-white rounded-full"></div> : <Send size={18}/>}
                        </button>
                     </div>
                   </div>
                 </div>

              </div>
            )}

          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-between items-center shrink-0">
             <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
               <ArrowLeft size={16}/> Back Step
             </button>
             {step < 10 ? (
                <button onClick={nextStep} className="flex items-center gap-1.5 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow hover:bg-slate-800 transition">
                  Next Step <ArrowRight size={16}/>
                </button>
             ) : (
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-6 py-2 border border-slate-300 bg-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100 transition">
                  Review Data
                </button>
             )}
          </div>
        </div>


        {/* RIGHT PREVIEW CANVAS */}
        <div className="w-full lg:w-[55%] h-full bg-[#cbd5e1] rounded-xl flex items-start justify-center p-4 overflow-y-auto shadow-inner relative">
          
          <div className="resume-canvas-scaler" style={{ transform: "scale(0.85)", transformOrigin: "top center", paddingBottom: "100px" }}>
            
            {/* 
                WARNING / FIX for "lab plugin error" in html2canvas: 
                ALL Tailwind color classes like `text-slate-900` or `bg-slate-100` are COMPLETELY removed or mapped to strict HEX colors 
                because Tailwind v4 uses `oklch/lab` inside CSS variables which crashes html2canvas! 
            */}
            <div 
               ref={resumeRef}
               className="font-sans w-[794px] min-h-[1123px] shadow-2xl flex flex-row overflow-hidden relative"
               style={{ fontFamily: "'Inter', 'Roboto', sans-serif", backgroundColor: "#ffffff" }}
            >
                {/* --- LEFT SIDEBAR (Width fixed approx 1/3) --- */}
                <div style={{ backgroundColor: "#f8fafc", width: "30%", minHeight: "100%" }} className="flex flex-col pt-10 px-5 pb-10 border-r border-[#e2e8f0]">
                    
                    {/* Profile & Contact */}
                    <div className="flex flex-col items-center border-b border-[#e2e8f0] pb-6 mb-6">
                        {data.profileImage ? (
                           <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white shadow-md mb-4 bg-white flex-shrink-0">
                              <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                           </div>
                        ) : (
                           <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4 shadow-sm border-2 border-white" style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}>
                              <ImageIcon size={32} />
                           </div>
                        )}
                        <h2 className="text-[14px] font-bold text-center uppercase tracking-widest px-2 leading-snug" style={{ color: "#1e293b" }}>Details</h2>
                        <div className="flex flex-col items-start w-full mt-4 gap-2.5 text-[12px] font-medium" style={{ color: "#475569" }}>
                           {data.basicInfo.email && (
                             <div className="flex items-center gap-2 w-full break-all">
                                <Mail size={14} style={{ color: "#94a3b8" }} /> {data.basicInfo.email}
                             </div>
                           )}
                           {data.basicInfo.phone && (
                             <div className="flex items-center gap-2 w-full break-all">
                                <Phone size={14} style={{ color: "#94a3b8" }} /> {data.basicInfo.phone}
                             </div>
                           )}
                           {data.basicInfo.address && (
                             <div className="flex items-center gap-2 w-full">
                                <MapPin size={14} style={{ color: "#94a3b8", flexShrink: 0 }} /> <span>{data.basicInfo.address}</span>
                             </div>
                           )}
                           {data.basicInfo.website && (
                             <div className="flex items-center gap-2 w-full break-all font-semibold" style={{ color: "#2563eb" }}>
                                <ExternalLink size={14} style={{ color: "#2563eb", flexShrink: 0 }} /> {data.basicInfo.website}
                             </div>
                           )}
                        </div>
                    </div>

                    {/* Languages */}
                    {data.languages.length > 0 && (
                       <div className="border-b border-[#e2e8f0] pb-6 mb-6">
                          <h2 className="text-[14px] font-bold uppercase tracking-widest mb-3" style={{ color: "#1e293b" }}>Languages</h2>
                          <div className="flex flex-col gap-2">
                             {data.languages.map(lang => (
                                <div key={lang.id} className="text-left w-full">
                                   <p className="text-[13px] font-semibold leading-tight" style={{ color: "#1e293b" }}>{lang.name}</p>
                                   <p className="text-[11px]" style={{ color: "#64748b" }}>{lang.proficiency}</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Skills Component moved to Left as per request Left Sidebar Details */}
                    {data.skills.length > 0 && (
                       <div className="pb-6">
                          <h2 className="text-[14px] font-bold uppercase tracking-widest mb-4" style={{ color: "#1e293b" }}>Skills</h2>
                          <div className="flex flex-wrap gap-2 text-left">
                             {data.skills.map((skill, index) => (
                                <span key={index} className="border border-[#cbd5e1] rounded-md px-2 py-1 text-[11px] font-bold shadow-sm" style={{ backgroundColor: "#ffffff", color: "#334155" }}>
                                   {skill}
                                </span>
                             ))}
                          </div>
                       </div>
                    )}

                </div>

                {/* --- RIGHT MAIN CONTENT (Width 2/3) --- */}
                <div style={{ backgroundColor: "#ffffff", width: "70%" }} className="pt-10 px-8 pb-10 flex flex-col gap-6">
                    
                    {/* Header Info */}
                    <div className="border-b border-[#e2e8f0] pb-5">
                       <h1 className="text-[36px] font-black leading-none tracking-tight uppercase" style={{ color: "#0f172a" }}>{data.basicInfo.name || "YOUR NAME"}</h1>
                       <h2 className="text-[16px] font-bold mt-2 tracking-wide" style={{ color: "#059669" }}>{data.basicInfo.title || "Your Professional Title"}</h2>
                    </div>

                    {/* Summary */}
                    {data.summary && (
                       <div>
                          <p className="text-[13px] leading-relaxed text-justify font-medium" style={{ color: "#334155" }}>
                            {data.summary}
                          </p>
                       </div>
                    )}

                    {/* Work Experience */}
                    {data.experiences.length > 0 && (
                       <div className="pt-2">
                          <h3 className="text-[16px] font-bold uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-1 flex items-center gap-2" style={{ color: "#0f172a" }}>
                              <Briefcase size={18} style={{ color: "#059669" }} /> Work Experience
                          </h3>
                          <div className="flex flex-col gap-5">
                             {data.experiences.map(exp => (
                               <div key={exp.id} className="relative">
                                  <div className="flex justify-between items-baseline mb-1 grid grid-cols-[1fr_auto]">
                                     <h4 className="text-[15px] font-bold leading-snug" style={{ color: "#0f172a" }}>{exp.role} <span className="font-semibold" style={{ color: "#047857" }}>| {exp.company}</span></h4>
                                     <span className="text-[12px] font-bold pl-2 text-right" style={{ color: "#64748b" }}>
                                        {formatDate(exp.startMonth)} - {exp.isCurrent ? "Present" : formatDate(exp.endMonth)}
                                     </span>
                                  </div>
                                  <p className="text-[12px] mt-1.5 whitespace-pre-wrap leading-relaxed" style={{ color: "#334155" }}>{exp.desc}</p>
                                  {exp.link && (
                                     <p className="text-[11px] font-medium mt-1.5 flex items-center gap-1" style={{ color: "#2563eb" }}>
                                        <Link2 size={12}/> {exp.link}
                                     </p>
                                  )}
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Projects */}
                    {data.projects.length > 0 && (
                       <div className="pt-2">
                          <h3 className="text-[16px] font-bold uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-1 flex items-center gap-2" style={{ color: "#0f172a" }}>
                              <FolderDot size={18} style={{ color: "#059669" }} /> Key Projects
                          </h3>
                          <div className="flex flex-col gap-5">
                             {data.projects.map(proj => (
                               <div key={proj.id}>
                                  <div className="flex justify-between items-baseline mb-1">
                                     <h4 className="text-[15px] font-bold" style={{ color: "#0f172a" }}>{proj.name}</h4>
                                     {proj.link && <a href={proj.link} className="text-[11px] font-bold underline" style={{ color: "#2563eb" }}>View Project</a>}
                                  </div>
                                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#334155" }}>{proj.desc}</p>
                                  {proj.tags && proj.tags.length > 0 && (
                                     <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {proj.tags.map((t, i) => (
                                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{t}</span>
                                        ))}
                                     </div>
                                  )}
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Education */}
                    {data.educations.length > 0 && (
                       <div className="pt-2">
                          <h3 className="text-[16px] font-bold uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-1 flex items-center gap-2" style={{ color: "#0f172a" }}>
                             <GraduationCap size={18} style={{ color: "#059669" }} /> Education
                          </h3>
                          <div className="flex flex-col gap-4">
                             {data.educations.map(edu => (
                               <div key={edu.id}>
                                 <div className="flex justify-between items-baseline min-w-0">
                                    <h4 className="text-[14px] font-bold truncate pr-2" style={{ color: "#0f172a" }}>{edu.degree}</h4>
                                    <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: "#64748b" }}>
                                       {formatDate(edu.startMonth)} - {edu.isCurrent ? "Present" : formatDate(edu.endMonth)}
                                    </span>
                                 </div>
                                 <p className="text-[12px] mt-0.5" style={{ color: "#475569" }}>{edu.institute} {edu.location && `— ${edu.location}`}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Certifications (Optional) */}
                    {data.certifications.length > 0 && (
                       <div className="pt-2">
                          <h3 className="text-[16px] font-bold uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-1 flex items-center gap-2" style={{ color: "#0f172a" }}>
                              <Award size={18} style={{ color: "#059669" }} /> Certifications
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                             {data.certifications.map(cert => (
                               <div key={cert.id} className="text-[12px]">
                                 <p className="font-bold" style={{ color: "#0f172a" }}>{cert.title}</p>
                                 <p style={{ color: "#475569" }}>{cert.platform} <span style={{ color: "#94a3b8" }}>({cert.year})</span></p>
                               </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Custom Sections (Optional) */}
                    {data.customSections.map(sec => (
                       <div key={sec.id} className="pt-2">
                          <h3 className="text-[16px] font-bold uppercase tracking-wider mb-3 border-b border-[#e2e8f0] pb-1 flex items-center gap-2" style={{ color: "#0f172a" }}>
                             <Sparkles size={18} style={{ color: "#059669" }} /> {sec.title}
                          </h3>
                          <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "#334155" }}>{sec.desc}</p>
                       </div>
                    ))}

                </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
