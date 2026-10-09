# Quotation & RFQ Document Generation — Proposed Design and Implementation Gap

**Status:** Proposal. Nothing described under "Proposed design" is implemented in the codebase today.
**Scope:** Non-transactional lead handling only. No cart, checkout, payment, or order capture.

This note has two jobs, deliberately kept separate:

1. Describe a **proposed** quotation/RFQ document-generation capability, grounded in external literature and standards.
2. Record the **gap** between that proposal, the capstone paper's claims, and what Fire Guard Solutions actually implements.

These are different things. Mixing them is how a prototype becomes misread as a product. Sections 1–4 are the proposal. Section 5 is the gap. Section 6 documents defects found in the paper's own reference list.

---

## 1. What the capstone paper claims

Quotation handling is described as an implemented system capability, not a future intention. The exact wording:

| Line | Claim |
|---|---|
| `PPG X MOJO Capstone.md:193` | the system "facilitates the generation of quotations" |
| `PPG X MOJO Capstone.md:195` | it handles "automating the quotation process" |
| `PPG X MOJO Capstone.md:211`, `:217` | a "quote generator" sends inquiries and generates quotes "directly through Gmail" |

Two constraints on how this should be read:

- **Transport is not the design.** "Through Gmail" describes the delivery channel used at the time, not a required architecture. Section 4 shows the current codebase already uses a transactional email API, which is a strictly better fit and does not contradict the paper's user-visible outcome.
- **Out of scope does not mean absent.** `PPG X MOJO Capstone.md:219` excludes online ordering and payment. That exclusion does not reach quotation generation; a quotation is pre-transactional. The two capabilities are independent.

---

## 2. Proposed process design

The proposal follows the standard request-for-quotation → quotation exchange rather than inventing one. Elgh (2012) divides the quotation process into RFQ, quotation preparation, and quotation evaluation, and reports a validated information model for generating quotations for product variants; this design adopts that structure at prototype depth.

1. **Customer assembles a request.** Items, quantities, and delivery constraints, captured against the catalog rather than retyped.
2. **System issues a durable reference.** `FLQ-YYYYMMDD-XXXXXX`, following the existing enquiry-reference convention.
3. **Catalog is the single source of truth for line items.** Name, description, unit of measure, and price are read from the product record at render time. The customer never supplies commercial data; the customer supplies intent. Baron et al. (2000) found that catalog-based ordering in B2B procurement improves accuracy over manual specification entry, which is the property being relied on here.
4. **A quotation document is rendered** as an immutable artifact.
5. **It is delivered by email** and remains retrievable from the admin side.

Two properties are load-bearing:

- **Reproducibility.** A quotation must render identically from the stored reference. If line-item text and pricing are read live from the catalog, a later price edit silently changes an already-issued quotation. Either snapshot commercial values onto the document at issue time, or accept that quotations are advisory and always re-confirm pricing. Kelkar et al. (2002) argue that product pricing in an electronic catalog is properly modelled as a set of *price conditions* — validity period, quantity break, customer class — rather than a single static unit price. That finding is directly relevant: if pricing is condition-based rather than fixed, "snapshot the price" is not a well-defined operation and the price conditions must themselves be snapshotted. This is a genuine design decision, not an implementation detail, and it should be settled deliberately.
- **Auditability.** Every issued quotation needs an immutable identifier and issue timestamp, so a customer dispute can be traced to the exact document that was sent.
- **Standardized output.** The document is a stable structured artifact rather than free text, so it can later be read by staff, an ERP, or a CRM without re-keying. Andersen et al. (2025) argue that standardized offer templates are what makes a product offer reusable beyond the moment it was produced. Alor-Hernández et al. (2014) demonstrate the same property in cross-organizational e-procurement, where semantic, machine-readable documents let a brokerage service process buyer and supplier data without re-keying.
- **Human review before issue.** Automated generation should not be the last step. Flechsig et al. (2022) identify human-review and governance gaps as a characteristic failure mode when document generation is automated in a purchasing context. Whether review is mandatory or optional is open decision 3 below.

### Standards basis

UBL 2.3 defines both document types this proposal needs:

