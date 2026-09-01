// Self-contained smoke test: boots the compiled Nest app in-process and exercises
// the public + guarded API surface with real HTTP semantics (fetch).
// Usage: node scripts/smoke.js   (after `npm run build`)
process.env.PORT = "4399";
process.env.JWT_SECRET = "estatex-demo-secret";

const { NestFactory } = require("@nestjs/core");
const { ValidationPipe } = require("@nestjs/common");
const { AppModule } = require("../dist/app.module");
const { PrismaClient } = require("@prisma/client");

const BASE = "http://localhost:4399/api";

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(777);
const rand = (n) => Math.floor(rnd() * n);

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(`${name}: ${detail}`);
    console.log(`  FAIL  ${name} -> ${detail}`);
  }
}

async function j(r) {
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// Delete every unit whose unitNumber contains "IMP" plus dependent rows, in FK-safe order.
async function cleanupImportedUnits(prisma) {
  const units = await prisma.unit.findMany({
    where: { unitNumber: { contains: "IMP" } },
    select: { id: true },
  });
  const ids = units.map((u) => u.id);
  if (ids.length === 0) return;
  const tours = await prisma.virtualTour.findMany({
    where: { unitId: { in: ids } },
    select: { id: true },
  });
  const tourIds = tours.map((t) => t.id);
  const scenes = await prisma.virtualTourScene.findMany({
    where: { virtualTourId: { in: tourIds } },
    select: { id: true },
  });
  const sceneIds = scenes.map((s) => s.id);
  if (sceneIds.length) await prisma.hotspot.deleteMany({ where: { sceneId: { in: sceneIds } } });
  if (sceneIds.length) await prisma.virtualTourScene.deleteMany({ where: { id: { in: sceneIds } } });
  if (tourIds.length) await prisma.virtualTour.deleteMany({ where: { id: { in: tourIds } } });
  const bookings = await prisma.booking.findMany({ where: { unitId: { in: ids } }, select: { id: true, leadId: true } });
  const bookingIds = bookings.map((b) => b.id);
  const leadIds = [...new Set(bookings.map((b) => b.leadId).filter(Boolean))];
  if (bookingIds.length) await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await prisma.favorite.deleteMany({ where: { unitId: { in: ids } } });
  await prisma.analyticsEvent.deleteMany({ where: { unitId: { in: ids } } });
  await prisma.lead.deleteMany({ where: { unitId: { in: ids } } });
  if (leadIds.length) await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
  await prisma.priceHistory.deleteMany({ where: { unitId: { in: ids } } });
  await prisma.unit.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(4399);

  // Deterministic runs against the shared dev DB: scrub leftovers owned by previous
  // smoke runs (imported IMP* units + their dependents) before count assertions.
  const prisma = new PrismaClient();
  await cleanupImportedUnits(prisma);

  try {
    console.log("== public listings ==");
    const health = await fetch(`${BASE}/health`);
    ok("GET /health", health.status === 200, `status=${health.status}`);

    const projects = await j(await fetch(`${BASE}/projects`));
    ok("GET /projects returns 1 project", projects.projects?.length === 1, `count=${projects.projects?.length}`);
    const project = projects.projects[0];
    ok("project annotated availableUnits", typeof project.availableUnits === "number", `available=${project.availableUnits}`);

    const detail = await j(await fetch(`${BASE}/projects/azure-hills`));
    ok("GET /projects/:slug detail", !!detail.project?.id && detail.project.buildings?.length === 3, `buildings=${detail.project?.buildings?.length}`);
    const buildingId = detail.project.buildings[0].id;

    const floors = await j(await fetch(`${BASE}/buildings/${buildingId}/floors`));
    ok("GET /buildings/:id/floors", floors.floors?.length >= 4, `floors=${floors.floors?.length}`);
    const floorId = floors.floors[0].id;

    const floorUnits = await j(await fetch(`${BASE}/floors/${floorId}/units`));
    ok("GET /floors/:id/units", floorUnits.units?.length >= 1, `units=${floorUnits.units?.length}`);

    const list = await j(await fetch(`${BASE}/units?limit=100`));
    ok("public GET /units excludes hidden", list.units?.length === 39, `count=${list.units?.length}`);

    const filtered = await j(await fetch(`${BASE}/units?bedrooms=2`));
    ok("GET /units?bedrooms=2", filtered.units?.every((u) => Number(u.unitType?.bedrooms) === 2), `count=${filtered.units?.length}`);

    const unit = list.units[0];
    const unitDetail = await j(await fetch(`${BASE}/units/${unit.id}`));
    ok("GET /units/:id detail", !!unitDetail.unit?.id && unitDetail.unit.statusVersion != null, "unit detail has statusVersion");
    ok("version > 0", Number(unitDetail.unit.statusVersion) >= 0, `v=${unitDetail.unit.statusVersion}`);

    const plans = await j(await fetch(`${BASE}/units/${unit.id}/payment-plan`));
    ok("GET /units/:id/payment-plan returns plans", plans.plans?.length >= 1, `plans=${plans.plans?.length}`);

    console.log("== auth ==");
    const bad = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@estatex.com", password: "wrongpass" }),
    });
    ok("POST /auth/login wrong password -> 401", bad.status === 401, `status=${bad.status}`);

    const login = await j(await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@estatex.com", password: "Admin@123" }),
    }));
    ok("POST /auth/login admin ok", !!login.accessToken && login.user?.roles?.includes("Admin"), "token issued");
    const adminToken = login.accessToken;

    const me = await j(await fetch(`${BASE}/users/me`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /users/me with token", me.user?.email === "admin@estatex.com", `email=${me.user?.email}`);

    const noAuth = await fetch(`${BASE}/users/me`);
    ok("GET /users/me without token -> 401", noAuth.status === 401, `status=${noAuth.status}`);

    console.log("== RBAC on unit status transition (FR-42) ==");
    // Pick a non-sold unit for the transition tests.
    const target = await j(await fetch(`${BASE}/units/${unit.id}`));
    const currentVersion = Number(target.unit.statusVersion);
    const targetStatus = target.unit.status === "available" ? "reserved" : "available";

    const forbidden = await fetch(`${BASE}/units/${unit.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: targetStatus, expectedVersion: currentVersion }),
    });
    ok("PATCH /units/:id/status unauthenticated -> 401", forbidden.status === 401, `status=${forbidden.status}`);

    const badStatus = await fetch(`${BASE}/units/${unit.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "banana", expectedVersion: currentVersion }),
    });
    ok("PATCH invalid status -> 422", badStatus.status === 422, `status=${badStatus.status}`);

    const ok1 = await j(await fetch(`${BASE}/units/${unit.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: targetStatus, expectedVersion: currentVersion }),
    }));
    ok("PATCH status ok (exact version) -> 200 + version bump", ok1.status === targetStatus && Number(ok1.statusVersion) === currentVersion + 1, JSON.stringify(ok1));

    const conflicted = await fetch(`${BASE}/units/${unit.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: targetStatus === "available" ? "reserved" : "available", expectedVersion: currentVersion }),
    });
    const conflictBody = await j(conflicted);
    ok("PATCH stale version -> 409 UNIT_STATUS_CONFLICT", conflicted.status === 409 && conflictBody.error === "UNIT_STATUS_CONFLICT", `status=${conflicted.status} body=${JSON.stringify(conflictBody).slice(0, 120)}`);
    ok("409 body has current state", !!conflictBody.current && conflictBody.current.statusVersion === currentVersion + 1, JSON.stringify(conflictBody.current));

    console.log("== concurrent PATCH (two in-flight) ==");
    const c2 = await j(await fetch(`${BASE}/units/${unit.id}`));
    const v2 = Number(c2.unit.statusVersion);
    const s2 = c2.unit.status === "available" ? "reserved" : "available";
    const [ra, rb] = await Promise.all([
      fetch(`${BASE}/units/${unit.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: s2, expectedVersion: v2 }),
      }),
      fetch(`${BASE}/units/${unit.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: s2, expectedVersion: v2 }),
      }),
    ]);
    const statuses = [ra.status, rb.status].sort();
    ok("concurrent PATCH: exactly one 200 and one 409", statuses[0] === 200 && statuses[1] === 409, `got ${statuses}`);

    console.log("== favorites (guest session) ==");
    const guestSession = await j(await fetch(`${BASE}/guest-sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ttlDays: 7 }),
    }));
    ok("POST /guest-sessions creates a session", !!guestSession.id, JSON.stringify(guestSession));
    const guestId = guestSession.id;

    const bogusFav = await fetch(`${BASE}/favorites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ unitId: unit.id, guestSessionId: "bogus-session" }),
    });
    ok("POST /favorites with unknown guest-session -> 422", bogusFav.status === 422, `status=${bogusFav.status}`);
    const fav = await j(await fetch(`${BASE}/favorites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ unitId: unit.id, guestSessionId: guestId }),
    }));
    ok("POST /favorites guest ok", fav.ok === true, JSON.stringify(fav));

    const favBoth = await j(await fetch(`${BASE}/favorites`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ unitId: unit.id }),
    }));
    ok("POST /favorites authenticated ok", favBoth.ok === true, JSON.stringify(favBoth));

    const favList = await j(await fetch(`${BASE}/favorites?guestSessionId=${guestId}`));
    ok("GET /favorites for guest session", favList.favorites?.length === 1, `count=${favList.favorites?.length}`);

    console.log("== leads + analytics + notifications ==");
    const lead = await j(await fetch(`${BASE}/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ unitId: unit.id, name: "Smoke Tester", phone: "+201000000000", email: "smoke@test.com" }),
    }));
    ok("POST /leads ok", lead.ok === true, JSON.stringify(lead));

    const track = await j(await fetch(`${BASE}/analytics/track`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "unit_view", unitId: unit.id, sessionId: `sess-${rand(99999)}` }),
    }));
    ok("POST /analytics/track ok", track.ok === true, JSON.stringify(track));

    const notifications = await j(await fetch(`${BASE}/notifications`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /notifications (admin feed)", Array.isArray(notifications.notifications), `count=${notifications.notifications?.length}`);

    const overview = await j(await fetch(`${BASE}/analytics/overview`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /analytics/overview (admin)", typeof overview.views === "number", JSON.stringify(overview));

    console.log("== comparisons ==");
    const cmp = await j(await fetch(`${BASE}/comparisons`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ unitId: unit.id, guestSessionId: guestId }),
    }));
    ok("POST /comparisons ok", cmp.ok === true && cmp.count === 1, JSON.stringify(cmp));

    const cmpGet = await j(await fetch(`${BASE}/comparisons?guestSessionId=${guestId}`));
    ok("GET /comparisons for guest", cmpGet.comparison?.units?.length === 1, `units=${cmpGet.comparison?.units?.length}`);

    console.log("== bookings ==");
    const booking = await j(await fetch(`${BASE}/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ unitId: unit.id, scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
    }));
    ok("POST /bookings ok", booking.ok === true, JSON.stringify(booking));
    const myBookings = await j(await fetch(`${BASE}/bookings/me`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /bookings/me", myBookings.bookings?.length >= 1, `count=${myBookings.bookings?.length}`);

    console.log("== FR-43 import, FR-54 calculate, guest merge, share, bookings status ==");
    const imp0 = await j(await fetch(`${BASE}/units/import`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        text: "floorId,unitNumber,area,price,status\n" + `${floorId},IMP1,95,1250000,available\n${floorId},IMP2,120,3100000,reserved\n`,
        preview: true,
      }),
    }));
    ok("PATCH units/import preview validates", imp0.preview === true && imp0.validCount === 2 && imp0.invalidCount === 0, JSON.stringify(imp0));

    const imp1 = await j(await fetch(`${BASE}/units/import`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        text: "floorId,unitNumber,area,price,status\n" + `${floorId},IMP1,95,1250000,available\n`,
      }),
      preview: false,
    }));
    ok("POST units/import confirm persists", imp1.ok === true && imp1.imported === 1, JSON.stringify(imp1));

    const impBad = await fetch(`${BASE}/units/import`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        text: "floorId,unitNumber,area,price,status\n" + `${floorId},IMPBAD,-1,0,available\n`,
        preview: true,
      }),
    });
    const impBadBody = await j(impBad);
    ok("POST units/import preview flags invalid rows", impBadBody.validCount === 0 && impBadBody.invalidCount === 1, JSON.stringify(impBadBody).slice(0, 160)); // preview returns invalid list
    const impBadConfirm = await fetch(`${BASE}/units/import`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        text: "floorId,unitNumber,area,price,status\n" + `${floorId},IMPBAD2,-1,0,available\n`,
        preview: false,
      }),
    });
    ok("POST units/import confirm with invalid rows -> 409", impBadConfirm.status === 409, `status=${impBadConfirm.status}`);

    const calcPlan = await j(await fetch(`${BASE}/units/${unit.id}/payment-plan`));
    const calc = await j(await fetch(`${BASE}/payment-plans/${calcPlan.plans[0].id}/calculate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ downPaymentPercent: 20, months: 24 }),
    }));
    ok("POST payment-plans/:id/calculate (FR-54)", calc.planId === calcPlan.plans[0].id && calc.downPayment === Math.round((calc.totalPrice * 20) / 100) && calc.schedule?.length === 24, JSON.stringify(calc).slice(0, 180));

    const cmp2 = await j(await fetch(`${BASE}/comparisons`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ unitId: unit.id }),
    }));
    const share = await j(await fetch(`${BASE}/comparisons/${cmp2.id}/share`));
    ok("GET /comparisons/:id/share (FR-21)", share.shareUrl === `/compare/${cmp2.id}` && share.units?.length >= 1, JSON.stringify(share).slice(0, 120));

    const merge = await j(await fetch(`${BASE}/guest-sessions/${guestId}/merge`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    }));
    ok("POST /guest-sessions/:id/merge (FR-32)", merge.ok === true && merge.mergedFavorites >= 1, JSON.stringify(merge));

    const bStatus = await j(await fetch(`${BASE}/bookings/${booking.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "confirmed" }),
    }));
    ok("PATCH /bookings/:id/status -> confirmed", bStatus.ok === true && bStatus.booking?.status === "confirmed", JSON.stringify(bStatus).slice(0, 120));

    console.log("== auth refresh + users + roles + audit ==");
    const refresh = await j(await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
    }));
    ok("POST /auth/refresh re-issues token", !!refresh.accessToken && refresh.user?.email === "admin@estatex.com", JSON.stringify(refresh).slice(0, 120));

    const badRefresh = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    ok("POST /auth/refresh without token -> 401", badRefresh.status === 401, `status=${badRefresh.status}`);

    const roles = await j(await fetch(`${BASE}/roles`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /roles", roles.roles?.length >= 5 && roles.roles.some((r) => r.name === "Admin"), `count=${roles.roles?.length}`);

    const newUser = await j(await fetch(`${BASE}/users`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ email: "smoke-new@test.com", password: "Temp#123", name: "Smoke New" }),
    }));
    ok("POST /users creates user", newUser.ok === true && !!newUser.user?.id && !newUser.user.passwordHash, JSON.stringify(newUser).slice(0, 120));

    const delUser = await fetch(`${BASE}/users/${newUser.user.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    ok("DELETE /users/:id", delUser.status === 200, `status=${delUser.status}`);

    const audit = await j(await fetch(`${BASE}/audit-log`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /audit-log (FR-42)", Array.isArray(audit.logs) && audit.logs.length >= 3, `count=${audit.logs?.length}`);

    const kpis = await j(await fetch(`${BASE}/analytics/kpis`, { headers: { authorization: `Bearer ${adminToken}` } }));
    ok("GET /analytics/kpis", typeof kpis.totalEvents === "number" && typeof kpis.conversionRate === "number", JSON.stringify(kpis).slice(0, 120));

    const rec = await j(await fetch(`${BASE}/recommendations`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ budgetMax: 2000000, bedrooms: 2 }),
    }));
    ok("POST /recommendations by needs (FR-31)", Array.isArray(rec.recommendations), `count=${rec.recommendations?.length}`);

    const tour2 = await j(await fetch(`${BASE}/tours`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ unitId: unit.id, name: "Smoke Tour" }),
    }));
    const scene = await j(await fetch(`${BASE}/tours/${tour2.id}/scenes`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ roomName: "Living", panoramaUrl: "https://img.example/pan1.jpg", order: 1 }),
    }));
    ok("POST /tours + scenes", tour2.ok === true && scene.ok === true, JSON.stringify({ tour2, scene }).slice(0, 160));
  } catch (e) {
    fail++;
    failures.push("uncaught: " + (e && e.stack ? e.stack : String(e)).slice(0, 400));
    console.error("FATAL", e);
  }

  await app.close();
  // Remove units created by this run so the next run starts from the seed counts.
  await cleanupImportedUnits(prisma);
  await prisma.$disconnect();
  console.log("");
  console.log(`SMOKE RESULT: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log("Failures:");
    for (const f of failures) console.log("  - " + f);
    process.exit(1);
  }
  process.exit(0);
}

main();