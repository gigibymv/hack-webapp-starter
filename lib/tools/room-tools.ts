import { tool } from "ai";
import { z } from "zod";

// ─── Working Memory (Materia scratchpad schema) ──────────────────────────────

export interface RejectedItem {
  productId: string;
  name: string;
  reason: string;
  constraintViolated: "budget" | "dimensions" | "assembly" | "delivery" | "aesthetic";
}

export interface WorkingMemory {
  toolRuns: Array<{ toolName: string; timestamp: string; summary: string }>;
  rejectedItems: RejectedItem[];
  currentPlanScore: number;
}

// ─── Mock catalog data ───────────────────────────────────────────────────────

const CATALOG: Record<string, Product[]> = {
  "bed frame": [
    {
      id: "bed_001",
      name: "Oakhurst Upholstered Queen Bed Frame",
      price: 389,
      dimensions: { w: 64, d: 84, h: 48 },
      style: ["warm neutral", "modern", "cozy"],
      assembly: "easy",
      deliveryDays: 2,
      rating: 4.6,
      reviewCount: 412,
      reviewSummary:
        "Customers love the clean upholstered look and sturdy slats. Assembly takes ~45 min, no special tools needed.",
      image: "/products/bed-001.jpg",
      pros: ["sturdy construction", "neutral color matches anything", "low assembly effort"],
      cons: ["slight off-gassing first day", "headboard could be thicker"],
      assemblyScore: 9,
    },
    {
      id: "bed_002",
      name: "Platform Storage Bed with Drawers",
      price: 520,
      dimensions: { w: 66, d: 88, h: 14 },
      style: ["modern", "minimalist"],
      assembly: "hard",
      deliveryDays: 5,
      rating: 4.2,
      reviewCount: 198,
      reviewSummary: "Great storage but assembly is complex and drawer clearance needs extra space.",
      image: "/products/bed-002.jpg",
      pros: ["great storage", "low profile"],
      cons: ["complex assembly 3-4 hrs", "drawer clearance risk in small rooms"],
      assemblyScore: 4,
    },
    {
      id: "bed_003",
      name: "Solid Oak Storage Bed Frame",
      price: 780,
      dimensions: { w: 66, d: 86, h: 52 },
      style: ["rustic", "traditional"],
      assembly: "hard",
      deliveryDays: 7,
      rating: 4.8,
      reviewCount: 89,
      reviewSummary: "Beautiful wood quality but very heavy and requires 2 people minimum to assemble.",
      image: "/products/bed-003.jpg",
      pros: ["premium wood", "heirloom quality"],
      cons: ["very heavy", "expensive", "delivery slow"],
      assemblyScore: 3,
    },
  ],
  "mattress": [
    {
      id: "matt_001",
      name: "8-Inch Queen Memory Foam Mattress",
      price: 299,
      dimensions: { w: 60, d: 80, h: 8 },
      style: ["universal"],
      assembly: "easy",
      deliveryDays: 1,
      rating: 4.5,
      reviewCount: 2041,
      reviewSummary: "Excellent value. Most reviewers notice improved sleep within a week. Ships compressed in a box.",
      image: "/products/matt-001.jpg",
      pros: ["great value", "fast delivery", "easy setup"],
      cons: ["off-gassing 24–48 hrs", "edge support could be better"],
      assemblyScore: 10,
    },
  ],
  "nightstand": [
    {
      id: "ns_001",
      name: "Compact Walnut Nightstand (Set of 2)",
      price: 178,
      dimensions: { w: 18, d: 16, h: 24 },
      style: ["warm neutral", "modern", "cozy"],
      assembly: "easy",
      deliveryDays: 2,
      rating: 4.4,
      reviewCount: 305,
      reviewSummary: "Great size for compact rooms. Drawer is solid and the walnut finish is richer than photos suggest.",
      image: "/products/ns-001.jpg",
      pros: ["compact", "walnut finish looks premium", "quick assembly"],
      cons: ["drawer a bit shallow"],
      assemblyScore: 9,
    },
    {
      id: "ns_002",
      name: "Glass and Chrome Nightstand (Set of 2)",
      price: 142,
      dimensions: { w: 16, d: 14, h: 22 },
      style: ["glam", "modern chrome"],
      assembly: "easy",
      deliveryDays: 2,
      rating: 4.1,
      reviewCount: 167,
      reviewSummary: "Looks sleek in photos but feels light in person. Glass scratches easily.",
      image: "/products/ns-002.jpg",
      pros: ["affordable", "modern look"],
      cons: ["feels light/flimsy", "glass scratches easily"],
      assemblyScore: 9,
    },
  ],
  "lamp": [
    {
      id: "lamp_001",
      name: "Ceramic Table Lamp Pair – Warm White",
      price: 118,
      dimensions: { w: 10, d: 10, h: 22 },
      style: ["warm neutral", "cozy", "modern"],
      assembly: "easy",
      deliveryDays: 2,
      rating: 4.7,
      reviewCount: 523,
      reviewSummary: "The warm white light creates a perfect cozy ambiance. Shade is high quality linen.",
      image: "/products/lamp-001.jpg",
      pros: ["warm light", "quality shade", "looks expensive"],
      cons: ["cord is short (5 ft)"],
      assemblyScore: 10,
    },
  ],
  "rug": [
    {
      id: "rug_001",
      name: "8×10 Washable Area Rug – Warm Beige",
      price: 249,
      dimensions: { w: 96, d: 120, h: 0.5 },
      style: ["warm neutral", "cozy", "modern"],
      assembly: "easy",
      deliveryDays: 1,
      rating: 4.5,
      reviewCount: 887,
      reviewSummary: "Machine washable is a game changer. Soft underfoot and colors are accurate to photos.",
      image: "/products/rug-001.jpg",
      pros: ["machine washable", "soft", "accurate color"],
      cons: ["needs rug pad (not included)", "slight shedding first few weeks"],
      assemblyScore: 10,
    },
    {
      id: "rug_002",
      name: "8×10 Ivory Border Area Rug – Hotel Style",
      price: 219,
      dimensions: { w: 96, d: 120, h: 0.5 },
      style: ["hotel", "white", "minimalist", "modern"],
      assembly: "easy",
      deliveryDays: 2,
      rating: 4.6,
      reviewCount: 412,
      reviewSummary: "Crisp hotel-like look. Dense pile and the ivory border gives a tailored feel.",
      image: "/products/rug-002.jpg",
      pros: ["hotel aesthetic", "dense pile", "elegant border"],
      cons: ["shows dirt faster in high-traffic areas"],
      assemblyScore: 10,
    },
  ],
  "bedding": [
    {
      id: "bed_linen_001",
      name: "Cotton Bedding Set – Warm Gray",
      price: 96,
      dimensions: { w: 0, d: 0, h: 0 },
      style: ["warm neutral", "cozy", "modern"],
      assembly: "easy",
      deliveryDays: 1,
      rating: 4.4,
      reviewCount: 1203,
      reviewSummary: "Soft out of the box. Washes well and keeps its color after many cycles.",
      image: "/products/bedding-001.jpg",
      pros: ["soft", "durable", "color-fast"],
      cons: ["wrinkles easily if not promptly dried"],
      assemblyScore: 10,
    },
    {
      id: "bed_linen_002",
      name: "White Hotel-Style Duvet Set",
      price: 124,
      dimensions: { w: 0, d: 0, h: 0 },
      style: ["hotel", "white", "minimalist", "modern"],
      assembly: "easy",
      deliveryDays: 1,
      rating: 4.7,
      reviewCount: 834,
      reviewSummary: "Feels like a 5-star hotel. Crisp, bright white that stays white through washing.",
      image: "/products/bedding-002.jpg",
      pros: ["luxury feel", "stays white", "hotel aesthetic"],
      cons: ["need to buy duvet insert separately"],
      assemblyScore: 10,
    },
  ],
  "wall art": [
    {
      id: "art_001",
      name: "Framed Abstract Print Set (3 pieces)",
      price: 55,
      dimensions: { w: 12, d: 1, h: 16 },
      style: ["warm neutral", "modern", "cozy"],
      assembly: "easy",
      deliveryDays: 3,
      rating: 4.3,
      reviewCount: 298,
      reviewSummary: "Great finishing touch. Frames look quality and the abstract prints are versatile.",
      image: "/products/art-001.jpg",
      pros: ["affordable", "versatile style", "easy hanging"],
      cons: ["hardware is minimal"],
      assemblyScore: 10,
    },
  ],
};

