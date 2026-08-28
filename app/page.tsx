import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CircleDot,
  Database,
  Eye,
  Layers3,
  MapPinned,
  Play,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TreePine,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getFortyGuardCapabilities } from "@/lib/fortyguard/capabilities";
import { cn } from "@/lib/utils";

const proof = [
  { value: "1,055", label: "live temperature cells", note: "verified run" },
  { value: "30", label: "urban zones", note: "one operating view" },
  { value: "03", label: "priority areas", note: "ranked for review" },
];

const workflow = [
  { step: "01", title: "See", text: "Ingest street-level air temperature and reveal the pattern a city average hides.", icon: Eye },
  { step: "02", title: "Explain", text: "Connect heat with canopy, land cover, density, and the surrounding urban form.", icon: Layers3 },
  { step: "03", title: "Prioritize", text: "Rank zones with a transparent exposure model—every score keeps its evidence.", icon: BarChart3 },
  { step: "04", title: "Act", text: "Turn the finding into an assessment brief a city team can take into the field.", icon: Route },
];

const differentiators = [
  {
    title: "A decision layer, not another heat map",
    text: "The map is only the first frame. KAIRO carries each signal through explanation, prioritization, and an action-ready brief.",
    icon: MapPinned,
  },
  {
    title: "Evidence stays attached",
    text: "Observed values, derived features, assumptions, and limitations remain visible. A judge can inspect why a zone ranked first.",
    icon: ShieldCheck,
  },
  {
    title: "Live and demo are never blurred",
    text: "Provider-backed temperature is labeled as live. Scenario context is labeled as modeled. The product earns trust by being explicit.",
    icon: Database,
  },
];

