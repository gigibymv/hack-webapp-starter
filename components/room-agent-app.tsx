"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useRef, useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "landing" | "brief" | "clarify" | "workspace" | "plan";

interface RoomBrief {
  goal: string;
  budget: number;
  roomType: string;
  constraints: string[];
  photoFile: File | null;
  photoUrl: string | null;
}

interface RoomPlanItem {
  id: string;
  name: string;
  price: number;
  category: string;
  purpose: "Foundation" | "Function" | "Comfort" | "Finishing";
  deliveryDay: string;
  assemblyEase: "easy" | "medium" | "hard";
  fitScore: number;
  styleScore: number;
  reviewScore: number;
  whySelected: string;
  dimensions?: { w: number; d: number; h: number };
}

interface RoomPlan {
  planReady: boolean;
  items: RoomPlanItem[];
  rejected: { name: string; reason: string; constraintViolated?: "budget" | "dimensions" | "assembly" | "delivery" | "aesthetic" }[];
  summary: {
    total: number;
    budget: number;
    fitConfidence: number;
    deliveryStatus: string;
    assemblyRisk: string;
    itemCount: number;
    styleMatch: string;
  };
  decisionReceipt: {
    goalInterpreted: string;
    constraintsUsed: string[];
    toolsUsed: string[];
    itemsSelected: number;
    itemsRejected: number;
    checksPassed: string[];
  };
}

interface PlanDiff {
  removed: { name: string; price: number }[];
  added: { name: string; price: number }[];
  newTotal: number;
  priceDelta: number;
  checksPreserved: string[];
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_BRIEF: RoomBrief = {
  goal: "Create a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly. Everything should arrive before Friday.",
  budget: 1500,
  roomType: "Bedroom",
  constraints: ["avoid-assembly", "delivery-date"],
  photoFile: null,
  photoUrl: "/sample-room.jpg",
};

const CHECKLIST_STEPS = [
  "Analyzing room photo",
  "Extracting design constraints",
  "Planning essential items",
  "Searching catalog",
  "Checking dimensions & fit",
  "Checking budget",
  "Reading reviews",
  "Checking delivery timing",
  "Comparing alternatives",
  "Finalizing cart",
];

// ─── Utils ────────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractRoomPlan(messages: UIMessage[]): RoomPlan | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "text") {
        const match = part.text.match(/```room-plan\n([\s\S]*?)```/);
        if (match) {
          try {
            return JSON.parse(match[1]) as RoomPlan;
          } catch {}
        }
      }
    }
  }
  return null;
}

function extractPlanDiff(messages: UIMessage[]): PlanDiff | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "text") {
        const match = part.text.match(/```plan-diff\n([\s\S]*?)```/);
        if (match) {
          try {
            return JSON.parse(match[1]) as PlanDiff;
          } catch {}
        }
      }
    }
  }
  return null;
}

function getMessageText(messages: UIMessage[]): string[] {
  const texts: string[] = [];
  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts) {
      if (part.type === "text") {
        // Strip code blocks for display
        const cleaned = part.text
          .replace(/```room-plan[\s\S]*?```/g, "")
          .replace(/```plan-diff[\s\S]*?```/g, "")
          .trim();
        if (cleaned) texts.push(cleaned);
      }
    }
  }
  return texts;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ label, variant = "green" }: { label: string; variant?: "green" | "orange" | "yellow" | "red" | "gray" }) {
  const colors = {
    green: "bg-emerald-950 text-emerald-400 border-emerald-800",
    orange: "bg-orange-950 text-orange-400 border-orange-800",
    yellow: "bg-yellow-950 text-yellow-400 border-yellow-800",
    red: "bg-red-950 text-red-400 border-red-800",
    gray: "bg-zinc-900 text-zinc-400 border-zinc-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {label}
    </span>
  );
}

// ─── Screen 1: Landing ────────────────────────────────────────────────────────