interface Product {
  id: string;
  name: string;
  price: number;
  dimensions: { w: number; d: number; h: number };
  style: string[];
  assembly: "easy" | "medium" | "hard";
  deliveryDays: number;
  rating: number;
  reviewCount: number;
  reviewSummary: string;
  image: string;
  pros: string[];
  cons: string[];
  assemblyScore: number;
}

// ─── Tools ───────────────────────────────────────────────────────────────────

export const analyzeRoomPhoto = tool({
  description:
    "Analyze a room photo to detect style, colors, lighting, floor type, and spatial constraints",
  inputSchema: z.object({
    photoDescription: z
      .string()
      .describe("Brief description of what was uploaded or 'sample room'"),
  }),
  execute: async () => {
    await new Promise((r) => setTimeout(r, 600));
    return {
      roomType: "bedroom",
      style: ["modern", "cozy", "warm neutral"],
      colors: ["neutral walls", "warm white", "light gray"],
      lighting: "medium natural light",
      flooring: "hardwood",
      spatialNotes: "compact to medium room, good wall space",
      confidence: 0.88,
    };
  },
});

export const createDesignBrief = tool({
  description:
    "Convert a vague user goal + room analysis + constraints into a structured design brief",
  inputSchema: z.object({
    userGoal: z.string(),
    roomSize: z.string().describe("e.g. 12x12"),
    budget: z.number(),
    constraints: z.array(z.string()),
    roomAnalysis: z.string().describe("JSON string of room analysis"),
  }),
  execute: async ({ userGoal, roomSize, budget, constraints }) => {
    await new Promise((r) => setTimeout(r, 400));
    const mustHave = ["queen bed frame", "mattress", "nightstand", "lamp", "rug", "bedding"];
    return {
      roomType: "guest bedroom",
      budget,
      roomSize,
      style: ["cozy", "warm neutral", "modern"],
      mustHave,
      constraints,
      riskFlags:
        roomSize === "10x10" ? ["room may be tight for full nightstands"] : [],
      budgetAllocation: {
        "bed frame": Math.round(budget * 0.28),
        mattress: Math.round(budget * 0.2),
        nightstand: Math.round(budget * 0.13),
        lamp: Math.round(budget * 0.08),
        rug: Math.round(budget * 0.17),
        bedding: Math.round(budget * 0.07),
        "wall art": Math.round(budget * 0.04),
      },
      goalSummary: `Create a ${userGoal.toLowerCase().includes("hotel") ? "hotel-style" : "cozy"} guest bedroom`,
    };
  },
});

