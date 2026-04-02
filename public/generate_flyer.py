"""
Pulse Expo Flyer — PNG generator
Outputs: expo-flyer.png (A4 @ 200dpi = 1654×2339 px)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import qrcode
import math, os

# ─── Constants ───────────────────────────────────────────────────────────────
W, H = 1654, 2339          # A4 @ 200 dpi
OUT  = os.path.join(os.path.dirname(__file__), "expo-flyer.png")

# Brand palette
BG       = (6,  12, 28)    # #060c1c
BG2      = (10, 17, 38)    # cards
INDIGO   = (99, 102, 241)  # #6366f1
INDIGOL  = (129, 132, 255)
GREEN    = (16, 185, 129)  # #10b981
PURPLE   = (139, 92, 246)  # #8b5cf6
AMBER    = (245, 158, 11)
WHITE    = (255, 255, 255)
GRAY     = (160, 160, 180)
DARKGRAY = (80, 85, 100)
BORDER   = (40, 45, 65)

# Fonts
F = "C:/Windows/Fonts/"
def font(name, size):
    try:    return ImageFont.truetype(name, size)
    except: return ImageFont.load_default()

fBlack  = lambda s: font(F+"segoeuib.ttf",  s)
fBold   = lambda s: font(F+"segoeuib.ttf",  s)
fMed    = lambda s: font(F+"segoeui.ttf",   s)
fLight  = lambda s: font(F+"segoeuil.ttf",  s)
fMono   = lambda s: font(F+"CascadiaMono.ttf", s)
fMont   = lambda s: font(F+"Montserrat-Medium.ttf", s)
fMontR  = lambda s: font(F+"Montserrat-Regular.ttf", s)

# ─── Helpers ─────────────────────────────────────────────────────────────────
def alpha_color(color, a):
    return (*color, a)

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))

def rounded_rect(draw, xy, r, fill=None, outline=None, width=1):
    x0,y0,x1,y1 = xy
    draw.rounded_rectangle([x0,y0,x1,y1], radius=r, fill=fill, outline=outline, width=width)

def circle(draw, cx, cy, r, fill=None, outline=None, width=1):
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill, outline=outline, width=width)

def centered_text(draw, text, cx, y, font, fill):
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2]-bbox[0]
    draw.text((cx - tw//2, y), text, font=font, fill=fill)

def right_text(draw, text, rx, y, font, fill):
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2]-bbox[0]
    draw.text((rx - tw, y), text, font=font, fill=fill)

def text_w(draw, text, font):
    bbox = draw.textbbox((0,0), text, font=font)
    return bbox[2]-bbox[0]

def text_h(draw, text, font):
    bbox = draw.textbbox((0,0), text, font=font)
    return bbox[3]-bbox[1]

def pill(draw, cx, cy, w, h, fill, text, tfont, tcolor):
    rounded_rect(draw, [cx-w//2, cy-h//2, cx+w//2, cy+h//2], h//2, fill=fill)
    centered_text(draw, text, cx, cy - text_h(draw, text, tfont)//2, tfont, tcolor)

def glow_circle(img, cx, cy, r, color, alpha=60):
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    for i in range(3):
        ra = r + i*20
        aa = alpha - i*18
        if aa > 0:
            d.ellipse([cx-ra,cy-ra,cx+ra,cy+ra], fill=(*color, aa))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)
    return img

# ─── Draw icon helpers ────────────────────────────────────────────────────────
def icon_heart(draw, cx, cy, size, color):
    s = size//2
    # Two circles + triangle for heart
    lx, rx = cx-s//3, cx+s//3
    top_y = cy - s//3
    draw.ellipse([lx-s//2, top_y-s//2, lx+s//2, top_y+s//2], fill=color)
    draw.ellipse([rx-s//2, top_y-s//2, rx+s//2, top_y+s//2], fill=color)
    pts = [cx-s+2, top_y, cx+s-2, top_y, cx, cy+s//2]
    draw.polygon(pts, fill=color)

def icon_ecg(draw, sx, sy, w, h, color, width=3):
    # ECG line
    pts = [
        (sx, sy+h//2),
        (sx+w*0.15, sy+h//2),
        (sx+w*0.25, sy+h//2),
        (sx+w*0.35, sy+5),
        (sx+w*0.45, sy+h-5),
        (sx+w*0.55, sy+5),
        (sx+w*0.65, sy+h//2),
        (sx+w, sy+h//2),
    ]
    for i in range(len(pts)-1):
        draw.line([pts[i], pts[i+1]], fill=color, width=width)

def icon_shield(draw, cx, cy, size, color):
    s = size//2
    pts = [cx, cy-s, cx+s, cy-s//3, cx+s, cy+s//4, cx, cy+s, cx-s, cy+s//4, cx-s, cy-s//3]
    draw.polygon(pts, fill=color)

def icon_star(draw, cx, cy, size, color):
    pts = []
    for i in range(10):
        angle = math.pi/2 + i*math.pi/5
        r = size//2 if i%2==0 else size//4
        pts.append((cx + r*math.cos(angle), cy - r*math.sin(angle)))
    draw.polygon(pts, fill=color)

def icon_person(draw, cx, cy, size, color):
    r = size//5
    circle(draw, cx, cy-size//3, r, fill=color)
    body_top = cy-size//3+r+2
    draw.rectangle([cx-r, body_top, cx+r, cy+size//4], fill=color)

def icon_chart(draw, cx, cy, size, color):
    s = size//2
    bars = [(0.2,0.5),(0.4,0.8),(0.6,0.4),(0.8,1.0)]
    for bx,bh in bars:
        x = cx - s + int(bx*size)
        bw = size//8
        h = int(bh*size*0.8)
        draw.rectangle([x-bw, cy+s-h, x+bw, cy+s], fill=color)

def icon_bolt(draw, cx, cy, size, color):
    s = size//2
    pts = [cx+s//3, cy-s, cx-s//5, cy-s//8, cx+s//5, cy-s//8, cx-s//3, cy+s]
    draw.polygon(pts, fill=color)

def icon_chat(draw, cx, cy, size, color):
    s = size//2
    rounded_rect(draw, [cx-s,cy-s*2//3,cx+s,cy+s//3], 10, fill=color)
    pts = [cx-s//3, cy+s//3, cx-s//2, cy+s*2//3, cx+s//3, cy+s//3]
    draw.polygon(pts, fill=color)

def icon_globe(draw, cx, cy, size, color, w=3):
    r = size//2
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], outline=color, width=w)
    draw.line([cx, cy-r, cx, cy+r], fill=color, width=w)
    draw.arc([cx-r,cy-r,cx+r,cy+r], 0, 180, fill=color, width=w)
    draw.line([cx-r, cy, cx+r, cy], fill=color, width=w)

def icon_check(draw, cx, cy, size, color, w=3):
    s = size//2
    pts = [cx-s, cy, cx-s//4, cy+s//2, cx+s, cy-s//2]
    draw.line(pts, fill=color, width=w)

def icon_device(draw, cx, cy, size, color, w=2):
    # Watch-like
    s = size//2
    rounded_rect(draw, [cx-s//2, cy-s, cx+s//2, cy+s], 8, outline=color, width=w)
    draw.line([cx-s//4, cy-s, cx+s//4, cy-s], fill=color, width=w)
    draw.line([cx, cy-s//3, cx, cy+s//3], fill=color, width=w)
    draw.line([cx, cy, cx+s//3, cy], fill=color, width=w)

# ─── QR Code ──────────────────────────────────────────────────────────────────
def make_qr(url, box_size=10, border=2):
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H,
                       box_size=box_size, border=border)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="white", back_color=(6,12,28))
    return img.convert("RGB")

# ─── Gradient background helper ───────────────────────────────────────────────
def draw_gradient_bg(img):
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y/H
        r = int(BG[0]*(1-t) + BG2[0]*t)
        g = int(BG[1]*(1-t) + BG2[1]*t)
        b = int(BG[2]*(1-t) + BG2[2]*t)
        draw.line([(0,y),(W,y)], fill=(r,g,b))

# ─── Main ─────────────────────────────────────────────────────────────────────
def build_flyer():
    img = Image.new("RGB", (W, H), BG)
    draw_gradient_bg(img)
    draw = ImageDraw.Draw(img)

    # ── Subtle grid dots ──
    for x in range(0, W, 40):
        for y in range(0, H, 40):
            draw.point((x, y), fill=(40,50,70))

    # ── Top glow blob ──
    RGBA = img.convert("RGBA")
    blob = Image.new("RGBA", (W, H), (0,0,0,0))
    bd = ImageDraw.Draw(blob)
    bd.ellipse([-200, -200, 800, 700], fill=(*INDIGO, 35))
    bd.ellipse([900, -100, W+300, 600], fill=(*PURPLE, 25))
    bd.ellipse([100, 1600, 900, 2200], fill=(*GREEN, 20))
    img = Image.alpha_composite(RGBA, blob).convert("RGB")
    draw = ImageDraw.Draw(img)

    PAD = 70
    y = 0

    # ═══════════════════════════════════════════════════════ HEADER ═══
    y = 48
    # Logo mark — ECG line in circle
    lm_cx, lm_cy = PAD + 28, y + 30
    circle(draw, lm_cx, lm_cy, 28, fill=INDIGO)
    icon_ecg(draw, lm_cx-20, lm_cy-8, 40, 16, WHITE, width=2)

    # "Pulse" wordmark
    draw.text((PAD+66, y+8), "Pulse", font=fBold(38), fill=WHITE)
    tw = text_w(draw, "Pulse", fBold(38))
    draw.text((PAD+68, y+50), "getpulse.app", font=fLight(15), fill=(*INDIGO, 200))

    # Heriot-Watt badge (right side)
    hw_x = W - PAD - 200
    rounded_rect(draw, [hw_x, y+4, W-PAD, y+58], 8,
                 fill=(255,255,255,0), outline=(*GRAY, 80), width=1)
    rounded_rect(draw, [hw_x, y+4, W-PAD, y+58], 8, outline=DARKGRAY, width=1)
    draw.text((hw_x+10, y+10), "Heriot-Watt University", font=fMed(13), fill=(*GRAY,))
    draw.text((hw_x+10, y+30), "Dubai Campus", font=fLight(12), fill=DARKGRAY)
    draw.text((hw_x+10, y+46), "Student Venture", font=fLight(11), fill=(*INDIGO,))

    y += 80
    # Divider
    draw.line([(PAD, y), (W-PAD, y)], fill=BORDER, width=1)
    y += 28

    # ═══════════════════════════════════════════════════════ HERO ═════
    centered_text(draw, "YOUR HEALTH IS", W//2, y, fMont(16), (*INDIGO,))
    y += 28
    centered_text(draw, "Happening Right Now.", W//2, y, fBold(70), WHITE)
    y += 80
    centered_text(draw,
        "Real-time vitals · AI insights · Connected care · Gamified wellness",
        W//2, y, fLight(22), (*GRAY,))
    y += 48

    # ═══════════════════════════════════════════════════════ STAT CHIPS ═
    stats = [
        ("6+", "Biomarkers"),
        ("5+", "Wearables"),
        ("AI", "Health Coach"),
        ("24h", "Async Care"),
        ("∞", "Continuous"),
    ]
    chip_w = (W - PAD*2 - 16*4) // 5
    chip_h = 72
    sx = PAD
    for val, label in stats:
        rounded_rect(draw, [sx, y, sx+chip_w, y+chip_h], 14,
                     fill=(99,102,241,30), outline=(*INDIGO, 80), width=1)
        rounded_rect(draw, [sx, y, sx+chip_w, y+chip_h], 14, outline=BORDER, width=1)
        centered_text(draw, val,   sx+chip_w//2, y+8,  fBold(24), (*INDIGOL,))
        centered_text(draw, label, sx+chip_w//2, y+38, fLight(13), (*GRAY,))
        sx += chip_w + 16
    y += chip_h + 36

    # Thin indigo line
    draw.line([(PAD, y), (W-PAD, y)], fill=(*INDIGO, 60), width=1)
    y += 30

    # ═══════════════════════════════════════════════════════ FEATURES ═
    centered_text(draw, "Everything in One Platform", W//2, y, fBold(34), WHITE)
    y += 46

    features = [
        (icon_ecg,    INDIGO,  "Live Health Tracking",
         "Heart rate, BP, glucose, sleep,\nsteps & SpO₂ — streamed in real time."),
        (icon_bolt,   PURPLE,  "AI Health Companion",
         "Pulse AI analyses your data and\ngives personalised recommendations."),
        (icon_chat,   GREEN,   "Connected Care",
         "Connect with your HCP. Async chat,\ncare plans & instant alerts."),
        (icon_star,   AMBER,   "Pulse Pet",
         "Your health score powers a virtual\npet — the healthier you, the happier it."),
        (icon_shield, INDIGO,  "Privacy First",
         "HIPAA & GDPR compliant.\nYour data stays yours."),
        (icon_chart,  GREEN,   "Deep Analytics",
         "Weekly summaries, trend charts\n& exportable health reports."),
    ]

    cols = 3
    col_w = (W - PAD*2 - 20*(cols-1)) // cols
    card_h = 168
    fx = PAD
    fy = y
    for i, (icon_fn, color, title, body) in enumerate(features):
        col = i % cols
        row = i // cols
        cx = PAD + col*(col_w+20) + col_w//2
        cy = fy + row*(card_h+14)

        rounded_rect(draw, [cx-col_w//2, cy, cx+col_w//2, cy+card_h], 16,
                     fill=(15, 20, 40), outline=BORDER, width=1)

        # Icon circle
        ic_cx = cx - col_w//2 + 36
        ic_cy = cy + 38
        circle(draw, ic_cx, ic_cy, 22, fill=(*color, 35))

        # Draw the actual icon
        if icon_fn == icon_ecg:
            icon_ecg(draw, ic_cx-14, ic_cy-7, 28, 14, color, width=2)
        elif icon_fn == icon_bolt:
            icon_bolt(draw, ic_cx, ic_cy, 28, color)
        elif icon_fn == icon_chat:
            icon_chat(draw, ic_cx, ic_cy, 22, color)
        elif icon_fn == icon_star:
            icon_star(draw, ic_cx, ic_cy, 26, color)
        elif icon_fn == icon_shield:
            icon_shield(draw, ic_cx, ic_cy, 26, color)
        elif icon_fn == icon_chart:
            icon_chart(draw, ic_cx, ic_cy, 26, color)

        # Text
        tx = cx - col_w//2 + 70
        draw.text((tx, cy+16), title, font=fBold(18), fill=WHITE)
        blines = body.split("\n")
        draw.text((tx, cy+42), blines[0], font=fLight(14), fill=(*GRAY,))
        if len(blines) > 1:
            draw.text((tx, cy+62), blines[1], font=fLight(14), fill=(*GRAY,))

    y = fy + 2*(card_h+14) + 28

    # Thin line
    draw.line([(PAD, y), (W-PAD, y)], fill=(*INDIGO, 60), width=1)
    y += 30

    # ═══════════════════════════════════════════════════════ PRICING ══
    centered_text(draw, "Simple, Transparent Pricing", W//2, y, fBold(34), WHITE)
    centered_text(draw, "Plans for patients, independent providers & institutions",
                  W//2, y+42, fLight(18), (*GRAY,))
    y += 78

    # Patient plans (3 cols)
    plans = [
        (False, "Free",  "$0",  "/mo", DARKGRAY,  WHITE,
         ["Core biomarker tracking","Basic AI insights","Goal setting","Pulse Pet",]),
        (False, "Pro",   "$12", "/mo", INDIGO,    WHITE,
         ["Everything in Free","Advanced analytics","Wearable sync","Priority AI","Trend reports",]),
        (True,  "Care+", "$29", "/mo", GREEN,     WHITE,
         ["Everything in Pro","Async HCP chat","24h response","Ongoing care plan","Instant alerts",]),
    ]
    pw = (W - PAD*2 - 20*2) // 3
    ph = 310
    px = PAD
    for featured, name, price, per, accent, tc, feats in plans:
        # Card bg
        fill_c = (15, 22, 45) if not featured else (8, 30, 22)
        border_c = (*accent, 160) if featured else BORDER
        rounded_rect(draw, [px, y, px+pw, y+ph], 18, fill=fill_c, outline=border_c, width=2 if featured else 1)

        if featured:
            pill_w, pill_h = 100, 26
            pill_cx = px + pw//2
            rounded_rect(draw, [pill_cx-pill_w//2, y-13, pill_cx+pill_w//2, y+13], 13,
                         fill=GREEN)
            centered_text(draw, "MOST POPULAR", pill_cx, y-9, fBold(10), BG)

        # Plan name
        draw.text((px+22, y+20), name, font=fBold(22), fill=WHITE)
        # Price
        draw.text((px+22, y+52), price, font=fBold(38), fill=(*accent,))
        draw.text((px+22+text_w(draw, price, fBold(38)), y+68), per, font=fLight(16), fill=DARKGRAY)

        # Divider
        draw.line([(px+14, y+102), (px+pw-14, y+102)], fill=BORDER, width=1)

        # Features
        fy2 = y + 114
        for feat in feats:
            circle(draw, px+28, fy2+8, 5, fill=(*accent, 180))
            draw.text((px+44, fy2), feat, font=fLight(14), fill=(*GRAY,))
            fy2 += 30

        px += pw + 20

    y += ph + 22

    # AED note
    centered_text(draw, "AED pricing: Free · AED 44/mo · AED 107/mo  ·  14-day free trial on Pro & Care+, no card required",
                  W//2, y, fLight(13), DARKGRAY)
    y += 32

    # ─── HCP + Hospital strip ──
    draw.line([(PAD, y), (W-PAD, y)], fill=(*INDIGO, 50), width=1)
    y += 22

    hcp_w = (W - PAD*2 - 20) // 2
    # HCP card
    rounded_rect(draw, [PAD, y, PAD+hcp_w, y+180], 16, fill=(10,15,35), outline=(*INDIGO, 100), width=1)
    icon_person(draw, PAD+36, y+42, 36, (*INDIGO,))
    draw.text((PAD+66, y+16), "Healthcare Provider", font=fBold(18), fill=WHITE)
    draw.text((PAD+66, y+42), "$49", font=fBold(32), fill=(*INDIGOL,))
    draw.text((PAD+66+text_w(draw,"$49",fBold(32)), y+56), "/month", font=fLight(14), fill=DARKGRAY)
    hcp_feats = ["Listed on Pulse marketplace","Real-time patient biomarkers","Clinical notes & care plans","80% of consultation revenue","License verification handled"]
    hf_y = y + 90
    for f in hcp_feats:
        icon_check(draw, PAD+24, hf_y+8, 14, (*GREEN,), w=2)
        draw.text((PAD+40, hf_y), f, font=fLight(13), fill=(*GRAY,))
        hf_y += 22

    # Hospital card
    hx = PAD + hcp_w + 20
    rounded_rect(draw, [hx, y, hx+hcp_w, y+180], 16, fill=(18,15,10), outline=(*AMBER, 60), width=1)
    pill_cx2 = hx + hcp_w//2
    rounded_rect(draw, [hx+12, y+10, hx+hcp_w-12, y+36], 8,
                 fill=(*AMBER, 20), outline=(*AMBER, 50), width=1)
    centered_text(draw, "COMING SOON", pill_cx2, y+15, fBold(11), (*AMBER,))

    icon_globe(draw, hx+36, y+70, 36, (*AMBER,), w=3)
    draw.text((hx+66, y+46), "Hospital & Clinic", font=fBold(18), fill=WHITE)
    draw.text((hx+66, y+70), "Custom", font=fBold(28), fill=(*AMBER,))
    draw.text((hx+66, y+100), "Institutional licence", font=fLight(14), fill=DARKGRAY)
    hosp_feats = ["Patients access free under hospital","Staff SSO / hospital credentials","Centralised admin dashboard","HIPAA & GDPR compliance","API access for EHR integrations"]
    hf_y = y + 90
    for f in hosp_feats:
        icon_check(draw, hx+14, hf_y+8, 14, (*AMBER,), w=2)
        draw.text((hx+30, hf_y), f, font=fLight(13), fill=(*GRAY,))
        hf_y += 22

    y += 192

    draw.line([(PAD, y), (W-PAD, y)], fill=BORDER, width=1)
    y += 22

    # ═══════════════════════════════════════════════════════ BOTTOM ROW
    # QR (left) + how it works (right)
    qr_size = 200
    qr_img = make_qr("https://getpulse.app", box_size=6, border=2)
    qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    # White bordered QR container
    qr_x, qr_y = PAD, y
    rounded_rect(draw, [qr_x-4, qr_y-4, qr_x+qr_size+4, qr_y+qr_size+4], 12,
                 fill=(255,255,255), outline=WHITE, width=1)
    img.paste(qr_img, (qr_x, qr_y))
    # Reload draw after paste
    draw = ImageDraw.Draw(img)

    draw.text((PAD, y+qr_size+12), "Scan to visit getpulse.app", font=fMed(15), fill=(*INDIGO,))
    centered_text(draw, "or search  Pulse  on the App Store", PAD+qr_size//2, y+qr_size+34, fLight(13), DARKGRAY)

    # How it works (right side)
    hw_x = PAD + qr_size + 50
    hw_w = W - PAD - hw_x
    draw.text((hw_x, y), "How It Works", font=fBold(22), fill=WHITE)

    steps = [
        (icon_device,  INDIGO,  "Connect your device", "Pair any wearable or enter vitals manually."),
        (icon_ecg,     GREEN,   "Track your biomarkers", "Live dashboard updates as your data streams in."),
        (icon_person,  PURPLE,  "Connect your HCP",     "Invite a provider or browse the marketplace."),
        (icon_bolt,    AMBER,   "Get AI insights",       "Pulse AI reviews your data & recommends actions."),
    ]
    sy = y + 40
    for j, (icon_fn, color, title, desc) in enumerate(steps):
        sc_cx = hw_x + 24
        sc_cy = sy + 20
        circle(draw, sc_cx, sc_cy, 20, fill=(*color, 50), outline=(*color, 120), width=1)
        draw.text((hw_x+14, sy+12), str(j+1), font=fBold(16), fill=(*color,))

        tx = hw_x + 52
        draw.text((tx, sy+4), title, font=fBold(16), fill=WHITE)
        draw.text((tx, sy+26), desc, font=fLight(13), fill=(*GRAY,))

        if j < len(steps)-1:
            draw.line([(sc_cx, sy+40), (sc_cx, sy+52)], fill=(*color, 60), width=2)
        sy += 56

    y += max(qr_size+60, sy - y + 10)

    # ═══════════════════════════════════════════════════════ FOOTER ═══
    draw.line([(PAD, y), (W-PAD, y)], fill=(*INDIGO, 60), width=1)
    y += 18

    # ECG logo small
    circle(draw, PAD+16, y+16, 16, fill=(*INDIGO, 180))
    icon_ecg(draw, PAD+3, y+9, 26, 14, WHITE, width=2)
    draw.text((PAD+38, y+5), "Pulse", font=fBold(20), fill=WHITE)
    draw.text((PAD+40, y+28), "HealthEase Technologies LLC · JLT Towers, Dubai", font=fLight(13), fill=DARKGRAY)

    # Team names (right)
    team = "Rhea Menezes · Huzaifa Mohammed · Tehan Miskin · Zeeshan Khan · Simon Girma · Patrick Abella · Krisha Bhandari · Kamo Peacock"
    right_text(draw, team, W-PAD, y+8, fLight(12), DARKGRAY)
    right_text(draw, "Academic Advisor: Prof. Talal — Heriot-Watt University Dubai", W-PAD, y+28, fLight(12), (*INDIGO, 180))

    y += 56
    # Bottom tag line
    centered_text(draw, "© 2025 HealthEase Technologies LLC  ·  getpulse.app  ·  All rights reserved.",
                  W//2, y, fLight(13), DARKGRAY)

    # ── Save ──────────────────────────────────────────────────────────
    img.save(OUT, "PNG", dpi=(200, 200), optimize=False)
    print(f"Saved: {OUT}  ({W}×{H} px)")

if __name__ == "__main__":
    build_flyer()
