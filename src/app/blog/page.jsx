import MarketingNav from "@/components/MarketingNav";
import Link from "next/link";

export const metadata = {
  title: "Blog · Pulse",
  description: "Health insights, research, and practical guides from the Pulse team.",
};

const POSTS = [
  {
    slug:    "resting-heart-rate",
    tag:     "Cardiology",
    title:   "Why Your Resting Heart Rate Is the Most Underrated Health Metric",
    excerpt: "Most people ignore their RHR unless a doctor mentions it. They shouldn't. Here's what this single number can tell you about your fitness, stress levels, and whether something is silently going wrong.",
    author:  "Pulse Research Team",
    date:    "March 14, 2025",
    readTime: "6 min read",
    gradient: "from-red-500/20 to-rose-600/10",
    icon: "❤️",
  },
  {
    slug:    "athletes-and-glucose",
    tag:     "Performance",
    title:   "What Athletes Get Wrong About Glucose Monitoring",
    excerpt: "Continuous glucose monitors aren't just for diabetics anymore. Endurance athletes are using real-time glucose data to prevent bonking, optimise fuelling windows, and recover faster. Here's the science.",
    author:  "Pulse Research Team",
    date:    "February 28, 2025",
    readTime: "8 min read",
    gradient: "from-amber-500/20 to-orange-600/10",
    icon: "⚡",
  },
  {
    slug:    "sleep-quality-trap",
    tag:     "Sleep Science",
    title:   "The Sleep Quality Trap: Why 8 Hours Still Leaves You Exhausted",
    excerpt: "You're sleeping 8 hours a night and still waking up tired. You're not broken — you're measuring the wrong thing. Duration is only half the story, and most people are optimising for the wrong half.",
    author:  "Pulse Research Team",
    date:    "February 10, 2025",
    readTime: "7 min read",
    gradient: "from-indigo-500/20 to-violet-600/10",
    icon: "🌙",
  },
];

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/15 border border-white/25 backdrop-blur-sm">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-3.5 h-3.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function BlogPage() {
  return (
    <div className="relative bg-gray-950 text-white min-h-screen overflow-x-hidden">
      <MarketingNav />

      {/* Header */}
      <section className="relative pt-40 pb-16 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] opacity-8"
            style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.6) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="font-serif text-[clamp(2rem,5vw,3.8rem)] text-white leading-tight mb-4">
            The Pulse Journal
          </h1>
          <p className="text-white/45 text-sm leading-relaxed max-w-lg mx-auto">
            Evidence-backed health insights, practical guides, and honest takes on what the data actually says. Written by clinicians, for everyone.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group block bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-7 transition-all duration-300">
              <div className="flex items-start gap-5">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${post.gradient} border border-white/[0.1] flex items-center justify-center text-2xl flex-shrink-0`}>
                  {post.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest border border-white/[0.1] rounded px-2 py-0.5">{post.tag}</span>
                    <span className="text-white/20 text-[11px]">{post.readTime}</span>
                  </div>
                  <h2 className="text-white font-semibold text-lg leading-snug mb-2 group-hover:text-white/90 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/60 to-blue-600/60 flex items-center justify-center text-[10px] text-white font-bold">
                        {post.author.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-white/35 text-[11px]">{post.author} · {post.date}</span>
                    </div>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/[0.06] text-center">
        <p className="text-white/40 text-sm mb-4">Track the metrics these articles are about — in real time.</p>
        <Link href="/register"
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-7 py-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20">
          Start with Pulse Free
        </Link>
      </section>

      <div className="border-t border-white/[0.06] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
        <p className="text-white/20 text-[11px]">© {new Date().getFullYear()} HealthEase Technologies LLC.</p>
        <div className="flex items-center gap-4">
          {[{ l: "About", h: "/about" }, { l: "Contact", h: "/contact" }, { l: "Home", h: "/" }].map((i) => (
            <Link key={i.l} href={i.h} className="text-white/25 text-[11px] hover:text-white/60 transition-colors">{i.l}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
