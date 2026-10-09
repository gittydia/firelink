export interface InquiryNotificationLine {
  name: string;
  sku: string;
  quantity: number;
  availability: string;
}

export interface InquiryNotification {
  reference: string;
  name: string;
  company: string;
  email: string;
  message: string;
  products: InquiryNotificationLine[];
}

export type NotificationResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTextBody(inquiry: InquiryNotification): string {
  const lines = inquiry.products.map(
    (product) =>
      `- ${product.name} (${product.sku}) x${product.quantity} [${product.availability}]`,
  );
  const selection =
    lines.length > 0
      ? lines.join("\n")
      : "No products selected (general enquiry)";

  return [
    `Reference: ${inquiry.reference}`,
    `Name: ${inquiry.name}`,
    `Company: ${inquiry.company}`,
    `Email: ${inquiry.email}`,
    "",
    "Products:",
    selection,
    "",
    "Message:",
    inquiry.message,
  ].join("\n");
}

function buildHtmlBody(inquiry: InquiryNotification): string {
  const rows = inquiry.products
    .map(
      (product) =>
        `<tr><td>${escapeHtml(product.name)}<br /><small>${escapeHtml(product.sku)}</small></td>` +
        `<td>${product.quantity}</td><td>${escapeHtml(product.availability)}</td></tr>`,
    )
    .join("");

  const selection =
    inquiry.products.length > 0
      ? `<table cellpadding="6" cellspacing="0" border="0">` +
        `<tr><th align="left">Product</th><th align="left">Qty</th><th align="left">Availability</th></tr>` +
        `${rows}</table>`
      : "<p><em>No products selected (general enquiry)</em></p>";

  return [
    "<p><strong>New Fire Guard Solutions enquiry</strong></p>",
    `<p>Reference: <strong>${escapeHtml(inquiry.reference)}</strong></p>`,
    `<p>Name: ${escapeHtml(inquiry.name)}<br />Company: ${escapeHtml(inquiry.company)}` +
      `<br />Email: ${escapeHtml(inquiry.email)}</p>`,
    "<p><strong>Products</strong></p>",
    selection,
    "<p><strong>Message</strong></p>",
    `<p>${escapeHtml(inquiry.message).replace(/\n/g, "<br />")}</p>`,
  ].join("");
}

export async function notifySalesOfInquiry(
  inquiry: InquiryNotification,
): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  // Defaults to the recipient so a single verified address is enough to test.
  const from = process.env.INQUIRY_FROM_EMAIL ?? to;

  if (!apiKey || !to || !from) {
    return { status: "skipped", reason: "Email delivery is not configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: inquiry.email,
        subject: `Fire Guard Solutions enquiry ${inquiry.reference} - ${inquiry.company}`,
        html: buildHtmlBody(inquiry),
        text: buildTextBody(inquiry),
      }),
    });

    if (!response.ok) {
      return { status: "failed", error: `Resend responded ${response.status}` };
    }
    return { status: "sent" };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}
