"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import Swal from "sweetalert2";

const DEPARTMENTS = [
  "Department of Computer Science & Engineering",
  "Department of Civil Engineering",
  "Department of Electrical & Electronic Engineering",
  "Department of Electrical & Telecommunication Engineering",
  "Department of Business Administration",
  "Department of English",
  "Department of Law",
  "Department of Economics",
];

const DesignRequestForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    // File ba reference link — ekta to lagbei, na hole design ta dekhbo kivabe
    const file = formData.get("designFile");
    const hasFile = file instanceof File && file.size > 0;
    const referenceLink = String(formData.get("referenceLink") || "").trim();

    if (!hasFile && !referenceLink) {
      Swal.fire({
        icon: "warning",
        title: "Design missing",
        text: "Upload your design file or paste a Google Drive / image link.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/design-requests", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Request received 🎉",
          text: "We'll review your design and add it as a template under your name.",
        });
        form.reset();
        setFileName("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold text-black mb-2">
        Request a cover page design
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Every department uses a different cover page. Send us the design you
        need — or upload one you made yourself — and we&apos;ll turn it into a
        template on this site, published{" "}
        <span className="font-semibold text-black">under your own name</span>.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-black">
            Your name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="The name that will be credited on the template"
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Student ID + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="studentId"
              className="text-sm font-medium text-black"
            >
              Student ID <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              required
              placeholder="251494038"
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-black">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Department + Template name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="department"
              className="text-sm font-medium text-black"
            >
              Department
            </label>
            <select
              id="department"
              name="department"
              defaultValue=""
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept.replace("Department of ", "")}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="templateName"
              className="text-sm font-medium text-black"
            >
              Template name
            </label>
            <input
              type="text"
              id="templateName"
              name="templateName"
              placeholder="e.g. CSE Lab Report"
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-black">
            What do you need? <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            placeholder="Describe the cover page — which fields it should have, where the logo sits, any colour or border you want."
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Upload */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-black">
            Upload your design
          </label>
          <label
            htmlFor="designFile"
            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-black px-4 py-5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5 shrink-0" />
            <span className="truncate">
              {fileName || "Choose a PNG, JPG, WEBP or PDF file (max 5 MB)"}
            </span>
          </label>
          <input
            type="file"
            id="designFile"
            name="designFile"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Reference link */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="referenceLink"
            className="text-sm font-medium text-black"
          >
            …or paste a link
          </label>
          <input
            type="url"
            id="referenceLink"
            name="referenceLink"
            placeholder="https://drive.google.com/..."
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            File too big? Upload it to Google Drive and share the link instead.
          </p>
        </div>

        {/* Honeypot (hidden field for bots) */}
        <div className="hidden">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-black text-white text-sm font-semibold py-2.5 rounded-lg border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-60 disabled:hover:bg-black disabled:hover:text-white"
        >
          {loading ? "Sending…" : "Send request"}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 mb-2">
          What happens next
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>We review your design and check it prints correctly on A4.</li>
          <li>We build it as a template and add it to the template slider.</li>
          <li>
            Your name goes on the Contributions list, and you get a thank-you
            the next time you make a cover page here. 🤍
          </li>
        </ol>
      </div>
    </div>
  );
};

export default DesignRequestForm;
