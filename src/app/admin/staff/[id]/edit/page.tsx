import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountStatusBadge } from "@/components/ui/badge";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLE } from "@/lib/staff";
import { StaffEditForm } from "../../staff-form";

export const metadata: Metadata = { title: "Edit Sales Staff" };

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);
  const { id } = await params;

  const staff = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  // ADMIN accounts are not editable here, so they must not resolve to a form.
  if (!staff || staff.role !== STAFF_ROLE) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Edit Sales Staff
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-sm text-neutral-600">
            Status: <AccountStatusBadge active={staff.active} />
          </span>
        </div>
      </div>
      <StaffEditForm
        staffId={staff.id}
        initial={{ name: staff.name, email: staff.email }}
      />
    </div>
  );
}
