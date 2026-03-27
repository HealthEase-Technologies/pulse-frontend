import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

export const metadata = {
  title: "Why Your Resting Heart Rate Is the Most Underrated Health Metric · Pulse Blog",
  description: "Your RHR can tell you more about your cardiovascular health, stress levels, and recovery than almost any other single metric. Here's how to read it properly.",
};

export default function RHRPost() {
  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-40 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/30 text-xs font-medium hover:text-white/60 transition-colors mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            The Pulse Journal
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest border border-white/[0.1] rounded px-2 py-0.5">Cardiology</span>
            <span className="text-white/25 text-[11px]">6 min read · March 14, 2025</span>
          </div>

          <h1 className="font-serif text-[clamp(1.8rem,4vw,3rem)] text-white leading-tight mb-5">
            Why Your Resting Heart Rate Is the Most Underrated Health Metric
          </h1>

          <p className="text-white/55 text-base leading-relaxed mb-6">
            Most people only think about their heart rate when they're exercising. But the number that actually matters most — the one that can predict illness, track fitness progress, and warn you about stress before you even feel it — is the one your heart produces when you're doing absolutely nothing.
          </p>

          <div className="flex items-center gap-3 pb-8 border-b border-white/[0.08]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/60 to-blue-600/60 flex items-center justify-center text-white text-xs font-bold">PR</div>
            <div>
              <p className="text-white text-sm font-medium">Pulse Research Team</p>
              <p className="text-white/35 text-xs">HealthEase Technologies LLC</p>
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-7 text-white/65 text-[15px] leading-[1.8]">

          <h2 className="font-serif text-xl text-white mt-10">What exactly is resting heart rate?</h2>
          <p>
            Your resting heart rate (RHR) is the number of times your heart beats per minute when you're at complete rest — ideally measured first thing in the morning, before you get out of bed. For most adults, a normal range falls between 60 and 100 beats per minute. But "normal" and "optimal" are very different things.
          </p>
          <p>
            Elite endurance athletes routinely have RHRs in the 40s. Some even lower. That's not a medical anomaly — it's the result of a highly efficient cardiovascular system that can pump more blood per beat, so it doesn't need to beat as often. As your fitness improves over months of consistent training, you'll often see your RHR drop by 5–10 BPM before you notice any other measurable change in performance.
          </p>

          {/* Pull quote */}
          <div className="my-8 border-l-2 border-indigo-500/50 pl-5 py-1">
            <p className="text-white/70 text-base italic font-serif leading-relaxed">
              "A resting heart rate of 72 BPM and a resting heart rate of 58 BPM don't feel different when you're sitting on the sofa. But they represent two completely different cardiovascular realities."
            </p>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">What your RHR is actually telling you</h2>
          <p>
            The reason RHR is so powerful as a health signal is precisely because it's passive. You're not doing anything — your body is just running its baseline operations. When that baseline changes, it usually means something has changed in your body's state.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 my-6">
            <p className="text-white text-sm font-semibold mb-4">What RHR changes signal</p>
            <div className="space-y-3">
              {[
                { change: "Gradually decreasing (over weeks)", meaning: "Improving cardiovascular fitness", color: "text-green-400" },
                { change: "5–10 BPM spike (overnight)", meaning: "Incoming illness, often 24–48 hrs before symptoms", color: "text-red-400" },
                { change: "Chronically elevated (above baseline)", meaning: "Overtraining, chronic stress, or poor sleep quality", color: "text-yellow-400" },
                { change: "Sudden drop (same day)", meaning: "Dehydration or fatigue — body compensating", color: "text-orange-400" },
              ].map((r) => (
                <div key={r.change} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm">{r.change}</p>
                    <p className={`text-xs font-medium ${r.color}`}>{r.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The illness early warning system</h2>
          <p>
            This is the application that genuinely surprises people. Numerous studies — and a growing body of wearable data — have shown that RHR spikes predictably before you feel sick. Your immune system ramping up requires more blood flow, which means your heart has to beat faster even at rest. If your normal RHR is 62 and you wake up at 74, pay attention.
          </p>
          <p>
            Athletes and high-performance individuals have long used this signal to decide whether to train or rest on a given day. But it's equally valuable for anyone trying to catch a respiratory infection before it becomes a three-day ordeal. In our internal Pulse data, users who tracked their RHR reported feeling "forewarned" about illness in approximately 60% of cases where a significant spike occurred.
          </p>

          <h2 className="font-serif text-xl text-white mt-10">What's a good target for your RHR?</h2>
          <p>
            The American Heart Association defines the healthy range as 60–100 BPM, but research consistently shows that lower is better — within reason. Here's a general guide:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            {[
              { range: "< 50", label: "Athlete",    color: "border-green-500/30 text-green-400"  },
              { range: "50–60", label: "Excellent", color: "border-blue-500/30 text-blue-400"    },
              { range: "60–70", label: "Good",      color: "border-white/20 text-white/60"       },
              { range: "70–85", label: "Average",   color: "border-yellow-500/30 text-yellow-400"},
            ].map((r) => (
              <div key={r.range} className={`bg-white/[0.04] border rounded-xl p-4 text-center ${r.color}`}>
                <p className="text-lg font-bold font-serif">{r.range}</p>
                <p className="text-xs mt-0.5 opacity-70">{r.label}</p>
              </div>
            ))}
          </div>

          <p className="text-white/50 text-sm">
            Note: If your RHR is consistently above 90 without obvious cause, it's worth discussing with a Healthcare Provider. Pulse can generate a trend report you can share at your next appointment.
          </p>

          <h2 className="font-serif text-xl text-white mt-10">How to track it properly</h2>
          <p>
            The key is consistency. Measuring at the same time each day — ideally immediately on waking, before caffeine or movement — gives you the cleanest signal. Most modern wearables will track this automatically overnight, but they vary in accuracy. Look for devices that use optical heart rate sensors with averaging windows, rather than single-point readings.
          </p>
          <p>
            Once you have 2–3 weeks of baseline data, patterns become clear quickly. Your 7-day rolling average becomes your "personal normal," and deviations of more than 5–7 BPM above that baseline are worth noting.
          </p>

          {/* Pulse CTA inline */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-blue-600/5 border border-indigo-500/20 rounded-2xl p-6 my-8">
            <p className="text-white font-semibold text-sm mb-1">Track yours on Pulse</p>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Connect your Apple Watch, Fitbit, or Whoop and Pulse will track your 7-day RHR average, flag anomalies, and send alerts when your baseline shifts significantly.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-md shadow-black/20">
              Start Free
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>

          <h2 className="font-serif text-xl text-white mt-10">The bottom line</h2>
          <p>
            Resting heart rate is one of the few health metrics that's simultaneously easy to measure, slow to lie, and deeply revealing. It responds to almost everything that matters — fitness, illness, stress, sleep quality, and hydration — and it does so before most people notice anything consciously.
          </p>
          <p>
            Start tracking it. Give it four weeks. You'll be surprised what you learn about yourself.
          </p>
        </div>
      </article>

      {/* More posts */}
      <section className="py-12 px-4 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">More from the Journal</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { href: "/blog/athletes-and-glucose", title: "What Athletes Get Wrong About Glucose Monitoring", tag: "Performance" },
              { href: "/blog/sleep-quality-trap",   title: "The Sleep Quality Trap: Why 8 Hours Isn't Enough", tag: "Sleep Science" },
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
