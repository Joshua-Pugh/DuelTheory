from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import json, re

base = Path(__file__).resolve().parent.parent
catalog = json.loads((base/'src/ashenCatalog.json').read_text(encoding='utf-8'))
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'a':'http://schemas.openxmlformats.org/drawingml/2006/main', 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'mc':'http://schemas.openxmlformats.org/markup-compatibility/2006'}
def key(s): return re.sub(r'[^a-z0-9]', '', s.lower())
records = {}
report = []
for faction in ['Noble','Brute']:
    path = next(Path('C:/Users/joshu/OneDrive/Desktop/Ashen Throne').glob(f'{faction} Mono*.docx'))
    root = E.fromstring(ZipFile(path).read('word/document.xml'))
    for fallback in root.findall('.//mc:Fallback',ns): fallback.getparent().remove(fallback)
    colored, untuned = ('rId7','rId8') if faction=='Noble' else ('rId8','rId9')
    candidates = [c for c in catalog['cards'] if c['faction']==faction]
    for cell in root.findall('.//w:body/w:tbl/w:tr/w:tc',ns):
        paras = cell.findall('./w:p',ns)
        if not paras: continue
        header = ''.join(paras[0].xpath('./w:r/w:t/text()',namespaces=ns))
        matches = [c for c in candidates if key(header).startswith(key(c['name']))]
        if not matches: continue
        card = max(matches,key=lambda c:len(c['name']))
        ids = paras[0].xpath('./w:r/w:drawing//a:blip/@r:embed',namespaces=ns)
        count = ids.count(colored)
        generic_icons = ids.count(untuned)
        digits = re.findall(r'\d+',header)
        generic = int(digits[-1]) if generic_icons and digits else generic_icons
        costs = {}
        if generic: costs['untuned']=generic
        if count: costs['oath' if faction=='Noble' else 'fury']=count
        # Color identity is printed resource affinity, not the deck source.
        affinity = faction if count or card['type'] in ['Unit','Ley Font','Command Station'] else 'Neutral'
        texts = [''.join(p.xpath('.//w:t/text()',namespaces=ns)) for p in cell.findall('.//w:txbxContent/w:p',ns)]
        text = ' '.join(texts)
        outfit = re.search(r'Outfit\s*\(\s*(\d+)?',text,re.I)
        record = {'resourceCost':costs,'frameFaction':affinity,'costSource':path.name}
        if outfit: record['outfitCost']=int(outfit.group(1) or 1)
        # Do not equate a missing cost transcription with a free card.
        if not ids and card['type'] not in ['Ley Font','Command Station']: continue
        prior=records.get(card['id'])
        if prior and prior!=record: raise ValueError(f'Conflicting printed costs: {card["name"]}')
        records[card['id']]=record
        report.append({'id':card['id'],'name':card['name'],'header':header.strip(),'costImageIds':ids,**record})
(base/'src/ashenPrintData.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(base/'docs/ashen-cost-transcription.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(records)} of {len(catalog["cards"])} card costs matched to source cells')
print('Unmatched:',[c['name'] for c in catalog['cards'] if c['id'] not in records])
print('Neutral:',[r['name'] for r in report if r['frameFaction']=='Neutral'])
print('Outfit:',[(r['name'],r['outfitCost']) for r in report if 'outfitCost' in r])

