Below is a concrete customer journey and UI flow for **Design-to-Door Agent**, optimized for a hackathon demo and for showcasing agentic AI rather than just “AI recommendations.”

The product promise:

**“Upload a room photo. Tell us your goal. Get a verified, shoppable room plan that fits your space, budget, style, and delivery constraints.”**

## Core customer journey

The customer is someone who wants to furnish or refresh a room but feels overwhelmed by too many options, unclear fit, delivery uncertainty, reviews, assembly difficulty, and budget tradeoffs.

The journey should feel like hiring a personal interior designer, logistics planner, and shopping assistant in one agent.

### Stage 1: Customer arrives with a vague goal

Customer intent:

“I need to furnish this room, but I do not know what to buy.”

UI experience:

The landing screen should be extremely simple. Show one primary action: **“Design my room”**.

Suggested hero copy:

**Design a room that actually fits.**

Subcopy:

**Upload a photo, set your budget, and let our agent build a verified Wayfair cart with furniture that fits your room, style, delivery needs, and constraints.**

Primary CTA:

**Start with a room photo**

Secondary CTA:

**Try sample room**

For the hackathon, include a sample room button. This protects the demo if image upload or vision parsing is slow.

UI layout:

Left side: hero copy and CTA.

Right side: animated mock result showing a room photo transforming into a cart.

Small trust bullets:

**Budget checked**

**Dimensions checked**

**Delivery checked**

**Reviews summarized**

**Alternatives compared**

Agentic AI signal:

From the first screen, the app should not feel like a chatbot. It should feel like an agent that will complete a task.

---

### Stage 2: Customer uploads the room and describes the goal

Customer action:

The user uploads a room photo and enters a natural-language goal.

Example user input:

**“Turn this empty room into a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly. Delivery before Friday.”**

UI screen:

Call this screen **Room Brief**.

Fields:

Photo uploader:

**Upload room photo**

Text box:

**What are you trying to create?**

Budget input:

**Max budget**

Dropdown:

**Room type**

Options: Bedroom, Living Room, Office, Dining Room, Nursery, Entryway.

Optional toggles:

**Avoid heavy assembly**

**Pet-friendly materials**

**Kid-friendly materials**

**Must arrive by date**

**Small-space friendly**

**Prefer sustainable materials**

CTA:

**Build my room plan**

Specific UI behavior:

After image upload, show the room photo in a card.

Below it, show extracted tags only after the agent runs:

**Detected: neutral walls, medium natural light, hardwood floor, compact room, modern/cozy style.**

For MVP, you can simulate the image analysis. The important thing is the UI makes it clear the agent “observed” the room.

Agent actions behind the scenes:

The agent creates a structured brief:

```json
{
  "room_type": "guest bedroom",
  "budget": 1500,
  "style": ["cozy", "warm neutral", "modern"],
  "must_have": ["queen bed", "nightstand", "lamp", "rug"],
  "constraints": ["avoid heavy assembly", "delivery before Friday"],
  "risk_flags": ["unknown room dimensions"]
}
```

Agentic AI signal:

The agent transforms vague user intent into a structured plan before shopping.

---

### Stage 3: Agent asks one smart clarification

Do not let the agent ask five questions. That will slow the demo. Ask exactly one question only when it matters.

Best clarification:

**“Do you know the approximate room size?”**

UI options:

Button 1: **Small: about 10 × 10 ft**

Button 2: **Medium: about 12 × 12 ft**

Button 3: **Large: 14 × 16 ft or more**

Button 4: **Not sure — use safe compact choices**

For the demo, choose:

**Medium: about 12 × 12 ft**

Then the agent proceeds.

Why this matters:

It demonstrates human-in-the-loop behavior without making the app feel tedious.

Agentic AI signal:

The agent knows when it has missing information, asks a targeted question, then continues autonomously.

---

### Stage 4: Agent enters “design run” mode

This is the most important screen for showcasing agentic AI.

UI screen:

Call this screen **Agent Workspace**.

Layout:

Left column: chat-style conversation.

Center panel: live task checklist.

Right panel: evolving room plan/cart preview.

The live checklist should show the agent’s steps visibly:

