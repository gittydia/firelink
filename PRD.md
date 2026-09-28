# PRODUCT REQUIREMENTS DOCUMENT

**A Web-Based Product Information and Inventory Management System for Fire Protection Equipment**  
_Capstone Project | Requirements Baseline_

- **Document status:** Draft for validation
- **Prepared from:** Project overview and research objectives supplied by the project team
- **Primary users:** Customers and sales personnel
- **Core availability labels:** Local, In Stock, Indent
- **Purpose:** This document converts the project intent into a traceable scope, behavior map, and validation baseline. Items marked **UNKNOWN** are decisions that should be confirmed before implementation.

---

## 1. Executive Summary

The proposed system is a centralized web application for presenting fire protection equipment information and maintaining inventory visibility. Customers should be able to browse organized products, review specifications and compliance information, and understand whether an item is Local, In Stock, or Indent. Sales personnel should be able to maintain product and inventory information so customer inquiries are answered using a consistent and current source.

**Problem statement:** Product details, technical specifications, compliance information, and availability are difficult to access consistently during customer inquiries. This creates avoidable delays, inconsistent answers, and uncertainty about whether products can be supplied locally, are currently stocked, or must be ordered.

**Product promise:** One searchable, structured catalog connects product knowledge with a simple, understandable availability state.

**In scope for the capstone:** Product catalog, categories, filtering, product detail pages, compliance information, inventory status management, customer-facing availability display, and a sales-personnel maintenance area.

**Out of scope unless approved:** Payments, purchasing, warehouse automation, supplier integrations, customer accounts, online ordering, delivery tracking, and regulatory certification decisions.

---

## 2. Goals, Outcomes, and Success Measures

| Goal                               | Intended outcome                                                            | Evidence of success                                                                                                                    |
| :--------------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Centralize product information** | Customers and sales personnel use one structured catalog for product facts. | Each published product has a consistent detail view with category, description, specifications, and compliance fields when applicable. |
| **Improve inventory visibility**   | Availability is visible without requiring a separate manual lookup.         | A product displays exactly one current availability classification: Local, In Stock, or Indent.                                        |
| **Support customer inquiries**     | Users find relevant equipment faster and can distinguish product options.   | Users can search, browse categories, filter results, and open a product detail page from the catalog.                                  |
| **Maintain information quality**   | Sales personnel can update records with clear ownership and validation.     | Authorized personnel can create, edit, classify, publish, and retire records according to the confirmed workflow.                      |

---

## 3. Users and Permissions

| Actor                       | Needs                                              | Allowed behavior in this PRD                                                                                                 | Open decision                                                                                         |
| :-------------------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Customer/public visitor** | Find equipment information and availability.       | View published products, search, filter, inspect details, and see availability labels.                                       | Does the catalog require sign-in? **UNKNOWN** - default assumption is no sign-in for public browsing. |
| **Sales personnel**         | Keep product and availability information current. | Access a protected maintenance area; create, edit, classify, publish, and retire product records subject to confirmed rules. | Which staff roles may edit or publish? **UNKNOWN**.                                                   |
| **System administrator**    | Manage access and system configuration.            | Manage users and permissions if administration is included.                                                                  | Admin scope and audit requirements are **UNKNOWN**.                                                   |

> **Permission risk note:** Any rule that controls who may edit, publish, retire, or change availability is a high-impact authorization requirement and must be explicitly confirmed.

---

## 4. Scope and Product Boundaries

| Included capability         | Description                                                                         | Minimum release expectation                                                                    |
| :-------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **Catalog browsing**        | A customer-facing list of published fire protection equipment.                      | Products are grouped by category and show enough summary information to select a detail page.  |
| **Search and filtering**    | Tools to narrow the catalog by text, category, and availability.                    | Search and filters work together and can be cleared.                                           |
| **Product details**         | Structured product information including specifications and compliance information. | The page distinguishes required fields from optional fields and does not display blank labels. |
| **Availability management** | A maintained availability classification for each product.                          | Only the three stated labels are available unless the team approves more states.               |
| **Staff maintenance**       | Protected screens for maintaining products and classifications.                     | Validation prevents incomplete or contradictory records from being saved or published.         |

---

## 5. Functional Requirements

Each requirement below has a stable identifier for later design, implementation, testing, and review. Status is "proposed" because the project brief has not yet been validated with stakeholders.

### R-01 | Browse the product catalog

