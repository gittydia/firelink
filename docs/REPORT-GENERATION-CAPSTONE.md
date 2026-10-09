# Proposed Quotation and RFQ Document Generation Capability

## 1. Scope and Context

Fire Protection Equipment is an information and inventory-visibility prototype. Its current customer workflow captures product enquiries; it does not provide cart, checkout, payment, order capture, or quotation-document generation. This chapter proposes a non-transactional quotation and request-for-quotation (RFQ) capability that can be introduced in a future phase.

The proposed capability distinguishes an enquiry from a quotation. An enquiry records customer intent and is answered by sales. A quotation is a dated commercial document that identifies the requested items, records the applicable commercial terms, and can be retrieved after it has been issued. Maintaining this distinction prevents customer-facing language from overstating the behavior of the implemented system.

## 2. Proposed Process

The proposed process follows the RFQ-to-quotation exchange described by Elgh (2012): RFQ receipt, quotation preparation, and quotation evaluation.

1. A customer selects catalog items and specifies quantities and delivery constraints.
2. The system records the request and assigns a durable reference in the format `FLQ-YYYYMMDD-XXXXXX`.
3. The system resolves item names, descriptions, units of measure, and commercial information from the catalog rather than accepting those values from the customer. Catalog-based procurement reduces manual specification errors (Baron et al., 2000).
4. A staff member reviews the request and approves the applicable commercial terms.
5. The system generates an immutable quotation document, records its issue time, and sends it to the customer.
6. Sales staff can retrieve the issued document and its delivery record when responding to a customer enquiry or dispute.

Two design properties are essential. First, a quotation must be reproducible: the issued document should retain the relevant product description, price, validity period, quantity break, and customer classification. Kelkar et al. (2002) show that catalog prices can consist of multiple price conditions rather than one fixed value; therefore, a future implementation should snapshot the applicable conditions when issuing a quotation. Second, a quotation must be auditable through an immutable identifier, issue timestamp, and delivery record.

Standardized output also supports future interoperability. Andersen et al. (2025) explain that standardized offer templates make product offers reusable beyond their original purpose. Similarly, Alor-Hernández et al. (2014) demonstrate that semantic, machine-readable e-procurement documents can be processed between buyer and supplier systems without re-keying.

## 3. Standards and Document Rendering

Universal Business Language (UBL) 2.3 defines both the `RequestForQuotation` and `Quotation` document types (OASIS, 2021). UBL adoption is not required for the prototype, but its data model provides a future path to interoperable document exchange instead of a Fire Protection Equipment-specific format.

Quotation PDFs can be generated server-side with `@react-pdf/renderer` or `pdf-lib`. A declarative renderer is the preferred option because it fits the existing React application model without requiring a headless browser. The rendering approach should be validated during implementation, particularly where accessible tagged-PDF output is required.

Accessibility requirements depend on the chosen output. An HTML quotation view should conform to the Web Content Accessibility Guidelines (WCAG) 2.2 (World Wide Web Consortium [W3C], 2024). A PDF quotation should be assessed against the appropriate PDF/UA standard: ISO 14289-2:2024 for PDF 2.0 output, or ISO 14289-1:2014 for PDF 1.7 output (International Organization for Standardization [ISO], 2014, 2024).

The planned document should provide logical heading and table structure, a meaningful reading order, a declared document language and title, real text rather than rasterized text, and sufficient contrast. Since tagged-PDF support varies between rendering libraries, accessibility must be tested against the generated artifact rather than assumed from the library selection. Providing an HTML view alongside the PDF would make the quotation easier to audit against WCAG success criteria.

## 4. Delivery and Implementation Status

The application already has a durable enquiry workflow and transactional email notification. This establishes a useful foundation for quotation delivery: persist the business record first, then send the email. The existing email provider supports attachments, explicit attachment content types, and idempotency keys (Resend, n.d.). In a quotation feature, the quotation reference should be used as the idempotency key so a retry does not issue duplicate customer emails.

However, the current implementation does not contain a quotation or RFQ data model, quotation-document artifact, price snapshot, quotation lifecycle, or email attachment workflow. It records an enquiry reference and selected product information, but does not preserve the commercial terms needed for a priced commitment. Current public quotation wording should therefore be interpreted as a future capability rather than evidence of an implemented quotation generator.

## 5. Limitations and Future Work

The proposed capability should be implemented only after the following decisions are made:

1. **Pricing model:** determine whether quotations snapshot a unit price or a complete set of price conditions.
2. **Output format:** determine whether to issue a PDF only or an accessible HTML view with an optional PDF.
3. **Approval workflow:** determine whether quotation pricing is automated, staff-reviewed, or subject to role-based approval. Human review and governance are important considerations in automated purchasing processes (Flechsig et al., 2022).
4. **Retention:** determine the retention period for issued documents, send records, and expired quotations. Retention and disposition should be managed as a controlled artifact lifecycle (IEEE Computer Society, 2019).

The literature used in this chapter supports structured document exchange, traceability, consistency, and reduced manual effort. It does not establish that automated quotation generation will necessarily improve profitability, conversion, or customer satisfaction. Those outcomes should be evaluated after implementation.

## References

Alor-Hernández, G., Sánchez-Ramírez, C., Cortes-Robles, G., Rodríguez-González, A., García-Alcaraz, J. L., & Cedillo-Campos, M. G. (2014). BROSEMWEB: A brokerage service for e-procurement using semantic Web technologies. *Computers in Industry, 65*(5), 828-840. https://doi.org/10.1016/j.compind.2013.12.007

Andersen, T. K., Haug, A., & Hvam, L. (2025). Extending product offers with product-related services: The value of configurators. *Journal of Engineering Design, 36*(4), 596-625. https://doi.org/10.1080/09544828.2025.2453400

Baron, J. P., Shaw, M. J., & Bailey, A. D., Jr. (2000). Web-based e-catalog systems in B2B procurement. *Communications of the ACM, 43*(5), 93-100. https://doi.org/10.1145/332833.332845

Elgh, F. (2012). Decision support in the quotation process of engineered-to-order products. *Advanced Engineering Informatics, 26*(1), 66-79. https://doi.org/10.1016/j.aei.2011.07.001

Flechsig, C., Anslinger, F., & Lasch, R. (2022). Robotic process automation in purchasing and supply management: A multiple case study on potentials, barriers, and implementation. *Journal of Purchasing and Supply Management, 28*(1), 100718. https://doi.org/10.1016/j.pursup.2021.100718

IEEE Computer Society. (2019). *IEEE standard for developing a software project life cycle process (IEEE Std 1074-2019).* IEEE. https://doi.org/10.1109/IEEESTD.2019.8888800

International Organization for Standardization. (2014). *Document management applications - Electronic document file format enhancement for accessibility - Part 1: Use of ISO 32000-1 (PDF/UA-1)* (ISO 14289-1:2014). https://www.iso.org/standard/64599.html

International Organization for Standardization. (2024). *Document management applications - Electronic document file format enhancement for accessibility - Part 2: Use of ISO 32000-2 (PDF/UA-2)* (ISO 14289-2:2024). https://www.iso.org/standard/82278.html

OASIS. (2021). *Universal Business Language version 2.3*. OASIS Standard. https://docs.oasis-open.org/ubl/os-UBL-2.3/UBL-2.3.html

Resend. (n.d.). *Send email*. https://resend.com/docs/api-reference/emails/send-email

World Wide Web Consortium. (2024). *Web content accessibility guidelines (WCAG) 2.2* [W3C Recommendation]. https://www.w3.org/TR/WCAG22/