- `RequestForQuotation` — namespace `urn:oasis:names:specification:ubl:schema:xsd:RequestForQuotation-2`
- `Quotation` — namespace `urn:oasis:names:specification:ubl:schema:xsd:Quotation-2`

UBL 2.3 is an OASIS Standard released on 15 June 2021 (OASIS, 2021), edited by G. Ken Holman, implemented as an extension of the UN/CEFACT CCTS 2.01 model. The distinction that matters for scoping: `RequestForQuotation` is the customer's outbound request; `Quotation` is the supplier's priced response. Fire Guard Solutions' flow maps onto the latter.

Adopting UBL is **not** a prototype requirement. It is cited here to establish that the proposed data shape is a well-specified, industry-standard one, so a future phase can emit interoperable XML rather than a bespoke format.

---

## 3. Document rendering options

Quotation PDFs can be generated server-side without a headless browser. This matters because Fire Guard Solutions runs Next.js on the Node.js runtime, so no browser engine needs to be added to the deployment.

| Approach | Browser required | Fit for Fire Guard Solutions |
|---|---|---|
| `@react-pdf/renderer` | No | Recommended. Declarative layout in React; fits the existing component model and Tailwind-adjacent conventions. |
| `pdf-lib` | No | Reasonable. Lower-level; no layout engine, so you hand-build positioning. |
| Playwright / Puppeteer | **Yes** | Disproportionate. Pulls a browser engine and its memory cost into a server that has no other need for one. |

Recommended: `@react-pdf/renderer`, rendering in a Server Action or Route Handler.

### Accessibility

**Two different standards apply, and conflating them is a common planning error.** WCAG 2.2 is a World Wide Web Consortium (W3C, 2024) Recommendation, dated 12 December 2024, whose scope is *web content*; it does not by itself govern a PDF file. A PDF is assessed against **PDF/UA**, the ISO 14289 series (International Organization for Standardization [ISO], 2014, 2024). The current published edition is **ISO 14289-2:2024 (PDF/UA-2)**, based on PDF 2.0; ISO 14289-1:2014 (PDF/UA-1), based on PDF 1.7, remains the applicable part if the renderer emits PDF 1.7. So the accessibility target differs depending on which output is chosen in open decision 2:

| Output | Governing standard | Route to conformance |
|---|---|---|
| PDF only | PDF/UA — ISO 14289-2 (PDF 2.0) or ISO 14289-1 (PDF 1.7), matching the emitted PDF version | Tagged PDF structure; `@react-pdf/renderer` support must be verified, not assumed |
| HTML view | WCAG 2.2 | Directly testable success criteria |
| Both | Both, independently | The HTML view is the one that can be objectively audited |

ISO 14289-2 states the accessibility requirements directly, so the PDF-side list is not invention: accessible files depend on machine-readable text in a declared language, appropriate semantic structures for paragraphs, lists, tables and headings, those structures organized in logical reading order, and descriptive metadata such as alternate descriptions for images.

Requirements for the proposed output:

- Tagged content and a logical reading order, not a purely visual layout. This is the structural core of PDF/UA, and in HTML it maps to WCAG 2.2 SC 1.3.1 *Info and Relationships* (Level A) plus SC 1.3.2 *Meaningful Sequence* (Level A), which is the criterion that actually addresses reading order rather than structure alone.
- Document language and a title set — SC 3.1.1 *Language of Page* and SC 2.4.2 *Page Titled* (both Level A) in the HTML view; declared language is an explicit ISO 14289-2 requirement on the PDF side.
- Text as real text, not rasterized images — SC 1.1.1 *Non-text Content* (Level A) governs the text alternative where non-text content is unavoidable; a fully rasterized page fails regardless of alt text.
- Sufficient contrast — SC 1.4.3 *Contrast (Minimum)* (Level AA) requires 4.5:1, relaxed to 3:1 for large-scale text.

One caveat on standards vintage: WCAG 2.3 remains a working draft and should not be treated as current, and WCAG 2.2 itself carries published errata that should be read alongside the recommendation.

