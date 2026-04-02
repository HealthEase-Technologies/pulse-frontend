import base64, os, subprocess

with open('d:/hwud/pulse-frontend/public/panda_b64.txt') as f:
    panda_b64 = f.read().strip()
with open('d:/hwud/pulse-frontend/public/qr_b64.txt') as f:
    qr_b64 = f.read().strip()

CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
TMP = "C:/Users/Shazee/AppData/Local/Temp"
OUT = "d:/hwud/pulse-frontend/public"

# ─── POST 1: Pain Hook ────────────────────────────────────────────────────────
post1 = """<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
.page{width:1080px;height:1080px;background:linear-gradient(145deg,#0a1230 0%,#060c1c 50%,#080e20 100%);display:flex;flex-direction:column;justify-content:space-between;padding:64px;position:relative;overflow:hidden;}
.orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;}
.o1{width:600px;height:600px;background:rgba(99,102,241,0.22);top:-200px;left:-200px;}
.o2{width:400px;height:400px;background:rgba(139,92,246,0.14);bottom:-100px;right:-100px;}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);background-size:54px 54px;}
.content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:space-between;}

/* TOP */
.top{display:flex;justify-content:space-between;align-items:flex-start;}
.logo{display:flex;align-items:center;gap:12px;}
.li{width:44px;height:44px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(99,102,241,0.5);}
.ln{font-size:22px;font-weight:800;color:#fff;}
.tag{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:100px;padding:8px 20px;font-size:12px;font-weight:700;color:#a5b4fc;letter-spacing:1.5px;text-transform:uppercase;}

/* MIDDLE */
.mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 0;}
.stat-line{font-size:15px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.5px;margin-bottom:16px;}
.stat-line span{color:#f87171;font-weight:800;}
h1{font-family:'Playfair Display',serif;font-size:86px;font-weight:900;line-height:0.95;margin-bottom:20px;letter-spacing:-2px;}
.h1a{color:#fff;}
.h1b{color:transparent;background:linear-gradient(135deg,#6366f1,#a5b4fc);-webkit-background-clip:text;background-clip:text;font-style:italic;}
.sub{font-size:20px;color:rgba(255,255,255,0.45);line-height:1.5;max-width:680px;font-weight:400;}
.sub b{color:rgba(255,255,255,0.8);font-weight:700;}

/* BOTTOM */
.bot{display:flex;align-items:flex-end;justify-content:space-between;}
.pills{display:flex;gap:10px;flex-wrap:wrap;}
.pill{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:100px;padding:10px 20px;font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);}
.pill.g{border-color:rgba(16,185,129,0.35);color:#34d399;background:rgba(16,185,129,0.08);}
.pill.i{border-color:rgba(99,102,241,0.35);color:#818cf8;background:rgba(99,102,241,0.08);}
.cta{text-align:right;}
.cta-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:16px;font-weight:800;padding:16px 32px;border-radius:100px;display:inline-block;letter-spacing:0.3px;box-shadow:0 0 40px rgba(99,102,241,0.4);}
.cta-sub{font-size:11px;color:rgba(255,255,255,0.25);margin-top:8px;text-align:right;}

/* accent bar */
.bar{position:absolute;left:0;top:0;width:4px;height:100%;background:linear-gradient(180deg,#6366f1,#8b5cf6,transparent);}
</style></head><body>
<div class="page">
<div class="orb o1"></div><div class="orb o2"></div><div class="grid"></div>
<div class="bar"></div>
<div class="content">
  <div class="top">
    <div class="logo">
      <div class="li"><svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="ln">Pulse</div>
    </div>
    <div class="tag">⚡ Real-Time Health</div>
  </div>

  <div class="mid">
    <div class="stat-line">Your doctor sees you <span>8 minutes</span> a year. That's 0.0015% of your life.</div>
    <h1>
      <div class="h1a">What happens</div>
      <div class="h1b">in the other</div>
      <div class="h1a">99.99%?</div>
    </h1>
    <div class="sub">Most people find out something is wrong <b>at the hospital.</b><br/>Pulse tells you <b>before it gets that far.</b></div>
  </div>

  <div class="bot">
    <div class="pills">
      <div class="pill g">24/7 Monitoring</div>
      <div class="pill i">AI Health Coach</div>
      <div class="pill g">Free to Start</div>
      <div class="pill">6+ Biomarkers</div>
    </div>
    <div class="cta">
      <div class="cta-btn">getpulse.app →</div>
      <div class="cta-sub">Free · No credit card</div>
    </div>
  </div>
</div>
</div>
</body></html>"""