export const searchCatalog = tool({
  description: "Search the Wayfair catalog for products matching criteria",
  inputSchema: z.object({
    category: z.string().describe("Product category, e.g. 'bed frame', 'rug'"),
    style: z.array(z.string()).optional(),
    maxPrice: z.number().optional(),
    assembly: z.enum(["easy", "medium", "hard", "any"]).optional(),
  }),
  execute: async ({ category, style, maxPrice, assembly }) => {
    await new Promise((r) => setTimeout(r, 700));
    const key = Object.keys(CATALOG).find((k) =>
      category.toLowerCase().includes(k.toLowerCase()),
    );
    let results = key ? [...CATALOG[key]] : [];

    if (maxPrice) results = results.filter((p) => p.price <= maxPrice);
    if (assembly && assembly !== "any")
      results = results.filter((p) => p.assembly === assembly);
    if (style && style.length > 0)
      results = results.sort((a, b) => {
        const aMatch = style.filter((s) =>
          a.style.some((as) => as.includes(s.toLowerCase())),
        ).length;
        const bMatch = style.filter((s) =>
          b.style.some((bs) => bs.includes(s.toLowerCase())),
        ).length;
        return bMatch - aMatch;
      });

    return {
      category,
      found: results.length,
      products: results.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        assembly: p.assembly,
        deliveryDays: p.deliveryDays,
        rating: p.rating,
        style: p.style,
      })),
    };
  },
});

