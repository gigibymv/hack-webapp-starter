export const maxDuration = 120;

const MODEL_ID = "subconscious/tim-qwen3.6-27b";
const BASE_URL = "https://api.subconscious.dev/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FurniturePlacement {
  category: string;
  productId: string;
  label: string;
  price: number;
  x: number;       // % from left edge
  y: number;       // % from top edge
  width: number;   // % of image width
  height: number;  // % of image height
  zIndex: number;
  rotation?: number;
}

export interface RoomVisionResult {
  roomAnalysis: {
    style: string;
    colors: string[];
    lighting: string;
    estimatedSize: string;
    floorMaterial: string;
    cameraAngle: string;
    wallFacing: string;
  };
  placements: FurniturePlacement[];
  narrative: string;
  designTitle: string;
}

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: string } }>;
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert interior designer and spatial analyst with deep knowledge of furniture placement and room perspective.

Your job: analyze a room photo and return precise, perspective-correct furniture placement coordinates so furniture appears realistically positioned in the photo.

## Placement rules (critical)

1. **Perspective**: The room has a perspective vanishing point. Items farther from camera appear:
   - Higher in the image (larger Y value = lower on screen)
   - Smaller in size
   - The floor meets walls roughly in the upper 40-60% of the image

2. **Bed**: Place against the back/main wall. Typically:
   - Centered horizontally (x = 25-35%, width = 40-50%)
   - Starts where the back wall meets the floor (y = 30-45%)
   - Height = 25-35% of image

3. **Nightstands**: Flanking the bed, same depth level:
   - Left: x = bed.x - nightstand.width - 1%, same y as bed
   - Right: x = bed.x + bed.width + 1%, same y as bed
   - Width = 8-12%, height = 15-20%

4. **Lamps**: On top of nightstands:
   - x = nightstand.x + nightstand.width/2 - 3%
   - y = nightstand.y - 8%
   - Width = 6%, height = 10%

5. **Rug**: Large floor area in front of bed:
   - x = 10-15%, width = 70-80%
   - y = bed.y + bed.height - 5% (overlaps bed bottom edge)
   - height = 20-28%
   - zIndex = 1 (behind bed)

6. **Wall art**: On the wall above the bed headboard:
   - x = bed.x + bed.width/2 - 10%, width = 20%
   - y = bed.y - 18%, height = 14%

7. **Bedding/decor**: Overlaid on the bed surface:
   - x = bed.x + 2%, width = bed.width - 4%
   - y = bed.y + bed.height * 0.3
   - height = bed.height * 0.4

## Coordinate system
- All values are percentages (0–100) of the image dimensions
- x=0 is left edge, x=100 is right edge
- y=0 is top edge, y=100 is bottom edge

## Output format
Return ONLY valid JSON matching this exact schema — no extra text, no markdown:
{
  "roomAnalysis": {
    "style": "string (e.g. modern-minimal, cozy-warm, industrial)",
    "colors": ["array of dominant room colors"],
    "lighting": "string (e.g. warm natural, bright overhead, dim ambient)",
    "estimatedSize": "string (e.g. 12x12 ft, 10x14 ft)",
    "floorMaterial": "string (e.g. hardwood, carpet, tile)",
    "cameraAngle": "string (straight-on | angled | corner)",
    "wallFacing": "string (main wall facing camera)"
  },
  "placements": [
    {
      "category": "string (bed|mattress|nightstand|lighting|rug|decor)",
      "productId": "string",
      "label": "string (short product name)",
      "price": 0,
      "x": 0,
      "y": 0,
      "width": 0,
      "height": 0,
      "zIndex": 0
    }
  ],
  "narrative": "string (2 sentences describing the design)",
  "designTitle": "string (short title e.g. 'Warm Cozy Retreat')"
}`;

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.SUBCONSCIOUS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Missing SUBCONSCIOUS_API_KEY" }, { status: 500 });
  }

  const body = await request.json() as {
    photoDataUrl: string;
    cartItems: Array<{ id: string; category: string; name: string; price: number }>;
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    currentPlacements?: FurniturePlacement[];
  };

  const { photoDataUrl, cartItems, messages = [], currentPlacements } = body;

  const furnitureList = cartItems.map((p, i) =>
    `${i + 1}. id="${p.id}" category="${p.category}" name="${p.name}" price=$${p.price}`
  ).join("\n");

  const isRevision = messages.length > 0;

  const userText = isRevision
    ? `Here is the current room photo and the existing furniture placements: ${JSON.stringify(currentPlacements)}

