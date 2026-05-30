/**
 * DEMO MODE — open access to /broker and /admin without login.
 *
 * When `DEMO_OPEN_ACCESS` is true, the broker portal and admin panel are
 * reachable by anyone with the URL — no phone/OTP login required. This is
 * for showing the product during demos.
 *
 * ⚠️  SECURITY: While this is true, the admin panel and broker portal are
 *     PUBLIC. Real lead data (names, phone numbers) is exposed to anyone
 *     who visits /admin or /broker.
 *
 * To LOCK IT DOWN before a real launch:
 *   Set the env var  DEMO_OPEN_ACCESS=false  on Vercel (and locally), then
 *   redeploy. Auth (Supabase phone OTP + brokers/admin_users table) is then
 *   enforced again — no code change needed.
 *
 * Default (flag unset) = OPEN, so the demo works out of the box.
 */
export const DEMO_OPEN_ACCESS = process.env.DEMO_OPEN_ACCESS !== "false";
