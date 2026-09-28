import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitInquiry } from "./actions";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

const mocks = vi.hoisted(() => ({
  prisma: {
    product: { findMany: vi.fn() },
    inquiry: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
  notifySalesOfInquiry: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/email", () => ({
  notifySalesOfInquiry: mocks.notifySalesOfInquiry,
}));

const GENERIC_FAILURE = "Could not send your enquiry. Please try again.";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ana Reyes",
    company: "Reyes Fire Safety",
    email: "ana@reyesfire.test",
    message: "Need 12 extinguishers for a warehouse refit.",
    privacyAccepted: true,
    ...overrides,
  };
}

function catalogRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "CO2 Extingher 5kg",
    sku: "CO2-5",
    availabilityStatus: "IN_STOCK",
    ...overrides,
  };
}

function storedInquiry(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ana Reyes",
    company: "Reyes Fire Safety",
    email: "ana@reyesfire.test",
    message: "Need 12 extinguishers for a warehouse refit.",
    products: [],
    ...overrides,
  };
}

function uniqueViolation() {
  return new Prisma.PrismaClientKnownRequestError("unique", {
    code: "P2002",
    clientVersion: "test",
  });
}

/** Prereqs for a run that gets all the way to a durable row. */
function arrangeDurableInsert(reference = "FLQ-20260928-ABCDEF") {
  mocks.prisma.inquiry.create.mockResolvedValue({ id: "inq1", reference });
  mocks.prisma.inquiry.findUniqueOrThrow.mockResolvedValue(storedInquiry());
  mocks.notifySalesOfInquiry.mockResolvedValue({ status: "sent" });
  mocks.prisma.inquiry.update.mockResolvedValue({});
  return reference;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prisma.product.findMany.mockResolvedValue([]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitInquiry: guards before any write", () => {
  it("returns the validation message and never queries the database", async () => {
    const result = await submitInquiry(validInput({ email: "not-an-email" }));

    expect(result).toEqual({
      status: "error",
      message: "Enter a valid email address",
    });
    expect(mocks.prisma.inquiry.create).not.toHaveBeenCalled();
  });

  it("refuses an enquiry that did not accept the Privacy Policy", async () => {
    const result = await submitInquiry(validInput({ privacyAccepted: false }));

    expect(result).toEqual({
      status: "error",
      message: "Accept the Privacy Policy to continue",
    });
    expect(mocks.prisma.inquiry.create).not.toHaveBeenCalled();
  });

  it("rejects a filled honeypot with the generic message and no database access", async () => {
    const result = await submitInquiry(
      validInput({ website: "http://spam.example" }),
    );

    expect(result).toEqual({ status: "error", message: GENERIC_FAILURE });
    expect(mocks.prisma.inquiry.create).not.toHaveBeenCalled();
    expect(mocks.prisma.product.findMany).not.toHaveBeenCalled();
  });

  it("ignores a whitespace-only honeypot, because bots do not submit whitespace", async () => {
    arrangeDurableInsert();

    const result = await submitInquiry(validInput({ website: "   " }));

    expect(result.status).toBe("success");
  });
});

describe("submitInquiry: catalog is resolved server-side", () => {
  it("stores the catalog's own name and SKU, never anything from the payload", async () => {
    arrangeDurableInsert();
    mocks.prisma.product.findMany.mockResolvedValue([catalogRow()]);

    await submitInquiry(
      validInput({
        // A tampered payload trying to pass off names and stock levels.
        products: [
          { productId: "p1", quantity: 3, name: "Fake", sku: "FAKE-1" },
        ],
      }),
    );

    expect(mocks.prisma.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["p1"] }, active: true },
      select: { id: true, name: true, sku: true, availabilityStatus: true },
    });
    expect(mocks.prisma.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          products: {
            create: [
              {
                productId: "p1",
                quantity: 3,
                productName: "CO2 Extingher 5kg",
                productSku: "CO2-5",
                availabilityStatus: "IN_STOCK",
              },
            ],
          },
        }),
      }),
    );
  });

  it("drops a product archived since selection instead of failing the enquiry", async () => {
    arrangeDurableInsert();
    // `active: true` means an archived product is simply absent from the result.
    mocks.prisma.product.findMany.mockResolvedValue([]);

    const result = await submitInquiry(
      validInput({ products: [{ productId: "p1", quantity: 2 }] }),
    );

    expect(result.status).toBe("success");
    expect(mocks.prisma.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ products: { create: [] } }),
      }),
    );
  });

  it("skips the catalog query entirely when no products were selected", async () => {
    arrangeDurableInsert();

    await submitInquiry(validInput());

    expect(mocks.prisma.product.findMany).not.toHaveBeenCalled();
  });
});

