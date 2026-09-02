"use client";

import type { AuthUser } from "./types";

const KEY = "estatex_admin";

export interface AdminSession {
  token: string;
  user: AuthUser;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  window.localStorage.removeItem(KEY);
}