# ─── POST 2: Value Stack (Hormozi) ────────────────────────────────────────────
post2 = """<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
.page{width:1080px;height:1080px;background:linear-gradient(145deg,#060c1c 0%,#0a1228 60%,#060c1c 100%);display:flex;flex-direction:column;padding:56px 64px;position:relative;overflow:hidden;gap:32px;}
.orb{position:absolute;border-radius:50%;filter:blur(90px);}
.o1{width:500px;height:500px;background:rgba(16,185,129,0.15);top:-150px;right:-100px;}
.o2{width:400px;height:400px;background:rgba(99,102,241,0.12);bottom:-100px;left:-80px;}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:54px 54px;}
z{position:relative;z-index:2;}

/* HEADER */
.header{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;}
.logo{display:flex;align-items:center;gap:10px;}
.li{width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(99,102,241,0.4);}
.ln{font-size:20px;font-weight:800;color:#fff;}
.eyebrow{font-size:12px;font-weight:700;color:#34d399;letter-spacing:2px;text-transform:uppercase;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);padding:7px 18px;border-radius:100px;}

/* TITLE */
.title-block{position:relative;z-index:2;}
.t1{font-size:15px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;}
h1{font-family:'Playfair Display',serif;font-size:64px;font-weight:900;line-height:1;color:#fff;letter-spacing:-1px;}
h1 span{color:transparent;background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;}

/* VALUE STACK */
.stack{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;}
.item{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 20px;}
.item.hi{background:rgba(16,185,129,0.06);border-color:rgba(16,185,129,0.2);}
.il{display:flex;align-items:center;gap:14px;}
.ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;}
.it{font-size:15px;font-weight:700;color:#fff;}
.id{font-size:12px;color:rgba(255,255,255,0.38);margin-top:1px;}
.ir{text-align:right;}
.struck{font-size:13px;color:rgba(255,255,255,0.25);text-decoration:line-through;margin-bottom:2px;}
.price{font-size:16px;font-weight:800;color:#34d399;}

/* TOTAL */
.total{position:relative;z-index:2;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:18px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;}
.tl .t1x{font-size:13px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;letter-spacing:1px;}
.tl .t2x{font-size:38px;font-weight:900;color:#fff;line-height:1;}
.tl .t2x span{color:#818cf8;}
.tl .t3x{font-size:13px;color:rgba(255,255,255,0.3);margin-top:3px;}
.tr .cta{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:800;padding:14px 28px;border-radius:100px;display:inline-block;box-shadow:0 0 30px rgba(99,102,241,0.4);}
.tr .cs{font-size:11px;color:rgba(255,255,255,0.25);margin-top:8px;text-align:center;}
</style></head><body>
<div class="page">
<div class="orb o1"></div><div class="orb o2"></div><div class="grid"></div>

<div class="header">
  <div class="logo">
    <div class="li"><svg width="20" height="14" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="ln">Pulse</div>
  </div>
  <div class="eyebrow">The Offer Breakdown</div>
</div>

<div class="title-block">
  <div class="t1">What you'd normally pay vs. what we charge</div>
  <h1>The <span>unfair</span> deal<br/>we're giving you.</h1>
</div>

<div class="stack">
  <div class="item">
    <div class="il">
      <div class="ic" style="background:rgba(99,102,241,0.15)">📊</div>
      <div><div class="it">24/7 Biomarker Monitoring</div><div class="id">Heart rate, BP, glucose, SpO₂, sleep, steps</div></div>
    </div>
    <div class="ir"><div class="struck">$30/mo</div><div class="price">Free</div></div>
  </div>
  <div class="item">
    <div class="il">
      <div class="ic" style="background:rgba(139,92,246,0.15)">🤖</div>
      <div><div class="it">Personalised AI Health Coach</div><div class="id">Daily insights, recommendations & alerts</div></div>
    </div>
    <div class="ir"><div class="struck">$25/mo</div><div class="price">Free</div></div>
  </div>
  <div class="item">
    <div class="il">
      <div class="ic" style="background:rgba(245,158,11,0.15)">🎯</div>
      <div><div class="it">Goal Tracking + Streak System</div><div class="id">Daily targets, habit building, achievements</div></div>
    </div>
    <div class="ir"><div class="struck">$10/mo</div><div class="price">Free</div></div>
  </div>
  <div class="item hi">
    <div class="il">
      <div class="ic" style="background:rgba(16,185,129,0.15)">💬</div>
      <div><div class="it">Async HCP Chat + Care Plan</div><div class="id">24h response SLA · Ongoing care · Instant alerts</div></div>
    </div>
    <div class="ir"><div class="struck">$150/mo</div><div class="price">$29/mo</div></div>
  </div>
</div>

<div class="total">
  <div class="tl">
    <div class="t1x">Normal price</div>
    <div class="t2x"><span style="text-decoration:line-through;color:rgba(255,255,255,0.3)">$215</span>&nbsp;→&nbsp;<span>Free</span></div>
    <div class="t3x">to start · No card needed · Cancel anytime</div>
  </div>
  <div class="tr">
    <div class="cta">Start for Free →</div>
    <div class="cs">getpulse.app</div>
  </div>
</div>

</div>
</body></html>"""

