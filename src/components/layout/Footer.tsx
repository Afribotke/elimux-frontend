/**
 * Cycle 025: canonical SV-named entry point for the footer. Re-exports the
 * existing components/Footer.tsx (sponsor-logo logic + real link structure)
 * rather than forking a new one. Note: Footer was previously unused anywhere
 * in the app — see docs/audit-log.md.
 */
export { default as Footer } from "@/components/Footer";