1. **Analyzing room photo**
2. **Extracting design constraints**
3. **Planning essential items**
4. **Searching catalog**
5. **Checking dimensions**
6. **Checking budget**
7. **Reading reviews**
8. **Checking delivery timing**
9. **Comparing alternatives**
10. **Finalizing cart**

Each step should animate from pending to running to complete.

Example agent messages:

**I found this is likely a compact-to-medium guest bedroom. I’ll prioritize a queen bed, two nightstands, lighting, soft textiles, and one accent piece while keeping assembly difficulty low.**

Then:

**I rejected 3 bed frames because they exceeded the room-fit threshold or had high assembly complexity.**

Then:

**I found a complete plan at $1,384 with delivery available before Friday.**

Specific UI components:

A “tool activity” drawer or expandable panel should show tool calls like:

```text
search_catalog({
  category: "queen bed frame",
  style: "warm neutral modern",
  max_price: 450,
  assembly: "easy"
})
```

```text
check_fit({
  room_size: "12x12",
  product_dimensions: "84x64",
  clearance_required: "24in"
})
```

```text
summarize_reviews({
  product_id: "bed_1042",
  focus: ["assembly", "quality", "delivery"]
})
```

Do not hide this. Judges need to see the agent is doing real work.

Agentic AI signal:

This screen shows planning, tool use, critique, rejection, and final decision-making.

---

### Stage 5: Customer sees the first room plan

UI screen:

Call this screen **Your Verified Room Plan**.

Top summary card:

**Cozy Guest Bedroom Plan**

**Total: $1,384**

**Budget: $1,500**

**Arrives by: Friday**

**Assembly: Low to Medium**

**Fit confidence: 92%**

**Style match: Warm modern / cozy neutral**

Below that, show product cards grouped by purpose, not just a raw list.

Example sections:

**Foundation**

Queen upholstered bed frame — $389

8-inch memory foam mattress — $299

**Function**

Two compact nightstands — $178 total

Two ceramic table lamps — $118 total

**Comfort**

8 × 10 washable area rug — $249

Cotton bedding set — $96

**Finishing touch**

Framed wall art or accent mirror — $55

Each product card should include:

Product image placeholder

Name

Price

Dimensions

Delivery estimate

Assembly rating

Review summary

Reason selected

Swap button

Example product-card text:

**Why selected:** Fits queen layout with 30-inch side clearance, low assembly burden, neutral upholstery matches the room palette, and reviews frequently mention sturdy construction.

Important: include “why selected” and “why rejected” logic. This is where the agent feels intelligent.

---

### Stage 6: Customer inspects verification details

UI element:

Add a tabbed panel under the summary:

Tabs:

**Fit**

**Budget**

**Delivery**

**Reviews**

**Alternatives**

The default tab should be **Fit**.

Fit tab:

Show a simple top-down room diagram. It can be approximate, not technically perfect.

Elements:

Room rectangle labeled **12 × 12 ft**

Bed footprint

Nightstands

Rug

Clearance zones

Fit status:

**Passed: 30 in walkway clearance on both sides**

**Passed: Bed length leaves 36 in foot clearance**

**Warning: Rug may extend close to closet path**

For MVP, this can be a static SVG or div-based layout.

Budget tab:

Show a stacked cost breakdown:

Furniture: $865

Textiles: $345

Lighting/decor: $174

Total: $1,384

Remaining budget: $116

Delivery tab:

Product-level delivery badges:

Bed frame: Friday

Mattress: Thursday

Nightstands: Friday

Rug: Wednesday

Lamps: Thursday

Overall status:

**All core items arrive by Friday**

Reviews tab:

Summarize sentiment:

**Customers like the bed frame’s look and sturdiness. Main complaint is that assembly takes 45–60 minutes, but no special tools are commonly mentioned.**

Alternatives tab:

Show rejected options:

**Rejected: Solid wood storage bed — too expensive and heavy assembly**

**Rejected: Platform bed with drawers — fit risk due to drawer clearance**

**Rejected: Glass nightstand — poor match for cozy guest-room brief**

Agentic AI signal:

The agent does not just output products. It audits its own recommendation.

---

### Stage 7: Customer can ask for controlled changes

Customer might say:

**“Can you make it more hotel-like?”**

or

**“Can you get it under $1,200?”**

or

**“I do not like the rug.”**

UI behavior:

The chat remains available on the left.

