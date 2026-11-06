export type VideoVisibility = "private" | "public";

export type VideoDraft = { visibility: VideoVisibility; coverIndex: number; caption: string };

const STORAGE_KEY = "thu365:video-draft:v1";
const DEFAULT_DRAFT: VideoDraft = { visibility: "private", coverIndex: 0, caption: "một chút dịu dàng" };

/** Temporary same-session prototype state only. No backend or media is stored. */
export function readVideoDraft(): VideoDraft {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const value = JSON.parse(raw) as Partial<VideoDraft>;
    return {
      visibility: value.visibility === "public" ? "public" : "private",
      coverIndex: Number.isInteger(value.coverIndex) && value.coverIndex! >= 0 && value.coverIndex! <= 2 ? value.coverIndex! : 0,
      caption: typeof value.caption === "string" ? value.caption.slice(0, 120) : DEFAULT_DRAFT.caption,
    };
  } catch { return DEFAULT_DRAFT; }
}

export function saveVideoDraft(patch: Partial<VideoDraft>): VideoDraft {
  const next = { ...readVideoDraft(), ...patch };
  if (typeof window !== "undefined") {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep prototype usable if storage is unavailable. */ }
  }
  return next;
}