"use server";

import { requireRole } from "@/lib/permissions";
import {
  evaluateQuotationReadiness,
  quotationPolicy,
  type QuotationReadiness,
} from "@/lib/quotation-policy";

export async function getQuotationReadiness(): Promise<QuotationReadiness> {
  await requireRole(["ADMIN", "SALES"]);
  return evaluateQuotationReadiness(quotationPolicy);
}
