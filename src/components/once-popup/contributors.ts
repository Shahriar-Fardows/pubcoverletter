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

/**
 * Local development e "ekbar dekhabe" niyom ta off.
 * Tai testing er somoy same student ID diye joto bar generate korba,
 * toto bar e popup ta ashbe. Production e agher motoi sudhu ekbar.
 */
const isDev = process.env.NODE_ENV === "development";

/** Ei student ke thanks janano hobe kina — ekbar dekhale ar dekhabe na */
export function getContributorToThank(
  studentId: string,
): Contributor | null {
  const id = studentId.trim();
  const contributor = CONTRIBUTORS[id];

  if (!contributor) return null;
  if (typeof window === "undefined") return null;

  // Dev e localStorage check skip — protibar dekhabe
  if (isDev) return contributor;

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

  // Dev e kichu save korbo na, na hole notun tab e ar dekhto na
  if (isDev) return;

  try {
    localStorage.setItem(storageKey(studentId), "true");
  } catch {
    // localStorage na thakle chup chap skip
  }
}
