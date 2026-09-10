import {cleanAnalysis} from './campaign-ai.js?v=4.0.1';
import { cleanState, STORAGE_KEY } from './model.js?v=4.0.1';
import {cleanHandoff,cleanDesign} from './production-model.js?v=4.0.1';

export const WORKSPACE_KEY = 'prescot.campaigns.v1';
export const uid = () => globalThis.crypto.randomUUID();
export const products = {
  strips: { name: 'Taśmy LED', icon: 'bolt', image: 'assets/prescot/tasmy.webp', title: 'Światło, które robi wnętrze.', offer: 'Taśmy LED do oświetlenia wnętrz. Wariant, długość i parametry do potwierdzenia w katalogu.', audience: 'Architekci wnętrz i instalatorzy', message: 'Pokaż efekt światła w gotowym wnętrzu i ułatw wybór taśmy do projektu.' },
  profiles: { name: 'Profile LED', icon: 'layout', image: 'assets/prescot/profile.webp', title: 'Detal, który zmienia całość.', offer: 'Profile do taśm LED: dobór przekroju, klosza i sposobu montażu.', audience: 'Architekci, stolarze i producenci mebli', message: 'Pokaż czystą linię światła oraz detal montażu w meblu lub zabudowie.' },
  power: { name: 'Zasilacze', icon: 'bolt', image: 'assets/prescot/scharfer.jpg', title: 'Dobry projekt zaczyna się od doboru.', offer: 'Zasilacze do instalacji LED. Dobór mocy, napięcia i warunków pracy na podstawie kart produktów.', audience: 'Instalatorzy i hurtownie elektryczne', message: 'Ułatw dobór zasilacza do konkretnej taśmy, jej długości i miejsca montażu.' },
  controls: { name: 'Sterowanie i akcesoria', icon: 'sliders', image: 'assets/prescot/sterowanie.webp', title: 'Jedno wnętrze. Wiele nastrojów.', offer: 'Sterowniki, piloty i akcesoria LED. Zgodność z wybraną taśmą wymaga sprawdzenia.', audience: 'Instalatorzy oraz klienci urządzający dom', message: 'Pokaż zmianę atmosfery za pomocą sterowania światłem, kolorem i temperaturą barwową.' },
  sets: { name: 'Zestawy LED', icon: 'bag', image: 'assets/prescot/tasmy.webp', title: 'Zaplanuj światło jako całość.', offer: 'Zestaw: taśma LED, profil, zasilacz, sterowanie i potrzebne akcesoria. Specyfikacja do ustalenia.', audience: 'Klienci urządzający wnętrza i wykonawcy', message: 'Pokaż kompletną listę elementów potrzebnych do uzyskania wybranego efektu.' },
  other: { name: 'Inny produkt', icon: 'diamond', image: 'assets/prescot/profile.webp', title: 'Nowy pomysł na kampanię.', offer: '', audience: '', message: '' },
};
export const audiences = ['Architekci wnętrz', 'Instalatorzy', 'Hurtownie i dystrybutorzy', 'Stolarze i producenci mebli', 'Klienci indywidualni', 'Inwestorzy i wykonawcy'];
export const nodeTypes = {
  product: { label: 'Produkt', icon: 'diamond', color: 'orange', stage: 'offer', hint: 'Co promujemy? Podaj model, zastosowanie i link do produktu.' },
  audience: { label: 'Odbiorcy', icon: 'users', color: 'violet', stage: 'offer', hint: 'Kto podejmuje decyzję? Jakiego rozwiązania szuka?' },
  message: { label: 'Przekaz', icon: 'message', color: 'amber', stage: 'offer', hint: 'Jedna potrzeba klienta, jedna korzyść i dowód.' },
  channel: { label: 'Kanał', icon: 'target', color: 'blue', stage: 'ads', hint: 'Platforma, cel reklamy, budżet i sposób dotarcia.' },
  creative: { label: 'Kreacja', icon: 'play', color: 'pink', stage: 'ads', hint: 'Format, pomysł na materiał, nagłówek i wezwanie do działania.' },
  landing: { label: 'Strona docelowa', icon: 'layout', color: 'teal', stage: 'page', hint: 'Adres strony, oferta i informacje potrzebne do decyzji.' },
  conversion: { label: 'Konwersja', icon: 'cursor', color: 'green', stage: 'action', hint: 'Jedno działanie klienta: zakup, formularz, konsultacja lub pobranie.' },
  remarketing: { label: 'Powrót klienta', icon: 'return', color: 'pink', stage: 'recovery', hint: 'Kogo zapraszamy ponownie, z jakim przekazem i kiedy wykluczamy?' },
  measurement: { label: 'Pomiar', icon: 'chart', color: 'blue', stage: 'measure', hint: 'Wskaźnik, źródło danych, cel liczbowy i termin oceny.' },
};
export const conversionTitles={purchase:'Wybór produktu i zakup',lead:'Zapytanie o rozwiązanie',appointment:'Konsultacja projektu',signup:'Pobranie katalogu LED'};
export function defaultFlow(product = 'strips', goal = 'lead') {
  const p = products[product] || products.strips;
  const action = conversionTitles[goal] || conversionTitles.lead;
  const definitions = [
    ['product', p.name, 60, 250, p.offer], ['audience', p.audience || 'Wybierz odbiorców', 360, 250, p.audience],
    ['message', 'Obietnica kampanii', 660, 250, p.message], ['channel', 'Meta Ads', 960, 60, 'Propozycja: pokaż zastosowanie produktu. Ustal budżet, grupę odbiorców i cel kampanii.'],
    ['channel', 'Google Ads', 960, 440, 'Propozycja: odpowiedz na konkretne wyszukiwanie produktu. Zapisz frazy i wykluczenia.'],
    ['creative', 'Inspiracja · wideo / grafika', 1260, 60, p.title], ['creative', 'Odpowiedź na potrzebę', 1260, 440, 'Nagłówek związany z wyszukiwaniem. Parametry i dostępność wyłącznie z aktualnej oferty.'],
    ['landing', 'Strona produktu lub zestawu', 1560, 250, 'Dodaj adres strony i sprawdź spójność reklamy z ofertą.'],
    ['conversion', action, 1860, 250, 'Określ działanie, zdarzenie pomiarowe i informację po jego wykonaniu.'],
    ['measurement', 'Wynik i kolejny krok', 2160, 250, 'Wybierz miernik: koszt zakupu lub wartościowego zapytania. Wpisz cel i datę oceny.'],
    ['remarketing', 'Wróć do zainteresowanych', 1860, 610, 'Osoby, które obejrzały ofertę i nie wykonały działania. Ustal okres, materiał i wykluczenia.'],
  ];
  const nodes = definitions.map(([type, title, x, y, note], i) => ({ id: `step-${i}`, type, title, x, y, note, status: 'todo', owner: '', due: '' }));
  const edges = [[0,1],[1,2],[2,3],[2,4],[3,5],[4,6],[5,7],[6,7],[7,8],[8,9],[7,10],[10,7]].map(([a,b]) => ({id:uid(),from:nodes[a].id,to:nodes[b].id}));
  return { nodes, edges, viewport: null };
}
export function createCampaign(product = 'strips', name = '', goal = 'lead') {
  product = Object.hasOwn(products, product) ? product : 'strips';
  const p = products[product];
  goal=Object.hasOwn(conversionTitles,goal)?goal:'lead';
  return { ...cleanState({version:1,goal}), id:uid(), product, brief: {name:name.trim().slice(0,120) || `${p.name} · nowa kampania`, offer:p.offer, audience:p.audience, advantage:'', channel:'Meta Ads, Google Ads — propozycja do ustalenia', budget:''}, flow:defaultFlow(product,goal), handoff:cleanHandoff(null), updatedAt:null };
}
const str = (value, max = 8000) => typeof value === 'string' ? value.slice(0,max) : '';
const coordinate = value => Number.isFinite(value) ? Math.max(-10000,Math.min(10000,value)) : 0;
export function cleanFlow(raw, product, goal) {
  if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return defaultFlow(product,goal);
  const ids = new Set();
  const nodes = raw.nodes.slice(0,80).filter(n => {
    if (!n || !Object.hasOwn(nodeTypes,n.type) || !/^[\w-]{1,80}$/.test(n.id) || ids.has(n.id)) return false;
    ids.add(n.id);return true;
  }).map(n => ({id:n.id,type:n.type,title:str(n.title,120),note:str(n.note),status:['todo','doing','done'].includes(n.status)?n.status:'todo',x:coordinate(n.x),y:coordinate(n.y),owner:str(n.owner,120),due:/^\d{4}-\d{2}-\d{2}$/.test(n.due)?n.due:'',...(n.type==='creative'?{design:cleanDesign(n.design)}:{})}));
  const pairs = new Set();
  const edges = raw.edges.slice(0,240).filter(e => {
    if (!e || !ids.has(e.from) || !ids.has(e.to) || e.from === e.to || pairs.has(`${e.from}:${e.to}`)) return false;
    pairs.add(`${e.from}:${e.to}`);return true;
  }).map(e => ({id:uid(),from:e.from,to:e.to}));
  const v = raw.viewport;
  const viewport = v && [v.x,v.y,v.zoom].every(Number.isFinite) ? {x:coordinate(v.x),y:coordinate(v.y),zoom:Math.max(.05,Math.min(1.5,v.zoom))} : null;
  return {nodes,edges,viewport};
}
export function cleanWorkspace(raw) {
  if (!raw || raw.schema !== 1 || !Array.isArray(raw.campaigns) || !raw.campaigns.length) throw Error('Nieprawidłowa kopia przestrzeni kampanii.');
  const ids = new Set();
  const campaigns = raw.campaigns.slice(0,60).map(c => {
    if (!c || c.version !== 1) throw Error('Nieprawidłowa kampania w kopii.');
    let id = /^[\w-]{1,80}$/.test(c.id) ? c.id : uid();
    if(ids.has(id))id=uid();ids.add(id);
    const base=cleanState(c), product=Object.hasOwn(products,c.product)?c.product:'other';
    return {...base,id,product,flow:cleanFlow(c.flow,product,base.goal),handoff:cleanHandoff(c.handoff),analysis:cleanAnalysis(c.analysis)};
  });
  return {schema:1,activeCampaignId:ids.has(raw.activeCampaignId)?raw.activeCampaignId:campaigns[0].id,campaigns};
}
export function importWorkspace(raw) {
  if(raw?.schema===1)return cleanWorkspace(raw);
  if(raw?.version===1 && raw.brief && !Array.isArray(raw.brief) && typeof raw.brief==='object' && raw.tasks && !Array.isArray(raw.tasks) && typeof raw.tasks==='object') {
    const campaign={...createCampaign('other','Wcześniejszy plan'),...cleanState(raw)};
    campaign.flow=defaultFlow('other',campaign.goal);
    return {schema:1,activeCampaignId:campaign.id,campaigns:[campaign]};
  }
  throw Error('Wybierz kopię Kampanii Prescot LED lub wcześniejszego Rentgen Studio.');
}
export function loadWorkspace(storage) {
  const saved = storage.getItem(WORKSPACE_KEY);
  if(saved)return cleanWorkspace(JSON.parse(saved));
  const legacy=storage.getItem(STORAGE_KEY);
  if(legacy) {
    const raw=JSON.parse(legacy);
    if(Object.values(raw.brief||{}).some(Boolean)||Object.values(raw.tasks||{}).some(goal=>Object.keys(goal||{}).length))return importWorkspace(raw);
  }
  const campaign=createCampaign('strips','Taśmy LED · od inspiracji do projektu');
  return {schema:1,activeCampaignId:campaign.id,campaigns:[campaign]};
}
export function reviewFlow(campaign) {
  const {nodes,edges}=campaign.flow, issues=[];
  for(const type of ['product','audience','message','channel','creative','landing','conversion','measurement']) {
    if(!nodes.some(n=>n.type===type))issues.push({text:`Dodaj etap: ${nodeTypes[type].label}.`});
  }
  for(const node of nodes) {
    if(!node.title.trim()||!node.note.trim())issues.push({id:node.id,text:`Uzupełnij: ${node.title||nodeTypes[node.type].label}.`});
    if(!edges.some(e=>e.from===node.id||e.to===node.id))issues.push({id:node.id,text:`Etap bez połączenia: ${node.title}.`});
  }
  const starts=nodes.filter(n=>n.type==='product').map(n=>n.id), visited=new Set(starts), queue=[...starts];
  while(queue.length){const current=queue.shift();for(const e of edges.filter(e=>e.from===current)){if(!visited.has(e.to)){visited.add(e.to);queue.push(e.to);}}}
  for(const node of nodes.filter(n=>!visited.has(n.id)))if(edges.some(e=>e.from===node.id||e.to===node.id))issues.push({id:node.id,text:`Brak ścieżki od produktu do: ${node.title}.`});
  if(!campaign.brief.budget?.trim())issues.push({text:'Ustal budżet i termin w briefie.',brief:true});
  if(!campaign.brief.advantage?.trim())issues.push({text:'Zapisz wyróżnik oferty potwierdzony w produktach Prescot.',brief:true});
  const pending=nodes.filter(n=>n.status!=='done').length;
  if(pending)issues.push({text:`${pending} etapów mapy czeka na przygotowanie lub sprawdzenie.`});
  return issues;
}