export const checkProductFit = tool({
  description:
    "Check whether a product fits in the room with proper clearance. For beds, also accounts for nightstand widths in the total horizontal footprint.",
  inputSchema: z.object({
    productId: z.string(),
    productName: z.string(),
    productDimensions: z.object({ w: z.number(), d: z.number() }),
    roomSize: z.string().describe("e.g. '12x12'"),
    placement: z.string().describe("Where it goes, e.g. 'against north wall'"),
    nightstandWidth: z
      .number()
      .optional()
      .describe("Width of each nightstand in inches, if placing alongside bed"),
  }),
  execute: async ({ productId, productName, productDimensions, roomSize, nightstandWidth }) => {
    await new Promise((r) => setTimeout(r, 500));
    const [rw, rd] = roomSize.split("x").map((n) => parseInt(n) * 12);
    const { w, d } = productDimensions;

    // Full horizontal footprint: bed + 2 nightstands (Materia formula)
    const nightstandTotal = nightstandWidth ? nightstandWidth * 2 : 0;
    const totalHorizontalFootprint = w + nightstandTotal;
    const horizontalRemainder = rw - totalHorizontalFootprint;
    const sideClearance = horizontalRemainder / 2;
    const footClearance = rd - d;

    const fits = sideClearance >= 22 && footClearance >= 36;
    const warningZone = sideClearance >= 22 && sideClearance < 30;
    const confidence = fits ? (sideClearance >= 30 ? 95 : 78) : 40;

    const constraintViolated: "dimensions" | null = fits ? null : "dimensions";

    return {
      productId,
      productName,
      fits,
      warningZone,
      confidence,
      totalHorizontalFootprint,
      sideClearance: Math.round(sideClearance),
      footClearance: Math.round(footClearance),
      constraintViolated,
      notes: fits
        ? warningZone
          ? `${Math.round(sideClearance)}" side clearance with nightstands — functional but snug (warning zone <30")`
          : `${Math.round(sideClearance)}" side clearance, ${Math.round(footClearance)}" foot clearance — comfortable layout`
        : `Only ${Math.round(sideClearance)}" side clearance with nightstands — below 22" minimum threshold`,
      breakdown: nightstandWidth
        ? `Bed ${w}" + nightstands 2×${nightstandWidth}" = ${totalHorizontalFootprint}" of ${rw}" room width`
        : `Bed ${w}" of ${rw}" room width`,
    };
  },
});

export const summarizeReviews = tool({
  description: "Get a review summary for a product with pros, cons, and risk flags",
  inputSchema: z.object({
    productId: z.string(),
    focus: z.array(z.string()).optional(),
  }),
  execute: async ({ productId }) => {
    await new Promise((r) => setTimeout(r, 400));
    const allProducts = Object.values(CATALOG).flat();
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return { error: "Product not found" };
    return {
      productId,
      rating: product.rating,
      reviewCount: product.reviewCount,
      summary: product.reviewSummary,
      pros: product.pros,
      cons: product.cons,
      riskFlags:
        product.assembly === "hard"
          ? ["high assembly complexity — may need professional assembly"]
          : [],
    };
  },
});

export const checkDelivery = tool({
  description:
    "Check whether a product can be delivered before a given deadline",
  inputSchema: z.object({
    productId: z.string(),
    productName: z.string(),
    deadlineDays: z.number().describe("Days from today the item must arrive"),
  }),
  execute: async ({ productId, productName, deadlineDays }) => {
    await new Promise((r) => setTimeout(r, 300));
    const allProducts = Object.values(CATALOG).flat();
    const product = allProducts.find((p) => p.id === productId);
    const deliveryDays = product?.deliveryDays ?? 3;
    const canDeliver = deliveryDays <= deadlineDays;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    const dayName = dayNames[deliveryDate.getDay()];

    return {
      productId,
      productName,
      canDeliver,
      estimatedDeliveryDays: deliveryDays,
      estimatedDay: dayName,
      status: canDeliver ? "on-time" : "late",
    };
  },
});