When the user asks for a change, the agent should not restart. It should revise only affected items.

Example response:

**I’ll keep the bed, mattress, and nightstands because they passed fit and delivery checks. I’ll swap the rug, lamps, and bedding to create a more hotel-like look while keeping the total under $1,500.**

Then show a mini diff:

```text
Removed:
- Washable jute rug, $249

Added:
- Ivory bordered rug, $219
- White hotel-style duvet set, $124

New total:
$1,428
```

UI component:

Use a **Plan Diff** panel.

Columns:

Before

After

Impact

Example impact badges:

**+$44**

**Style match improved**

**Still arrives by Friday**

**Fit unchanged**

Agentic AI signal:

The agent performs iterative planning with memory and constraint preservation.

---

### Stage 8: Customer reviews final cart

UI screen:

Call this screen **Ready to Cart**.

Top message:

**Your room is ready. I verified fit, budget, delivery, assembly effort, and review risks.**

Primary CTA:

**Add all to cart**

Secondary CTA:

**Save room plan**

Tertiary CTA:

**Send to partner / roommate**

Cart summary:

7 items

$1,428 total

All arrive by Friday

Low-medium assembly

Fit confidence 92%

Add a “decision receipt” section:

**Agent decision receipt**

This is extremely useful for demoing agentic AI.

Include:

Goal interpreted

Constraints used

Tools called

Items selected

Items rejected

Final checks passed

Example:

**Goal interpreted:** Create a cozy guest bedroom under $1,500.

**Constraints:** Queen bed, medium room, avoid heavy assembly, delivery before Friday.

**Tools used:** Room analysis, catalog search, fit checker, review summarizer, delivery checker, budget verifier.

**Rejected items:** 5.

**Final result:** 7-item cart, $1,428, all core items arrive by Friday.

This makes the system feel accountable.

---

## Recommended UI architecture

Use a three-panel interface after the first screen.

Left panel:

**Conversation**

This is where the customer gives goals and revision requests.

Center panel:

**Agent Activity**

This shows planning steps, tool calls, checks, and rejected alternatives.

Right panel:

**Room Plan**

This shows the actual shoppable output.

This layout is better than a plain chat UI because it makes the agent’s work visible.

Suggested desktop layout:

```text
---------------------------------------------------------
| Header: Design-to-Door Agent                          |
---------------------------------------------------------
| Chat / Brief      | Agent Activity     | Room Plan     |
|                   |                    |               |
| User goal         | Checklist          | Summary card  |
| Agent responses   | Tool calls         | Product cards |
| Revision input    | Verification logs  | Cart CTA      |
---------------------------------------------------------
```

Suggested mobile layout:

Use tabs:

**Chat**

**Agent**

**Plan**

For the hackathon demo, optimize desktop first.

---

## Exact happy-path demo flow

This is the flow I would script for the 60-second video.

### 0–8 seconds

Open landing page.

Click **Try sample room**.

Sample room loads: empty bedroom photo.

Goal text is prefilled:

**“Create a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly. Everything should arrive before Friday.”**

Click:

**Build my room plan**

### 8–15 seconds

Agent asks:

**“Do you know the approximate room size?”**

Click:

**Medium: about 12 × 12 ft**

Agent begins.

### 15–35 seconds

Show Agent Workspace.

The checklist animates:

Analyzing room

Searching catalog

Checking fit

Summarizing reviews

Checking delivery

Comparing alternatives

Rejecting poor fits

Important visual:

Show 2–3 rejected items.

Example:

**Rejected platform storage bed: drawer clearance risk.**

**Rejected solid wood bed: high assembly effort.**

**Rejected oversized rug: blocks closet path.**

### 35–48 seconds

Final room plan appears.

Show:

**Total: $1,384 / $1,500**

**Fit confidence: 92%**

**All core items arrive by Friday**

**7 items selected**

Click the **Fit** tab and show a simple layout diagram.

### 48–56 seconds

User types:

**“Make it more hotel-like but stay under budget.”**

Agent swaps bedding and lamps only.

Show Plan Diff:

**New total: $1,428**

**Still under budget**

**Still arrives by Friday**

### 56–60 seconds

Click **Add all to cart**.

Show final decision receipt.

End line:

**“From photo to verified cart in under a minute.”**

---

