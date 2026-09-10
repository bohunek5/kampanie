import { nodeTypes, audiences, uid, products } from './workspace.js';
import { icon } from './icons.js';
import { statuses } from './model.js';
import {stageHelpHTML} from './guide.js';
import {cleanDesign,designFields} from './production-model.js';

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc=escapeHTML, W=228, H=154;
const clone=value=>JSON.parse(JSON.stringify(value));
export function edgePath(a,b) {
  const x1=a.x+W,y1=a.y+H/2,x2=b.x,y2=b.y+H/2;
  const bend=Math.max(65,Math.min(230,Math.abs(x2-x1)*.48));
  return `M ${x1} ${y1} C ${x1+bend} ${y1}, ${x2-bend} ${y2}, ${x2} ${y2}`;
}
export function bounds(nodes) {
  if(!nodes.length)return {x:0,y:0,width:800,height:500};
  const x=Math.min(...nodes.map(n=>n.x))-70,y=Math.min(...nodes.map(n=>n.y))-55;
  return {x,y,width:Math.max(...nodes.map(n=>n.x+W))-x+85,height:Math.max(...nodes.map(n=>n.y+H))-y+55};
}
export function flowSVG(campaign) {
  const {nodes,edges}=campaign.flow,b=bounds(nodes),title=campaign.brief.name||'Kampanie Prescot LED';
  const colors={orange:'#e4572b',violet:'#8066bb',amber:'#a78032',blue:'#507db5',pink:'#b8658c',teal:'#388b84',green:'#598c57'};
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const lines=(text,size)=>{const words=text.split(/\s+/),rows=[''];for(const word of words){if((rows.at(-1)+' '+word).length>size&&rows.at(-1))rows.push(word);else rows[rows.length-1]+=(rows.at(-1)?' ':'')+word;}return rows.slice(0,2);};
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.width)}" height="${Math.ceil(b.height+110)}" viewBox="${b.x} ${b.y-110} ${b.width} ${b.height+110}"><rect x="${b.x}" y="${b.y-110}" width="${b.width}" height="${b.height+110}" fill="#f5f6f8"/><style>text{font-family:Arial,sans-serif}</style><text x="${b.x+30}" y="${b.y-64}" font-size="28" font-weight="700" fill="#252930">${esc(title)}</text><text x="${b.x+30}" y="${b.y-32}" font-size="15" fill="#66717d">PRESCOT LED · mapa planowanej kampanii · ${new Date().toLocaleDateString('pl-PL')}</text><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="#97a2ad"/></marker></defs>${edges.filter(e=>byId.has(e.from)&&byId.has(e.to)).map(e=>`<path d="${edgePath(byId.get(e.from),byId.get(e.to))}" fill="none" stroke="#97a2ad" stroke-width="2" marker-end="url(#arrow)"/>`).join('')}${nodes.map(n=>`<g transform="translate(${n.x} ${n.y})"><rect width="${W}" height="${H}" rx="14" fill="white" stroke="#dce1e6"/><rect x="16" y="18" width="5" height="20" rx="2" fill="${colors[nodeTypes[n.type].color]}"/><text x="29" y="33" font-size="13" fill="#687380">${esc(nodeTypes[n.type].label)}</text>${lines(n.title,25).map((line,i)=>`<text x="17" y="${65+i*23}" fill="#252930" font-weight="600" font-size="16">${esc(line)}</text>`).join('')}<text x="17" y="130" fill="${n.status==='done'?'#42865d':'#87919b'}" font-size="12">${esc(statuses[n.status])}${n.owner?' · '+esc(n.owner.slice(0,20)):''}</text></g>`).join('')}</svg>`;
}