describe("submitInquiry: persistence", () => {
  it("records the privacy policy version and the acceptance instant", async () => {
    arrangeDurableInsert();

    await submitInquiry(validInput());

    const { data } = mocks.prisma.inquiry.create.mock.calls[0][0];
    expect(data.privacyPolicyVersion).toBe(PRIVACY_POLICY_VERSION);
    expect(data.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(data.notificationStatus).toBe("PENDING");
  });

  it("retries once on a unique-reference collision and reports the reference that persisted", async () => {
    mocks.prisma.inquiry.create
      .mockRejectedValueOnce(uniqueViolation())
      .mockResolvedValueOnce({ id: "inq1", reference: "FLQ-20260928-RETRY2" });
    mocks.prisma.inquiry.findUniqueOrThrow.mockResolvedValue(storedInquiry());
    mocks.notifySalesOfInquiry.mockResolvedValue({ status: "sent" });
    mocks.prisma.inquiry.update.mockResolvedValue({});

    const result = await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.create).toHaveBeenCalledTimes(2);
    // The retried insert gets a fresh reference, and that is the one returned.
    const [first, second] = mocks.prisma.inquiry.create.mock.calls;
    expect(first[0].data.reference).not.toBe(second[0].data.reference);
    expect(result).toEqual({
      status: "success",
      reference: "FLQ-20260928-RETRY2",
      message:
        "Thanks - your enquiry is in. Our sales team will reply shortly.",
    });
  });

  it("fails after a second collision rather than looping", async () => {
    mocks.prisma.inquiry.create.mockRejectedValue(uniqueViolation());

    const result = await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.create).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: "error", message: GENERIC_FAILURE });
  });

  it("does not retry a non-unique database error", async () => {
    mocks.prisma.inquiry.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("boom", {
        code: "P1001",
        clientVersion: "test",
      }),
    );

    const result = await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "error", message: GENERIC_FAILURE });
  });
});

describe("submitInquiry: notification is best-effort", () => {
  it("records SENT and drops any stale error", async () => {
    arrangeDurableInsert();

    await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.update).toHaveBeenCalledWith({
      where: { id: "inq1" },
      data: { notificationStatus: "SENT", notificationError: null },
    });
  });

  it("records SKIPPED when no transport is configured, and does not call it an error", async () => {
    arrangeDurableInsert();
    mocks.notifySalesOfInquiry.mockResolvedValue({ status: "skipped" });

    await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.update).toHaveBeenCalledWith({
      where: { id: "inq1" },
      data: { notificationStatus: "SKIPPED", notificationError: null },
    });
  });

  it("records FAILED with the reason, yet still reports success to the visitor", async () => {
    arrangeDurableInsert();
    mocks.notifySalesOfInquiry.mockResolvedValue({
      status: "failed",
      error: "Resend returned 502",
    });

    const result = await submitInquiry(validInput());

    expect(mocks.prisma.inquiry.update).toHaveBeenCalledWith({
      where: { id: "inq1" },
      data: {
        notificationStatus: "FAILED",
        notificationError: "Resend returned 502",
      },
    });
    expect(result.status).toBe("success");
  });

  it("still reports success when the read-back itself fails, so no duplicate is invited", async () => {
    arrangeDurableInsert();
    mocks.prisma.inquiry.findUniqueOrThrow.mockRejectedValue(
      new Error("row vanished"),
    );

    const result = await submitInquiry(validInput());

    expect(result.status).toBe("success");
    expect(mocks.notifySalesOfInquiry).not.toHaveBeenCalled();
  });

  it("still reports success when the transport throws unexpectedly", async () => {
    arrangeDurableInsert();
    mocks.notifySalesOfInquiry.mockRejectedValue(new Error("socket hang up"));

    const result = await submitInquiry(validInput());

    expect(result.status).toBe("success");
    expect(console.error).toHaveBeenCalledWith(
      "[inquiry] notification finalization failed",
      expect.any(Error),
    );
  });
});
