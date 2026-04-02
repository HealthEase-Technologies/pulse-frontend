import base64, os

with open('d:/hwud/pulse-frontend/public/panda_b64.txt') as f:
    panda_b64 = f.read().strip()
with open('d:/hwud/pulse-frontend/public/qr_b64.txt') as f:
    qr_b64 = f.read().strip()

html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&display=swap');

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}

body {
  font-family:'Inter',system-ui,sans-serif;
  background:#060c1c;
  width:794px;
  color:#fff;
  -webkit-font-smoothing:antialiased;
}

.page {
  width:794px;
  min-height:1123px;
  background: linear-gradient(160deg,#0a1230 0%,#060c1c 50%,#060e1f 100%);
  position:relative;
  overflow:hidden;
}

.orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
.orb1{width:500px;height:500px;background:rgba(99,102,241,0.2);top:-200px;left:-180px;}
.orb2{width:380px;height:380px;background:rgba(139,92,246,0.12);top:200px;right:-140px;}
.orb3{width:350px;height:350px;background:rgba(16,185,129,0.09);bottom:80px;left:-60px;}
.orb4{width:280px;height:280px;background:rgba(99,102,241,0.07);bottom:-60px;right:60px;}

.grid-bg{
  position:absolute;inset:0;z-index:0;
  background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);
  background-size:40px 40px;
}

.content{position:relative;z-index:1;padding:28px 36px 24px;}

/* HEADER */
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
.logo{display:flex;align-items:center;gap:10px;}
.logo-icon{
  width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  border-radius:11px;display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 24px rgba(99,102,241,0.45);flex-shrink:0;
}
.logo-name{font-size:22px;font-weight:800;letter-spacing:-0.5px;line-height:1;}
.logo-url{font-size:9.5px;color:rgba(99,102,241,0.8);font-weight:500;letter-spacing:1.2px;}
.hw-badge{
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
  border-radius:8px;padding:6px 12px;text-align:right;
}
.hw-badge .t1{font-size:9.5px;color:rgba(255,255,255,0.45);font-weight:500;}
.hw-badge .t2{font-size:8.5px;color:#6366f1;font-weight:700;letter-spacing:0.5px;margin-top:1px;}

.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,0.35),transparent);margin-bottom:22px;}

