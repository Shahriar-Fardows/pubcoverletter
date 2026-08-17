import type { Metadata } from "next";
import ContributionsTable from "@/components/contributions/ContributionsTable";

export const metadata: Metadata = {
  title: "Contributors | Presidency University Cover Page Generator",
  description:
    "The students whose feedback and designs made this cover page generator better.",
};

export default function ContributorsPage() {
  return (
    <main className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 w-full">
      <ContributionsTable />
    </main>
  );
}
