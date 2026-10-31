#!/usr/bin/env python3
"""Räknar ut en vägföljande etapplinje med höjdprofil och lägger in den i ROUTED i index.html.

Används av den schemalagda tjänsten "Officiella etappvägar" när arrangören har publicerat
den detaljerade vägen (orter, vägnummer, tidtabell eller GPX).

Exempel:
  python3 tools/route-stage.py tdf-2027-14 --km 199 \
      --via "43.6083,3.8862" "43.62,3.80" ... "44.502,3.532" \
      --source "https://www.letour.fr/fr/etape-14"
  python3 tools/route-stage.py tdf-2027-14 --km 199 --gpx etapp14.gpx
Flaggor:
  --dry-run   skriv inte till index.html, visa bara längd och höjdmeter
  --approx    linjen täcker bara en del av etappen (sätter fältet a = officiell längd)
  --profile   BRouter-profil (standard fastbike)
Skriptet vägrar skriva om längden avviker mer än --tol procent (standard 3) från --km,
utom med --approx eller --force.
"""
import argparse, json, math, re, sys, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

INDEX = __file__.rsplit("/tools/", 1)[0] + "/index.html"


def enc_ints(vals):
    out = []
    for v in vals:
        v = ~(v << 1) if v < 0 else (v << 1)
        while v >= 0x20:
            out.append(chr((0x20 | (v & 0x1f)) + 63)); v >>= 5
        out.append(chr(v + 63))
    return "".join(out)


def hav(a, b):
    R = 6371000.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def brouter(points, profile):
    pts = []
    # BRouter klarar många via-punkter, men dela upp i bitar för säkerhets skull
    for i in range(0, len(points) - 1, 25):
        chunk = points[i:i + 26]
        q = "|".join(f"{lo:.6f},{la:.6f}" for la, lo in chunk)
        url = "https://brouter.de/brouter?" + urllib.parse.urlencode({"lonlats": q, "profile": profile, "alternativeidx": 0, "format": "geojson"})
        with urllib.request.urlopen(url, timeout=120) as r:
            g = json.load(r)
        coords = g["features"][0]["geometry"]["coordinates"]
        seg = [(c[1], c[0], c[2] if len(c) > 2 else 0) for c in coords]
        pts.extend(seg if not pts else seg[1:])
    return pts


def read_gpx(path):
    t = ET.parse(path).getroot(); out = []
    for el in t.iter():
        tag = el.tag.split("}")[-1]
        if tag in ("trkpt", "rtept"):
            ele = next((c.text for c in el if c.tag.split("}")[-1] == "ele"), None)
            out.append((float(el.get("lat")), float(el.get("lon")), float(ele) if ele else None))
    return out


def thin(pts, step):
    out = [pts[0]]; acc = 0
    for a, b in zip(pts, pts[1:]):
        acc += hav(a, b)
        if acc >= step:
            out.append(b); acc = 0
    if out[-1] is not pts[-1]:
        out.append(pts[-1])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("key", help="etappnyckel, t.ex. tdf-2027-14")
    ap.add_argument("--km", type=float, required=True, help="officiell längd i km")
    ap.add_argument("--via", nargs="*", help='punkter "lat,lon" i ordning från start till mål')
    ap.add_argument("--gpx", help="officiell GPX-fil i stället för via-punkter")
    ap.add_argument("--profile", default="fastbike")
    ap.add_argument("--step", type=float, default=0, help="minsta avstånd mellan sparade punkter i meter (standard: längd/450)")
    ap.add_argument("--tol", type=float, default=3.0)
    ap.add_argument("--approx", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--source", default="")
    a = ap.parse_args()

    if a.gpx:
        pts = read_gpx(a.gpx)
        if any(p[2] is None for p in pts):  # höjd saknas -> hämta via BRouter längs GPX-punkterna
            pts = brouter([(p[0], p[1]) for p in thin(pts, 2000)], a.profile)
    else:
        via = [tuple(map(float, v.split(","))) for v in (a.via or [])]
        if len(via) < 2:
            sys.exit("Minst två via-punkter behövs (start och mål).")
        pts = brouter(via, a.profile)

    length = sum(hav(p, q) for p, q in zip(pts, pts[1:]))
    # höjdmeter med enkel utjämning (10 m tröskel) som i guiden
    asc, base = 0.0, pts[0][2]
    for p in pts[1:]:
        if p[2] - base > 10: asc += p[2] - base; base = p[2]
        elif base - p[2] > 10: base = p[2]
    dev = (length / 1000 - a.km) / a.km * 100
    print(f"{a.key}: {length/1000:.1f} km (officiellt {a.km} km, {dev:+.1f} %), {asc:.0f} höjdmeter, {len(pts)} punkter")
    if abs(dev) > a.tol and not (a.approx or a.force):
        sys.exit(f"Avvikelsen {dev:+.1f} % är större än {a.tol} % – kontrollera via-punkterna (eller använd --approx/--force).")

    step = a.step or max(150.0, length / 450)
    t = thin(pts, step)
    la = [round(p[0] * 1e5) for p in t]; lo = [round(p[1] * 1e5) for p in t]; el = [round(p[2]) for p in t]
    dp = []; pl = plo = 0
    for x, y in zip(la, lo): dp += [x - pl, y - plo]; pl, plo = x, y
    de = []; pe = 0
    for z in el: de.append(z - pe); pe = z
    entry = {"p": enc_ints(dp), "e": enc_ints(de), "len": str(round(length)), "asc": str(round(asc)), "n": str(len(t))}
    if a.approx: entry["a"] = str(a.km).rstrip("0").rstrip(".")
    if a.dry_run:
        print("Torrkörning – inget skrivet."); return

    s = open(INDEX, encoding="utf-8").read(); L = s.split("\n")
    i = next(k for k, l in enumerate(L) if l.startswith("const ROUTED = "))
    R = json.loads(L[i][len("const ROUTED = "):].rstrip(";"))
    R["stage:" + a.key] = entry
    L[i] = "const ROUTED = " + json.dumps(R, ensure_ascii=False, separators=(",", ":")) + ";"
    open(INDEX, "w", encoding="utf-8").write("\n".join(L))
    print(f"Skrev ROUTED[\"stage:{a.key}\"]" + (f" (källa: {a.source})" if a.source else ""))


if __name__ == "__main__":
    main()
