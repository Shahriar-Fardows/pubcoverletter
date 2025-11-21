"use client";

import React, { useState } from "react";
import Swal from "sweetalert2";

type Challenge = {
  a: number;
  b: number;
};

const STATIC_CHALLENGE: Challenge = {
  a: 4,
  b: 7,
};

const FeedbackPage: React.FC = () => {
  // Static challenge – same on server & client, no random, no hydration issue
  const [challenge] = useState<Challenge>(STATIC_CHALLENGE);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const challengeA = Number(formData.get("challenge_a"));
    const challengeB = Number(formData.get("challenge_b"));
    const humanAnswer = Number(formData.get("human_answer"));

    // Client-side verification (first layer)
    if (
      !Number.isFinite(challengeA) ||
      !Number.isFinite(challengeB) ||
      !Number.isFinite(humanAnswer) ||
      challengeA + challengeB !== humanAnswer
    ) {
      Swal.fire({
        icon: "error",
        title: "Verification failed",
        text: "Please solve the human verification correctly.",
      });
      return;
    }

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      humanAnswer: String(humanAnswer),
      challengeA: String(challengeA),
      challengeB: String(challengeB),
      honeypot: String(formData.get("website") || ""),
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Thank you!",
          text: "Your feedback has been submitted successfully.",
        });
        form.reset();
        // Static challenge, tai abar change korar dorkar nai
      } else {
        const data = await res.json().catch(() => ({}));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Network error",
        text: "Please check your connection and try again.",
      });
    }
  };

  return (
    <div className="min-h-[70vh] container mx-auto flex items-center justify-center">
      <div className="w-full max-w-3xl p-8">
        <h1 className="text-2xl font-semibold text-black mb-2">
          Feedback Form
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Tell us what you think. Your feedback helps us improve.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-black">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-black">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label htmlFor="message" className="text-sm font-medium text-black">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm resize-none"
            />
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

          {/* Human verification – nice design */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="w-2/3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  Human verification
                </p>
                <p className="text-xs text-gray-500">
                  Answer the question below to prove you&apos;re not a bot.
                </p>
              </div>
              <div className="w-1/3 flex justify-end">
                <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Anti-spam
              </span>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
              <div className="flex gap-3 sm:flex-row sm:items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white">
                    {challenge.a}
                  </span>
                  <span>+</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white">
                    {challenge.b}
                  </span>
                  <span>=</span>
                </div>

                <div className="flex-1 max-w-[160px]">
                  <input
                    type="number"
                    id="human_answer"
                    name="human_answer"
                    required
                    className="w-full border-2 border-black rounded-lg px-3 py-1.5 text-sm"
                    placeholder="Your answer"
                  />
                </div>
              </div>

              {/* hidden challenge values */}
              <input type="hidden" name="challenge_a" value={challenge.a} />
              <input type="hidden" name="challenge_b" value={challenge.b} />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="mt-2 w-full bg-black text-white text-sm font-semibold py-2.5 rounded-lg border-2 border-black hover:bg-white hover:text-black transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