export default function LandingPage() {
  const capabilities = getFortyGuardCapabilities();

  return (
    <main className="kairo-noise min-h-dvh overflow-hidden bg-[#050708] text-white">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#050708]/78 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 lg:px-10">
          <Brand />
          <div className="hidden items-center gap-1 text-sm text-zinc-400 md:flex">
            <a href="#why" className="min-h-11 rounded-lg px-4 py-3 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Why KAIRO</a>
            <a href="#system" className="min-h-11 rounded-lg px-4 py-3 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">How it works</a>
            <Link href="/presentation" className="min-h-11 rounded-lg px-4 py-3 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Judge story</Link>
          </div>
          <Link href="/dashboard" className={cn(buttonVariants({ size: "sm" }), "min-h-11 px-5")}>Open KAIRO <ArrowRight className="size-4" /></Link>
        </div>
      </nav>

      <section className="landing-hero relative min-h-[900px] pb-[230px] pt-[72px] sm:pb-[78px] lg:min-h-dvh lg:pb-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_35%,rgba(34,211,238,.08),transparent_30rem)]" />
        <div className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1500px] items-center gap-12 px-5 py-12 lg:grid-cols-[.76fr_1.24fr] lg:px-10 lg:py-16">
          <div className="relative z-20 max-w-2xl">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <Badge className="border-orange-300/25 bg-orange-400/[0.08] text-orange-200">FortyGuard Hackathon ’26</Badge>
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-zinc-500">Resilient cities · Data analysis</span>
            </div>
            <h1 className="text-balance text-[clamp(3.5rem,6.4vw,7rem)] font-black leading-[.89] tracking-[-.072em]">
              See where heat hurts.
              <span className="mt-2 block bg-gradient-to-r from-cyan-100 via-cyan-300 to-cyan-500 bg-clip-text text-transparent">Know what to fix first.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[1.05rem] leading-8 text-zinc-300 lg:text-lg">
              KAIRO turns street-level temperature into a ranked action plan for city teams—showing where exposure concentrates, what amplifies it, and which places deserve attention first.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "min-h-12 px-6")}>Explore Phoenix <ArrowRight className="size-4" /></Link>
              <Link href="/presentation" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "min-h-12 px-6")}><Play className="size-4 fill-current" /> See the judge story</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
              <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Live API verified</span>
              <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Explainable scoring</span>
              <span className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> No hidden LLM dependency</span>
            </div>
          </div>

          <div className="thermal-hero-visual relative z-10 min-h-[520px] lg:min-h-[720px]" aria-label="Three-dimensional thermal digital twin of Phoenix">
            <div className="absolute inset-[-4%_-18%_-6%_-8%] overflow-hidden rounded-[2rem] lg:inset-[-8%_-22%_-8%_-12%]">
              <Image
                src="/visuals/kairo-thermal-twin.avif"
                alt="A 3D urban digital twin showing three concentrated heat zones across Phoenix"
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 68vw"
                className="thermal-city-image object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,#050708_0%,rgba(5,7,8,.86)_12%,transparent_48%),linear-gradient(0deg,#050708_0%,transparent_30%)]" />
              <div className="thermal-scan absolute inset-x-[18%] top-[18%] h-px bg-gradient-to-r from-transparent via-cyan-100/80 to-transparent shadow-[0_0_24px_rgba(103,232,249,.55)]" />
            </div>

            <div className="hero-hud absolute right-0 top-10 w-[240px] rounded-2xl border border-white/[0.12] bg-[#081012]/82 p-4 shadow-2xl backdrop-blur-xl lg:right-3 lg:top-14">
              <div className="flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.2em] text-zinc-500">Live field</span><span className="signal-pulse size-2 rounded-full bg-emerald-400" /></div>
              <div className="mt-4 flex items-end justify-between"><div><p className="font-mono text-3xl font-black tracking-[-.06em] text-white">40.1°C</p><p className="mt-1 text-[10px] text-zinc-500">mean air temperature</p></div><ScanSearch className="size-6 text-cyan-200" /></div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-orange-500" /></div>
            </div>

            <div className="hero-hud hero-hud-delay absolute bottom-16 left-0 w-[220px] rounded-2xl border border-orange-300/20 bg-[#100c0a]/84 p-4 shadow-2xl backdrop-blur-xl lg:left-8">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.2em] text-orange-200"><CircleDot className="size-3.5" /> Priority signal</div>
              <p className="mt-3 text-sm font-bold text-white">North Phoenix thermal pocket</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">High persistence · Low canopy</p>
            </div>

            <div className="absolute bottom-4 right-0 hidden items-center gap-3 rounded-full border border-white/[0.1] bg-black/55 px-4 py-2 text-[10px] uppercase tracking-[.16em] text-zinc-400 backdrop-blur-md sm:flex">
              <span className="text-cyan-200">2 m air temperature</span><span className="size-1 rounded-full bg-zinc-600" />33.45°N · 112.07°W
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 border-y border-white/[0.08] bg-[#080b0d]/88 backdrop-blur-xl">
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 divide-y divide-white/[0.08] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
            {proof.map((item) => <div key={item.label} className="flex items-center gap-4 py-5 sm:px-6 first:sm:pl-0"><p className="metric-number font-mono text-3xl font-black text-white">{item.value}</p><div><p className="text-sm font-semibold text-zinc-200">{item.label}</p><p className="mt-0.5 text-[10px] uppercase tracking-[.14em] text-zinc-600">{item.note}</p></div></div>)}
          </div>
        </div>
      </section>

      <section id="why" className="relative border-b border-white/[0.08] bg-[#080b0d] px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[.86fr_1.14fr] lg:items-end">
          <div>
            <p className="section-kicker">The problem</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-5xl lg:text-7xl">A city average hides the block that needs help.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.08] sm:grid-cols-3">
            {[{ value: "01", title: "Heat is local", text: "Two nearby streets can create very different exposure." }, { value: "02", title: "Causes overlap", text: "Canopy, surfaces, density, and time all shape the signal." }, { value: "03", title: "Budgets are finite", text: "Cities need a defensible order of operations—not more layers." }].map((item) => <article key={item.value} className="bg-[#0d1214] p-6 lg:p-8"><p className="font-mono text-xs text-cyan-300">{item.value}</p><h3 className="mt-12 text-lg font-bold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{item.text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="system" className="content-auto px-5 py-24 lg:px-10 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="section-kicker">The KAIRO system</p><h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">From temperature<br />to triage.</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-zinc-400">A single, inspectable path from FortyGuard temperature intelligence to the next field assessment. Every handoff is visible; nothing is hidden behind a black box.</p>
          </div>
          <div className="mt-14 grid overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.08] md:grid-cols-2 xl:grid-cols-4">
            {workflow.map(({ step, title, text, icon: Icon }) => <article key={step} className="group relative min-h-[300px] border-b border-r border-white/[0.08] bg-[#0b1012] p-7 last:border-r-0 md:p-8"><div className="flex items-center justify-between"><span className="font-mono text-xs text-zinc-600">{step}</span><span className="grid size-11 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] text-cyan-200 transition-colors duration-200 group-hover:border-cyan-300/25 group-hover:bg-cyan-300/[0.08]"><Icon className="size-5" /></span></div><h3 className="mt-20 text-2xl font-bold">{title}</h3><p className="mt-4 text-sm leading-6 text-zinc-500">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="content-auto px-5 pb-24 lg:px-10 lg:pb-36">
        <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-[2rem] border border-white/[0.1] bg-[#0a0f11] shadow-[0_50px_140px_rgba(0,0,0,.35)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-[480px] overflow-hidden border-b border-white/[0.08] lg:min-h-[680px] lg:border-b-0 lg:border-r">
            <Image src="/visuals/kairo-cooling-block.avif" alt="A 3D urban block transitioning from exposed heat to tree canopy, cool roofs, and shaded public space" fill unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover transition-transform duration-500 hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070a0b] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2"><Badge className="border-orange-300/25 bg-black/60 text-orange-200 backdrop-blur-md">Before · exposed surfaces</Badge><Badge className="border-cyan-300/25 bg-black/60 text-cyan-100 backdrop-blur-md">After · targeted cooling</Badge></div>
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="section-kicker">Decision simulation</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">The output is a choice, not a chart.</h2>
            <p className="mt-6 text-base leading-7 text-zinc-400">KAIRO does not pretend to prescribe a construction project from a browser. It identifies the places and hypotheses worth validating next—then packages the evidence for planners, resilience teams, and field partners.</p>
            <div className="mt-10 space-y-3">
              {[{ icon: TreePine, title: "Canopy opportunity", meta: "Validate shade gap along pedestrian routes" }, { icon: Building2, title: "Roof and surface audit", meta: "Inspect high-persistence parcels first" }, { icon: Sparkles, title: "Cooling pilot", meta: "Compare impact before scaling investment" }].map(({ icon: Icon, title, meta }, index) => <div key={title} className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-cyan-300/[0.06] text-cyan-200"><Icon className="size-5" /></span><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-zinc-600">0{index + 1}</span><p className="font-semibold text-zinc-100">{title}</p></div><p className="mt-1 text-xs leading-5 text-zinc-500">{meta}</p></div></div>)}
            </div>
            <Link href="/actions" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-8 min-h-12 self-start")}>Inspect the action brief <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="content-auto border-y border-white/[0.08] bg-[#080b0d] px-5 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-3xl"><p className="section-kicker">Why it can stand out</p><h2 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-6xl">Built for the questions judges ask next.</h2></div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {differentiators.map(({ title, text, icon: Icon }, index) => <article key={title} className="bento-card rounded-2xl border border-white/[0.09] bg-[#0d1214] p-7 lg:p-9"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-cyan-200"><Icon className="size-5" /></span><span className="font-mono text-xs text-zinc-700">0{index + 1}</span></div><h3 className="mt-16 text-2xl font-bold tracking-[-.03em]">{title}</h3><p className="mt-4 text-sm leading-7 text-zinc-500">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-28 lg:px-10 lg:py-40">
        <div className="heat-orb pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="section-kicker justify-center">Phoenix operating picture</p>
          <h2 className="mt-6 text-balance text-5xl font-black tracking-[-.06em] sm:text-7xl lg:text-8xl">Start with the hottest question.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">Where should a city investigate first—and what evidence supports that choice?</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "min-h-12 px-7")}>{capabilities.configured ? "Run the live experience" : "Open the experience"} <ArrowRight className="size-4" /></Link><Link href="/presentation" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "min-h-12 px-7")}>Open presentation mode</Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] px-5 py-10 lg:px-10"><div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-7 sm:flex-row sm:items-center"><Brand /><p className="max-w-xl text-sm leading-6 text-zinc-500">FortyGuard sees the heat. <span className="text-zinc-300">KAIRO helps decide what to do next.</span></p></div></footer>
    </main>
  );
}
