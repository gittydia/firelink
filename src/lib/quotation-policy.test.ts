import { describe, expect, it } from "vitest";
import {
  evaluateQuotationReadiness,
  quotationPolicy,
  quotationPolicySchema,
} from "./quotation-policy";

// Test-only choices, not approved business policy.
const completePolicy = {
  pricingModel: "UNIT_PRICE_SNAPSHOT",
  outputFormat: "PDF_ONLY",
  approvalMode: "STAFF_REVIEW",
  retentionPolicy: {
    quotationRecords: { mode: "INDEFINITE" },
    issuedDocuments: { mode: "INDEFINITE" },
    sendRecords: { mode: "INDEFINITE" },
    expiredQuotations: { mode: "INDEFINITE" },
    voidedQuotations: { mode: "INDEFINITE" },
  },
  decisionReference: "test-fixture-only",
} as const;

describe("quotation policy readiness", () => {
  it("blocks issuance and reports every unresolved production policy", () => {
    // Given / When
    const result = evaluateQuotationReadiness(quotationPolicy);
    // Then
    expect(result).toMatchObject({
      issuanceEnabled: false,
      policiesComplete: false,
      reason: "POLICY_UNRESOLVED",
      unresolvedPolicies: [
        "pricingModel",
        "outputFormat",
        "approvalMode",
        "retentionPolicy",
      ],
    });
    expect(
      Object.values(quotationPolicy).every((value) => value === null),
    ).toBe(true);
    expect(Object.isFrozen(quotationPolicy)).toBe(true);
  });

  it.each(["pricingModel", "outputFormat", "approvalMode", "retentionPolicy"])(
    "blocks issuance when only %s is unresolved",
    (key) => {
      // Given
      const input = { ...completePolicy, [key]: null };
      // When
      const result = evaluateQuotationReadiness(input);
      // Then
      expect(result.issuanceEnabled).toBe(false);
      expect(result.unresolvedPolicies).toEqual([key]);
    },
  );

  it.each([
    "quotationRecords",
    "issuedDocuments",
    "sendRecords",
    "expiredQuotations",
    "voidedQuotations",
  ])("requires an explicit retention decision for %s", (key) => {
    // Given
    const input = {
      ...completePolicy,
      retentionPolicy: { ...completePolicy.retentionPolicy, [key]: null },
    };
    // When
    const result = evaluateQuotationReadiness(input);
    // Then
    expect(result.policiesComplete).toBe(false);
    expect(result.unresolvedPolicies).toEqual(["retentionPolicy"]);
  });

  it.each([undefined, {}, { ...completePolicy, approvalMode: "AUTO" }])(
    "fails closed without exposing validation details for malformed configuration",
    (input) => {
      // Given / When
      const result = evaluateQuotationReadiness(input);
      // Then
      expect(result).toEqual({
        issuanceEnabled: false,
        policiesComplete: false,
        reason: "INVALID_POLICY",
        unresolvedPolicies: [],
        message: "Quotation issuance is not yet configured.",
      });
    },
  );

  it("requires a governance decision reference, not just selected options", () => {
    // Given
    const input = { ...completePolicy, decisionReference: null };
    // When
    const result = evaluateQuotationReadiness(input);
    // Then
    expect(result.reason).toBe("DECISION_RECORD_REQUIRED");
    expect(result.issuanceEnabled).toBe(false);
  });

  it.each(["UNIT_PRICE_SNAPSHOT", "FULL_PRICE_CONDITION_SNAPSHOT"])(
    "keeps issuance locked even when %s and all other policies are configured",
    (pricingModel) => {
      // Given
      const input = { ...completePolicy, pricingModel };
      // When
      const result = evaluateQuotationReadiness(input);
      // Then
      expect(result).toMatchObject({
        issuanceEnabled: false,
        policiesComplete: true,
        reason: "IMPLEMENTATION_PENDING",
        unresolvedPolicies: [],
      });
    },
  );

  it("rejects an enable flag rather than accepting a configuration bypass", () => {
    // Given
    const input = { ...completePolicy, issuanceEnabled: true };
    // When
    const result = evaluateQuotationReadiness(input);
    // Then
    expect(result.reason).toBe("INVALID_POLICY");
    expect(result.issuanceEnabled).toBe(false);
  });

  it.each([
    { mode: "PERIOD", duration: 0, unit: "DAYS", startsAt: "ISSUED_AT" },
    { mode: "PERIOD", duration: 1.5, unit: "DAYS", startsAt: "ISSUED_AT" },
    { mode: "PERIOD", duration: 2, unit: "DAYS" },
    { mode: "PERIOD", duration: 2, unit: "UNKNOWN", startsAt: "ISSUED_AT" },
  ])("rejects invalid or incomplete retention rules", (rule) => {
    // Given
    const input = {
      ...completePolicy,
      retentionPolicy: { ...completePolicy.retentionPolicy, sendRecords: rule },
    };
    // When
    const result = quotationPolicySchema.safeParse(input);
    // Then
    expect(result.success).toBe(false);
  });

  it("represents an explicit retention duration without scheduling disposition", () => {
    // Given: a test-only duration, unrelated to commercial validity.
    const input = {
      ...completePolicy,
      retentionPolicy: {
        ...completePolicy.retentionPolicy,
        sendRecords: {
          mode: "PERIOD",
          duration: 17,
          unit: "MONTHS",
          startsAt: "SENT_AT",
        },
      },
    };
    // When
    const result = evaluateQuotationReadiness(input);
    // Then
    expect(result.policiesComplete).toBe(true);
    expect(result.issuanceEnabled).toBe(false);
  });
});