The practical asymmetry: accessibility of an emailed PDF is a materially weaker and harder-to-verify guarantee than accessibility of an HTML page, because PDF conformance is assessed structurally and rarely re-checked after generation. If the quotation must meet a hard accessibility bar, an HTML view should accompany the PDF — and open decision 2 stops being a formatting preference and becomes the accessibility decision.

One caveat to carry into implementation: tagged-PDF output support differs across the candidate libraries, and this should be verified during implementation rather than assumed. A renderer that produces untagged PDFs will not satisfy the PDF/UA column above at all.

---

## 4. Delivery

Fire Guard Solutions already sends transactional email through Resend. Quotations fit that channel.

Verified constraints on the Resend send API:

- **Attachments are capped at 40 MB per email, measured after Base64 encoding.** A generated quotation PDF is orders of magnitude below this, so the limit is not a design constraint in practice. It is recorded because Base64 inflates payload by roughly a third and because a future "attach the full pricelist" variant could approach it.
- **An `Idempotency-Key` header is supported**, unique per request, expiring after 24 hours, max 256 characters. This is the correct mechanism for the existing generate-on-write / send-after-commit pattern: key the send on the quotation reference so a retry after a transient failure cannot send a duplicate customer email.
- Attachment `content_type` should be set explicitly rather than inferred from the filename.
- Recipient lists cap at 50 addresses per send.

The 24-hour idempotency window is shorter than it looks. It comfortably covers retries of a single failed commit, but it is not a durable deduplication guarantee. Long-term safety comes from persisting a send record on the quotation row, not from the header alone.

---

## 5. Implementation gap

Every row below is grounded in `path:line` read directly from the repository. Absence claims come from exhaustive pattern searches across `src/` and `prisma/`, not from recollection.

### Evidence

| Paper claim / proposed capability | Current state | Evidence |
|---|---|---|
| "generation of quotations" (`:193`) | Not implemented. Zero `Quotation`, `RFQ`, or `RequestForQuotation` symbols exist in `src/` or `prisma/`. No quotation model in the schema. | `prisma/schema.prisma:171–212` (only `Inquiry` + `InquiryProduct`); exhaustive search returned no quotation symbols |
| "quote generator" via Gmail (`:211`, `:217`) | Not implemented. Delivery is a Resend HTTP `POST`, not Gmail automation. | `src/lib/email.ts:22`, `src/lib/email.ts:98–112` |
| Catalog as authoritative line-item source | Exists and is server-resolved. Only product IDs cross the browser boundary; name, SKU and availability are re-read from the catalog on submit. | `src/app/(public)/contact/actions.ts:59–68`, `src/app/(public)/contact/actions.ts:74–86` |
| Durable enquiry reference `FLQ-…` | Exists. `buildInquiryReference` formats `FLQ-YYYYMMDD-XXXXXX` from a UTC date plus a 6-char suffix. The alphabet deliberately omits `0/O/1/I` because sales reads references aloud. | `src/lib/inquiry.ts:5–6`, `src/lib/inquiry.ts:14–31` |
| Quotation document artifact + retention | Not implemented. No file path, template, or artifact field exists on any model; uploads live outside the quotation concept entirely. | `prisma/schema.prisma:171–193` (no document/artifact column) |
| Quotation send via Resend | Enquiry send exists and is durable-then-notify. Attachment support does **not** exist — the request body carries no attachment or `content_type`. | `src/lib/email.ts:98–112`, `src/app/(public)/contact/actions.ts:132–196` |
| Pricing snapshot at issue time | Not implemented at any of the three layers where it would have to live. | See below |

### Pricing snapshot is absent at every layer

This is the most consequential gap, and the easiest to miss because no visible feature is missing — nothing in the UI implies a price should have been kept. A quotation is a priced commitment; the current pipeline never records a price at all.

1. **Read path** — the catalog query selects only `id`, `name`, `sku`, and `availabilityStatus`. No price field is fetched. `src/app/(public)/contact/actions.ts:67`
2. **Persistence path** — `InquiryProduct` snapshots `productName`, `productSku`, and `availabilityStatus`, but has no `unitPrice` or price column. `prisma/schema.prisma:195–212`
3. **Notification path** — the email line type carries `name`, `sku`, `quantity`, `availability`. The text and HTML bodies print exactly those four fields. `src/lib/email.ts:1–6`, `src/lib/email.ts:33–55`, `src/lib/email.ts:57–83`

