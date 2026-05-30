import { NextRequest, NextResponse } from "next/server";
import { limits } from "@/lib/rateLimit";

// Template captions for when AI is unavailable
function templateCaption(
  platform: string,
  projectName: string,
  flatType: string,
  location: string,
  brokerName: string,
  brokerPhone: string
): string {
  const loc = location.split(",")[0].trim();

  if (platform === "facebook") {
    return `🏡 Introducing ${projectName} — ${flatType} homes in the heart of ${loc}.

✅ Premium quality construction
✅ Modern amenities & landscaped spaces
✅ Ready for your family's next chapter

💰 Price on Request

Interested? Call or WhatsApp ${brokerName} at ${brokerPhone} for a private tour.

#RealEstate #${loc.replace(/\s/g, "")} #${projectName.replace(/\s/g, "")} #NewHome #FlatForSale`;
  }

  if (platform === "instagram") {
    return `Your dream home awaits ✨

${projectName} | ${flatType}
📍 ${loc}

Premium residences. Thoughtfully designed.
Price on request — DM or call to know more.

📲 ${brokerPhone} — ${brokerName}

#${loc.replace(/\s/g, "")}RealEstate #${projectName.replace(/\s/g, "")} #LuxuryHomes #NewLaunch #HomeForSale #PropertyIndia`;
  }

  // whatsapp
  return `Hi! I wanted to share an exciting property with you.

🏢 *${projectName}*
📍 ${loc}
🛏️ ${flatType}
💰 Price on Request

This is a great opportunity — limited units available.

Call/WhatsApp me for more details and to schedule a site visit:
📞 *${brokerName} — ${brokerPhone}*`;
}

export async function POST(req: NextRequest) {
  const rl = limits.heavy(req);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { projectName, flatType, location, brokerName, brokerPhone, platform } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Use AI if key is available
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });

      const platformInstructions: Record<string, string> = {
        facebook: "Write for Facebook — 3-4 lines, bullet points for key features, clear CTA. Use 2-3 emojis max. End with relevant hashtags.",
        instagram: "Write for Instagram — punchy 2-3 lines, aspirational tone, 5-6 hashtags at end. Use emojis naturally.",
        whatsapp: "Write for WhatsApp — conversational, warm, like a friend sharing a deal. Use *bold* for key info. 3-4 short lines, no hashtags.",
      };

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You write high-converting real estate ad captions for Indian brokers.
Rules:
- NEVER mention actual price. Always say "Price on Request" or "Contact for pricing"
- Always include broker WhatsApp number as CTA
- Tone: premium, aspirational, approachable
- Location context: India
- ${platformInstructions[platform] ?? platformInstructions.facebook}`,
        messages: [{
          role: "user",
          content: `Write an ad caption for:
Project: ${projectName}
Config: ${flatType}
Location: ${location}
Broker: ${brokerName} — WhatsApp: ${brokerPhone}
Platform: ${platform}`,
        }],
      });

      const caption = (message.content[0] as { type: string; text: string }).text ?? "";
      return NextResponse.json({ caption, source: "ai" });
    } catch (err) {
      console.error("Caption AI error, using template:", err);
    }
  }

  // Fallback to templates
  const caption = templateCaption(platform, projectName, flatType, location, brokerName, brokerPhone);
  return NextResponse.json({ caption, source: "template" });
}
