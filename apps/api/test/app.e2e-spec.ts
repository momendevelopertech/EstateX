import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * Requirement-backed integration tests.
 *  - FR-42: concurrent PATCH /units/:id/status — exactly one succeeds, loser 409 with current state.
 *  - FR-18 / R4: Favorite/Comparison "nullable pair" (exactly one of userId/guestSessionId) enforced
 *    by the DB CHECK constraints added in migration 20260901120000_nullable_pair_constraints.
 */
describe("EstateX API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let unitId: string;
  let guestId: string;
  let userId: string;
  let cleanup: Array<() => Promise<unknown>> = [];

  jest.setTimeout(60000);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const unit = await prisma.unit.findFirst({ where: { status: "available" } });
    if (!unit) throw new Error("Seed data required: at least one available unit");
    unitId = unit.id;

    const guestSession = await prisma.guestSession.create({
      data: { expiresAt: new Date(Date.now() + 86400000) },
    });
    guestId = guestSession.id;
    cleanup.push(() => prisma.guestSession.delete({ where: { id: guestId } }));

    const adminUser = await prisma.user.findFirst({ where: { email: "admin@estatex.com" } });
    if (!adminUser) throw new Error("Seed data required: admin@estatex.com");
    userId = adminUser.id;

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@estatex.com", password: "Admin@123" })
      .expect(201);
    adminToken = login.body.accessToken;
  });

  afterAll(async () => {
    for (const fn of cleanup) {
      try {
        await fn();
      } catch {
        /* best effort */
      }
    }
    await app.close();
  });

  it("rejects login with bad credentials (401)", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@estatex.com", password: "nope" })
      .expect(401);
  });

  it("exposes public unit listing without hidden units", async () => {
    const res = await request(app.getHttpServer()).get("/api/units?limit=100").expect(200);
    expect(res.body.units.length).toBe(39); // 42 seeded minus 3 hidden
    expect(res.body.units.every((u: any) => u.status !== "hidden")).toBe(true);
  });

  it("FR-42: PATCH /units/:id/status succeeds when statusVersion matches", async () => {
    const before = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });
    const target = before.status === "available" ? "reserved" : "available";
    const res = await request(app.getHttpServer())
      .patch(`/api/units/${unitId}/status`)
      .set("authorization", `Bearer ${adminToken}`)
      .send({ status: target, expectedVersion: before.statusVersion })
      .expect(200);
    expect(res.body.status).toBe(target);
    expect(Number(res.body.statusVersion)).toBe(Number(before.statusVersion) + 1);
    // restore
    await prisma.unit.update({ where: { id: unitId }, data: { status: before.status, statusVersion: before.statusVersion } });
  });

  it("FR-42: PATCH with stale statusVersion -> 409 with current state", async () => {
    const before = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });
    await request(app.getHttpServer())
      .patch(`/api/units/${unitId}/status`)
      .set("authorization", `Bearer ${adminToken}`)
      .send({ status: before.status === "available" ? "reserved" : "available", expectedVersion: before.statusVersion })
      .expect(200);
    const res = await request(app.getHttpServer())
      .patch(`/api/units/${unitId}/status`)
      .set("authorization", `Bearer ${adminToken}`)
      .send({ status: before.status === "available" ? "sold" : "sold", expectedVersion: before.statusVersion })
      .expect(409);
    expect(res.body.error).toBe("UNIT_STATUS_CONFLICT");
    expect(Number(res.body.current.statusVersion)).toBe(Number(before.statusVersion) + 1);
    expect(res.body.current.status).toBeDefined();
  });

  it("FR-42: two concurrent PATCHes -> exactly one 200, one 409", async () => {
    const before = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });
    const target = before.status === "available" ? "reserved" : "available";
    const v = Number(before.statusVersion);
    const [r1, r2] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/units/${unitId}/status`)
        .set("authorization", `Bearer ${adminToken}`)
        .send({ status: target, expectedVersion: v }),
      request(app.getHttpServer())
        .patch(`/api/units/${unitId}/status`)
        .set("authorization", `Bearer ${adminToken}`)
        .send({ status: target, expectedVersion: v }),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    const after = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });
    expect(Number(after.statusVersion)).toBe(v + 1);
  });

  it("R4: Favorite rejects both owner columns set (DB CHECK)", async () => {
    await expect(
      prisma.favorite.create({ data: { unitId, userId, guestSessionId: guestId } }),
    ).rejects.toThrow();
  });

  it("R4: Favorite rejects neither owner column set (DB CHECK)", async () => {
    const unit = await prisma.unit.findFirst();
    await expect(
      prisma.favorite.create({ data: { unitId: unit!.id, userId: null, guestSessionId: null } }),
    ).rejects.toThrow();
  });

  it("R4: Favorite accepts exactly one owner column", async () => {
    const unit = await prisma.unit.findFirst();
    const fav = await prisma.favorite.create({ data: { unitId: unit!.id, guestSessionId: guestId } });
    expect(fav.guestSessionId).toBe(guestId);
    await prisma.favorite.delete({ where: { id: fav.id } });
  });

  it("R4: Comparison rejects both owner columns set (DB CHECK)", async () => {
    await expect(
      prisma.comparison.create({ data: { userId, guestSessionId: guestId, unitIds: [unitId] } }),
    ).rejects.toThrow();
  });

  it("FR-43: POST /units/import preview validates then confirm persists", async () => {
    const floor = await prisma.floor.findFirstOrThrow();
    const unitNumber = `E2EIMP${Date.now() % 100000}`;
    const text = `floorId,unitNumber,area,price,status\n${floor.id},${unitNumber},95,1250000,available\n`;
    const preview = await request(app.getHttpServer())
      .post("/api/units/import")
      .set("authorization", `Bearer ${adminToken}`)
      .send({ text, preview: true })
      .expect(201);
    expect(preview.body.preview).toBe(true);
    expect(preview.body.validCount).toBe(1);
    expect(preview.body.invalidCount).toBe(0);

    const confirm = await request(app.getHttpServer())
      .post("/api/units/import")
      .set("authorization", `Bearer ${adminToken}`)
      .send({ text, preview: false })
      .expect(201);
    expect(confirm.body.ok).toBe(true);
    expect(confirm.body.imported).toBe(1);
    cleanup.push(() =>
      prisma.unit.deleteMany({
        where: {
          unitNumber,
          floorId: floor.id,
          NOT: { unitTypeId: null },
        },
      }),
    );
  });

  it("FR-43: POST /units/import confirm rejects invalid rows (409)", async () => {
    const floor = await prisma.floor.findFirstOrThrow();
    const text = `floorId,unitNumber,area,price,status\n${floor.id},BAD,1,0,available\n`;
    const res = await request(app.getHttpServer())
      .post("/api/units/import")
      .set("authorization", `Bearer ${adminToken}`)
      .send({ text, preview: false })
      .expect(409);
    expect(res.body.error).toBe("IMPORT_VALIDATION_FAILED");
  });

  it("FR-54: POST /payment-plans/:id/calculate returns amortized schedule", async () => {
    const plan = await prisma.paymentPlan.findFirstOrThrow({
      include: { unit: { select: { price: true } }, project: { select: { startingPrice: true } } },
    });
    const res = await request(app.getHttpServer())
      .post(`/api/payment-plans/${plan.id}/calculate`)
      .send({ downPaymentPercent: 20, months: 24 })
      .expect(201);
    const total = plan.unit ? Number(plan.unit.price) : Number(plan.project!.startingPrice);
    expect(res.body.totalPrice).toBe(total);
    expect(res.body.downPayment).toBe(Math.round((total * 20) / 100));
    expect(res.body.schedule.length).toBe(24);
  });

  it("FR-32: POST /guest-sessions/:id/merge copies favorites into the account", async () => {
    const unit = await prisma.unit.findFirstOrThrow();
    await prisma.favorite.create({ data: { unitId: unit.id, guestSessionId: guestId } });
    const res = await request(app.getHttpServer())
      .post(`/api/guest-sessions/${guestId}/merge`)
      .set("authorization", `Bearer ${adminToken}`)
      .send({})
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.mergedFavorites).toBeGreaterThanOrEqual(1);
    const merged = await prisma.guestSession.findUniqueOrThrow({ where: { id: guestId } });
    expect(merged.convertedToUserId).toBe(userId);
  });

  it("FR-21: GET /comparisons/:id/share returns a shareable URL", async () => {
    const cmp = await prisma.comparison.create({ data: { userId, unitIds: [unitId] } });
    try {
      const res = await request(app.getHttpServer()).get(`/api/comparisons/${cmp.id}/share`).expect(200);
      expect(res.body.shareUrl).toBe(`/compare/${cmp.id}`);
      expect(res.body.units.length).toBeGreaterThanOrEqual(1);
      expect(res.body.units[0].id).toBe(unitId);
    } finally {
      await prisma.comparison.delete({ where: { id: cmp.id } });
    }
  });

  it("PATCH /bookings/:id/status transitions pending -> confirmed", async () => {
    const floor = await prisma.floor.findFirstOrThrow({ include: { building: true } });
    const unit = await prisma.unit.findFirstOrThrow({
      where: { status: "available", floor: { building: { projectId: (floor.building as any).projectId } } },
    });
    const lead = await prisma.lead.create({
      data: { unitId: unit.id, projectId: (floor.building as any).projectId, source: "test", status: "new" },
    });
    const booking = await prisma.booking.create({
      data: { leadId: lead.id, unitId: unit.id, scheduledAt: new Date(Date.now() + 86400000), status: "pending" },
    });
    try {
      const res = await request(app.getHttpServer())
        .patch(`/api/bookings/${booking.id}/status`)
        .set("authorization", `Bearer ${adminToken}`)
        .send({ status: "confirmed" })
        .expect(200);
      expect(res.body.booking.status).toBe("confirmed");
    } finally {
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.lead.delete({ where: { id: lead.id } });
    }
  });

  it("POST /auth/refresh re-issues a token for the same principal", async () => {
    const bad = await request(app.getHttpServer()).post("/api/auth/refresh").send({}).expect(401);
    expect(bad.body.statusCode).toBe(401);
    const res = await request(app.getHttpServer())
      .post("/api/auth/refresh")
      .set("authorization", `Bearer ${adminToken}`)
      .send({})
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe("admin@estatex.com");
  });

  it("GET /audit-log lists admin actions (FR-42)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/audit-log")
      .set("authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body.logs.length).toBeGreaterThanOrEqual(1);
  });
});