Live prices do exist on `ProductVariant.unitPrice` (`prisma/schema.prisma:144`), so the missing snapshot can be reconstructed retroactively only by re-reading current prices. For enquiries that predate a price edit, that reconstruction is wrong, and there is no stored record proving it wrong. The snapshot must be captured at issue time; it cannot be added later without losing the historical basis.

### The terminology gap is already user-visible

The paper describes the feature as generating quotations (`:193`), and the public site already says quotations in three places, while no quotation capability exists anywhere in the codebase:

- `src/app/(public)/page.tsx:26` — "Quotations can be finalized in real time, with delivery scheduled within 1-2 business days or available for authorized pickup immediately."
- `src/app/(public)/contact/page.tsx:16` — "For quotations, stock checks, or technical questions about the…"
- `src/app/(public)/about/page.tsx:63` — "pricing or quotations,"

The homepage sentence is the sharpest instance. It promises real-time finalization and a delivery or pickup window. The implemented system produces an anonymous enquiry row with a reference and a best-effort email — no price, no document, no validity period, no fulfilment. This is the same conceptual error Section 6 identifies in the paper's citations, expressed in customer-facing copy: an enquiry mechanism presented as a quotation mechanism.

Three properties would make the current behaviour honest without building anything new, and are worth stating because they are cheap:

1. Describe what is delivered — an enquiry, answered by sales — instead of a finalized quotation.
2. State that pricing and availability are confirmed by sales in the reply, which is already true.
3. Drop the delivery and pickup window, which the prototype explicitly excludes from scope.

---

## 6. Defects in the paper's existing reference list

An audit of the nine references in `PPG X MOJO Capstone.md` found that **all nine URLs resolve**, but **seven carry defective metadata** (five outright wrong, two incomplete) and **four are cited for claims their source does not support**.

The failure mode here is not dead links. It is live links pointing at the wrong thing — the more dangerous kind, because it survives a link checker.

The table lists the nine sources exactly as the paper cites them. Those author-year strings belong to the paper, not to this report; the sources this report itself relies on are listed separately in Section 8.

### Audit table

| Ref | Cited as | Resolves | Metadata | Supports the claim? | Verdict |
|---:|---|---|---|---|---|
| 1 | Nadkarni & Prügl (2020), *Management Review Quarterly*, 71, 233–341 | Yes | **Wrong.** Journal issue is **2021, 71(2)**; 2020 is the online-first year. Issue omitted. | Mostly. A DT/organizational-change review; does not establish efficiency gains for *this* company. | Metadata error |
| 2 | Niemir, Grajewska, & Nitoń (2025), ICAART, 1116–1123 | Yes | Correct | **No.** Studies VLM detection of **non-compliant product images**, not textual attribute accuracy/completeness. | Claim mismatch |
| 3 | Reis & Melão (2023), *Heliyon*, 9(e12834) | Yes | Correct | **Partly.** Supports the DT rationale; does **not** demonstrate reduced long-term operational cost. | Claim mismatch |
| 4 | You et al. (2017), *JITIM*, 26, 94–116 | Yes | **Incomplete** — issue 2 omitted | **No.** Adaptive *supplier selection* in an e-procurement marketplace; does not present a "Request" button as an RFQ workflow. | Claim mismatch |
| 5 | Zong et al. (2021), *JTAER*, 16, 1150–1164 | Yes | **Incomplete** — correct is **16(4)** | **No.** Fuzzy-logic e-commerce decision support; does not define the Request button as an RFQ. | Claim mismatch |
| 6 | Budiandru et al. (2020), OpenAlex W3092451132 | Yes | **Wrong.** Article is **29(7), 481–488**, ISSN 2207-6360. Cited form is an identifier, not a reference. | Yes, within scope. Supports catalog/order-error/time-cost claims. | Metadata error |
| 7 | Rohma & Opoku (2026), DOI | Yes | **Inconsistent.** Crossref carries a 2025/2026 issue-date conflict; full author names needed. | Yes. Reporting accelerated from three days to real time. | Metadata error |
| 8 | Yuniarto & Siregar (2025), DOI | Yes | **Wrong.** Correct: **Yuniarto, A. A., & Siregar, I. W.**, *J. Scientific Insights*, 2(5), 510–525. Initials and journal details wrong. | Generally yes. Not specific to fire-equipment catalogs. | Metadata error |
| 9 | Zaki & Hermawan (2025), *Bit-Tech* | Yes | **Incomplete** — omits **8(2), 2419–2429** | Generally yes. But it is an Indonesian local-products case, not fire-protection equipment. | Metadata error |

