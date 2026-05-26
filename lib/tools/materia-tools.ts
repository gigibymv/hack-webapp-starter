import { tool } from "ai";
import { z } from "zod";
import { MOCK_CATALOG, type Product } from "./catalog";

// 1. Analyze Room Photo
export const analyzeRoomPhoto = tool({
  description: "Extract room type, aesthetics, colors, natural lighting, and structural details from a photo.",
  inputSchema: z.object({
    imageUri: z.string().describe("Data URL or path of the uploaded room photo"),
  }),
  execute: async ({ imageUri }) => {
    return {
      success: true,
      roomType: "bedroom",
      extractedAesthetics: "warm neutral modern / cozy bohemian",
      detectedElements: [
        "neutral painted walls (warm beige/off-white)",
        "medium-to-bright natural lighting",
        "hardwood oak flooring",
        "compact-to-medium square dimensions"
      ],
      spatialConstraints: "compact width, standard ceiling height",
      initialStyleMatch: "cozy-boho"
    };
  }
});

// 2. Create Design Brief
export const createDesignBrief = tool({
  description: "Formulates a structured design brief summarizing constraints, budget boundaries, and goals.",
  inputSchema: z.object({
    userGoal: z.string().describe("Text input representing what the user wants to achieve"),
    roomAnalysis: z.any().describe("Result of analyzeRoomPhoto"),
    budget: z.number().describe("Maximum dollar amount allowed"),
    constraints: z.array(z.string()).describe("A list of constraints like 'avoid heavy assembly'")
  }),
  execute: async ({ userGoal, roomAnalysis, budget, constraints }) => {
    return {
      goal: userGoal,
      budget,
      style: ["cozy", "warm neutral", "modern"],
      mustHave: ["queen bed", "nightstand", "lamp", "rug", "bedding"],
      constraints,
      riskFlags: ["unknown exact wall dimensions before confirmation"]
    };
  }
});

// 3. Search Catalog
export const searchCatalog = tool({
  description: "Search for furniture candidate items matching category, style, and max price in the mock catalog.",
  inputSchema: z.object({
    category: z.string().optional().describe("Optional filter like bed, nightstand, rug, etc."),
    style: z.string().optional().describe("Style filter: cozy-boho, minimalist, hotel-luxury, etc."),
    maxPrice: z.number().optional().describe("Max item cost in USD")
  }),
  execute: async ({ category, style, maxPrice }) => {
    let items = MOCK_CATALOG;
    if (category) {
      items = items.filter(i => i.category === category);
    }
    if (style) {
      items = items.filter(i => i.style === style);
    }
    if (maxPrice) {
      items = items.filter(i => i.price <= maxPrice);
    }
    return {
      count: items.length,
      products: items
    };
  }
});

// 4. Check Product Fit
export const checkProductFit = tool({
  description: "Checks if a product's dimensions physically fit in the room with safe clearance lanes.",
  inputSchema: z.object({
    roomSize: z.string().describe("Room size string, e.g., '12x12'"),
    productName: z.string().describe("Name of the product"),
    dimensions: z.object({
      width: z.number(),
      depth: z.number(),
      height: z.number()
    })
  }),
  execute: async ({ roomSize, productName, dimensions }) => {
    const isBed = productName.toLowerCase().includes("bed");
    const isRug = productName.toLowerCase().includes("rug");

    if (roomSize === "12x12") {
      if (isBed && dimensions.width > 70) {
        return {
          passed: false,
          reason: `Rejected: ${productName} (width ${dimensions.width}\") is too wide for a standard 12x12 ft layout, leaving insufficient clearance side walls.`,
          clearanceInches: 18
        };
      }
      if (isRug && dimensions.width > 100) {
        return {
          passed: true,
          warning: true,
          reason: `Warning: ${productName} (8x10 or larger) fits but will extend close to the closet walkway paths.`,
          clearanceInches: 12
        };
      }
      return {
        passed: true,
        reason: `Passed: ${productName} fits comfortably within layout boundaries with standard clearance.`,
        clearanceInches: 30
      };
    }
    return { passed: true, reason: "Passed: Fits in standard space." };
  }
});

// 5. Summarize Reviews
export const summarizeReviews = tool({
  description: "Aggregates customer sentiment, rating, and risk factors for a specific product ID.",
  inputSchema: z.object({
    productId: z.string().describe("Product ID from the catalog")
  }),
  execute: async ({ productId }) => {
    const item = MOCK_CATALOG.find(i => i.id === productId);
    if (!item) return { error: "Product not found" };
    return {
      productId,
      rating: item.rating,
      reviewCount: item.reviewCount,
      summary: item.reviewSummary,
      pros: ["Extremely easy to setup", "Very accurate photo representation", "Sturdy construction"],
      cons: item.assemblyLevel === "hard" ? ["Takes over 2 hours", "Multiple people needed"] : ["Linen texture is slightly rough close-up"]
    };
  }
});

