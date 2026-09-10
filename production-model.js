// Kept independent of the UI so older workspace copies can gain these fields safely.
export const handoffFields = {
  designer:{label:'Grafik / studio',hint:'Kto przygotowuje materiały?',max:160},
  reviewer:{label:'Osoba zbierająca uwagi',hint:'Jedna osoba po stronie Prescot',max:160},
  due:{label:'Termin pierwszej wersji',hint:'Ustal termin z grafikiem',max:10,type:'date'},
  assets:{label:'Folder z materiałami',hint:'Linki do logo, zdjęć produktów, realizacji i kart technicznych. Sprawdź dostęp dla grafika.',max:6000,area:true},
  requirements:{label:'Wspólne wytyczne',hint:'Kolory, logotyp, styl, elementy obowiązkowe i potwierdzone informacje o produktach.',max:6000,area:true},
  delivery:{label:'Jak oddać gotowe materiały?',hint:'Folder docelowy, oczekiwane eksporty i pliki źródłowe, np. PNG + edytowalny projekt.',max:6000,area:true},
};
export const designFields = {
  format:{label:'Format i rozmiar',hint:'np. grafika 4:5, 1080 × 1350 px, PNG',max:300},
  headline:{label:'Nagłówek na kreacji',hint:'Dokładny tekst do umieszczenia w projekcie',max:1000},
  body:{label:'Tekst towarzyszący reklamie',hint:'Treść opisu lub dodatkowy tekst. Jeśli nie występuje, wpisz „Nie dotyczy”.',max:6000,area:true},
  cta:{label:'Wezwanie do działania (CTA)',hint:'np. „Zapytaj o dobór” lub „Zobacz profile”',max:300},
  visual:{label:'Co pokazać i jak ułożyć projekt?',hint:'Kadr, produkt, hierarchia tekstu; dla wideo — kolejność ujęć, napisy i długość.',max:6000,area:true},
  assets:{label:'Materiały do tej kreacji',hint:'Dokładne nazwy plików lub linki. Puste pole oznacza użycie wspólnego folderu.',max:6000,area:true},
  destination:{label:'Dokąd prowadzi reklama?',hint:'Adres strony zgodnej z produktem i CTA',max:2000},
};
export const formatExamples=['Grafika 4:5 · 1080 × 1350 px · PNG','Grafika 1:1 · 1080 × 1080 px · PNG','Pionowe wideo 9:16 · 1080 × 1920 px · MP4','Wideo 4:5 · 1080 × 1350 px · MP4','Tekst reklamy · bez grafiki'];
function cleanFields(raw,fields){return Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,typeof raw?.[key]==='string'?raw[key].slice(0,field.max):'']));}
export function cleanHandoff(raw){const clean=cleanFields(raw,handoffFields);if(!/^\d{4}-\d{2}-\d{2}$/.test(clean.due))clean.due='';return clean;}
export function cleanDesign(raw){return {...cleanFields(raw,designFields),include:raw?.include!==false};}
export const selectedCreatives=campaign=>campaign.flow.nodes.filter(n=>n.type==='creative'&&n.design?.include!==false);
export function handoffGaps(campaign){
  const selected=selectedCreatives(campaign),common=cleanHandoff(campaign.handoff),gaps=[];
  if(!selected.length)gaps.push('Wybierz przynajmniej jedną kreację.');
  for(const [key,label] of [['designer','osobę lub studio'],['reviewer','osobę zbierającą uwagi'],['due','termin pierwszej wersji'],['delivery','sposób oddania plików']])if(!common[key].trim())gaps.push(`Ustal ${label}.`);
  for(const node of selected){const d=cleanDesign(node.design);for(const key of ['format','headline','cta','visual'])if(!d[key].trim())gaps.push(`${node.title}: uzupełnij ${designFields[key].label.toLocaleLowerCase('pl-PL')}.`);if(!d.assets.trim()&&!common.assets.trim())gaps.push(`${node.title}: wskaż materiały źródłowe.`);}
  return gaps;
}
