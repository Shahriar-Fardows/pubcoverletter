export type Contributor = {
  /** Optional — jana thakle popup e naam dhore thanks bolbo */
  name?: string;
  /** Ei student ta ki contribute korse — "... er jonno tomake dhonnobad" hoye bosbe */
  contribution: string;
  /** Optional — tar suggestion e ki kaj hoyese, popup er highlight box e dekhabe */
  result?: string;
};

/**
 * Jara design request / suggestion diye site ta improve korse.
 * Key = student ID. Notun keu contribute korle sudhu ekta entry add korlei
 * cover page banate ashle tar jonno ekbar thank-you popup dekhabe.
 */
export const CONTRIBUTORS: Record<string, Contributor> = {
  "251494038": {
    contribution: "ডেট ফরম্যাটের সমস্যাটা ধরিয়ে দেওয়ার জন্য",
    result: "ডেট এখন DD/MM/YYYY ফরম্যাটে দেখাচ্ছে ✅",
  },
};

const storageKey = (studentId: string) =>
  `pubcoverletter_thanks_${studentId.trim()}`;

/** Ei student ke thanks janano hobe kina — ekbar dekhale ar dekhabe na */
export function getContributorToThank(
  studentId: string,
): Contributor | null {
  const id = studentId.trim();
  const contributor = CONTRIBUTORS[id];

  if (!contributor) return null;
  if (typeof window === "undefined") return null;

  try {
    if (localStorage.getItem(storageKey(id))) return null;
  } catch {
    // private mode e localStorage block thakle popup dekhate somossa nai
  }

  return contributor;
}

/** Popup dekhano hoye gese — ei browser e ar kokhono dekhabe na */
export function markContributorThanked(studentId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey(studentId), "true");
  } catch {
    // localStorage na thakle chup chap skip
  }
}
