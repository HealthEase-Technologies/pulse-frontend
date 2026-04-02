import subprocess, shutil
from PIL import Image
import numpy as np

with open('d:/hwud/pulse-frontend/public/panda_b64.txt') as f:
    panda_b64 = f.read().strip()

CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
TMP    = "C:/Users/Shazee/AppData/Local/Temp"
OUT    = "d:/hwud/pulse-frontend/public"

# ── POST 1 ─────────────────────────────────────────────────────────────────
p1 = """<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,900;1,800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
.page{position:absolute;inset:0;overflow:hidden;background:linear-gradient(150deg,#0d1535 0%,#060c1c 55%,#07101f 100%);display:flex;flex-direction:column;justify-content:space-between;padding:52px 60px;}
.o{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;}
.o1{width:560px;height:560px;background:rgba(99,102,241,0.22);top:-200px;left:-180px;}
.o2{width:380px;height:380px;background:rgba(139,92,246,0.13);bottom:-100px;right:-80px;}
.gb{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px);background-size:54px 54px;}
.bar{position:absolute;left:0;top:0;width:4px;height:100%;background:linear-gradient(180deg,#6366f1,#8b5cf6,transparent);}
.top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;}
.logo{display:flex;align-items:center;gap:12px;}
.li{width:44px;height:44px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(99,102,241,0.5);}
.ln{font-size:22px;font-weight:800;color:#fff;}
.tag{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:100px;padding:9px 22px;font-size:12px;font-weight:700;color:#a5b4fc;letter-spacing:1.5px;text-transform:uppercase;}
.mid{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;padding:10px 0;}
.stat{font-size:16px;font-weight:600;color:rgba(255,255,255,0.38);margin-bottom:18px;}
.stat span{color:#f87171;font-weight:800;}
h1{font-family:'Playfair Display',serif;font-size:96px;font-weight:900;line-height:0.93;letter-spacing:-3px;margin-bottom:24px;}
.hw{color:#fff;}
.hi{color:transparent;background:linear-gradient(135deg,#818cf8,#c7d2fe);-webkit-background-clip:text;background-clip:text;font-style:italic;}
.sub{font-size:20px;color:rgba(255,255,255,0.42);line-height:1.55;max-width:700px;}
.sub b{color:rgba(255,255,255,0.82);font-weight:700;}
.bot{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;}
.pills{display:flex;gap:10px;flex-wrap:wrap;}
.pill{border-radius:100px;padding:11px 22px;font-size:13px;font-weight:600;}
.pg{border:1px solid rgba(16,185,129,0.35);color:#34d399;background:rgba(16,185,129,0.08);}
.pi{border:1px solid rgba(99,102,241,0.35);color:#818cf8;background:rgba(99,102,241,0.08);}
.pw{border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.45);background:rgba(255,255,255,0.04);}
.cta{text-align:right;}
.btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:17px;font-weight:800;padding:18px 36px;border-radius:100px;display:inline-block;box-shadow:0 0 40px rgba(99,102,241,0.4);}
.cs{font-size:11px;color:rgba(255,255,255,0.22);margin-top:8px;}
</style></head><body>
<div class="page">
<div class="o o1"></div><div class="o o2"></div><div class="gb"></div><div class="bar"></div>
<div class="top">
  <div class="logo">
    <div class="li"><svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="ln">Pulse</div>
  </div>
  <div class="tag">Real-Time Health</div>
</div>
<div class="mid">
  <div class="stat">Your doctor sees you <span>8 minutes</span> a year. That's 0.0015% of your life.</div>
  <h1><div class="hw">What happens</div><div class="hi">in the other</div><div class="hw">99.99%?</div></h1>
  <div class="sub">Most people find out something is wrong <b>at the hospital.</b><br/>Pulse tells you <b>before it gets that far.</b></div>
</div>
<div class="bot">
  <div class="pills">
    <div class="pill pg">24/7 Monitoring</div>
    <div class="pill pi">AI Health Coach</div>
    <div class="pill pg">Free to Start</div>
    <div class="pill pw">6+ Biomarkers</div>
  </div>
  <div class="cta">
    <div class="btn">getpulse.app</div>
    <div class="cs">Free · No credit card</div>
  </div>
</div>
</div></body></html>"""

