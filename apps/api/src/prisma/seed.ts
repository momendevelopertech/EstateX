import { PrismaClient, UnitStatus, ProjectStatus, InstallmentFrequency } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic PRNG so the sample dataset is stable across environments.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seed(): Promise<void> {
  console.log("Seeding EstateX demo data...");

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.analyticsEvent.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.priceHistory.deleteMany(),
    prisma.paymentPlan.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.media.deleteMany(),
    prisma.hotspot.deleteMany(),
    prisma.virtualTourScene.deleteMany(),
    prisma.virtualTour.deleteMany(),
    prisma.comparison.deleteMany(),
    prisma.guestSession.deleteMany(),
    prisma.agent.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.unitType.deleteMany(),
    prisma.floor.deleteMany(),
    prisma.building.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.amenity.deleteMany(),
    prisma.locationPOI.deleteMany(),
    prisma.project.deleteMany(),
    prisma.developer.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);

  // 1. Developer + Project
  const developer = await prisma.developer.create({
    data: {
      name: "EstateX Developments",
      branding: { primary: "#10b981", neutral: "#0f172a" },
    },
  });

  const project = await prisma.project.create({
    data: {
      developerId: developer.id,
      name: "Azure Hills",
      slug: "azure-hills",
      description:
        "A premium gated compound with lakeside residences, landscaped parks and a 24/7 clubhouse. Masterplan designed for family-first living with dedicated green corridors.",
      latitude: 30.0314,
      longitude: 31.6773,
      status: ProjectStatus.under_construction,
      startingPrice: 3200000,
      baseCurrency: "EGP",
      launchDate: new Date("2025-09-01"),
    },
  });

  // 2. POIs + amenities
  const pois = [
    ["New Cairo International Airport", "airport", 18],
    ["American University in Cairo", "university", 12],
    ["Sekem Medical Center", "hospital", 9],
    ["City Center Mall", "mall", 7],
    ["Green Metro Station", "transport", 5],
    ["British International School", "school", 8],
  ] as const;
  for (const [name, type, distanceMinutes] of pois) {
    await prisma.locationPOI.create({
      data: { projectId: project.id, name, type, distanceMinutes },
    });
  }

  const amenities = [
    ["Swimming Pools", "pool"],
    ["Fitness Center", "gym"],
    ["Kids Play Areas", "play"],
    ["Landscaped Parks", "park"],
    ["24/7 Security", "shield"],
    ["Clubhouse", "home"],
  ] as const;
  for (const [name, icon] of amenities) {
    await prisma.amenity.create({
      data: { projectId: project.id, name, icon },
    });
  }

  // 3. Unit types
  const unitTypes = [
    { name: "1 Bedroom Apartment", bedrooms: 1, bathrooms: 1, baseArea: 78 },
    { name: "2 Bedroom Apartment", bedrooms: 2, bathrooms: 2, baseArea: 118 },
    { name: "3 Bedroom Apartment", bedrooms: 3, bathrooms: 2, baseArea: 165 },
    { name: "Penthouse", bedrooms: 4, bathrooms: 3, baseArea: 240 },
  ];
  const typeIds = new Map<string, string>();
  for (const t of unitTypes) {
    const created = await prisma.unitType.create({
      data: { ...t, baseArea: t.baseArea },
    });
    typeIds.set(t.name, created.id);
  }

  // 4. Payment plans (project-level defaults) + roles
  await prisma.paymentPlan.createMany({
    data: [
      {
        projectId: project.id,
        name: "8 Years — 10% Down Payment",
        downPaymentPercent: 10,
        numberOfInstallments: 96,
        installmentFrequency: InstallmentFrequency.monthly,
        notes: "Equal monthly installments, delivery within 3 years.",
      },
      {
        projectId: project.id,
        name: "5 Years — 15% Down Payment",
        downPaymentPercent: 15,
        numberOfInstallments: 60,
        installmentFrequency: InstallmentFrequency.monthly,
        notes: "Recommended plan for quick occupancy.",
      },
    ],
  });

  await prisma.role.createMany({
    data: [
      { name: "Super Admin", permissions: ["*"] },
      {
        name: "Admin",
        permissions: ["project:manage", "unit:manage", "media:manage", "payment-plan:manage"],
      },
      { name: "Sales Manager", permissions: ["lead:manage", "inventory:read", "analytics:read"] },
      { name: "Sales Agent", permissions: ["lead:read", "lead:update", "inventory:read"] },
      { name: "Content Manager", permissions: ["media:manage"] },
    ],
    skipDuplicates: true,
  });

  // 5. Buildings + floors + units across all 4 statuses
  const rand = mulberry32(20260831);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const basePrice: Record<string, number> = {
    "1 Bedroom Apartment": 3200000,
    "2 Bedroom Apartment": 4500000,
    "3 Bedroom Apartment": 6200000,
    Penthouse: 11500000,
  };
  const baseArea: Record<string, number> = {
    "1 Bedroom Apartment": 78,
    "2 Bedroom Apartment": 118,
    "3 Bedroom Apartment": 165,
    Penthouse: 240,
  };
  const views = ["garden", "pool", "city", "street"] as const;
  const orientations = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  const statuses: UnitStatus[] = [
    UnitStatus.available,
    UnitStatus.available,
    UnitStatus.available,
    UnitStatus.available,
    UnitStatus.available,
    UnitStatus.reserved,
    UnitStatus.sold,
  ];

  const buildings: { name: string; floors: number }[] = [
    { name: "A", floors: 4 },
    { name: "B", floors: 4 },
    { name: "C", floors: 5 },
  ];

  let unitSeq = 0;
  const statusCounts: Record<UnitStatus, number> = {
    available: 0,
    reserved: 0,
    sold: 0,
    hidden: 0,
  };

  for (const b of buildings) {
    const building = await prisma.building.create({
      data: { projectId: project.id, name: b.name, floorsCount: b.floors },
    });

    for (let floorNum = 0; floorNum <= b.floors; floorNum++) {
      const floor = await prisma.floor.create({
        data: { buildingId: building.id, number: floorNum },
      });

      const isTop = floorNum === b.floors;
      const types = isTop
        ? ["Penthouse", "3 Bedroom Apartment"]
        : floorNum === 0
          ? ["1 Bedroom Apartment", "2 Bedroom Apartment"]
          : ["1 Bedroom Apartment", "2 Bedroom Apartment", "3 Bedroom Apartment"];

      for (let i = 0; i < types.length; i++) {
        const typeName = types[i];
        // Force a hidden unit into the dataset (status #4), and a reserved penthouse.
        const status: UnitStatus =
          i === 0 && floorNum === b.floors
            ? UnitStatus.hidden
            : isTop && typeName === "Penthouse"
              ? UnitStatus.reserved
              : pick(statuses);
        const area = baseArea[typeName];
        const floorFactor = 1 + floorNum * 0.015;
        const price = Math.round((basePrice[typeName] * floorFactor) / 1000) * 1000;
        const unitNumber = `${b.name}-${String(floorNum).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
        unitSeq++;
        statusCounts[status]++;

        await prisma.unit.create({
          data: {
            floorId: floor.id,
            unitTypeId: typeIds.get(typeName),
            unitNumber,
            area,
            price,
            status,
            statusVersion: 0,
            view: pick(views),
            orientation: pick(orientations),
            hasBalcony: rand() > 0.3,
            hasTerrace: typeName === "Penthouse" || rand() > 0.85,
            hasStorage: rand() > 0.5,
            hasGarden: floorNum === 0 && rand() > 0.4,
            parkingSpots: typeName === "Penthouse" ? 2 : 1,
            ceilingHeight: 3,
          },
        });
      }
    }
  }

  // 6. Unit-level payment-plan override on a penthouse (C building, top floor)
  const penthouseUnit = await prisma.unit.findFirst({
    where: { unitNumber: { startsWith: "C-" }, unitTypeId: typeIds.get("Penthouse") },
    orderBy: { unitNumber: "asc" },
  });
  if (penthouseUnit) {
    await prisma.paymentPlan.create({
      data: {
        unitId: penthouseUnit.id,
        name: "Flexible — 20% Down, 4 Years",
        downPaymentPercent: 20,
        numberOfInstallments: 48,
        installmentFrequency: InstallmentFrequency.monthly,
        notes: "Special penthouse offer with optional summer vacation ownership weeks.",
      },
    });
  }

  // 7. Demo users + admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  const salesRole = await prisma.role.findUnique({ where: { name: "Sales Agent" } });
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@estatex.com" },
    create: {
      email: "admin@estatex.com",
      passwordHash,
      name: "Demo Admin",
      roleId: adminRole?.id,
    },
    update: { passwordHash },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: "agent@estatex.com" },
    create: {
      email: "agent@estatex.com",
      passwordHash: await bcrypt.hash("Agent@123", 10),
      name: "Sara Agent",
      roleId: salesRole?.id,
    },
    update: {},
  });

  await prisma.agent.upsert({
    where: { id: `agent-${agentUser.id}` },
    create: { id: `agent-${agentUser.id}`, userId: agentUser.id, developerId: developer.id },
    update: {},
  });

  console.log(
    `Seeded: 1 developer, 1 project, ${buildings.length} buildings, ${unitSeq} units ` +
      `(${statusCounts.available} available, ${statusCounts.reserved} reserved, ${statusCounts.sold} sold, ${statusCounts.hidden} hidden). ` +
      `Admin: admin@estatex.com. Roles: ${adminRole?.name}.`,
  );
}

// Invoked directly from CLI
if (require.main === module) {
  seed()
    .then(() => {
      console.log("Seed complete.");
      return prisma.$disconnect();
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      return prisma.$disconnect().finally(() => process.exit(1));
    });
}
