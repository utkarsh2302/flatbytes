// Living Experience Intelligence System
// Derives rich lifestyle analysis from flat facing, floor, and type data.

export type FacingKey =
  | "north" | "north-east" | "east" | "south-east"
  | "south" | "south-west" | "west" | "north-west" | "unknown";

export type VastuRating = "excellent" | "good" | "moderate" | "unfavorable";
export type HeatLevel = "low" | "moderate" | "high";
export type VentQuality = "excellent" | "good" | "moderate" | "limited";
export type PrivacyLevel = "high" | "good" | "moderate" | "limited";
export type SunIntensity = "bright" | "warm" | "golden" | "soft" | "indirect" | "none";
export type TimeSlot = "dawn" | "morning" | "noon" | "evening" | "night";

export interface VastuRoom {
  name: string;
  emoji: string;
  direction: string;
  rating: VastuRating;
  insight: string;
}

export interface SunPhase {
  id: TimeSlot;
  label: string;
  time: string;
  skyTop: string;
  skyBottom: string;
  intensity: SunIntensity;
  sunAngle: number; // degrees from East (0=E, 90=S, 180=W)
  description: string;
  rooms: string[];
  icon: string;
}

export interface LivingScores {
  vastu: number;
  sunlight: number;
  ventilation: number;
  privacy: number;
  comfort: number;
  overall: number;
}

export interface LivingExperienceData {
  facing: FacingKey;
  facingLabel: string;
  facingAngle: number;      // compass degrees: N=0, E=90, S=180, W=270
  svgAngle: number;         // radians for SVG math
  scores: LivingScores;
  topTags: string[];
  vastuSummary: string;
  vastuRooms: VastuRoom[];
  sunPhases: SunPhase[];
  ventilation: {
    quality: VentQuality;
    score: number;
    headline: string;
    description: string;
    crossVentilation: boolean;
    paths: string[];
  };
  privacy: {
    score: number;
    level: PrivacyLevel;
    headline: string;
    insights: string[];
  };
  heat: {
    level: HeatLevel;
    score: number;
    headline: string;
    insights: string[];
    coolRooms: string[];
  };
  balcony: {
    direction: string;
    atmosphere: string;
    dayMood: string;
    eveningMood: string;
    nightMood: string;
    dayGradient: [string, string, string];
    eveningGradient: [string, string, string];
    nightGradient: [string, string, string];
    views: string[];
    highlights: string[];
  };
  environmental: {
    mood: string;
    lifestyle: string;
    insights: string[];
  };
  summary: string;
}

// ── Facing normalizer ──────────────────────────────────────────────────────────

export function normalizeFacing(raw: string | null): FacingKey {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().replace(/[\s_]/g, "-").trim();
  if (s.includes("north-east") || s.includes("northeast") || s === "ne") return "north-east";
  if (s.includes("south-east") || s.includes("southeast") || s === "se") return "south-east";
  if (s.includes("south-west") || s.includes("southwest") || s === "sw") return "south-west";
  if (s.includes("north-west") || s.includes("northwest") || s === "nw") return "north-west";
  if (s === "north" || s === "n") return "north";
  if (s === "east"  || s === "e") return "east";
  if (s === "south" || s === "s") return "south";
  if (s === "west"  || s === "w") return "west";
  return "unknown";
}

// ── Static analysis tables ─────────────────────────────────────────────────────

const SUN_PHASES: SunPhase[] = [
  {
    id: "dawn", label: "Dawn", time: "5:30 AM",
    skyTop: "#1a1040", skyBottom: "#7b3f6e",
    intensity: "soft", sunAngle: -30,
    icon: "🌅",
    description: "Soft pre-dawn light washes the sky in deep violet and rose hues. A meditative calm.",
    rooms: [],
  },
  {
    id: "morning", label: "Morning", time: "9:00 AM",
    skyTop: "#0ea5e9", skyBottom: "#bae6fd",
    intensity: "warm", sunAngle: 0,
    icon: "☀️",
    description: "Golden morning sun energizes the space. Ideal for breakfast and the start of the day.",
    rooms: [],
  },
  {
    id: "noon", label: "Noon", time: "12:30 PM",
    skyTop: "#0369a1", skyBottom: "#7dd3fc",
    intensity: "bright", sunAngle: 90,
    icon: "🌤",
    description: "Peak brightness fills open areas with crisp natural light. High-energy atmosphere.",
    rooms: [],
  },
  {
    id: "evening", label: "Evening", time: "5:30 PM",
    skyTop: "#c2410c", skyBottom: "#fcd34d",
    intensity: "golden", sunAngle: 155,
    icon: "🌇",
    description: "Warm golden hour transforms every surface. Rooms glow with amber and copper tones.",
    rooms: [],
  },
  {
    id: "night", label: "Night", time: "8:30 PM",
    skyTop: "#0f172a", skyBottom: "#1e293b",
    intensity: "none", sunAngle: 270,
    icon: "🌙",
    description: "City lights emerge as the sky deepens. A peaceful transition into the evening hours.",
    rooms: [],
  },
];

interface FacingAnalysis {
  facingLabel: string;
  facingAngle: number;
  vastuScore: number;
  vastuSummary: string;
  vastuRooms: Omit<VastuRoom, never>[];
  sunlightScore: number;
  ventilation: Omit<LivingExperienceData["ventilation"], never>;
  heat: Omit<LivingExperienceData["heat"], never>;
  balcony: Omit<LivingExperienceData["balcony"], never>;
  environmental: Omit<LivingExperienceData["environmental"], never>;
  sunPhaseRoomMap: Record<TimeSlot, string[]>;
  topTags: string[];
  summary: string;
}