- **User outcome:** A customer can view a list of published fire protection equipment products.
- **Behavior and rules:** Only published records appear in the public catalog. Each result shows a product name, category, and current availability label. Empty catalog states are explained.
- **Actor and permission:** Customer/public visitor: read-only. Staff visibility of drafts is **UNKNOWN**.
- **Acceptance evidence:** Evidence: open catalog with zero, one, and multiple published products; verify labels and links.

### R-02 | Search products

- **User outcome:** A customer can find products by a text query.
- **Behavior and rules:** Search matches the confirmed searchable fields. **UNKNOWN**: exact fields and matching rules. Search is case-insensitive by default assumption. No-result state provides a clear message and reset path.
- **Actor and permission:** Customer/public visitor: read-only.
- **Acceptance evidence:** Evidence: search by product name and an approved alternate field; verify result, no-result, and clear behavior.

### R-03 | Filter and categorize products

- **User outcome:** A customer can narrow results by product category and availability classification.
- **Behavior and rules:** Categories are controlled values. Availability filters use Local, In Stock, and Indent. Multiple active filters combine predictably. **UNKNOWN**: whether multi-select is required.
- **Actor and permission:** Customer/public visitor: read-only. Staff manages category values if permitted.
- **Acceptance evidence:** Evidence: apply each filter, combine filters, clear filters, and confirm result counts or equivalent feedback.

### R-04 | View product details

- **User outcome:** A customer can inspect a complete product information page.
- **Behavior and rules:** The detail view includes product name, category, description, specifications, compliance information when available, and availability. Missing optional data is omitted or labeled according to confirmed design rule.
- **Actor and permission:** Customer/public visitor: read-only.
- **Acceptance evidence:** Evidence: inspect a fully populated and partially populated product; verify no misleading blank fields.

### R-05 | Display availability classification

- **User outcome:** A customer can understand whether a product is Local, In Stock, or Indent.
- **Behavior and rules:** Each published product has exactly one displayed classification. Labels must be consistent across list, detail, and filtered views. Definitions and customer-facing explanatory text are **UNKNOWN** and require confirmation.
- **Actor and permission:** Staff updates; public reads.
- **Acceptance evidence:** Evidence: create or update examples of all three states and verify consistent display and filtering.

### R-06 | Maintain product records

- **User outcome:** Authorized sales personnel can create and edit product records.
- **Behavior and rules:** Required fields, field formats, category selection, and duplicate handling are validated. Save errors preserve entered data and explain what must be corrected. Exact required fields are **UNKNOWN**.
- **Actor and permission:** Sales personnel: protected write access. Authorization is HIGH RISK - FABLE-HIGH-RISK.
- **Acceptance evidence:** Evidence: authorized create/edit, invalid input, duplicate candidate, cancel, and successful save scenarios.

### R-07 | Maintain availability

- **User outcome:** Authorized sales personnel can assign and update the availability classification.
- **Behavior and rules:** The available values are Local, In Stock, and Indent. A product cannot be published without a valid classification unless an explicit exception is approved. Whether quantity is stored or only a label is shown is **UNKNOWN**.
- **Actor and permission:** Sales personnel: protected write access. Authorization is HIGH RISK - FABLE-HIGH-RISK.
- **Acceptance evidence:** Evidence: update all states, reject invalid state, and verify public visibility after an approved update.

### R-08 | Publish and retire products

- **User outcome:** Authorized personnel can control which products appear publicly.
- **Behavior and rules:** Draft or retired records do not appear in the public catalog. Publication and retirement behavior, including whether approval is required, are **UNKNOWN**.
- **Actor and permission:** Sales personnel or administrator: protected write access. Publication authorization is HIGH RISK - FABLE-HIGH-RISK.
- **Acceptance evidence:** Evidence: public catalog before and after publish/retire; verify direct links do not expose retired content.

### R-09 | Show data freshness

- **User outcome:** Users can judge whether availability information is current enough for an inquiry.
- **Behavior and rules:** The system should expose last-updated information if approved. The freshness threshold, displayed timestamp, and stale-data warning rule are **UNKNOWN**.
- **Actor and permission:** Public read; staff updates.
- **Acceptance evidence:** Evidence: update a record and verify the approved freshness indicator or confirmed absence of one.

### R-10 | Validate and handle errors

- **User outcome:** Users receive understandable feedback when an operation cannot complete.
- **Behavior and rules:** The system handles empty results, invalid fields, unavailable records, unauthorized maintenance access, and failed saves without losing context. Technical details are not exposed to customers.
- **Actor and permission:** All actors, with role-appropriate messaging.
- **Acceptance evidence:** Evidence: exercise each error state and verify message, recovery path, and data integrity.

