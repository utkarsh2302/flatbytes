import { NextRequest, NextResponse } from "next/server";

// Redirects broker to Facebook OAuth to connect their Page
export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Meta App ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/broker/meta/callback`;
  const scope = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "ads_management",
    "ads_read",
    "business_management",
  ].join(",");

  const oauthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&response_type=code`;

  return NextResponse.redirect(oauthUrl);
}
