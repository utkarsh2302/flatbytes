import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBrokerProfile, resolveBrokerProfile } from "@/lib/broker";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/broker/marketing?meta_error=access_denied`);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${appUrl}/api/broker/meta/callback`;

  try {
    // Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${appId}&client_secret=${appSecret}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    const userToken = tokenData.access_token;

    // Get broker's Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page) throw new Error("No Facebook Page found");

    const pageToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    // Get Instagram account linked to this page
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
    );
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id ?? null;

    // Save to broker record
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const profile = await resolveBrokerProfile(user?.id ?? null);
    if (!profile) throw new Error("No broker profile");

    // eslint-disable-next-line
    const db = supabase as any;
    await db.from("brokers").update({
      meta_page_id: pageId,
      meta_page_name: pageName,
      meta_page_access_token: pageToken,
      meta_ig_account_id: igAccountId,
      meta_connected_at: new Date().toISOString(),
    }).eq("id", profile.id);

    return NextResponse.redirect(`${appUrl}/broker/marketing?meta_connected=1&page=${encodeURIComponent(pageName)}`);
  } catch (err) {
    console.error("Meta OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/broker/marketing?meta_error=failed`);
  }
}