### R-11 | Protect maintenance access

- **User outcome:** Only authorized personnel can change product or availability information.
- **Behavior and rules:** Public users cannot reach write operations. Staff permissions are enforced server-side and client-side as applicable. Authentication method, session policy, and account recovery are **UNKNOWN**.
- **Actor and permission:** Sales personnel/admin. Authorization is HIGH RISK - FABLE-HIGH-RISK.
- **Acceptance evidence:** Evidence: unauthenticated, authenticated unauthorized, and authenticated authorized access checks.

### R-12 | Preserve change accountability

- **User outcome:** The team can determine who changed important records when accountability is required.
- **Behavior and rules:** Audit history for product and availability changes is **UNKNOWN**. If required, record actor, timestamp, action, and affected record without exposing private staff data publicly.
- **Actor and permission:** Administrator/staff. Audit requirement is **UNKNOWN**; risk becomes HIGH if mandated.
- **Acceptance evidence:** Evidence: confirm decision; if included, verify a change record is created and access is restricted.

---

## 6. Data Requirements

| Entity/field group                          | Minimum information                                                                                             | Rules and unknowns                                                                                                                                                                                                                                                                    |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Product**                                 | Stable identifier, product name, category, description, availability classification, publication state.         | Identifier uniqueness required. Exact naming rules, SKU, brand, model, image, and document fields are **UNKNOWN**.                                                                                                                                                                    |
| **Specifications & Compliance information** | Technical attributes relevant to a product. Relevant standards, certifications, approvals, or compliance notes. | Specification schema may vary by category. **UNKNOWN** whether fields are free-form, category-specific, or both. The system may present supplied compliance information; it must not imply certification beyond verified source data. Required evidence and reviewer are **UNKNOWN**. |
| **Category**                                | Name and active/inactive state if managed.                                                                      | Category taxonomy and hierarchy are **UNKNOWN**. Avoid allowing uncontrolled duplicate labels.                                                                                                                                                                                        |
| **Availability**                            | One of Local, In Stock, or Indent.                                                                              | Definition, quantity, location, expected lead time, and last-confirmed timestamp are **UNKNOWN**.                                                                                                                                                                                     |
| **User/role**                               | Account identity and permission assignment if staff authentication is included.                                 | Role model, identity provider, password policy, and account lifecycle are **UNKNOWN**.                                                                                                                                                                                                |

---

## 7. Non-Functional Requirements

| Quality area                  | Requirement baseline                                                                                                                                                                                                                     | Validation evidence                                                                                                                            |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Usability**                 | A first-time customer can browse, filter, and open a product without staff assistance.                                                                                                                                                   | Scenario walkthrough with representative users; success criteria and sample size **UNKNOWN**.                                                  |
| **Responsive access**         | Core catalog and maintenance flows remain usable on the target desktop and mobile breakpoints.                                                                                                                                           | Test on confirmed browser/device matrix; matrix **UNKNOWN**.                                                                                   |
| **Performance**               | Catalog and product detail pages respond within an agreed threshold under expected capstone load.                                                                                                                                        | Target response time and test dataset size **UNKNOWN**.                                                                                        |
| **Availability and recovery** | The system does not silently lose updates and communicates service or save failures.                                                                                                                                                     | Failure-path test and recovery check; backup/restore expectations **UNKNOWN**.                                                                 |
| **Security & Accessibility**  | Maintenance operations are access-controlled; customer views do not reveal private staff or system data. Labels, contrast, keyboard focus, form errors, and status messages are understandable to users with common accessibility needs. | Authorization tests and data exposure review. Authentication details **UNKNOWN**. Manual accessibility checklist; target standard **UNKNOWN**. |
| **Maintainability**           | Product and category structures can be extended without rewriting every public view.                                                                                                                                                     | Review data model and representative category/product cases.                                                                                   |

---

## 8. Primary User Flows

| Flow                                     | Steps                                                                                                                   | Expected result                                                                                 |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Customer discovers a product**         | Open catalog -> choose category or search -> apply availability filter -> open result -> review details.                | Relevant product is found and its availability is understandable.                               |
| **Sales personnel updates availability** | Sign in -> open maintenance list -> select product -> choose one allowed classification -> save -> verify confirmation. | Updated classification is stored and reflected in approved public views.                        |
| **Sales personnel maintains product**    | Sign in -> create or edit -> complete required fields -> validate -> save or publish according to workflow.             | Valid product record is stored; invalid data remains editable with clear correction guidance.   |
| **User encounters unavailable data**     | Request page -> detect missing state -> explain issue -> offer recovery -> return to catalog.                           | System shows a clear state and a safe path back to catalog; no private error details are shown. |

