"""Rebuild self-contained SVG card faces; originals remain untouched.

Run with the workspace Python (Pillow installed). --refresh-text retrieves the
five historical Card Errata entries; ordinary rebuilds are entirely offline.
Coordinates are reviewed against the local 813x1185 scans, not generic crops.
"""
import argparse
import base64
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape
from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src/data/goatHistoricalText.json'
SPECS = [
    (26202165, 'Sangan', 'rulings7', 'DB2-EN042'),
    (8131171, 'Sinister Serpent', 'rulings7', 'SDD-002'),
    (16226786, 'Night Assailant', 'rulings5', 'AST-080'),
    (40737112, 'Dark Magician of Chaos', 'rulings2', 'IOC-065'),
    (83555666, 'Ring of Destruction', 'rulings6', 'PGD-000'),
]


def refresh():
    pages = {}
    records = {}
    for card_id, name, page, printing in SPECS:
        url = f'https://www.goatformat.com/{page}.html'
        if page not in pages:
            request = Request(url, headers={'User-Agent': 'DuelTheory historical text verification'})
            with urlopen(request, timeout=30) as response:
                raw = response.read().decode('utf-8')
            # Keep only text; the source's separate Card Errata/FAQ headings
            # delimit the transcription. Do not derive wording from FAQs.
            raw = re.sub(r'<(?:script|style)\b[^>]*>.*?</(?:script|style)>', '', raw, flags=re.S)
            pages[page] = re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', raw))).strip()
        pattern = re.escape(name.upper()) + r'\s+Card Errata:\s*(.*?)\s*Individual Card (?:FAQs|Rulings):'
        match = re.search(pattern, pages[page])
        if not match:
            raise RuntimeError(f'Historical text section missing: {name}')
        text = match.group(1).strip(' •')
        # Source markup omits a space at this boundary; preserve words/punctuation.
        text = text.replace("card'sATK", "card's ATK")
        if not 15 < len(text.split()) < 150:
            raise RuntimeError(f'Unexpected transcription size: {name}')
        records[str(card_id)] = dict(name=name, text=text, source=url,
            sourceSection=f'{name.upper()} / Card Errata', printingReference=printing,
            cutoff='2005-08-17', verifiedOn='2026-10-17',
            verification='historical-errata', overlay=f'/cards/goat/{card_id}.svg')
    DATA.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def wrap(text, font, width):
    lines = []
    line = ''
    for word in text.split():
        candidate = f'{line} {word}'.strip()
        if line and font.getlength(candidate) > width:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines + [line]


def build(font_path):
    records = json.loads(DATA.read_text(encoding='utf-8'))
    out = ROOT / 'public/cards/goat'
    out.mkdir(exist_ok=True)
    for card_id, record in records.items():
        original = ROOT / f'public/cards/full/{card_id}.jpg'
        with Image.open(original) as scan:
            if scan.size != (813, 1185):
                raise RuntimeError(f'Review crop for changed scan: {card_id}: {scan.size}')
            # Sample the blank interior, preserving the scan's existing paper tone.
            color = scan.getpixel((400, 1067))
        trap = card_id == '83555666'
        x, y, width, height = (56, 894, 698, 218) if trap else (56, 925, 698, 151)
        for size in range(26, 15, -1):
            font = ImageFont.truetype(font_path, size)
            lines = wrap(record['text'], font, width - 10)
            leading = size * 1.08
            if len(lines) * leading <= height - 5:
                break
        else:
            raise RuntimeError(f'Text cannot fit without clipping: {record["name"]}')
        paper = '#%02x%02x%02x' % color[:3]
        data = base64.b64encode(original.read_bytes()).decode('ascii')
        text_lines = ''.join(f'<tspan x="{x+5}" y="{y+size+i*leading:.2f}">{escape(line)}</tspan>' for i, line in enumerate(lines))
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="813" height="1185" viewBox="0 0 813 1185">
<title>{escape(record['name'])} — reconstructed GOAT 2005 text overlay</title>
<desc>Historical Card Errata: {escape(record['source'])}. Original art, border, type line and statistics retained.</desc>
<image width="813" height="1185" href="data:image/jpeg;base64,{data}"/>
<defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="5"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".035"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>
<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="{paper}" filter="url(#paper)"/>
<text fill="#10100e" font-family="Times New Roman, Liberation Serif, serif" font-size="{size}">{text_lines}</text>
</svg>'''
        (out / f'{card_id}.svg').write_text(svg, encoding='utf-8')
        record['originalSha256'] = hashlib.sha256(original.read_bytes()).hexdigest()
        print(f'{record["name"]}: {len(lines)} lines at {size}px; type and stats preserved')
    DATA.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--refresh-text', action='store_true')
    parser.add_argument('--font', default='C:/Windows/Fonts/times.ttf')
    args = parser.parse_args()
    if args.refresh_text:
        refresh()
    build(args.font)
