import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login?next=/admin");
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminDashboard email={session.email} />
    </div>
  );
}