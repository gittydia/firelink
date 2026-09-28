/**
 * Bumped whenever the Privacy Policy wording changes materially. Every enquiry
 * stores the version that was accepted, so a later edit is attributable.
 *
 * Lives outside the "use server" action module on purpose: Next.js only allows
 * async function exports from a "use server" file, so a constant exported from
 * there fails the production build even though typecheck and tests pass.
 */
export const PRIVACY_POLICY_VERSION = "2026-09-28";
