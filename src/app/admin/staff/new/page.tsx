import type { Metadata } from "next";
import { requireRole } from "@/lib/permissions";
import { StaffCreateForm } from "../staff-form";

export const metadata: Metadata = { title: "Add Sales Staff" };

export default async function NewStaffPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Add Sales Staff
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          The account is created with the Sales Staff role and can sign in
          immediately. Share the temporary password with the new staff member.
        </p>
      </div>
      <StaffCreateForm />
    </div>
  );
}