### Claims at risk

1. **`PPG X MOJO Capstone.md:127`** — "the accuracy and completeness of digital catalog attributes directly enhance e-commerce efficiency … (Niemir et al., 2025)". The source validates product **images**, not textual attributes. Narrow the sentence to image/visual catalog quality, or replace the source.
2. **`PPG X MOJO Capstone.md:129–130`** — "the request feature acts akin to a Request for Quotation (RFQ) … (You et al., 2017; Zong et al., 2021)". Neither source supports this. An actual RFQ/B2B quotation-process source is needed, or the feature should be described as a product inquiry rather than an RFQ.
3. **`PPG X MOJO Capstone.md:135`** — "improve the efficiency of customer–seller communication … (Zong et al., 2021)". Zong et al. supports general e-commerce decision support, not this email workflow.
4. **`PPG X MOJO Capstone.md:127`** — "digital systems significantly reduce long-term operational costs (Reis & Melão, 2023)". A meta-review is not direct empirical evidence of cost reduction.
5. **`PPG X MOJO Capstone.md:147`** — "cutting operational errors and accelerating reporting to near real time (Rohma & Opoku, 2026)". Supported by the abstract, but the reference's publication chronology needs correction.

Item 2 is the one that matters most here, because it is the same conceptual error this document exists to prevent: an inquiry mechanism being described as a quotation mechanism.

---

## 7. Open decisions

These are unresolved and should be settled before implementation:

1. **Pricing snapshot or live pricing?** Determines whether an issued quotation is immutable, so it must be answered first. If pricing is modelled as a single static unit price, snapshotting the value is straightforward. If it is modelled as *price conditions* per Kelkar et al. (2002), then the conditions — validity period, quantity break, customer class — are what must be snapshotted, and the data model changes shape.
2. **PDF only, or PDF plus HTML view?** An HTML view is materially more accessible and easier to make responsive.
3. **Who prices a quotation — automated or staff-reviewed?** If prices vary by customer or need approval, "generate on submit" is the wrong trigger and the send-after-commit pattern in ADR-010 needs rethinking. Flechsig et al. (2022) is the reason to assume governance gaps rather than absence of them.
4. **Retention period** for issued quotation documents, and whether an expired price reopens the record. IEEE (2019) treats retention and disposition of artifacts as a controlled lifecycle decision rather than an afterthought; the same reasoning applies to a priced commercial document, which is exactly the kind of record a dispute may require years later.

---

## 8. References

APA 7th. Only entries whose metadata was verified against a DOI record or official documentation are listed.

### Standards

OASIS. (2021). *Universal Business Language version 2.3*. OASIS Standard. https://docs.oasis-open.org/ubl/os-UBL-2.3/UBL-2.3.html

IEEE Computer Society. (2019). *IEEE standard for developing a software project life cycle process (IEEE Std 1074-2019).* IEEE. https://doi.org/10.1109/IEEESTD.2019.8888800

International Organization for Standardization. (2014). *Document management applications — Electronic document file format enhancement for accessibility — Part 1: Use of ISO 32000-1 (PDF/UA-1)* (ISO 14289-1:2014). https://www.iso.org/standard/64599.html

International Organization for Standardization. (2024). *Document management applications — Electronic document file format enhancement for accessibility — Part 2: Use of ISO 32000-2 (PDF/UA-2)* (ISO 14289-2:2024). https://www.iso.org/standard/82278.html