### 8A. Customer product discovery journey

This journey covers the public path from finding a product to understanding its specifications and availability.

1. Open catalog
2. Search or filter
3. Select product
4. Review details
5. Understand availability

> **Decision dependency:** Searchable fields, category behavior, and availability definitions are still **UNKNOWN**.

### 8B. Sales personnel availability update journey

This journey covers the protected maintenance path for updating the Local, In Stock, or Indent classification.

1. Sign in
2. Open product
3. Choose status
4. Save update
5. Verify display

> **Decision dependency:** Staff roles, authentication, and whether quantity or lead time is recorded are still **UNKNOWN**.

### 8C. Sales personnel product maintenance journey

This journey covers creating or editing a product record before it becomes available to public users.

1. Sign in
2. Create or edit
3. Complete fields
4. Validate record
5. Save or publish

> **Decision dependency:** Required fields, duplicate rules, and publication approval are still **UNKNOWN**.

### 8D. Unavailable or failed data journey

This journey covers safe recovery when a record is missing, retired, unavailable, or cannot be loaded.

1. Request page
2. Detect missing state
3. Explain issue
4. Offer recovery
5. Return to catalog

> **Required behavior:** The system must not expose private technical details or leave the user without a clear next action.

### 8E. Overall system swimlane

The swimlane shows how customer activity, staff maintenance, and system behavior connect across the product lifecycle.

- **Customer/visitor:**
  - 1. Browse/inquire -> (Waits for system output) -> 5. See updated result
- **Sales personnel:**
  - 3. Maintain record -> (Sends to system)
- **System:**
  - 2. Read current data -> 4. Validate/publish _(Dashed workflow boundary: publication and permission rules remain UNKNOWN until confirmed)_

**Overall rule:** Public users read published information; authorized staff maintain records; the system validates and applies the confirmed publication and availability rules.

---

## 9. Acceptance Baseline

The capstone release should not be considered complete until the team can demonstrate the following end-to-end outcomes using representative fire protection equipment data:

- A customer can browse a published catalog, search, filter by category and availability, and open a product detail page.
- Each published product displays exactly one of the three required availability labels: Local, In Stock, or Indent.
- Product pages present specifications and compliance information accurately and avoid displaying misleading blank fields.
- Authorized sales personnel can maintain product records and availability, with validation and understandable error recovery.
- Unauthenticated or unauthorized users cannot change product or availability information.
- Draft or retired records follow the confirmed publication rule and do not leak through public listing or direct access.
- The system behavior and content remain usable on the approved browser/device scope.

---

## 10. Risks, Assumptions, and Decisions Needed

| Item                           | Why it matters                                                                    | Decision needed                                                                                                         |
| :----------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Availability semantics**     | The three labels may mean different operational commitments to customers.         | Define Local, In Stock, and Indent in plain language and decide whether quantities, locations, or lead times are shown. |
| **Publication authority**      | Incorrect public product or compliance information can mislead customers.         | Decide whether sales personnel publish directly or a reviewer approves changes. **HIGH RISK**.                          |
| **Compliance data governance** | Compliance claims may require source documents and review.                        | Define who supplies, verifies, and updates compliance information.                                                      |
| **Inventory model**            | A label-only model may not support actual stock control.                          | Decide whether the project tracks quantities, warehouses, reservations, reorder levels, or only visibility labels.      |
| **User accounts**              | Maintenance access requires a trustworthy identity and permission model.          | Confirm staff roles, authentication method, password/account lifecycle, and recovery.                                   |
| **Scope boundary**             | Ordering and integrations can expand the project beyond a capstone-sized release. | Explicitly exclude or include ordering, supplier data, customer accounts, and notifications.                            |

---

## 11. Traceability and Handoff

**Source basis:** All requirements are derived from the supplied project title, overview, and research objectives. No repository behavior or existing API was available for verification in this projectless workspace.

**Completeness measure:** Proposed functional coverage is represented by R-01 through R-12, with acceptance evidence attached to each requirement. Unknowns are explicitly recorded rather than resolved by inference. Test coverage, downstream rework, and revision locality are **UNKNOWN** until a validated design and implementation exist.

