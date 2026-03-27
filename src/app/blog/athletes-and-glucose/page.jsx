import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

export const metadata = {
  title: "What Athletes Get Wrong About Glucose Monitoring · Pulse Blog",
  description: "Continuous glucose monitors aren't just for people with diabetes. Endurance athletes are using CGM data to prevent bonking, optimise fuelling windows, and recover faster.",
};

export default function GlucosePost() {
  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      <section className="relative pt-40 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/30 text-xs font-medium hover:text-white/60 transition-colors mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            The Pulse Journal
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest border border-white/[0.1] rounded px-2 py-0.5">Performance</span>
            <span className="text-white/25 text-[11px]">8 min read · February 28, 2025</span>
          </div>

          <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] text-white leading-tight mb-5">
            What Athletes Get Wrong About Glucose Monitoring
          </h1>

          <p className="text-white/55 text-base leading-relaxed mb-6">
            For decades, glucose monitoring belonged exclusively to the world of diabetes management. Then endurance athletes started sticking CGMs on their arms mid-race. The data they found wasn't just surprising — it was performance-changing.
          </p>

          <div className="flex items-center gap-3 pb-8 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/60 to-orange-600/60 flex items-center justify-center text-white text-xs font-bold">PR</div>
            <div>
              <p className="text-white text-sm font-medium">Pulse Research Team</p>
              <p className="text-white/35 text-xs">HealthEase Technologies LLC</p>
            </div>
          </div>
        </div>
      </section>

      <article className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-7 text-white/65 text-[15px] leading-[1.8]">

          <h2 className="font-serif text-xl text-white mt-10">The bonk problem</h2>
          <p>
            Any endurance athlete who's been running or cycling for more than two years has probably experienced "the bonk" — that sudden, catastrophic drop in energy that happens when your body runs out of readily available glucose. Muscles stop responding properly. Your vision might blur slightly. Your pace collapses. You feel, frankly, like you're dying.
          </p>
          <p>
            The standard advice has always been "eat every 45 minutes during prolonged exercise." But that's an average guideline for an average person doing average exercise. It tells you nothing about what's happening in your body specifically, in real time.
          </p>
          <p>
            Continuous Glucose Monitors (CGMs) like the FreeStyle Libre or Dexcom change that equation entirely. For the first time, you can see exactly when your glucose starts dropping, how fast it's dropping, and how your body responds to specific foods eaten at specific times relative to exercise.
          </p>

          <div className="my-8 border-l-2 border-amber-500/50 pl-5 py-1">
            <p className="text-white/70 text-base italic font-serif leading-relaxed">
              "Two cyclists at the same fitness level, doing the same training, can have wildly different glucose responses to the same energy gel. What works for one can cause a crash in the other."
            </p>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">What the CGM data actually shows</h2>
          <p>
            When researchers started fitting healthy endurance athletes with CGMs and analysing their training sessions, the results challenged several long-held assumptions.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 my-6 space-y-4">
            <p className="text-white text-sm font-semibold">Key findings from athlete CGM studies</p>
            {[
              {
                finding: "Glucose spikes in the morning",
                detail: "The 'dawn phenomenon' causes many athletes to start morning training already in a suboptimal glucose state, leading to earlier depletion than expected.",
              },
              {
                finding: "Post-exercise glucose variance is huge",
                detail: "Two athletes doing the same 90-minute run can have post-run glucose readings that differ by 40–60 mg/dL. Individual metabolic response is not predictable without data.",
              },
              {
                finding: "Carbohydrate timing matters more than total intake",
                detail: "Taking 30g of carbs 10 minutes before a gel-dependent threshold effort produces a very different glucose profile than taking it 45 minutes before.",
              },
              {
                finding: "Recovery glucose affects sleep quality",
                detail: "Athletes who finish evening training with blood glucose below 80 mg/dL report significantly worse sleep efficiency — a factor most recovery protocols ignore entirely.",
              },
            ].map((f) => (
              <div key={f.finding} className="border-t border-white/[0.06] pt-3 first:border-0 first:pt-0">
                <p className="text-white/80 text-sm font-medium mb-1">{f.finding}</p>
                <p className="text-white/45 text-xs leading-relaxed">{f.detail}</p>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-xl text-white mt-10">You don't have to be diabetic to benefit</h2>
          <p>
            This is the core misconception. Glucose regulation exists on a spectrum, and even people with perfectly healthy fasting glucose can experience significant intra-day variability that affects their energy, mood, and athletic output. The target isn't "not diabetic." It's metabolically optimised.
          </p>
          <p>
            The practical question for a non-diabetic athlete isn't whether their glucose is in a dangerous range — it almost certainly isn't. It's whether their glucose pattern is optimal for performance. Are they fuelling at the right times? Are they going into key training sessions with adequate glycogen? Are they crashing at 3 PM because of what they ate at 1 PM?
          </p>

          <h2 className="font-serif text-xl text-white mt-10">The practical protocol</h2>
          <p>
            If you're a serious athlete who wants to experiment with CGM data, here's what we recommend starting with:
          </p>

          <div className="space-y-4 my-6">
            {[
              {
                step: "1",
                title: "Establish your fasted baseline",
                body: "Wear the CGM for 3–4 days before changing anything. Note your average fasting glucose on waking, and observe how it moves through the day on normal meals. This is your reference point.",
              },
              {
                step: "2",
                title: "Map your training response",
                body: "Record glucose at the start and end of different session types — easy aerobic, threshold, and HIIT. You'll quickly see how each modality depletes glucose differently and at what rate.",
              },
              {
                step: "3",
                title: "Experiment with fuelling timing",
                body: "Move your pre-workout carb intake by 15 minutes earlier or later and compare the glucose curve during your next similar session. Small timing changes produce meaningful differences for many athletes.",
              },
              {
                step: "4",
                title: "Track overnight recovery glucose",
                body: "If you're training twice a day or doing heavy volume, check whether your glucose is recovering above 80 mg/dL before sleep. Low overnight glucose correlates with reduced HGH release and slower muscle repair.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-bold flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">{s.title}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The glycaemic targets worth knowing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            {[
              { range: "70–99",  label: "Fasting ideal", sub: "mg/dL",   color: "border-green-500/30 text-green-400"  },
              { range: "< 140",  label: "Post-meal peak", sub: "2hr",    color: "border-blue-500/30 text-blue-400"    },
              { range: "80–140", label: "During training", sub: "target", color: "border-amber-500/30 text-amber-400"  },
              { range: "< 180",  label: "Absolute max",   sub: "any time", color: "border-red-500/30 text-red-400"    },
            ].map((r) => (
              <div key={r.range} className={`bg-white/[0.04] border rounded-xl p-3 text-center ${r.color}`}>
                <p className="text-lg font-bold font-serif">{r.range}</p>
                <p className="text-[10px] mt-0.5 opacity-80 font-medium">{r.label}</p>
                <p className="text-[10px] opacity-50">{r.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-sm">
            These are general reference ranges for healthy adults. Your optimal ranges may differ based on your individual physiology and training load.
          </p>

          {/* Pulse inline CTA */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-2xl p-6 my-8">
            <p className="text-white font-semibold text-sm mb-1">Connect your FreeStyle Libre to Pulse</p>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Pulse integrates with FreeStyle Libre and Dexcom to overlay your glucose data with activity, heart rate, and sleep — giving you the full picture, not just isolated numbers.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-md shadow-black/20">
              Connect My CGM
            </Link>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The bottom line</h2>
          <p>
            You don't need to be managing a chronic condition to benefit from understanding your glucose. If you train hard, want to perform consistently, and are tired of guessing why some sessions feel great and others fall apart — this data will change how you approach nutrition and recovery.
          </p>
          <p>
            Start with two weeks. Track everything. The patterns will reveal themselves.
          </p>
        </div>
      </article>

      <section className="py-12 px-4 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">More from the Journal</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { href: "/blog/resting-heart-rate", title: "Why Your Resting Heart Rate Is the Most Underrated Health Metric", tag: "Cardiology"   },
              { href: "/blog/sleep-quality-trap", title: "The Sleep Quality Trap: Why 8 Hours Still Leaves You Exhausted",    tag: "Sleep Science" },
            ].map((p) => (
              <Link key={p.href} href={p.href}
                className="group bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl p-4 transition-all duration-200">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{p.tag}</span>
                <p className="text-white text-sm font-medium mt-1 leading-snug group-hover:text-white/85 transition-colors">{p.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-white/[0.06] px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} HealthEase Technologies LLC.</p>
        <Link href="/blog" className="text-white/25 text-[11px] hover:text-white/60 transition-colors">← All Posts</Link>
      </div>
    </div>
  );
}
