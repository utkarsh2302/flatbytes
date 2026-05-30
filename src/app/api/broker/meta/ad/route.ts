import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveBrokerProfile } from "@/lib/broker";
import { limits } from "@/lib/rateLimit";

// Audience targeting templates for Indian real estate
const AUDIENCES: Record<string, object> = {
  "first_time_buyers": {
    age_min: 25, age_max: 40,
    interests: [{ id: "6003108900457", name: "Real estate" }, { id: "6002914294576", name: "Home buying" }],
    behaviors: [{ id: "6071631541183", name: "First-time home buyer" }],
  },
  "investors": {
    age_min: 30, age_max: 55,
    interests: [{ id: "6003108900457", name: "Real estate" }, { id: "6003682127657", name: "Investment" }],
  },
  "it_professionals": {
    age_min: 28, age_max: 45,
    interests: [{ id: "6003367887987", name: "Technology" }, { id: "6003108900457", name: "Real estate" }],
    behaviors: [{ id: "6015559470583", name: "Technology early adopters" }],
  },
  "nris": {
    age_min: 30, age_max: 55,
    geo_locations: { countries: ["IN"], regions: [] },
    interests: [{ id: "6003108900457", name: "Real estate" }],
    behaviors: [{ id: "6015235495383", name: "Expats" }],
  },
};

export async function POST(req: NextRequest) {
  const rl = limits.heavy(req);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await resolveBrokerProfile(user?.id ?? null);
  if (!profile) return NextResponse.json({ error: "Not a broker" }, { status: 403 });

  const { posterUrl, caption, flatId, budgetInr, durationDays, audienceType, city, flatType } =
    await req.json() as {
      posterUrl: string; caption: string; flatId?: string;
      budgetInr: number; durationDays: number;
      audienceType: string; city: string; flatType: string;
    };

  // eslint-disable-next-line
  const db = supabase as any;
  const { data: brokerRow } = await db.from("brokers").select("meta_page_id, meta_page_access_token, meta_ad_account_id").eq("id", profile.id).single();

  if (!brokerRow?.meta_page_id || !brokerRow?.meta_page_access_token) {
    return NextResponse.json({ error: "Facebook Page not connected" }, { status: 400 });
  }
  if (!brokerRow?.meta_ad_account_id) {
    return NextResponse.json({ error: "Ad Account not linked. Please link your Meta Business Ad Account." }, { status: 400 });
  }

  const pageToken = brokerRow.meta_page_access_token;
  const adAccountId = brokerRow.meta_ad_account_id;
  const pageId = brokerRow.meta_page_id;
  const dailyBudgetCents = Math.round((budgetInr / durationDays) * 100);

  const audience = AUDIENCES[audienceType] ?? AUDIENCES["first_time_buyers"];

  try {
    // 1. Create Campaign
    const campaignRes = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `FlatBytes - ${flatType} in ${city} - ${new Date().toLocaleDateString("en-IN")}`,
        objective: "LEAD_GENERATION",
        status: "ACTIVE",
        access_token: pageToken,
      }),
    });
    const campaign = await campaignRes.json();
    if (!campaign.id) return NextResponse.json({ error: `Campaign: ${campaign.error?.message}` }, { status: 500 });

    // 2. Create Ad Set
    const endTime = new Date(Date.now() + durationDays * 86400000).toISOString();
    const adSetRes = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/adsets`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${city} - ${audienceType}`,
        campaign_id: campaign.id,
        daily_budget: dailyBudgetCents,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LEAD_GENERATION",
        targeting: { geo_locations: { cities: [{ key: city }] }, ...audience },
        start_time: new Date().toISOString(),
        end_time: endTime,
        status: "ACTIVE",
        access_token: pageToken,
      }),
    });
    const adSet = await adSetRes.json();
    if (!adSet.id) return NextResponse.json({ error: `Ad Set: ${adSet.error?.message}` }, { status: 500 });

    // 3. Create Ad Creative
    const creativeRes = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/adcreatives`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Creative - ${flatType}`,
        object_story_spec: {
          page_id: pageId,
          link_data: { image_url: posterUrl, message: caption, link: `https://wa.me/${profile.phone.replace(/\D/g, "")}` },
        },
        access_token: pageToken,
      }),
    });
    const creative = await creativeRes.json();
    if (!creative.id) return NextResponse.json({ error: `Creative: ${creative.error?.message}` }, { status: 500 });

    // 4. Create Ad
    const adRes = await fetch(`https://graph.facebook.com/v19.0/act_${adAccountId}/ads`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Ad - ${flatType} ${city}`,
        adset_id: adSet.id,
        creative: { creative_id: creative.id },
        status: "ACTIVE",
        access_token: pageToken,
      }),
    });
    const ad = await adRes.json();
    if (!ad.id) return NextResponse.json({ error: `Ad: ${ad.error?.message}` }, { status: 500 });

    // Log
    await db.from("broker_ad_posts").insert({
      broker_id: profile.id, flat_id: flatId ?? null,
      poster_url: posterUrl, caption, platform: "both",
      post_type: "paid", ad_id: ad.id,
      budget_inr: budgetInr, duration_days: durationDays,
      status: "live",
    });

    return NextResponse.json({ ok: true, adId: ad.id, campaignId: campaign.id });
  } catch (err) {
    console.error("Meta Ads error:", err);
    return NextResponse.json({ error: "Ad creation failed" }, { status: 500 });
  }
}
