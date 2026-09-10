import {studioView,initStudio,showAnalysis} from './studio.js?v=4.0.0';
import { content, goalMeta, stages, statuses, briefFields, itemsFor, titleFor, tasksFor, taskState, stats, promptFor, markdownFor } from './model.js?v=4.0.0';
import { icon } from './icons.js?v=4.0.0';
import { WORKSPACE_KEY, loadWorkspace, importWorkspace, createCampaign, products, nodeTypes, reviewFlow, conversionTitles } from './workspace.js?v=4.0.0';
import { FlowEditor, flowSVG } from './flow.js?v=4.0.0';
import {guideView,feedbackTemplate} from './guide.js?v=4.0.0';
import {handoffView,handoffHTML,refreshHandoff} from './handoff.js?v=4.0.0';
import {cleanHandoff,cleanDesign,handoffFields,designFields,selectedCreatives} from './production-model.js?v=4.0.0';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let storageOK = true, workspace, flowEditor, pendingFlowNode, storageRecovery;
try { workspace = loadWorkspace(localStorage); } catch { storageOK=false;try{const raw=localStorage.getItem(WORKSPACE_KEY);if(raw)storageRecovery={key:`${WORKSPACE_KEY}.recovery.${Date.now()}`,raw};}catch{}workspace=loadWorkspace({getItem:()=>null}); }
let state = workspace.campaigns.find(c=>c.id===workspace.activeCampaignId);
let view, filter = 'all', pendingImport = null, handoffMode='edit';
const main = $('#main');
const navItems = [['studio','plus','Nowa kampania'],['home','home','Moje kampanie'],['map','map','Mapa kampanii'],['handoff','play','Dla grafika']];
const href = (page, stage = '', index = '') => `#${page}/${state.goal}${stage ? '/' + stage : ''}${index !== '' ? '/' + index : ''}`;
const button = (label, action, primary = false) => `<button class="button ${primary ? 'primary' : 'secondary'}" data-action="${action}">${label}</button>`;
const chip = (name, color) => `<span class="stage-icon ${color}">${icon(name)}</span>`;
const progress = (s, extra = '') => `<div class="progress-track ${extra}" role="progressbar" aria-label="Ukończone punkty" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.done}"><span style="width:${s.percent}%"></span></div>`;
function changeGoal(goal){
 const previous=state.goal;
 for(const node of state.flow.nodes){if(node.type==='conversion'&&node.title===conversionTitles[previous])node.title=conversionTitles[goal];}
 state.goal=goal;
}
function save() {
  state.updatedAt = new Date().toISOString();
  try { if(storageRecovery){localStorage.setItem(storageRecovery.key,storageRecovery.raw);storageRecovery=null;}localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace)); storageOK = true; } catch { storageOK = false; }
  updateSaveLabel();
}
function updateSaveLabel() {
  document.querySelectorAll('[data-save-label]').forEach(el => {
    el.textContent = storageOK ? 'Zapisane na tym urządzeniu' : 'Brak zapisu — pobierz kopię planu';
    el.classList.toggle('save-error', !storageOK);
  });
}
function notify(message) {
  const toast = $('#toast');toast.textContent = message;toast.hidden = false;
  clearTimeout(notify.timer);notify.timer = setTimeout(() => { toast.hidden = true; }, 4500);
}
function readView() {
  const parts = location.hash.slice(1).split('/');
  let [page, goal, stage, index] = parts;
  if (!['studio', 'home', 'map', 'plan', 'library', 'area', 'detail', 'report', 'guide', 'handoff'].includes(page)) page = 'studio';
  if (!Object.hasOwn(goalMeta, goal)) goal = state.goal;
  if (['area', 'detail'].includes(page) && !stages.some(s => s.id === stage)) { page = 'map'; stage = undefined; }
  if (page === 'detail' && (!/^\d+$/.test(index || '') || !itemsFor(goal, stage)[Number(index)])) page = 'area';
  return { page, goal, stage, index: Number(index || 0) };
}
function navigate(page, stage, index) {
  const next = href(page, stage, index);
  if (location.hash === next) render(); else location.hash = next;
}
function shell() {
  const s=stats(state,state.goal),active=['area','detail'].includes(view.page)?(view.stage==='ads'?'library':'plan'):view.page;
  const nav=mobile=>navItems.map(([id,image,title])=>`<a href="${href(id)}" class="nav-link ${active===id?'active':''}" ${active===id?'aria-current="page"':''}>${icon(image)}<span>${mobile?({studio:'Nowa',home:'Kampanie',map:'Mapa',handoff:'Dla grafika'})[id]:title}</span>${!mobile&&id==='plan'?`<span class="nav-count">${s.done}</span>`:''}</a>`).join('');
  $('#sidebar').innerHTML=`<a class="brand prescot-brand" href="${href('studio')}" aria-label="Kampanie Prescot LED — przygotuj z AI"><img src="assets/prescot/logo.svg" width="196" height="28" alt="Prescot LED"><span class="brand-sub">Kampanie</span></a><div class="workspace-label">PRZESTRZEŃ MARKETINGU</div><nav>${nav(false)}</nav><details class="sidebar-tools"><summary>Narzędzia szczegółowe</summary><a href="${href('plan')}">Brief i zadania</a><a href="${href('library')}">Biblioteka formatów</a><a href="${href('report')}">Podsumowanie</a></details><div class="sidebar-progress"><span class="eyebrow">PRZYGOTOWANIE KAMPANII</span><div class="sidebar-progress-title"><strong>${s.done}<small> / ${s.total}</small></strong><span>zadań<br>gotowych</span></div>${progress(s)}<a href="${href('report')}">Otwórz podsumowanie ${icon('arrow')}</a></div><div class="sidebar-bottom"><span class="local-icon">${icon('shield')}</span><div><strong>Automatyczny zapis</strong><span data-save-label></span></div></div>`;
  $('#mobileNav').innerHTML=nav(true);
  $('#topbar').innerHTML=`<a href="${href('home')}" class="mobile-brand" aria-label="Prescot LED — moje kampanie"><img src="assets/prescot/logo.svg" alt="Prescot LED" width="154" height="23"></a><div class="campaign-switch"><span class="campaign-switch-icon">${icon('map')}</span><label><span>AKTYWNA KAMPANIA</span><select data-campaign-switch aria-label="Aktywna kampania">${workspace.campaigns.map(c=>`<option value="${c.id}" ${c.id===state.id?'selected':''}>${esc(c.brief.name||'Kampania bez nazwy')}</option>`).join('')}</select></label></div><div class="topbar-actions"><a class="guide-trigger" href="${href('guide','owner')}" aria-label="Poradnik kampanii">${icon('note')}<span>Poradnik</span></a><button class="search-trigger" data-action="search" aria-label="Szukaj w kampanii">${icon('search')}<span>Szukaj</span><kbd>⌘ K</kbd></button><button class="button dark top-plan" data-action="open-studio">${icon('plus')}<span>Przygotuj z AI</span></button></div>`;
  updateSaveLabel();
}