// 6. Check Delivery
export const checkDelivery = tool({
  description: "Verifies if the item can arrive at the user's location before a specific deadline day.",
  inputSchema: z.object({
    productId: z.string().describe("Product ID from catalog"),
    deadlineDays: z.number().describe("Days until arrival deadline")
  }),
  execute: async ({ productId, deadlineDays }) => {
    const item = MOCK_CATALOG.find(i => i.id === productId);
    if (!item) return { error: "Product not found" };

    const meetsDeadline = item.deliveryDays <= deadlineDays;
    return {
      productId,
      deliveryDays: item.deliveryDays,
      deadlineDays,
      passed: meetsDeadline,
      etaDescription: meetsDeadline ? `Arrives in ${item.deliveryDays} days (before deadline)` : `Arrives in ${item.deliveryDays} days (exceeds deadline)`
    };
  }
});

// 7. Rank Room Plan
export const rankRoomPlan = tool({
  description: "Ranks a full combination of items to ensure complete alignment with all constraints.",
  inputSchema: z.object({
    productIds: z.array(z.string()).describe("List of product IDs to bundle in the plan"),
    budget: z.number().describe("Max budget allowed"),
    avoidHeavyAssembly: z.boolean().describe("Whether heavy assembly must be avoided")
  }),
  execute: async ({ productIds, budget, avoidHeavyAssembly }) => {
    const items = MOCK_CATALOG.filter(i => productIds.includes(i.id));
    const totalCost = items.reduce((sum, i) => sum + i.price, 0);
    const hardAssemblyCount = items.filter(i => i.assemblyLevel === "hard").length;

    let confidenceScore = 95;
    if (totalCost > budget) confidenceScore -= 30;
    if (avoidHeavyAssembly && hardAssemblyCount > 0) confidenceScore -= 20;

    return {
      totalCost,
      remainingBudget: budget - totalCost,
      hardAssemblyCount,
      confidenceScore,
      passedChecks: totalCost <= budget && (!avoidHeavyAssembly || hardAssemblyCount === 0)
    };
  }
});

// 8. Generate Cart
export const generateCart = tool({
  description: "Calculates the final cart total, delivery scheduling, and constructs a robust Decision Receipt.",
  inputSchema: z.object({
    productIds: z.array(z.string()).describe("Verified product IDs to add to cart")
  }),
  execute: async ({ productIds }) => {
    const items = MOCK_CATALOG.filter(i => productIds.includes(i.id));
    const total = items.reduce((sum, i) => sum + i.price, 0);
    return {
      itemsCount: items.length,
      total,
      deliveryTimeline: "All items arrive before Friday",
      decisionReceipt: {
        interpretedGoal: "Create a cozy guest bedroom under $1,500.",
        constraintsApplied: ["avoid heavy assembly", "delivery before Friday"],
        itemsSelected: items.map(i => i.name),
        rejectedCount: 4,
        finalChecksPassed: true
      }
    };
  }
});

// 9. Revise Plan
export const revisePlan = tool({
  description: "Performs incremental substitutions on a plan to fit a revised aesthetic while honoring constraints.",
  inputSchema: z.object({
    currentPlanIds: z.array(z.string()).describe("Current product IDs in cart"),
    request: z.string().describe("User preference correction, e.g., 'make it more hotel-like'")
  }),
  execute: async ({ currentPlanIds, request }) => {
    const beforeItems = MOCK_CATALOG.filter(i => currentPlanIds.includes(i.id));
    const beforeTotal = beforeItems.reduce((sum, i) => sum + i.price, 0);

    // Swap cozy items to hotel-luxury items
    const cozyRug = beforeItems.find(i => i.id === "rug_501");
    const cozyLamps = beforeItems.find(i => i.id === "lighting_401");
    const cozyBedding = beforeItems.find(i => i.id === "decor_601");

    const added: Product[] = [];
    const removed: Product[] = [];

    if (cozyRug) {
      removed.push(cozyRug);
      added.push(MOCK_CATALOG.find(i => i.id === "rug_502")!);
    }
    if (cozyLamps) {
      removed.push(cozyLamps);
      added.push(MOCK_CATALOG.find(i => i.id === "lighting_402")!);
    }
    if (cozyBedding) {
      removed.push(cozyBedding);
      added.push(MOCK_CATALOG.find(i => i.id === "decor_602")!);
    }

    const finalIds = currentPlanIds.filter(id => !removed.map(r => r.id).includes(id));
    added.forEach(a => finalIds.push(a.id));

    const afterItems = MOCK_CATALOG.filter(i => finalIds.includes(i.id));
    const afterTotal = afterItems.reduce((sum, i) => sum + i.price, 0);

    return {
      removed: removed.map(r => ({ id: r.id, name: r.name, price: r.price })),
      added: added.map(a => ({ id: a.id, name: a.name, price: a.price })),
      afterTotal,
      beforeTotal,
      diffCost: afterTotal - beforeTotal,
      styleImpact: "Elevated aesthetic to luxurious boutique hotel style with refined tailored profiles and premium gold finishes."
    };
  }
});
