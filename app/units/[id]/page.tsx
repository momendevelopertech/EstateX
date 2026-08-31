import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import LeadForm from "@/components/LeadForm";
import InstallmentCalculator from "@/components/InstallmentCalculator";
import { computeInstallments } from "@/lib/installments";
import { formatEGP } from "@/lib/format";

export const dynamic = "force-dynamic";

const WHATSAPP_NUMBER = "201000000000"; // TODO: set the real sales phone

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const units = (await sql`
    SELECT u.*, f.number AS floor_number, f.plan_image_url,
           b.name AS building_name, b.id AS building_id,
           p.id AS project_id, p.slug AS project_slug, p.name AS project_name,
           ut.name AS type_name, ut.bedrooms, ut.bathrooms, ut.base_area
    FROM units u
    JOIN floors f ON f.id = u.floor_id
    JOIN buildings b ON b.id = f.building_id
    JOIN projects p ON p.id = b.project_id
    LEFT JOIN unit_types ut ON ut.id = u.unit_type_id
    WHERE u.id = ${id}
  `) as any[];

  const unit = units[0];
  if (!unit) notFound();

  const plans = (await sql`
    SELECT * FROM payment_plans
    WHERE unit_id = ${unit.id} OR project_id = ${unit.project_id}
    ORDER BY (unit_id IS NOT NULL) DESC, number_of_installments ASC
  `) as any[];

  const priceHistory = (await sql`
    SELECT * FROM price_history WHERE unit_id = ${unit.id} ORDER BY changed_at DESC
  `) as any[];

  const features: { label: string; value: string }[] = [
    { label: "Type", value: unit.type_name ?? "—" },
    { label: "Area", value: `${formatEGP(unit.area)} m²` },
    { label: "Bedrooms", value: String(unit.bedrooms ?? "—") },
    { label: "Bathrooms", value: String(unit.bathrooms ?? "—") },
    { label: "View", value: unit.view ?? "—" },
    { label: "Orientation", value: unit.orientation ?? "—" },
    { label: "Balcony", value: unit.has_balcony ? "Yes" : "No" },
    { label: "Terrace", value: unit.has_terrace ? "Yes" : "No" },
    { label: "Storage", value: unit.has_storage ? "Yes" : "No" },
    { label: "Garden", value: unit.has_garden ? "Yes" : "No" },
    { label: "Parking spots", value: String(unit.parking_spots ?? 0) },
    { label: "Ceiling height", value: unit.ceiling_height ? `${unit.ceiling_height} m` : "—" },
  ];

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello! I'm interested in unit ${unit.unit_number} at ${unit.project_name} (Building ${unit.building_name}, floor ${unit.floor_number}). Is it still available?`,
  )}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-emerald-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${unit.project_slug}`} className="hover:text-emerald-700">{unit.project_name}</Link>
        <span className="mx-2">/</span>
        <Link href={`/buildings/${unit.building_id}`} className="hover:text-emerald-700">Building {unit.building_name}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-900">Unit {unit.unit_number}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Left: gallery + details */}
        <div>
          <div className="overflow-hidden rounded-2xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={unit.image_url || "https://picsum.photos/seed/unitview/1200/700"}
              alt={unit.unit_number}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[unit.image_url, unit.plan_image_url, "https://picsum.photos/seed/unitfloorplan/600/400"].map(
              (src, i) =>
                src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={i === 1 ? "Floor plan" : `Gallery ${i + 1}`}
                    className="aspect-video w-full rounded-xl border border-slate-200 object-cover"
                  />
                ),
            )}
          </div>

          <h2 className="mt-8 text-xl font-bold">Unit details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{f.label}</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{capitalize(f.value)}</dd>
              </div>
            ))}
          </dl>

          {priceHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Price history</h2>
              <ul className="mt-3 space-y-2">
                {priceHistory.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
                    <span className="text-slate-500">{new Date(p.changed_at).toLocaleDateString("en-GB")}</span>
                    <span className="font-semibold">
                      EGP {formatEGP(p.old_price)} → <span className="text-emerald-700">EGP {formatEGP(p.new_price)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: price, status, payment, lead */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{unit.type_name}</p>
                <h1 className="text-3xl font-extrabold tracking-tight">Unit {unit.unit_number}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Building {unit.building_name} · {unit.floor_number === 0 ? "Ground floor" : `Floor ${unit.floor_number}`}
                </p>
              </div>
              <StatusBadge status={unit.status} />
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
              <p className="text-3xl font-extrabold text-emerald-700">EGP {formatEGP(unit.price)}</p>
            </div>

            <div className="mt-5 space-y-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                <WhatsAppIcon /> Ask on WhatsApp
              </a>
            </div>
          </div>

          {/* Payment plan + calculator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Payment plans</h2>
            {plans.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No payment plans available for this unit yet.</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2">
                  {plans.map((p) => {
                    const b = computeInstallments(Number(unit.price), Number(p.down_payment_percent), Number(p.number_of_installments), p.installment_frequency);
                    return (
                      <li key={p.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="mt-1 text-slate-600">
                          {p.down_payment_percent}% down ({formatEGP(b.downPaymentAmount)} EGP) ·{" "}
                          {b.numberOfInstallments} payments · ≈ EGP {formatEGP(b.approximateMonthly)}/month
                        </p>
                        {p.notes && <p className="mt-1 text-xs text-slate-400">{p.notes}</p>}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4">
                  <InstallmentCalculator price={Number(unit.price)} plan={
                    computeInstallments(Number(unit.price), Number(plans[0].down_payment_percent), Number(plans[0].number_of_installments), plans[0].installment_frequency)
                  } />
                </div>
              </>
            )}
          </div>

          {/* Lead capture */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="lead-form">
            <h2 className="mb-4 text-lg font-bold">Request information</h2>
            <LeadForm projectId={unit.project_id} unitId={unit.id} unitNumber={unit.unit_number} />
          </div>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s && s !== "—" ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}