export const rankRoomPlan = tool({
  description:
    "Score and rank a set of selected products as a complete room plan",
  inputSchema: z.object({
    selectedProductIds: z.array(z.string()),
    brief: z.string().describe("JSON string of design brief"),
  }),
  execute: async ({ selectedProductIds }) => {
    await new Promise((r) => setTimeout(r, 500));
    const allProducts = Object.values(CATALOG).flat();
    const selected = selectedProductIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];

    const totalPrice = selected.reduce((sum, p) => sum + p.price, 0);
    const avgRating =
      selected.reduce((sum, p) => sum + p.rating, 0) / selected.length;
    const maxDelivery = Math.max(...selected.map((p) => p.deliveryDays));
    const hasHardAssembly = selected.some((p) => p.assembly === "hard");

    const score = Math.round(
      avgRating * 15 +
        (hasHardAssembly ? 0 : 10) +
        (maxDelivery <= 3 ? 10 : 5) -
        (totalPrice > 1500 ? 10 : 0),
    );

    return {
      products: selected.map((p) => ({ id: p.id, name: p.name, price: p.price })),
      totalPrice,
      planScore: Math.min(score, 100),
      fitConfidence: 92,
      deliveryConfidence: maxDelivery <= 3 ? 95 : 78,
      assemblyRisk: hasHardAssembly ? "high" : "low",
      ready: score >= 70,
    };
  },
});

export const generateCart = tool({
  description:
    "Generate the final verified cart and decision receipt from the ranked room plan",
  inputSchema: z.object({
    rankedPlan: z.string().describe("JSON string of ranked plan"),
    brief: z.string().describe("JSON string of design brief"),
    rejectedIds: z.array(z.string()),
  }),
  execute: async ({ rejectedIds }) => {
    await new Promise((r) => setTimeout(r, 400));
    const allProducts = Object.values(CATALOG).flat();
    const rejected = rejectedIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];

    return {
      status: "ready",
      rejectedItems: rejected.map((p) => ({
        id: p.id,
        name: p.name,
        reason:
          p.assembly === "hard"
            ? "high assembly complexity"
            : p.price > 500
              ? "over budget allocation"
              : "style mismatch",
      })),
      checksPassedSummary: [
        "Budget: PASSED",
        "Fit: PASSED (92% confidence)",
        "Delivery: PASSED (all items arrive in time)",
        "Assembly: LOW RISK",
        "Reviews: POSITIVE",
      ],
    };
  },
});

export const revisePlan = tool({
  description:
    "Revise specific items in the current plan based on a user change request",
  inputSchema: z.object({
    currentPlanIds: z.array(z.string()),
    userRequest: z.string(),
    budget: z.number(),
  }),
  execute: async ({ currentPlanIds, userRequest }) => {
    await new Promise((r) => setTimeout(r, 600));

    const isHotelStyle =
      userRequest.toLowerCase().includes("hotel") ||
      userRequest.toLowerCase().includes("white") ||
      userRequest.toLowerCase().includes("clean");

    const allProducts = Object.values(CATALOG).flat();
    const current = currentPlanIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];

    const removed: Product[] = [];
    const added: Product[] = [];
    const kept = [...current];

    if (isHotelStyle) {
      // swap rug
      const rugIdx = kept.findIndex((p) => p.id === "rug_001");
      if (rugIdx !== -1) {
        removed.push(kept[rugIdx]);
        kept.splice(rugIdx, 1);
        const hotelRug = allProducts.find((p) => p.id === "rug_002")!;
        kept.push(hotelRug);
        added.push(hotelRug);
      }
      // swap bedding
      const beddingIdx = kept.findIndex((p) => p.id === "bed_linen_001");
      if (beddingIdx !== -1) {
        removed.push(kept[beddingIdx]);
        kept.splice(beddingIdx, 1);
        const hotelBedding = allProducts.find((p) => p.id === "bed_linen_002")!;
        kept.push(hotelBedding);
        added.push(hotelBedding);
      }
    }

    const newTotal = kept.reduce((sum, p) => sum + p.price, 0);
    const oldTotal = current.reduce((sum, p) => sum + p.price, 0);

    return {
      revisedPlanIds: kept.map((p) => p.id),
      removed: removed.map((p) => ({ id: p.id, name: p.name, price: p.price })),
      added: added.map((p) => ({ id: p.id, name: p.name, price: p.price })),
      keptIds: kept
        .filter((p) => !added.includes(p))
        .map((p) => ({ id: p.id, name: p.name })),
      newTotal,
      priceDelta: newTotal - oldTotal,
      styleChange: isHotelStyle ? "hotel-style" : "updated",
      checksPreserved: ["Budget", "Delivery", "Fit"],
    };
  },
});

export const roomTools = {
  analyzeRoomPhoto,
  createDesignBrief,
  searchCatalog,
  checkProductFit,
  summarizeReviews,
  checkDelivery,
  rankRoomPlan,
  generateCart,
  revisePlan,
};
