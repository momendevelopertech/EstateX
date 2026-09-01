"use client";

import { api } from "./api";

const KEY = "estatex-guest-session";

export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Returns a saved guest session id or creates + stores one (used for guest favorites). */
export async function ensureGuestSessionId(): Promise<string> {
  const existing = getGuestSessionId();
  if (existing) return existing;
  const session = await api.createGuestSession();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, session.id);
    } catch {
      /* ignore */
    }
  }
  return session.id;
}