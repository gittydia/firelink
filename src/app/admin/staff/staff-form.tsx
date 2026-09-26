"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonLinkClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import {
  staffCreateSchema,
  staffUpdateSchema,
  type StaffCreateInput,
  type StaffUpdateInput,
} from "@/lib/validation";
import { createSalesStaff, updateSalesStaff } from "./actions";

type Feedback = { status: "success" | "error"; message: string } | null;

function SuccessNotice({ message }: { message: string }) {
  return (
    <Notice tone="success">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {message}
        <Link href="/admin/staff" className="font-medium underline">
          Back to all staff
        </Link>
      </span>
    </Notice>
  );
}

export function StaffCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: StaffCreateInput) {
    setFeedback(null);
    startTransition(async () => {
      const result = await createSalesStaff(values);
      setFeedback({ status: result.status, message: result.message });
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Card className="space-y-4 p-5">
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Temporary password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </Card>

      {feedback ? (
        feedback.status === "success" ? (
          <SuccessNotice message={feedback.message} />
        ) : (
          <Notice>{feedback.message}</Notice>
        )
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create account"}
        </Button>
        <Link
          href="/admin/staff"
          className={buttonLinkClass("text-neutral-600 hover:bg-neutral-100")}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function StaffEditForm({
  staffId,
  initial,
}: {
  staffId: string;
  initial: StaffUpdateInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffUpdateInput>({
    resolver: zodResolver(staffUpdateSchema),
    defaultValues: initial,
  });

  function onSubmit(values: StaffUpdateInput) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateSalesStaff(staffId, values);
      setFeedback({ status: result.status, message: result.message });
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Card className="space-y-4 p-5">
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />
        <p className="text-sm text-neutral-500">
          Role and account status are managed separately from these details.
        </p>
      </Card>

      {feedback ? (
        feedback.status === "success" ? (
          <SuccessNotice message={feedback.message} />
        ) : (
          <Notice>{feedback.message}</Notice>
        )
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save changes"}
        </Button>
        <Link
          href="/admin/staff"
          className={buttonLinkClass("text-neutral-600 hover:bg-neutral-100")}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
