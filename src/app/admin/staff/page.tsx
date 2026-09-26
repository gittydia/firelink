import type { Metadata } from "next";
import Link from "next/link";
import { AccountStatusBadge } from "@/components/ui/badge";
import { buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { staffListWhere } from "@/lib/staff";
import { StaffRowActions } from "./staff-row-actions";

export const metadata: Metadata = { title: "Sales Staff" };

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
});

export default async function AdminStaffPage() {
  await requireRole(["ADMIN"]);

  const staff = await prisma.user.findMany({
    where: staffListWhere(),
    // Explicit field list so passwordHash can never reach the client.
    select: { id: true, name: true, email: true, active: true, createdAt: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const activeCount = staff.filter((member) => member.active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Sales Staff</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {activeCount} active of {staff.length} total. Deactivated accounts keep their history
            and can be reactivated.
          </p>
        </div>
        <Link
          href="/admin/staff/new"
          className={buttonLinkClass("bg-fire text-white hover:bg-fire-dark")}
        >
          Add staff
        </Link>
      </div>

      <Card>
        {staff.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-600">
            No Sales Staff accounts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={
                  "border-b border-neutral-200 bg-neutral-50 text-xs " +
                  "uppercase tracking-wide text-neutral-500"
                }
              >
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Created</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staff.map((member) => (
                  <tr key={member.id} className={member.active ? undefined : "bg-neutral-50/60"}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{member.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{member.email}</td>
                    <td className="px-4 py-3">
                      <AccountStatusBadge active={member.active} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {dateFormatter.format(member.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StaffRowActions
                        id={member.id}
                        name={member.name}
                        active={member.active}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