**Conflict check:** No direct conflicts were found in the supplied brief. The main ambiguity is whether "inventory management" means a three-state visibility label or a quantitative stock-control system. This ambiguity affects R-05, R-07, the data model, and the project boundary.

### Requirements Map

| ID       | Outcome                             | Rules                                                                                 | Acceptance Evidence                                                                                             | Status   |
| :------- | :---------------------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------- | :------- |
| **R-01** | Browse the product catalog          | A customer can view a list of published fire protection equipment products.           | Evidence: open catalog with zero, one, and multiple published products; verify labels and links.                | Proposed |
| **R-02** | Search products                     | A customer can find products by a text query.                                         | Evidence: search by product name and an approved alternate field; verify result, no-result, and clear behavior. | Proposed |
| **R-03** | Filter and categorize products      | A customer can narrow results by product category and availability classification.    | Evidence: apply each filter, combine filters, clear filters, and confirm result counts or equivalent feedback.  | Proposed |
| **R-04** | View product details                | A customer can inspect a complete product information page.                           | Evidence: inspect a fully populated and partially populated product; verify no misleading blank fields.         | Proposed |
| **R-05** | Display availability classification | A customer can understand whether a product is Local, In Stock, or Indent.            | Evidence: create or update examples of all three states and verify consistent display and filtering.            | Proposed |
| **R-06** | Maintain product records            | Authorized sales personnel can create and edit product records.                       | Evidence: authorized create/edit, invalid input, duplicate candidate, cancel, and successful save scenarios.    | Proposed |
| **R-07** | Maintain availability               | Authorized sales personnel can assign and update the availability classification.     | Evidence: update all states, reject invalid state, and verify public visibility after an approved update.       | Proposed |
| **R-08** | Publish and retire products         | Authorized personnel can control which products appear publicly.                      | Evidence: public catalog before and after publish/retire; verify direct links do not expose retired content.    | Proposed |
| **R-09** | Show data freshness                 | Users can judge whether availability information is current enough for an inquiry.    | Evidence: update a record and verify the approved freshness indicator or confirmed absence of one.              | Proposed |
| **R-10** | Validate and handle errors          | Users receive understandable feedback when an operation cannot complete.              | Evidence: exercise each error state and verify message, recovery path, and data integrity.                      | Proposed |
| **R-11** | Protect maintenance access          | Only authorized personnel can change product or availability information.             | Evidence: unauthenticated, authenticated unauthorized, and authenticated authorized access checks.              | Proposed |
| **R-12** | Preserve change accountability      | The team can determine who changed important records when accountability is required. | Evidence: confirm decision; if included, verify a change record is created and access is restricted.            | Proposed |

### Unknowns

- What exactly do Local, In Stock, and Indent mean to a customer, and should the system show quantity, location, lead time, or last-confirmed date? Blocks R-05, R-07, R-09.
- Which product, specification, and compliance fields are required, optional, searchable, and category-specific? Blocks R-02, R-04, R-06.
- Who may create, edit, publish, retire, and change availability? Is review or approval required? Blocks R-06, R-08, R-11.
- Is the system label-only inventory visibility or a quantitative inventory system? Blocks R-05, R-07 and scope.
- What authentication, staff roles, audit history, and account recovery are required? Blocks R-11, R-12.
- What browsers, devices, accessibility target, response-time target, and capstone dataset size define quality expectations? Blocks non-functional requirements.

### Dependency Notes for Rook

- Shared product contract: product identity, category, specification structure, compliance fields, availability state, publication state, and freshness metadata.
- Shared authorization boundary: public read versus protected staff write operations; publication and availability changes require explicit permission rules.
- Likely hub surfaces: product data model, public catalog query, product detail view, staff maintenance form, availability filter, and authentication/authorization boundary.
- External integrations, if any, are not defined. Treat supplier, warehouse, and regulatory sources as **UNKNOWN** dependencies until confirmed.

### Handoff for Flint and Puck

- Build and verify R-01 through R-05 as the customer-facing information and discovery baseline.
- Build and verify R-06 through R-08 only against confirmed staff permissions and publication rules.
- Verify R-09 through R-12 after the team decides freshness, error, authentication, and audit expectations.
- Preserve the three required availability labels exactly unless a documented product decision revises them.
- Do not infer quantitative inventory, approval workflow, or compliance certification behavior from the current brief; surface those as decisions.