# ─── POST 3: Panda / Emotional Hook ──────────────────────────────────────────
post3 = f"""<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,800&display=swap');
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}}
.page{{width:1080px;height:1080px;background:linear-gradient(145deg,#060c1c 0%,#081424 50%,#060c1c 100%);display:grid;grid-template-columns:1fr 1fr;position:relative;overflow:hidden;}}
.orb{{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}}
.o1{{width:500px;height:500px;background:rgba(16,185,129,0.18);top:-100px;right:-100px;}}
.o2{{width:400px;height:400px;background:rgba(99,102,241,0.15);bottom:-100px;left:-80px;}}
.o3{{width:350px;height:350px;background:rgba(139,92,246,0.1);top:200px;left:100px;}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:54px 54px;}}

/* LEFT */
.left{{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:space-between;padding:56px 48px 56px 64px;}}
.logo{{display:flex;align-items:center;gap:10px;}}
.li{{width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(99,102,241,0.4);}}
.ln{{font-size:20px;font-weight:800;color:#fff;}}

.mid{{flex:1;display:flex;flex-direction:column;justify-content:center;padding:24px 0;}}
.eyebrow{{font-size:11px;font-weight:700;color:#34d399;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;}}
h1{{font-family:'Playfair Display',serif;font-size:68px;font-weight:900;line-height:0.95;color:#fff;letter-spacing:-2px;margin-bottom:24px;}}
h1 .ital{{color:transparent;background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;font-style:italic;}}
.sub{{font-size:17px;color:rgba(255,255,255,0.45);line-height:1.6;margin-bottom:28px;}}
.sub b{{color:rgba(255,255,255,0.8);font-weight:700;}}

.moods{{display:flex;flex-direction:column;gap:8px;}}
.mood{{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 16px;}}
.mood-dot{{width:10px;height:10px;border-radius:50%;flex-shrink:0;}}
.mood-info .mt{{font-size:12px;font-weight:700;color:#fff;}}
.mood-info .md{{font-size:10px;color:rgba(255,255,255,0.35);}}
.mood-score{{margin-left:auto;font-size:12px;font-weight:800;padding:3px 10px;border-radius:100px;}}

.bottom{{}}
.cta-btn{{background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:15px;font-weight:800;padding:16px 32px;border-radius:100px;display:inline-block;letter-spacing:0.3px;box-shadow:0 0 30px rgba(16,185,129,0.35);margin-bottom:8px;}}
.cta-sub{{font-size:11px;color:rgba(255,255,255,0.25);}}

/* RIGHT */
.right{{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 48px 48px 0;gap:20px;}}
.panda-wrap{{position:relative;}}
.panda-img{{width:340px;height:340px;object-fit:contain;border-radius:50%;background:rgba(0,0,0,0.3);border:3px solid rgba(16,185,129,0.3);box-shadow:0 0 60px rgba(16,185,129,0.2),0 0 120px rgba(16,185,129,0.1);display:block;}}
.glow-ring{{position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(16,185,129,0.15);animation:none;}}

.score-badge{{background:linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.08));border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:20px 32px;text-align:center;width:100%;}}
.sb-label{{font-size:11px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;}}
.sb-score{{font-size:52px;font-weight:900;color:#fff;line-height:1;margin-bottom:2px;}}
.sb-sub{{font-size:12px;color:rgba(255,255,255,0.35);}}
.score-bar{{background:rgba(255,255,255,0.08);border-radius:100px;height:8px;margin-top:12px;overflow:hidden;}}
.score-fill{{background:linear-gradient(90deg,#10b981,#34d399);height:100%;width:82%;border-radius:100px;}}
</style></head><body>
<div class="page">
<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="grid"></div>

<div class="left">
  <div class="logo">
    <div class="li"><svg width="20" height="14" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="ln">Pulse</div>
  </div>

  <div class="mid">
    <div class="eyebrow">Introducing Pulse Pet</div>
    <h1>Your pet<br/>only smiles<br/>when <span class="ital">you're</span><br/>healthy.</h1>
    <div class="sub">Most health apps send you <b>notifications you ignore.</b><br/>We gave you something you'll actually <b>care about.</b></div>
    <div class="moods">
      <div class="mood"><div class="mood-dot" style="background:#f87171"></div><div class="mood-info"><div class="mt">Sad</div><div class="md">Health score 0–39 · Time to act</div></div><div class="mood-score" style="color:#f87171;background:rgba(248,113,113,0.12)">0–39</div></div>
      <div class="mood"><div class="mood-dot" style="background:#fbbf24"></div><div class="mood-info"><div class="mt">Neutral</div><div class="md">Health score 40–69 · Getting there</div></div><div class="mood-score" style="color:#fbbf24;background:rgba(251,191,36,0.12)">40–69</div></div>
      <div class="mood" style="border-color:rgba(52,211,153,0.25);background:rgba(16,185,129,0.06)"><div class="mood-dot" style="background:#34d399"></div><div class="mood-info"><div class="mt">Happy</div><div class="md">Health score 70–100 · Thriving</div></div><div class="mood-score" style="color:#34d399;background:rgba(52,211,153,0.12)">70–100</div></div>
    </div>
  </div>

  <div class="bottom">
    <div class="cta-btn">Meet your pet →</div><br/>
    <div class="cta-sub">getpulse.app · Free to start</div>
  </div>
</div>

<div class="right">
  <div class="panda-wrap">
    <img src="data:image/png;base64,{panda_b64}" class="panda-img" alt="Panda"/>
    <div class="glow-ring"></div>
  </div>
  <div class="score-badge">
    <div class="sb-label">Today's Health Score</div>
    <div class="sb-score">82<span style="font-size:24px;color:rgba(255,255,255,0.3)">/100</span></div>
    <div class="sb-sub">Your panda is feeling happy 😊</div>
    <div class="score-bar"><div class="score-fill"></div></div>
  </div>
</div>

</div>
</body></html>"""

posts = [
    ("post1_pain.html", "post1_pain.png", post1),
    ("post2_value.html", "post2_value.png", post2),
    ("post3_panda.html", "post3_panda.png", post3),
]

for html_name, png_name, html in posts:
    html_path = f"{TMP}/{html_name}"
    tmp_png   = f"{TMP}/{png_name}"
    out_png   = f"{OUT}/{png_name}"

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    result = subprocess.run([
        CHROME,
        "--headless=new", "--no-sandbox", "--disable-gpu",
        "--window-size=1080,1080",
        f"--screenshot={tmp_png}",
        "--force-device-scale-factor=2",
        "--virtual-time-budget=5000",
        "--hide-scrollbars",
        f"file:///{html_path}"
    ], capture_output=True)

    import shutil
    shutil.copy(tmp_png, out_png)
    size = os.path.getsize(out_png)
    print(f"✓ {png_name}  ({size//1024}KB)")

print("All done!")
