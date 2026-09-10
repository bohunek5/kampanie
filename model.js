import { content } from './content.js';
export const STORAGE_KEY = 'rentgen.studio.v1';
export const goalMeta = {
  purchase: { label: 'Sprzedaż produktu', short: 'Sprzedaż', icon: 'bag', description: 'Od pierwszego kliknięcia do zakupu.' },
  lead: { label: 'Zapytania ofertowe', short: 'Zapytania', icon: 'message', description: 'Od zainteresowania do rozmowy.' },
  appointment: { label: 'Konsultacje projektowe', short: 'Konsultacje', icon: 'calendar', description: 'Od pomysłu do doboru rozwiązania LED.' },
  signup: { label: 'Pobrania materiału', short: 'Pobrania', icon: 'download', description: 'Od reklamy do katalogu lub poradnika.' },
};
export const stages = [
  { id: 'offer', title: 'Oferta i klient', icon: 'diamond', color: 'amber', description: 'Dla kogo, z jaką korzyścią i dlaczego właśnie Ty.' },
  { id: 'ads', title: 'Reklama i formaty', icon: 'play', color: 'orange', description: 'Zatrzymaj uwagę i daj dobry powód do kliknięcia.' },
  { id: 'page', title: 'Strona docelowa', icon: 'layout', color: 'teal', description: 'Połącz obietnicę reklamy z konkretną ofertą.' },
  { id: 'action', title: 'Działanie klienta', icon: 'cursor', color: 'violet', description: 'Ułatw wykonanie najważniejszego kroku.' },
  { id: 'confirm', title: 'Potwierdzenie', icon: 'check', color: 'green', description: 'Pokaż, co już się udało i co wydarzy się dalej.' },
  { id: 'recovery', title: 'Przypomnienie', icon: 'return', color: 'pink', description: 'Pomóż wrócić osobom, które jeszcze się wahają.' },
  { id: 'measure', title: 'Pomiar i poprawki', icon: 'chart', color: 'blue', description: 'Sprawdź, gdzie tracisz klientów i co poprawić.' },
];
export const statuses = { todo: 'Do zrobienia', doing: 'W trakcie', done: 'Gotowe' };
export const briefFields = { name: 'Nazwa kampanii', offer: 'Co oferujesz?', audience: 'Do kogo kierujesz ofertę?', advantage: 'Co wyróżnia Twoją ofertę?', channel: 'Gdzie chcesz prowadzić kampanię?', budget: 'Budżet i ramy czasowe' };
export function itemsFor(goal, stage) {
  if (stage === 'offer') return content.offerDecisions[goal];
  if (stage === 'ads') return Object.entries(content.materialCopy[goal]).map(([id, item]) => ({ ...item, formatId: id, ...content.materials[id] }));
  if (stage === 'measure') return content.measurements[goal];
  return content.systemBranchItems[goal][stage];
}
export function titleFor(goal, stage) { return content.goals[goal]?.[stage] || stages.find(s => s.id === stage)?.title; }
export function tasksFor(goal) {
  return stages.flatMap(stage => itemsFor(goal, stage.id).map((item, index) => ({ ...item, stage: stage.id, index, key: `${stage.id}:${index}` })));
}
export function cleanState(raw) {
  const clean = { version: 1, goal: 'purchase', brief: {}, tasks: {}, updatedAt: null };
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return clean;
  if (Object.hasOwn(goalMeta, raw.goal)) clean.goal = raw.goal;
  for (const key of Object.keys(briefFields)) {
    if (typeof raw.brief?.[key] === 'string') clean.brief[key] = raw.brief[key].slice(0, 2000);
  }
  for (const goal of Object.keys(goalMeta)) {
    clean.tasks[goal] = {};
    for (const task of tasksFor(goal)) {
      const value = raw.tasks?.[goal]?.[task.key];
      if (!value || typeof value !== 'object') continue;
      clean.tasks[goal][task.key] = {
        status: Object.hasOwn(statuses, value.status) ? value.status : 'todo',
        note: typeof value.note === 'string' ? value.note.slice(0, 8000) : '',
      };
    }
  }
  if (typeof raw.updatedAt === 'string' && Number.isFinite(Date.parse(raw.updatedAt))) clean.updatedAt = raw.updatedAt;
  return clean;
}
export function taskState(state, goal, key) { return state.tasks[goal]?.[key] || { status: 'todo', note: '' }; }
export function stats(state, goal, stage) {
  const tasks = tasksFor(goal).filter(t => !stage || t.stage === stage);
  const done = tasks.filter(t => taskState(state, goal, t.key).status === 'done').length;
  const doing = tasks.filter(t => taskState(state, goal, t.key).status === 'doing').length;
  return { done, doing, total: tasks.length, percent: Math.round(done / tasks.length * 100) };
}
export function promptFor(state, goal, stage, index) {
  const item = itemsFor(goal, stage)[index];
  const brief = Object.entries(briefFields).map(([key, label]) => `${label}: ${state.brief[key]?.trim() || '[uzupełnij]'}`).join('\n');
  const note = taskState(state, goal, `${stage}:${index}`).note;
  return `Pomóż mi przygotować element kampanii: ${item.title}.\nCel kampanii: ${goalMeta[goal].label}.\n\nBRIEF\n${brief}\n\nZADANIE\n${item.question}\n${item.ai.map((text, i) => `${i + 1}. ${text}`).join('\n')}\n${note ? `\nMOJE USTALENIA\n${note}\n` : ''}\nPrzygotuj konkretny materiał do dalszej pracy. Nie dopisuj faktów, cen, wyników ani obietnic, których nie podaję. Wypisz brakujące informacje i oznacz założenia. Na końcu dodaj krótką listę rzeczy do sprawdzenia przed publikacją.`;
}
export function markdownFor(state, goal) {
  const s = stats(state, goal);
  const sections = stages.map(stage => `## ${titleFor(goal, stage.id)}\n\n` + itemsFor(goal, stage.id).map((item, index) => {
    const value = taskState(state, goal, `${stage.id}:${index}`);
    return `- [${value.status === 'done' ? 'x' : ' '}] ${item.title} — ${statuses[value.status]}\n  ${item.question}${value.note ? '\n\n  Notatka: ' + value.note.replace(/\n/g, '\n  ') : ''}`;
  }).join('\n\n')).join('\n\n');
  return `# ${state.brief.name?.trim() || 'Mój plan kampanii'}\n\nCel: ${goalMeta[goal].label}\nPostęp: ${s.done}/${s.total} punktów\nData eksportu: ${new Date().toLocaleDateString('pl-PL')}\n\n## Brief\n\n${Object.entries(briefFields).map(([key, label]) => `**${label}**\n${state.brief[key]?.trim() || 'Do uzupełnienia'}`).join('\n\n')}\n\n${sections}\n\n---\nKampanie Prescot LED · plan na podstawie własnych ustaleń.\n`;
}
export { content };