/* HERO */
.hero{text-align:center;margin-bottom:20px;}
.eyebrow{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);
  border-radius:100px;padding:4px 14px;font-size:9.5px;font-weight:600;
  color:#a5b4fc;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;
}
.hero h1{
  font-family:'Playfair Display',serif;font-size:52px;font-weight:900;line-height:1.05;
  background:linear-gradient(135deg,#fff 0%,#c7d2fe 55%,#a5b4fc 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-bottom:8px;
}
.hero-sub{font-size:12.5px;color:rgba(255,255,255,0.42);letter-spacing:0.2px;}

/* STATS */
.stats{display:flex;gap:8px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;}
.stat{
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
  border-radius:100px;padding:6px 16px;text-align:center;
}
.sv{font-size:14px;font-weight:800;color:#818cf8;line-height:1;}
.sl{font-size:8.5px;color:rgba(255,255,255,0.32);font-weight:500;letter-spacing:0.4px;margin-top:2px;}

/* MAIN GRID */
.main-grid{display:grid;grid-template-columns:1fr 240px;gap:16px;margin-bottom:16px;}

/* FEATURES */
.sec-label{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:rgba(255,255,255,0.22);margin-bottom:8px;}
.feat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;}
.feat{
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
  border-radius:12px;padding:12px;
}
.fi{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:7px;}
.ft{font-size:10.5px;font-weight:700;color:#fff;margin-bottom:3px;}
.fd{font-size:8.5px;color:rgba(255,255,255,0.36);line-height:1.5;}

/* PRICING */
.plans{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;}
.plan{
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  border-radius:12px;padding:12px;position:relative;overflow:visible;
}
.plan.best{background:rgba(16,185,129,0.06);border-color:rgba(16,185,129,0.28);}
.pbadge{
  position:absolute;top:-9px;left:50%;transform:translateX(-50%);
  background:#10b981;color:#fff;font-size:7.5px;font-weight:800;
  padding:2px 10px;border-radius:100px;letter-spacing:0.5px;white-space:nowrap;
}
.pn{font-size:9.5px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;}
.pp{font-size:24px;font-weight:900;line-height:1;margin-bottom:1px;}
.pper{font-size:9px;color:rgba(255,255,255,0.28);margin-bottom:7px;}
.pf{list-style:none;}
.pf li{font-size:8.5px;color:rgba(255,255,255,0.42);padding:1.5px 0;display:flex;gap:5px;align-items:flex-start;line-height:1.3;}
.pf li::before{content:'✓';font-size:7.5px;margin-top:1px;flex-shrink:0;}

/* HCP */
.hcp{
  background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.18);
  border-radius:12px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;
}
.hcp-t{font-size:9px;color:#a5b4fc;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;}
.hcp-p{font-size:20px;font-weight:900;color:#818cf8;}
.hcp-sub{font-size:8px;color:rgba(255,255,255,0.25);margin-top:1px;}
.hf{list-style:none;margin-top:5px;}
.hf li{font-size:8.5px;color:rgba(255,255,255,0.42);padding:1px 0;display:flex;gap:4px;}
.hf li::before{content:'→';color:#6366f1;font-size:8px;}
.earn{
  background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.15);
  border-radius:9px;padding:10px;
}
.et{font-size:9.5px;color:#a5b4fc;font-weight:700;margin-bottom:5px;}
.er{font-size:8.5px;color:rgba(255,255,255,0.38);margin-bottom:3px;}
.er span{color:rgba(255,255,255,0.75);font-weight:700;}

/* RIGHT COL */
.right{display:flex;flex-direction:column;gap:12px;}

/* PANDA */
.panda-card{
  background:linear-gradient(160deg,rgba(16,185,129,0.07),rgba(99,102,241,0.07));
  border:1px solid rgba(16,185,129,0.2);border-radius:16px;padding:16px;text-align:center;
  position:relative;overflow:hidden;
}
.panda-card::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 30%,rgba(16,185,129,0.1),transparent 65%);
}
.panda-card>*{position:relative;}
.pi{
  width:148px;height:148px;object-fit:contain;display:block;margin:0 auto 10px;
  border-radius:50%;background:rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.08);
}
.ptag{font-size:8.5px;color:#6ee7b7;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.ptitle{
  font-family:'Playfair Display',serif;font-size:16px;font-weight:800;
  color:#fff;margin-bottom:4px;line-height:1.25;
}
.pdesc{font-size:8.5px;color:rgba(255,255,255,0.36);line-height:1.5;}
.moods{display:flex;gap:5px;justify-content:center;margin-top:8px;}
.mood{
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
  border-radius:100px;padding:2px 9px;font-size:8px;font-weight:600;
}

/* HIW */
.hiw{
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
  border-radius:12px;padding:13px;
}
.hiw-t{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.28);margin-bottom:9px;}
.step{display:flex;gap:8px;align-items:flex-start;margin-bottom:7px;}
.step:last-child{margin-bottom:0;}
.sn{
  width:18px;height:18px;border-radius:50%;font-size:8px;font-weight:800;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;
}
.st{font-size:9.5px;font-weight:700;color:#fff;line-height:1.2;}
.sd{font-size:8px;color:rgba(255,255,255,0.32);line-height:1.4;margin-top:1px;}

/* QR */
.qr-card{
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  border-radius:12px;padding:12px;text-align:center;
}
.qr-img{width:100px;height:100px;object-fit:contain;border-radius:7px;display:block;margin:0 auto 7px;}
.ql{font-size:9.5px;font-weight:700;color:#fff;margin-bottom:2px;}
.qu{font-size:9px;color:#6366f1;font-weight:600;}
.qsub{font-size:7.5px;color:rgba(255,255,255,0.2);margin-top:3px;}

/* FOOTER */
.footer{
  border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;
  display:flex;align-items:center;justify-content:space-between;
}
.fl{display:flex;align-items:center;gap:8px;}
.fli{
  width:22px;height:22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
  border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.flt{font-size:13px;font-weight:800;}
.fc{font-size:8.5px;color:rgba(255,255,255,0.22);}
.fr{text-align:right;}
.fa{font-size:8.5px;color:rgba(99,102,241,0.7);}
.fcopy{font-size:7.5px;color:rgba(255,255,255,0.15);margin-top:2px;}

/* color utils */
.ci{color:#818cf8;} .cg{color:#34d399;} .cp{color:#c084fc;} .ca{color:#fbbf24;} .cr{color:#f87171;} .cc{color:#22d3ee;}
.bgi{background:rgba(99,102,241,0.14);} .bgg{background:rgba(16,185,129,0.14);}
.bgp{background:rgba(139,92,246,0.14);} .bga{background:rgba(245,158,11,0.14);}
.bgr{background:rgba(239,68,68,0.14);} .bgc{background:rgba(6,182,212,0.14);}
</style>
</head>
<body>
<div class="page">
  <div class="orb orb1"></div><div class="orb orb2"></div>
  <div class="orb orb3"></div><div class="orb orb4"></div>
  <div class="grid-bg"></div>
  <div class="content">

    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
            <path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div><div class="logo-name">Pulse</div><div class="logo-url">GETPULSE.APP</div></div>
      </div>
      <div class="hw-badge">
        <div class="t1">Heriot-Watt University &nbsp;·&nbsp; Dubai Campus</div>
        <div class="t2">STUDENT VENTURE &nbsp;·&nbsp; 2025</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="hero">
      <div class="eyebrow">
        <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4"/></svg>
        Your health is
      </div>
      <h1>Happening Right Now.</h1>
      <div class="hero-sub">Real-time vitals &nbsp;&middot;&nbsp; AI-powered insights &nbsp;&middot;&nbsp; Connected care &nbsp;&middot;&nbsp; Gamified wellness</div>
    </div>

    <div class="stats">
      <div class="stat"><div class="sv">6+</div><div class="sl">Biomarkers</div></div>
      <div class="stat"><div class="sv">5+</div><div class="sl">Wearables</div></div>
      <div class="stat"><div class="sv">AI</div><div class="sl">Health Coach</div></div>
      <div class="stat"><div class="sv">24h</div><div class="sl">Async Care</div></div>
      <div class="stat"><div class="sv">Free</div><div class="sl">To Start</div></div>
      <div class="stat"><div class="sv">&infin;</div><div class="sl">Continuous</div></div>
    </div>

    <div class="main-grid">
      <div><!-- LEFT -->

        <div class="sec-label">Platform Features</div>
        <div class="feat-grid">
          <div class="feat">
            <div class="fi bgi">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div class="ft">Live Tracking</div>
            <div class="fd">Heart rate, BP, glucose, SpO&sup2;, sleep &amp; steps &mdash; real-time.</div>
          </div>
          <div class="feat">
            <div class="fi bgp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="ft">AI Companion</div>
            <div class="fd">Personalised health recommendations powered by your data.</div>
          </div>
          <div class="feat">
            <div class="fi bgg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="ft">Connected Care</div>
            <div class="fd">Async HCP chat, care plans &amp; instant threshold alerts.</div>
          </div>
          <div class="feat">
            <div class="fi bga">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div class="ft">Goal System</div>
            <div class="fd">Daily goals, streaks &amp; achievements to build lasting habits.</div>
          </div>
          <div class="feat">
            <div class="fi bgc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div class="ft">Deep Analytics</div>
            <div class="fd">Trend charts, weekly summaries, PDF &amp; CSV report exports.</div>
          </div>
          <div class="feat">
            <div class="fi bgr">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="ft">HIPAA &amp; GDPR</div>
            <div class="fd">Clinical-grade privacy. End-to-end encrypted. Your data, always.</div>
          </div>
        </div>

        <div class="sec-label">Patient Plans</div>
        <div class="plans">
          <div class="plan">
            <div class="pn">Free</div>
            <div class="pp" style="color:rgba(255,255,255,0.8)">$0</div>
            <div class="pper">forever free</div>
            <ul class="pf">
              <li style="color:#818cf8">Core biomarker tracking</li>
              <li style="color:#818cf8">Basic AI insights</li>
              <li style="color:#818cf8">Goal setting</li>
              <li style="color:#818cf8">Pulse Pet</li>
            </ul>
          </div>
          <div class="plan">
            <div class="pn">Pro</div>
            <div class="pp ci">$12</div>
            <div class="pper">/mo &middot; AED 44</div>
            <ul class="pf">
              <li style="color:#818cf8">Everything in Free</li>
              <li style="color:#818cf8">Advanced analytics</li>
              <li style="color:#818cf8">Wearable sync</li>
              <li style="color:#818cf8">Priority AI insights</li>
              <li style="color:#818cf8">Trend reports</li>
            </ul>
          </div>
          <div class="plan best">
            <div class="pbadge">MOST POPULAR</div>
            <div class="pn cg">Care+</div>
            <div class="pp cg">$29</div>
            <div class="pper">/mo &middot; AED 107</div>
            <ul class="pf">
              <li style="color:#34d399">Everything in Pro</li>
              <li style="color:#34d399">Async HCP chat</li>
              <li style="color:#34d399">24h response SLA</li>
              <li style="color:#34d399">Ongoing care plan</li>
              <li style="color:#34d399">Instant alerts</li>
            </ul>
          </div>
        </div>

        <div class="hcp">
          <div>
            <div class="hcp-t">Healthcare Provider</div>
            <div style="display:flex;align-items:baseline;gap:4px;">
              <div class="hcp-p">$49</div>
              <div style="font-size:9px;color:rgba(255,255,255,0.28)">/month &middot; AED 180</div>
            </div>
            <div class="hcp-sub">14-day free trial &middot; No card required</div>
            <ul class="hf">
              <li>Listed on Pulse marketplace</li>
              <li>Real-time patient biomarkers</li>
              <li>Clinical notes &amp; care plans</li>
              <li>License verification by Pulse</li>
            </ul>
          </div>
          <div class="earn">
            <div class="et">&#128176; How you earn</div>
            <div class="er"><span>80%</span> of every consultation you set</div>
            <div class="er"><span>60&ndash;70%</span> of Care+ subscriptions</div>
            <div style="font-size:7.5px;color:rgba(255,255,255,0.22);margin-top:5px;line-height:1.4">Set your own rates &middot; $20&ndash;$50/session<br/>No ceiling on earnings</div>
          </div>
        </div>

      </div><!-- /left -->

      <div class="right">
        <div class="panda-card">
          <img src="data:image/png;base64,PANDA_B64" class="pi" alt="Pulse Panda"/>
          <div class="ptag">Meet your Pulse Pet</div>
          <div class="ptitle">Your health,<br/>gamified.</div>
          <div class="pdesc">Your pet's mood mirrors your real health score. Hit your goals &mdash; keep it happy.</div>
          <div class="moods">
            <div class="mood" style="color:#f87171;border-color:rgba(248,113,113,0.25)">&#128546; Sad</div>
            <div class="mood" style="color:#fbbf24;border-color:rgba(251,191,36,0.25)">&#128528; Neutral</div>
            <div class="mood" style="color:#34d399;border-color:rgba(52,211,153,0.35)">&#128522; Happy</div>
          </div>
        </div>

        <div class="hiw">
          <div class="hiw-t">How It Works</div>
          <div class="step">
            <div class="sn bgi ci">1</div>
            <div><div class="st">Connect your device</div><div class="sd">Pair Apple Watch, Fitbit, Whoop or enter manually.</div></div>
          </div>
          <div class="step">
            <div class="sn bgg cg">2</div>
            <div><div class="st">Track your biomarkers</div><div class="sd">Live dashboard updates as your data streams in.</div></div>
          </div>
          <div class="step">
            <div class="sn bgp cp">3</div>
            <div><div class="st">Connect your HCP</div><div class="sd">Invite a provider or browse the marketplace.</div></div>
          </div>
          <div class="step">
            <div class="sn bga ca">4</div>
            <div><div class="st">Get AI insights</div><div class="sd">Pulse AI reviews your data and recommends actions.</div></div>
          </div>
        </div>

        <div class="qr-card">
          <img src="data:image/png;base64,QR_B64" class="qr-img" alt="QR"/>
          <div class="ql">Scan to get started</div>
          <div class="qu">getpulse.app</div>
          <div class="qsub">iOS &nbsp;&middot;&nbsp; Android &nbsp;&middot;&nbsp; Web</div>
        </div>
      </div><!-- /right -->
    </div><!-- /main-grid -->

    <div class="footer">
      <div class="fl">
        <div class="fli">
          <svg width="11" height="8" viewBox="0 0 22 16" fill="none">
            <path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flt">Pulse</div>
        <div class="fc">HealthEase Technologies LLC &nbsp;&middot;&nbsp; JLT Towers, Dubai</div>
      </div>
      <div class="fr">
        <div class="fa">Academic Advisor: Prof. Talal &mdash; Heriot-Watt University Dubai</div>
        <div class="fcopy">&copy; 2025 HealthEase Technologies LLC &nbsp;&middot;&nbsp; getpulse.app &nbsp;&middot;&nbsp; All rights reserved</div>
      </div>
    </div>

  </div>
</div>
</body>
</html>"""

html = html.replace("PANDA_B64", panda_b64).replace("QR_B64", qr_b64)

out = 'd:/hwud/pulse-frontend/public/flyer_pro.html'
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written {len(html)} chars to {out}")