# ── POST 2 ─────────────────────────────────────────────────────────────────
p2 = """<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,900;1,800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
.page{position:absolute;inset:0;overflow:hidden;background:linear-gradient(150deg,#060c1c 0%,#091520 60%,#060c1c 100%);display:flex;flex-direction:column;padding:48px 60px;gap:20px;}
.o{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
.o1{width:480px;height:480px;background:rgba(16,185,129,0.14);top:-150px;right:-80px;}
.o2{width:380px;height:380px;background:rgba(99,102,241,0.11);bottom:-80px;left:-60px;}
.gb{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:54px 54px;}
.z{position:relative;z-index:2;}
.hdr{display:flex;justify-content:space-between;align-items:center;}
.logo{display:flex;align-items:center;gap:10px;}
.li{width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(99,102,241,0.4);}
.ln{font-size:20px;font-weight:800;color:#fff;}
.ey{font-size:11px;font-weight:700;color:#34d399;letter-spacing:2px;text-transform:uppercase;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);padding:8px 20px;border-radius:100px;}
.ttl{}
.t1{font-size:13px;font-weight:700;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;}
h1{font-family:'Playfair Display',serif;font-size:66px;font-weight:900;line-height:0.95;color:#fff;letter-spacing:-1.5px;}
h1 span{color:transparent;background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.st{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px 16px;text-align:center;}
.sv{font-size:24px;font-weight:900;line-height:1;}
.sl{font-size:10px;color:rgba(255,255,255,0.3);font-weight:600;margin-top:3px;}
.items{display:flex;flex-direction:column;gap:8px;flex:1;}
.item{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:14px 20px;flex:1;}
.item.hi{background:rgba(16,185,129,0.06);border-color:rgba(16,185,129,0.2);}
.il{display:flex;align-items:center;gap:12px;}
.ic{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;}
.it{font-size:14px;font-weight:700;color:#fff;}
.id{font-size:11px;color:rgba(255,255,255,0.35);margin-top:1px;}
.ir{text-align:right;}
.struck{font-size:12px;color:rgba(255,255,255,0.22);text-decoration:line-through;margin-bottom:2px;}
.pr{font-size:16px;font-weight:800;}
.total{background:linear-gradient(135deg,rgba(99,102,241,0.14),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.28);border-radius:16px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;}
.ta{font-size:11px;color:rgba(255,255,255,0.35);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.tb{font-size:40px;font-weight:900;color:#fff;line-height:1;}
.tc{font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;}
.cbtn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:800;padding:16px 32px;border-radius:100px;box-shadow:0 0 32px rgba(99,102,241,0.4);}
.csub{font-size:10px;color:rgba(255,255,255,0.22);margin-top:6px;text-align:center;}
</style></head><body>
<div class="page">
<div class="o o1"></div><div class="o o2"></div><div class="gb"></div>
<div class="hdr z"><div class="logo"><div class="li"><svg width="20" height="14" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="ln">Pulse</div></div><div class="ey">The Offer Breakdown</div></div>
<div class="ttl z"><div class="t1">What you'd normally pay vs. what we charge</div><h1>The <span>unfair</span> deal<br/>we're giving you.</h1></div>
<div class="stats z">
  <div class="st"><div class="sv" style="color:#818cf8">6+</div><div class="sl">Biomarkers</div></div>
  <div class="st"><div class="sv" style="color:#34d399">5+</div><div class="sl">Wearables</div></div>
  <div class="st"><div class="sv" style="color:#c084fc">AI</div><div class="sl">Powered</div></div>
  <div class="st"><div class="sv" style="color:#fbbf24">24h</div><div class="sl">Async Care</div></div>
</div>
<div class="items z">
  <div class="item"><div class="il"><div class="ic" style="background:rgba(99,102,241,0.15)">📊</div><div><div class="it">24/7 Biomarker Monitoring</div><div class="id">Heart rate, BP, glucose, SpO2, sleep, steps</div></div></div><div class="ir"><div class="struck">$30/mo</div><div class="pr" style="color:#34d399">Free</div></div></div>
  <div class="item"><div class="il"><div class="ic" style="background:rgba(139,92,246,0.15)">🤖</div><div><div class="it">Personalised AI Health Coach</div><div class="id">Daily insights, recommendations and alerts</div></div></div><div class="ir"><div class="struck">$25/mo</div><div class="pr" style="color:#34d399">Free</div></div></div>
  <div class="item"><div class="il"><div class="ic" style="background:rgba(245,158,11,0.15)">🎯</div><div><div class="it">Goal Tracking + Streak System</div><div class="id">Daily targets, habit building, achievements</div></div></div><div class="ir"><div class="struck">$10/mo</div><div class="pr" style="color:#34d399">Free</div></div></div>
  <div class="item hi"><div class="il"><div class="ic" style="background:rgba(16,185,129,0.15)">💬</div><div><div class="it">Async HCP Chat + Care Plan</div><div class="id">24h response SLA · Ongoing care · Instant alerts</div></div></div><div class="ir"><div class="struck">$150/mo</div><div class="pr" style="color:#34d399">$29/mo</div></div></div>
</div>
<div class="total z"><div><div class="ta">Normal price</div><div class="tb"><span style="text-decoration:line-through;color:rgba(255,255,255,0.28)">$215</span> → <span style="color:#818cf8">Free</span></div><div class="tc">to start · No card needed · Cancel anytime</div></div><div><div class="cbtn">Start for Free →</div><div class="csub">getpulse.app</div></div></div>
</div></body></html>"""