function goalSwitch(compact = false) {
  return `<div class="goal-options ${compact ? 'compact' : ''}" role="group" aria-label="Cel kampanii">${Object.entries(goalMeta).map(([id, goal]) => `<button class="goal-option ${id === state.goal ? 'selected' : ''}" data-action="goal" data-goal="${id}" aria-pressed="${id === state.goal}">${icon(goal.icon)}<span><strong>${goal.label}</strong>${compact ? '' : `<small>${goal.description}</small>`}</span><span class="goal-tick">${icon('check')}</span></button>`).join('')}</div>`;
}
function homeView() {
 return `<div class="home-view"><section class="home-campaigns"><div class="section-heading"><div><span class="eyebrow">TWOJA PRZESTRZEŃ</span><h2>Moje kampanie <span class="number-badge">${workspace.campaigns.length}</span></h2></div><div class="hero-actions"><button class="button secondary" data-action="new-campaign">Pusta mapa</button><button class="button primary" data-action="open-studio">Przygotuj z AI</button></div></div><div class="campaign-cards">${workspace.campaigns.map(c=>{const p=products[c.product],s=stats(c,c.goal);return `<button class="campaign-card ${c.id===state.id?'current':''}" data-action="open-campaign" data-id="${c.id}"><div class="campaign-card-image"><img src="${p.image}" alt="" loading="lazy"><span>${p.name}</span></div><div class="campaign-card-body"><span class="eyebrow">${goalMeta[c.goal].label}</span><h3>${esc(c.brief.name||'Kampania bez nazwy')}</h3><p>${esc(c.brief.audience||'Wybierz grupę odbiorców')}</p><div class="campaign-card-stats"><span>${s.done} z ${s.total} zadań gotowych</span><span class="campaign-open">Otwórz ${icon('arrow')}</span></div>${progress(s)}</div></button>`}).join('')}</div></section></div>`;
}

function mapView() {
 const p=products[state.product];
 return `<section class="map-heading"><div>${state.analysis?'<button class="text-link" data-action="open-analysis">Otwórz analizę i reklamy AI →</button>':''}<span class="eyebrow">${p.name} <span class="eyebrow-divider">/</span> ${goalMeta[state.goal].label}</span><h1>${esc(state.brief.name||'Mapa kampanii')}</h1><p>Połącz produkt, odbiorców i działania w jeden plan.</p></div><a class="button secondary" href="${href('report')}">${icon('chart')}<span>Podsumowanie</span></a></section><section id="flowMount" class="flow-editor" aria-label="Projektant ścieżki kampanii"></section><div class="map-stage-links"><span>CHECKLISTY</span>${stages.map(stage=>`<a href="${href('area',stage.id)}">${icon(stage.icon)}${stage.title}</a>`).join('')}</div>`;
}

function preview(item,big=false) {
 const p=products[state.product],campaign=content.campaigns[state.goal];
 const title=state.flow.nodes.find(n=>n.type==='creative')?.note?.trim()||p.title;
 if(item.formatId==='copy')return `<div class="copy-preview ${big?'large':''}"><span class="preview-label">ROBOCZY KIERUNEK PRZEKAZU</span><span class="quote-mark">“</span><p>${esc(title.slice(0,250))}</p><span class="preview-cta">${esc(campaign.cta)} ${icon('arrow')}</span></div>`;
 return `<div class="ad-preview prescot-ad ${big?'large':''} ${item.formatId==='reel916'?'vertical':''}"><img src="${p.image}" alt="Materiał poglądowy Prescot: ${p.name}" loading="lazy" decoding="async"><span class="ad-format">${esc(item.format)} · makieta</span><span class="ad-brand"><img src="assets/prescot/logo.svg" alt="Prescot LED" width="140" height="20"></span><div class="ad-copy"><span>${p.name}</span><strong>${esc(p.title)}</strong><small>${esc(campaign.cta)} ${icon('arrow')}</small></div></div>`;
}

