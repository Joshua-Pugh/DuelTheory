"""Transcribe Word card text boxes, including embedded resource glyphs."""
from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
import json,re

base=Path(__file__).resolve().parent.parent
catalog_path=base/'src/ashenCatalog.json'
catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships','mc':'http://schemas.openxmlformats.org/markup-compatibility/2006'}
def key(s):return re.sub('[^a-z0-9]','',s.lower())
report={}
for faction in ['Noble','Brute']:
 path=next(Path('C:/Users/joshu/OneDrive/Desktop/Ashen Throne').glob(f'{faction} Mono*.docx'))
 root=E.fromstring(ZipFile(path).read('word/document.xml'))
 for n in root.findall('.//mc:Fallback',ns):n.getparent().remove(n)
 glyphs={'rId7':'Oath','rId8':'Untuned'} if faction=='Noble' else {'rId8':'Fury','rId9':'Untuned'}
 def paragraph(p):
  chunks=[]
  for n in p.iter():
   if n.tag==f'{{{ns["w"]}}}t':chunks.append(n.text or '')
   elif n.tag==f'{{{ns["a"]}}}blip':
    rid=n.get(f'{{{ns["r"]}}}embed')
    if rid not in glyphs:raise ValueError(f'Unknown resource glyph {rid}')
    chunks.append(' {'+glyphs[rid]+'} ')
   elif n.tag in [f'{{{ns["w"]}}}br',f'{{{ns["w"]}}}tab']:chunks.append(' ')
  text=re.sub(r'\s+',' ',''.join(chunks)).strip()
  text=text.replace('✦','{Untuned}')
  return text
 for cell in root.findall('.//w:body/w:tbl/w:tr/w:tc',ns):
  ps=cell.findall('./w:p',ns)
  if not ps:continue
  header=''.join(ps[0].xpath('./w:r/w:t/text()',namespaces=ns))
  matches=[c for c in catalog['cards'] if c['faction']==faction and key(header).startswith(key(c['name']))]
  if not matches:continue
  card=max(matches,key=lambda c:len(c['name']))
  boxes=[]
  for box in cell.findall('.//w:txbxContent',ns):
   lines=[paragraph(p) for p in box.findall('./w:p',ns)]
   lines=[s for s in lines if s]
   if lines and not lines[0].startswith(('©','ART')):boxes.append(lines)
  if len(boxes)!=1:raise ValueError(f'{card["name"]}: expected exactly one rules text box, got {len(boxes)}')
  lines=boxes[0]
  flavor=[s for s in lines if s.startswith(('“','"'))]
  rules=[s for s in lines if s not in flavor]
  # Read the printed type line independently of the header and footer.
  raw=[]
  for index,p in enumerate(ps):
   direct=''.join(p.xpath('./w:r/w:t/text()',namespaces=ns))
   if index==0:
    remaining=len(key(card['name']))
    cut=0
    for cut,ch in enumerate(direct,1):
     if key(ch):remaining-=1
     if remaining==0:break
    direct=direct[cut:]
   m=re.search(r'\b(?:Legendary\s+)?'+re.escape(card['type'])+r'\b|\b(?:Basic|Advanced)\s+Ley Font\b',direct)
   if m:raw.append(direct[m.start():])
  if not raw:raise ValueError(f'Missing type line: {card["name"]}')
  subtype=re.sub(r'\s+',' ',raw[0]).strip()
  subtype=re.split(r'Ashen Throne',subtype)[0].strip()
  subtype=subtype.replace('--','—').replace('–','—').replace('Brozne','Bronze').replace('🌀','').strip()
  subtype=re.sub(r'\s+(Iron|Bronze|Silver)\b.*$','',subtype).strip()
  subtype=re.sub(r'\s+A\s*\d+\s*/.*$','',subtype).strip()
  if subtype.endswith('— Legendary'):subtype='Legendary '+subtype.removesuffix('— Legendary').strip()
  if subtype.endswith('Legendary') and not subtype.startswith('Legendary'):subtype='Legendary '+subtype.removesuffix('Legendary').strip(' —')
  editorial={'under your,':'under your control,','damage is delt.':'damage is dealt.','to ant target.':'to any target.','Kordath, Lord of Ruin':'Korgath, Lord of Ruin','each Noble your control':'each Noble you control'}
  for old,new in editorial.items():rules=[line.replace(old,new) for line in rules]
  entry={'effectText':'\n'.join(rules),'flavorText':'\n'.join(flavor),'subtype':subtype,'effectSource':path.name}
  previous=report.get(card['id'])
  if previous and previous!=entry:raise ValueError(f'Conflicting repeated print: {card["name"]}')
  report[card['id']]=entry
  card.update(entry)
  card['effectStatus']='source-transcribed'
missing=[c['name'] for c in catalog['cards'] if c['id'] not in report]
if missing:raise ValueError(f'Unmatched cards: {missing}')
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(base/'docs').mkdir(exist_ok=True)
(base/'docs/ashen-text-transcription.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Transcribed {len(report)} / {len(catalog["cards"])} cards.')
for c in sorted(catalog['cards'],key=lambda c:len(c['effectText'])+len(c['flavorText']),reverse=True)[:8]:print(c['name'],len(c['effectText']),len(c['flavorText']),c['subtype'])
