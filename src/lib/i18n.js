export const translations = {
  en: {
    /* ── Navbar ── */
    nav: {
      features: "Features",
      pricing:  "Pricing",
      forHcps:  "For HCPs",
      blog:     "Blog",
      about:    "About",
      contact:  "Contact",
      signIn:   "Sign In",
      getStarted: "Get Started",
    },

    /* ── Hero ── */
    hero: {
      headline:   "Your health is happening",
      headlineItalic: "right now.",
      sub: "Don't wait for the next appointment to find out if something's wrong. Pulse streams your vitals in real time — solo, or alongside your Healthcare Provider.",
      cta1: "Start for Free",
      cta2: "I'm an HCP →",
      moreDevices: "& 10+ more devices",
      hipaa: "HIPAA Compliant",
      gdpr:  "GDPR Compliant",
      soc:   "SOC 2 Ready",
    },

    /* ── Dual audience ── */
    audience: {
      badge: "Who Pulse is for",
      forYouTitle: "For You",
      forYouSub: "Whether you're an athlete chasing a PB, someone managing a chronic condition, or simply taking health seriously — Pulse works on its own. No doctor required.",
      forYouItems: [
        "Connect your wearables in 2 minutes",
        "AI coach that reads your data daily",
        "Set goals, track progress, earn streaks",
        "Free plan · Premium from $9/mo",
      ],
      forYouCta: "Start solo — it's free",
      withHcpTitle: "With Your HCP",
      withHcpSub: "Connect with a verified Healthcare Provider directly on Pulse. Share your live data, get personalised recommendations, and attend virtual or in-person consultations.",
      withHcpItems: [
        "Browse & book verified HCPs",
        "Share your real-time vitals securely",
        "Get threshold alerts sent to your HCP",
        "HCPs start from AED 150/session",
      ],
      withHcpCta: "Explore HCP features",
    },

    /* ── Features ── */
    features: {
      badge: "What Pulse actually does",
      heading: "Built for people who take their health seriously",
      sub: "Four core pillars — each designed to give you information you can actually act on, not just numbers to ignore.",
    },

    /* ── AI Demo ── */
    ai: {
      badge: "AI Health Companion",
      heading1: "Ask anything.",
      heading2: "Get answers from your data.",
      sub: "Pulse's AI reads your live biomarkers, spots patterns, and explains what's happening in plain language — before you even think to ask.",
      bullets: [
        { label: "Set health goals",        icon: "🎯" },
        { label: "Create smart reminders",  icon: "⏰" },
        { label: "Analyse your trends",     icon: "📈" },
        { label: "Generate HCP reports",    icon: "📋" },
      ],
      cta: "Try the AI companion free",
    },

    /* ── HCP Section ── */
    hcp: {
      badge: "For Healthcare Providers",
      heading1: "Your patients between",
      heading2: "appointments matter too.",
      sub: "Monitor multiple patients from one dashboard. Receive instant alerts when something's off. Generate consultation-ready reports in one tap. Spend less time gathering data and more time on care.",
      bullets: [
        "Multi-patient vitals dashboard",
        "Custom threshold alerts per patient",
        "One-tap PDF health reports",
        "Secure, HIPAA-compliant messaging",
        "AI-assisted notes and summaries",
      ],
      cta: "Join as an HCP",
    },

    /* ── Testimonials ── */
    testimonials: {
      badge: "Patients, athletes & HCPs love it",
      heading: "Real people. Real results.",
    },

    /* ── Pricing ── */
    pricing: {
      badge: "Simple, transparent pricing",
      heading1: "Your health has a price.",
      heading2: "Ignoring it costs more.",
      sub: "Start free. Upgrade when you're ready. No hidden fees, no lock-in — cancel any time.",
      mostPopular: "Most Popular",
      perMonth: "/month",
      trialNote: "14-day trial · no card required",
      tiers: {
        free:       { name: "FREE",                    cta: "Get Started Free"  },
        pro:        { name: "PRO",                     cta: "Start Pro Free"    },
        hcp:        { name: "HEALTHCARE PROVIDER",     cta: "Join as HCP"       },
        enterprise: { name: "CLINIC / ENTERPRISE",     cta: "Contact Sales"     },
      },
    },

    /* ── CTA ── */
    cta: {
      heading1: "Your health won't wait.",
      heading2: "Neither should you.",
      button: "Create Free Account",
    },

    /* ── Footer ── */
    footer: {
      product: "PRODUCT",
      company: "COMPANY",
      legal:   "LEGAL",
      links: {
        features:  "Features",
        forHcps:   "For HCPs",
        pricing:   "Pricing",
        security:  "Security",
        about:     "About",
        blog:      "Blog",
        careers:   "Careers",
        contact:   "Contact",
        privacy:   "Privacy Policy",
        terms:     "Terms of Service",
        hipaa:     "HIPAA Notice",
        cookie:    "Cookie Policy",
      },
      copy: (year) => `© ${year} HealthEase Technologies LLC. All rights reserved.`,
    },
  },

  /* ════════════════════════════════════════
     ARABIC
  ════════════════════════════════════════ */
  ar: {
    nav: {
      features: "المميزات",
      pricing:  "الأسعار",
      forHcps:  "للأطباء",
      blog:     "المدونة",
      about:    "عن Pulse",
      contact:  "تواصل",
      signIn:   "تسجيل الدخول",
      getStarted: "ابدأ الآن",
    },

    hero: {
      headline:      "صحتك تحدث",
      headlineItalic: "الآن.",
      sub: "لا تنتظر الموعد القادم لتعرف أن هناك خطأ ما. يبث Pulse علاماتك الحيوية في الوقت الفعلي — بمفردك، أو بجانب مقدم رعايتك الصحية.",
      cta1: "ابدأ مجاناً",
      cta2: "← أنا طبيب / مقدم رعاية",
      moreDevices: "و +10 أجهزة أخرى",
      hipaa: "متوافق مع HIPAA",
      gdpr:  "متوافق مع GDPR",
      soc:   "جاهز لـ SOC 2",
    },

    audience: {
      badge: "من يستخدم Pulse",
      forYouTitle: "لك",
      forYouSub: "سواء كنت رياضياً تسعى لرقم قياسي، أو شخصاً يدير حالة مزمنة، أو ببساطة تهتم بصحتك — Pulse يعمل بمفرده. لا حاجة لطبيب.",
      forYouItems: [
        "اربط أجهزتك القابلة للارتداء في دقيقتين",
        "مدرب ذكاء اصطناعي يحلّل بياناتك يومياً",
        "ضع أهدافاً، تتبّع التقدم، احصد الإنجازات",
        "خطة مجانية · المميزة من 9$ شهرياً",
      ],
      forYouCta: "ابدأ بمفردك — مجاناً",
      withHcpTitle: "مع طبيبك",
      withHcpSub: "تواصل مع مقدم رعاية صحية معتمد مباشرةً على Pulse. شارك بياناتك الحية، واحصل على توصيات شخصية، واحضر استشارات افتراضية أو حضورية.",
      withHcpItems: [
        "تصفح واحجز أطباء معتمدين",
        "شارك علاماتك الحيوية بأمان تام",
        "احصل على تنبيهات تصل لطبيبك فوراً",
        "الاستشارات تبدأ من 150 درهم/جلسة",
      ],
      withHcpCta: "استكشف مميزات الأطباء",
    },

    features: {
      badge: "ما يفعله Pulse فعلاً",
      heading: "مبني للأشخاص الذين يأخذون صحتهم بجدية",
      sub: "أربعة محاور أساسية — كل منها مصمم لتزويدك بمعلومات تتصرف بناءً عليها، لا مجرد أرقام تتجاهلها.",
    },

    ai: {
      badge: "رفيق الصحة الذكي",
      heading1: "اسأل أي شيء.",
      heading2: "احصل على إجابات من بياناتك.",
      sub: "يقرأ الذكاء الاصطناعي في Pulse علاماتك الحيوية الحية، يرصد الأنماط، ويشرح ما يحدث بلغة بسيطة — قبل أن تفكر حتى في السؤال.",
      bullets: [
        { label: "حدّد أهدافاً صحية",     icon: "🎯" },
        { label: "أنشئ تذكيرات ذكية",     icon: "⏰" },
        { label: "حلّل اتجاهاتك الصحية",  icon: "📈" },
        { label: "أنشئ تقارير للطبيب",     icon: "📋" },
      ],
      cta: "جرّب المساعد الذكي مجاناً",
    },

    hcp: {
      badge: "لمقدمي الرعاية الصحية",
      heading1: "مرضاك بين المواعيد",
      heading2: "مهمون أيضاً.",
      sub: "راقب عدة مرضى من لوحة تحكم واحدة. احصل على تنبيهات فورية عند أي تغيير. أنشئ تقارير جاهزة للاستشارة بنقرة واحدة. أقل وقتاً في جمع البيانات، وأكثر وقتاً في الرعاية.",
      bullets: [
        "لوحة علامات حيوية لعدة مرضى",
        "تنبيهات مخصصة لكل مريض",
        "تقارير PDF بنقرة واحدة",
        "مراسلة آمنة ومتوافقة مع HIPAA",
        "ملاحظات وملخصات بمساعدة الذكاء الاصطناعي",
      ],
      cta: "انضم كطبيب",
    },

    testimonials: {
      badge: "يحبه المرضى والرياضيون والأطباء",
      heading: "أشخاص حقيقيون. نتائج حقيقية.",
    },

    pricing: {
      badge: "أسعار بسيطة وشفافة",
      heading1: "لصحتك ثمن.",
      heading2: "تجاهلها أغلى.",
      sub: "ابدأ مجاناً. طوّر اشتراكك عندما تكون مستعداً. بلا رسوم خفية، بلا التزام — ألغِ في أي وقت.",
      mostPopular: "الأكثر شيوعاً",
      perMonth: "/شهر",
      trialNote: "14 يوم تجريبي · بدون بطاقة",
      tiers: {
        free:       { name: "مجاني",                   cta: "ابدأ مجاناً"         },
        pro:        { name: "برو",                      cta: "جرّب Pro مجاناً"     },
        hcp:        { name: "مقدم رعاية صحية",         cta: "انضم كطبيب"          },
        enterprise: { name: "عيادة / مؤسسة",          cta: "تواصل مع المبيعات"   },
      },
    },

    cta: {
      heading1: "صحتك لا تنتظر.",
      heading2: "وأنت أيضاً.",
      button: "أنشئ حساباً مجاناً",
    },

    footer: {
      product: "المنتج",
      company: "الشركة",
      legal:   "القانونية",
      links: {
        features:  "المميزات",
        forHcps:   "للأطباء",
        pricing:   "الأسعار",
        security:  "الأمان",
        about:     "عن Pulse",
        blog:      "المدونة",
        careers:   "الوظائف",
        contact:   "تواصل معنا",
        privacy:   "سياسة الخصوصية",
        terms:     "شروط الخدمة",
        hipaa:     "إشعار HIPAA",
        cookie:    "سياسة الكوكيز",
      },
      copy: (year) => `© ${year} HealthEase Technologies LLC. جميع الحقوق محفوظة.`,
    },
  },
};
