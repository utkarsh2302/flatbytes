import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile } from "@/lib/broker";
import { limits } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rl = limits.public(req);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) return NextResponse.json({ error: "Not a broker" }, { status: 403 });

  const { posterUrl, caption, platform, flatId } = await req.json() as {
    posterUrl: string; caption: string; platform: "facebook" | "instagram" | "both"; flatId?: string;
  };

  // eslint-disable-next-line
  const db = supabase as any;

  // Get broker's Meta credentials
  const { data: brokerRow } = await db.from("brokers").select("meta_page_id, meta_page_access_token, meta_ig_account_id").eq("id", profile.id).single();

  if (!brokerRow?.meta_page_id || !brokerRow?.meta_page_access_token) {
    return NextResponse.json({ error: "Facebook Page not connected" }, { status: 400 });
  }

  const pageId = brokerRow.meta_page_id;
  const pageToken = brokerRow.meta_page_access_token;
  const igId = brokerRow.meta_ig_account_id;

  let fbPostId: string | null = null;
  let igPostId: string | null = null;
  const errors: string[] = [];

  // Post to Facebook Page
  if (platform === "facebook" || platform === "both") {
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: posterUrl, caption, access_token: pageToken }),
      });
      const data = await res.json();
      if (data.id) fbPostId = data.id;
      else errors.push(`FB: ${data.error?.message ?? "Unknown error"}`);
    } catch (e) {
      errors.push("Facebook post failed");
    }
  }

  // Post to Instagram (requires image upload to container then publish)
  if ((platform === "instagram" || platform === "both") && igId) {
    try {
      // Step 1: Create media container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: posterUrl, caption, access_token: pageToken }),
      });
      const containerData = await containerRes.json();

      if (containerData.id) {
        // Step 2: Publish
        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: containerData.id, access_token: pageToken }),
        });
        const publishData = await publishRes.json();
        if (publishData.id) igPostId = publishData.id;
        else errors.push(`IG: ${publishData.error?.message ?? "Unknown error"}`);
      } else {
        errors.push(`IG container: ${containerData.error?.message ?? "Unknown error"}`);
      }
    } catch (e) {
      errors.push("Instagram post failed");
    }
  }

  // Log the post
  await db.from("broker_ad_posts").insert({
    broker_id: profile.id,
    flat_id: flatId ?? null,
    poster_url: posterUrl,
    caption,
    platform,
    post_type: "organic",
    fb_post_id: fbPostId,
    ig_post_id: igPostId,
    status: errors.length === 0 ? "live" : "failed",
  });

  if (fbPostId || igPostId) {
    return NextResponse.json({ ok: true, fbPostId, igPostId, warnings: errors });
  }
  return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
}
