import ContributionsTable from "@/components/contributions/ContributionsTable";
import FeedbackForm from "@/components/feedback-form/FeedbackForm";

type Challenge = {
  a: number;
  b: number;
};

function generateChallenge(): Challenge {
  const a = Math.floor(Math.random() * 9) + 1; // 1–9
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b };
}

export default function FeedbackPage() {
  const initialChallenge = generateChallenge(); // 🔹 server side-e generate

  return (
    <div className="min-h-[70vh] container mx-auto flex flex-col items-center justify-center">
      <FeedbackForm initialChallenge={initialChallenge} />
      <ContributionsTable />
    </div>
  );
}
