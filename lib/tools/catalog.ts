export interface Product {
  id: string;
  name: string;
  category: 'bed' | 'mattress' | 'nightstand' | 'lighting' | 'rug' | 'decor' | 'sofa' | 'storage' | 'table';
  price: number;
  dimensions: {
    width: number;
    depth: number;
    height: number;
    unit: 'inches';
  };
  style: 'mid-century' | 'cozy-boho' | 'minimalist' | 'hotel-luxury';
  deliveryDays: number;
  assemblyLevel: 'easy' | 'medium' | 'hard';
  returnRisk: 'low' | 'medium' | 'high';
  rating: number;
  reviewCount: number;
  reviewSummary: string;
  imageUrl: string;
  selectionRationale: string;
  rejectionRationale: string;
}

export const MOCK_CATALOG: Product[] = [
  // --- REAL WAYFAIR BEDS ---
  {
    id: "bed_101",
    name: "Bensu Boucle Upholstered Platform Bed Frame",
    category: "bed",
    price: 375,
    dimensions: { width: 64, depth: 85, height: 42, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.8,
    reviewCount: 1420,
    reviewSummary: "Outstanding boucle texture. Extremely simple assembly. Requires no box spring.",
    imageUrl: "/images/bed_101.png",
    selectionRationale: "Matches the warm cozy-boho aesthetic. Boucle upholstery adds beautiful tactile feel and has a low assembly burden.",
    rejectionRationale: "None."
  },
  {
    id: "bed_102",
    name: "Modernist Solid Oak Platform Bed Frame",
    category: "bed",
    price: 649,
    dimensions: { width: 62, depth: 82, height: 14, unit: "inches" },
    style: "minimalist",
    deliveryDays: 6,
    assemblyLevel: "hard",
    returnRisk: "medium",
    rating: 4.6,
    reviewCount: 310,
    reviewSummary: "Beautiful solid oak finish but takes 2+ hours and multiple people to assemble. Very heavy.",
    imageUrl: "/images/bed_101.png",
    selectionRationale: "Sleek low-profile styling for minimalist concepts.",
    rejectionRationale: "Rejected: Fails the 'avoid heavy assembly' constraint and exceeds typical budget bounds."
  },
  {
    id: "bed_103",
    name: "Palace Wingback Upholstered Velvet Bed Frame",
    category: "bed",
    price: 520,
    dimensions: { width: 68, depth: 86, height: 54, unit: "inches" },
    style: "hotel-luxury",
    deliveryDays: 3,
    assemblyLevel: "medium",
    returnRisk: "low",
    rating: 4.9,
    reviewCount: 450,
    reviewSummary: "Very high-end tailored velvet headboard. Feels like an upscale boutique hotel.",
    imageUrl: "/images/bed_101.png",
    selectionRationale: "Selected as hotel-luxury framework replacement for upscale master bedrooms.",
    rejectionRationale: "Rejected: Width (68\") exceeds compact room size thresholds."
  },

  // --- REAL WAYFAIR MATTRESSES ---
  {
    id: "mattress_201",
    name: "Wayfair Sleep 8-Inch Medium Memory Foam Mattress",
    category: "mattress",
    price: 299,
    dimensions: { width: 60, depth: 80, height: 8, unit: "inches" },
    style: "minimalist",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.7,
    reviewCount: 8900,
    reviewSummary: "Outstanding value. Expands quickly. Perfect medium firmness for guest comfort.",
    imageUrl: "/images/bed_101.png",
    selectionRationale: "Top-selling value memory foam mattress. Delivers in compact vacuum-sealed box for easy carriage.",
    rejectionRationale: "None."
  },

  // --- REAL WAYFAIR NIGHTSTANDS ---
  {
    id: "nightstand_301",
    name: "Ahouh 2-Drawer Storage Nightstands (Set of 2)",
    category: "nightstand",
    price: 380,
    dimensions: { width: 18, depth: 15, height: 24, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 3,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.8,
    reviewCount: 650,
    reviewSummary: "Very straightforward assembly. Small footprint, looks elegant and cozy.",
    imageUrl: "/images/nightstand_301.png",
    selectionRationale: "A matching set of highly compact nightstands that perfectly fit compact bedroom width clearance limits.",
    rejectionRationale: "None."
  },
  {
    id: "nightstand_302",
    name: "Grace Fluted Wood Single Drawer Nightstand",
    category: "nightstand",
    price: 149,
    dimensions: { width: 20, depth: 16, height: 24, unit: "inches" },
    style: "hotel-luxury",
    deliveryDays: 3,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.7,
    reviewCount: 220,
    reviewSummary: "Brass accents and fluted detailing look extremely premium. Sturdy construction.",
    imageUrl: "/images/nightstand_301.png",
    selectionRationale: "Swapped nightstands. Gold handles and fluted oak columns match boutique hotel palettes.",
    rejectionRationale: "None."
  },

  // --- REAL WAYFAIR LAMPS ---
  {
    id: "lighting_401",
    name: "Cleofe Ceramic Table Lamps with Linen Shades (Set of 2)",
    category: "lighting",
    price: 118,
    dimensions: { width: 12, depth: 12, height: 20, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.8,
    reviewCount: 880,
    reviewSummary: "Beautiful textured ceramic glaze. Linen shades diffuse light warmly.",
    imageUrl: "/images/lighting_401.png",
    selectionRationale: "Glazed organic ceramics complement the warm textured bedroom aesthetic.",
    rejectionRationale: "None."
  },
  {
    id: "lighting_402",
    name: "Aura Brass & Frosted Globe Table Lamps (Set of 2)",
    category: "lighting",
    price: 139,
    dimensions: { width: 10, depth: 10, height: 18, unit: "inches" },
    style: "hotel-luxury",
    deliveryDays: 3,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.9,
    reviewCount: 150,
    reviewSummary: "Instantly adds sleek high-end hotel vibes. Heavy brass base, diffuse soft light.",
    imageUrl: "/images/lighting_401.png",
    selectionRationale: "Adds premium hotel lighting aesthetic and matches nightstand gold/brass accents.",
    rejectionRationale: "None."
  },

  // --- REAL WAYFAIR RUGS ---
  {
    id: "rug_501",
    name: "Hillsby Oriental Indoor Area Rug (8x10)",
    category: "rug",
    price: 249,
    dimensions: { width: 96, depth: 120, height: 0.25, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.6,
    reviewCount: 3410,
    reviewSummary: "Amazingly soft underfoot. Highly durable synthetic fibers.",
    imageUrl: "/images/rug_501.png",
    selectionRationale: "Spans bedroom area comfortably. Muted warm patterns bring organic cozy tones together.",
    rejectionRationale: "None."
  },
  {
    id: "rug_502",
    name: "Classic Ivory Bordered Hotel Rug (8x10)",
    category: "rug",
    price: 219,
    dimensions: { width: 96, depth: 120, height: 0.4, unit: "inches" },
    style: "hotel-luxury",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.8,
    reviewCount: 180,
    reviewSummary: "Subtle dark grey double border feels tailored. Very soft, easy to clean.",
    imageUrl: "/images/rug_501.png",
    selectionRationale: "Double border lines add tailored structured symmetry to hotel configurations.",
    rejectionRationale: "None."
  },

  // --- REAL WAYFAIR TEXTILES & DECOR ---
  {
    id: "decor_601",
    name: "Organic Waffle Knit Bedding & Duvet Cover Set",
    category: "decor",
    price: 96,
    dimensions: { width: 90, depth: 92, height: 1, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 3,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.7,
    reviewCount: 750,
    reviewSummary: "Extremely breathable, beautiful texture, doesn't need ironing.",
    imageUrl: "/images/lighting_401.png",
    selectionRationale: "Organic waffled cotton texture provides visual softness to the cozy bedroom configuration.",
    rejectionRationale: "None."
  },
  {
    id: "decor_602",
    name: "Crisp White Bordered Hotel Duvet Set",
    category: "decor",
    price: 124,
    dimensions: { width: 90, depth: 92, height: 1, unit: "inches" },
    style: "hotel-luxury",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.9,
    reviewCount: 310,
    reviewSummary: "Feels like high thread count Egyptian cotton. Beautiful dark trim, silky finish.",
    imageUrl: "/images/lighting_401.png",
    selectionRationale: "Tailored dark-trimmed Egyptian cotton duvet replicates upscale hotel bedding suites.",
    rejectionRationale: "None."
  },
  {
    id: "decor_603",
    name: "Warm Arch Framed Canvas Wall Art",
    category: "decor",
    price: 55,
    dimensions: { width: 24, depth: 1.5, height: 36, unit: "inches" },
    style: "cozy-boho",
    deliveryDays: 2,
    assemblyLevel: "easy",
    returnRisk: "low",
    rating: 4.8,
    reviewCount: 1100,
    reviewSummary: "Instantly ties the room's warm beige tones together. Light and easy to hang.",
    imageUrl: "/images/lighting_401.png",
    selectionRationale: "Affordable focal point to dress bare walls and enhance style coherence.",
    rejectionRationale: "None."
  }
];