# ── POST 3 ─────────────────────────────────────────────────────────────────
p3 = """<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,900;1,800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1080px;overflow:hidden;background:#060c1c;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;}
.page{position:absolute;inset:0;overflow:hidden;background:linear-gradient(150deg,#060c1c 0%,#07141e 55%,#060c1c 100%);display:flex;flex-direction:row;}
.o{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none;}
.o1{width:500px;height:500px;background:rgba(16,185,129,0.18);top:-80px;right:-80px;}
.o2{width:380px;height:380px;background:rgba(99,102,241,0.14);bottom:-80px;left:-60px;}
.gb{position:absolute;inset:0;background-image:linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px);background-size:54px 54px;}
.left{position:relative;z-index:2;width:50%;height:100%;display:flex;flex-direction:column;gap:20px;padding:50px 36px 50px 54px;}
.logo{display:flex;align-items:center;gap:10px;}
.li{width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(99,102,241,0.4);}
.ln{font-size:18px;font-weight:800;color:#fff;}
.ey{font-size:10px;font-weight:700;color:#34d399;letter-spacing:2px;text-transform:uppercase;}
h1{font-family:'Playfair Display',serif;font-size:62px;font-weight:900;line-height:0.93;color:#fff;letter-spacing:-2px;}
h1 .g{color:transparent;background:linear-gradient(135deg,#34d399,#10b981);-webkit-background-clip:text;background-clip:text;font-style:italic;}
.sub{font-size:15px;color:rgba(255,255,255,0.42);line-height:1.55;}
.sub b{color:rgba(255,255,255,0.78);font-weight:700;}
.moods{display:flex;flex-direction:column;gap:7px;}
.mood{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:11px;padding:9px 13px;}
.dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.mt{font-size:12px;font-weight:700;color:#fff;}
.md{font-size:9px;color:rgba(255,255,255,0.3);margin-top:1px;}
.ms{margin-left:auto;font-size:11px;font-weight:800;padding:3px 10px;border-radius:100px;}
.cta{display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:15px;font-weight:800;padding:15px 26px;border-radius:100px;box-shadow:0 0 28px rgba(16,185,129,0.35);}
.cs{font-size:10px;color:rgba(255,255,255,0.25);}
.right{position:relative;z-index:2;width:50%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:50px 50px 50px 16px;gap:18px;}
.panda-img{width:310px;height:310px;object-fit:contain;border-radius:50%;background:rgba(0,0,0,0.3);border:3px solid rgba(16,185,129,0.3);box-shadow:0 0 60px rgba(16,185,129,0.2),0 0 120px rgba(16,185,129,0.08);display:block;}
.score{background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.05));border:1px solid rgba(16,185,129,0.28);border-radius:18px;padding:20px 24px;text-align:center;width:100%;}
.sl1{font-size:10px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;}
.sl2{font-size:50px;font-weight:900;color:#fff;line-height:1;margin-bottom:2px;}
.sl3{font-size:12px;color:rgba(255,255,255,0.32);}
.sbar{background:rgba(255,255,255,0.08);border-radius:100px;height:7px;margin-top:10px;overflow:hidden;}
.sfill{background:linear-gradient(90deg,#10b981,#34d399);height:100%;width:82%;border-radius:100px;}
</style></head><body>
<div class="page">
<div class="o o1"></div><div class="o o2"></div><div class="gb"></div>
<div class="left">
  <div class="logo"><div class="li"><svg width="18" height="13" viewBox="0 0 22 16" fill="none"><path d="M1 8h3.5l2.5-7 4 14 3-10 2 3H21" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="ln">Pulse</div></div>
  <div class="ey">Introducing Pulse Pet</div>
  <h1>Your pet<br/>only smiles<br/>when <span class="g">you're</span><br/>healthy.</h1>
  <div class="sub">Most health apps send you <b>notifications you ignore.</b> We gave you something you'll actually <b>care about.</b></div>
  <div class="moods">
    <div class="mood"><div class="dot" style="background:#f87171"></div><div><div class="mt">Sad</div><div class="md">Score 0-39 · Time to act</div></div><div class="ms" style="color:#f87171;background:rgba(248,113,113,0.12)">0-39</div></div>
    <div class="mood"><div class="dot" style="background:#fbbf24"></div><div><div class="mt">Neutral</div><div class="md">Score 40-69 · Getting there</div></div><div class="ms" style="color:#fbbf24;background:rgba(251,191,36,0.12)">40-69</div></div>
    <div class="mood" style="border-color:rgba(52,211,153,0.3);background:rgba(16,185,129,0.06)"><div class="dot" style="background:#34d399"></div><div><div class="mt">Happy</div><div class="md">Score 70-100 · Thriving</div></div><div class="ms" style="color:#34d399;background:rgba(52,211,153,0.12)">70-100</div></div>
  </div>
  <div class="cta">Meet your pet - getpulse.app</div>
  <div class="cs">Free to start · No credit card</div>
</div>
<div class="right">
  <img src="data:image/png;base64,PANDA_B64_HERE" class="panda-img" alt="Panda"/>
  <div class="score">
    <div class="sl1">Today's Health Score</div>
    <div class="sl2">82<span style="font-size:20px;color:rgba(255,255,255,0.28)">/100</span></div>
    <div class="sl3">Your panda is feeling happy</div>
    <div class="sbar"><div class="sfill"></div></div>
  </div>
</div>
</div></body></html>"""

p3 = p3.replace("PANDA_B64_HERE", panda_b64)

posts = [("post1_pain", p1), ("post2_value", p2), ("post3_panda", p3)]

for name, html in posts:
    html_path = f"{TMP}/{name}.html"
    out_png   = f"{OUT}/{name}.png"

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

    subprocess.run([CHROME,
        "--headless=new","--no-sandbox","--disable-gpu",
        "--window-size=1080,1080",
        f"--screenshot={out_png}",
        "--force-device-scale-factor=1",
        "--virtual-time-budget=5000","--hide-scrollbars",
        f"file:///{html_path}"], capture_output=True)

    from PIL import Image
    img = Image.open(out_png)
    print(f"{name}: {img.size}")
