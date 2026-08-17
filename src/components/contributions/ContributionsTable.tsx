import type React from "react";
import Link from "next/link";

type Contribution = {
  name: string;
  suggestion: string;
  status: "Fixed" | "In progress" | "Planned";
};

// Feedback page theke asha suggestion gulo — jara help korse tader credit
const CONTRIBUTIONS: Contribution[] = [
  {
    name: "Piter Kubi",
    suggestion:
      "Cover page er date year/month/date format e chilo — most faculties date/month/year (DD/MM/YYYY) chay.",
    status: "Fixed",
  },
];

const STATUS_STYLES: Record<Contribution["status"], string> = {
  Fixed: "bg-green-100 text-green-800 border-green-300",
  "In progress": "bg-amber-100 text-amber-800 border-amber-300",
  Planned: "bg-gray-100 text-gray-700 border-gray-300",
};

const ContributionsTable: React.FC = () => {
  return (
    <div className="w-full max-w-3xl p-8 pt-0">
      <h2 className="text-2xl font-semibold text-black mb-2">Contributions</h2>
      <p className="text-sm text-gray-600 mb-6">
        Thanks to everyone who reported an issue or suggested an improvement.
        Your feedback shaped this page.
      </p>

      <div className="overflow-x-auto rounded-lg border-2 border-black">
        <table className="w-full text-left text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-4 py-3 font-semibold w-12">#</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Suggested fix</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {CONTRIBUTIONS.map((item, index) => (
              <tr
                key={`${item.name}-${index}`}
                className="border-t border-gray-200 align-top"
              >
                <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-black whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-gray-700">{item.suggestion}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Want your own design on this list?{" "}
        <Link
          href="/design-request"
          className="font-semibold text-black underline underline-offset-2 hover:no-underline"
        >
          Request a cover page template
        </Link>{" "}
        — we&apos;ll publish it under your name.
      </p>
    </div>
  );
};

export default ContributionsTable;