export class FlowEditor {
  constructor(root,campaign,{save,notify,review,exportMap}) {
    this.root=root;this.campaign=campaign;this.save=save;this.notify=notify;this.review=review;this.exportMap=exportMap;
    this.abort=new AbortController();this.history=[];this.future=[];this.selected=null;this.linkFrom=null;this.edge=null;
    this.root.innerHTML=`<div class="flow-toolbar"><div class="flow-mode"><span class="live-dot"></span> Projekt kampanii <span class="flow-mode-divider">/</span><span data-flow-count></span></div><div class="flow-tools"><button class="button secondary" data-flow-action="add">${icon('plus')} Dodaj etap</button><button class="button secondary" data-flow-action="review">${icon('check')}<span>Sprawdź plan</span></button><button class="icon-button" data-flow-action="export" aria-label="Pobierz mapę SVG" title="Pobierz mapę SVG">${icon('download')}</button></div></div><div class="flow-layout"><div class="flow-viewport" tabindex="0" role="region" aria-label="Edytowalna mapa kampanii. Przesuwaj tło, aby poruszać mapą. Wybierz etap klawiszem Enter."><div class="flow-world"><svg class="flow-edges" aria-label="Połączenia etapów"><defs><marker id="flow-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z"/></marker></defs><g class="edge-paths"></g><path class="pending-edge" hidden/></svg><div class="flow-nodes"></div></div><div class="canvas-empty" hidden><h2>Zacznij od produktu.</h2><p>Dodaj pierwszy etap i połącz go z odbiorcami.</p><button class="button primary" data-flow-action="add">${icon('plus')} Dodaj etap</button></div><button class="flow-minimap" aria-label="Przenieś widok na miniaturze mapy"><svg aria-hidden="true"></svg><span>CAŁA ŚCIEŻKA</span></button><div class="flow-legend"><span><i class="legend-product"></i> Oferta</span><span><i class="legend-channel"></i> Dotarcie</span><span><i class="legend-result"></i> Działanie</span></div><div class="flow-navigation"><button class="icon-button" data-flow-action="undo" aria-label="Cofnij zmianę" title="Cofnij ⌘Z">${icon('undo')}</button><button class="icon-button" data-flow-action="redo" aria-label="Ponów zmianę" title="Ponów ⌘⇧Z">${icon('redo')}</button><i></i><button class="icon-button" data-flow-action="zoom-out" aria-label="Oddal mapę">${icon('minus')}</button><button class="zoom-label" data-flow-action="actual" aria-label="Ustaw powiększenie 100%"></button><button class="icon-button" data-flow-action="zoom-in" aria-label="Przybliż mapę">${icon('plus')}</button><button class="icon-button" data-flow-action="fit" aria-label="Pokaż całą mapę" title="Pokaż całą mapę">${icon('fit')}</button></div><div class="connection-hint" role="status" hidden></div><div class="edge-tools" hidden><span>Wybrane połączenie</span><button data-flow-action="delete-edge">${icon('trash')} Usuń</button></div></div><aside class="flow-inspector" aria-label="Ustawienia etapu" hidden></aside><div class="node-picker" hidden><div><h3>Dodaj etap</h3><button class="icon-button" data-flow-action="close-picker" aria-label="Zamknij wybór etapu">${icon('close')}</button></div><p>Rozbuduj ścieżkę lub dodaj wariant.</p>${Object.entries(nodeTypes).map(([type,m])=>`<button data-add-type="${type}"><span class="stage-icon ${m.color}">${icon(m.icon)}</span><span>${m.label}</span>${icon('plus')}</button>`).join('')}</div></div><div class="flow-footer"><span>${icon('cursor')} Przesuń etap · połącz kropki · kliknij, aby edytować</span><span data-save-label></span></div>`;
    this.viewport=root.querySelector('.flow-viewport');this.world=root.querySelector('.flow-world');
    this.v=clone(campaign.flow.viewport||{x:0,y:0,zoom:.6});
    const on=(target,event,fn,opts={})=>target.addEventListener(event,fn,{...opts,signal:this.abort.signal});
    on(root,'click',e=>this.click(e));on(root,'input',e=>this.input(e));on(root,'change',e=>this.change(e));
    on(root,'focusin',e=>{if(e.target.matches('[data-node-field]'))this.fieldSnapshot=clone(this.flow);});
    on(this.viewport,'pointerdown',e=>this.down(e));on(this.viewport,'pointermove',e=>this.move(e));on(this.viewport,'pointerup',e=>this.up(e));on(this.viewport,'pointercancel',()=>this.cancelGesture());
    on(this.viewport,'wheel',e=>this.wheel(e),{passive:false});on(root,'keydown',e=>this.key(e));
    this.resize=new ResizeObserver(()=>{if(!this.initialized&&this.viewport.clientWidth){this.initialized=true;if(!campaign.flow.viewport){const first=this.flow.nodes[0];this.v.zoom=this.viewport.clientWidth<600?.95:1;this.v.x=32-(first?.x||0)*this.v.zoom;this.v.y=this.viewport.clientHeight/2-((first?.y||0)+H/2)*this.v.zoom-15;this.transform();}else this.transform();}});this.resize.observe(this.viewport);
    this.draw();
  }
  get flow(){return this.campaign.flow;}
  destroy(){this.abort.abort();this.resize.disconnect();}
  checkpoint(snapshot=this.flow){this.history.push(clone(snapshot));if(this.history.length>40)this.history.shift();this.future=[];}
  commit(){this.campaign.flow.viewport=clone(this.v);this.save();this.controls();}
  controls(){this.root.querySelector('[data-flow-count]').textContent=`${this.flow.nodes.length} etapów`;this.root.querySelector('[data-flow-action="undo"]').disabled=!this.history.length;this.root.querySelector('[data-flow-action="redo"]').disabled=!this.future.length;}
  node(id){return this.flow.nodes.find(n=>n.id===id);}
  draw(){
    this.root.querySelector('.flow-nodes').innerHTML=this.flow.nodes.map(n=>this.nodeHTML(n)).join('');
    this.root.querySelector('.canvas-empty').hidden=!!this.flow.nodes.length;
    this.drawEdges();this.transform();this.controls();
  }
  nodeHTML(n){const m=nodeTypes[n.type];return `<article class="flow-node ${this.selected===n.id?'selected':''} ${n.status}" data-node="${n.id}" style="left:${n.x}px;top:${n.y}px" tabindex="0" aria-label="${esc(n.title)}, ${m.label}, ${statuses[n.status]}"><button class="node-port input-port" data-port="in" data-node-id="${n.id}" aria-label="Połącz wejście: ${esc(n.title)}"></button><div class="node-heading"><span class="stage-icon ${m.color}">${icon(m.icon)}</span><span>${m.label}</span><span class="node-grip">⠿</span></div><h3>${esc(n.title||'Bez nazwy')}</h3><div class="node-bottom"><span class="status-dot ${n.status}"></span><span>${statuses[n.status]}</span>${n.owner?`<span class="node-owner" title="${esc(n.owner)}">${esc(n.owner.slice(0,2).toUpperCase())}</span>`:''}</div><button class="node-port output-port" data-port="out" data-node-id="${n.id}" aria-label="Połącz wyjście: ${esc(n.title)}"></button></article>`;}
  drawEdges(){const byId=new Map(this.flow.nodes.map(n=>[n.id,n]));this.root.querySelector('.edge-paths').innerHTML=this.flow.edges.filter(e=>byId.has(e.from)&&byId.has(e.to)).map(e=>`<g class="flow-edge ${this.edge===e.id?'selected':''}" data-edge="${e.id}" tabindex="0" role="button" aria-label="Połączenie: ${esc(byId.get(e.from).title)} → ${esc(byId.get(e.to).title)}"><path class="edge-hit" d="${edgePath(byId.get(e.from),byId.get(e.to))}"/><path class="edge-line" d="${edgePath(byId.get(e.from),byId.get(e.to))}" marker-end="url(#flow-arrow)"/></g>`).join('');}
  transform(){this.world.style.transform=`translate(${this.v.x}px,${this.v.y}px) scale(${this.v.zoom})`;this.viewport.style.backgroundSize=`${24*this.v.zoom}px ${24*this.v.zoom}px`;this.viewport.style.backgroundPosition=`${this.v.x}px ${this.v.y}px`;this.root.querySelector('.zoom-label').textContent=`${Math.round(this.v.zoom*100)}%`;this.minimap();}
  fit(persist=true){const b=bounds(this.flow.nodes),w=this.viewport.clientWidth,h=this.viewport.clientHeight;this.v.zoom=Math.min(1,Math.max(.05,Math.min((w-36)/b.width,(h-120)/b.height)));this.v.x=(w-b.width*this.v.zoom)/2-b.x*this.v.zoom;this.v.y=(h-b.height*this.v.zoom)/2-b.y*this.v.zoom-8;this.transform();if(persist)this.commit();}
  zoom(value,cx=this.viewport.clientWidth/2,cy=this.viewport.clientHeight/2){const old=this.v.zoom,next=Math.max(.05,Math.min(1.5,value));this.v.x=cx-(cx-this.v.x)*next/old;this.v.y=cy-(cy-this.v.y)*next/old;this.v.zoom=next;this.transform();this.commit();}
  point(e){const r=this.viewport.getBoundingClientRect();return {x:(e.clientX-r.left-this.v.x)/this.v.zoom,y:(e.clientY-r.top-this.v.y)/this.v.zoom};}
  down(e){
    if(e.button!==0||this.gesture||e.target.closest('.flow-navigation,.flow-legend,.flow-minimap,.edge-tools,.connection-hint,.canvas-empty'))return;
    const port=e.target.closest('[data-port]'),node=e.target.closest('[data-node]'),edge=e.target.closest('[data-edge]');
    if(edge)return;
    e.preventDefault();this.viewport.focus({preventScroll:true});
    this.gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,v:clone(this.v),nodeId:node?.dataset.node,port:port?.dataset.port,portId:port?.dataset.nodeId,moved:false,snapshot:clone(this.flow)};
    if(node){this.gesture.position={x:this.node(node.dataset.node).x,y:this.node(node.dataset.node).y};}
    this.viewport.setPointerCapture(e.pointerId);
  }
  move(e){const g=this.gesture;if(!g||g.pointerId!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(Math.hypot(dx,dy)>4)g.moved=true;if(!g.moved)return;
    if(g.port){if(g.port==='out'){const a=this.node(g.portId),p=this.point(e),path=this.root.querySelector('.pending-edge');path.removeAttribute('hidden');path.setAttribute('d',`M${a.x+W} ${a.y+H/2} C${a.x+W+80} ${a.y+H/2}, ${p.x-80} ${p.y}, ${p.x} ${p.y}`);}return;}
    if(g.nodeId){const n=this.node(g.nodeId);n.x=Math.max(-10000,Math.min(10000,Math.round((g.position.x+dx/this.v.zoom)/8)*8));n.y=Math.max(-10000,Math.min(10000,Math.round((g.position.y+dy/this.v.zoom)/8)*8));const el=this.root.querySelector(`[data-node="${n.id}"]`);el.style.left=n.x+'px';el.style.top=n.y+'px';this.drawEdges();this.minimap();}
    else{this.v.x=g.v.x+dx;this.v.y=g.v.y+dy;this.transform();}
  }
  up(e){const g=this.gesture;if(!g||g.pointerId!==e.pointerId)return;this.gesture=null;if(this.viewport.hasPointerCapture(e.pointerId))this.viewport.releasePointerCapture(e.pointerId);this.root.querySelector('.pending-edge').setAttribute('hidden','');
    if(g.port){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-port]');if(g.port==='out'){this.linkFrom=g.portId;if(target?.dataset.port==='in')this.connect(target.dataset.nodeId);else this.showConnection();}else if(this.linkFrom)this.connect(g.portId);else this.notify('Najpierw wybierz kropkę po prawej stronie etapu źródłowego.');return;}
    if(g.moved){if(g.nodeId)this.checkpoint(g.snapshot);this.commit();return;}
    if(g.nodeId)this.select(g.nodeId);else{this.select(null);this.cancelLink();}
  }
  cancelGesture(){const g=this.gesture;if(!g)return;this.campaign.flow=g.snapshot;this.v=g.v;this.gesture=null;this.root.querySelector('.pending-edge').setAttribute('hidden','');this.draw();}
  showConnection(){const hint=this.root.querySelector('.connection-hint');hint.hidden=!this.linkFrom;hint.textContent=this.linkFrom?'Wybierz wejście kolejnego etapu · Esc anuluje':'';this.root.querySelectorAll('.output-port').forEach(el=>el.classList.toggle('connecting',el.dataset.nodeId===this.linkFrom));}
  cancelLink(){this.linkFrom=null;this.showConnection();}
  connect(target){if(!this.linkFrom||!this.node(target))return;if(this.linkFrom===target){this.notify('Połącz dwa różne etapy.');return;}if(this.flow.edges.some(e=>e.from===this.linkFrom&&e.to===target)){this.notify('Te etapy są już połączone.');this.cancelLink();return;}if(this.flow.edges.length>=240){this.notify('Mapa może zawierać do 240 połączeń.');return;}this.checkpoint();this.flow.edges.push({id:uid(),from:this.linkFrom,to:target});this.cancelLink();this.drawEdges();this.commit();this.notify('Połączono etapy.');}
  wheel(e){e.preventDefault();if(e.ctrlKey||e.metaKey){const r=this.viewport.getBoundingClientRect();this.zoom(this.v.zoom*Math.exp(-e.deltaY*.006),e.clientX-r.left,e.clientY-r.top);}else{this.v.x-=e.deltaX;this.v.y-=e.deltaY;this.transform();this.commit();}}
  select(id){this.selected=id;this.edge=null;this.root.querySelector('.edge-tools').hidden=true;this.drawEdges();this.root.querySelectorAll('[data-node]').forEach(el=>el.classList.toggle('selected',el.dataset.node===id));this.inspector();this.minimap();}
  inspector(){
    const panel=this.root.querySelector('.flow-inspector'),n=this.node(this.selected);panel.hidden=!n;if(!n)return;
    const m=nodeTypes[n.type];panel.innerHTML=`<div class="inspector-heading"><span class="stage-icon ${m.color}">${icon(m.icon)}</span><div><span class="eyebrow">USTAWIENIA ETAPU</span><h2>${m.label}</h2></div><button class="icon-button" data-flow-action="close-inspector" aria-label="Zamknij ustawienia etapu">${icon('close')}</button></div><p class="inspector-hint">${m.hint}</p>${stageHelpHTML(n.type,this.campaign.goal,n.id)}${n.type==='creative'?`<a class="button secondary full inspector-handoff" href="#handoff/${this.campaign.goal}/${n.id}">${icon('play')} Brief dla grafika</a>`:''}<label>Nazwa etapu<input data-node-field="title" maxlength="120" value="${esc(n.title)}"></label><label>Status przygotowania<select data-node-field="status">${Object.entries(statuses).map(([value,label])=>`<option value="${value}" ${value===n.status?'selected':''}>${label}</option>`).join('')}</select></label><label>Ustalenia<textarea data-node-field="note" maxlength="8000" rows="6" placeholder="Zapisz konkretny plan tego etapu…">${esc(n.note)}</textarea></label>${n.type==='audience'?`<div class="audience-chips">${audiences.map(a=>`<button data-audience="${esc(a)}">${esc(a)}</button>`).join('')}</div>`:''}<div class="node-assignment"><label>Osoba odpowiedzialna<input data-node-field="owner" maxlength="120" placeholder="Do ustalenia" value="${esc(n.owner)}"></label><label>Termin<input type="date" data-node-field="due" value="${esc(n.due)}"></label></div><button class="button primary full" data-flow-action="prompt">${icon('sparkle')} Przygotuj polecenie do AI</button><a class="inspector-checklist" href="#area/${this.campaign.goal}/${m.stage}">${icon('plan')} Decyzje i checklista ${icon('arrow')}</a><div class="inspector-bottom"><button data-flow-action="duplicate">${icon('copy')} Duplikuj</button><button class="danger-text" data-flow-action="delete-node">${icon('trash')} Usuń etap</button></div>`;
  }
  input(e){const key=e.target.dataset.nodeField;if(!key||key==='status'||key==='due')return;this.editField(key,e.target.value);}
  change(e){const key=e.target.dataset.nodeField;if(key==='status'||key==='due')this.editField(key,e.target.value);}
  editField(key,value){const n=this.node(this.selected);if(!n)return;if(this.fieldSnapshot){this.checkpoint(this.fieldSnapshot);this.fieldSnapshot=null;}n[key]=value;const el=this.root.querySelector(`[data-node="${n.id}"]`);el.outerHTML=this.nodeHTML(n);this.commit();}
  minimap(){const svg=this.root.querySelector('.flow-minimap svg');if(!svg)return;const b=bounds(this.flow.nodes);svg.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);svg.innerHTML=this.flow.nodes.map(n=>`<rect x="${n.x}" y="${n.y}" width="${W}" height="${H}" rx="18" fill="${n.status==='done'?'#a5c6b1':n.id===this.selected?'#e99a77':'#cbd3df'}"/>`).join('')+`<rect x="${-this.v.x/this.v.zoom}" y="${-this.v.y/this.v.zoom}" width="${this.viewport.clientWidth/this.v.zoom}" height="${this.viewport.clientHeight/this.v.zoom}" rx="5" fill="#f8b08712" stroke="#d9936d" stroke-width="10"/>`;}
  click(e){
    const mini=e.target.closest('.flow-minimap');if(mini){if(e.detail===0){this.fit();return;}const svg=mini.querySelector('svg'),b=bounds(this.flow.nodes),r=svg.getBoundingClientRect(),scale=Math.min(r.width/b.width,r.height/b.height),x=b.x+(e.clientX-r.left-(r.width-b.width*scale)/2)/scale,y=b.y+(e.clientY-r.top-(r.height-b.height*scale)/2)/scale;this.v.x=this.viewport.clientWidth/2-x*this.v.zoom;this.v.y=this.viewport.clientHeight/2-y*this.v.zoom;this.transform();this.commit();return;}

    const action=e.target.closest('[data-flow-action]')?.dataset.flowAction,type=e.target.closest('[data-add-type]')?.dataset.addType,audience=e.target.closest('[data-audience]')?.dataset.audience,edge=e.target.closest('[data-edge]');
    if(type){this.add(type);return;}
    if(audience){const n=this.node(this.selected);this.checkpoint();n.title=audience;n.note=`${audience}\n\nPotrzeba: \nZastosowanie: \nPowód wyboru: `;this.draw();this.inspector();this.commit();return;}
    if(edge){this.select(null);this.edge=edge.dataset.edge;this.drawEdges();this.root.querySelector('.edge-tools').hidden=false;return;}
    if(!action)return;
    switch(action){
      case 'add':this.root.querySelector('.node-picker').hidden=false;this.root.querySelector('[data-add-type]').focus();break;
      case 'close-picker':this.root.querySelector('.node-picker').hidden=true;this.root.querySelector('[data-flow-action="add"]').focus();break;
      case 'review':this.review();break;case 'export':this.exportMap();break;
      case 'fit':this.fit();break;case 'actual':this.zoom(1);break;case 'zoom-in':this.zoom(this.v.zoom*1.2);break;case 'zoom-out':this.zoom(this.v.zoom/1.2);break;
      case 'undo':this.undo();break;case 'redo':this.undo(true);break;
      case 'close-inspector':this.select(null);this.viewport.focus();break;
      case 'delete-node':this.removeNode();break;
      case 'delete-edge':this.removeEdge();break;
      case 'duplicate':{const n=this.node(this.selected);if(!n)break;this.add(n.type,{...clone(n),id:uid(),title:n.title.slice(0,112)+' · kopia',x:n.x+40,y:n.y+190});break;}
      case 'prompt':this.prompt();break;
    }
  }
  add(type,copy){if(this.flow.nodes.length>=80){this.notify('Mapa może zawierać do 80 etapów. Utwórz kolejną kampanię.');return;}this.checkpoint();const n=copy||{id:uid(),type,title:nodeTypes[type].label,note:'',status:'todo',owner:'',due:'',x:Math.round((this.viewport.clientWidth/2-this.v.x)/this.v.zoom-W/2),y:Math.round((this.viewport.clientHeight/2-this.v.y)/this.v.zoom-H/2)};this.flow.nodes.push(n);this.root.querySelector('.node-picker').hidden=true;this.draw();this.select(n.id);this.commit();this.root.querySelector('[data-node-field="title"]').focus();}
  removeNode(){if(!this.selected)return;this.checkpoint();const id=this.selected;this.flow.nodes=this.flow.nodes.filter(n=>n.id!==id);this.flow.edges=this.flow.edges.filter(e=>e.from!==id&&e.to!==id);this.cancelLink();this.select(null);this.draw();this.commit();this.notify('Usunięto etap z połączeniami. Możesz cofnąć zmianę.');}
  removeEdge(){if(!this.edge)return;this.checkpoint();this.flow.edges=this.flow.edges.filter(e=>e.id!==this.edge);this.edge=null;this.root.querySelector('.edge-tools').hidden=true;this.drawEdges();this.commit();}
  undo(redo=false){const from=redo?this.future:this.history,to=redo?this.history:this.future;if(!from.length)return;to.push(clone(this.flow));this.campaign.flow=from.pop();this.v=clone(this.flow.viewport||this.v);this.selected=null;this.edge=null;this.linkFrom=null;this.showConnection();this.inspector();this.root.querySelector('.edge-tools').hidden=true;this.draw();this.commit();}
  key(e){if(e.target.matches('input,textarea,select')||e.target.closest('dialog'))return;
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();this.undo(e.shiftKey);return;}
    if(e.key==='Escape'){this.cancelLink();this.select(null);this.root.querySelector('.node-picker').hidden=true;return;}
    const port=e.target.closest('[data-port]'),node=e.target.closest('[data-node]'),edge=e.target.closest('[data-edge]');
    if(port&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(port.dataset.port==='out'){this.linkFrom=port.dataset.nodeId;this.showConnection();}else this.connect(port.dataset.nodeId);return;}
    if(node&&['Enter',' '].includes(e.key)){e.preventDefault();this.select(node.dataset.node);this.root.querySelector('[data-node-field="title"]').focus();return;}
    if(edge&&['Enter',' '].includes(e.key)){e.preventDefault();this.edge=edge.dataset.edge;this.drawEdges();this.root.querySelector('.edge-tools').hidden=false;return;}
    if(e.key==='Delete'||e.key==='Backspace'){if(this.edge||this.selected){e.preventDefault();if(this.edge)this.removeEdge();else this.removeNode();}return;}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const dx=e.key==='ArrowLeft'?-24:e.key==='ArrowRight'?24:0,dy=e.key==='ArrowUp'?-24:e.key==='ArrowDown'?24:0;if(node){this.checkpoint();const n=this.node(node.dataset.node);n.x+=dx;n.y+=dy;this.draw();this.root.querySelector(`[data-node="${n.id}"]`).focus();}else{this.v.x-=dx;this.v.y-=dy;this.transform();}this.commit();}
  }
  prompt(){const n=this.node(this.selected);if(!n)return;const incoming=this.flow.edges.filter(e=>e.to===n.id).map(e=>this.node(e.from)?.title).join(', '),outgoing=this.flow.edges.filter(e=>e.from===n.id).map(e=>this.node(e.to)?.title).join(', ');
    const visited=new Set([n.id]),queue=[n.id],upstream=[];
    while(queue.length){const current=queue.shift();for(const edge of this.flow.edges.filter(e=>e.to===current)){if(visited.has(edge.from))continue;visited.add(edge.from);const source=this.node(edge.from);if(source){upstream.push(source);queue.push(source.id);}}}
    const context=upstream.reverse().map(source=>`${nodeTypes[source.type].label}: ${source.title}\n${source.note.slice(0,2000)}${source.note.length>2000?' (…)':''}`).join('\n\n');
    const text=`Przygotuj materiał roboczy dla kampanii Prescot LED.\nKampania: ${this.campaign.brief.name}\nProdukt: ${products[this.campaign.product].name}\n\nBRIEF\n${Object.entries(this.campaign.brief).map(([k,v])=>`${({name:'Nazwa',offer:'Oferta',audience:'Odbiorcy',advantage:'Wyróżnik',channel:'Kanały',budget:'Budżet i termin'})[k]||k}: ${v||'[do ustalenia]'}`).join('\n')}\n\nKONTEKST POŁĄCZONYCH ETAPÓW\n${context||'[pierwszy etap]'}\n\nETAP: ${n.title}\nRodzaj: ${nodeTypes[n.type].label}\nPoprzedza go: ${incoming||'początek ścieżki'}\nNastępny krok: ${outgoing||'[do ustalenia]'}\nUstalenia: ${n.note||'[do ustalenia]'}${n.type==='creative'?'\n\nWYTYCZNE KREACJI\n'+Object.entries(cleanDesign(n.design)).filter(([k,v])=>k!=='include'&&v).map(([k,v])=>`${designFields[k].label}: ${v}`).join('\n'):''}\n\nZaproponuj dwa konkretne warianty tego etapu. Zachowaj spójność z odbiorcą, poprzednim i następnym krokiem. Jeśli ustalenia mapy i briefu są sprzeczne, wskaż rozbieżność i poproś o wybór zamiast zgadywać. Oddziel propozycje od faktów. Nie wymyślaj parametrów produktów, cen, gwarancji, dostępności ani wyników. Wypisz brakujące dane i pytania do zespołu.`;
    const dialog=document.getElementById('promptDialog');dialog.querySelector('textarea').value=text;dialog.showModal();
  }
}
