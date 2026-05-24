import Anthropic from "@anthropic-ai/sdk";
import { getProjectWithData } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("Chat unavailable — API key not configured", { status: 503 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { messages, projectId } = await req.json();

  if (!Array.isArray(messages) || !projectId) {
    return new Response("Bad request", { status: 400 });
  }

  const project = await getProjectWithData(projectId);
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const allFlats = project.towers.flatMap((t) => t.flats);
  const available = allFlats.filter((f) => f.status === "available");
  const bhkCounts: Record<string, number> = {};
  for (const f of available) {
    bhkCounts[f.flat_type] = (bhkCounts[f.flat_type] ?? 0) + 1;
  }
  const bhkSummary = Object.entries(bhkCounts)
    .map(([t, n]) => `${n} × ${t.toUpperCase()}`)
    .join(", ");

  // Pricing is always On Request — never reveal actual prices to buyers
  const priceRange = "On Request — interested buyers are connected with our sales team for a personalised quote";

  const amenityList = project.amenities.map((a) => a.name).join(", ") || "Premium amenities";

  const systemPrompt = `You are a helpful sales assistant for ${project.name}, a residential apartment project by FlatBytes.

Project details:
- Name: ${project.name}
- Location: ${project.location}${project.city ? `, ${project.city}` : ""}
- RERA: ${project.rera_number ?? "Registered project"}
- Price range: ${priceRange}
- Available flats: ${available.length} units — ${bhkSummary || "various configurations"}
- Total towers: ${project.total_towers ?? project.towers.length}
- Total floors: ${project.total_floors ?? "multiple"}
- Possession: ${project.possession_date ? new Date(project.possession_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Contact for details"}
- Amenities: ${amenityList}
${project.description ? `- About: ${project.description}` : ""}

Your role:
- Answer questions about the project naturally and helpfully
- Keep answers concise (2–3 sentences max)
- NEVER reveal specific prices, quotes, or cost figures — pricing is strictly On Request
- When asked about price/cost/EMI/budget, say it is "On Request" and suggest: "I can arrange a callback from our sales team for a personalised quote — would that help?"
- When the buyer shows buying intent (booking, visits, availability), suggest a callback
- Do not make up specs not listed above
- Be warm and professional, like a knowledgeable sales executive`;

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.slice(-8).map((m: any) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });
      stream.on("finalMessage", () => {
        controller.close();
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