const FACING_ANALYSES: Record<FacingKey, FacingAnalysis> = {

  "north-east": {
    facingLabel: "North-East", facingAngle: 45,
    vastuScore: 96, sunlightScore: 82,
    vastuSummary: "North-East is considered the most auspicious direction in Vastu Shastra — the Ishanya corner. This orientation welcomes divine positive energy, morning sunlight, and harmonious living for all family members.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "North-East", rating: "excellent", insight: "The most auspicious entrance in Vastu Shastra. Invites wealth, health, and divine blessings into the home." },
      { name: "Living Room", emoji: "🛋", direction: "North-East / North", rating: "excellent", insight: "North-East living space maximises positive energy flow, making it ideal for family gatherings and social harmony." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "South-East is the Agni (fire) zone — perfect kitchen placement for nourishment, good digestion, and health." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West brings stability, deep restful sleep, and strengthens family bonds — the ideal master bedroom quadrant." },
      { name: "Children's Room", emoji: "👦", direction: "West / North-West", rating: "good", insight: "West and North-West support concentration, creativity, and healthy development for children." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "North-East is the spiritual energy vortex. A pooja room here amplifies prayer, peace, and positive vibrations." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "good", insight: "North-West placement for utilities aligns with Vastu water-element guidelines for cleanliness and flow." },
      { name: "Balcony", emoji: "🌿", direction: "North-East", rating: "excellent", insight: "Balcony opens to the most auspicious direction, receiving fresh morning light and cool northern breeze." },
      { name: "Dining Area", emoji: "🍽", direction: "East / South-East", rating: "excellent", insight: "East-facing dining receives morning sun — associated with vitality, togetherness, and nourishment." },
    ],
    ventilation: {
      quality: "excellent", score: 92,
      headline: "Exceptional Cross-Ventilation",
      description: "North-East orientation captures the dominant north-eastern breeze prevalent across India, ensuring continuous natural airflow throughout the flat. Rooms stay naturally cool for most of the year.",
      crossVentilation: true,
      paths: ["North-East breeze flows through living areas", "Natural cooling through NE-facing windows", "Minimal heat build-up year-round"],
    },
    heat: {
      level: "low", score: 85,
      headline: "Minimal Heat Exposure",
      insights: [
        "No direct western afternoon sun — rooms stay comfortably cool",
        "Morning sun is gentle and energising, not harsh",
        "North-East breeze provides natural cooling",
        "Evening heat from west side is minimal in this orientation",
      ],
      coolRooms: ["Living Room", "Master Bedroom", "Balcony"],
    },
    balcony: {
      direction: "North-East",
      atmosphere: "Fresh, airy, and spiritually uplifting",
      dayMood: "Soft golden morning light floods the balcony. The gentle NE breeze feels like nature's air conditioning. Views extend toward the open horizon.",
      eveningMood: "As the sun traces west, the balcony settles into a cool, peaceful glow. The indirect warm light creates a calming evening ambience.",
      nightMood: "Cool night air flows freely across the balcony. Distant city lights and a clear sky make this an exceptional space for stargazing.",
      dayGradient: ["#7dd3fc", "#bae6fd", "#f0f9ff"],
      eveningGradient: ["#fed7aa", "#fde68a", "#fef3c7"],
      nightGradient: ["#0f172a", "#1e3a5f", "#0f2027"],
      views: ["Open sky panorama", "Morning sunrise directly visible", "Potential green/garden views", "Minimal traffic noise"],
      highlights: ["Best sunrise views", "All-day cool breeze", "Spiritual energy corner", "Natural air conditioning"],
    },
    environmental: {
      mood: "Serene, energised, and deeply positive",
      lifestyle: "This flat is ideal for families seeking a spiritually aligned, health-conscious living environment. The NE orientation is historically associated with prosperity and well-being.",
      insights: [
        "Morning sun activates the space with natural energy",
        "Cooler microclimate compared to south or west-facing units",
        "Lower energy bills due to natural ventilation and cooling",
        "Premium position within any tower — often commands a higher value",
      ],
    },
    sunPhaseRoomMap: {
      dawn: ["Balcony", "Living Room"],
      morning: ["Master Bedroom", "Living Room", "Balcony", "Kitchen"],
      noon: ["Living Room", "Dining Area"],
      evening: ["Corridor areas (indirect light)"],
      night: [],
    },
    topTags: ["Best Vastu Direction", "Excellent Ventilation", "Sunrise Views", "Low Heat Exposure", "Cool Microclimate"],
    summary: "A rare North-East facing flat offering the highest Vastu compliance, energising morning sunlight, exceptional natural ventilation, and a cool living environment year-round. This is the most sought-after orientation in Indian real estate for both spiritual and practical reasons.",
  },

  "east": {
    facingLabel: "East", facingAngle: 90,
    vastuScore: 88, sunlightScore: 90,
    vastuSummary: "East-facing homes receive the gift of sunrise energy directly. According to Vastu, East is associated with Indra (the lord of rain and prosperity) and brings health, positivity, and new beginnings. This is the second most auspicious facing direction.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "East", rating: "excellent", insight: "East entrance welcomes the energy of the rising sun — symbolising health, new beginnings, and positive outlook." },
      { name: "Living Room", emoji: "🛋", direction: "East / North-East", rating: "excellent", insight: "Eastern exposure fills the living space with brilliant morning light, creating a naturally bright, cheerful ambience." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "South-East aligns with the Agni principle — food prepared here benefits from the fire energy of this zone." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "The opposite corner from the entrance ensures stability, privacy, and deep, undisturbed sleep." },
      { name: "Children's Room", emoji: "👦", direction: "West / North-West", rating: "good", insight: "West-facing children's rooms provide afternoon study light and a calming, focused atmosphere." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "The corner of highest spiritual energy — pooja room here is exceptionally auspicious." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "good", insight: "North-West is the Vayu (wind) zone — good placement for ventilation in wet areas." },
      { name: "Balcony", emoji: "🌿", direction: "East", rating: "excellent", insight: "The sunrise greets you from this balcony every morning. A deeply energising start to every day." },
      { name: "Dining Area", emoji: "🍽", direction: "East / North", rating: "excellent", insight: "East-facing dining receives the most auspicious morning energy — meals eaten in morning light are associated with health and vitality." },
    ],
    ventilation: {
      quality: "good", score: 80,
      headline: "Good Natural Airflow",
      description: "East-facing flats benefit from morning breezes and the natural thermal draft created by solar heating of the eastern facade. Cross-ventilation is effective, especially in the first half of the day.",
      crossVentilation: true,
      paths: ["Morning east breeze enters through main facade", "Thermal draft carries air through living areas", "Windows on opposite side create effective cross-flow"],
    },
    heat: {
      level: "moderate", score: 70,
      headline: "Comfortable Heat Profile",
      insights: [
        "Morning sun (6AM–11AM) is gentle and energising",
        "Afternoon heat from west face is minimal",
        "Summer mornings can be warm but manageable",
        "East-facing rooms are comfortably lit without overheating",
      ],
      coolRooms: ["Living Room (after 11AM)", "Master Bedroom", "Balcony (afternoon onwards)"],
    },
    balcony: {
      direction: "East",
      atmosphere: "Vibrant, energising, sunrise-blessed",
      dayMood: "The morning sun pours directly into the balcony, bathing everything in warm golden light. A cup of tea here as the sun rises is a daily ritual worth living for.",
      eveningMood: "The balcony faces away from the setting sun, creating a cool, shaded retreat in the evenings. Perfect for relaxing after a long day.",
      nightMood: "The eastern night sky offers clear views with minimal light pollution from the setting sun. City lights to the west create a beautiful distant glow.",
      dayGradient: ["#f59e0b", "#fcd34d", "#fef9c3"],
      eveningGradient: ["#6b7280", "#9ca3af", "#e5e7eb"],
      nightGradient: ["#020617", "#0f172a", "#1e293b"],
      views: ["Direct sunrise view", "Morning sky panorama", "Energising morning exposure"],
      highlights: ["Perfect sunrise views", "Brilliant morning light", "Cool afternoon balcony", "High solar energy"],
    },
    environmental: {
      mood: "Bright, energising, health-positive",
      lifestyle: "East-facing homes are ideal for early risers, health-conscious families, and those who appreciate the natural rhythm of sunlight. The apartment fills with energy at dawn.",
      insights: [
        "Morning sunlight is rich in Vitamin D — natural health benefit",
        "Bright natural light reduces need for artificial lighting in mornings",
        "East face stays cooler in afternoon compared to west",
        "Sunrise views significantly enhance the living experience",
      ],
    },
    sunPhaseRoomMap: {
      dawn: ["Balcony"],
      morning: ["Balcony", "Living Room", "Dining Area", "Master Bedroom"],
      noon: ["Living Room (diminishing)", "Kitchen"],
      evening: ["Interior rooms only"],
      night: [],
    },
    topTags: ["Sunrise Facing", "Excellent Vastu", "Morning Sunlight", "Cool Afternoons", "Vitamin D Rich"],
    summary: "An east-facing flat that greets every morning with brilliant sunrise light, strong Vastu compliance, and comfortable temperatures throughout the day. The morning energy and natural brightness make this an exceptionally liveable orientation.",
  },

  "north": {
    facingLabel: "North", facingAngle: 0,
    vastuScore: 83, sunlightScore: 65,
    vastuSummary: "North-facing homes are highly regarded in Vastu Shastra, associated with Kubera — the deity of wealth and prosperity. This orientation provides diffused, consistent natural light year-round and excellent cross-ventilation without harsh direct sun.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "North", rating: "good", insight: "North entrance is considered very auspicious, associated with prosperity, financial stability, and career growth." },
      { name: "Living Room", emoji: "🛋", direction: "North / North-East", rating: "excellent", insight: "North living room benefits from Kubera's energy — associated with wealth accumulation and positive social connections." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "South-East kitchen placement is ideal regardless of flat facing — the Agni zone ensures good nourishment." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West master bedroom provides the most stable and grounded sleeping energy in Vastu." },
      { name: "Children's Room", emoji: "👦", direction: "West", rating: "good", insight: "West placement supports discipline and academic focus." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "North-East corner pooja room receives the most sacred cosmic energy of the flat." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "excellent", insight: "North-West is the Vayu zone — optimal for bathrooms, ensuring ventilation and cleanliness." },
      { name: "Balcony", emoji: "🌿", direction: "North", rating: "good", insight: "North-facing balcony receives soft, consistent daylight without direct harsh sunlight." },
      { name: "Dining Area", emoji: "🍽", direction: "North / East", rating: "good", insight: "North-facing dining area is well-lit and connects to the prosperity zone of the flat." },
    ],
    ventilation: {
      quality: "excellent", score: 90,
      headline: "Outstanding Year-Round Ventilation",
      description: "North-facing flats experience the prevailing north-easterly winds dominant across peninsular India, especially during summer. The northern exposure also prevents overheating, making natural cooling extremely effective.",
      crossVentilation: true,
      paths: ["North wind enters through main facade all year", "Thermal convection keeps air moving through rooms", "Excellent night ventilation during summer months"],
    },
    heat: {
      level: "low", score: 90,
      headline: "Coolest Living Environment",
      insights: [
        "No direct sun on north face — consistently cool rooms",
        "Lowest summer temperature exposure of all orientations",
        "Natural air conditioning through north breeze",
        "Significantly lower AC usage and electricity bills",
      ],
      coolRooms: ["Living Room", "Master Bedroom", "All North-facing rooms"],
    },
    balcony: {
      direction: "North",
      atmosphere: "Cool, calm, consistently pleasant",
      dayMood: "Diffused sky light creates an even, glare-free ambience on the balcony. No harsh shadows — just consistent, soft, natural brightness throughout the day.",
      eveningMood: "The northern balcony stays comfortably cool as the sun sets to the west. A refreshing evening retreat with cool breeze flowing consistently.",
      nightMood: "Cool night air and consistent breeze make this balcony perfect for evening gatherings. The north sky often offers clear star views away from sunset glare.",
      dayGradient: ["#0284c7", "#38bdf8", "#e0f2fe"],
      eveningGradient: ["#0369a1", "#0ea5e9", "#bae6fd"],
      nightGradient: ["#0c1445", "#162032", "#1a2744"],
      views: ["Consistent sky views", "No glare throughout the day", "Cool breeze always"],
      highlights: ["Coolest orientation", "No harsh sunlight", "Premium ventilation", "Consistent comfort"],
    },
    environmental: {
      mood: "Serene, cool, consistently comfortable",
      lifestyle: "North-facing homes suit those who value consistent comfort, lower energy consumption, and a calm, understated ambience. Particularly favoured for bedroom quality and year-round coolness.",
      insights: [
        "Lowest air conditioning requirements of all orientations",
        "Diffused light is ideal for work-from-home spaces",
        "Children's rooms benefit from cool, calm environment",
        "North face is associated with good sleep quality",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [],
      morning: ["Corridor / indirect light"],
      noon: [],
      evening: [],
      night: [],
    },
    topTags: ["Kubera's Direction", "Coolest Flat", "Excellent Ventilation", "Low AC Bills", "All-Day Comfort"],
    summary: "A north-facing flat associated with prosperity and calm, offering the coolest natural temperatures, outstanding ventilation, and soft consistent light throughout the day. An exceptional choice for families valuing comfort, low energy costs, and restful living.",
  },

  "south": {
    facingLabel: "South", facingAngle: 180,
    vastuScore: 65, sunlightScore: 88,
    vastuSummary: "South-facing homes are often misunderstood in Vastu. While they require specific design attention, a well-planned south-facing flat can be highly liveable. The key is ensuring the entrance energy is balanced with proper room placement and remedies.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "South", rating: "moderate", insight: "South entrance requires Vastu remedies. Placing a Swastika or specific threshold design can harmonise the energy. Not inherently unfavorable." },
      { name: "Living Room", emoji: "🛋", direction: "South / South-East", rating: "moderate", insight: "South-facing living room receives strong afternoon sun. Curtains and ventilation management are key for comfort." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "South-East kitchen remains ideal regardless of flat orientation — the Agni zone nourishes the household." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West master bedroom is perfectly positioned for stability, deep sleep, and family harmony." },
      { name: "Children's Room", emoji: "👦", direction: "North-West", rating: "good", insight: "North-West children's room provides good study light and a calming atmosphere." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "good", insight: "Even in south-facing homes, the NE corner remains spiritually potent for worship." },
      { name: "Bathroom", emoji: "🚿", direction: "West / North-West", rating: "good", insight: "West-facing utilities align with acceptable Vastu placement guidelines." },
      { name: "Balcony", emoji: "🌿", direction: "South", rating: "moderate", insight: "South balcony receives bright sun year-round. Excellent for winter but may be warm in summer afternoons." },
      { name: "Dining Area", emoji: "🍽", direction: "South / East", rating: "moderate", insight: "South-facing dining receives good natural light; ventilation management recommended for summer." },
    ],
    ventilation: {
      quality: "moderate", score: 62,
      headline: "Good Year-Round Sunlight",
      description: "South-facing flats receive consistent sun throughout the year, which provides excellent natural brightness. Summer ventilation requires attention, as south face can heat up. Good window management ensures comfortable airflow.",
      crossVentilation: false,
      paths: ["South breeze enters primarily during monsoon", "Window management critical for summer ventilation", "North-side windows create cross-flow opportunities"],
    },
    heat: {
      level: "moderate", score: 58,
      headline: "Warm in Summer, Excellent in Winter",
      insights: [
        "Winter sunlight makes this the warmest, most inviting orientation",
        "Summer afternoons can be warm — shading solutions recommended",
        "South sun is consistent and bright year-round",
        "Morning side remains cooler; afternoon management needed",
      ],
      coolRooms: ["Master Bedroom (SW corner)", "North-facing secondary rooms"],
    },
    balcony: {
      direction: "South",
      atmosphere: "Bright, sunny, warm and inviting",
      dayMood: "Year-round sun makes this balcony a sunlit haven. Winter mornings here are exceptional — warm, bright, and deeply comfortable. A morning coffee spot that never disappoints.",
      eveningMood: "The golden afternoon light gives way to a warm amber glow. The south-facing balcony catches the last warmth of the day.",
      nightMood: "After sunset, the balcony cools quickly and offers a pleasant evening retreat with city lights visible in the distance.",
      dayGradient: ["#0369a1", "#0ea5e9", "#ffe4b5"],
      eveningGradient: ["#dc2626", "#f59e0b", "#fde68a"],
      nightGradient: ["#111827", "#1f2937", "#374151"],
      views: ["Year-round sunny panorama", "Warm winter views", "Open sky"],
      highlights: ["Year-round sunshine", "Warm winters", "Bright natural light", "Good for plants"],
    },
    environmental: {
      mood: "Bright, warm, sunny disposition",
      lifestyle: "South-facing homes suit those who love natural light, warmth, and well-lit interiors. Exceptional in winter. With good shading and ventilation, summer is entirely manageable.",
      insights: [
        "Best orientation for plants, indoor gardens, and greenery",
        "Winter living is exceptionally comfortable and sunny",
        "High natural light reduces electricity for lighting",
        "Well-designed south homes are among the brightest and most cheerful",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [],
      morning: ["Living Room (indirect)", "Kitchen"],
      noon: ["Living Room", "Balcony", "Dining Area"],
      evening: ["Balcony", "Living Room", "Kitchen"],
      night: [],
    },
    topTags: ["Bright Year-Round", "Winter Sunshine", "Good Natural Light", "Warm Atmosphere", "SW Master Bedroom"],
    summary: "A south-facing flat offering exceptional year-round brightness, warm winter comfort, and strong natural light throughout interiors. With thoughtful design, this orientation becomes one of the most liveable — particularly favored for its cheerful, sunlit character.",
  },

  "west": {
    facingLabel: "West", facingAngle: 270,
    vastuScore: 68, sunlightScore: 72,
    vastuSummary: "West-facing homes are common across India and are considered acceptable in Vastu with proper room design. The key distinction is ensuring the entrance lobby is well-planned and the master bedroom occupies the South-West corner for optimal stability.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "West", rating: "moderate", insight: "West entrance is associated with the setting sun's energy. A well-lit, welcoming entrance design can counterbalance this Vastu consideration." },
      { name: "Living Room", emoji: "🛋", direction: "West / North-West", rating: "moderate", insight: "West-facing living room receives beautiful evening light. Afternoon heat management with good curtains ensures comfort." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "Regardless of flat orientation, SE kitchen placement remains ideal for Vastu compliance." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West master bedroom is in the ideal Vastu zone for stability and restful sleep." },
      { name: "Children's Room", emoji: "👦", direction: "North-East", rating: "excellent", insight: "North-East children's room is exceptionally placed — associated with growth, learning, and positive energy." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "NE pooja room enhances spiritual practice and brings positive energy to the entire flat." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "excellent", insight: "North-West bathrooms benefit from natural ventilation and align well with Vastu." },
      { name: "Balcony", emoji: "🌿", direction: "West", rating: "good", insight: "West balcony offers spectacular sunset views. The ideal spot to unwind at the end of the day." },
      { name: "Dining Area", emoji: "🍽", direction: "West / North", rating: "moderate", insight: "West dining receives beautiful evening light, making dinner time especially atmospheric." },
    ],
    ventilation: {
      quality: "moderate", score: 62,
      headline: "Pleasant Evening Breezes",
      description: "West-facing flats receive afternoon sea breeze in coastal cities and evening winds in most regions. The main consideration is managing afternoon heat build-up, which can be addressed with proper shading and ventilation.",
      crossVentilation: false,
      paths: ["Evening western breeze enters at sunset", "East-side windows provide morning ventilation", "Cross-ventilation requires east/west window pairing"],
    },
    heat: {
      level: "high", score: 40,
      headline: "Afternoon Heat — Manage Thoughtfully",
      insights: [
        "West face receives peak afternoon sun from 1PM–5PM",
        "Summer heat buildup is significant — good insulation helps",
        "East-facing rooms stay cool in the afternoon",
        "Quality curtains/blinds dramatically improve comfort",
        "Evening wind brings relief after 5PM",
      ],
      coolRooms: ["Master Bedroom (SW — morning side)", "Kitchen (SE)", "North-East rooms"],
    },
    balcony: {
      direction: "West",
      atmosphere: "Dramatic, romantic, sunset-blessed",
      dayMood: "Morning is cool and shaded from this balcony. As the day progresses, anticipation builds for the main event.",
      eveningMood: "The sunset from a west-facing balcony is a daily masterpiece. Vivid oranges, pinks, and purples paint the sky. This is the crown jewel of west-facing living.",
      nightMood: "Post-sunset, the western sky holds a deep blue afterglow. City lights emerge gradually, creating a stunning urban panorama for evening relaxation.",
      dayGradient: ["#64748b", "#94a3b8", "#e2e8f0"],
      eveningGradient: ["#7c2d12", "#ea580c", "#fbbf24"],
      nightGradient: ["#0f0c29", "#24243e", "#302b63"],
      views: ["World-class sunset views", "City skyline at dusk", "Golden hour panorama", "Evening city lights"],
      highlights: ["Spectacular sunsets", "Romantic evenings", "Premium city views", "Dramatic sky views"],
    },
    environmental: {
      mood: "Dynamic, dramatic, evening-oriented",
      lifestyle: "West-facing homes are perfect for evening people — those who appreciate dramatic sunsets, city lights at night, and a vibrant late-afternoon ambience. Excellent for entertainment and socialising.",
      insights: [
        "Sunset views from west flats are among the most spectacular in any building",
        "Evening social life is enhanced by the golden hour atmosphere",
        "Invest in good window treatments — the afternoon sun management pays off",
        "Night views from upper floor west-facing balconies are exceptional",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [],
      morning: ["East-side rooms (indirect)"],
      noon: ["Western rooms building up"],
      evening: ["Balcony", "Living Room", "Dining Area"],
      night: [],
    },
    topTags: ["Sunset Facing", "Spectacular Views", "Evening Ambience", "City Light Views", "SW Master Bedroom"],
    summary: "A west-facing flat renowned for spectacular sunset views and dramatic evening ambience. The balcony transforms into a daily theatre of colour at dusk. With proper heat management, this orientation offers a uniquely vibrant and visually rich living experience.",
  },

  "south-east": {
    facingLabel: "South-East", facingAngle: 135,
    vastuScore: 70, sunlightScore: 84,
    vastuSummary: "South-East facing homes sit in the Agni (fire) zone of Vastu, making them particularly well-suited for kitchens and dining. The orientation brings good morning sunlight through the south-east exposure, combined with reasonable Vastu compliance through careful room planning.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "South-East", rating: "moderate", insight: "South-East entrance is in the fire zone — active, energising, but requires Vastu attention. A well-designed, bright entrance mitigates concerns." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "South-East kitchen is literally in the Agni zone — this is the best possible Vastu placement for cooking and nourishment." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West master bedroom remains in the ideal stability zone." },
      { name: "Living Room", emoji: "🛋", direction: "South-East / East", rating: "good", insight: "Receives excellent morning and midday sun — naturally bright and energising." },
      { name: "Children's Room", emoji: "👦", direction: "North-West", rating: "good", insight: "North-West provides a calming, focused environment for children's study and sleep." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "North-East pooja room harnesses the highest spiritual energy, irrespective of flat orientation." },
      { name: "Bathroom", emoji: "🚿", direction: "West / North", rating: "good", insight: "West or North bathrooms are acceptable in Vastu with good ventilation." },
      { name: "Balcony", emoji: "🌿", direction: "South-East", rating: "good", insight: "Morning sun enters from this balcony early, providing energising, warm morning light." },
      { name: "Dining Area", emoji: "🍽", direction: "South-East", rating: "excellent", insight: "South-East dining aligns with the fire element — associated with good appetite and family nourishment." },
    ],
    ventilation: {
      quality: "good", score: 74,
      headline: "Good Morning Airflow",
      description: "South-East orientation captures morning breeze and benefits from sea/lake breezes in coastal areas. Afternoon ventilation is moderate and requires good window management.",
      crossVentilation: true,
      paths: ["Morning SE breeze enters main facade", "North-facing windows create east-west airflow", "Thermal draft from sun-heated SE face aids circulation"],
    },
    heat: {
      level: "moderate", score: 65,
      headline: "Warm Mornings, Manageable Afternoons",
      insights: [
        "Morning heat from SE face is warm but manageable",
        "Afternoon sun on SE is less intense than west face",
        "Good shading on SE windows controls heat effectively",
        "Kitchen in SE zone is designed for warmth — manageable",
      ],
      coolRooms: ["Master Bedroom", "North-West rooms"],
    },
    balcony: {
      direction: "South-East",
      atmosphere: "Warm, sun-drenched, morning-blessed",
      dayMood: "Morning sun hits this balcony early, making it a warm, inviting space for early risers. The golden light and warm atmosphere make breakfast here a genuine pleasure.",
      eveningMood: "As the sun moves west, the balcony settles into comfortable shade. A pleasant transition from the warm day to a cool evening.",
      nightMood: "Facing away from the city centre (typically west in Indian cities), this balcony offers a quieter, darker sky with good night visibility.",
      dayGradient: ["#d97706", "#f59e0b", "#fef3c7"],
      eveningGradient: ["#78716c", "#a8a29e", "#e7e5e4"],
      nightGradient: ["#0c0a09", "#1c1917", "#292524"],
      views: ["Morning sunrise (early exposure)", "South-East skyline", "Good city views"],
      highlights: ["Best kitchen Vastu", "Morning sunlight", "Warm atmosphere", "Good natural light"],
    },
    environmental: {
      mood: "Warm, active, nourishing",
      lifestyle: "SE-facing homes suit those who enjoy warm, sun-filled mornings and appreciate a kitchen-centric lifestyle. The Agni energy makes this orientation particularly suited to families with a love of cooking and morning activity.",
      insights: [
        "Kitchen is in the most Vastu-favorable position possible",
        "Morning light activates the living space with warm energy",
        "Good for households that value morning routines",
        "Afternoon heat is manageable with standard shading",
      ],
    },
    sunPhaseRoomMap: {
      dawn: ["Balcony", "Kitchen"],
      morning: ["Balcony", "Living Room", "Kitchen", "Dining Area"],
      noon: ["Living Room", "Dining Area"],
      evening: ["Interior rooms (indirect)"],
      night: [],
    },
    topTags: ["Excellent Kitchen Vastu", "Morning Sunlight", "Warm Atmosphere", "Active Morning Energy", "Good Ventilation"],
    summary: "A south-east facing flat with exceptional kitchen Vastu placement, warm morning sunlight, and good natural brightness. Particularly suited to households that value morning activity, cooking, and a warm, nourishing home environment.",
  },

  "south-west": {
    facingLabel: "South-West", facingAngle: 225,
    vastuScore: 58, sunlightScore: 75,
    vastuSummary: "South-West facing homes require the most careful Vastu planning. This direction is associated with Nirrti (the deity of dissolution) and is generally considered the most challenging orientation. However, a well-designed south-west flat with proper remedies and room placement can be made highly comfortable.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "South-West", rating: "unfavorable", insight: "South-West entrance is the most challenging in Vastu. Specific remedies — heavy door, elevated threshold, Navagraha yantra — are strongly recommended." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "Despite the challenging orientation, the kitchen in SE remains in the best Vastu position." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "Master bedroom in South-West is actually ideal — the heavy Earth energy promotes stability and deep sleep." },
      { name: "Living Room", emoji: "🛋", direction: "South-West", rating: "moderate", insight: "South-West living room requires active Vastu management. Light colours, good ventilation, and mirrors in specific positions help." },
      { name: "Children's Room", emoji: "👦", direction: "North-East", rating: "excellent", insight: "Placing children in the NE corner of a SW flat creates a powerful positive counterbalance." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "NE pooja room is particularly important in a SW flat — creates essential spiritual counterbalance." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "good", insight: "North-West bathroom placement is acceptable and supports ventilation." },
      { name: "Balcony", emoji: "🌿", direction: "South-West", rating: "moderate", insight: "Afternoon sun creates warm, dramatic balcony moments. Heat management needed for summer afternoons." },
      { name: "Dining Area", emoji: "🍽", direction: "East / North", rating: "good", insight: "Positioning dining in a lighter, more auspicious zone helps counterbalance SW concerns." },
    ],
    ventilation: {
      quality: "limited", score: 52,
      headline: "Heat Management is Key",
      description: "South-West orientation combines afternoon western sun with southern heat exposure. Ventilation during afternoons can be challenging. Good cross-ventilation from NE-facing secondary rooms significantly improves comfort.",
      crossVentilation: false,
      paths: ["Evening SW breeze provides relief after 5PM", "NE corner secondary rooms offer cooling escape", "Good insulation dramatically improves summer comfort"],
    },
    heat: {
      level: "high", score: 35,
      headline: "High Afternoon Heat Exposure",
      insights: [
        "South-West receives both southern midday and western afternoon sun",
        "Peak heat 12PM–5PM requires active management",
        "Good double-glazed windows or reflective glass dramatically helps",
        "Evening comfort improves significantly after 5:30PM",
        "NE corner rooms are natural cool retreats",
      ],
      coolRooms: ["North-East corner rooms", "Kitchen (SE — shaded from SW)", "Upper floor benefits from breeze"],
    },
    balcony: {
      direction: "South-West",
      atmosphere: "Dramatic, sun-soaked, intense",
      dayMood: "The south-west balcony is alive with afternoon sun. Intense, dramatic, and warm — this is not a space for lounging on summer afternoons without shade.",
      eveningMood: "The golden-hour views from this balcony are genuinely spectacular. As the heat subsides, the evening sky transforms into one of nature's greatest shows.",
      nightMood: "Post-sunset, the SW balcony cools and the western city skyline illuminates beautifully. The evening ambience makes up for the afternoon heat.",
      dayGradient: ["#b45309", "#d97706", "#fde68a"],
      eveningGradient: ["#7f1d1d", "#c2410c", "#fb923c"],
      nightGradient: ["#0f0c29", "#24243e", "#302b63"],
      views: ["Sunset panorama (excellent)", "City lights (evening)", "Open sky to the south-west"],
      highlights: ["Spectacular sunsets", "Dramatic light effects", "Evening city views", "Unique atmosphere"],
    },
    environmental: {
      mood: "Intense, dramatic, requiring management",
      lifestyle: "South-West homes suit those who are mindful buyers aware of Vastu and willing to invest in good window treatments, insulation, and interior design. The evening and night experience can be genuinely spectacular.",
      insights: [
        "Invest in premium window treatments — it changes the summer experience",
        "Vastu remedies (heavy door, threshold, NE pooja) are strongly recommended",
        "Evening social life on the balcony is exceptional after heat subsides",
        "AC usage will be higher — factor into long-term costs",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [],
      morning: ["Secondary rooms (indirect)"],
      noon: ["Living Room", "Balcony (intense)"],
      evening: ["Balcony", "Living Room", "Dining Area"],
      night: [],
    },
    topTags: ["Sunset Views", "Needs Vastu Attention", "High Heat Zone", "Good SW Master Bed", "Premium Evening Views"],
    summary: "A south-west facing flat requiring Vastu awareness and heat management, but offering spectacular evening views and sunset experiences. With proper design choices and Vastu remedies, this orientation can be transformed into a premium living experience.",
  },

  "north-west": {
    facingLabel: "North-West", facingAngle: 315,
    vastuScore: 72, sunlightScore: 70,
    vastuSummary: "North-West facing homes sit in the Vayu (wind) zone of Vastu. This orientation brings consistent breezes, moderate sunlight, and good air circulation. While not the most auspicious entry direction, the NW position supports mobility, career growth, and social connections.",
    vastuRooms: [
      { name: "Main Entrance", emoji: "🚪", direction: "North-West", rating: "moderate", insight: "North-West entrance is associated with movement and social connections. Good for professionals with active lifestyles. Vayu energy supports career mobility." },
      { name: "Kitchen", emoji: "🍳", direction: "South-East", rating: "excellent", insight: "SE kitchen is ideal regardless of orientation — Agni zone ensures proper nourishment energy." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West", rating: "excellent", insight: "South-West master bedroom provides the stability and groundedness needed after an active NW lifestyle." },
      { name: "Living Room", emoji: "🛋", direction: "North-West / North", rating: "good", insight: "North-West living area benefits from good breeze and indirect natural light." },
      { name: "Children's Room", emoji: "👦", direction: "East / North-East", rating: "excellent", insight: "East/NE children's room is exceptionally placed for morning energy and academic focus." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East", rating: "excellent", insight: "NE corner pooja room counterbalances the NW entrance energy with spiritual stability." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West", rating: "excellent", insight: "Bathrooms naturally align with the Vayu zone — excellent ventilation and cleanliness are inherent." },
      { name: "Balcony", emoji: "🌿", direction: "North-West", rating: "good", insight: "NW balcony experiences consistent cool breeze and pleasant evening light." },
      { name: "Dining Area", emoji: "🍽", direction: "North / East", rating: "good", insight: "North and East dining placement provides good energy and natural morning light." },
    ],
    ventilation: {
      quality: "excellent", score: 88,
      headline: "Exceptional Breeze — Vayu Zone",
      description: "North-West is the Vayu (wind) zone in Vastu — this flat naturally experiences the best consistent breezes throughout the day and night. Natural ventilation here is outstanding, making it one of the airier orientations.",
      crossVentilation: true,
      paths: ["Consistent NW breeze flows through main living areas", "Evening western breeze enhances cooling", "Cross-ventilation through SE-facing secondary windows"],
    },
    heat: {
      level: "moderate", score: 65,
      headline: "Evening Heat, Cool Nights",
      insights: [
        "Western sun creates afternoon warmth from 2PM–5PM",
        "North component keeps rooms cooler than pure west facing",
        "NW breeze provides natural cooling relief in evenings",
        "Nights are notably cooler and well-ventilated",
      ],
      coolRooms: ["Master Bedroom (SW)", "Kitchen (SE)", "NE children's room"],
    },
    balcony: {
      direction: "North-West",
      atmosphere: "Breezy, dynamic, evening-friendly",
      dayMood: "The balcony enjoys diffused morning light and stays comfortable well into the afternoon. The consistent north-west breeze makes outdoor sitting pleasant for most of the day.",
      eveningMood: "Evening light washes the balcony in warm tones as the sun approaches the west. The breeze picks up, creating ideal conditions for evening relaxation.",
      nightMood: "Cool night air flows consistently across this balcony. The NW sky offers a blend of city lights and cooler ambient temperatures for comfortable night-time relaxation.",
      dayGradient: ["#0369a1", "#0ea5e9", "#bae6fd"],
      eveningGradient: ["#ea580c", "#f97316", "#fde68a"],
      nightGradient: ["#0f172a", "#1e293b", "#1f2a3d"],
      views: ["Evening sky views", "Sunset (partial)", "Cool breezy panorama"],
      highlights: ["Best natural breeze", "Cool living", "Vayu energy", "Evening comfort"],
    },
    environmental: {
      mood: "Active, breezy, comfortable",
      lifestyle: "North-West homes suit active professionals, frequent travellers, and those who value natural ventilation. The Vayu energy supports career growth, social life, and an outward-oriented lifestyle.",
      insights: [
        "Best natural ventilation of the evening-facing orientations",
        "Vayu zone is associated with career mobility and opportunities",
        "NE children's room counterbalances any NW entry concerns",
        "Lower heat buildup than pure west or south-west facing",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [],
      morning: ["Secondary east-facing rooms"],
      noon: [],
      evening: ["Balcony", "Living Room"],
      night: [],
    },
    topTags: ["Vayu Zone", "Best Breeze", "Excellent Ventilation", "Evening Friendly", "Career Energy"],
    summary: "A north-west facing flat in the Vayu zone, offering exceptional natural ventilation, consistent cool breezes, and pleasant evening light. Well-suited for active professionals who value airflow, mobility, and a dynamic living environment.",
  },

  "unknown": {
    facingLabel: "Various", facingAngle: 0,
    vastuScore: 70, sunlightScore: 70,
    vastuSummary: "A detailed Vastu analysis is available once the facing direction is confirmed. Core Vastu principles apply: South-East kitchen, South-West master bedroom, and North-East pooja room are recommended for all orientations.",
    vastuRooms: [
      { name: "Kitchen", emoji: "🍳", direction: "South-East (recommended)", rating: "excellent", insight: "South-East is the ideal Vastu kitchen direction regardless of flat orientation." },
      { name: "Master Bedroom", emoji: "🛏", direction: "South-West (recommended)", rating: "excellent", insight: "South-West master bedroom ensures stability and restful sleep." },
      { name: "Pooja Room", emoji: "🪔", direction: "North-East (recommended)", rating: "excellent", insight: "North-East is the most spiritually potent corner in any home." },
      { name: "Living Room", emoji: "🛋", direction: "North/East preferred", rating: "good", insight: "North or East-facing living rooms maximise positive energy flow." },
      { name: "Bathroom", emoji: "🚿", direction: "North-West preferred", rating: "good", insight: "North-West bathroom placement aligns with Vayu and ventilation principles." },
    ],
    ventilation: {
      quality: "good", score: 72,
      headline: "Good Natural Airflow",
      description: "Natural ventilation can be excellent in this flat. The key factors are window orientation, floor level, and surrounding buildings. Upper floors typically have better airflow.",
      crossVentilation: true,
      paths: ["Natural breeze through primary windows", "Secondary windows enhance airflow", "Floor level significantly impacts ventilation quality"],
    },
    heat: {
      level: "moderate", score: 65,
      headline: "Moderate Heat Exposure",
      insights: [
        "Confirm exact facing for precise heat analysis",
        "Upper floors benefit from better breeze and cooler conditions",
        "Good window treatments manage heat in any orientation",
      ],
      coolRooms: ["North-facing rooms", "Upper floor rooms"],
    },
    balcony: {
      direction: "Primary facing",
      atmosphere: "Comfortable and inviting",
      dayMood: "The balcony receives natural daylight and offers a comfortable outdoor space throughout the day.",
      eveningMood: "Evening light creates a pleasant transition from day to night on the balcony.",
      nightMood: "The balcony becomes a cool retreat for evening relaxation with city views.",
      dayGradient: ["#0ea5e9", "#38bdf8", "#e0f2fe"],
      eveningGradient: ["#f97316", "#fb923c", "#fde68a"],
      nightGradient: ["#0f172a", "#1e293b", "#1f2a3d"],
      views: ["City panorama", "Sky views", "Natural light"],
      highlights: ["Natural ventilation", "Good light", "Comfortable living"],
    },
    environmental: {
      mood: "Comfortable and balanced",
      lifestyle: "A well-oriented flat in a quality building, offering comfortable living with natural light and ventilation.",
      insights: [
        "Confirm facing direction with project team for full analysis",
        "Upper floors enhance all living experience parameters",
        "Good building orientation generally applies to all units",
      ],
    },
    sunPhaseRoomMap: {
      dawn: [], morning: ["Primary rooms"], noon: ["Open areas"], evening: ["Balcony"], night: [],
    },
    topTags: ["Natural Light", "Good Ventilation", "Comfortable Living"],
    summary: "A comfortable flat with good potential across living experience parameters. Full analysis available upon confirming the exact facing direction.",
  },
};

// ── Main analysis function ─────────────────────────────────────────────────────

export function analyzeLivingExperience(
  rawFacing: string | null,
  floor: number,
  flatType: string,
  carpetArea: number
): LivingExperienceData {
  const facing = normalizeFacing(rawFacing);
  const base = FACING_ANALYSES[facing];

  // Floor-based privacy score
  const privacyBase = floor <= 2 ? 45 : floor <= 5 ? 65 : floor <= 10 ? 80 : floor <= 15 ? 88 : 93;
  const privacyLevel: PrivacyLevel = privacyBase >= 85 ? "high" : privacyBase >= 70 ? "good" : privacyBase >= 55 ? "moderate" : "limited";

  const privacyInsights = [
    floor <= 3 ? "Ground-level floors have reduced visual privacy from street level" : `Floor ${floor} provides excellent separation from street activity`,
    floor >= 8 ? "High-floor position ensures no overlooking from adjacent buildings" : "Standard floor privacy — net curtains or frosted glass recommended for lower floors",
    facing === "north" || facing === "north-east" ? "North/NE exposure faces away from most tower clusters, enhancing privacy" : "Privacy adequate; balcony screens can further enhance personal space",
    carpetArea >= 1500 ? "Generous carpet area reduces density — larger homes tend to have better natural privacy" : "",
  ].filter(Boolean) as string[];

  // Flat-type specific insights
  const ioPenthouse = flatType === "penthouse";
  const isLargeFlat = flatType === "3bhk" || flatType === "4bhk" || flatType === "penthouse";

  // Compute scores
  let vastuScore = base.vastuScore;
  let sunlightScore = base.sunlightScore;
  let ventScore = base.ventilation.score;
  let comfortScore = Math.round((vastuScore + base.heat.score + privacyBase + ventScore) / 4);
  if (ioPenthouse) { ventScore = Math.min(100, ventScore + 8); comfortScore = Math.min(100, comfortScore + 6); }
  if (floor >= 10) { ventScore = Math.min(100, ventScore + 5); sunlightScore = Math.min(100, sunlightScore + 3); }

  const overall = Math.round((vastuScore * 0.3 + sunlightScore * 0.2 + ventScore * 0.2 + privacyBase * 0.15 + comfortScore * 0.15));

  // Enrich sun phases with room-specific data
  const sunPhases: SunPhase[] = SUN_PHASES.map((p) => ({
    ...p,
    rooms: base.sunPhaseRoomMap[p.id] ?? [],
  }));

  // Compass angle → SVG angle
  const facingAngle = base.facingAngle;

  // Build privacy data
  const privacy = {
    score: privacyBase,
    level: privacyLevel,
    headline: privacyBase >= 85 ? "High Privacy — Elevated & Secluded" : privacyBase >= 70 ? "Good Privacy — Comfortable Separation" : privacyBase >= 55 ? "Moderate Privacy — Standard Apartment" : "Limited Privacy — Consider Screen Solutions",
    insights: privacyInsights,
  };

  return {
    facing,
    facingLabel: base.facingLabel,
    facingAngle,
    svgAngle: ((facingAngle - 90) * Math.PI) / 180,
    scores: {
      vastu: vastuScore,
      sunlight: sunlightScore,
      ventilation: ventScore,
      privacy: privacyBase,
      comfort: comfortScore,
      overall,
    },
    topTags: base.topTags,
    vastuSummary: base.vastuSummary,
    vastuRooms: base.vastuRooms,
    sunPhases,
    ventilation: { ...base.ventilation, score: ventScore },
    privacy,
    heat: base.heat,
    balcony: base.balcony,
    environmental: base.environmental,
    summary: base.summary,
  };
}
