import type {
  CalcResult,
  Favorite,
  Floor,
  ListResponse,
  PaymentPlan,
  Project,
  Unit,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message =
        typeof body?.message === "string"
          ? body.message
          : JSON.stringify(body?.message ?? body ?? "");
    } catch {
      /* keep default message */
    }
    throw new ApiClientError(res.status, message);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function num(n: number | string | null | undefined): number {
  return Number(n ?? 0);
}

function normalizeUnit(u: any): Unit {
  return {
    ...u,
    area: num(u.area),
    price: num(u.price),
    statusVersion: num(u.statusVersion),
  };
}

export const api = {
  listProjects(): Promise<Project[]> {
    return fetcher<Project[] | ListResponse<Project>>("/projects").then((r) =>
      Array.isArray(r) ? r : (r.projects ?? []),
    );
  },

  getProject(key: string): Promise<Project> {
    return fetcher<{ project: Project }>(`/projects/${encodeURIComponent(key)}`).then(
      (r) => r.project,
    );
  },

  listUnits(params?: Record<string, string | number | undefined>): Promise<Unit[]> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
    const q = qs.toString();
    return fetcher<Unit[] | ListResponse<Unit>>(`/units${q ? `?${q}` : ""}`).then((r) =>
      (Array.isArray(r) ? r : (r.units ?? [])).map(normalizeUnit),
    );
  },

  getUnit(id: string): Promise<Unit> {
    return fetcher<{ unit: Unit }>(`/units/${encodeURIComponent(id)}`).then((r) =>
      normalizeUnit(r.unit),
    );
  },

  floorsOf(buildingId: string): Promise<Floor[]> {
    return fetcher<{ floors: Floor[] }>(
      `/buildings/${encodeURIComponent(buildingId)}/floors`,
    ).then((r) => r.floors);
  },

  unitsOnFloor(floorId: string): Promise<Unit[]> {
    return fetcher<{ units: Unit[] }>(`/floors/${encodeURIComponent(floorId)}/units`).then(
      (r) => r.units.map(normalizeUnit),
    );
  },

  unitsForProject(projectId: string): Promise<Unit[]> {
    return fetcher<{ units: Unit[] }>(
      `/projects/${encodeURIComponent(projectId)}/masterplan`,
    ).then((r) => r.units.map(normalizeUnit));
  },

  paymentPlansForUnit(unitId: string): Promise<PaymentPlan[]> {
    return fetcher<{ plans: PaymentPlan[] }>(
      `/units/${encodeURIComponent(unitId)}/payment-plan`,
    ).then((r) => r.plans);
  },

  calculatePlan(planId: string, body: { downPaymentPercent: number; months: number }): Promise<CalcResult> {
    return fetcher<CalcResult>(`/payment-plans/${encodeURIComponent(planId)}/calculate`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  createGuestSession(): Promise<{ id: string }> {
    return fetcher<{ id: string }>("/guest-sessions", {
      method: "POST",
      body: JSON.stringify({ ttlDays: 30 }),
    });
  },

  async listFavorites(guestSessionId?: string): Promise<Favorite[]> {
    const qs = guestSessionId ? `?guestSessionId=${encodeURIComponent(guestSessionId)}` : "";
    return fetcher<{ favorites: Favorite[] }>(`/favorites${qs}`).then(
      (r) => r.favorites ?? [],
    );
  },

  addFavorite(unitId: string, guestSessionId?: string): Promise<{ id: string }> {
    return fetcher<{ id: string }>("/favorites", {
      method: "POST",
      body: JSON.stringify(
        guestSessionId ? { unitId, guestSessionId } : { unitId },
      ),
    });
  },

  removeFavorite(id: string, guestSessionId?: string): Promise<{ ok: boolean }> {
    const qs = guestSessionId ? `?guestSessionId=${encodeURIComponent(guestSessionId)}` : "";
    return fetcher<{ ok: boolean }>(`/favorites/${encodeURIComponent(id)}${qs}`, {
      method: "DELETE",
    });
  },

  submitLead(data: {
    unitId: string;
    name: string;
    phone?: string;
    email?: string;
    message?: string;
  }): Promise<{ ok: boolean; id?: string }> {
    return fetcher<{ ok: boolean; id?: string }>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  createBooking(
    unitId: string,
    scheduledAt: string,
    guestSessionId?: string,
  ): Promise<{ ok: boolean; id?: string }> {
    return fetcher<{ ok: boolean; id?: string }>("/bookings", {
      method: "POST",
      body: JSON.stringify(
        guestSessionId ? { unitId, scheduledAt, guestSessionId } : { unitId, scheduledAt },
      ),
    });
  },

  login(email: string, password: string) {
    return fetcher<{ accessToken: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
};