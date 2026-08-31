import { neon } from "@neondatabase/serverless";

function cleanDbUrl(url: string): string {
  const u = new URL(url, "postgresql://"); // base avoids parsing errors for odd user parts
  u.searchParams.forEach((_v, k) => {
    if (["channel_binding", "sslmode", "sslcert", "sslrootcert"].includes(k)) {
      u.searchParams.delete(k);
    }
  });
  u.searchParams.set("sslmode", "require");
  return u.toString();
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
}

export const sql = neon(cleanDbUrl(databaseUrl));