function libraryView() {
  return `<section class="page-intro"><div><span class="eyebrow">OD POMYSŁU DO MATERIAŁU</span><h1>Reklamy z <span class="soft-text">dobrym powodem.</span></h1><p>Cztery formaty. Inny sposób na uwagę, ta sama spójna oferta.</p></div>${chip('play','orange')}</section><section class="library-handoff"><span class="stage-icon pink">${icon('play')}</span><div><h2>Przekaż grafikowi konkretne zadanie.</h2><p>Wybierz materiały z mapy, dopisz formaty i teksty, a potem pobierz brief.</p></div><a class="button primary" href="${href('handoff')}">Brief dla grafika ${icon('arrow')}</a></section>${goalSwitch(true)}<div class="library-grid">${itemsFor(state.goal,'ads').map((item,index) => `<a class="library-card" href="${href('detail','ads',index)}">${preview(item)}<div class="library-copy"><span class="eyebrow">FORMAT ${item.format}</span><h2>${esc(item.title)} ${icon('arrow')}</h2><p>${esc(item.question)}</p></div></a>`).join('')}</div><div class="info-note">${icon('note')}<p>To przykładowe makiety reklam, także dla formatów wideo. Otwórz kartę, przygotuj scenariusz i skopiuj polecenie do AI z kontekstem swojej marki.</p></div>`;
}
function areaView() {
  const stage=stages.find(s=>s.id===view.stage);const s=stats(state,state.goal,stage.id);
  const intro=content.areaIntros[state.goal+'.'+stage.id]?.intro || stage.description;
  return `<a href="${href('map')}" class="back-link">${icon('back')} Cała mapa kampanii</a><section class="page-intro area-heading"><div>${chip(stage.icon,stage.color)}<span class="eyebrow">OBSZAR ${String(stages.indexOf(stage)+1).padStart(2,'0')} / 07</span><h1>${titleFor(state.goal,stage.id)}</h1><p>${stage.description}</p></div><div class="area-progress"><strong>${s.done}<span> / ${s.total}</span></strong><span>punktów gotowych</span>${progress(s)}</div></section><details class="area-context"><summary>${icon('note')} Dlaczego ten etap ma znaczenie? ${icon('chevronDown')}</summary><div>${intro.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join('')}</div></details><div class="area-cards">${itemsFor(state.goal,stage.id).map((item,index)=> {const value=taskState(state,state.goal,`${stage.id}:${index}`);return `<a class="area-card" href="${href('detail',stage.id,index)}"><span class="area-card-number">${String(index+1).padStart(2,'0')}</span><div><span class="status-pill ${value.status}"><i></i>${statuses[value.status]}</span><h2>${esc(item.title)}</h2><p>${esc(item.question)}</p></div><span class="round-arrow">${icon('arrow')}</span></a>`}).join('')}</div>`;
}
function detailView() {
  const stage=stages.find(s=>s.id===view.stage);const item=itemsFor(state.goal,view.stage)[view.index];const value=taskState(state,state.goal,`${view.stage}:${view.index}`);
  const index=tasksFor(state.goal).findIndex(t=>t.stage===view.stage&&t.index===view.index);const next=tasksFor(state.goal)[index+1];
  return `<a href="${href('area',view.stage)}" class="back-link">${icon('back')} ${titleFor(state.goal,view.stage)}</a><div class="detail-layout"><article class="detail-main"><span class="eyebrow">${titleFor(state.goal,view.stage)} <span class="eyebrow-divider">/</span> PUNKT ${view.index+1} Z ${itemsFor(state.goal,view.stage).length}</span><h1>${esc(item.title)}</h1><p class="detail-lead">${esc(item.question)}</p><button class="button secondary mobile-note-link" data-action="jump-note">${icon('note')} Przejdź do swoich ustaleń</button>${view.stage==='ads'?preview(item,true):''}<div class="detail-explanation">${item.purpose.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="insight-block ai-block"><div class="insight-heading">${chip('sparkle','violet')}<div><span class="eyebrow">DOBRZE WYKORZYSTANA POMOC</span><h2>Co przygotujesz z AI</h2></div></div><ul>${item.ai.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div><div class="insight-block"><div class="insight-heading">${chip('check','teal')}<div><span class="eyebrow">TWOJA WIEDZA O FIRMIE</span><h2>Co zostaje po Twojej stronie</h2></div></div><ul>${item.human.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div><section class="prompt-section"><div><span class="eyebrow">ZABIERZ KONTEKST ZE SOBĄ</span><h2>Gotowe polecenie do AI</h2><p>Uwzględnia Twój brief i notatkę. Skopiuj je do wybranego narzędzia.</p></div>${button(icon('copy')+' Skopiuj polecenie','copy-prompt',true)}<details><summary>Pokaż treść polecenia ${icon('chevronDown')}</summary><pre id="promptPreview">${esc(promptFor(state,state.goal,view.stage,view.index))}</pre></details></section><div class="detail-next">${next?`<a class="button secondary" href="${href('detail',next.stage,next.index)}"><span>Następny punkt: ${esc(next.title)}</span>${icon('arrow')}</a>`:`<a class="button primary" href="${href('plan')}">Przejrzyj cały plan ${icon('arrow')}</a>`}</div></article><aside class="task-sidebar"><div class="task-panel"><span class="eyebrow">ZAMIEŃ WIEDZĘ W DZIAŁANIE</span><h2>Twój punkt planu</h2><p>Oznacz postęp po przygotowaniu i sprawdzeniu tego elementu.</p><label class="field-label" for="taskStatus">Status zadania</label><select id="taskStatus" data-task-status>${Object.entries(statuses).map(([key,label])=>`<option value="${key}" ${value.status===key?'selected':''}>${label}</option>`).join('')}</select><label class="field-label" for="taskNote">Ustalenia i notatki</label><textarea id="taskNote" data-task-note maxlength="8000" rows="8" placeholder="Co ustalasz dla swojej kampanii? Linki, pomysły, rzeczy do sprawdzenia…">${esc(value.note)}</textarea><span class="save-label" data-save-label></span><button class="button ${value.status==='done'?'secondary':'primary'} full" data-action="toggle-done">${icon('check')} ${value.status==='done'?'Oznacz jako do zrobienia':'Oznacz jako gotowe'}</button></div><div class="brief-reminder">${icon('plan')}<h3>${state.brief.name?'Pracujesz nad: '+esc(state.brief.name):'Dobry brief robi różnicę.'}</h3><p>${state.brief.offer?'Ustalenia z briefu trafiają do poleceń do AI.':'Opisz swoją ofertę i odbiorców, żeby polecenia pasowały do Twojego projektu.'}</p><a class="text-link" href="${href('plan')}">${state.brief.offer?'Edytuj brief':'Uzupełnij brief'} ${icon('arrow')}</a></div></aside></div>`;
}
function checklist() {
  let any=false;
  const html=stages.map(stage=> {
    const tasks=itemsFor(state.goal,stage.id).map((item,index)=>({...item,index,key:`${stage.id}:${index}`})).filter(item=>filter==='all'||taskState(state,state.goal,item.key).status===filter);
    if(!tasks.length)return '';any=true;
    return `<section class="checklist-group"><h3>${chip(stage.icon,stage.color)}${titleFor(state.goal,stage.id)}<span>${stats(state,state.goal,stage.id).done}/${itemsFor(state.goal,stage.id).length}</span></h3>${tasks.map(item=>{const value=taskState(state,state.goal,item.key);return `<div class="checklist-row ${value.status}"><input type="checkbox" class="task-checkbox" data-check-task="${item.key}" ${value.status==='done'?'checked':''} aria-label="Gotowe: ${esc(item.title)}"><a href="${href('detail',stage.id,item.index)}"><strong>${esc(item.title)}</strong><small>${value.note?icon('note')+' Masz notatkę':esc(item.question)}</small></a><span class="status-pill ${value.status}"><i></i>${statuses[value.status]}</span><a class="row-arrow" href="${href('detail',stage.id,item.index)}" aria-label="Otwórz: ${esc(item.title)}">${icon('chevron')}</a></div>`}).join('')}</section>`;
  }).join('');
  return any?html:`<div class="empty-state">${icon('check')}<h3>Tu jeszcze nie ma zadań.</h3><p>Zmień filtr lub oznacz status w wybranym punkcie.</p><button class="button secondary" data-action="filter" data-filter="all">Pokaż wszystkie</button></div>`;
}
function planView() {
  const s=stats(state,state.goal);
  return `<section class="page-intro plan-intro"><div><span class="eyebrow">TWOJE DECYZJE W JEDNYM MIEJSCU</span><h1>Mniej chaosu.<br><span class="soft-text">Więcej konkretów.</span></h1><p>Uzupełnij brief, odhaczaj zadania i wracaj do zapisanych ustaleń.</p></div><button class="button primary" data-action="export">${icon('download')} Pobierz plan</button></section><section class="brief-card"><div class="brief-card-header"><div>${chip('plan','teal')}<span><h2>Brief Twojej kampanii</h2><p>Kontekst wspólny dla wszystkich celów i poleceń do AI.</p></span></div><span class="save-label" data-save-label></span></div><div class="brief-fields">${Object.entries(briefFields).map(([key,label])=>`<label>${label}${key==='offer'||key==='audience'||key==='advantage'?`<textarea data-brief="${key}" maxlength="2000" rows="2" placeholder="${({offer:'np. oświetlenie LED do projektów wnętrz',audience:'np. architekci i instalatorzy szukający kompletnych rozwiązań',advantage:'np. pomoc w doborze zestawu i dokumentacja techniczna'})[key]}">${esc(state.brief[key])}</textarea>`:`<input data-brief="${key}" maxlength="2000" value="${esc(state.brief[key])}" placeholder="${({name:'np. PRESCOT · kampania jesienna',channel:'np. Google, Meta, email',budget:'np. wrzesień, budżet do ustalenia'})[key]}">`}</label>`).join('')}</div></section><section class="plan-checklist"><div class="section-heading"><div><span class="eyebrow">TWÓJ PLAN PRZYGOTOWAŃ</span><h2>Co jest już gotowe?</h2></div><div class="plan-count"><strong data-plan-done>${s.done}</strong> / ${s.total} punktów</div></div>${goalSwitch(true)}<div class="plan-progress" id="planProgress">${progress(s)}</div><div class="filter-tabs" role="group" aria-label="Filtr statusu">${[['all','Wszystkie'],...Object.entries(statuses)].map(([key,label])=>`<button data-action="filter" data-filter="${key}" class="${filter===key?'active':''}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div><div id="checklist">${checklist()}</div></section><section class="backup-panel"><div>${icon('shield')}<span><h3>Przenieś plan lub zachowaj kopię.</h3><p>Kopia JSON zawiera wszystkie kampanie, mapy, briefy i notatki. Możesz wczytać także wcześniejszy plan Rentgen Studio.</p></span></div><div class="backup-actions">${button(icon('download')+' Kopia JSON','backup')}${button(icon('upload')+' Wczytaj kopię','import')}</div></section>`;
}
function render({ keepScroll=false }={}) {
  flowEditor?.destroy();flowEditor=null;
  view=readView();
  if(state.goal!==view.goal) {changeGoal(view.goal);save();}
  shell();
  main.innerHTML=({studio:studioView,home:homeView,map:mapView,library:libraryView,area:areaView,detail:detailView,plan:planView,report:reportView,guide:()=>guideView(state.goal,view.stage),handoff:()=>handoffView(state,{mode:handoffMode,focusId:view.stage})})[view.page]();
  main.dataset.view=view.page;main.dataset.goal=state.goal;document.title=`${view.page==='detail'?itemsFor(state.goal,view.stage)[view.index].title:'Kampanie Prescot LED'} — ${state.brief.name||'Plan kampanii'}`;
  updateSaveLabel();
  if(!keepScroll) {window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
  if(view.page==='map')flowEditor=new FlowEditor($('#flowMount'),state,{save,notify,review:showReview,exportMap});
  if(pendingFlowNode&&flowEditor){const id=pendingFlowNode;pendingFlowNode=null;requestAnimationFrame(()=>focusFlowNode(id));}
}

function setTask(key, patch) {
  state.tasks[state.goal] ||= {};
  state.tasks[state.goal][key]={...taskState(state,state.goal,key),...patch};
  save();
}
function refreshPlan() {
  shell();$('#checklist').innerHTML=checklist();
  const s=stats(state,state.goal);$('[data-plan-done]').textContent=s.done;$('#planProgress').innerHTML=progress(s);updateSaveLabel();
}
function exportFile(filename,text,type) {
  const url=URL.createObjectURL(new Blob([text],{type}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function searchResults() {
  const term=$('#searchInput').value.trim().toLocaleLowerCase('pl-PL');
  const results=tasksFor(state.goal).filter(item=>`${item.title} ${item.question} ${item.purpose}`.toLocaleLowerCase('pl-PL').includes(term));
  $('#searchResults').innerHTML=results.length?`<p class="result-count">${results.length} punktów · ${goalMeta[state.goal].label}</p>${results.map(item=>`<a href="${href('detail',item.stage,item.index)}" class="search-result">${chip(stages.find(s=>s.id===item.stage).icon,stages.find(s=>s.id===item.stage).color)}<span><small>${titleFor(state.goal,item.stage)}</small><strong>${esc(item.title)}</strong></span>${icon('chevron')}</a>`).join('')}`:`<div class="empty-state"><h3>Nie ma takiego punktu.</h3><p>Spróbuj krótszej frazy, np. „strona” lub „reklama”.</p></div>`;
}
async function copyPrompt() {
  const text=promptFor(state,state.goal,view.stage,view.index);
  try {await navigator.clipboard.writeText(text);notify('Polecenie skopiowane. Wklej je do swojego narzędzia AI.');}
  catch {const el=$('#promptPreview');el.parentElement.open=true;el.setAttribute('tabindex','0');el.focus();const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(el);selection.addRange(range);notify('Zaznaczono polecenie. Skopiuj je skrótem ⌘C lub Ctrl+C.');}
}
async function copyFeedback(){
 try{await navigator.clipboard.writeText(feedbackTemplate);notify('Skopiowano wzór uwag do projektu.');}
 catch{const el=$('#feedbackTemplate');if(!el)return;const range=document.createRange();range.selectNodeContents(el);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);notify('Zaznaczono wzór uwag. Skopiuj go skrótem ⌘C lub Ctrl+C.');}
}
function editProduction(field){
 const common=field.dataset.handoffField,key=field.dataset.designField;
 if(common&&Object.hasOwn(handoffFields,common)){state.handoff||=cleanHandoff(null);state.handoff[common]=field.value.slice(0,handoffFields[common].max);save();refreshHandoff(state);}
 if(key&&(key==='include'||Object.hasOwn(designFields,key))){const node=state.flow.nodes.find(n=>n.id===field.dataset.designNode&&n.type==='creative');if(!node)return;node.design||=cleanDesign(null);node.design[key]=key==='include'?field.checked:field.value.slice(0,designFields[key].max);save();refreshHandoff(state);}
}
function focusFlowNode(id){
 if(!flowEditor)return;const n=flowEditor.node(id);if(!n)return;
 flowEditor.select(id);flowEditor.v.zoom=1;flowEditor.v.x=flowEditor.viewport.clientWidth/2-n.x-114;flowEditor.v.y=flowEditor.viewport.clientHeight/2-n.y-77;flowEditor.transform();flowEditor.commit();
}
function switchCampaign(id, page='map') {
 const selected=workspace.campaigns.find(c=>c.id===id);if(!selected)return;
 workspace.activeCampaignId=id;state=selected;filter='all';handoffMode='edit';save();history.replaceState(null,'',href(page));render();
}
function openCampaignDialog(product='strips') {
 const dialog=$('#campaignDialog');
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">NOWY PROJEKT</span><h2>Zaplanuj kampanię.</h2></div><button class="icon-button" data-action="close-dialog" aria-label="Zamknij nową kampanię">${icon('close')}</button></div><p>Wybierz punkt startowy. Produkty, odbiorców i połączenia zmienisz na mapie.</p><form id="campaignForm"><label>Nazwa kampanii<input name="name" maxlength="120" required placeholder="np. Taśmy COB · projekty wnętrz" value="${esc(products[product]?.name||'Taśmy LED')} · nowa kampania"></label><fieldset><legend>Co promujemy?</legend><div class="campaign-product-options">${Object.entries(products).map(([id,p])=>`<label><input type="radio" name="product" value="${id}" ${id===(products[product]?product:'strips')?'checked':''}><span>${icon(p.icon)}${p.name}</span></label>`).join('')}</div></fieldset><label>Cel kampanii<select name="goal">${Object.entries(goalMeta).map(([id,g])=>`<option value="${id}" ${id==='lead'?'selected':''}>${g.label}</option>`).join('')}</select></label><div class="dialog-actions"><button type="button" class="button secondary" data-action="close-dialog">Anuluj</button><button class="button primary" type="submit">Utwórz mapę ${icon('arrow')}</button></div></form>`;
 dialog.showModal();dialog.querySelector('[name="name"]').select();
}
function campaignMarkdown() {
 return markdownFor(state,state.goal)+`\n## Mapa kampanii\n\n`+state.flow.nodes.map(n=>`### ${n.title}\nRodzaj: ${nodeTypes[n.type].label} · ${statuses[n.status]}\nOsoba: ${n.owner||'Do ustalenia'} · Termin: ${n.due||'Do ustalenia'}\n\n${n.note||'Do uzupełnienia'}\n\nDalej: ${state.flow.edges.filter(e=>e.from===n.id).map(e=>state.flow.nodes.find(node=>node.id===e.to)?.title).join(', ')||'Koniec ścieżki'}\n`).join('\n');
}
function exportMap(){exportFile('prescot-mapa-kampanii.svg',flowSVG(state),'image/svg+xml;charset=utf-8');notify('Mapa SVG gotowa do pobrania. Możesz ją otworzyć lub wkleić do prezentacji.');}
function showReview(){
 const issues=reviewFlow(state),dialog=$('#reviewDialog');
 dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">PRZEGLĄD PRZYGOTOWAŃ</span><h2>${issues.length?'Co jeszcze dopracować?':'Plan uporządkowany.'}</h2></div><button class="icon-button" data-action="close-dialog" aria-label="Zamknij przegląd">${icon('close')}</button></div><p>Sprawdzamy strukturę mapy, uzupełnienie ustaleń i statusy. Treść reklam i parametry produktów pozostają do oceny zespołu.</p><div class="review-items">${issues.length?issues.map(item=>item.id?`<button data-action="review-node" data-id="${item.id}">${icon('note')}<span>${esc(item.text)}</span>${icon('arrow')}</button>`:item.brief?`<a href="${href('plan')}" data-dismiss-review>${icon('plan')}<span>${esc(item.text)}</span>${icon('arrow')}</a>`:`<div>${icon('clock')}<span>${esc(item.text)}</span></div>`).join(''):`<div>${icon('check')}<span>Etapy są połączone i oznaczone jako gotowe. Możesz przejść do przeglądu materiałów z zespołem.</span></div>`}</div><div class="dialog-actions"><button class="button primary" data-action="close-dialog">Wróć do pracy</button></div>`;
 dialog.showModal();
}
function reportView(){
 const s=stats(state,state.goal),done=state.flow.nodes.filter(n=>n.status==='done').length,issues=reviewFlow(state),p=products[state.product];
 return `<section class="report-heading"><div><span class="eyebrow">PRESCOT LED / PLAN DO OMÓWIENIA</span><h1>${esc(state.brief.name||'Podsumowanie kampanii')}</h1><p>Oferta, kierunek i plan działań w jednym widoku.</p></div><div class="report-actions"><button class="button secondary" data-action="export-map">${icon('download')} Mapa SVG</button><button class="button primary" data-action="print-report">${icon('print')} Drukuj / PDF</button></div></section><div class="report-kpis"><article><span>CEL KAMPANII</span><strong>${goalMeta[state.goal].label}</strong><small>${p.name}</small></article><article><span>ETAPY PRZYGOTOWANE</span><strong>${done}<small> / ${state.flow.nodes.length}</small></strong><small>Statusy nadane przez zespół</small></article><article><span>ZADANIA GOTOWE</span><strong>${s.done}<small> / ${s.total}</small></strong><small>Checklista przygotowań</small></article><article><span>BUDŻET I TERMIN</span><strong class="report-budget">${esc(state.brief.budget||'Do ustalenia')}</strong><a href="${href('plan')}">Edytuj brief ${icon('arrow')}</a></article></div><div class="report-brief"><section><span class="eyebrow">OFERTA</span><h2>Co promujemy?</h2><p>${esc(state.brief.offer||'Uzupełnij ofertę w briefie.')}</p></section><section><span class="eyebrow">ODBIORCY</span><h2>Do kogo mówimy?</h2><p>${esc(state.brief.audience||'Uzupełnij odbiorców w briefie.')}</p></section><section><span class="eyebrow">WYRÓŻNIK</span><h2>Dlaczego Prescot?</h2><p>${esc(state.brief.advantage||'Zapisz konkretny wyróżnik i potwierdź go w ofercie.')}</p></section></div><section class="report-map"><div class="section-heading"><h2>Ścieżka kampanii</h2><a class="text-link" href="${href('map')}">Edytuj mapę ${icon('arrow')}</a></div>${flowSVG(state)}</section><section class="report-stages"><div class="section-heading"><h2>Plan działań</h2><button class="text-link" data-action="review">Sprawdź przygotowanie ${icon('check')}</button></div>${state.flow.nodes.map(n=>`<article><span class="stage-icon ${nodeTypes[n.type].color}">${icon(nodeTypes[n.type].icon)}</span><div><span class="eyebrow">${nodeTypes[n.type].label}</span><h3>${esc(n.title)}</h3><p>${esc(n.note||'Ustalenia do uzupełnienia')}</p><small>${esc(n.owner||'Osoba do ustalenia')} · ${esc(n.due||'Termin do ustalenia')}</small></div><span class="status-pill ${n.status}">${statuses[n.status]}</span></article>`).join('')}</section><section class="report-next"><div>${icon('note')}<span><h3>${issues.length?'Ustalenia przed startem':'Etapy uporządkowane'}</h3><p>${issues.length?`${issues.length} punktów do omówienia w przeglądzie przygotowań.`:'Przejrzyj materiały i zgodność z ofertą razem z zespołem.'}</p></span></div><button class="button secondary" data-action="review">Otwórz przegląd ${icon('arrow')}</button></section><p class="report-disclaimer">To plan kampanii. Wyniki reklam uzupełnisz w ustaleniach etapu pomiaru po ich uruchomieniu. Dane reklamowe nie są pobierane automatycznie.</p>`;
}
document.addEventListener('submit',event=>{
 if(event.target.id!=='campaignForm')return;event.preventDefault();
 if(workspace.campaigns.length>=60){notify('Przestrzeń mieści 60 kampanii. Pobierz kopię, zanim przygotujesz kolejne.');return;}
 const data=new FormData(event.target),name=String(data.get('name')).trim();if(!name){event.target.elements.name.focus();return;}
 const campaign=createCampaign(data.get('product'),name,data.get('goal'));workspace.campaigns.push(campaign);$('#campaignDialog').close();switchCampaign(campaign.id);notify('Nowa kampania gotowa do pracy. Dopasuj etapy do swojego planu.');
});
document.addEventListener('click',event=>{if(event.target.closest('[data-dismiss-review]'))$('#reviewDialog').close();});
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]');
  if(event.target.closest('.search-result'))$('#searchDialog').close();
  if(event.target.closest('.skip-link')) {event.preventDefault();main.focus();return;}
  if(!action)return;
  switch(action.dataset.action) {
    case 'handoff-mode': handoffMode=action.dataset.mode==='preview'?'preview':'edit';render();break;
    case 'download-handoff': {if(!selectedCreatives(state).length){notify('Wybierz kreację do przekazania.');break;}const filename=(state.brief.name||'kampania').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'kampania';exportFile(`prescot-brief-${filename}.html`,handoffHTML(state),'text/html;charset=utf-8');notify('Brief HTML gotowy do pobrania. Dołącz dostęp do folderu z materiałami.');break;}
    case 'print-handoff': if(selectedCreatives(state).length){handoffMode='preview';render();requestAnimationFrame(()=>window.print());}break;
    case 'open-creative': pendingFlowNode=action.dataset.id;handoffMode='edit';navigate('map');break;
    case 'copy-feedback': void copyFeedback();break;
    case 'open-studio': navigate('studio');break;
    case 'open-analysis': if(state.analysis){showAnalysis(state.analysis);navigate('studio');}break;
    case 'new-campaign': openCampaignDialog(action.dataset.product);break;
    case 'open-campaign': switchCampaign(action.dataset.id);break;
    case 'close-dialog': action.closest('dialog').close();break;
    case 'review': showReview();break;
    case 'export-map': exportMap();break;
    case 'print-report': window.print();break;
    case 'review-node': {const id=action.dataset.id;$('#reviewDialog').close();if(view.page==='map')focusFlowNode(id);else{pendingFlowNode=id;navigate('map');}break;}
    case 'copy-flow-prompt': {const field=$('#promptDialog textarea');navigator.clipboard.writeText(field.value).then(()=>notify('Polecenie skopiowane. Wklej je do swojego narzędzia AI.')).catch(()=>{field.focus();field.select();notify('Zaznaczono polecenie. Skopiuj je skrótem ⌘C lub Ctrl+C.');});break;}

    case 'goal': {const goal=action.dataset.goal;if(!Object.hasOwn(goalMeta,goal))return;changeGoal(goal);save();navigate(view.page==='detail'?'area':view.page,view.stage);break;}
    case 'search': searchResults();$('#searchDialog').showModal();$('#searchInput').focus();break;
    case 'close-search': $('#searchDialog').close();break;
    case 'copy-prompt': void copyPrompt();break;
    case 'jump-note': $('#taskNote').scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#taskNote').focus({preventScroll:true});break;
    case 'toggle-done': {const key=`${view.stage}:${view.index}`;setTask(key,{status:taskState(state,state.goal,key).status==='done'?'todo':'done'});render({keepScroll:true});$('[data-action="toggle-done"]').focus({preventScroll:true});break;}
    case 'filter': filter=action.dataset.filter;document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('active',el.dataset.filter===filter);el.setAttribute('aria-pressed',String(el.dataset.filter===filter));});$('#checklist').innerHTML=checklist();break;
    case 'export': exportFile(`prescot-kampania-${state.goal}.md`,campaignMarkdown(),'text/markdown;charset=utf-8');notify('Plan kampanii został przygotowany do pobrania.');break;
    case 'backup': exportFile('prescot-kampanie-kopia.json',JSON.stringify(workspace,null,2),'application/json');break;
    case 'import': $('#importFile').click();break;
    case 'cancel-import': pendingImport=null;$('#importDialog').close();break;
    case 'confirm-import': if(pendingImport){workspace=pendingImport;state=workspace.campaigns.find(c=>c.id===workspace.activeCampaignId);pendingImport=null;save();$('#importDialog').close();location.hash=href('plan');render();notify('Wczytano kampanie, mapy i ustalenia z kopii.');}break;
  }
});
document.addEventListener('input',event=>{
  const field=event.target;
  if(field.matches('[data-handoff-field],[data-design-field]'))editProduction(field);
  if(field.matches('[data-brief]')) {state.brief[field.dataset.brief]=field.value;save();}
  if(field.matches('[data-task-note]')) {setTask(`${view.stage}:${view.index}`,{note:field.value});$('#promptPreview').textContent=promptFor(state,state.goal,view.stage,view.index);}
  if(field.id==='searchInput')searchResults();
});
document.addEventListener('change',async event=>{
  const field=event.target;
  if(field.name==='product'&&field.closest('#campaignForm')){const name=$('#campaignForm [name="name"]');if(Object.values(products).some(p=>name.value===`${p.name} · nowa kampania`))name.value=`${products[field.value].name} · nowa kampania`;}
  if(field.matches('[data-campaign-switch]'))switchCampaign(field.value);
  if(field.matches('[data-task-status]')) {setTask(`${view.stage}:${view.index}`,{status:field.value});shell();const btn=$('[data-action="toggle-done"]');btn.innerHTML=icon('check')+(field.value==='done'?' Oznacz jako do zrobienia':' Oznacz jako gotowe');btn.className=`button ${field.value==='done'?'secondary':'primary'} full`;updateSaveLabel();}
  if(field.matches('[data-brief="name"]')){const option=$('[data-campaign-switch] option:checked');if(option)option.textContent=state.brief.name||'Kampania bez nazwy';}
  if(field.matches('[data-check-task]')) {const key=field.dataset.checkTask;setTask(key,{status:field.checked?'done':'todo'});refreshPlan();$(`[data-check-task="${key}"]`)?.focus({preventScroll:true});}
  if(field.id==='importFile'&&field.files[0]) {
    try {const file=field.files[0];if(file.size>10000000)throw Error('Plik jest zbyt duży.');const raw=JSON.parse(await file.text());pendingImport=importWorkspace(raw);$('#importDialog').showModal();}
    catch(error){pendingImport=null;notify(error.message==='Plik jest zbyt duży.'?error.message:'Nie udało się wczytać pliku. Wybierz poprawną kopię JSON Kampanii Prescot LED lub Rentgen Studio.');}
    finally{field.value='';}
  }
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const dialog=document.querySelector('dialog[open]');if(dialog){event.preventDefault();dialog.close();return;}}if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!$('#searchDialog').open){searchResults();$('#searchDialog').showModal();}$('#searchInput').focus();}});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
window.addEventListener('hashchange',()=>render());

initStudio({notify,save(campaign){if(workspace.campaigns.length>=60)throw Error('Przestrzeń mieści 60 kampanii. Pobierz kopię przed dodaniem kolejnej.');workspace.campaigns.push(campaign);save();return campaign.id;},open:(id,page)=>switchCampaign(id,page)});
render();
