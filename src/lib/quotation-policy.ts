import { z } from "zod";

const retentionRuleSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("INDEFINITE") }).strict(),
  z
    .object({
      mode: z.literal("PERIOD"),
      duration: z.number().int().positive().safe(),
      unit: z.enum(["DAYS", "MONTHS", "YEARS"]),
      startsAt: z.enum([
        "ISSUED_AT",
        "SENT_AT",
        "EXPIRED_AT",
        "VOIDED_AT",
        "ARCHIVED_AT",
      ]),
    })
    .strict(),
]);

export const quotationPolicySchema = z
  .object({
    pricingModel: z
      .enum(["UNIT_PRICE_SNAPSHOT", "FULL_PRICE_CONDITION_SNAPSHOT"])
      .nullable(),
    outputFormat: z.enum(["PDF_ONLY", "HTML_WITH_OPTIONAL_PDF"]).nullable(),
    approvalMode: z
      .enum(["AUTOMATIC", "STAFF_REVIEW", "ROLE_BASED_APPROVAL"])
      .nullable(),
    retentionPolicy: z
      .object({
        quotationRecords: retentionRuleSchema.nullable(),
        issuedDocuments: retentionRuleSchema.nullable(),
        sendRecords: retentionRuleSchema.nullable(),
        expiredQuotations: retentionRuleSchema.nullable(),
        voidedQuotations: retentionRuleSchema.nullable(),
      })
      .strict()
      .nullable(),
    decisionReference: z.string().trim().min(1).nullable(),
  })
  .strict();

export type QuotationPolicy = Readonly<z.infer<typeof quotationPolicySchema>>;

// Code-owned governance configuration. Null means undecided, never a default.
export const quotationPolicy = Object.freeze({
  pricingModel: null,
  outputFormat: null,
  approvalMode: null,
  retentionPolicy: null,
  decisionReference: null,
} satisfies QuotationPolicy);

const policyKeys = [
  "pricingModel",
  "outputFormat",
  "approvalMode",
  "retentionPolicy",
] as const;

export type QuotationReadiness = {
  readonly issuanceEnabled: false;
  readonly policiesComplete: boolean;
  readonly reason:
    | "INVALID_POLICY"
    | "POLICY_UNRESOLVED"
    | "DECISION_RECORD_REQUIRED"
    | "IMPLEMENTATION_PENDING";
  readonly unresolvedPolicies: readonly (typeof policyKeys)[number][];
  readonly message: string;
};

export function evaluateQuotationReadiness(input: unknown): QuotationReadiness {
  const parsed = quotationPolicySchema.safeParse(input);
  if (!parsed.success) {
    return {
      issuanceEnabled: false,
      policiesComplete: false,
      reason: "INVALID_POLICY",
      unresolvedPolicies: [],
      message: "Quotation issuance is not yet configured.",
    };
  }

  const policy = parsed.data;
  const unresolvedPolicies = policyKeys.filter(
    (key) =>
      policy[key] === null ||
      (key === "retentionPolicy" &&
        policy.retentionPolicy !== null &&
        Object.values(policy.retentionPolicy).some((rule) => rule === null)),
  );
  if (unresolvedPolicies.length > 0) {
    return {
      issuanceEnabled: false,
      policiesComplete: false,
      reason: "POLICY_UNRESOLVED",
      unresolvedPolicies,
      message:
        "Quotation issuance is not yet configured. The pricing, document, approval, and retention policies must be finalized before quotations can be issued.",
    };
  }

  if (policy.decisionReference === null) {
    return {
      issuanceEnabled: false,
      policiesComplete: false,
      reason: "DECISION_RECORD_REQUIRED",
      unresolvedPolicies,
      message: "Quotation issuance requires a recorded governance decision.",
    };
  }

  // Policy choices alone must never activate unimplemented commercial behavior.
  return {
    issuanceEnabled: false,
    policiesComplete: true,
    reason: "IMPLEMENTATION_PENDING",
    unresolvedPolicies,
    message:
      "Quotation issuance is disabled pending implementation of the approved policies.",
  };
}
