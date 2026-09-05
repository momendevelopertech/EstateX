"use client";

import { useState } from "react";

type Notice = { id: string; title: string; detail: string; time: string; unread: boolean };

const INITIAL_NOTICES: Notice[] = [
  { id: "availability", title: "Availability updated", detail: "A saved unit is currently available.", time: "Just now", unread: true },
  { id: "viewing", title: "Viewing reminder", detail: "Your site visit is scheduled for tomorrow.", time: "2h ago", unread: true },
];

/** Client-only fallback for public pages; authenticated feeds can replace this source via the API adapter. */
export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const unread = notices.filter((notice) => notice.unread).length;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`Notifications, ${unread} unread`} className="relative rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        {unread > 0 && <span className="absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="font-extrabold text-slate-900">Notifications</p><button type="button" onClick={() => setNotices((items) => items.map((item) => ({ ...item, unread: false })))} className="text-xs font-bold text-emerald-700">Mark all read</button></div>
          <ul className="divide-y divide-slate-100">{notices.map((notice) => <li key={notice.id}><button type="button" onClick={() => setNotices((items) => items.map((item) => item.id === notice.id ? { ...item, unread: false } : item))} className="flex w-full gap-3 px-4 py-3 text-start hover:bg-slate-50"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notice.unread ? "bg-emerald-500" : "bg-transparent"}`} /><span><span className="block text-sm font-bold text-slate-800">{notice.title}</span><span className="mt-0.5 block text-xs text-slate-500">{notice.detail}</span><span className="mt-1 block text-xs text-slate-400">{notice.time}</span></span></button></li>)}</ul>
        </div>
      )}
    </div>
  );
}
