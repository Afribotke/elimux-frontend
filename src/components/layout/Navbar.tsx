/**
 * Cycle 025: canonical SV-named entry point for the site nav. Deliberately
 * re-exports the existing DesktopNav rather than reimplementing links/auth
 * dropdown/notification-bell logic — avoids forking navigation state and
 * keeps "no existing routes broken" true by construction.
 */
export { default as Navbar } from "@/components/DesktopNav";
