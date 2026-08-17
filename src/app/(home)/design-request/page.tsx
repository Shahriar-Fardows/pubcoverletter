import type { Metadata } from "next";
import DesignRequestForm from "@/components/design-request/DesignRequestForm";

export const metadata: Metadata = {
  title: "Request a Cover Page Design | Presidency University",
  description:
    "Request a new cover page template or upload your own design — we'll add it to the site under your name.",
};

export default function DesignRequestPage() {
  return (
    <div className="min-h-[70vh] container mx-auto flex items-center justify-center">
      <DesignRequestForm />
    </div>
  );
}
