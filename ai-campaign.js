import {createCampaign,uid,conversionTitles} from './workspace.js?v=4.0.0';
import {cleanAnalysis} from './campaign-ai.js?v=4.0.0';

export function campaignFromAnalysis(raw) {
  const analysis=cleanAnalysis(raw);if(!analysis)throw Error('Nie można zapisać niepełnej propozycji.');
  const r=analysis.result,c=createCampaign(r.product,r.name,r.goal);
  c.brief={name:r.name.slice(0,120),offer:r.offer,audience:r.audience,advantage:r.advantage,channel:r.channel,budget:''};
  const nodes=[];
  const add=(type,title,note,x,y,design)=>{const n={id:uid(),type,title,note,x,y,status:'todo',owner:'',due:''};if(design)n.design=design;nodes.push(n);return n.id;};
  const source=analysis.sources.map(s=>s.url).join('\n');
  const p=add('product',r.name,`${r.offer}\n\nŹródła:\n${source||'Opis użytkownika'}`,40,260);
  const a=add('audience','Odbiorcy kampanii',r.audiences.map(a=>`${a.name}: ${a.need}\nPrzekaz: ${a.angle}`).join('\n\n'),340,260);
  const m=add('message','Kierunek kampanii',`${r.recommendation}\n\n${r.advantage}`,640,260);
  const ch=add('channel',r.channel.slice(0,100),`Proponowane kanały: ${r.channel}. Budżet i ustawienia emisji do ustalenia.`,940,260);
  const creatives=r.ads.map((ad,i)=>add('creative',ad.title,ad.visual,1240,40+i*220,{format:ad.format,headline:ad.headline,body:ad.body,cta:ad.cta,visual:ad.visual,assets:'',destination:r.destination,include:true}));
  const l=add('landing','Strona docelowa',r.destination||'Wybierz stronę zgodną z reklamowaną ofertą.',1540,260);
  const cv=add('conversion',conversionTitles[r.goal],'Ustal zdarzenie i sprawdź pomiar przed uruchomieniem reklamy.',1840,260);
  const me=add('measurement','Pomiar i decyzja',r.actions.join('\n'),2140,260);
  const pairs=[[p,a],[a,m],[m,ch],...creatives.flatMap(cr=>[[ch,cr],[cr,l]]),[l,cv],[cv,me]];
  c.flow={nodes,edges:pairs.map(([from,to])=>({id:uid(),from,to})),viewport:null};
  c.handoff.requirements=['Propozycja AI do sprawdzenia przez zespół.',...r.questions.map(q=>`Do potwierdzenia: ${q}`)].join('\n');
  c.analysis=analysis;return c;
}