## MVP feature set for the hackathon

Build only what supports the demo.

Must have:

A room photo upload or sample photo

Goal input

One clarification question

Agent activity checklist

Mock tool calls

Product recommendation cards

Budget total

Fit check

Delivery check

Review summary

Rejected alternatives

Revision request with plan diff

Final cart summary

Skip for MVP:

Real checkout

Real room measurement

Real AR placement

Real Wayfair inventory integration

Complex authentication

Multi-room flows

User accounts

The hackathon version should feel complete, even if powered by mock catalog data.

---

## Suggested mock tools

These are the tools I would expose to the agent:

```ts
analyze_room_photo(image): RoomAnalysis
```

Returns style, likely room type, colors, lighting, spatial constraints.

```ts
create_design_brief(userGoal, roomAnalysis, userConstraints): DesignBrief
```

Turns vague user input into structured requirements.

```ts
search_catalog(criteria): Product[]
```

Finds candidate products from mock data.

```ts
check_product_fit(roomDimensions, productDimensions, placementRules): FitResult
```

Verifies layout feasibility.

```ts
summarize_reviews(productId, reviewSnippets): ReviewSummary
```

Extracts pros, cons, and risk flags.

```ts
check_delivery(productId, deadline): DeliveryResult
```

Checks whether each item arrives on time.

```ts
rank_room_plan(candidates, constraints): RankedPlan
```

Scores complete combinations.

```ts
generate_cart(plan): CartSummary
```

Produces the final cart and explanation.

```ts
revise_plan(currentPlan, userRequest): PlanDiff
```

Changes only the affected parts of the plan.

---

## Product scoring logic

To make the recommendations look intelligent, score each product with a simple weighted rubric.

Example:

```text
Final score =
  30% style match
+ 25% fit confidence
+ 20% budget efficiency
+ 15% delivery feasibility
+ 10% review quality
- assembly penalty
- return-risk penalty
```

Show this in simplified form on product cards:

**Style: 9/10**

**Fit: 10/10**

**Delivery: 8/10**

**Reviews: 8/10**

This makes the agent’s reasoning concrete.

---

## Recommended screens to implement

You only need five screens or states.

### Screen 1: Landing

Purpose: explain the product and start the demo.

Main CTA:

**Design my room**

Backup CTA:

**Try sample room**

### Screen 2: Room Brief

Purpose: collect photo, budget, style goal, and constraints.

Main CTA:

**Build my room plan**

### Screen 3: Clarification

Purpose: ask for approximate room size.

Main CTA options:

**Small**

**Medium**

**Large**

**Not sure**

### Screen 4: Agent Workspace

Purpose: show agentic execution.

Must include:

Checklist

Tool calls

Rejected alternatives

Live status

### Screen 5: Verified Room Plan

Purpose: show final cart, verification, and revision.

Must include:

Summary card

Product cards

Fit/Budget/Delivery/Reviews tabs

Revision chat

Add all to cart CTA

Decision receipt

---

## Best UI details to make it feel polished

Use badges everywhere:

**Fits room**

**Under budget**

**Arrives Friday**

**Low assembly**

**Review verified**

**Agent approved**

Use confidence cards:

**Fit confidence: 92%**

**Budget confidence: 100%**

**Delivery confidence: 87%**

Use “rejected alternatives” to show judgment:

A basic recommender says what it picked.

An agent says what it refused to pick and why.

Use progressive disclosure:

Do not show raw logs by default. Show clean checklist items, with “View tool call” expanders for judges who want technical depth.

Use a final receipt:

The decision receipt is your proof that this is an agentic workflow, not a static shopping page.

---

## Ideal demo user story

**Maya just moved into a new apartment and needs to turn an empty spare room into a guest bedroom before her parents visit this weekend. She has a $1,500 budget, does not want heavy assembly, and needs everything delivered by Friday. She uploads one room photo and gives the agent that goal. The agent analyzes the room, asks for an approximate size, builds a plan, checks fit, checks delivery, reads reviews, rejects risky products, and creates a complete cart. Maya asks for a more hotel-like look, and the agent revises only the relevant items while preserving budget and delivery constraints. She adds the verified room plan to cart.**

That is the full journey: vague intent → structured brief → autonomous planning → verified cart → controlled revision → action.
