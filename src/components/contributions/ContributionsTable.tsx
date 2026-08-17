import type React from "react";
import Link from "next/link";

type Contribution = {
  name: string;
  suggestion: string;
  status: "Fixed" | "In progress" | "Planned";
};

const CONTRIBUTIONS: Contribution[] = [
  {
    name: "Piter Kubi",
    suggestion:
      "Reported that the submission date printed as YYYY/MM/DD, while most faculties expect the DD/MM/YYYY format.",
    status: "Fixed",
  },
];

const STATUS_STYLES: Record<Contribution["status"], string> = {
  Fixed: "bg-emerald-50 text-emerald-700 border-emerald-300",
  "In progress": "bg-amber-50 text-amber-700 border-amber-300",
  Planned: "bg-gray-100 text-gray-700 border-gray-300",
};

const ContributionsTable: React.FC = () => {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Contributions
        </h1>
        <p className="text-base text-gray-600">
          Thanks to everyone who reported an issue or suggested an improvement.
          Your feedback shaped this page.
        </p>
      </div>

      {/* Full-width Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full min-w-full text-left text-base">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-600 w-16 text-center">
                #
              </th>
              <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-600 whitespace-nowrap w-56">
                Name
              </th>
              <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-600">
                Suggested fix
              </th>
              <th className="px-6 py-4 font-semibold text-sm uppercase tracking-wider text-gray-600 w-44 text-center">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {CONTRIBUTIONS.map((item, index) => (
              <tr
                key={`${item.name}-${index}`}
                className="hover:bg-gray-50/70 transition-colors"
              >
                <td className="px-6 py-5 text-sm font-semibold text-gray-400 text-center">
                  {index + 1}
                </td>
                <td className="px-6 py-5 font-semibold text-gray-900 whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-6 py-5 text-gray-700 leading-relaxed text-[15px]">
                  {item.suggestion}
                </td>
                <td className="px-6 py-5 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-wide ${
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

      {/* Footer Link */}
      <p className="text-base text-gray-600">
        Want your own design on this list?{" "}
        <Link
          href="/design-request"
          className="font-semibold text-[#9e1d21] underline underline-offset-4 hover:no-underline"
        >
          Request a cover page template
        </Link>{" "}
        — we&apos;ll publish it under your name.
      </p>
    </div>
  );
};

export default ContributionsTable;
