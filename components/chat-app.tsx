"use client";

import React, { useState, useEffect, useRef } from "react";
import { MOCK_CATALOG, type Product } from "@/lib/tools/catalog";

type DemoState = "landing" | "brief" | "clarify" | "workspace" | "plan" | "revised";
type Tab = "fit" | "budget" | "delivery" | "reviews" | "alternatives";

export function ChatApp() {
  const [currentState, setCurrentState] = useState<DemoState>("landing");
  const [activeTab, setActiveTab] = useState<Tab>("fit");

  // Brief options
  const [budget, setBudget] = useState(1500);
  const [goalText, setGoalText] = useState("Create a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly. Everything should arrive before Friday.");
  const [roomType, setRoomType] = useState("Bedroom");
  const [avoidAssembly, setAvoidAssembly] = useState(true);
  const [arriveByFriday, setArriveByFriday] = useState(true);
  const [roomSize, setRoomSize] = useState<string>("Medium: about 12 × 12 ft");

  // Revision chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([
    { role: 'assistant', text: "Hello! I am Materia, your premium Design-to-Door project manager. I've verified your room goals against our catalog. Let me know if you would like to test any revisions (e.g. 'Make it more hotel-like but stay under budget')." }
  ]);

  // Demo step animation index
  const [checklistIndex, setChecklistIndex] = useState(-1);
  const [toolLogs, setToolLogs] = useState<string[]>([]);
  const workspaceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checklistItems = [
    { label: "Analyzing room photo...", desc: "Detected cozy warm modern style, neutral beige walls, hardwood oak flooring, strong natural light." },
    { label: "Extracting design constraints...", desc: "Budget cap: $1500. Avoid heavy assembly. Arrive before Friday. Preferred: Queen Bed." },
    { label: "Planning essential items...", desc: "Deciding bundle: Bed frame, Foam mattress, Bedside nightstands, Table lamps, Accent area rug, Duvet set." },
    { label: "Searching catalog...", desc: "Querying 25 mock inventory items matching Cozy-Boho, Warm Neutrals." },
    { label: "Checking physical dimensions...", desc: "Running fitment algorithms for queen dimensions in 12x12 room layout." },
    { label: "Auditing assembly burdens...", desc: "Excluding items labeled 'Hard Assembly' to satisfy user constraints." },
    { label: "Aggregating review sentiments...", desc: "Summarizing thousands of verified buyer ratings and flagging return risks." },
    { label: "Verifying delivery timing...", desc: "Confirming all core items are stocked in Northeast warehouses for Friday arrival." },
    { label: "Comparing alternatives...", desc: "Auditing trade-offs. Rejecting storage drawers due to walkway space collision." },
    { label: "Finalizing shoppable cart...", desc: "Calculating optimal 7-item verified room combination." }
  ];

  const toolOutputs = [
    `analyze_room_photo({ image: "sample_bedroom.png" })\n-> Return: { roomType: "bedroom", style: "cozy-boho", ceilingHeight: "normal" }`,
    `create_design_brief({ budget: 1500, avoidAssembly: true, arrivesBy: "Friday" })\n-> Brief locked.`,
    `search_catalog({ maxPrice: 450, style: "cozy-boho" })\n-> Found 12 matching candidates.`,
    `check_product_fit({ roomSize: "12x12", product: "Urban Drawers Bed" })\n-> WARNING: Drawer clearance risk. Rejected.`,
    `check_product_fit({ roomSize: "12x12", product: "Aria Queen Bed" })\n-> PASSED: 30\" walkway clearance on both sides.`,
    `summarize_reviews({ productId: "bed_101" })\n-> Sentiment: 94% positive. Easy assembly praised.`,
    `check_delivery({ productId: "bed_101", limit: "Friday" })\n-> PASSED: ETA Wednesday.`,
    `rank_room_plan({ items: ["bed_101", "mattress_201", "nightstand_301", "lighting_401", "rug_501", "decor_601", "decor_603"] })\n-> Plan score: 92% (Constraint satisfaction verified).`
  ];

  // Base products (Cozy style)
  const baseCart: Product[] = MOCK_CATALOG.filter(p => 
    ["bed_101", "mattress_201", "nightstand_301", "lighting_401", "rug_501", "decor_601", "decor_603"].includes(p.id)
  );

  // Revised products (Hotel-Luxury style)
  const revisedCart: Product[] = MOCK_CATALOG.filter(p => 
    ["bed_101", "mattress_201", "nightstand_302", "lighting_402", "rug_502", "decor_602", "decor_603"].includes(p.id)
  );

  const [currentCart, setCurrentCart] = useState<Product[]>(baseCart);
  const totalCost = currentCart.reduce((sum, p) => sum + p.price, 0);

  const startWorkspaceAnimation = () => {
    setCurrentState("workspace");
    setChecklistIndex(0);
    setToolLogs([]);

    let step = 0;
    if (workspaceTimerRef.current) clearInterval(workspaceTimerRef.current);

    workspaceTimerRef.current = setInterval(() => {
      step++;
      if (step < checklistItems.length) {
        setChecklistIndex(step);
        if (step % 2 === 0 && (step / 2) - 1 < toolOutputs.length) {
          const logIdx = (step / 2) - 1;
          setToolLogs(prev => [...prev, toolOutputs[logIdx]]);
        }
      } else {
        if (workspaceTimerRef.current) clearInterval(workspaceTimerRef.current);
        setCurrentState("plan");
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (workspaceTimerRef.current) clearInterval(workspaceTimerRef.current);
    };
  }, []);

  const handleRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      if (userMsg.toLowerCase().includes("hotel") || userMsg.toLowerCase().includes("luxury") || userMsg.toLowerCase().includes("like")) {
        setCurrentCart(revisedCart);
        setCurrentState("revised");
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: "I've revised the plan. I swapped out the bohemian-style Jute rug, table lamps, and bedding for their hotel-luxury counterparts (featuring ivory borders, crisp cotton finishes, and elegant brass lamp columns). Your core framework remains preserved, and the new total of $1,428 remains safely under your $1,500 budget limit."
        }]);
      } else {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          text: "I've analyzed your feedback. Swapping items while preserving your Friday arrival schedule and avoiding heavy assembly. Plan adjusted accordingly."
        }]);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen text-[#131d21] bg-[#f1fbff] font-sans selection:bg-[#006b55]/20 selection:text-[#006b55]">
      {/* Styles injector for Material Icons and layouts */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 450, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          vertical-align: middle;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(10px);
        }
        .blueprint-grid {
          background-image: radial-gradient(#c2c7ce 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c2c7ce;
          border-radius: 10px;
        }
      `}</style>

      {/* Shared Header (Design Concierge / Materia by Wayfair) */}
      <header className="w-full sticky top-0 flex justify-between items-center px-10 py-4 h-16 z-50 bg-[#f1fbff] border-b border-[#c5c6ca] backdrop-blur-md bg-white/70">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-[#03060a]">Materia</span>
            <span className="text-xs font-semibold text-zinc-500 bg-[#dfeaef] px-2 py-0.5 rounded border border-[#c2c7ce]">by Wayfair</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <span className="text-[#006b55] cursor-pointer hover:opacity-80">Dashboard</span>
            <span className="text-zinc-600 cursor-pointer hover:text-[#006b55] transition">Projects</span>
            <span className="text-zinc-600 cursor-pointer hover:text-[#006b55] transition">Inspiration</span>
            <span className="text-zinc-600 cursor-pointer hover:text-[#006b55] transition">Resources</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {currentState !== "landing" && (
            <button 
              onClick={() => {
                setCurrentState("landing");
                setCurrentCart(baseCart);
                setChecklistIndex(-1);
                setToolLogs([]);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-full border border-[#c5c6ca] bg-white text-zinc-700 hover:bg-zinc-50 transition"
            >
              Reset Demo
            </button>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full bg-[#e4f0f4] border border-[#c2c7ce] text-zinc-700 flex items-center gap-1.5 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#006b55] animate-pulse" />
            TIM-Qwen3.6-27B Active
          </span>
        </div>
      </header>

      {/* STAGE 1: LANDING STATE */}
      {currentState === "landing" && (
        <main className="max-w-[1280px] mx-auto px-10 py-16 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column Copy */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-[#6dfad2]/20 text-[#005140] px-3 py-1 rounded-full border border-[#006b55]/20">
                <span className="w-2 h-2 rounded-full bg-[#006b55] animate-ping"></span>
                <span className="text-[10px] font-bold tracking-wider uppercase">AI Agent Active</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#03060a] leading-none">
                Design a room that <span className="text-[#006b55]">actually fits</span>.
              </h1>
              <p className="text-base text-zinc-600 leading-relaxed">
                Upload a photo, set your budget, and let our agent build a verified Wayfair cart with furniture that fits your room, style, delivery needs, and constraints.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={() => setCurrentState("brief")}
                  className="bg-[#03060a] text-white px-6 py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  Start with a room photo
                </button>
                <button 
                  onClick={() => {
                    setGoalText("Create a cozy guest bedroom under $1,500. Queen bed preferred. Avoid heavy assembly. Everything should arrive before Friday.");
                    setCurrentState("clarify");
                  }}
                  className="border-2 border-[#03060a] text-[#03060a] px-6 py-4 rounded-lg font-bold hover:bg-[#dfeaef]/40 transition active:scale-[0.98]"
                >
                  Try sample room
                </button>
              </div>

              <div className="pt-6 border-t border-[#c5c6ca]">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AGENT CAPABILITIES</span>
                  <span className="text-[10px] font-bold text-[#006b55] tracking-widest">READY</span>
                </div>
                <div className="w-full h-1 bg-[#dfeaef] rounded-full overflow-hidden">
                  <div className="w-full h-full bg-[#006b55]"></div>
                </div>
              </div>
            </div>

            {/* Right Column Bento Box Preview */}
            <div className="lg:col-span-7 relative">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-[#c2c7ce] bg-white">
                <img 
                  alt="Modern spare room awaiting design"
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA30FWmE8ZXkCQJTLOHZFTzaaVisAEyYzEHf-zH9UMLKYLdK4FMhtmD-RzSR_ZeaPbGpz7hkLmOeHeFhUiLKJr-nilFwAY4ei_FcMTUCDFMLTGL5EmchU9u9gFqwZg4JefRqLpFnGS9F6V0s3z5xGCMoSfvTxOTZ1fP3jMJBsZZKpvZ1GbeqTJWjUj23RVDcWr5DKw6t6K0o3AkBkR5CydDtd5HPfeb2OyzpDikDUPs6FchUHmjmqwM3AnKgcNDVdpWI7OSyHrYgfQ"
                />
                
                {/* Visual Glassmorphic Cart Overlay */}
                <div className="absolute inset-y-0 right-0 w-1/2 glass-panel border-l border-white/40 p-5 flex flex-col justify-between shadow-2xl">
                  <div className="border-b border-[#c5c6ca] pb-2 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-zinc-800">Verified Cart</h3>
                    <span className="bg-[#006b55] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">AI Optimized</span>
                  </div>

                  {/* Cart preview list */}
                  <div className="space-y-3 overflow-y-auto py-2">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded bg-[#e4f0f4] flex-shrink-0 flex items-center justify-center border border-[#c2c7ce]">
                        <span className="text-[10px] font-bold text-zinc-500">CHAIR</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-zinc-800">Elowen Lounge Chair</p>
                        <p className="text-[9px] text-[#006b55] font-semibold">Dimensions Verified</p>
                        <p className="text-[10px] font-bold text-zinc-700 mt-0.5">$849.00</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded bg-[#e4f0f4] flex-shrink-0 flex items-center justify-center border border-[#c2c7ce]">
                        <span className="text-[10px] font-bold text-zinc-500">SOFA</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-zinc-800">Moda Sofa (3-Seater)</p>
                        <p className="text-[9px] text-[#006b55] font-semibold">Fits Entryway (32")</p>
                        <p className="text-[10px] font-bold text-zinc-700 mt-0.5">$1,299.00</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#c5c6ca] pt-3 mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-zinc-500">Total (4 items)</span>
                      <span className="text-base font-extrabold text-[#03060a]">$2,840.00</span>
                    </div>
                    <button className="w-full bg-[#006b55] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#005140] transition flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Checkout on Wayfair
                    </button>
                  </div>
                </div>

                {/* Floating tooltip */}
                <div className="absolute bottom-6 left-6 p-3.5 rounded-xl glass-panel border border-white/50 flex items-center gap-3 shadow-lg max-w-[240px]">
                  <div className="w-8 h-8 rounded-full bg-[#006b55] flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-extrabold text-[#006b55] uppercase tracking-wider">Dimension Scan</p>
                    <p className="text-[11px] text-zinc-800 leading-tight">"The sofa will fit through your 32-inch hallway with 2 inches to spare."</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Grid Trust Bullets */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-5 gap-8 py-10 border-y border-[#c5c6ca] text-center">
            {[
              { icon: "payments", title: "Budget checked", desc: "Real-time price tracking" },
              { icon: "straighten", title: "Dimensions checked", desc: "Fit & scale verification" },
              { icon: "local_shipping", title: "Delivery checked", desc: "Schedules synchronized" },
              { icon: "rate_review", title: "Reviews summarized", desc: "AI-distilled buyer insights" },
              { icon: "compare_arrows", title: "Alternatives compared", desc: "Best-value smart swaps" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2.5">
                <div className="w-11 h-11 rounded-full bg-[#e4f0f4] flex items-center justify-center border border-[#c2c7ce]">
                  <span className="material-symbols-outlined text-[#006b55] text-base">{item.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#03060a]">{item.title}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* STAGE 2: ROOM BRIEF CONSTRAINTS */}
      {currentState === "brief" && (
        <main className="max-w-2xl mx-auto px-6 py-12 w-full flex-1 flex flex-col justify-center">
          <div className="rounded-2xl border border-[#c5c6ca] bg-white p-8 shadow-xl space-y-6 text-left">
            <div>
              <h2 className="text-2xl font-black text-[#03060a]">Configure Your Room Brief</h2>
              <p className="text-xs text-zinc-500">Provide budget limitations, style expectations, and specific logistics boundaries.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Select Target Space</label>
                <select 
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/40 px-3.5 py-3 text-xs text-zinc-800 focus:border-[#006b55] outline-none"
                >
                  <option>Bedroom</option>
                  <option>Living Room</option>
                  <option>Office</option>
                  <option>Dining Room</option>
                  <option>Nursery</option>
                  <option>Entryway</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Describe Your Creative Vision</label>
                <textarea 
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/40 px-3.5 py-3 text-xs text-zinc-800 focus:border-[#006b55] outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Maximum Budget (USD)</label>
                  <input 
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/40 px-3.5 py-3 text-xs text-zinc-800 focus:border-[#006b55] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Reference Photo</label>
                  <div className="h-11 w-full rounded-lg border border-dashed border-[#c2c7ce] bg-[#f1fbff]/20 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition">
                    <span className="text-[11px] text-zinc-500 font-bold">📷 empty_bedroom.png</span>
                  </div>
                </div>
              </div>

              {/* Constraint parameters */}
              <div className="pt-2 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Logistics & Handling Rules</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/20 hover:border-zinc-400 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={avoidAssembly}
                      onChange={(e) => setAvoidAssembly(e.target.checked)}
                      className="accent-[#006b55] h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#03060a]">Avoid Heavy Assembly</p>
                      <p className="text-[9px] text-zinc-500">Excludes items requiring 2+ people or complex handling tools</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/20 hover:border-zinc-400 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={arriveByFriday}
                      onChange={(e) => setArriveByFriday(e.target.checked)}
                      className="accent-[#006b55] h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#03060a]">Arrive Before Friday</p>
                      <p className="text-[9px] text-zinc-500">Only selects products currently stocked in regional hubs</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setCurrentState("clarify")}
              className="w-full py-4 rounded-lg bg-[#03060a] text-white font-bold text-sm hover:bg-zinc-800 transition mt-6 active:scale-[0.99]"
            >
              Build My Room Plan
            </button>
          </div>
        </main>
      )}

      {/* STAGE 3: SMART CLARIFICATION */}
      {currentState === "clarify" && (
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-xl border border-[#c5c6ca] bg-white p-8 shadow-2xl relative overflow-hidden text-left">
            <span className="inline-block text-[9px] font-bold text-[#006b55] uppercase tracking-wider mb-2">Smart Clarification Required</span>
            <h3 className="text-xl font-bold text-[#03060a] leading-tight">Do you know the approximate dimensions of your space?</h3>
            <p className="text-xs text-zinc-500 mt-2">Materia requires room dimensions to confirm bed frame and walkway clearance ratios.</p>
            
            <div className="space-y-2 mt-6">
              {[
                { label: "Small: about 10 × 10 ft", desc: "Fits standard full, tight queen setup" },
                { label: "Medium: about 12 × 12 ft", desc: "Optimal guest bedroom configuration" },
                { label: "Large: 14 × 16 ft or more", desc: "Fits oversized king and dressers" },
                { label: "Not sure — use safe compact choices", desc: "Materia chooses minimum depth items" }
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRoomSize(opt.label);
                    startWorkspaceAnimation();
                  }}
                  className="w-full p-4 rounded-lg border border-[#c2c7ce] bg-[#f1fbff]/10 text-left hover:border-[#006b55] hover:bg-[#006b55]/5 transition flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-800 group-hover:text-[#006b55]">{opt.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-[#006b55] text-sm">arrow_forward_ios</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* STAGE 4: AGENT WORKSPACE ACTIVE CHECKLIST */}
      {currentState === "workspace" && (
        <main className="max-w-[1280px] w-full mx-auto grid lg:grid-cols-12 gap-6 px-10 py-10 flex-grow">
          {/* Left panel - Checklist */}
          <div className="lg:col-span-6 rounded-xl border border-[#c5c6ca] bg-white p-6 flex flex-col h-[70vh] text-left">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-[#006b55] uppercase tracking-wider">Agent Checklist</span>
              <h3 className="text-lg font-bold text-[#03060a]">Materia Design Run</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {checklistItems.map((item, idx) => {
                const isComplete = idx < checklistIndex;
                const isRunning = idx === checklistIndex;

                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border transition ${
                      isRunning 
                        ? "border-[#006b55] bg-[#006b55]/5" 
                        : isComplete 
                          ? "border-[#c5c6ca] bg-[#f1fbff]/20" 
                          : "border-[#c5c6ca]/40 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isComplete ? (
                        <div className="h-5 w-5 rounded-full bg-[#006b55]/20 flex items-center justify-center text-[#006b55]">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      ) : isRunning ? (
                        <div className="h-5 w-5 rounded-full bg-[#006b55] flex items-center justify-center text-white animate-spin">
                          <span className="material-symbols-outlined text-xs">sync</span>
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-zinc-400 flex items-center justify-center text-zinc-500 text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                      
                      <div>
                        <p className={`text-xs font-bold ${isRunning ? "text-[#006b55]" : "text-zinc-800"}`}>{item.label}</p>
                        {isRunning && <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{item.desc}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel - Live Tool Activity Logs */}
          <div className="lg:col-span-6 rounded-xl border border-[#c5c6ca] bg-white p-6 flex flex-col h-[70vh] text-left">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tool Execution Stream</span>
              <h3 className="text-lg font-bold text-[#03060a]">Workspace Terminals</h3>
            </div>

            <div className="flex-1 rounded-lg bg-zinc-950 border border-[#c2c7ce] p-4 font-mono text-[10px] text-emerald-400 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              <div className="text-zinc-500 font-bold">&gt;&gt; Materia by Wayfair initialized. Reasoning loops spinning...</div>
              {toolLogs.map((log, idx) => (
                <div key={idx} className="space-y-1 py-1 border-b border-zinc-900 last:border-b-0">
                  <div className="text-zinc-400">$ executing {log.split("\n")[0]}</div>
                  <div className="text-[#006b55] font-bold">{log.split("\n")[1]}</div>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-zinc-600 animate-pulse mt-2">
                <span className="inline-block h-1 w-2 bg-zinc-600" />
                <span>listening to subconscious streams...</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* STAGE 5-8: VERIFIED PLAN / REVISION VIEW */}
      {(currentState === "plan" || currentState === "revised") && (
        <main className="flex-grow flex overflow-hidden border-t border-[#c5c6ca] bg-white">
          <div className="flex-1 flex overflow-hidden w-full">
            
            {/* LEFT PANEL: Conversation Revision */}
            <section className="w-1/4 border-r border-[#c5c6ca] flex flex-col bg-white h-full justify-between">
              <div className="p-5 border-b border-[#c5c6ca] text-left">
                <h2 className="font-bold text-base text-[#03060a]">Conversation</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar text-left text-xs">
                {chatHistory.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border leading-relaxed ${
                      chat.role === 'user' 
                        ? 'bg-zinc-100 border-[#c5c6ca] text-right' 
                        : 'bg-[#006b55]/5 border-[#006b55]/10'
                    }`}
                  >
                    <p className="font-bold text-[9px] text-zinc-500 mb-1 uppercase">
                      {chat.role === 'user' ? 'User' : 'Agent'}
                    </p>
                    <p className="text-zinc-800">{chat.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[#c5c6ca] bg-[#f1fbff]/20">
                <form onSubmit={handleRevisionSubmit} className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Reply to Agent..."
                    className="w-full bg-[#f1fbff]/40 border-b-2 border-zinc-400 focus:border-[#006b55] px-4 py-3 pr-10 rounded-t-lg transition outline-none text-xs text-zinc-800"
                  />
                  <button type="submit" className="material-symbols-outlined absolute right-3 top-3 text-zinc-500 hover:text-[#006b55]">
                    send
                  </button>
                </form>
              </div>
            </section>

            {/* CENTER PANEL: Verification Tabs & Room Drawing */}
            <section className="flex-1 flex flex-col bg-[#f1fbff]/20 h-full justify-between">
              <div className="flex border-b border-[#c5c6ca] bg-white font-semibold text-xs text-zinc-500">
                {(["fit", "budget", "delivery", "reviews", "alternatives"] as Tab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-4 border-b-2 transition-all capitalize ${
                      activeTab === tab 
                        ? "border-[#006b55] text-[#006b55] font-bold" 
                        : "border-transparent hover:bg-zinc-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Interactive Tab contents */}
              <div className="flex-1 relative p-8 flex items-center justify-center overflow-hidden blueprint-grid">
                {/* FIT ROOM DIAGRAM */}
                {activeTab === "fit" && (
                  <div className="w-full max-w-lg aspect-[4/3] bg-white border-2 border-[#03060a] shadow-xl p-8 relative rounded-xl">
                    <div className="absolute inset-4 border-4 border-[#c2c7ce]/30 pointer-events-none rounded"></div>
                    <div className="absolute top-1/4 left-1/4 w-[200px] h-[180px] border-2 border-dashed border-[#006b55]/40 rounded-sm pointer-events-none"></div>
                    
                    {/* Platform Bed frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-48 bg-[#006b55]/10 border-2 border-[#006b55] flex items-center justify-center rounded cursor-help">
                      <span className="text-[10px] font-bold text-[#006b55] uppercase">Platform Bed</span>
                    </div>

                    {/* Lamps */}
                    <div className="absolute top-[32%] left-[26%] w-8 h-8 rounded-full bg-[#dfeaef] border border-[#c2c7ce] flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs text-[#006b55]">light</span>
                    </div>
                    <div className="absolute top-[32%] right-[26%] w-8 h-8 rounded-full bg-[#dfeaef] border border-[#c2c7ce] flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs text-[#006b55]">light</span>
                    </div>

                    {/* Rug area */}
                    <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-[240px] h-[140px] border border-[#c5c6ca] bg-[#e4f0f4]/20 -z-10 rounded flex items-end justify-center pb-1">
                      <span className="text-[9px] font-bold text-[#006b55]/70 uppercase">Jute Rug (8x10)</span>
                    </div>
                  </div>
                )}

                {/* BUDGET TAB */}
                {activeTab === "budget" && (
                  <div className="w-full max-w-md bg-white border border-[#c5c6ca] rounded-xl p-6 shadow-lg text-left space-y-4">
                    <h3 className="font-bold text-sm text-[#03060a]">Stacked Pricing Stack</h3>
                    <div className="space-y-3 text-xs">
                      {[
                        { category: "Furniture framework", price: currentCart.filter(p => ["bed", "mattress"].includes(p.category)).reduce((sum, p) => sum + p.price, 0), color: "bg-[#006b55]" },
                        { category: "Bedside utilities", price: currentCart.filter(p => p.category === "nightstand").reduce((sum, p) => sum + p.price, 0), color: "bg-amber-500" },
                        { category: "Area rugs & sheets", price: currentCart.filter(p => p.category === "rug" || p.id === "decor_601" || p.id === "decor_602").reduce((sum, p) => sum + p.price, 0), color: "bg-emerald-500" },
                        { category: "Ambient light", price: currentCart.filter(p => p.category === "decor" && p.id !== "decor_601" && p.id !== "decor_602" || p.category === "lighting").reduce((sum, p) => sum + p.price, 0), color: "bg-indigo-500" }
                      ].map((item, idx) => {
                        const pct = Math.round((item.price / budget) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">{item.category}</span>
                              <span className="font-bold text-zinc-800">${item.price} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-150 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DELIVERY TAB */}
                {activeTab === "delivery" && (
                  <div className="w-full max-w-md bg-white border border-[#c5c6ca] rounded-xl p-6 shadow-lg text-left space-y-3">
                    <h3 className="font-bold text-sm text-[#03060a]">Delivery Calendar Matches</h3>
                    <div className="space-y-2 text-xs">
                      {currentCart.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 bg-[#f1fbff]/30 border border-[#c5c6ca] rounded">
                          <span className="font-bold text-zinc-700">{p.name}</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded">Friday (ETA {p.deliveryDays} Days)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === "reviews" && (
                  <div className="w-full max-w-md bg-white border border-[#c5c6ca] rounded-xl p-6 shadow-lg text-left space-y-3 text-xs">
                    <h3 className="font-bold text-sm text-[#03060a]">Buyer Sentiment Summary</h3>
                    <div className="p-3 bg-[#e4f0f4]/40 border border-[#c2c7ce] rounded-lg">
                      <p className="font-bold text-[#006b55]">Rating: 4.8 / 5.0★</p>
                      <p className="text-zinc-600 mt-1 leading-normal">"92% positive rating for assembly and ease of integration. Velvet sturdiness and organic linens praised widely."</p>
                    </div>
                  </div>
                )}

                {/* ALTERNATIVES LOG TAB */}
                {activeTab === "alternatives" && (
                  <div className="w-full max-w-md bg-white border border-[#c5c6ca] rounded-xl p-6 shadow-lg text-left space-y-3 text-xs">
                    <h3 className="font-bold text-sm text-red-600">Materia Audit Rejection Log</h3>
                    <div className="space-y-2">
                      <div className="p-2.5 border border-red-200 bg-red-50/50 rounded text-[11px]">
                        <span className="font-bold text-red-700">Modernist Platform Bed</span>
                        <p className="text-zinc-500 mt-0.5">Rejected: Assembly takes 2+ hours and multiple people (failed constraints).</p>
                      </div>
                      <div className="p-2.5 border border-red-200 bg-red-50/50 rounded text-[11px]">
                        <span className="font-bold text-red-700">Urban Drawers Bed</span>
                        <p className="text-zinc-500 mt-0.5">Rejected: Side clearance drawer warning in 12x12 bedroom layout.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shared Decision Receipt Drawer */}
              <div className="h-44 border-t border-[#c5c6ca] bg-white p-5 overflow-y-auto text-left text-xs">
                <div className="flex items-center justify-between mb-3 border-b border-[#c5c6ca]/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006b55]">receipt_long</span>
                    <h3 className="font-bold text-[#03060a] uppercase tracking-wide">Materia Decision Receipt</h3>
                  </div>
                  <span className="font-mono text-zinc-400">LOG-ID: AT-9842-BN</span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">GOAL</span>
                    <p className="font-medium text-zinc-700 leading-normal">
                      {currentState === "revised" ? "Hotel aesthetic" : "Cozy neutral guest room"}, under $1,500 total, 92% fit score.
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">CONSTRAINTS</span>
                    <p className="font-medium text-zinc-700 leading-normal">Walkway width &gt; 24", arrive before Friday, exclude heavy assembly.</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">TOOLS INVOLVED</span>
                    <p className="font-medium text-zinc-700 leading-normal">RoomCanvas 2D, Jute-Style Clearance Check, Review Sentiment Synths.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT PANEL: Shoppable cart details */}
            <section className="w-1/3 flex flex-col bg-[#f1fbff] border-l border-[#c5c6ca] h-full justify-between">
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-left">
                {/* Main overall budget overview card */}
                <div className="bg-white rounded-xl border-2 border-[#006b55] p-5 mb-5 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-base font-extrabold text-[#03060a]">Cozy Guest Bedroom Plan</h2>
                      <span className="text-[10px] font-bold text-[#006b55] uppercase tracking-wider block mt-0.5">Verified by Materia</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[#006b55] block">${totalCost}</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">Total Cost</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                    <div className="bg-[#f1fbff]/60 p-2.5 rounded-lg border border-[#c2c7ce]">
                      <span className="text-[9px] font-bold text-zinc-500 block">Arrives by</span>
                      <span className="font-bold text-zinc-700">Friday, Oct 24</span>
                    </div>
                    <div className="bg-[#f1fbff]/60 p-2.5 rounded-lg border border-[#c2c7ce]">
                      <span className="text-[9px] font-bold text-zinc-500 block">Fit Confidence</span>
                      <span className="font-bold text-[#006b55]">92% Match</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert(`Room cart verified! Added ${currentCart.length} items to Wayfair cart successfully!`)}
                    className="w-full bg-[#006b55] text-white py-3.5 rounded-lg font-bold text-xs hover:bg-[#005140] transition active:scale-[0.98]"
                  >
                    Add all to cart
                  </button>
                </div>

                {/* List of selected items */}
                <h3 className="text-[10px] font-bold text-zinc-500 mb-3 px-1 uppercase tracking-wider">Selected Items ({currentCart.length})</h3>
                <div className="space-y-3">
                  {currentCart.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-lg border border-[#c5c6ca] flex gap-3 hover:border-[#006b55] transition">
                      <div className="w-14 h-14 rounded bg-[#e4f0f4] flex-shrink-0 flex items-center justify-center border border-[#c2c7ce]">
                        <span className="text-[8px] font-extrabold text-zinc-500">{p.category.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-[11px] text-zinc-800 leading-tight">{p.name}</h4>
                          <span className="font-extrabold text-[11px] text-[#006b55]">${p.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="bg-[#dfeaef]/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-[#006b55] border border-[#c2c7ce]/50">
                            FITS ROOM
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 italic mt-1.5">"{p.selectionRationale}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </main>
      )}

    </div>
  );
}
