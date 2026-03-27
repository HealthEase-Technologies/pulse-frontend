import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

export const metadata = {
  title: "The Sleep Quality Trap: Why 8 Hours Still Leaves You Exhausted · Pulse Blog",
  description: "Duration is only half the story. Most people optimising for 8 hours of sleep are solving the wrong problem — here's what actually determines how rested you feel.",
};

export default function SleepPost() {
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
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest border border-white/[0.1] rounded px-2 py-0.5">Sleep Science</span>
            <span className="text-white/25 text-[11px]">7 min read · February 10, 2025</span>
          </div>

          <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] text-white leading-tight mb-5">
            The Sleep Quality Trap: Why 8 Hours Still Leaves You Exhausted
          </h1>

          <p className="text-white/55 text-base leading-relaxed mb-6">
            The "sleep 8 hours" advice has become so ingrained that most people measuring their sleep stop at the number of hours logged. But if you're consistently getting 7.5–8.5 hours and still waking up feeling like you need a nap by 10 AM, the duration isn't your problem. What happens inside those hours is.
          </p>

          <div className="flex items-center gap-3 pb-8 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/60 to-violet-600/60 flex items-center justify-center text-white text-xs font-bold">PR</div>
            <div>
              <p className="text-white text-sm font-medium">Pulse Research Team</p>
              <p className="text-white/35 text-xs">HealthEase Technologies LLC</p>
            </div>
          </div>
        </div>
      </section>

      <article className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-7 text-white/65 text-[15px] leading-[1.8]">

          <h2 className="font-serif text-xl text-white mt-10">Duration vs. architecture</h2>
          <p>
            Your sleep isn't just one continuous state. It's a series of cycles — each roughly 90 minutes long — that move through distinct stages: light NREM sleep, deep slow-wave sleep (SWS), and REM sleep. Each stage does something different. Deep sleep drives physical recovery, cellular repair, and immune function. REM sleep processes memory, consolidates learning, and regulates emotional health.
          </p>
          <p>
            Eight hours in bed doesn't guarantee that you're getting the right proportion of each. You could spend eight hours sleeping and still get only forty minutes of deep sleep if your sleep architecture is disrupted — a problem that's almost invisible without tracking, because it doesn't interrupt your sleep in ways you'd consciously notice.
          </p>

          <div className="my-8 border-l-2 border-indigo-500/50 pl-5 py-1">
            <p className="text-white/70 text-base italic font-serif leading-relaxed">
              "The question isn't 'did I sleep 8 hours.' It's 'did I get enough deep sleep and REM to actually recover.' Those are completely different questions, and most sleep apps only answer the first one."
            </p>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">What disrupts sleep architecture</h2>
          <p>
            A number of things can wreck your sleep stages while leaving total duration almost untouched. Some of them will not surprise you. Several of them will.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 my-6 space-y-4">
            <p className="text-white text-sm font-semibold">Architecture disruptors — ranked by how underestimated they are</p>
            {[
              {
                disruptor: "Alcohol",
                impact: "Dramatically suppresses REM sleep. One standard drink can reduce REM by 24% — even if you sleep a full 8 hours and feel like you slept through the night.",
                severity: "High",
                color: "text-red-400",
              },
              {
                disruptor: "Inconsistent sleep timing",
                impact: "Your circadian rhythm regulates when each sleep stage is scheduled. Going to bed 90 minutes later than usual — even on weekends — can reduce deep sleep by 30% that night.",
                severity: "High",
                color: "text-red-400",
              },
              {
                disruptor: "Late-evening intense exercise",
                impact: "Elevates core body temperature and cortisol. Your body needs to cool down to enter deep sleep. Training within 90 minutes of bed delays this by 20–45 minutes.",
                severity: "Moderate",
                color: "text-yellow-400",
              },
              {
                disruptor: "Low overnight blood glucose",
                impact: "Athletes and people who train in the evenings often go to bed with low glycogen. Sub-80 mg/dL overnight glucose correlates with shorter slow-wave sleep durations.",
                severity: "Often missed",
                color: "text-amber-400",
              },
              {
                disruptor: "Screen light before bed",
                impact: "Yes, it's real. Blue light suppresses melatonin onset. But the bigger issue is the mental stimulation, not just the light — regardless of what a blue-light screen filter does.",
                severity: "Moderate",
                color: "text-yellow-400",
              },
            ].map((d) => (
              <div key={d.disruptor} className="border-t border-white/[0.06] pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white/80 text-sm font-medium">{d.disruptor}</p>
                  <span className={`text-[10px] font-semibold ${d.color}`}>{d.severity}</span>
                </div>
                <p className="text-white/45 text-xs leading-relaxed">{d.impact}</p>
              </div>
            ))}
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The consistency principle</h2>
          <p>
            If you could only change one thing about your sleep, the research consistently points to the same answer: go to bed at the same time every night. Not approximately. The same time.
          </p>
          <p>
            Your circadian rhythm is not flexible. It runs on a 24-hour biological clock that is exquisitely sensitive to timing cues — light exposure, meal timing, and most powerfully, sleep and wake times. When those times shift, your body spends a significant portion of the night resynchronising rather than recovering. This is why Monday morning is so brutal after a "social weekend" of late nights, even if you slept in to make up the hours.
          </p>
          <p>
            The data from wearables makes this clear in a way that self-report never could. When Pulse users who track their sleep compare weeks where their bedtime varied by more than 60 minutes against weeks where it was within a 20-minute window, the difference in reported next-day energy and focus is statistically significant — and it shows up in their resting heart rate the following morning too.
          </p>

          <h2 className="font-serif text-xl text-white mt-10">How to actually measure sleep quality</h2>
          <p>
            Not all wearables measure sleep stages equally well. Consumer-grade optical sensors estimate sleep stages using movement and heart rate variability (HRV) as proxies — they're not as accurate as clinical polysomnography, but they're directionally useful for spotting trends over time. Here's what to focus on:
          </p>

          <div className="grid sm:grid-cols-3 gap-3 my-6">
            {[
              {
                metric: "Deep Sleep",
                target: "13–23% of total",
                note:   "Physical recovery",
                color:  "border-blue-500/30",
              },
              {
                metric: "REM Sleep",
                target: "20–25% of total",
                note:   "Cognitive recovery",
                color:  "border-violet-500/30",
              },
              {
                metric: "Sleep Efficiency",
                target: "> 85%",
                note:   "Time asleep / time in bed",
                color:  "border-green-500/30",
              },
            ].map((m) => (
              <div key={m.metric} className={`bg-white/[0.04] border rounded-xl p-4 ${m.color}`}>
                <p className="text-white font-semibold text-sm">{m.metric}</p>
                <p className="text-white/60 text-xs mt-1 font-medium">{m.target}</p>
                <p className="text-white/30 text-[11px] mt-0.5">{m.note}</p>
              </div>
            ))}
          </div>

          <p className="text-white/50 text-sm">
            If you consistently fall below these ranges, it's worth discussing with an HCP. Chronic deep sleep deficiency is associated with elevated cardiovascular risk, impaired immune function, and accelerated cognitive decline.
          </p>

          <h2 className="font-serif text-xl text-white mt-10">The interventions that actually work</h2>
          <div className="space-y-4 my-6">
            {[
              {
                title: "Lock your wake time, not your bedtime",
                body: "Set a non-negotiable wake time and maintain it 7 days a week. Your body will naturally calibrate your sleep pressure to make you tired at the right bedtime over 2–3 weeks.",
              },
              {
                title: "Keep your bedroom below 19°C",
                body: "Core body temperature needs to drop 1–2°C to initiate sleep. A cool room makes this faster and increases the proportion of slow-wave sleep you get.",
              },
              {
                title: "Don't drink alcohol within 3 hours of bed",
                body: "If you drink, earlier is always better. The sleep-disrupting effects of alcohol are dose and timing dependent — a glass of wine at 7 PM affects your 11 PM sleep far less than a glass at 10 PM.",
              },
              {
                title: "Track for 30 days before optimising",
                body: "Your baseline is personal. Before experimenting with supplements, cooling mattresses, or sleep restriction therapy, get 30 days of consistent data so you know what's actually off.",
              },
            ].map((i) => (
              <div key={i.title} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                <p className="text-white font-medium text-sm mb-1">{i.title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>

          {/* Pulse CTA */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border border-indigo-500/20 rounded-2xl p-6 my-8">
            <p className="text-white font-semibold text-sm mb-1">Track your sleep architecture on Pulse</p>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Connect your Fitbit, Apple Watch, or Whoop to see your nightly deep sleep, REM, and sleep efficiency alongside your other vitals. Your AI companion will flag when your sleep quality drops and correlate it with your other health metrics.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-md shadow-black/20">
              Start Tracking Sleep Free
            </Link>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The honest summary</h2>
          <p>
            Eight hours is a useful floor, not a ceiling or a guarantee. The people who wake up genuinely rested aren't necessarily sleeping more than you — they're sleeping more consistently, with better architecture, at temperatures their bodies can actually recover in.
          </p>
          <p>
            Stop counting hours. Start understanding what you're doing with them.
          </p>
        </div>
      </article>

      <section className="py-12 px-4 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">More from the Journal</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { href: "/blog/resting-heart-rate",   title: "Why Your Resting Heart Rate Is the Most Underrated Health Metric", tag: "Cardiology"   },
              { href: "/blog/athletes-and-glucose", title: "What Athletes Get Wrong About Glucose Monitoring",                  tag: "Performance"  },
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