function LandingScreen({ onStart, onSample }: { onStart: () => void; onSample: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#FF5C28] flex items-center justify-center text-black font-bold text-sm">D</div>
            <span className="font-semibold text-white">Design-to-Door</span>
            <span className="text-zinc-500 text-sm">by Wayfair</span>
          </div>
          <div className="flex gap-2">
            <Badge label="Powered by Subconscious" variant="orange" />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Left: hero */}
        <div className="flex flex-1 flex-col justify-center px-8 py-16 lg:px-16 lg:max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5C28] mb-4">
            Consumer Shopping · Wayfair Hackathon
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white mb-6">
            Design a room<br />that actually fits.
          </h1>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-md">
            Upload a photo, set your budget, and let our agent build a verified Wayfair cart with furniture that fits your room, style, delivery needs, and constraints.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {["Budget checked", "Dimensions checked", "Delivery checked", "Reviews summarized", "Alternatives compared"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-zinc-300">
                <span className="text-emerald-400">✓</span> {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onStart}
              className="rounded-xl bg-[#FF5C28] px-6 py-3 text-sm font-semibold text-black hover:bg-[#ff7347] transition"
            >
              Start with a room photo
            </button>
            <button
              onClick={onSample}
              className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white hover:border-[#FF5C28] hover:text-[#FF5C28] transition"
            >
              Try sample room
            </button>
          </div>
        </div>

        {/* Right: mock preview */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-zinc-950 border-l border-zinc-800 p-12">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-black p-6 shadow-2xl">
            <div className="mb-4 h-32 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm border border-zinc-800">
              📷 Room photo
            </div>
            <div className="mb-3 text-sm font-medium text-white">Cozy Guest Bedroom Plan</div>
            <div className="mb-4 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="rounded-lg bg-emerald-950 border border-emerald-800 p-2">
                <div className="text-emerald-400 font-semibold">$1,384</div>
                <div className="text-zinc-500">of $1,500</div>
              </div>
              <div className="rounded-lg bg-blue-950 border border-blue-800 p-2">
                <div className="text-blue-400 font-semibold">92%</div>
                <div className="text-zinc-500">fit score</div>
              </div>
              <div className="rounded-lg bg-purple-950 border border-purple-800 p-2">
                <div className="text-purple-400 font-semibold">Friday</div>
                <div className="text-zinc-500">delivery</div>
              </div>
            </div>
            <div className="space-y-2">
              {["Queen Upholstered Bed — $389", "Memory Foam Mattress — $299", "Nightstand Set (×2) — $178"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="text-emerald-400">✓</span> {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#FF5C28] py-2 text-center text-xs font-semibold text-black">
              Add all to cart
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Screen 2: Room Brief ─────────────────────────────────────────────────────

function RoomBriefScreen({
  brief,
  setBrief,
  onSubmit,
}: {
  brief: RoomBrief;
  setBrief: (b: RoomBrief) => void;
  onSubmit: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleConstraint = (c: string) => {
    const has = brief.constraints.includes(c);
    setBrief({
      ...brief,
      constraints: has ? brief.constraints.filter((x) => x !== c) : [...brief.constraints, c],
    });
  };

  const constraintList = [
    { id: "avoid-assembly", label: "Avoid heavy assembly" },
    { id: "pet-friendly", label: "Pet-friendly materials" },
    { id: "kid-friendly", label: "Kid-friendly" },
    { id: "small-space", label: "Small-space friendly" },
    { id: "sustainable", label: "Prefer sustainable" },
    { id: "delivery-date", label: "Must arrive by Friday" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#FF5C28] flex items-center justify-center text-black font-bold text-xs">D</div>
          <span className="text-sm font-medium text-zinc-400">Room Brief</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">Tell us about your room</h2>
        <p className="text-zinc-400 mb-8">The more detail you give, the better the plan.</p>

        <div className="space-y-6">
          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Room photo</label>
            {brief.photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brief.photoUrl} alt="Room" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 flex gap-2 text-xs">
                  <Badge label="Photo loaded" variant="green" />
                </div>
                <button
                  onClick={() => setBrief({ ...brief, photoFile: null, photoUrl: null })}
                  className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-zinc-300 hover:text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 py-10 hover:border-[#FF5C28] hover:text-[#FF5C28] transition text-zinc-400"
              >
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm font-medium">Upload room photo</span>
                <span className="text-xs text-zinc-600 mt-1">JPG, PNG up to 10MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await fileToDataUrl(file);
                  setBrief({ ...brief, photoFile: file, photoUrl: url });
                }
              }}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">What are you trying to create?</label>
            <textarea
              value={brief.goal}
              onChange={(e) => setBrief({ ...brief, goal: e.target.value })}
              rows={3}
              placeholder="e.g. Turn this empty room into a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#FF5C28] focus:outline-none"
            />
          </div>

          {/* Budget + Room type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Max budget ($)</label>
              <input
                type="number"
                value={brief.budget}
                onChange={(e) => setBrief({ ...brief, budget: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-[#FF5C28] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Room type</label>
              <select
                value={brief.roomType}
                onChange={(e) => setBrief({ ...brief, roomType: e.target.value })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-[#FF5C28] focus:outline-none"
              >
                {["Bedroom", "Living Room", "Office", "Dining Room", "Nursery", "Entryway"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">Preferences & constraints</label>
            <div className="flex flex-wrap gap-2">
              {constraintList.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleConstraint(id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    brief.constraints.includes(id)
                      ? "border-[#FF5C28] bg-[#FF5C28]/10 text-[#FF5C28]"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {brief.constraints.includes(id) ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={!brief.goal.trim()}
            className="w-full rounded-xl bg-[#FF5C28] py-3 text-sm font-semibold text-black hover:bg-[#ff7347] disabled:opacity-40 transition"
          >
            Build my room plan →
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Screen 3: Clarify ────────────────────────────────────────────────────────

function ClarifyScreen({ onSelect }: { onSelect: (size: string) => void }) {
  const options = [
    { label: "Small", sub: "about 10 × 10 ft", value: "10x10" },
    { label: "Medium", sub: "about 12 × 12 ft", value: "12x12" },
    { label: "Large", sub: "14 × 16 ft or more", value: "14x16" },
    { label: "Not sure", sub: "use safe compact choices", value: "11x11" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#FF5C28]/20 border border-[#FF5C28]/40 flex items-center justify-center">
            <span className="text-[#FF5C28] text-xs">?</span>
          </div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Agent asking</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Do you know the approximate room size?</h2>
        <p className="text-sm text-zinc-400 mb-8">This helps me choose furniture that fits with proper clearance on all sides.</p>
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="flex flex-col items-start rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-left hover:border-[#FF5C28] hover:bg-[#FF5C28]/5 transition group"
            >
              <span className="text-sm font-semibold text-white group-hover:text-[#FF5C28]">{opt.label}</span>
              <span className="text-xs text-zinc-500 mt-0.5">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Checklist step ───────────────────────────────────────────────────────────

function ChecklistStep({ label, state }: { label: string; state: "pending" | "running" | "done" | "skipped" }) {
  return (
    <div className={`flex items-center gap-3 py-2 text-sm transition-all ${state === "pending" ? "text-zinc-600" : state === "running" ? "text-white" : "text-zinc-400"}`}>
      <div className="w-5 flex-shrink-0 flex items-center justify-center">
        {state === "done" && <span className="text-emerald-400 text-xs">✓</span>}
        {state === "running" && <span className="inline-block h-3 w-3 rounded-full bg-[#FF5C28] animate-pulse" />}
        {state === "pending" && <span className="inline-block h-2 w-2 rounded-full bg-zinc-700" />}
      </div>
      {label}
    </div>
  );
}

// ─── Tool call display ────────────────────────────────────────────────────────

function ToolCallBadge({ part, index, messageId }: { part: UIMessage["parts"][number]; index: number; messageId: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!part.type.startsWith("tool-")) return null;
  const label = part.type.replace("tool-", "");
  const state = "state" in part ? part.state : "unknown";
  const isRunning = state === "input-available";
  const isDone = state === "output-available";

  return (
    <div key={`${messageId}-tool-${index}`} className="my-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 rounded-lg border border-[#FF5C28]/20 bg-[#FF5C28]/5 px-3 py-2 text-xs text-left hover:border-[#FF5C28]/40 transition"
      >
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isRunning ? "bg-[#FF5C28] animate-pulse" : isDone ? "bg-emerald-500" : "bg-zinc-600"}`} />
        <span className="font-mono text-[#FF5C28]">{label}</span>
        <span className="text-zinc-500 ml-auto">{isRunning ? "running…" : isDone ? "done" : "error"} {expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && "input" in part && part.input != null && (
        <div className="mt-1 rounded-b-lg bg-zinc-950 border border-zinc-800 border-t-0 px-3 py-2">
          <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(part.input as Record<string, unknown>, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Screen 4: Workspace ──────────────────────────────────────────────────────

function WorkspaceScreen({
  messages,
  isBusy,
  onPlanReady,
}: {
  messages: UIMessage[];
  isBusy: boolean;
  onPlanReady: () => void;
}) {
  const agentTexts = getMessageText(messages);
  const plan = extractRoomPlan(messages);

  // Count tool calls for checklist animation
  const toolCalls = messages.flatMap((m) =>
    m.parts.filter((p) => p.type.startsWith("tool-"))
  );
  const doneCount = toolCalls.filter((p) => "state" in p && p.state === "output-available").length;

  useEffect(() => {
    if (plan) {
      const t = setTimeout(onPlanReady, 800);
      return () => clearTimeout(t);
    }
  }, [plan, onPlanReady]);

  const getStepState = (i: number): "pending" | "running" | "done" => {
    const stepsPerCall = CHECKLIST_STEPS.length / 9;
    const doneThreshold = Math.floor(i / stepsPerCall);
    if (doneCount > doneThreshold + 1) return "done";
    if (doneCount === doneThreshold + 1 || (doneCount === doneThreshold && isBusy)) return "running";
    return "pending";
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white overflow-hidden">
      <header className="border-b border-zinc-800 px-6 py-3 flex-shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[#FF5C28] flex items-center justify-center text-black font-bold text-xs">D</div>
            <span className="text-sm font-medium text-zinc-300">Agent Workspace</span>
          </div>
          {isBusy && (
            <div className="flex items-center gap-2 text-xs text-[#FF5C28]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#FF5C28]" />
              Agent running…
            </div>
          )}
          {plan && (
            <Badge label="Plan ready!" variant="green" />
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden mx-auto w-full max-w-7xl">
        {/* Left: agent messages */}
        <div className="w-72 flex-shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden glass-panel">
          <div className="px-4 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Log</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {agentTexts.length === 0 && isBusy && (
              <p className="text-xs text-zinc-600">Starting up…</p>
            )}
            {agentTexts.map((text, i) => (
              <div key={i} className="glass-card rounded-lg px-3 py-2 text-xs text-zinc-300 leading-relaxed">
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Center: checklist + tool calls */}
        <div className={`flex-1 flex flex-col overflow-hidden border-r border-zinc-800 glass-panel ${isBusy ? "agent-active-border" : ""}`}>
          <div className="px-4 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Activity</div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Checklist */}
            <div className="mb-4">
              {CHECKLIST_STEPS.map((step, i) => (
                <ChecklistStep key={step} label={step} state={getStepState(i)} />
              ))}
            </div>

            {/* Tool calls */}
            {messages.flatMap((msg) =>
              msg.parts.map((part, idx) =>
                part.type.startsWith("tool-") ? (
                  <ToolCallBadge key={`${msg.id}-${idx}`} part={part} index={idx} messageId={msg.id} />
                ) : null
              )
            )}

            {/* Rejections preview — typed by constraint violated */}
            {plan?.rejected && plan.rejected.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Rejected</div>
                {plan.rejected.map((r) => {
                  const cv = r.constraintViolated ?? "aesthetic";
                  const cvClass = `rejection-${cv}`;
                  const cvLabel: Record<string, string> = {
                    dimensions: "Fit", assembly: "Assembly", budget: "Budget",
                    delivery: "Delivery", aesthetic: "Style",
                  };
                  return (
                    <div key={r.name} className={`rounded-lg border px-3 py-2 text-xs ${cvClass}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">✗ {r.name}</span>
                        <span className="text-xs opacity-70 ml-2 uppercase tracking-wider">{cvLabel[cv]}</span>
                      </div>
                      <div className="opacity-70 mt-0.5">{r.reason}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: evolving plan preview */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden glass-panel">
          <div className="px-4 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">Room Plan</div>
          <div className="flex-1 overflow-y-auto p-4">
            {!plan && (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600">
                <div className="text-4xl mb-3">🛋️</div>
                <p className="text-sm">Building your plan…</p>
              </div>
            )}
            {plan && (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-800 bg-emerald-950/30 p-4">
                  <div className="text-sm font-semibold text-white mb-3">Cozy Guest Bedroom Plan</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Total</span>
                      <div className="font-semibold text-emerald-400">${plan.summary.total.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Budget</span>
                      <div className="font-semibold text-zinc-300">${plan.summary.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Fit confidence</span>
                      <div className="font-semibold text-blue-400">{plan.summary.fitConfidence}%</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Items</span>
                      <div className="font-semibold text-zinc-300">{plan.summary.itemCount}</div>
                    </div>
                  </div>
                </div>
                {plan.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs">
                    <div className="font-medium text-zinc-200 truncate">{item.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-zinc-500">{item.category}</span>
                      <span className="text-emerald-400 font-medium">${item.price}</span>
                    </div>
                  </div>
                ))}
                {plan.items.length > 4 && (
                  <div className="text-xs text-zinc-600 text-center">+{plan.items.length - 4} more items…</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Verified Room Plan ─────────────────────────────────────────────

function PlanScreen({
  plan,
  diff,
  messages,
  isBusy,
  onRevise,
  brief,
}: {
  plan: RoomPlan;
  diff: PlanDiff | null;
  messages: UIMessage[];
  isBusy: boolean;
  onRevise: (text: string) => void;
  brief: RoomBrief;
}) {
  const [activeTab, setActiveTab] = useState<"fit" | "budget" | "delivery" | "reviews" | "alternatives">("fit");
  const [reviseInput, setReviseInput] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  const purposeGroups: Record<string, RoomPlanItem[]> = {};
  for (const item of plan.items) {
    const g = item.purpose || "Other";
    if (!purposeGroups[g]) purposeGroups[g] = [];
    purposeGroups[g].push(item);
  }

  const budgetCategories = [
    { label: "Furniture", portion: 0.58, color: "bg-[#FF5C28]" },
    { label: "Textiles", portion: 0.25, color: "bg-blue-500" },
    { label: "Lighting & Decor", portion: 0.12, color: "bg-purple-500" },
    { label: "Other", portion: 0.05, color: "bg-zinc-500" },
  ];

  const agentTexts = getMessageText(messages);
  const latestAgentMsg = agentTexts[agentTexts.length - 1];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4 sticky top-0 z-10 bg-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-[#FF5C28] flex items-center justify-center text-black font-bold text-xs">D</div>
            <span className="text-sm font-medium text-zinc-300">Your Verified Room Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={`${plan.summary.fitConfidence}% fit`} variant="green" />
            <Badge label={plan.summary.deliveryStatus.includes("time") ? "Arrives on time" : "All arrive Friday"} variant="green" />
            <Badge label={`$${plan.summary.total.toLocaleString()} of $${plan.summary.budget.toLocaleString()}`} variant="orange" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Chat + revision */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Agent</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {latestAgentMsg && (
                  <p className="text-sm text-zinc-300 leading-relaxed">{latestAgentMsg}</p>
                )}
                {diff && (
                  <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 p-3 text-xs">
                    <div className="text-blue-400 font-medium mb-2">Plan updated</div>
                    {diff.removed.map((r) => (
                      <div key={r.name} className="text-red-400">− {r.name} (${r.price})</div>
                    ))}
                    {diff.added.map((a) => (
                      <div key={a.name} className="text-emerald-400">+ {a.name} (${a.price})</div>
                    ))}
                    <div className="mt-2 text-zinc-400">
                      New total: <span className="text-white font-medium">${diff.newTotal.toLocaleString()}</span>
                      {diff.priceDelta !== 0 && (
                        <span className={`ml-2 ${diff.priceDelta > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          ({diff.priceDelta > 0 ? "+" : ""}${diff.priceDelta})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {diff.checksPreserved.map((c) => <Badge key={c} label={`${c} ✓`} variant="green" />)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Revision input */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Request a change</div>
              <div className="space-y-2">
                {["Make it more hotel-like", "Get it under $1,200", "I don't like the rug"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviseInput(s)}
                    className="w-full text-left rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:border-[#FF5C28] hover:text-[#FF5C28] transition"
                  >
                    "{s}"
                  </button>
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    value={reviseInput}
                    onChange={(e) => setReviseInput(e.target.value)}
                    placeholder="Or type your own…"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#FF5C28] focus:outline-none"
                    disabled={isBusy}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && reviseInput.trim()) {
                        onRevise(reviseInput.trim());
                        setReviseInput("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (reviseInput.trim()) {
                        onRevise(reviseInput.trim());
                        setReviseInput("");
                      }
                    }}
                    disabled={isBusy || !reviseInput.trim()}
                    className="rounded-lg bg-[#FF5C28] px-3 py-2 text-xs font-medium text-black hover:bg-[#ff7347] disabled:opacity-40"
                  >
                    {isBusy ? "…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Center + Right: Plan content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary card */}
            <div className="rounded-xl glass-panel p-5">
              <h2 className="text-xl font-bold text-white mb-4">
                {brief.roomType} Plan
                <span className="ml-2 text-zinc-500 text-sm font-normal">{plan.summary.styleMatch}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-zinc-900 p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">${plan.summary.total.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500 mt-1">of ${plan.summary.budget.toLocaleString()} budget</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{plan.summary.fitConfidence}%</div>
                  <div className="text-xs text-zinc-500 mt-1">fit confidence</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">Friday</div>
                  <div className="text-xs text-zinc-500 mt-1">all items arrive</div>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3 text-center">
                  <div className="text-2xl font-bold text-zinc-200">{plan.summary.itemCount}</div>
                  <div className="text-xs text-zinc-500 mt-1">items selected</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-xl glass-panel overflow-hidden">
              <div className="flex border-b border-zinc-800">
                {(["fit", "budget", "delivery", "reviews", "alternatives"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-xs font-medium capitalize transition ${
                      activeTab === tab
                        ? "bg-[#FF5C28]/10 text-[#FF5C28] border-b-2 border-[#FF5C28]"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === "fit" && (
                  <div>
                    {/* Simple room diagram */}
                    <div className="relative mx-auto mb-5 rounded-xl border border-zinc-700 bg-zinc-900" style={{ width: 280, height: 280 }}>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">12 × 12 ft</div>
                      {/* Bed */}
                      <div className="absolute bg-blue-900/60 border border-blue-700 rounded-lg flex items-center justify-center text-xs text-blue-300"
                        style={{ left: "20%", top: "15%", width: "60%", height: "45%" }}>
                        Queen Bed
                      </div>
                      {/* Nightstands */}
                      <div className="absolute bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-500 flex items-center justify-center"
                        style={{ left: "4%", top: "20%", width: "14%", height: "16%" }}>NS</div>
                      <div className="absolute bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-500 flex items-center justify-center"
                        style={{ right: "4%", top: "20%", width: "14%", height: "16%" }}>NS</div>
                      {/* Rug */}
                      <div className="absolute border-2 border-dashed border-amber-800/60 rounded"
                        style={{ left: "8%", top: "12%", width: "84%", height: "62%" }} />
                      {/* Labels */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 text-xs text-zinc-600">
                        <span>← 30&quot; clearance →</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <span>✓</span> 30 in walkway clearance on both sides
                      </div>
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                        <span>✓</span> Bed length leaves 36 in foot clearance
                      </div>
                      <div className="flex items-center gap-2 text-sm text-yellow-400">
                        <span>⚠</span> Rug may extend close to closet path — monitor placement
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "budget" && (
                  <div className="space-y-4">
                    {budgetCategories.map((cat) => {
                      const amount = Math.round(plan.summary.total * cat.portion);
                      const pct = Math.round((amount / plan.summary.budget) * 100);
                      return (
                        <div key={cat.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-zinc-300">{cat.label}</span>
                            <span className="text-zinc-400">${amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-800">
                            <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t border-zinc-800 flex justify-between text-sm font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-emerald-400">${plan.summary.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Remaining budget</span>
                      <span className="text-zinc-300">${(plan.summary.budget - plan.summary.total).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {activeTab === "delivery" && (
                  <div className="space-y-3">
                    {plan.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-3">
                        <span className="text-sm text-zinc-300 truncate max-w-[60%]">{item.name}</span>
                        <Badge label={item.deliveryDay} variant="green" />
                      </div>
                    ))}
                    <div className="pt-3 flex items-center gap-2 text-sm text-emerald-400">
                      <span>✓</span> {plan.summary.deliveryStatus}
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {plan.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-zinc-200 leading-tight">{item.name}</span>
                          <div className="flex gap-1 ml-2">
                            {["Style", "Fit", "Reviews"].map((label, i) => {
                              const scores = [item.styleScore, item.fitScore, item.reviewScore];
                              return (
                                <div key={label} className="text-center text-xs">
                                  <div className="text-zinc-500">{label}</div>
                                  <div className="font-medium text-zinc-200">{scores[i]}/10</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{item.whySelected}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "alternatives" && (
                  <div className="space-y-3">
                    {plan.rejected.map((r) => {
                      const cv = r.constraintViolated ?? "aesthetic";
                      const cvClass = `rejection-${cv}`;
                      const cvLabel: Record<string, string> = {
                        dimensions: "Fit failure", assembly: "Assembly risk",
                        budget: "Over budget", delivery: "Late delivery", aesthetic: "Style mismatch",
                      };
                      return (
                        <div key={r.name} className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${cvClass}`}>
                          <span className="mt-0.5">✗</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{r.name}</div>
                            <div className="text-xs opacity-70 mt-0.5">{r.reason}</div>
                          </div>
                          <span className="text-xs opacity-50 uppercase tracking-wider flex-shrink-0">{cvLabel[cv]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Product cards */}
            <div className="space-y-4">
              {Object.entries(purposeGroups).map(([purpose, items]) => (
                <div key={purpose}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">{purpose}</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="rounded-xl glass-card p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <span className="text-sm font-semibold text-white leading-tight">{item.name}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{item.whySelected}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge label={`Arrives ${item.deliveryDay}`} variant="green" />
                              <Badge label={item.assemblyEase === "easy" ? "Low assembly" : item.assemblyEase === "medium" ? "Medium assembly" : "Heavy assembly"} variant={item.assemblyEase === "easy" ? "green" : item.assemblyEase === "medium" ? "yellow" : "red"} />
                              <Badge label={`Fit ${item.fitScore}/10`} variant="gray" />
                              <Badge label={`Reviews ${item.reviewScore}/10`} variant="gray" />
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-lg font-bold text-white">${item.price}</div>
                            {item.dimensions && (item.dimensions.w > 0 || item.dimensions.d > 0) && (
                              <div className="text-xs text-zinc-600 mt-1">{item.dimensions.w}"W × {item.dimensions.d}"D</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Decision receipt */}
            <div>
              <button
                onClick={() => setShowReceipt(!showReceipt)}
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-400 hover:border-[#FF5C28] hover:text-[#FF5C28] transition text-left flex items-center justify-between"
              >
                <span>Agent decision receipt</span>
                <span>{showReceipt ? "▲" : "▼"}</span>
              </button>
              {showReceipt && (
                <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 text-sm">
                  <div><span className="text-zinc-500">Goal interpreted: </span><span className="text-zinc-200">{plan.decisionReceipt.goalInterpreted}</span></div>
                  <div><span className="text-zinc-500">Constraints: </span><span className="text-zinc-200">{plan.decisionReceipt.constraintsUsed.join(", ")}</span></div>
                  <div><span className="text-zinc-500">Tools used: </span><span className="text-zinc-200">{plan.decisionReceipt.toolsUsed.join(", ")}</span></div>
                  <div><span className="text-zinc-500">Items selected: </span><span className="text-zinc-200">{plan.decisionReceipt.itemsSelected}</span></div>
                  <div><span className="text-zinc-500">Items rejected: </span><span className="text-zinc-200">{plan.decisionReceipt.itemsRejected}</span></div>
                  <div className="space-y-1">
                    {plan.decisionReceipt.checksPassed.map((c) => (
                      <div key={c} className="flex items-center gap-2 text-emerald-400 text-xs">
                        <span>✓</span> {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="rounded-xl glass-panel p-5">
              <p className="text-sm text-zinc-400 mb-4">Your room is ready. I verified fit, budget, delivery, assembly effort, and review risks.</p>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl bg-[#FF5C28] px-6 py-3 text-sm font-semibold text-black hover:bg-[#ff7347] transition">
                  Add all to cart ({plan.summary.itemCount} items)
                </button>
                <button className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 transition">
                  Save room plan
                </button>
                <button className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 transition">
                  Share with partner
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export function RoomAgentApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [brief, setBrief] = useState<RoomBrief>({
    goal: "",
    budget: 1500,
    roomType: "Bedroom",
    constraints: [],
    photoFile: null,
    photoUrl: null,
  });
  const [roomSize, setRoomSize] = useState("12x12");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { mode: "room" } }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({ transport });
  const isBusy = status === "streaming" || status === "submitted";

  const plan = extractRoomPlan(messages);
  const diff = extractPlanDiff(messages);

  function buildPrompt(b: RoomBrief, size: string) {
    const constraintLabels: Record<string, string> = {
      "avoid-assembly": "avoid heavy assembly",
      "pet-friendly": "pet-friendly materials",
      "kid-friendly": "kid-friendly materials",
      "small-space": "small-space friendly",
      sustainable: "prefer sustainable materials",
      "delivery-date": "everything must arrive by Friday",
    };
    const constraintStr =
      b.constraints.length > 0
        ? b.constraints.map((c) => constraintLabels[c] || c).join(", ")
        : "no special constraints";

    return `Design brief:
Goal: ${b.goal}
Room type: ${b.roomType}
Room size: ${size}
Max budget: $${b.budget}
Constraints: ${constraintStr}
Photo: ${b.photoFile ? b.photoFile.name : b.photoUrl ? "sample-room.jpg" : "no photo"}

Please analyze the room, build a verified room plan, and present the final plan as a room-plan JSON block.`;
  }

  async function handleBriefSubmit() {
    setScreen("clarify");
  }

  async function handleRoomSizeSelect(size: string) {
    setRoomSize(size);
    setScreen("workspace");

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; mediaType: string; url: string; filename?: string }
    > = [];

    if (brief.photoUrl && brief.photoFile) {
      const dataUrl = await fileToDataUrl(brief.photoFile);
      parts.push({ type: "file", mediaType: brief.photoFile.type || "image/jpeg", url: dataUrl, filename: brief.photoFile.name });
    } else if (brief.photoUrl) {
      // sample room — send as text description
    }

    parts.push({ type: "text", text: buildPrompt(brief, size) });
    sendMessage({ parts });
  }

  function handleRevise(text: string) {
    sendMessage({ parts: [{ type: "text", text }] });
  }

  // Landing → use sample
  function handleSample() {
    setBrief(SAMPLE_BRIEF);
    setScreen("clarify");
  }

  return (
    <>
      {screen === "landing" && (
        <LandingScreen onStart={() => setScreen("brief")} onSample={handleSample} />
      )}
      {screen === "brief" && (
        <RoomBriefScreen brief={brief} setBrief={setBrief} onSubmit={handleBriefSubmit} />
      )}
      {screen === "clarify" && (
        <ClarifyScreen onSelect={handleRoomSizeSelect} />
      )}
      {screen === "workspace" && (
        <WorkspaceScreen
          messages={messages}
          isBusy={isBusy}
          onPlanReady={() => setScreen("plan")}
        />
      )}
      {screen === "plan" && plan && (
        <PlanScreen
          plan={plan}
          diff={diff}
          messages={messages}
          isBusy={isBusy}
          onRevise={handleRevise}
          brief={brief}
        />
      )}
      {/* Debug stop */}
      {isBusy && screen === "workspace" && (
        <button
          onClick={stop}
          className="fixed bottom-4 right-4 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-400 hover:text-white z-50"
        >
          Stop agent
        </button>
      )}
    </>
  );
}