World Wide Web Consortium. (2024). *Web content accessibility guidelines (WCAG) 2.2* [W3C Recommendation]. https://www.w3.org/TR/WCAG22/

### Literature

Alor-Hernández, G., Sánchez-Ramírez, C., Cortes-Robles, G., Rodríguez-González, A., García-Alcaraz, J. L., & Cedillo-Campos, M. G. (2014). BROSEMWEB: A brokerage service for e-procurement using semantic Web technologies. *Computers in Industry, 65*(5), 828–840. https://doi.org/10.1016/j.compind.2013.12.007

Andersen, T. K., Haug, A., & Hvam, L. (2025). Extending product offers with product-related services: The value of configurators. *Journal of Engineering Design, 36*(4), 596–625. https://doi.org/10.1080/09544828.2025.2453400

Baron, J. P., Shaw, M. J., & Bailey, A. D., Jr. (2000). Web-based e-catalog systems in B2B procurement. *Communications of the ACM, 43*(5), 93–100. https://doi.org/10.1145/332833.332845

Elgh, F. (2012). Decision support in the quotation process of engineered-to-order products. *Advanced Engineering Informatics, 26*(1), 66–79. https://doi.org/10.1016/j.aei.2011.07.001

Flechsig, C., Anslinger, F., & Lasch, R. (2022). Robotic process automation in purchasing and supply management: A multiple case study on potentials, barriers, and implementation. *Journal of Purchasing and Supply Management, 28*(1), 100718. https://doi.org/10.1016/j.pursup.2021.100718

Haug, A., Hvam, L., & Mortensen, N. H. (2011). The impact of product configurators on lead times in engineering-oriented companies. *Artificial Intelligence for Engineering Design, Analysis and Manufacturing, 25*(2), 197–206. https://doi.org/10.1017/S0890060410000636

Kelkar, O., Leukel, J., & Schmitz, V. (2002). Price modeling in standards for electronic product catalogs based on XML. In *Proceedings of the 11th International Conference on World Wide Web* (pp. 366–375). Association for Computing Machinery. https://doi.org/10.1145/511446.511494

### Technical documentation

Resend. (n.d.). *Send email*. https://resend.com/docs/api-reference/emails/send-email

### Verification limitations

- Several sources were verified from **abstracts and publisher metadata rather than full text**. They support only the specific claims attributed to them in this document, not broader claims about implementation effectiveness.
- Crossref returned rate-limit responses for the Flechsig, Haug, and Alor-Hernández DOIs during batch lookup. Those three were instead confirmed by resolving the DOI directly against the publisher record — which is precisely how the Haug/Hvam author error below was caught.
- **A DOI was mis-attributed twice, independently.** The source at `10.1017/S0890060410000636` was carried forward as "Hvam, Pape, & Nielsen (2011)" in upstream research output, which simultaneously stated that no unverified bibliographic fields were being used. Direct DOI resolution shows the authors are **Haug, Hvam, & Mortensen (2011)** — same title, journal, volume, issue, pages, and DOI. Attribution must be checked against the DOI record itself, never inherited from an upstream list, and a stated verification limit must never be contradicted by the data returned alongside it.
- The claim that automated quotation generation will *always* improve conversion, profitability, or customer satisfaction is **not supported** by these sources. The evidence supports reduced manual effort, shorter quotation lead times, greater consistency, structured exchange, and traceability. Any financial or customer-performance claim should be framed as a hypothesis to evaluate, not an established outcome.
- **The ISO 14289 and WCAG sources are not freely readable.** ISO standards are paywalled, so the PDF/UA requirements cited in Section 3 were verified from the ISO catalogue abstract and published scope statement, not from the full normative text. Conformance therefore needs a conformant checker (for example PAC 2024 for PDF/UA-2) rather than a reading of the document itself. WCAG 2.2 was verified from the W3C Recommendation itself, including the success-criterion text, but WCAG 2.2 errata are not folded into that publication — a criterion that changed in an erratum must be read at its updated wording.