The user requests: "${messages[messages.length - 1]?.content}"

Update the placements to fulfill this request while keeping the perspective correct. Return the full updated JSON.

Furniture items available:
${furnitureList}`
    : `Analyze this room photo and place the following furniture items in perspective-correct positions.

Furniture to place:
${furnitureList}

Return the placement JSON as described in your instructions. Be precise with coordinates so furniture looks naturally placed in THIS specific room.`;

  const allMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(isRevision ? messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })) : []),
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: photoDataUrl, detail: "high" } },
      ],
    },
  ];

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: allMessages,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        chat_template_kwargs: { enable_thinking: true },
        stream_options: { include_usage: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[room-vision] API error:", res.status, errText);
      return Response.json(buildFallbackPlacements(cartItems));
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices[0]?.message?.content ?? "{}";

    // Strip any thinking preamble before the JSON
    const jsonStart = raw.indexOf("{");
    const jsonStr = jsonStart >= 0 ? raw.slice(jsonStart) : raw;

    let result: RoomVisionResult;
    try {
      result = JSON.parse(jsonStr) as RoomVisionResult;
    } catch {
      result = buildFallbackPlacements(cartItems);
    }

    result.placements = mergeMissingPlacements(result.placements ?? [], cartItems);
    return Response.json(result);
  } catch (err) {
    console.error("[room-vision] error:", err);
    return Response.json(buildFallbackPlacements(cartItems));
  }
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function buildFallbackPlacements(
  cartItems: Array<{ id: string; category: string; name: string; price: number }>
): RoomVisionResult {
  return {
    roomAnalysis: {
      style: "warm-modern",
      colors: ["warm white", "beige", "natural wood"],
      lighting: "warm natural",
      estimatedSize: "12×12 ft",
      floorMaterial: "hardwood",
      cameraAngle: "straight-on",
      wallFacing: "main wall centered",
    },
    placements: getDefaultPlacements(cartItems),
    narrative: "A warm, modern bedroom layout optimized for comfort and flow. The furniture is arranged to maximize natural light and walkway space.",
    designTitle: "Warm Modern Retreat",
  };
}

function getDefaultPlacements(
  cartItems: Array<{ id: string; category: string; name: string; price: number }>
): FurniturePlacement[] {
  const defaults: Record<string, Omit<FurniturePlacement, "productId" | "label" | "price">> = {
    rug:        { category: "rug",        x: 12, y: 54, width: 76, height: 26, zIndex: 1 },
    bed:        { category: "bed",        x: 26, y: 22, width: 48, height: 38, zIndex: 10 },
    mattress:   { category: "mattress",   x: 28, y: 24, width: 44, height: 6,  zIndex: 11 },
    nightstand: { category: "nightstand", x: 12, y: 30, width: 12, height: 18, zIndex: 10 },
    lighting:   { category: "lighting",   x: 13, y: 18, width: 7,  height: 11, zIndex: 15 },
    decor:      { category: "decor",      x: 30, y: 35, width: 40, height: 16, zIndex: 12 },
  };

  const seen = new Set<string>();
  return cartItems.map((item) => {
    const cat = item.category;
    const base = defaults[cat] ?? defaults.decor;
    if (cat === "nightstand" && seen.has("nightstand")) {
      return { ...base, productId: item.id, label: item.name.split(" ").slice(0, 3).join(" "), price: item.price, x: 76, zIndex: 10 };
    }
    if (cat === "lighting" && seen.has("lighting")) {
      return { ...base, productId: item.id, label: item.name.split(" ").slice(0, 3).join(" "), price: item.price, x: 80, zIndex: 15 };
    }
    seen.add(cat);
    return { ...base, productId: item.id, label: item.name.split(" ").slice(0, 3).join(" "), price: item.price };
  });
}

function mergeMissingPlacements(
  placements: FurniturePlacement[],
  cartItems: Array<{ id: string; category: string; name: string; price: number }>
): FurniturePlacement[] {
  const placed = new Set(placements.map(p => p.productId));
  const missing = cartItems.filter(c => !placed.has(c.id));
  if (missing.length === 0) return placements;
  return [...placements, ...getDefaultPlacements(missing)];
}
