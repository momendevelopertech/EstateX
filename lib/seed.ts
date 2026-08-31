import { sql } from "./db.ts";
import { SCHEMA_SQL } from "./schema.ts";
import bcrypt from "bcryptjs";

// Deterministic PRNG so the sample dataset is stable across envs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface UnitSeed {
  floor_id: string;
  unit_number: string;
  area: number;
  price: number;
  status: "available" | "reserved" | "sold" | "hidden";
  view: string;
  orientation: string;
  has_balcony: boolean;
  has_terrace: boolean;
  has_storage: boolean;
  has_garden: boolean;
  parking_spots: number;
  ceiling_height: number;
  image_url: string;
}

export async function seed(): Promise<void> {
  console.log("Seeding EstateX demo data...");

  const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await sql(stmt);
  }
  await sql`TRUNCATE users, leads, payment_plans, units, floors, buildings, unit_types, projects, developers, amenities, location_pois RESTART IDENTITY CASCADE`;

  // 1. Developer + Project
  const [developer] = await sql`
    INSERT INTO developers (name, logo_url)
    VALUES ('EstateX Developments', NULL)
    RETURNING id`;

  const [project] = await sql`
    INSERT INTO projects (developer_id, name, slug, description, location, latitude, longitude, starting_price, status, hero_image_url, launch_date)
    VALUES (
      ${developer.id},
      'Azure Hills',
      'azure-hills',
      'A premium gated compound with lakeside residences, landscaped parks and a 24/7 clubhouse. Masterplan designed for family-first living with dedicated green corridors.',
      'New Cairo, Cairo',
      30.0314, 31.6773,
      3200000,
      'under construction',
      'https://picsum.photos/seed/azurehills/1600/900',
      '2025-09-01'
    ) RETURNING id`;

  // 2. Points of interest + amenities
  const pois = [
    ["New Cairo International Airport", "airport", 18],
    ["American University in Cairo", "university", 12],
    ["Sekem Medical Center", "hospital", 9],
    ["City Center Mall", "mall", 7],
    ["Green Metro Station", "transport", 5],
    ["British International School", "school", 8],
  ];
  for (const [name, type, distance] of pois) {
    await sql`
      INSERT INTO location_pois (project_id, name, type, distance_minutes)
      VALUES (${project.id}, ${name}, ${type}, ${distance})`;
  }

  const amenities = [
    ["Swimming Pools", "pool"],
    ["Fitness Center", "gym"],
    ["Kids Play Areas", "play"],
    ["Landscaped Parks", "park"],
    ["24/7 Security", "shield"],
    ["Clubhouse", "home"],
  ];
  for (const [name, icon] of amenities) {
    await sql`
      INSERT INTO amenities (project_id, name, icon)
      VALUES (${project.id}, ${name}, ${icon})`;
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
    const [row] = await sql`
      INSERT INTO unit_types (name, bedrooms, bathrooms, base_area)
      VALUES (${t.name}, ${t.bedrooms}, ${t.bathrooms}, ${t.baseArea})
      RETURNING id`;
    typeIds.set(t.name, row.id);
  }

  // 4. Payment plans (project-level defaults)
  const [plan1] = await sql`
    INSERT INTO payment_plans (project_id, name, down_payment_percent, number_of_installments, installment_frequency, notes)
    VALUES (${project.id}, '8 Years — 10% Down Payment', 10, 96, 'monthly', 'Equal monthly installments, delivery within 3 years.')
    RETURNING id`;
  const [plan2] = await sql`
    INSERT INTO payment_plans (project_id, name, down_payment_percent, number_of_installments, installment_frequency, notes)
    VALUES (${project.id}, '5 Years — 15% Down Payment', 15, 60, 'monthly', 'Recommended plan for quick occupancy.')
    RETURNING id`;

  // 5. Buildings + floors + units
  const rand = mulberry32(20260831);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
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
  const views = ["garden", "pool", "city", "street"];
  const orientations = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  const buildings: { name: string; floors: number }[] = [
    { name: "A", floors: 4 },
    { name: "B", floors: 4 },
    { name: "C", floors: 5 },
  ];

  let unitSeq = 0;
  const statuses: ("available" | "reserved" | "sold")[] = [
    "available",
    "available",
    "available",
    "available",
    "available",
    "reserved",
    "sold",
  ];

  let priceTotal = 0;
  let availableCount = 0;

  for (const b of buildings) {
    const [building] = await sql`
      INSERT INTO buildings (project_id, name, floors_count)
      VALUES (${project.id}, ${b.name}, ${b.floors}) RETURNING id`;

    for (let floorNum = 0; floorNum <= b.floors; floorNum++) {
      const [floor] = await sql`
        INSERT INTO floors (building_id, number)
        VALUES (${building.id}, ${floorNum}) RETURNING id`;

      const isTop = floorNum === b.floors;
      const types = isTop
        ? ["Penthouse", "3 Bedroom Apartment"]
        : floorNum === 0
          ? ["1 Bedroom Apartment", "2 Bedroom Apartment"]
          : ["1 Bedroom Apartment", "2 Bedroom Apartment", "3 Bedroom Apartment"];

      const unitsPerFloor = types.length;
      for (let i = 0; i < unitsPerFloor; i++) {
        const typeName = types[i];
        const status = isTop && typeName === "Penthouse" ? "reserved" : pick(statuses);
        const area = baseArea[typeName];
        const floorFactor = 1 + floorNum * 0.015; // higher floors cost a little more
        const price = Math.round(basePrice[typeName] * floorFactor / 1000) * 1000;
        const unitNumber = `${b.name}-${String(floorNum).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
        if (status === "available") availableCount++;
        priceTotal += price;
        unitSeq++;

        const seedRow: UnitSeed = {
          floor_id: floor.id,
          unit_number: unitNumber,
          area,
          price,
          status,
          view: pick(views),
          orientation: pick(orientations),
          has_balcony: rand() > 0.3,
          has_terrace: typeName === "Penthouse" || rand() > 0.85,
          has_storage: rand() > 0.5,
          has_garden: floorNum === 0 && rand() > 0.4,
          parking_spots: typeName === "Penthouse" ? 2 : 1,
          ceiling_height: 3,
          image_url: `https://picsum.photos/seed/u${unitSeq}/800/600`,
        };
        await sql`
          INSERT INTO units (floor_id, unit_type_id, unit_number, area, price, status, status_version,
            view, orientation, has_balcony, has_terrace, has_storage, has_garden, parking_spots, ceiling_height, image_url)
          VALUES (${seedRow.floor_id}, ${typeIds.get(typeName)}, ${seedRow.unit_number}, ${seedRow.area},
            ${seedRow.price}, ${seedRow.status}, 0, ${seedRow.view}, ${seedRow.orientation},
            ${seedRow.has_balcony}, ${seedRow.has_terrace}, ${seedRow.has_storage}, ${seedRow.has_garden},
            ${seedRow.parking_spots}, ${seedRow.ceiling_height}, ${seedRow.image_url})`;
      }
    }
  }

  // 6. Penthouses referenced by a unit-level payment plan override
  const [penthouseFloor] = await sql`
    SELECT f.id FROM floors f
    JOIN buildings b ON b.id = f.building_id
    JOIN projects p ON p.id = b.project_id AND p.slug = 'azure-hills'
    WHERE b.name = 'C' AND f.number = 5
    LIMIT 1`;
  const [penthouseType] = await sql`SELECT id FROM unit_types WHERE name = 'Penthouse' LIMIT 1`;
  const [penthouseUnit] = await sql`
    SELECT id FROM units WHERE floor_id = ${penthouseFloor.id} AND unit_type_id = ${penthouseType.id} LIMIT 1`;

  await sql`
    INSERT INTO payment_plans (unit_id, name, down_payment_percent, number_of_installments, installment_frequency, notes)
    VALUES (${penthouseUnit.id}, 'Flexible — 20% Down, 4 Years', 20, 48, 'monthly', 'Special penthouse offer with optional summer vacation ownership weeks.') RETURNING id`;

  // 7. Demo admin user
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES ('admin@estatex.com', ${passwordHash}, 'Demo Admin', 'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`;

  console.log(`Seeded: 1 project, ${buildings.length} buildings, ${unitSeq} units (${availableCount} available).`);
}

let seeding: Promise<void> | null = null;

// Lazy auto-seed used by serverless routes — keeps a freshly deployed, empty DB usable.
export async function ensureSeeded(): Promise<void> {
  if (seeding) return seeding;
  seeding = (async () => {
    const rows = (await sql`SELECT count(*)::int AS c FROM projects`) as { c: number }[];
    if (rows[0].c === 0) {
      await seed();
    }
  })().catch((err) => {
    seeding = null;
    throw err;
  });
  return seeding;
}