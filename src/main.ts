import './styles.css';
import { appView } from './components/appView';

type Player = { number: string; name: string; injured?: boolean; heightCm?: number; weightKg?: number; age?: number; position?: string };
type Choice = { icon: string; label: string };
type Team = 'Local' | 'Visitante';
type Match = { id: number; competition: string; home: string; away: string; date: string; time: string; venue: string; status: 'Pendiente' | 'En juego' | 'Finalizado'; timerElapsedMs?: number; timerRunning?: boolean; timerStartedAt?: number; squad?: Player[]; opponents?: Player[] };
type MatchEvent = {
  action: string;
  team: Team;
  attackingTeam?: Team;
  defendingTeam?: Team;
  defenseOutcome?: 'success' | 'failure';
  player: string;
  shooter?: string;
  keeper?: string;
  isPenalty?: boolean;
  isCounterattack?: boolean;
  attackPhase?: 'contraataque' | 'posicional' | 'segunda_oleada';
  duelDirection?: 'izquierda' | 'derecha';
  duelSuccess?: boolean;
  target?: string;
  position?: { x: number; y: number };
  time: string;
};
type GeneralPlayerStat = { goals: number; assists: number; freeThrows: number; twoMin: number; yellow: number; red: number; steals: number; blocks: number; losses: number };
type GeneralPlayerSortKey = 'name' | keyof GeneralPlayerStat;
type SpatialMapMode = 'effectiveness' | 'frequency' | 'points';

let homePlayers: Player[] = [
  { number: '3', name: 'Álex Moreno' }, { number: '5', name: 'Diego Torres' },
  { number: '7', name: 'Hugo Pérez' }, { number: '9', name: 'Marc García' },
  { number: '11', name: 'Javier Rubio' }, { number: '14', name: 'Carlos Martín' },
  { number: '17', name: 'Iván Sánchez' }, { number: '22', name: 'Pablo Vega' },
  { number: '24', name: 'Adrián López' }, { number: '32', name: 'Sergio Ramos' },
];
let awayPlayers: Player[] = [
  { number: '2', name: 'Tomás Ruiz' }, { number: '4', name: 'Manuel Ortega' },
  { number: '6', name: 'Lucas Herrera' }, { number: '8', name: 'David Romero' },
  { number: '10', name: 'Álvaro Castro' }, { number: '13', name: 'Nicolás Gil' },
  { number: '15', name: 'Marcos Molina' }, { number: '18', name: 'Raúl Jiménez' },
  { number: '21', name: 'Jorge Navarro' }, { number: '27', name: 'Iker Díaz' },
];
let goalkeepersByTeam: Record<Team, Player[]> = {
  Local: [{ number: '12', name: 'Marcos Pérez' }, { number: '1', name: 'Daniel Martín' }],
  Visitante: [{ number: '2', name: 'Tomás Ruiz' }, { number: '4', name: 'Manuel Ortega' }],
};
const offensiveActions: Choice[] = [
  { icon: 'goal', label: 'Gol' }, { icon: 'shot-missed', label: 'Lanzamiento fallado' },
  { icon: 'assist', label: 'Asistencia' }, { icon: 'loss', label: 'Pérdida' },
  { icon: 'penalty-drawn', label: '7 m provocado' }, { icon: 'free-throw', label: 'Golpe franco' }, { icon: 'offense-foul', label: 'Falta en ataque' },
  { icon: 'penetration', label: 'Penetración' },
  { icon: 'penetration', label: '1 contra 1' },
];
const defensiveActions: Choice[] = [
  { icon: 'steal', label: 'Robo' }, { icon: 'block', label: 'Blocaje' },
  { icon: 'interception', label: 'Interceptación' }, { icon: 'defense-foul', label: 'Falta defensiva' },
  { icon: 'two-min', label: '2 min' }, { icon: 'yellow-card', label: 'Tarjeta amarilla' },
  { icon: 'red-card', label: 'Tarjeta roja' }, { icon: 'penalty-conceded', label: 'Penalti cometido' },
  { icon: 'save', label: 'Parada' },
];
let matches: Match[] = [
  { id: 1, competition: 'Liga · Jornada 8', home: 'HandStats Local', away: 'Balonmano Norte', date: '2026-11-07', time: '18:00', venue: 'Pabellón Municipal', status: 'Pendiente' },
  { id: 2, competition: 'Copa · Cuartos de final', home: 'Balonmano Sur', away: 'HandStats Local', date: '2026-11-14', time: '12:30', venue: 'Pabellón Central', status: 'Pendiente' },
  { id: 3, competition: 'Liga · Jornada 7', home: 'HandStats Local', away: 'Atlético Deportivo', date: '2026-10-31', time: '19:15', venue: 'Pabellón Municipal', status: 'Finalizado' },
];
const eventsByMatch = new Map<number, MatchEvent[]>();
let preparationContext: { id: string; name: string; roster: Player[] } | null = null;
let originalContext: { matches: Match[]; events: Array<[number, MatchEvent[]]>; home: Player[]; away: Player[]; keepers: Record<Team, Player[]> } | null = null;
let activeMatch: Match | null = null;
let liveStatsTeam: Team = 'Local';
let liveMapFilter = 'Todas';
let liveStatsReadOnly = false;
let finishedEntryMode: 'replay' | 'single' | null = null;
let manualEventTime: string | null = null;
let generalPlayerSortKey: GeneralPlayerSortKey = 'goals';
let generalPlayerSortDirection: 1 | -1 = -1;
let selectedPenalty = false;
let selectedCounterattack = false;
let selectedAttackPhase: MatchEvent['attackPhase'];
let selectedDuelDirection: MatchEvent['duelDirection'];
let selectedDuelResult: boolean | undefined;
let individualPlayerCategory: 'Ofensivas' | 'Defensivas' = 'Ofensivas';
let individualPlayerAction = 'Todas';
let individualMapMode: SpatialMapMode = 'effectiveness';
let liveMapMode: SpatialMapMode = 'effectiveness';
const SHOT_ACTIONS = ['Gol', 'Lanzamiento fallado', 'Parada'];
const MATCH_DURATION_MINUTES = 60;

function countPossessions(events: MatchEvent[], team: Team): number {
  return events.filter((event) => event.attackingTeam === team && (
    SHOT_ACTIONS.includes(event.action) || event.action.startsWith('Pérdida') || event.action === 'Falta en ataque'
  )).length;
}

function elapsedMatchMs(match: Match | null): number {
  if (!match) return 0;
  const base = match.timerElapsedMs ?? (match.status === 'Finalizado' ? MATCH_DURATION_MINUTES * 60_000 : 0);
  return match.timerRunning && match.timerStartedAt ? base + Date.now() - match.timerStartedAt : base;
}

function formatChronometer(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function createFinishedDemoEvents(): MatchEvent[] {
  const events: MatchEvent[] = [];
  const targetZones = ['Arriba izquierda', 'Arriba centro', 'Arriba derecha', 'Centro izquierda', 'Centro', 'Centro derecha', 'Abajo izquierda', 'Abajo centro', 'Abajo derecha'];
  const localScorers = homePlayers;
  const awayScorers = awayPlayers;
  let minute = 1;
  const addShots = (attackingTeam: Team, goals: number, misses: number, saves: number): void => {
    const shooters = attackingTeam === 'Local' ? localScorers : awayScorers;
    const defense: Team = attackingTeam === 'Local' ? 'Visitante' : 'Local';
    const keepers = goalkeepersByTeam[defense];
    const shotResults: Array<'Gol' | 'Lanzamiento fallado' | 'Parada'> = [
      ...Array<'Gol'>(goals).fill('Gol'),
      ...Array<'Lanzamiento fallado'>(misses).fill('Lanzamiento fallado'),
      ...Array<'Parada'>(saves).fill('Parada'),
    ];
    shotResults.forEach((result, index) => {
      const shooter = shooters[(index * 3 + Math.floor(index / 4)) % shooters.length];
      const keeper = keepers[index % keepers.length];
      const target = targetZones[(index * 5 + Math.floor(index / 3)) % targetZones.length];
      const isSave = result === 'Parada';
      const actionTeam = isSave ? defense : attackingTeam;
      const y = [.15, .33, .49, .67, .84][(index * 2 + Math.floor(index / 3)) % 5];
      const x = attackingTeam === 'Local' ? [.09, .16, .24, .31, .39, .45][(index * 3 + Math.floor(index / 2)) % 6] : [.91, .84, .76, .69, .61, .55][(index * 3 + Math.floor(index / 2)) % 6];
      events.push({
        action: result,
        team: actionTeam,
        attackingTeam,
        defendingTeam: defense,
        defenseOutcome: result === 'Gol' ? 'failure' : 'success',
        player: isSave ? keeper.name : shooter.name,
        shooter: shooter.name,
        keeper: keeper.name,
        target,
        position: { x, y },
        time: `${String(minute).padStart(2, '0')}:${index % 2 ? '42' : '18'}`,
      });
      if (index % 2) minute += 1;
    });
  };

  addShots('Local', 28, 8, 7);
  addShots('Visitante', 25, 9, 7);

  const fieldZones = [
    { x: .28, y: .24 }, { x: .42, y: .68 }, { x: .57, y: .39 }, { x: .73, y: .75 },
    { x: .35, y: .84 }, { x: .65, y: .18 }, { x: .48, y: .52 }, { x: .22, y: .59 },
  ];
  const extraEvents = [
    ...Array.from({ length: 8 }, (_, i) => ({ action: 'Pérdida', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'turnover' })),
    ...Array.from({ length: 4 }, (_, i) => ({ action: 'Robo', team: i % 2 ? 'Local' as Team : 'Visitante' as Team, kind: 'success' })),
    ...Array.from({ length: 3 }, (_, i) => ({ action: 'Blocaje', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'success' })),
    ...Array.from({ length: 2 }, (_, i) => ({ action: 'Interceptación', team: i % 2 ? 'Local' as Team : 'Visitante' as Team, kind: 'success' })),
    ...Array.from({ length: 5 }, (_, i) => ({ action: 'Falta defensiva', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'failure' })),
    ...Array.from({ length: 2 }, (_, i) => ({ action: '7 m provocado', team: i % 2 ? 'Local' as Team : 'Visitante' as Team, kind: 'penalty' })),
    ...Array.from({ length: 3 }, (_, i) => ({ action: 'Asistencia', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'attack' })),
    ...Array.from({ length: 7 }, (_, i) => ({ action: 'Golpe franco', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'attack' })),
    ...Array.from({ length: 5 }, (_, i) => ({ action: '2 min', team: i % 2 ? 'Visitante' as Team : 'Local' as Team, kind: 'discipline' })),
    ...Array.from({ length: 3 }, (_, i) => ({ action: 'Tarjeta amarilla', team: i % 2 ? 'Local' as Team : 'Visitante' as Team, kind: 'discipline' })),
    ...Array.from({ length: 1 }, (_, i) => ({ action: 'Tarjeta roja', team: i % 2 ? 'Local' as Team : 'Visitante' as Team, kind: 'discipline' })),
  ];
  extraEvents.forEach(({ action, team, kind }, index) => {
    const defendingTeam = kind === 'turnover' || kind === 'penalty' ? (team === 'Local' ? 'Visitante' : 'Local') : kind === 'failure' ? team : kind === 'success' ? team : undefined;
    const attackingTeam = kind === 'turnover' || kind === 'penalty' || kind === 'attack' ? team : undefined;
    const zone = fieldZones[index % fieldZones.length];
    const roster = team === 'Local' ? homePlayers : awayPlayers;
    const player = roster[(index * 2 + 1) % roster.length];
    events.push({
      action: kind === 'turnover' ? 'Pérdida · Fallo de pase' : action,
      team,
      attackingTeam,
      defendingTeam,
      defenseOutcome: kind === 'turnover' || kind === 'success' ? 'success' : kind === 'failure' || kind === 'penalty' ? 'failure' : undefined,
      player: player.name,
      position: zone,
      time: `${String(10 + index * 2).padStart(2, '0')}:${index % 2 ? '34' : '06'}`,
    });
  });
  return events;
}

eventsByMatch.set(3, createFinishedDemoEvents());

const MATCH_STORAGE_KEY = 'handstats.matches.v1';
try {
  const saved = localStorage.getItem(MATCH_STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved) as { matches: Match[]; events: Array<[number, MatchEvent[]]> };
    if (Array.isArray(data.matches) && Array.isArray(data.events)) {
      matches = data.matches;
      eventsByMatch.clear();
      data.events.forEach(([id, events]) => eventsByMatch.set(id, events));
    }
  }
} catch (error) { console.warn('No se pudieron cargar los partidos guardados.', error); }

function saveMatchData(): void {
  try { localStorage.setItem(preparationContext ? `handstats.preparation.data.${preparationContext.id}` : MATCH_STORAGE_KEY, JSON.stringify({ matches, events: [...eventsByMatch], ...(preparationContext ? { roster: preparationContext.roster } : {}) })); }
  catch (error) { console.warn('No se pudieron guardar los partidos.', error); }
}
window.addEventListener('beforeunload', saveMatchData);

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('No se encontró el contenedor de HandStats.');
root.innerHTML = appView;

const get = <T extends Element>(selector: string, parent: ParentNode = document): T => {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`Falta un elemento requerido: ${selector}`);
  return element;
};
const appShell = get<HTMLElement>('.app');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] ?? character));
}

const makePlayers = (players: Player[], team: 'Local' | 'Visitante'): string =>
  players.map(({ number, name }) => `
    <button class="card" type="button" data-player="${escapeHtml(name)}" data-team="${team}" aria-label="Seleccionar ${escapeHtml(name)}, número ${escapeHtml(number)}">
      <span class="player-number">${escapeHtml(number)}</span><span class="player-name">${escapeHtml(name)}</span>
    </button>`).join('');

const makeActions = (choices: Choice[]): string =>
  choices.map(({ icon, label }) => `
    <button class="action-card" type="button" aria-pressed="false">
      <span class="action-icon"><img src="/icons/actions/${icon}.svg" alt="" aria-hidden="true"></span><span>${label}</span>
    </button>`).join('');

get<HTMLDivElement>('#homePlayers').innerHTML = makePlayers(homePlayers, 'Local');
get<HTMLDivElement>('#awayPlayers').innerHTML = makePlayers(awayPlayers, 'Visitante');
get<HTMLDivElement>('#offense').innerHTML = makeActions(offensiveActions);
get<HTMLDivElement>('#defense').innerHTML = makeActions(defensiveActions);
const rosterList = get<HTMLDivElement>('#rosterList');

const homePage = get<HTMLElement>('#homePage');
const matchesPage = get<HTMLElement>('#matchesPage');
const preparationPage = get<HTMLElement>('#preparationPage');
type PreparationTeam = { id: string; name: string };
const preparationStorageKey = 'handstats.preparation.teams.v1';
let preparationTeams: PreparationTeam[] = [];
try {
  const saved: unknown = JSON.parse(localStorage.getItem(preparationStorageKey) ?? '[]');
  if (Array.isArray(saved)) preparationTeams = saved.filter((team): team is PreparationTeam => typeof team?.id === 'string' && typeof team?.name === 'string');
} catch (error) { console.warn('No se pudieron cargar los equipos guardados.', error); }
const preparationTeamList = get<HTMLElement>('#preparationTeamList');
const preparationDialog = get<HTMLDialogElement>('#preparationTeamDialog');
const preparationForm = get<HTMLFormElement>('#preparationTeamForm');
const preparationName = get<HTMLInputElement>('#preparationTeamName');
const preparationError = get<HTMLElement>('#preparationTeamError');

function renderPreparationTeams(): void {
  const total = preparationTeams.length;
  get<HTMLElement>('#preparationTeamCount').textContent = total ? `${total} ${total === 1 ? 'equipo guardado' : 'equipos guardados'}` : 'Los equipos disponibles aparecerán aquí.';
  preparationTeamList.className = total ? 'preparation-team-list' : 'preparation-empty';
  preparationTeamList.innerHTML = total ? preparationTeams.map((team) => `<button type="button" class="preparation-team-card" data-preparation-team="${escapeHtml(team.id)}"><span class="preparation-team-icon" aria-hidden="true">◈</span><span class="preparation-team-info"><strong>${escapeHtml(team.name)}</strong><small>Ver equipo y partidos</small></span><span class="preparation-team-arrow" aria-hidden="true">→</span></button>`).join('') : '<span aria-hidden="true">◈</span><strong>Aún no hay equipos guardados</strong><p>Añade un equipo para empezar a preparar tus partidos.</p>';
}

get<HTMLButtonElement>('#addPreparationTeam').addEventListener('click', () => {
  preparationForm.reset();
  preparationError.hidden = true;
  preparationDialog.showModal();
  preparationName.focus();
});
get<HTMLButtonElement>('#closePreparationDialog').addEventListener('click', () => preparationDialog.close());
get<HTMLButtonElement>('#cancelPreparationTeam').addEventListener('click', () => preparationDialog.close());
preparationDialog.addEventListener('click', (event) => { if (event.target === preparationDialog) preparationDialog.close(); });
preparationDialog.addEventListener('close', () => get<HTMLButtonElement>('#addPreparationTeam').focus());
preparationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = preparationName.value.trim().replace(/\s+/g, ' ');
  if (!name) { preparationError.textContent = 'Escribe el nombre del equipo.'; preparationError.hidden = false; preparationName.focus(); return; }
  if (preparationTeams.some((team) => team.name.toLocaleLowerCase('es') === name.toLocaleLowerCase('es'))) { preparationError.textContent = 'Ya tienes un equipo con ese nombre.'; preparationError.hidden = false; preparationName.focus(); return; }
  const updated = [...preparationTeams, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name }];
  try { localStorage.setItem(preparationStorageKey, JSON.stringify(updated)); }
  catch { preparationError.textContent = 'No se ha podido guardar el equipo en este navegador.'; preparationError.hidden = false; return; }
  preparationTeams = updated;
  renderPreparationTeams();
  preparationDialog.close();
});
renderPreparationTeams();
const rosterPage = get<HTMLElement>('#rosterPage');
const generalStatsPage = get<HTMLElement>('#generalStatsPage');
const generalVenueFilter = get<HTMLSelectElement>('#generalVenueFilter');
const generalMatchFilter = get<HTMLSelectElement>('#generalMatchFilter');
const generalDateFrom = get<HTMLInputElement>('#generalDateFrom');
const generalDateTo = get<HTMLInputElement>('#generalDateTo');
const generalActionFilter = get<HTMLSelectElement>('#generalActionFilter');
const generalMapSideControl = get<HTMLElement>('.general-map-side-switch');
const generalMapActionFilter = get<HTMLDivElement>('#generalMapActionFilter');
const generalMapModeControl = get<HTMLElement>('#generalMapModeControl');
const generalAttackHeatmap = get<SVGSVGElement>('#generalAttackHeatmap');
const generalDefenseHeatmap = get<SVGSVGElement>('#generalDefenseHeatmap');
const generalPlayerSearch = get<HTMLInputElement>('#generalPlayerSearch');
const individualPlayerModal = get<HTMLElement>('#individualPlayerModal');
const individualPlayerBackdrop = get<HTMLDivElement>('#individualPlayerBackdrop');
const liveStatsPage = get<HTMLElement>('#liveStatsPage');
const playersPage = get<HTMLElement>('#playersPage');
const actionsPage = get<HTMLElement>('#actionsPage');
const shotPage = get<HTMLElement>('#shotPage');
const fieldActionPage = get<HTMLElement>('#fieldActionPage');
const shotNote = get<HTMLParagraphElement>('#shotNote');
const court = get<SVGSVGElement>('.court');
const shotMarker = get<SVGCircleElement>('#shotMarker');
const confirmButton = get<HTMLButtonElement>('#confirmShot');
const saveExtras = get<HTMLDivElement>('#saveExtras');
const shooterGrid = get<HTMLDivElement>('#shooterGrid');
const reboundPanel = get<HTMLDivElement>('#reboundPanel');
const keeperOptions = get<HTMLDivElement>('#keeperOptions');
const missDestinations = get<HTMLDivElement>('#missDestinations');
const fullCourt = get<SVGSVGElement>('.full-court');
const fieldActionMarker = get<SVGCircleElement>('#fieldActionMarker');
const fieldActionTitle = get<HTMLHeadingElement>('#fieldActionTitle');
const fieldActionNote = get<HTMLParagraphElement>('#fieldActionNote');
const turnoverTypes = get<HTMLElement>('#turnoverTypes');
const confirmFieldAction = get<HTMLButtonElement>('#confirmFieldAction');
const recordedBanner = get<HTMLDivElement>('#recordedBanner');
const menuTrigger = get<HTMLButtonElement>('#menuTrigger');
const sideMenu = get<HTMLElement>('#sideMenu');
const menuBackdrop = get<HTMLDivElement>('#menuBackdrop');
const clockValue = get<HTMLElement>('#gameClock');
const clockControls = get<HTMLDivElement>('#clockControls');
const liveStatsTrigger = get<HTMLButtonElement>('#liveStatsTrigger');
const attackHeatmap = get<SVGSVGElement>('#attackHeatmap');
const defenseHeatmap = get<SVGSVGElement>('#defenseHeatmap');
const shotGoalMap = get<SVGSVGElement>('#shotGoalMap');
const keeperGoalMap = get<SVGSVGElement>('#keeperGoalMap');
const liveMapFilterControl = get<HTMLDivElement>('#liveMapFilter');
const matchList = get<HTMLDivElement>('#matchList');
const matchModal = get<HTMLElement>('#matchModal');
const matchModalBackdrop = get<HTMLDivElement>('#matchModalBackdrop');
const matchForm = get<HTMLFormElement>('#matchForm');
const matchFormError = get<HTMLParagraphElement>('#matchFormError');
const playerModal = get<HTMLElement>('#playerModal');
const playerModalBackdrop = get<HTMLDivElement>('#playerModalBackdrop');
const playerForm = get<HTMLFormElement>('#playerForm');
const playerFormError = get<HTMLParagraphElement>('#playerFormError');
let editingPlayerNumber: string | null = null;

const preparationDetailPage = get<HTMLElement>('#preparationDetailPage');
function loadPreparationTeam(team: PreparationTeam): void {
  if (preparationContext) leavePreparationTeam();
  saveMatchData();
  originalContext = { matches, events: [...eventsByMatch], home: homePlayers, away: awayPlayers, keepers: goalkeepersByTeam };
  let saved: { matches?: Match[]; events?: Array<[number, MatchEvent[]]>; roster?: Player[] } = {};
  try { saved = JSON.parse(localStorage.getItem(`handstats.preparation.data.${team.id}`) ?? '{}'); }
  catch { console.warn('No se pudieron cargar los datos del equipo.'); }
  preparationContext = { ...team, roster: Array.isArray(saved.roster) ? saved.roster : [] };
  matches = Array.isArray(saved.matches) ? saved.matches : [];
  eventsByMatch.clear();
  if (Array.isArray(saved.events)) saved.events.forEach(([id, events]) => eventsByMatch.set(id, events));
  homePlayers = preparationContext.roster;
  awayPlayers = [];
  goalkeepersByTeam = { Local: [], Visitante: [] };
  activeMatch = null;
  refreshPlayerSelections();
  openPreparationDetail();
}
function leavePreparationTeam(): void {
  if (!preparationContext || !originalContext) return;
  saveMatchData();
  matches = originalContext.matches;
  eventsByMatch.clear();
  originalContext.events.forEach(([id, events]) => eventsByMatch.set(id, events));
  homePlayers = originalContext.home;
  awayPlayers = originalContext.away;
  goalkeepersByTeam = originalContext.keepers;
  preparationContext = null;
  originalContext = null;
  activeMatch = null;
  refreshPlayerSelections();
  renderMatches();
  renderRoster();
}
function openPreparationDetail(): void {
  if (!preparationContext) return;
  closeMenu();
  [homePage, matchesPage, rosterPage, preparationPage, generalStatsPage, playersPage, actionsPage, shotPage, fieldActionPage, liveStatsPage].forEach((page) => { page.classList.remove('active'); page.setAttribute('aria-hidden', 'true'); });
  playersPage.classList.add('hidden');
  preparationDetailPage.classList.add('active');
  preparationDetailPage.setAttribute('aria-hidden', 'false');
  appShell.classList.add('general-overview');
  get<HTMLElement>('#preparationDetailName').textContent = preparationContext.name;
  homePlayers = preparationContext.roster;
  goalkeepersByTeam = { Local: homePlayers.filter((player) => /portero|portera/i.test(player.position ?? '')), Visitante: [] };
  refreshPlayerSelections();
}
preparationTeamList.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-preparation-team]');
  const team = preparationTeams.find((item) => item.id === button?.dataset.preparationTeam);
  if (team) loadPreparationTeam(team);
});
get<HTMLButtonElement>('#preparationDetailBack').addEventListener('click', () => { leavePreparationTeam(); preparationDetailPage.classList.remove('active'); showMenuPage('preparacion'); });
preparationDetailPage.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-team-section]');
  if (!button) return;
  preparationDetailPage.classList.remove('active');
  preparationDetailPage.setAttribute('aria-hidden', 'true');
  if (button.dataset.teamSection === 'estadisticas') openGeneralStats();
  else if (button.dataset.teamSection === 'partidos' || button.dataset.teamSection === 'plantilla') {
    showMenuPage(button.dataset.teamSection);
    renderMatches(); renderRoster();
  }
});

function refreshPlayerSelections(): void {
  get<HTMLDivElement>('#homePlayers').innerHTML = makePlayers(homePlayers, 'Local');
  get<HTMLDivElement>('#awayPlayers').innerHTML = makePlayers(awayPlayers, 'Visitante');
}

function renderRoster(): void {
  const query = get<HTMLInputElement>('#playerSearch').value.trim().toLocaleLowerCase('es');
  const statusFilter = get<HTMLSelectElement>('#playerStatusFilter').value;
  const visible = homePlayers.filter((player) => {
    const matchesSearch = `${player.name} ${player.number} ${player.position ?? ''}`.toLocaleLowerCase('es').includes(query);
    const matchesStatus = statusFilter === 'todos' || (statusFilter === 'lesionado' ? player.injured : !player.injured);
    return matchesSearch && matchesStatus;
  });
  rosterList.innerHTML = visible.length ? visible.map((player) => `
    <article class="roster-player-row ${player.injured ? 'is-injured' : ''}">
      <span class="roster-player-number">${escapeHtml(player.number)}</span>
      <div class="roster-player-info"><strong>${escapeHtml(player.name)}</strong><small>${player.position ? escapeHtml(player.position) : 'Jugador de plantilla'}${player.heightCm ? ` · ${player.heightCm} cm` : ''}${player.weightKg ? ` · ${player.weightKg} kg` : ''}</small></div>
      <span class="player-status ${player.injured ? 'injured' : ''}">${player.injured ? 'Lesionado' : 'Disponible'}</span>
      <div class="roster-player-actions"><button type="button" class="roster-action injury-action" data-roster-action="injury" data-number="${escapeHtml(player.number)}">${player.injured ? 'Quitar lesión' : 'Marcar lesión'}</button><button type="button" class="roster-action" data-roster-action="edit" data-number="${escapeHtml(player.number)}">Editar</button><button type="button" class="roster-action delete-action" data-roster-action="delete" data-number="${escapeHtml(player.number)}">Eliminar</button></div>
    </article>`).join('') : '<div class="match-empty"><span>◉</span><strong>No hay jugadores que coincidan</strong><small>Cambia los filtros o añade un jugador a la plantilla.</small></div>';
}

function refreshRosterData(): void {
  if (preparationContext) { preparationContext.roster = homePlayers; saveMatchData(); }
  renderRoster();
  refreshPlayerSelections();
}

function openPlayerForm(player?: Player): void {
  editingPlayerNumber = player?.number ?? null;
  playerForm.reset();
  playerFormError.hidden = true;
  get<HTMLHeadingElement>('#playerFormTitle').textContent = player ? 'Editar jugador' : 'Añadir jugador';
  get<HTMLElement>('#playerExtraFields').hidden = !player;
  get<HTMLInputElement>('[name="name"]', playerForm).value = player?.name ?? '';
  get<HTMLInputElement>('[name="number"]', playerForm).value = player?.number ?? '';
  get<HTMLInputElement>('[name="injured"]', playerForm).checked = player?.injured ?? false;
  get<HTMLInputElement>('[name="heightCm"]', playerForm).value = player?.heightCm ? String(player.heightCm) : '';
  get<HTMLInputElement>('[name="weightKg"]', playerForm).value = player?.weightKg ? String(player.weightKg) : '';
  get<HTMLInputElement>('[name="age"]', playerForm).value = player?.age ? String(player.age) : '';
  get<HTMLInputElement>('[name="position"]', playerForm).value = player?.position ?? '';
  playerModal.classList.add('open');
  playerModal.setAttribute('aria-hidden', 'false');
  playerModalBackdrop.hidden = false;
  get<HTMLInputElement>('[name="name"]', playerForm).focus();
}

function closePlayerForm(): void {
  playerModal.classList.remove('open');
  playerModal.setAttribute('aria-hidden', 'true');
  playerModalBackdrop.hidden = true;
  editingPlayerNumber = null;
}

function renderMatches(): void {
  const query = get<HTMLInputElement>('#matchSearch').value.trim().toLocaleLowerCase('es');
  const status = get<HTMLSelectElement>('#matchStatusFilter').value;
  const visible = matches.filter((match) => {
    const text = `${match.competition} ${match.home} ${match.away} ${match.venue}`.toLocaleLowerCase('es');
    return (!query || text.includes(query)) && (status === 'todos' || match.status === status);
  });
  matchList.innerHTML = visible.length ? visible.map((match) => `
    <article class="match-card">
      <div class="match-card-meta"><span class="match-status ${match.status === 'Finalizado' ? 'finished' : match.status === 'En juego' ? 'live' : ''}">${escapeHtml(match.status)}</span><span>${escapeHtml(match.competition)}</span></div>
      <div class="match-card-main"><div class="match-team home-team"><strong>${escapeHtml(match.home)}</strong><small>LOCAL</small></div><span class="match-vs">VS</span><div class="match-team away-team"><strong>${escapeHtml(match.away)}</strong><small>VISITANTE</small></div></div>
      <div class="match-card-footer"><span>◷ ${escapeHtml(new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${match.date}T12:00:00`)))} · ${escapeHtml(match.time)}</span><span>⌖ ${escapeHtml(match.venue || 'Lugar por definir')}</span>${preparationContext ? `<button type="button" class="match-open-button match-extra-button" data-match-id="${match.id}" data-entry="squad">Convocatoria</button><button type="button" class="match-open-button match-extra-button" data-match-id="${match.id}" data-entry="stats">Ver estadísticas</button><button type="button" class="match-open-button" data-match-id="${match.id}" data-entry="${match.status === 'Finalizado' ? 'replay' : 'record'}">Tomar estadísticas</button>${match.status === 'En juego' ? `<button type="button" class="match-open-button match-extra-button" data-match-id="${match.id}" data-entry="finish">Finalizar partido</button>` : ''}` : `<button type="button" class="match-open-button" data-match-id="${match.id}">${match.status === 'Finalizado' ? 'Ver estadísticas' : 'Registrar'} <span>→</span></button>${match.status === 'Finalizado' ? `<button type="button" class="match-open-button match-extra-button" data-match-id="${match.id}" data-entry="replay">Tomar estadísticas de nuevo</button><button type="button" class="match-open-button match-extra-button" data-match-id="${match.id}" data-entry="single">Añadir acción por tiempo</button>` : ''}`}</div>
    </article>`).join('') : '<div class="match-empty"><span>◷</span><strong>No hay partidos que coincidan</strong><small>Prueba a cambiar la búsqueda o los filtros.</small></div>';
}

function ourSideForMatch(match: Match): Team {
  if (preparationContext) return match.away.toLocaleLowerCase('es') === preparationContext.name.toLocaleLowerCase('es') ? 'Visitante' : 'Local';
  if (match.home.toLocaleLowerCase('es').includes('handstats local')) return 'Local';
  if (match.away.toLocaleLowerCase('es').includes('handstats local')) return 'Visitante';
  return 'Local';
}

function populateGeneralMatchFilter(): void {
  const finished = matches.filter((match) => match.status === 'Finalizado');
  generalMatchFilter.innerHTML = '<option value="all">Todos los partidos</option>' + finished.map((match) => `<option value="${match.id}">${escapeHtml(match.home)} · ${escapeHtml(match.away)} — ${escapeHtml(match.competition)}</option>`).join('');
}

function getGeneralMatchData(): Array<{ match: Match; side: Team; events: MatchEvent[]; goalsFor: number; goalsAgainst: number }> {
  const selectedMatchId = generalMatchFilter.value;
  const from = generalDateFrom.value;
  const to = generalDateTo.value;
  return matches.filter((match) => {
    if (match.status !== 'Finalizado') return false;
    if (selectedMatchId !== 'all' && String(match.id) !== selectedMatchId) return false;
    if (from && match.date < from) return false;
    if (to && match.date > to) return false;
    const side = ourSideForMatch(match);
    if (generalVenueFilter.value === 'home' && side !== 'Local') return false;
    if (generalVenueFilter.value === 'away' && side !== 'Visitante') return false;
    return true;
  }).map((match) => {
    const side = ourSideForMatch(match);
    const events = eventsByMatch.get(match.id) ?? [];
    return {
      match, side, events,
      goalsFor: events.filter((event) => event.action === 'Gol' && event.attackingTeam === side).length,
      goalsAgainst: events.filter((event) => event.action === 'Gol' && event.attackingTeam === opposingTeam(side)).length,
    };
  });
}

function getFilteredGeneralMatchData(): ReturnType<typeof getGeneralMatchData> {
  return getGeneralMatchData().map((record) => {
    const selectedEvents = generalActionFilter.value === 'penalties' ? record.events.filter((event) => event.isPenalty) : record.events;
    return {
      ...record,
      events: selectedEvents,
      goalsFor: selectedEvents.filter((event) => event.action === 'Gol' && event.attackingTeam === record.side).length,
      goalsAgainst: selectedEvents.filter((event) => event.action === 'Gol' && event.attackingTeam === opposingTeam(record.side)).length,
    };
  });
}

const generalAttackActions = ['Lanzamientos', 'Gol', 'Lanzamiento fallado', 'Penaltis', 'Contraataques', '1 contra 1', 'Asistencia', 'Pérdida', 'Pérdida · Fallo de pase', 'Pérdida · Fallo de recepción', 'Pérdida · Dobles', 'Pérdida · Pasos', '7 m provocado', 'Golpe franco', 'Falta en ataque', 'Penetración'];
const generalDefenseActions = ['Parada', 'Contraataques', 'Robo', 'Blocaje', 'Interceptación', 'Falta defensiva', 'Penalti cometido', '2 min', 'Tarjeta amarilla', 'Tarjeta roja'];

function renderGeneralHeatmaps(): void {
  const sideFilter = generalMapSideControl.querySelector<HTMLButtonElement>('[data-general-map-side].selected')?.dataset.generalMapSide ?? 'all';
  const configuredActions = (sideFilter === 'attack' ? generalAttackActions : sideFilter === 'defense' ? generalDefenseActions : [...new Set([...generalAttackActions, ...generalDefenseActions])]).filter((action) => preparationContext || action !== '1 contra 1');
  const selectedAction = generalMapActionFilter.querySelector<HTMLButtonElement>('[data-general-map-action].selected')?.dataset.generalMapAction ?? 'Todas';
  const action = selectedAction !== 'Todas' && !configuredActions.includes(selectedAction) ? 'Todas' : selectedAction;
  const mapMode = (generalMapModeControl.querySelector<HTMLButtonElement>('[data-general-map-mode].selected')?.dataset.generalMapMode ?? 'effectiveness') as SpatialMapMode;
  generalMapActionFilter.innerHTML = ['Todas', ...configuredActions].map((item) => `<button type="button" data-general-map-action="${escapeHtml(item)}" class="map-filter-chip ${action === item ? 'selected' : ''}" aria-pressed="${action === item}">${escapeHtml(item === 'Todas' ? 'Todas' : item)}</button>`).join('');
  const activeChip = generalMapActionFilter.querySelector<HTMLElement>('.map-filter-chip.selected');
  if (activeChip) generalMapActionFilter.scrollLeft = Math.max(0, activeChip.offsetLeft - (generalMapActionFilter.clientWidth - activeChip.clientWidth) / 2);
  const matchesAction = (event: MatchEvent): boolean => action === 'Todas' ||
    (action === 'Lanzamientos' ? SHOT_ACTIONS.includes(event.action) : action === 'Penaltis' ? Boolean(event.isPenalty) : action === 'Contraataques' ? Boolean(event.isCounterattack) && SHOT_ACTIONS.includes(event.action) : action === 'Pérdida' ? event.action.startsWith('Pérdida') : event.action === action);
  const records = getFilteredGeneralMatchData();
  const attackPanel = get<HTMLElement>('#generalAttackMapPanel');
  const defensePanel = get<HTMLElement>('#generalDefenseMapPanel');
  attackPanel.classList.toggle('is-hidden', sideFilter === 'defense');
  defensePanel.classList.toggle('is-hidden', sideFilter === 'attack');
  const attackPoints = sideFilter === 'defense' ? [] : records.flatMap(({ events, side }) => events.filter((event) =>
    event.attackingTeam === side && event.position && generalAttackActions.includes(action === 'Todas' ? event.action : action) && matchesAction(event),
  ).map((event) => ({ position: event.position!, success: mapActionSuccess(event, false) })));
  const defensePoints = sideFilter === 'attack' ? [] : records.flatMap(({ events, side }) => events.filter((event) =>
    event.defendingTeam === side && event.position && generalDefenseActions.includes(action === 'Todas' ? event.action : action) && matchesAction(event),
  ).map((event) => ({ position: event.position!, success: mapActionSuccess(event, true) })));
  renderHeatmap(generalAttackHeatmap, get<HTMLElement>('#generalAttackHeatEmpty'), attackPoints, mapMode);
  renderHeatmap(generalDefenseHeatmap, get<HTMLElement>('#generalDefenseHeatEmpty'), defensePoints, mapMode);
  const legend = mapMode === 'effectiveness'
    ? '<span><i class="heat-bad"></i>Baja</span><span><i class="heat-mid"></i>Media</span><span><i class="heat-good"></i>Alta</span>'
    : mapMode === 'frequency'
      ? '<span><i class="frequency-low"></i>Menos acciones</span><span><i class="frequency-high"></i>Más acciones</span>'
      : '<span><i class="heat-good"></i>Acción exitosa</span><span><i class="heat-bad"></i>Acción no exitosa</span>';
  attackPanel.querySelector('.heatmap-legend')!.innerHTML = legend;
  defensePanel.querySelector('.heatmap-legend')!.innerHTML = legend;
  attackPanel.querySelector('h2')!.textContent = action === 'Todas' ? 'Ataque' : `Ataque · ${action}`;
  defensePanel.querySelector('h2')!.textContent = action === 'Todas' ? 'Defensa' : `Defensa · ${action}`;
  get<HTMLElement>('#generalAttackHeatEmpty').textContent = `No hay coordenadas de ${action === 'Todas' ? 'acciones ofensivas' : action.toLocaleLowerCase('es')} en los partidos filtrados.`;
  get<HTMLElement>('#generalDefenseHeatEmpty').textContent = `No hay coordenadas de ${action === 'Todas' ? 'acciones defensivas' : action.toLocaleLowerCase('es')} en los partidos filtrados.`;
  renderGeneralGoalMaps(records, action, sideFilter);
}

function renderGeneralGoalMaps(records: ReturnType<typeof getFilteredGeneralMatchData>, action: string, sideFilter: string): void {
  const shotActions = ['Todas', 'Lanzamientos', 'Penaltis', 'Contraataques', 'Gol', 'Lanzamiento fallado', 'Parada'];
  const panel = get<HTMLElement>('.general-penalty-maps');
  const showGoals = shotActions.includes(action);
  panel.classList.toggle('is-hidden', !showGoals);
  if (!showGoals) return;
  const isPenaltyOnly = action === 'Penaltis';
  const shotEventsFor = (defense: boolean): MatchEvent[] => records.flatMap(({ events, side }) => events.filter((event) =>
    (defense ? event.defendingTeam === side : event.attackingTeam === side) && SHOT_ACTIONS.includes(event.action) && (!isPenaltyOnly || event.isPenalty) && (action !== 'Contraataques' || event.isCounterattack),
  ));
  const zones = ['Arriba izquierda', 'Arriba centro', 'Arriba derecha', 'Centro izquierda', 'Centro', 'Centro derecha', 'Abajo izquierda', 'Abajo centro', 'Abajo derecha'];
  const render = (svgId: string, emptyId: string, defense: boolean): void => {
    const shots = shotEventsFor(defense);
    const numeratorAction = ['Todas', 'Lanzamientos', 'Penaltis', 'Contraataques'].includes(action) ? (defense ? 'Parada' : 'Gol') : action;
    const title = defense
      ? (numeratorAction === 'Gol' ? 'Goles recibidos por zona' : numeratorAction === 'Lanzamiento fallado' ? 'Lanzamientos fallados recibidos por zona' : 'Paradas por zona')
      : (numeratorAction === 'Gol' ? 'Goles anotados por zona' : numeratorAction === 'Lanzamiento fallado' ? 'Lanzamientos fallados por zona' : 'Lanzamientos detenidos por zona');
    const chart = get<SVGSVGElement>(`#${svgId}`);
    chart.closest('article')!.querySelector('h2')!.textContent = title;
    chart.closest('article')!.querySelector('header p')!.textContent = action === 'Penaltis' ? 'Penaltis por zona en los partidos filtrados' : 'Efectividad por zona en los partidos filtrados';
    get<HTMLElement>(`#${emptyId}`).textContent = `No hay lanzamientos dirigidos a una zona de portería para estos filtros.`;
    const cells = zones.map((zone, index) => {
      const attempts = shots.filter((event) => event.target === zone);
      const value = attempts.filter((event) => event.action === numeratorAction).length;
      const rate = attempts.length ? Math.round(value / attempts.length * 100) : 0;
      const good = defense ? numeratorAction === 'Parada' : numeratorAction === 'Gol';
      const quality = good ? rate : 100 - rate;
      const color = !attempts.length ? '#edf3f8' : quality >= 65 ? '#4db77b' : quality >= 35 ? '#f2cf61' : '#e9746d';
      const x = 56 + (index % 3) * (338 / 3), y = 29 + Math.floor(index / 3) * 62, center = x + 338 / 6;
      return `<g><rect x="${x}" y="${y}" width="${338 / 3}" height="62" fill="${color}" stroke="#607b98" stroke-width="2"/><text x="${center}" y="${y + 27}" text-anchor="middle" fill="#17324c" font-size="15" font-weight="850">${attempts.length ? `${value}/${attempts.length}` : '—'}</text><text x="${center}" y="${y + 46}" text-anchor="middle" fill="#17324c" font-size="12" font-weight="750">${attempts.length ? `${rate}%` : ''}</text></g>`;
    }).join('');
    chart.innerHTML = `<rect x="38" y="12" width="374" height="220" rx="7" fill="#f8fbff" stroke="#26384d" stroke-width="3"/><rect x="38" y="12" width="18" height="220" fill="#eb3838"/><rect x="394" y="12" width="18" height="220" fill="#eb3838"/><rect x="38" y="12" width="374" height="17" fill="#eb3838"/><rect x="38" y="215" width="374" height="17" fill="#eb3838"/><rect x="56" y="29" width="338" height="186" fill="#edf5fd"/>${cells}`;
    get<HTMLElement>(`#${emptyId}`).hidden = shots.some((event) => zones.includes(event.target ?? ''));
  };
  const shotPanel = get<HTMLElement>('#generalPenaltyShotMap').closest('article')!;
  const savePanel = get<HTMLElement>('#generalPenaltySaveMap').closest('article')!;
  shotPanel.classList.toggle('is-hidden', sideFilter === 'defense');
  savePanel.classList.toggle('is-hidden', sideFilter === 'attack');
  render('generalPenaltyShotMap', 'generalPenaltyShotEmpty', false);
  render('generalPenaltySaveMap', 'generalPenaltySaveEmpty', true);
}

function renderPreparationMetrics(container: HTMLElement, events: MatchEvent[]): void {
  container.hidden = !preparationContext;
  if (!preparationContext) { container.innerHTML = ''; return; }
  const percent = (success: number, total: number) => total ? `${Math.round(success / total * 100)}%` : '—';
  const duels = (['izquierda', 'derecha'] as const).map((direction) => {
    const selected = events.filter((event) => event.action === '1 contra 1' && event.duelDirection === direction && event.duelSuccess !== undefined);
    const won = selected.filter((event) => event.duelSuccess).length;
    return `<div><span>Salida por ${direction}</span><strong>${percent(won, selected.length)}</strong><small>${won}/${selected.length} duelos superados</small></div>`;
  }).join('');
  const phases = ([['contraataque', 'Contraataque'], ['posicional', 'Posicional'], ['segunda_oleada', 'Segunda oleada']] as const).map(([phase, label]) => {
    const shots = events.filter((event) => SHOT_ACTIONS.includes(event.action) && (event.attackPhase === phase || (phase === 'contraataque' && event.isCounterattack)));
    const goals = shots.filter((event) => event.action === 'Gol').length;
    return `<div><span>${label}</span><strong>${goals} ${goals === 1 ? 'gol' : 'goles'}</strong><small>${goals}/${shots.length} lanzamientos · ${percent(goals, shots.length)}</small></div>`;
  }).join('');
  container.innerHTML = `<h2>Preparación · análisis ofensivo</h2><p>El 1 contra 1 cuenta como exitoso cuando el atacante supera al defensor. Los tiros sin tipo de ataque no se incluyen en las fases.</p><div class="preparation-metric-grid">${duels}${phases}</div>`;
}

function renderGeneralStats(): void {
  const records = getFilteredGeneralMatchData();
  renderPreparationMetrics(get<HTMLElement>('#generalPreparationMetrics'), records.flatMap(({ events, side }) => events.filter((event) => event.attackingTeam === side)));
  const played = records.length;
  const goalsFor = records.reduce((sum, record) => sum + record.goalsFor, 0);
  const goalsAgainst = records.reduce((sum, record) => sum + record.goalsAgainst, 0);
  const wins = records.filter((record) => record.goalsFor > record.goalsAgainst).length;
  const draws = records.filter((record) => record.goalsFor === record.goalsAgainst).length;
  const losses = records.filter((record) => record.goalsFor < record.goalsAgainst).length;
  const events = records.flatMap((record) => record.events.map((event) => ({ event, side: record.side })));
  const ownShots = events.filter(({ event, side }) => event.attackingTeam === side && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action));
  const ownGoals = ownShots.filter(({ event }) => event.action === 'Gol').length;
  const ownPenaltyShots = events.filter(({ event, side }) => event.isPenalty && event.attackingTeam === side && SHOT_ACTIONS.includes(event.action));
  const ownPenaltyGoals = ownPenaltyShots.filter(({ event }) => event.action === 'Gol').length;
  const ownPossessions = records.reduce((sum, record) => sum + countPossessions(record.events, record.side), 0);
  const rivalShots = events.filter(({ event, side }) => event.attackingTeam === opposingTeam(side) && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action));
  const rivalPossessions = records.reduce((sum, record) => sum + countPossessions(record.events, opposingTeam(record.side)), 0);
  const goalsConceded = rivalShots.filter(({ event }) => event.action === 'Gol').length;
  const ownSaves = events.filter(({ event, side }) => event.action === 'Parada' && event.team === side).length;
  const facedShots = events.filter(({ event, side }) => event.defendingTeam === side && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action)).length;
  const freeThrows = events.filter(({ event, side }) =>
    (event.action === 'Golpe franco' && event.team === side) ||
    (event.action === '7 m provocado' && event.team === side) ||
    ((event.action === 'Falta defensiva' || event.action === 'Falta en ataque') && event.team !== side),
  ).length;
  const pct = (value: number, total: number) => total ? `${Math.round(value / total * 100)}%` : '—';
  get<HTMLElement>('#generalMatchesPlayed').textContent = String(played);
  get<HTMLElement>('#generalRecord').textContent = `${wins}V · ${draws}E · ${losses}D`;
  get<HTMLElement>('#generalGoalsFor').textContent = String(goalsFor);
  get<HTMLElement>('#generalGoalsForAvg').textContent = `${played ? (goalsFor / played).toFixed(1) : '0.0'} por partido`;
  get<HTMLElement>('#generalGoalsAgainst').textContent = String(goalsAgainst);
  get<HTMLElement>('#generalGoalsAgainstAvg').textContent = `${played ? (goalsAgainst / played).toFixed(1) : '0.0'} por partido`;
  get<HTMLElement>('#generalPossessionsAvg').textContent = played ? (ownPossessions / played).toFixed(1) : '—';
  get<HTMLElement>('#generalPossessionsTotal').textContent = `${ownPossessions} posesiones en ${played} partidos`;
  get<HTMLElement>('#generalAttackReach').textContent = pct(ownShots.length, ownPossessions);
  get<HTMLElement>('#generalAttackReachCount').textContent = `${ownShots.length} lanzamientos de ${ownPossessions} posesiones`;
  get<HTMLElement>('#generalShotEfficiency').textContent = pct(ownGoals, ownShots.length);
  get<HTMLElement>('#generalShotTotals').textContent = `${ownGoals} goles / ${ownShots.length} lanzamientos`;
  get<HTMLElement>('#generalPenaltyRate').textContent = pct(ownPenaltyGoals, ownPenaltyShots.length);
  get<HTMLElement>('#generalPenaltyTotals').textContent = `${ownPenaltyGoals} goles / ${ownPenaltyShots.length} penaltis`;
  const penaltyZones = ['Arriba izquierda', 'Arriba centro', 'Arriba derecha', 'Centro izquierda', 'Centro', 'Centro derecha', 'Abajo izquierda', 'Abajo centro', 'Abajo derecha'];
  const rivalPenaltyShots = events.filter(({ event, side }) => event.isPenalty && event.defendingTeam === side && SHOT_ACTIONS.includes(event.action));
  const renderPenaltyMap = (svgId: string, emptyId: string, shots: Array<{ event: MatchEvent; side: Team }>, keeperMap = false): void => {
    const cells = penaltyZones.map((zone, index) => {
      const relevant = shots.filter(({ event }) => event.target === zone);
      const scoredOrSaved = relevant.filter(({ event }) => keeperMap ? event.action === 'Parada' : event.action === 'Gol').length;
      const rate = relevant.length ? Math.round(scoredOrSaved / relevant.length * 100) : 0;
      const color = !relevant.length ? '#edf3f8' : rate >= 65 ? '#4db77b' : rate >= 35 ? '#f2cf61' : '#e9746d';
      const x = 56 + (index % 3) * (338 / 3), y = 29 + Math.floor(index / 3) * 62, center = x + 338 / 6;
      return `<g><rect x="${x}" y="${y}" width="${338 / 3}" height="62" fill="${color}" stroke="#607b98" stroke-width="2"/><text x="${center}" y="${y + 27}" text-anchor="middle" fill="#17324c" font-size="15" font-weight="850">${relevant.length ? `${scoredOrSaved}/${relevant.length}` : '—'}</text><text x="${center}" y="${y + 46}" text-anchor="middle" fill="#17324c" font-size="12" font-weight="750">${relevant.length ? `${rate}%` : ''}</text></g>`;
    }).join('');
    const svg = get<SVGSVGElement>(`#${svgId}`);
    svg.innerHTML = `<rect x="38" y="12" width="374" height="220" rx="7" fill="#f8fbff" stroke="#26384d" stroke-width="3"/><rect x="38" y="12" width="18" height="220" fill="#eb3838"/><rect x="394" y="12" width="18" height="220" fill="#eb3838"/><rect x="38" y="12" width="374" height="17" fill="#eb3838"/><rect x="38" y="215" width="374" height="17" fill="#eb3838"/><rect x="56" y="29" width="338" height="186" fill="#edf5fd"/>${cells}`;
    get<HTMLElement>(`#${emptyId}`).hidden = shots.some(({ event }) => penaltyZones.includes(event.target ?? ''));
  };
  renderPenaltyMap('generalPenaltyShotMap', 'generalPenaltyShotEmpty', ownPenaltyShots);
  renderPenaltyMap('generalPenaltySaveMap', 'generalPenaltySaveEmpty', rivalPenaltyShots, true);
  get<HTMLElement>('#generalRivalReach').textContent = pct(rivalShots.length, rivalPossessions);
  get<HTMLElement>('#generalRivalReachCount').textContent = `${rivalShots.length} lanzamientos de ${rivalPossessions} posesiones rivales`;
  get<HTMLElement>('#generalGoalsConcededRate').textContent = pct(goalsConceded, rivalShots.length);
  get<HTMLElement>('#generalGoalsConcededCount').textContent = `${goalsConceded} goles / ${rivalShots.length} lanzamientos rivales`;
  get<HTMLElement>('#generalFreeThrows').textContent = String(freeThrows);
  get<HTMLElement>('#generalSaves').textContent = String(ownSaves);
  get<HTMLElement>('#generalSaveRate').textContent = `${pct(ownSaves, facedShots)} de eficacia de portería`;

  const chart = get<SVGSVGElement>('#generalScoreChart');
  const chartEmpty = get<HTMLElement>('#generalScoreEmpty');
  chartEmpty.hidden = played > 0;
  const maxGoals = Math.max(1, ...records.flatMap((record) => [record.goalsFor, record.goalsAgainst]));
  const chartWidth = 760, chartTop = 18, chartBase = 194;
  const groupWidth = (chartWidth - 48) / Math.max(1, played);
  chart.innerHTML = `<line x1="28" y1="${chartBase}" x2="752" y2="${chartBase}" stroke="#dce2e5" stroke-width="2"/>` + records.map((record, index) => {
    const center = 28 + groupWidth * (index + .5);
    const barWidth = Math.min(26, groupWidth * .22);
    const forHeight = (record.goalsFor / maxGoals) * (chartBase - chartTop);
    const againstHeight = (record.goalsAgainst / maxGoals) * (chartBase - chartTop);
    const matchName = record.match.away.replace(/^(HandStats Local|handstats local)$/i, '').trim() || record.match.home;
    return `<g><rect x="${center - barWidth - 3}" y="${chartBase - forHeight}" width="${barWidth}" height="${forHeight}" rx="5" fill="#e9621d"/><rect x="${center + 3}" y="${chartBase - againstHeight}" width="${barWidth}" height="${againstHeight}" rx="5" fill="#59636b"/><text x="${center - barWidth / 2 - 3}" y="${chartBase - forHeight - 7}" text-anchor="middle" font-size="12" font-weight="750" fill="#343c42">${record.goalsFor}</text><text x="${center + barWidth / 2 + 3}" y="${chartBase - againstHeight - 7}" text-anchor="middle" font-size="12" font-weight="750" fill="#343c42">${record.goalsAgainst}</text><text x="${center}" y="220" text-anchor="middle" font-size="11" fill="#6c777e">${escapeHtml(matchName.slice(0, 18))}</text><text x="${center}" y="238" text-anchor="middle" font-size="10" fill="#98a0a5">${escapeHtml(record.match.date.slice(5))}</text></g>`;
  }).join('');

  const actionStats = [
    { label: 'Goles', value: ownGoals, color: '#e9621d' },
    { label: 'Penaltis', value: ownPenaltyShots.length, color: '#b77bdd' },
    { label: 'Asistencias', value: events.filter(({ event, side }) => event.action === 'Asistencia' && event.team === side).length, color: '#f0a44d' },
    { label: 'Golpes francos', value: freeThrows, color: '#dcbe54' },
    { label: 'Robos', value: events.filter(({ event, side }) => event.action === 'Robo' && event.team === side).length, color: '#4b9b70' },
    { label: 'Blocajes', value: events.filter(({ event, side }) => event.action === 'Blocaje' && event.team === side).length, color: '#488eaa' },
    { label: 'Pérdidas', value: events.filter(({ event, side }) => event.action.startsWith('Pérdida') && event.team === side).length, color: '#d86e65' },
    { label: 'Exclusiones de 2 min', value: events.filter(({ event, side }) => event.action === '2 min' && event.team === side).length, color: '#9a78b8' },
  ];
  const maxAction = Math.max(1, ...actionStats.map((item) => item.value));
  get<HTMLElement>('#generalActionBreakdown').innerHTML = actionStats.map((item) => `<div class="action-stat-row"><div><span>${item.label}</span><strong>${item.value}</strong></div><div class="action-stat-track"><i style="width:${item.value / maxAction * 100}%;background:${item.color}"></i></div></div>`).join('');

  const playerStats = new Map<string, GeneralPlayerStat>();
  const ensurePlayer = (name: string): GeneralPlayerStat => {
    const existing = playerStats.get(name);
    if (existing) return existing;
    const created: GeneralPlayerStat = { goals: 0, assists: 0, freeThrows: 0, twoMin: 0, yellow: 0, red: 0, steals: 0, blocks: 0, losses: 0 };
    playerStats.set(name, created);
    return created;
  };
  records.forEach(({ events: matchEvents, side }) => {
    matchEvents.forEach((event) => {
      if (event.action === 'Gol' && event.attackingTeam === side && event.shooter) ensurePlayer(event.shooter).goals++;
      if (event.team !== side) return;
      const person = ensurePlayer(event.player);
      if (event.action === 'Asistencia') person.assists++;
      if (event.action === 'Golpe franco' || event.action === '7 m provocado') person.freeThrows++;
      if (event.action === '2 min') person.twoMin++;
      if (event.action === 'Tarjeta amarilla') person.yellow++;
      if (event.action === 'Tarjeta roja') person.red++;
      if (event.action === 'Robo') person.steals++;
      if (event.action === 'Blocaje') person.blocks++;
      if (event.action.startsWith('Pérdida')) person.losses++;
    });
  });
  const playerQuery = generalPlayerSearch.value.trim().toLocaleLowerCase('es');
  const rows = [...playerStats.entries()].filter(([name]) => name.toLocaleLowerCase('es').includes(playerQuery)).sort((a, b) => {
    const comparison = generalPlayerSortKey === 'name'
      ? a[0].localeCompare(b[0], 'es')
      : a[1][generalPlayerSortKey] - b[1][generalPlayerSortKey];
    return comparison * generalPlayerSortDirection || a[0].localeCompare(b[0], 'es');
  });
  generalStatsPage.querySelectorAll<HTMLButtonElement>('.sort-toggle').forEach((button) => {
    const active = button.dataset.sort === generalPlayerSortKey;
    button.textContent = active ? (generalPlayerSortDirection === 1 ? '↑' : '↓') : '↕';
    button.setAttribute('aria-label', `Ordenar ${button.parentElement?.querySelector('span')?.textContent ?? ''} ${active && generalPlayerSortDirection === 1 ? 'de mayor a menor' : 'de menor a mayor'}`);
    button.parentElement?.setAttribute('aria-sort', active ? (generalPlayerSortDirection === 1 ? 'ascending' : 'descending') : 'none');
  });
  get<HTMLElement>('#generalPlayerRows').innerHTML = rows.length ? rows.map(([name, stats]) => `<tr><td><button class="individual-player-open" type="button" data-player-name="${escapeHtml(name)}" aria-label="Ver estadísticas de ${escapeHtml(name)}">${escapeHtml(name)} <span>↗</span></button></td><td>${stats.goals}</td><td>${stats.assists}</td><td>${stats.freeThrows}</td><td>${stats.twoMin}</td><td>${stats.yellow}</td><td>${stats.red}</td><td>${stats.steals}</td><td>${stats.blocks}</td><td>${stats.losses}</td></tr>`).join('') : '<tr><td colspan="10">No hay datos para los filtros seleccionados</td></tr>';
  renderGeneralHeatmaps();
}

function closeIndividualPlayer(): void {
  individualPlayerModal.classList.remove('open');
  individualPlayerModal.setAttribute('aria-hidden', 'true');
  individualPlayerBackdrop.hidden = true;
}

function openIndividualPlayer(name: string, resetFilters = true): void {
  if (resetFilters) {
    individualPlayerCategory = 'Ofensivas';
    individualPlayerAction = 'Todas';
    individualMapMode = 'effectiveness';
  }
  const records = getFilteredGeneralMatchData();
  const isKeeper = Object.values(goalkeepersByTeam).flat().some((player) => player.name === name);
  const playerEvents = records.flatMap(({ events, side, match }) => events.filter((event) => {
    const involved = event.player === name || event.shooter === name || event.keeper === name;
    return involved && (event.team === side || event.attackingTeam === side || event.defendingTeam === side) && Boolean(match);
  }).map((event) => ({ event, side })));
  const count = (predicate: (event: MatchEvent, side: Team) => boolean): number => playerEvents.filter(({ event, side }) => predicate(event, side)).length;
  const shots = playerEvents.filter(({ event, side }) => event.shooter === name && event.attackingTeam === side && SHOT_ACTIONS.includes(event.action));
  const goals = shots.filter(({ event }) => event.action === 'Gol').length;
  const penaltyAttempts = shots.filter(({ event }) => event.isPenalty);
  const penaltyGoals = penaltyAttempts.filter(({ event }) => event.action === 'Gol').length;
  const saves = count((event, side) => event.keeper === name && event.action === 'Parada' && event.defendingTeam === side);
  const faced = count((event, side) => event.keeper === name && SHOT_ACTIONS.includes(event.action) && event.defendingTeam === side);
  const individual = [
    ['Goles', goals], ['Lanzamientos', shots.length], ['Efectividad de lanzamiento', shots.length ? `${Math.round(goals / shots.length * 100)}%` : '—'],
    ['Penaltis anotados', penaltyGoals], ['Penaltis lanzados', penaltyAttempts.length], ['Efectividad de penalti', penaltyAttempts.length ? `${Math.round(penaltyGoals / penaltyAttempts.length * 100)}%` : '—'],
    ['Asistencias', count((event, side) => event.player === name && event.team === side && event.action === 'Asistencia')],
    ['Pérdidas', count((event, side) => event.player === name && event.team === side && event.action.startsWith('Pérdida'))],
    ['7 m provocados', count((event, side) => event.player === name && event.team === side && event.action === '7 m provocado')],
    ['Golpes francos', count((event, side) => event.player === name && event.team === side && event.action === 'Golpe franco')],
    ['Faltas en ataque', count((event, side) => event.player === name && event.team === side && event.action === 'Falta en ataque')],
    ['Robos', count((event, side) => event.player === name && event.team === side && event.action === 'Robo')],
    ['Blocajes', count((event, side) => event.player === name && event.team === side && event.action === 'Blocaje')],
    ['Interceptaciones', count((event, side) => event.player === name && event.team === side && event.action === 'Interceptación')],
    ['Faltas defensivas', count((event, side) => event.player === name && event.team === side && event.action === 'Falta defensiva')],
    ['Paradas', saves], ['Lanzamientos recibidos', faced], ['Efectividad de paradas', faced ? `${Math.round(saves / faced * 100)}%` : '—'],
    ['Exclusiones de 2 min', count((event, side) => event.player === name && event.team === side && event.action === '2 min')],
    ['Tarjetas amarillas', count((event, side) => event.player === name && event.team === side && event.action === 'Tarjeta amarilla')],
    ['Tarjetas rojas', count((event, side) => event.player === name && event.team === side && event.action === 'Tarjeta roja')],
  ];
  get<HTMLElement>('#individualPlayerName').textContent = name;
  get<HTMLElement>('#individualPlayerContext').textContent = `${isKeeper ? 'Portero' : 'Jugador'} · ${records.length} ${records.length === 1 ? 'partido' : 'partidos'} según los filtros seleccionados`;
  const isOffensiveAction = (event: MatchEvent, side: Team): boolean => event.shooter === name || (event.player === name && event.attackingTeam === side);
  const isDefensiveAction = (event: MatchEvent, side: Team): boolean => event.keeper === name || (event.player === name && event.defendingTeam === side);
  const actionsByCategory: Record<'Ofensivas' | 'Defensivas', string[]> = {
    Ofensivas: ['Gol', 'Lanzamiento fallado', 'Penaltis', 'Contraataques', ...(preparationContext ? ['1 contra 1'] : []), 'Asistencia', 'Pérdida', 'Pérdida · Fallo de pase', 'Pérdida · Fallo de recepción', 'Pérdida · Dobles', 'Pérdida · Pasos', '7 m provocado', 'Golpe franco', 'Falta en ataque', 'Penetración'],
    Defensivas: ['Parada', 'Contraataques', 'Robo', 'Blocaje', 'Interceptación', 'Falta defensiva', 'Penalti cometido', '2 min', 'Tarjeta amarilla', 'Tarjeta roja'],
  };
  const availableActions = actionsByCategory[individualPlayerCategory];
  if (individualPlayerAction !== 'Todas' && !availableActions.includes(individualPlayerAction)) individualPlayerAction = 'Todas';
  const actionMatches = (event: MatchEvent): boolean => individualPlayerAction === 'Todas' ||
    (individualPlayerAction === 'Penaltis' ? Boolean(event.isPenalty) : individualPlayerAction === 'Contraataques' ? Boolean(event.isCounterattack) && SHOT_ACTIONS.includes(event.action) : individualPlayerAction === 'Pérdida' ? event.action.startsWith('Pérdida') : event.action === individualPlayerAction);
  // El mapa usa exclusivamente la posición guardada en el evento del partido; si falta, no dibujamos un punto estimado.
  const fieldPoints = playerEvents.filter(({ event, side }) => event.position && (individualPlayerCategory === 'Ofensivas' ? isOffensiveAction(event, side) : isDefensiveAction(event, side)) && actionMatches(event)).map(({ event }) => ({ position: event.position!, success: mapActionSuccess(event, individualPlayerCategory === 'Defensivas') }));
  const courtSvg = `<svg class="individual-court" id="individualActionHeatmap" viewBox="0 0 920 440" role="img" aria-label="Mapa de acciones de ${escapeHtml(name)}"><image href="/handball-court.svg" x="0" y="0" width="920" height="440" preserveAspectRatio="none"/></svg>`;
  const zoneNames = ['Arriba izquierda', 'Arriba centro', 'Arriba derecha', 'Centro izquierda', 'Centro', 'Centro derecha', 'Abajo izquierda', 'Abajo centro', 'Abajo derecha'];
  const goalZones = zoneNames.map((zone) => {
    const zoneShots = shots.filter(({ event }) => event.target === zone && (individualPlayerAction !== 'Penaltis' || event.isPenalty) && (individualPlayerAction !== 'Contraataques' || event.isCounterattack));
    const zoneGoals = zoneShots.filter(({ event }) => event.action === 'Gol').length;
    const zoneSaves = playerEvents.filter(({ event, side }) => event.keeper === name && event.defendingTeam === side && event.target === zone && event.action === 'Parada').length;
    const attempts = isKeeper ? playerEvents.filter(({ event, side }) => event.keeper === name && event.defendingTeam === side && SHOT_ACTIONS.includes(event.action) && event.target === zone).length : zoneShots.length;
    const success = isKeeper ? zoneSaves : zoneGoals;
    const pct = attempts ? Math.round(success / attempts * 100) : 0;
    const color = attempts ? (pct >= 65 ? '#46b77a' : pct >= 35 ? '#f1cc5c' : '#eb7066') : '#f1f5f8';
    return `<div class="individual-goal-zone" style="background:${color}"><strong>${attempts ? `${success}/${attempts}` : '—'}</strong><small>${attempts ? `${pct}%` : zone}</small></div>`;
  }).join('');
  const goalLabel = isKeeper ? 'Portería · paradas por zona' : 'Portería · lanzamientos por zona';
  const categoryActions = availableActions;
  get<HTMLElement>('#individualPlayerContent').innerHTML = `<section class="individual-summary"><h3>Rendimiento individual</h3><div class="individual-stat-grid">${individual.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('')}</div></section><section class="individual-maps"><article class="individual-map-card"><h3>Mapa de acciones en el campo</h3><p>Elige la clase y la acción que quieres consultar</p><div class="individual-map-filters"><div class="individual-category-switch" role="group" aria-label="Clase de acciones">${(['Ofensivas', 'Defensivas'] as const).map((category) => `<button type="button" data-individual-category="${category}" class="${individualPlayerCategory === category ? 'selected' : ''}" aria-pressed="${individualPlayerCategory === category}">${category}</button>`).join('')}</div><div class="individual-action-carousel"><button class="individual-filter-arrow" type="button" data-individual-scroll="-1" aria-label="Ver acciones anteriores">‹</button><div class="individual-action-track" role="group" aria-label="Tipo de acción"><button type="button" data-individual-action="Todas" class="${individualPlayerAction === 'Todas' ? 'selected' : ''}" aria-pressed="${individualPlayerAction === 'Todas'}">Todas</button>${categoryActions.map((action) => `<button type="button" data-individual-action="${escapeHtml(action)}" class="${individualPlayerAction === action ? 'selected' : ''}" aria-pressed="${individualPlayerAction === action}">${escapeHtml(action)}</button>`).join('')}</div><button class="individual-filter-arrow" type="button" data-individual-scroll="1" aria-label="Ver más acciones">›</button></div></div><div class="map-mode-switch individual-map-mode-switch" id="individualMapModeControl" role="group" aria-label="Modo de visualización"><button type="button" data-individual-map-mode="effectiveness" class="${individualMapMode === 'effectiveness' ? 'selected' : ''}" aria-pressed="${individualMapMode === 'effectiveness'}">Efectividad</button><button type="button" data-individual-map-mode="frequency" class="${individualMapMode === 'frequency' ? 'selected' : ''}" aria-pressed="${individualMapMode === 'frequency'}">Frecuencia</button><button type="button" data-individual-map-mode="points" class="${individualMapMode === 'points' ? 'selected' : ''}" aria-pressed="${individualMapMode === 'points'}">Puntos</button></div><div class="individual-field-wrap">${courtSvg}${fieldPoints.length ? '' : '<span id="individualMapEmpty" class="individual-map-empty">Sin acciones de este tipo en el periodo seleccionado</span>'}</div><div class="individual-legend"><span>● Acción exitosa</span><span>● Acción no exitosa</span></div></article><article class="individual-map-card"><h3>${goalLabel}</h3><p>${isKeeper ? 'Paradas / lanzamientos recibidos' : 'Goles / lanzamientos realizados'} en cada zona</p><div class="individual-goal-grid">${goalZones}</div><div class="individual-legend"><span>● Efectividad alta</span><span>● Media</span><span>● Baja</span></div></article></section>`;
  if (preparationContext) {
    const individualContent = get<HTMLElement>('#individualPlayerContent');
    const metrics = document.createElement('section');
    metrics.className = 'preparation-metrics individual-preparation-metrics';
    individualContent.insertBefore(metrics, individualContent.querySelector('.individual-maps'));
    renderPreparationMetrics(metrics, playerEvents.filter(({ event, side }) => isOffensiveAction(event, side)).map(({ event }) => event));
  }
  const individualFieldWrap = get<HTMLElement>('.individual-field-wrap', get<HTMLElement>('#individualPlayerContent'));
  let individualMapEmpty = individualFieldWrap.querySelector<HTMLElement>('#individualMapEmpty');
  if (!individualMapEmpty) {
    individualMapEmpty = document.createElement('span');
    individualMapEmpty.id = 'individualMapEmpty';
    individualMapEmpty.className = 'individual-map-empty';
    individualMapEmpty.textContent = 'Sin acciones de este tipo en el periodo seleccionado';
    individualFieldWrap.append(individualMapEmpty);
  }
  renderHeatmap(get<SVGSVGElement>('#individualActionHeatmap'), individualMapEmpty, fieldPoints, individualMapMode);
  const individualLegend = individualFieldWrap.parentElement!.querySelector<HTMLElement>('.individual-legend')!;
  individualLegend.innerHTML = individualMapMode === 'effectiveness'
    ? '<span><i class="heat-bad"></i>Baja</span><span><i class="heat-mid"></i>Media</span><span><i class="heat-good"></i>Alta</span>'
    : individualMapMode === 'frequency'
      ? '<span><i class="frequency-low"></i>Menos acciones</span><span><i class="frequency-high"></i>Más acciones</span>'
      : '<span><i class="heat-good"></i>Acción exitosa</span><span><i class="heat-bad"></i>Acción no exitosa</span>';
  const actionTrack = get<HTMLElement>('.individual-action-track', get<HTMLElement>('#individualPlayerContent'));
  const selectedActionButton = actionTrack.querySelector<HTMLElement>('[data-individual-action].selected');
  if (selectedActionButton) actionTrack.scrollLeft = Math.max(0, selectedActionButton.offsetLeft - (actionTrack.clientWidth - selectedActionButton.clientWidth) / 2);
  individualPlayerBackdrop.hidden = false;
  individualPlayerModal.classList.add('open');
  individualPlayerModal.setAttribute('aria-hidden', 'false');
  individualPlayerModal.focus();
}

function openMatchForm(): void {
  matchModal.classList.add('open');
  matchModal.setAttribute('aria-hidden', 'false');
  matchModalBackdrop.hidden = false;
  matchFormError.hidden = true;
  if (preparationContext) get<HTMLInputElement>('[name="home"]', matchForm).value = preparationContext.name;
  get<HTMLInputElement>('[name="date"]').value ||= new Date().toISOString().slice(0, 10);
  get<HTMLInputElement>('[name="time"]').value ||= '18:00';
  get<HTMLInputElement>('[name="competition"]').focus();
}

function closeMatchForm(): void {
  matchModal.classList.remove('open');
  matchModal.setAttribute('aria-hidden', 'true');
  matchModalBackdrop.hidden = true;
}

function startMatch(match: Match, mode: 'view' | 'replay' | 'single' | 'stats' = 'view', manualTime: string | null = null): void {
  activeMatch = match;
  if (preparationContext) {
    const own = match.squad ?? preparationContext.roster.filter((player) => !player.injured);
    const rival = match.opponents ?? [];
    const ownSide = ourSideForMatch(match);
    homePlayers = ownSide === 'Local' ? own : rival;
    awayPlayers = ownSide === 'Visitante' ? own : rival;
    const keepers = (players: Player[]) => { const selected = players.filter((player) => /portero|portera/i.test(player.position ?? '')); return selected.length ? selected : players; };
    goalkeepersByTeam = { Local: keepers(homePlayers), Visitante: keepers(awayPlayers) };
    refreshPlayerSelections();
  }
  finishedEntryMode = match.status === 'Finalizado' && (mode === 'replay' || mode === 'single') ? mode : null;
  manualEventTime = finishedEntryMode === 'single' ? manualTime : null;
  liveStatsReadOnly = mode === 'stats' || (match.status === 'Finalizado' && !finishedEntryMode);
  if (finishedEntryMode) {
    match.timerElapsedMs = mode === 'single' && manualTime ? (Number(manualTime.split(':')[0]) * 60 + Number(manualTime.split(':')[1])) * 1000 : 0;
    match.timerRunning = mode === 'replay';
    match.timerStartedAt = match.timerRunning ? Date.now() : undefined;
  }
  if (!liveStatsReadOnly && !finishedEntryMode && match.status !== 'En juego') {
    match.status = 'En juego';
  }
  if (!liveStatsReadOnly && match.timerElapsedMs === undefined) match.timerElapsedMs = 0;
  if (!liveStatsReadOnly && match.timerRunning === undefined) {
    match.timerRunning = true;
    match.timerStartedAt = Date.now();
  } else if (!liveStatsReadOnly && match.timerRunning && !match.timerStartedAt) {
    match.timerStartedAt = Date.now();
  }
  if (liveStatsReadOnly && mode !== 'stats') {
    match.timerRunning = false;
    match.timerElapsedMs ??= MATCH_DURATION_MINUTES * 60_000;
    match.timerStartedAt = undefined;
  }
  clockControls.hidden = liveStatsReadOnly || finishedEntryMode === 'single';
  renderChronometer();
  renderMatches();
  if (!eventsByMatch.has(match.id)) eventsByMatch.set(match.id, []);
  liveStatsTeam = preparationContext ? ourSideForMatch(match) : 'Local';
  get<HTMLButtonElement>('[data-map-filter="1 contra 1"]').hidden = !preparationContext;
  document.querySelectorAll<HTMLButtonElement>('[data-live-team]').forEach((button) => { const selected = button.dataset.liveTeam === liveStatsTeam; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
  liveMapFilter = 'Todas';
  liveMapFilterControl.querySelectorAll<HTMLButtonElement>('[data-map-filter]').forEach((button) => {
    const selected = button.dataset.mapFilter === 'Todas';
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  liveMapFilterControl.scrollTo({ left: 0, behavior: 'smooth' });
  get<HTMLParagraphElement>('#currentMatchLabel').textContent = `${match.home} · ${match.away} | ${match.competition}`;
  get<HTMLParagraphElement>('#liveMatchLabel').textContent = `${match.home} · ${match.away} | ${match.competition}`;
  get<HTMLElement>('#topLocalName').textContent = match.home;
  get<HTMLElement>('#topVisitorName').textContent = match.away;
  liveStatsTrigger.hidden = liveStatsReadOnly;
  get<HTMLButtonElement>('#liveStatsBack').innerHTML = liveStatsReadOnly ? '<span class="arrow">←</span>Volver a partidos' : '<span class="arrow">←</span>Volver al partido';
  updateScore();
  if (preparationContext && mode !== 'stats') saveMatchData();
  matchesPage.classList.remove('active');
  matchesPage.setAttribute('aria-hidden', 'true');
  if (liveStatsReadOnly) {
    openLiveStats();
    return;
  }
  playersPage.classList.remove('hidden');
}

function renderChronometer(): void {
  clockValue.textContent = formatChronometer(elapsedMatchMs(activeMatch));
  const running = Boolean(activeMatch?.timerRunning && (activeMatch.status !== 'Finalizado' || finishedEntryMode === 'replay'));
  get<HTMLButtonElement>('#pauseClock').disabled = !running;
  get<HTMLButtonElement>('#resumeClock').disabled = running || !activeMatch || (activeMatch.status === 'Finalizado' && finishedEntryMode !== 'replay');
}

function pauseChronometer(): void {
  if (!activeMatch || (activeMatch.status === 'Finalizado' && finishedEntryMode !== 'replay') || !activeMatch.timerRunning) return;
  activeMatch.timerElapsedMs = elapsedMatchMs(activeMatch);
  activeMatch.timerRunning = false;
  activeMatch.timerStartedAt = undefined;
  renderChronometer();
  updateLivePossessionProjection();
}

function resumeChronometer(): void {
  if (!activeMatch || (activeMatch.status === 'Finalizado' && finishedEntryMode !== 'replay') || activeMatch.timerRunning) return;
  activeMatch.timerRunning = true;
  activeMatch.timerStartedAt = Date.now();
  renderChronometer();
  updateLivePossessionProjection();
}

function adjustChronometer(seconds: number): void {
  if (!activeMatch || (activeMatch.status === 'Finalizado' && finishedEntryMode !== 'replay')) return;
  activeMatch.timerElapsedMs = Math.max(0, elapsedMatchMs(activeMatch) + seconds * 1000);
  if (activeMatch.timerRunning) activeMatch.timerStartedAt = Date.now();
  renderChronometer();
  updateLivePossessionProjection();
}

renderMatches();
renderRoster();

function closeMenu(): void {
  sideMenu.classList.remove('open');
  sideMenu.setAttribute('aria-hidden', 'true');
  menuBackdrop.hidden = true;
  menuTrigger.setAttribute('aria-expanded', 'false');
}

function openMenu(): void {
  sideMenu.classList.add('open');
  sideMenu.setAttribute('aria-hidden', 'false');
  menuBackdrop.hidden = false;
  menuTrigger.setAttribute('aria-expanded', 'true');
}

function showMenuPage(page: 'partidos' | 'plantilla' | 'preparacion'): void {
  closeMenu();
  appShell.classList.toggle('general-overview', page === 'preparacion');
  homePage.classList.remove('active');
  preparationDetailPage.classList.remove('active');
  get<HTMLElement>('.matches-heading h1').textContent = preparationContext ? `Partidos · ${preparationContext.name}` : 'Partidos';
  get<HTMLElement>('.roster-page-heading .page-title').innerHTML = `<span class="title-icon">◉</span>${preparationContext ? `Plantilla · ${escapeHtml(preparationContext.name)}` : 'Plantilla'}`;
  get<HTMLButtonElement>('#matchesHome').innerHTML = `<span class="arrow">←</span>${preparationContext ? 'Volver al equipo' : 'Inicio'}`;
  get<HTMLButtonElement>('#rosterBack').innerHTML = `<span class="arrow">←</span>${preparationContext ? 'Volver al equipo' : 'Inicio'}`;
  preparationPage.classList.toggle('active', page === 'preparacion');
  preparationPage.setAttribute('aria-hidden', String(page !== 'preparacion'));
  matchesPage.classList.toggle('active', page === 'partidos');
  matchesPage.setAttribute('aria-hidden', String(page !== 'partidos'));
  rosterPage.classList.toggle('active', page === 'plantilla');
  rosterPage.setAttribute('aria-hidden', String(page !== 'plantilla'));
  playersPage.classList.add('hidden');
  liveStatsPage.classList.remove('active');
  liveStatsPage.setAttribute('aria-hidden', 'true');
  generalStatsPage.classList.remove('active');
  generalStatsPage.setAttribute('aria-hidden', 'true');
  if (page === 'partidos') {
    actionsPage.classList.remove('active');
    shotPage.classList.remove('active');
    fieldActionPage.classList.remove('active');
    actionsPage.setAttribute('aria-hidden', 'true');
    shotPage.setAttribute('aria-hidden', 'true');
    fieldActionPage.setAttribute('aria-hidden', 'true');
  } else {
    playersPage.classList.add('hidden');
    actionsPage.classList.remove('active');
    shotPage.classList.remove('active');
    fieldActionPage.classList.remove('active');
  }
}

function openGeneralStats(): void {
  closeMenu();
  get<HTMLElement>('.general-stats-heading h1').textContent = preparationContext ? `Estadísticas · ${preparationContext.name}` : 'Estadísticas generales';
  get<HTMLButtonElement>('#generalStatsHome').innerHTML = `<span class="arrow">←</span>${preparationContext ? 'Volver al equipo' : 'Inicio'}`;
  appShell.classList.add('general-overview');
  [homePage, matchesPage, rosterPage, preparationPage, preparationDetailPage, playersPage, actionsPage, shotPage, fieldActionPage, liveStatsPage].forEach((page) => {
    page.classList.remove('active');
    page.setAttribute('aria-hidden', 'true');
  });
  playersPage.classList.add('hidden');
  generalStatsPage.classList.add('active');
  generalStatsPage.setAttribute('aria-hidden', 'false');
  populateGeneralMatchFilter();
  renderGeneralStats();
}

function closeGeneralStats(): void {
  if (preparationContext) { generalStatsPage.classList.remove('active'); openPreparationDetail(); return; }
  appShell.classList.remove('general-overview');
  generalStatsPage.classList.remove('active');
  generalStatsPage.setAttribute('aria-hidden', 'true');
  homePage.classList.add('active');
  homePage.setAttribute('aria-hidden', 'false');
}

get<HTMLButtonElement>('.players-page .footer .nav-button').addEventListener('click', () => {
  if (finishedEntryMode === 'replay' && activeMatch) { activeMatch.timerElapsedMs = elapsedMatchMs(activeMatch); activeMatch.timerRunning = false; activeMatch.timerStartedAt = undefined; saveMatchData(); }
  finishedEntryMode = null;
  manualEventTime = null;
  playersPage.classList.add('hidden');
  matchesPage.classList.add('active');
  matchesPage.setAttribute('aria-hidden', 'false');
  homePage.classList.remove('active');
});
get<HTMLButtonElement>('#rosterBack').addEventListener('click', () => {
  if (preparationContext) { rosterPage.classList.remove('active'); openPreparationDetail(); return; }
  rosterPage.classList.remove('active');
  rosterPage.setAttribute('aria-hidden', 'true');
  homePage.classList.add('active');
});
get<HTMLButtonElement>('#generalStatsHome').addEventListener('click', closeGeneralStats);
get<HTMLButtonElement>('#preparationHome').addEventListener('click', () => {
  preparationPage.classList.remove('active');
  preparationPage.setAttribute('aria-hidden', 'true');
  appShell.classList.remove('general-overview');
  homePage.classList.add('active');
  homePage.setAttribute('aria-hidden', 'false');
});
[generalVenueFilter, generalMatchFilter, generalDateFrom, generalDateTo, generalActionFilter].forEach((control) => {
  control.addEventListener('change', renderGeneralStats);
});
generalPlayerSearch.addEventListener('input', renderGeneralStats);
generalMapSideControl.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-general-map-side]');
  if (!button) return;
  generalMapSideControl.querySelectorAll<HTMLButtonElement>('[data-general-map-side]').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  renderGeneralHeatmaps();
});
generalMapActionFilter.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-general-map-action]');
  if (!button) return;
  generalMapActionFilter.querySelectorAll<HTMLButtonElement>('[data-general-map-action]').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  renderGeneralHeatmaps();
});
generalMapModeControl.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-general-map-mode]');
  if (!button) return;
  generalMapModeControl.querySelectorAll<HTMLButtonElement>('[data-general-map-mode]').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  renderGeneralHeatmaps();
});
get<HTMLElement>('.general-action-carousel').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-general-map-scroll]');
  if (!button) return;
  generalMapActionFilter.scrollBy({ left: Number(button.dataset.generalMapScroll) * 250, behavior: 'smooth' });
});
get<HTMLTableElement>('.general-player-table').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const playerButton = target.closest<HTMLButtonElement>('.individual-player-open');
  if (playerButton?.dataset.playerName) {
    openIndividualPlayer(playerButton.dataset.playerName);
    return;
  }
  const button = target.closest<HTMLButtonElement>('.sort-toggle');
  const key = button?.dataset.sort as GeneralPlayerSortKey | undefined;
  if (!key) return;
  if (generalPlayerSortKey === key) generalPlayerSortDirection = generalPlayerSortDirection === 1 ? -1 : 1;
  else {
    generalPlayerSortKey = key;
    generalPlayerSortDirection = 1;
  }
  renderGeneralStats();
});
get<HTMLButtonElement>('#closeIndividualPlayer').addEventListener('click', closeIndividualPlayer);
individualPlayerBackdrop.addEventListener('click', closeIndividualPlayer);
get<HTMLElement>('#individualPlayerContent').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const categoryButton = target.closest<HTMLButtonElement>('[data-individual-category]');
  const actionButton = target.closest<HTMLButtonElement>('[data-individual-action]');
  const scrollButton = target.closest<HTMLButtonElement>('[data-individual-scroll]');
  const modeButton = target.closest<HTMLButtonElement>('[data-individual-map-mode]');
  const mode = modeButton?.dataset.individualMapMode;
  if (mode === 'effectiveness' || mode === 'frequency' || mode === 'points') {
    individualMapMode = mode;
    openIndividualPlayer(get<HTMLElement>('#individualPlayerName').textContent ?? '', false);
  } else if (categoryButton) {
    const category = categoryButton.dataset.individualCategory;
    if (category !== 'Ofensivas' && category !== 'Defensivas') return;
    individualPlayerCategory = category;
    individualPlayerAction = 'Todas';
    openIndividualPlayer(get<HTMLElement>('#individualPlayerName').textContent ?? '', false);
  } else if (scrollButton) {
    get<HTMLElement>('.individual-action-track', get<HTMLElement>('#individualPlayerContent')).scrollBy({ left: Number(scrollButton.dataset.individualScroll) * 230, behavior: 'smooth' });
  } else if (actionButton?.dataset.individualAction) {
    individualPlayerAction = actionButton.dataset.individualAction;
    openIndividualPlayer(get<HTMLElement>('#individualPlayerName').textContent ?? '', false);
  }
});
get<HTMLButtonElement>('#generalFilterReset').addEventListener('click', () => {
  generalVenueFilter.value = 'all';
  generalMatchFilter.value = 'all';
  generalDateFrom.value = '';
  generalDateTo.value = '';
  generalActionFilter.value = 'all';
  generalPlayerSearch.value = '';
  renderGeneralStats();
});
document.querySelectorAll<HTMLButtonElement>('.home-choice').forEach((button) => {
  button.addEventListener('click', () => {
    const page = button.dataset.page;
    if (page === 'partidos' || page === 'plantilla' || page === 'preparacion') showMenuPage(page);
    if (page === 'estadisticas-generales') openGeneralStats();
  });
});
menuTrigger.addEventListener('click', () => menuTrigger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());
menuBackdrop.addEventListener('click', closeMenu);
liveStatsTrigger.addEventListener('click', openLiveStats);
get<HTMLButtonElement>('#pauseClock').addEventListener('click', pauseChronometer);
get<HTMLButtonElement>('#resumeClock').addEventListener('click', resumeChronometer);
get<HTMLButtonElement>('#clockMinusSecond').addEventListener('click', () => adjustChronometer(-1));
get<HTMLButtonElement>('#clockPlusSecond').addEventListener('click', () => adjustChronometer(1));
get<HTMLButtonElement>('#liveStatsBack').addEventListener('click', closeLiveStats);
liveMapFilterControl.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-map-filter]');
  if (!button) return;
  liveMapFilter = button.dataset.mapFilter ?? 'Todas';
  liveMapFilterControl.querySelectorAll<HTMLButtonElement>('[data-map-filter]').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  renderLiveStats();
});
get<HTMLElement>('#liveMapModeControl').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-live-map-mode]');
  const mode = button?.dataset.liveMapMode;
  if (mode !== 'effectiveness' && mode !== 'frequency' && mode !== 'points') return;
  liveMapMode = mode;
  get<HTMLElement>('#liveMapModeControl').querySelectorAll<HTMLButtonElement>('[data-live-map-mode]').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  renderLiveStats();
});
get<HTMLButtonElement>('#mapFilterPrev').addEventListener('click', () => liveMapFilterControl.scrollBy({ left: -280, behavior: 'smooth' }));
get<HTMLButtonElement>('#mapFilterNext').addEventListener('click', () => liveMapFilterControl.scrollBy({ left: 280, behavior: 'smooth' }));
window.setInterval(() => {
  renderChronometer();
  if (liveStatsPage.classList.contains('active')) updateLivePossessionProjection();
}, 1000);
get<HTMLDivElement>('.live-team-switch').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-live-team]');
  const team = button?.dataset.liveTeam;
  if (team !== 'Local' && team !== 'Visitante') return;
  liveStatsTeam = team;
  get<HTMLDivElement>('.live-team-switch').querySelectorAll<HTMLButtonElement>('[data-live-team]').forEach((choice) => {
    const selected = choice.dataset.liveTeam === team;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  renderLiveStats();
});
document.querySelectorAll<HTMLButtonElement>('.menu-item').forEach((button) => {
  button.addEventListener('click', () => {
    leavePreparationTeam();
    const page = button.dataset.page;
    if (page === 'partidos' || page === 'plantilla' || page === 'preparacion') showMenuPage(page);
    if (page === 'estadisticas-generales') openGeneralStats();
  });
});
document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu();
  if (event.key === 'Escape' && matchModal.classList.contains('open')) closeMatchForm();
  if (event.key === 'Escape' && playerModal.classList.contains('open')) closePlayerForm();
  if (event.key === 'Escape' && individualPlayerModal.classList.contains('open')) closeIndividualPlayer();
});
get<HTMLInputElement>('#matchSearch').addEventListener('input', renderMatches);
get<HTMLSelectElement>('#matchStatusFilter').addEventListener('change', renderMatches);
get<HTMLButtonElement>('#openMatchForm').addEventListener('click', openMatchForm);
get<HTMLButtonElement>('#closeMatchForm').addEventListener('click', closeMatchForm);
get<HTMLButtonElement>('#cancelMatchForm').addEventListener('click', closeMatchForm);
matchModalBackdrop.addEventListener('click', closeMatchForm);
get<HTMLButtonElement>('#matchesHome').addEventListener('click', () => {
  if (preparationContext) { matchesPage.classList.remove('active'); openPreparationDetail(); return; }
  matchesPage.classList.remove('active');
  matchesPage.setAttribute('aria-hidden', 'true');
  homePage.classList.add('active');
});
const timeDialog = document.createElement('dialog');
timeDialog.className = 'action-time-dialog';
timeDialog.setAttribute('aria-labelledby', 'actionTimeTitle');
timeDialog.innerHTML = `<form class="action-time-form"><div class="action-time-header"><div><span class="action-time-eyebrow">AÑADIR ACCIÓN</span><h2 id="actionTimeTitle">¿Cuándo ocurrió?</h2><p>Selecciona el minuto y el segundo del partido.</p></div><button type="button" class="modal-close" data-time-cancel aria-label="Cerrar">×</button></div><div class="action-time-pickers"><div class="action-time-column"><label for="actionTimeMinutes">Minutos</label><input id="actionTimeMinutes" type="number" inputmode="numeric" min="0" max="999" value="0" required><div class="action-time-wheel" data-time-wheel="minutes" aria-label="Seleccionar minutos"></div></div><span class="action-time-colon" aria-hidden="true">:</span><div class="action-time-column"><label for="actionTimeSeconds">Segundos</label><input id="actionTimeSeconds" type="number" inputmode="numeric" min="0" max="59" value="0" required><div class="action-time-wheel" data-time-wheel="seconds" aria-label="Seleccionar segundos"></div></div></div><p class="action-time-hint">Escribe el tiempo o desliza los números para seleccionarlo.</p><div class="action-time-actions"><button type="button" class="nav-button" data-time-cancel>Cancelar</button><button type="submit" class="create-match-button">Continuar <span>→</span></button></div></form>`;
document.body.append(timeDialog);
const timeForm = timeDialog.querySelector<HTMLFormElement>('form')!;
const minuteInput = timeDialog.querySelector<HTMLInputElement>('#actionTimeMinutes')!;
const secondInput = timeDialog.querySelector<HTMLInputElement>('#actionTimeSeconds')!;
let timeMatch: Match | null = null;
let timeTrigger: HTMLButtonElement | null = null;

function setupTimeWheel(input: HTMLInputElement, unit: string, maximum: number): void {
  const wheel = timeDialog.querySelector<HTMLElement>(`[data-time-wheel="${unit}"]`)!;
  wheel.innerHTML = Array.from({ length: maximum + 1 }, (_, value) => `<button type="button" data-value="${value}" aria-label="${value} ${unit === 'minutes' ? 'minutos' : 'segundos'}">${String(value).padStart(2, '0')}</button>`).join('');
  const select = (value: number, scroll: boolean): void => {
    const bounded = Math.max(0, Math.min(maximum, value));
    input.value = String(bounded);
    wheel.querySelectorAll('button.selected').forEach((button) => button.classList.remove('selected'));
    const button = wheel.children[bounded] as HTMLButtonElement;
    button.classList.add('selected');
    if (scroll) wheel.scrollTo({ top: bounded * 44, behavior: 'instant' });
  };
  wheel.addEventListener('scroll', () => select(Math.round(wheel.scrollTop / 44), false), { passive: true });
  wheel.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-value]');
    if (button) select(Number(button.dataset.value), true);
  });
  input.addEventListener('input', () => {
    if (input.value !== '' && input.validity.valid) select(Number(input.value), true);
  });
  select(0, true);
}
setupTimeWheel(minuteInput, 'minutes', 999);
setupTimeWheel(secondInput, 'seconds', 59);
timeDialog.querySelectorAll<HTMLButtonElement>('[data-time-cancel]').forEach((button) => button.addEventListener('click', () => timeDialog.close()));
timeDialog.addEventListener('click', (event) => { if (event.target === timeDialog) timeDialog.close(); });
timeDialog.addEventListener('close', () => { timeMatch = null; timeTrigger?.focus(); timeTrigger = null; });
timeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!timeMatch || !timeForm.reportValidity()) return;
  const match = timeMatch;
  const time = `${String(Number(minuteInput.value)).padStart(2, '0')}:${String(Number(secondInput.value)).padStart(2, '0')}`;
  timeDialog.close();
  startMatch(match, 'single', time);
});
const squadDialog = get<HTMLDialogElement>('#preparationSquadDialog');
const squadForm = get<HTMLFormElement>('#preparationSquadForm');
const squadPlayers = get<HTMLElement>('#squadPlayerList');
const squadOpponents = get<HTMLTextAreaElement>('#squadOpponents');
const squadError = get<HTMLElement>('#squadError');
let squadMatch: Match | null = null;
function openSquad(match: Match): void {
  if (!preparationContext) return;
  squadMatch = match;
  const selected = match.squad ?? preparationContext.roster.filter((player) => !player.injured);
  squadPlayers.innerHTML = preparationContext.roster.length ? preparationContext.roster.map((player, index) => `<label class="squad-player"><input type="checkbox" name="player" value="${index}" ${selected.some((item) => item.number === player.number) ? 'checked' : ''}><span><strong>${escapeHtml(player.number)} · ${escapeHtml(player.name)}</strong>${player.injured ? ' · Lesionado' : ''}</span></label>`).join('') : '<p>Añade jugadores a la plantilla del equipo para poder convocarlos.</p>';
  squadOpponents.value = (match.opponents ?? []).map((player) => `${player.number}, ${player.name}`).join('\n');
  squadError.hidden = true;
  squadDialog.showModal();
}
get<HTMLButtonElement>('#squadClose').addEventListener('click', () => squadDialog.close());
get<HTMLButtonElement>('#squadCancel').addEventListener('click', () => squadDialog.close());
squadDialog.addEventListener('click', (event) => { if (event.target === squadDialog) squadDialog.close(); });
squadForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!squadMatch || !preparationContext) return;
  const opponents: Player[] = [];
  for (const line of squadOpponents.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const found = /^(\d{1,3})\s*,\s*(.+)$/.exec(line);
    if (!found || opponents.some((player) => player.number === found[1])) { squadError.textContent = 'Escribe un jugador por línea con dorsal y nombre, sin repetir dorsales. Ejemplo: 10, Ana López.'; squadError.hidden = false; return; }
    opponents.push({ number: found[1], name: found[2].trim() });
  }
  squadMatch.squad = Array.from(squadPlayers.querySelectorAll<HTMLInputElement>('input:checked')).map((input) => ({ ...preparationContext!.roster[Number(input.value)] }));
  squadMatch.opponents = opponents;
  saveMatchData();
  squadDialog.close();
});
matchList.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-match-id]');
  if (!button) return;
  const match = matches.find((item) => item.id === Number(button.dataset.matchId));
  if (!match) return;
  const entry = button.dataset.entry;
  if (entry === 'squad') { openSquad(match); return; }
  if (entry === 'stats') { startMatch(match, 'stats'); return; }
  if (entry === 'finish') {
    if (window.confirm('¿Finalizar este partido? Podrás seguir consultando sus estadísticas.')) {
      match.timerElapsedMs = elapsedMatchMs(match); match.timerRunning = false; match.timerStartedAt = undefined; match.status = 'Finalizado'; saveMatchData(); renderMatches();
    }
    return;
  }
  if (entry === 'single') {
    timeMatch = match;
    timeTrigger = button;
    minuteInput.value = '0'; secondInput.value = '0';
    minuteInput.dispatchEvent(new Event('input')); secondInput.dispatchEvent(new Event('input'));
    timeDialog.showModal();
    minuteInput.focus();
  } else if (entry === 'replay') startMatch(match, 'replay');
  else startMatch(match);
});
matchForm.addEventListener('submit', (event: SubmitEvent) => {
  event.preventDefault();
  const formData = new FormData(matchForm);
  const home = String(formData.get('home') ?? '').trim();
  const away = String(formData.get('away') ?? '').trim();
  if (preparationContext && ![home, away].some((name) => name.toLocaleLowerCase('es') === preparationContext!.name.toLocaleLowerCase('es'))) {
    matchFormError.textContent = `Uno de los equipos debe ser ${preparationContext.name}.`;
    matchFormError.hidden = false;
    return;
  }
  if (home.toLocaleLowerCase('es') === away.toLocaleLowerCase('es')) {
    matchFormError.textContent = 'Los equipos local y visitante deben ser distintos.';
    matchFormError.hidden = false;
    return;
  }
  const match: Match = {
    id: Date.now(),
    competition: String(formData.get('competition') ?? '').trim(),
    home,
    away,
    date: String(formData.get('date') ?? ''),
    time: String(formData.get('time') ?? ''),
    venue: String(formData.get('venue') ?? '').trim(),
    status: preparationContext ? 'Pendiente' : 'En juego',
  };
  matches = [match, ...matches];
  saveMatchData();
  closeMatchForm();
  matchForm.reset();
  get<HTMLInputElement>('#matchSearch').value = '';
  get<HTMLSelectElement>('#matchStatusFilter').value = 'todos';
  renderMatches();
  if (preparationContext) openSquad(match);
  else startMatch(match);
});

get<HTMLInputElement>('#playerSearch').addEventListener('input', renderRoster);
get<HTMLSelectElement>('#playerStatusFilter').addEventListener('change', renderRoster);
get<HTMLButtonElement>('#addPlayerButton').addEventListener('click', () => openPlayerForm());
get<HTMLButtonElement>('#closePlayerForm').addEventListener('click', closePlayerForm);
get<HTMLButtonElement>('#cancelPlayerForm').addEventListener('click', closePlayerForm);
playerModalBackdrop.addEventListener('click', closePlayerForm);
rosterList.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-roster-action]');
  if (!button) return;
  const number = button.dataset.number;
  if (!number) return;
  const player = homePlayers.find((item) => item.number === number);
  if (!player) return;
  const action = button.dataset.rosterAction;
  if (action === 'edit') openPlayerForm(player);
  if (action === 'injury') {
    player.injured = !player.injured;
    refreshRosterData();
  }
  if (action === 'delete' && window.confirm(`¿Eliminar a ${player.name} de la plantilla?`)) {
    const index = homePlayers.indexOf(player);
    homePlayers.splice(index, 1);
    refreshRosterData();
  }
});
playerForm.addEventListener('submit', (event: SubmitEvent) => {
  event.preventDefault();
  const data = new FormData(playerForm);
  const name = String(data.get('name') ?? '').trim();
  const number = String(data.get('number') ?? '').trim();
  const injured = data.get('injured') === 'on';
  const duplicate = homePlayers.some((player) => player.number === number && player.number !== editingPlayerNumber);
  if (duplicate) {
    playerFormError.textContent = 'Ya existe un jugador con ese dorsal en el equipo seleccionado.';
    playerFormError.hidden = false;
    return;
  }
  const updated: Player = {
    number,
    name,
    injured,
    heightCm: Number(data.get('heightCm')) || undefined,
    weightKg: Number(data.get('weightKg')) || undefined,
    age: Number(data.get('age')) || undefined,
    position: String(data.get('position') ?? '').trim() || undefined,
  };
  if (editingPlayerNumber) {
    const index = homePlayers.findIndex((player) => player.number === editingPlayerNumber);
    if (index >= 0) homePlayers[index] = updated;
  } else {
    homePlayers.push(updated);
  }
  closePlayerForm();
  refreshRosterData();
});

let selectedPlayer = '';
let selectedTeam: 'Local' | 'Visitante' = 'Local';
let selectedAction = '';
let selectedZone = '';
let selectedTarget = '';
let selectedKeeper = '';
let selectedShooter = '';
let selectedRebound = '';
let courtPoint: { x: number; y: number } | null = null;
let fieldActionPoint: { x: number; y: number } | null = null;
let selectedTurnoverType = '';
let noticeTimer = 0;

const fieldOnlyActions = new Set([
  '7 m provocado', 'Golpe franco', 'Asistencia', 'Falta en ataque', 'Recibe falta', 'Bloqueo',
  'Penetración', '1 contra 1', 'Blocaje', 'Falta defensiva', 'Penalti cometido', 'Robo', 'Interceptación',
]);

const opposingTeam = (team: Team): Team => team === 'Local' ? 'Visitante' : 'Local';
const currentEvents = (): MatchEvent[] => activeMatch ? (eventsByMatch.get(activeMatch.id) ?? []) : [];
const cleanPerson = (value: string): string => value.replace(/^\d+\s*-\s*/, '').replace(/\s*·\s*(Local|Visitante)$/, '').trim();

function updateScore(): void {
  const events = currentEvents();
  get<HTMLElement>('#topLocalScore').textContent = String(events.filter((event) => event.action === 'Gol' && event.attackingTeam === 'Local').length);
  get<HTMLElement>('#topVisitorScore').textContent = String(events.filter((event) => event.action === 'Gol' && event.attackingTeam === 'Visitante').length);
}

function normalizedShotPosition(attackingTeam: Team = selectedTeam): { x: number; y: number } | undefined {
  if (!courtPoint) return undefined;
  const x = Math.max(0, Math.min(1, (courtPoint.x - 12) / 496));
  const y = Math.max(0, Math.min(1, (courtPoint.y - 4) / 312));
  return { x: attackingTeam === 'Local' ? 0.04 + x * 0.44 : 0.96 - x * 0.44, y: 0.04 + y * 0.92 };
}

function normalizedFieldPosition(): { x: number; y: number } | undefined {
  if (!fieldActionPoint) return undefined;
  return { x: Math.max(0, Math.min(1, (fieldActionPoint.x - 10) / 900)), y: Math.max(0, Math.min(1, (fieldActionPoint.y - 10) / 420)) };
}

function addMatchEvent(action: string): void {
  if (!activeMatch) return;
  const baseAction = action.startsWith('Pérdida') ? 'Pérdida' : action;
  let attackingTeam: Team | undefined;
  let defendingTeam: Team | undefined;
  let defenseOutcome: MatchEvent['defenseOutcome'];
  let shooter: string | undefined;
  let keeper: string | undefined;
  let position: MatchEvent['position'];

  if (baseAction === 'Gol' || baseAction === 'Lanzamiento fallado') {
    attackingTeam = selectedTeam;
    defendingTeam = opposingTeam(selectedTeam);
    shooter = cleanPerson(selectedPlayer);
    keeper = cleanPerson(selectedKeeper);
    position = normalizedShotPosition(attackingTeam);
    defenseOutcome = baseAction === 'Gol' ? 'failure' : 'success';
  } else if (baseAction === 'Parada') {
    attackingTeam = opposingTeam(selectedTeam);
    defendingTeam = selectedTeam;
    shooter = cleanPerson(selectedShooter);
    keeper = cleanPerson(selectedKeeper);
    position = normalizedShotPosition(attackingTeam);
    defenseOutcome = 'success';
  } else {
    position = normalizedFieldPosition();
    if (['Asistencia', 'Penetración', '1 contra 1', 'Falta en ataque', 'Golpe franco'].includes(baseAction)) attackingTeam = selectedTeam;
    if (['Robo', 'Blocaje', 'Interceptación'].includes(baseAction)) {
      defendingTeam = selectedTeam;
      defenseOutcome = 'success';
    } else if (baseAction === 'Pérdida') {
      attackingTeam = selectedTeam;
      defendingTeam = opposingTeam(selectedTeam);
      defenseOutcome = 'success';
    } else if (['Falta defensiva', 'Penalti cometido'].includes(baseAction)) {
      defendingTeam = selectedTeam;
      defenseOutcome = 'failure';
    } else if (baseAction === '7 m provocado') {
      attackingTeam = selectedTeam;
      defendingTeam = opposingTeam(selectedTeam);
      defenseOutcome = 'failure';
    } else if (baseAction === 'Falta en ataque') {
      defendingTeam = opposingTeam(selectedTeam);
      defenseOutcome = 'success';
    }
  }
  const events = eventsByMatch.get(activeMatch.id) ?? [];
  events.push({ action, team: selectedTeam, attackingTeam, defendingTeam, defenseOutcome, player: cleanPerson(selectedPlayer), shooter, keeper, target: selectedTarget || undefined, position, isPenalty: selectedPenalty && SHOT_ACTIONS.includes(action), isCounterattack: selectedCounterattack && SHOT_ACTIONS.includes(action), attackPhase: SHOT_ACTIONS.includes(action) ? selectedAttackPhase : undefined, duelDirection: action === '1 contra 1' ? selectedDuelDirection : undefined, duelSuccess: action === '1 contra 1' ? selectedDuelResult : undefined, time: manualEventTime ?? formatChronometer(elapsedMatchMs(activeMatch)) });
  eventsByMatch.set(activeMatch.id, events);
  saveMatchData();
  updateScore();
}

function renderHeatmap(svg: SVGSVGElement, empty: HTMLElement, points: Array<{ position: { x: number; y: number }; success: boolean }>, mode: SpatialMapMode): void {
  const field = '<image href="/handball-court.svg" x="0" y="0" width="920" height="440" preserveAspectRatio="none"/>';
  let marks = '';
  if (mode === 'points') {
    marks = points.map(({ position, success }) => '<circle cx="' + (10 + position.x * 900) + '" cy="' + (10 + position.y * 420) + '" r="9" fill="' + (success ? '#11834b' : '#d94f4a') + '" fill-opacity=".9" stroke="#fff" stroke-width="2"/>').join('');
  } else {
    const coords = points.map(({ position }) => ({ x: 10 + position.x * 900, y: 10 + position.y * 420 }));
    const density = coords.map((point) => coords.reduce((sum, other) => sum + (Math.hypot(point.x - other.x, point.y - other.y) < 82 ? 1 : 0), 0));
    const maxDensity = Math.max(1, ...density);
    const blend = (from: number[], to: number[], amount: number): string => 'rgb(' + from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount)).join(',') + ')';
    marks = '<defs><filter id="heatBlur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="24"/></filter></defs>' + points.map((_, index) => {
      const nearby = points.filter((_, otherIndex) => Math.hypot(coords[index].x - coords[otherIndex].x, coords[index].y - coords[otherIndex].y) < 82);
      const intensity = (density[index] - 1) / Math.max(1, maxDensity - 1);
      let color: string;
      if (mode === 'frequency') color = blend([250, 220, 68], [126, 34, 206], intensity);
      else {
        const rate = nearby.filter((point) => point.success).length / nearby.length;
        color = rate < .5 ? blend([239, 83, 77], [250, 207, 65], rate * 2) : blend([250, 207, 65], [34, 160, 90], (rate - .5) * 2);
      }
      return '<circle cx="' + coords[index].x + '" cy="' + coords[index].y + '" r="' + (mode === 'frequency' ? 44 : 38) + '" fill="' + color + '" fill-opacity=".78" filter="url(#heatBlur)"/>';
    }).join('');
  }
  svg.innerHTML = field + marks;
  empty.hidden = points.length > 0;
}

function mapActionSuccess(event: MatchEvent, defensive: boolean): boolean {
  if (event.action === '1 contra 1') return event.duelSuccess === true;
  if (defensive) return event.action === 'Parada' || event.defenseOutcome === 'success';
  if (event.action === 'Gol') return true;
  if (SHOT_ACTIONS.includes(event.action) || event.action.startsWith('Pérdida') || event.action === 'Falta en ataque') return false;
  return event.defenseOutcome === 'failure' || !event.defenseOutcome;
}

function updateLivePossessionProjection(): void {
  const events = currentEvents();
  const possessions = countPossessions(events, liveStatsTeam);
  const title = get<HTMLElement>('#possessionProjectionTitle');
  const note = get<HTMLElement>('#possessionProjectionNote');
  const projection = get<HTMLElement>('#livePossessionProjection');
  const label = get<HTMLElement>('#livePossessionLabel');
  get<HTMLElement>('#livePossessionCurrent').textContent = `${possessions} posesiones propias registradas`;
  if (!activeMatch) {
    title.textContent = 'Posesiones propias estimadas al final';
    projection.textContent = '—';
    label.textContent = 'posesiones estimadas';
    note.textContent = 'Selecciona un partido para calcular la proyección.';
    return;
  }
  if (activeMatch.status === 'Finalizado' || liveStatsReadOnly) {
    title.textContent = 'Posesiones propias del partido';
    projection.textContent = String(possessions);
    label.textContent = 'posesiones registradas';
    note.textContent = 'Partido finalizado · datos del encuentro completo.';
    get<HTMLElement>('#livePossessionElapsed').textContent = 'Total de posesiones registradas';
    return;
  }
  title.textContent = 'Posesiones propias estimadas al final';
  label.textContent = `estimación sobre ${MATCH_DURATION_MINUTES} minutos`;
  if (activeMatch.timerElapsedMs === undefined) {
    projection.textContent = '—';
    note.textContent = 'La proyección empezará cuando comience el registro del partido.';
    get<HTMLElement>('#livePossessionElapsed').textContent = 'Ritmo: esperando el inicio';
    return;
  }
  const elapsedMinutes = Math.min(MATCH_DURATION_MINUTES, elapsedMatchMs(activeMatch) / 60_000);
  const estimate = elapsedMinutes > 0 && possessions > 0 ? Math.round(possessions / elapsedMinutes * MATCH_DURATION_MINUTES) : 0;
  projection.textContent = possessions > 0 && elapsedMinutes > 0 ? String(estimate) : '—';
  note.textContent = activeMatch.timerRunning
    ? 'Proyección lineal según el ritmo del cronómetro; partido de 60 minutos.'
    : 'Cronómetro pausado · la proyección se mantiene fija hasta reanudar.';
  get<HTMLElement>('#livePossessionElapsed').textContent = `Ritmo actual: ${elapsedMinutes.toFixed(1)} min transcurridos${activeMatch.timerRunning ? '' : ' · pausado'}`;
}

function renderLiveStats(): void {
  const events = currentEvents();
  const team = liveStatsTeam;
  renderPreparationMetrics(get<HTMLElement>('#livePreparationMetrics'), events.filter((event) => event.attackingTeam === team));
  const homeName = activeMatch?.home ?? 'equipo local';
  const awayName = activeMatch?.away ?? 'equipo visitante';
  const isHomeView = team === 'Local';
  const penaltyView = liveMapFilter === 'Penaltis';
  get<HTMLElement>('#shotGoalMapTitle').textContent = penaltyView ? (isHomeView ? 'Penaltis de nuestro equipo' : `Penaltis de ${awayName}`) : (isHomeView ? 'Efectividad de nuestros lanzamientos' : `Efectividad de los lanzamientos de ${awayName}`);
  get<HTMLElement>('#shotGoalMapSubtitle').textContent = isHomeView
    ? (penaltyView ? 'Goles / lanzamientos de penalti por zona' : 'Goles / intentos en cada zona de la portería rival')
    : (penaltyView ? `Goles / lanzamientos de penalti de ${awayName} por zona` : `Goles / intentos de ${awayName} en cada zona de la portería rival`);
  get<HTMLElement>('#keeperGoalMapTitle').textContent = penaltyView ? (isHomeView ? 'Penaltis recibidos por nuestro portero' : `Penaltis recibidos por el portero de ${awayName}`) : (isHomeView ? 'Goles recibidos por nuestro portero' : `Goles recibidos por el portero de ${awayName}`);
  get<HTMLElement>('#keeperGoalMapSubtitle').textContent = isHomeView
    ? (penaltyView ? `Penaltis parados / recibidos por zona frente a ${awayName}` : `Goles / lanzamientos de ${awayName} por zona (menor porcentaje, mejor)`)
    : (penaltyView ? `Penaltis parados / recibidos por zona frente a ${homeName}` : `Goles / lanzamientos de ${homeName} por zona (menor porcentaje, mejor)`);
  get<HTMLElement>('#keeperGoalMap').closest('article')!.querySelector('.efficiency-legend')!.innerHTML = penaltyView
    ? '<span><i class="eff-high"></i>Muchas paradas</span><span><i class="eff-mid"></i>Eficacia media</span><span><i class="eff-low"></i>Pocas paradas</span>'
    : '<span><i class="eff-high"></i>Mejor · pocos goles</span><span><i class="eff-mid"></i>Intermedio</span><span><i class="eff-low"></i>Peor · muchos goles</span>';
  get<HTMLElement>('#keeperKpiTitle').textContent = isHomeView ? 'Paradas · nuestro portero' : `Paradas · portero de ${awayName}`;
  get<HTMLElement>('#shooterTableTitle').textContent = penaltyView ? (isHomeView ? 'Lanzamientos de penalti de nuestro equipo' : `Lanzamientos de penalti de ${awayName}`) : (isHomeView ? 'Lanzamientos de nuestro equipo' : `Lanzamientos de ${awayName}`);
  get<HTMLElement>('#keeperTableTitle').textContent = penaltyView ? (isHomeView ? 'Penaltis de nuestros porteros' : `Penaltis de los porteros de ${awayName}`) : (isHomeView ? 'Nuestros porteros' : `Porteros de ${awayName}`);
  const matchesMapFilter = (event: MatchEvent): boolean => {
    if (liveMapFilter === 'Todas') return true;
    if (liveMapFilter === 'Lanzamientos') return ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action);
    if (liveMapFilter === 'Penaltis') return Boolean(event.isPenalty);
    if (liveMapFilter === 'Contraataques') return Boolean(event.isCounterattack) && SHOT_ACTIONS.includes(event.action);
    if (liveMapFilter === 'Acciones defensivas') return Boolean(event.defenseOutcome);
    if (liveMapFilter === 'Pérdida') return event.action.startsWith('Pérdida');
    return event.action === liveMapFilter;
  };
  const mapEvents = events.filter(matchesMapFilter);
  const selectedFilterLabel = liveMapFilterControl.querySelector<HTMLButtonElement>('.map-filter-chip.selected')?.textContent?.trim() ?? 'Todas';
  const shotSelections = ['Lanzamientos', 'Penaltis', 'Contraataques', 'Gol', 'Lanzamiento fallado', 'Parada'];
  const showGoalMaps = liveMapFilter === 'Todas' || shotSelections.includes(liveMapFilter);
  get<HTMLElement>('#liveGoalMaps').classList.toggle('is-hidden', !showGoalMaps);
  const attacks = events.filter((event) => event.attackingTeam === team);
  const goals = attacks.filter((event) => event.action === 'Gol').length;
  const attempts = attacks.filter((event) => ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action));
  const shotsAgainst = events.filter((event) => event.defendingTeam === team && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action));
  const totalAttacks = countPossessions(events, team);
  const rivalAttacks = countPossessions(events, opposingTeam(team));
  const goalsAgainst = events.filter((event) => event.action === 'Gol' && event.attackingTeam === opposingTeam(team)).length;
  const rivalStopped = Math.max(0, rivalAttacks - shotsAgainst.length);
  const saves = events.filter((event) => event.action === 'Parada' && event.team === team).length;
  const percent = (n: number, d: number) => d ? `${Math.round(n / d * 100)}%` : '—';
  get<HTMLElement>('#attackRate').textContent = percent(attempts.length, totalAttacks);
  get<HTMLElement>('#attackCount').textContent = `${attempts.length} lanzamientos de ${totalAttacks} ataques`;
  get<HTMLElement>('#shotRate').textContent = percent(goals, attempts.length);
  get<HTMLElement>('#shotCount').textContent = `${goals} goles de ${attempts.length} lanzamientos`;
  get<HTMLElement>('#defenseRate').textContent = percent(rivalStopped, rivalAttacks);
  get<HTMLElement>('#defenseCount').textContent = `${rivalStopped} de ${rivalAttacks} ataques rivales sin lanzamiento`;
  get<HTMLElement>('#rivalArrivalRate').textContent = percent(shotsAgainst.length, rivalAttacks);
  get<HTMLElement>('#rivalArrivalCount').textContent = `${shotsAgainst.length} lanzamientos rivales de ${rivalAttacks} ataques`;
  get<HTMLElement>('#concededRate').textContent = percent(goalsAgainst, shotsAgainst.length);
  get<HTMLElement>('#concededCount').textContent = `${goalsAgainst} goles de ${shotsAgainst.length} lanzamientos rivales`;
  get<HTMLElement>('#keeperRate').textContent = percent(saves, shotsAgainst.length);
  get<HTMLElement>('#keeperCount').textContent = `${saves} paradas de ${shotsAgainst.length} lanzamientos`;
  updateLivePossessionProjection();
  get<HTMLElement>('#attackHeatmap').closest('article')!.querySelector('h2')!.textContent = liveMapFilter === 'Todas' ? 'Ataque' : `Ataque · ${selectedFilterLabel}`;
  get<HTMLElement>('#defenseHeatmap').closest('article')!.querySelector('h2')!.textContent = liveMapFilter === 'Todas' ? 'Defensa' : `Defensa · ${selectedFilterLabel}`;
  get<HTMLElement>('#attackHeatmap').closest('article')!.querySelector('header p')!.textContent = liveMapFilter === 'Todas' ? 'Mapa de balonmano · zonas de lanzamiento y resultado' : `Mapa de balonmano · ${selectedFilterLabel.toLocaleLowerCase('es')} del equipo seleccionado`;
  get<HTMLElement>('#defenseHeatmap').closest('article')!.querySelector('header p')!.textContent = liveMapFilter === 'Todas' ? 'Mapa de balonmano · acciones defensivas exitosas y no exitosas' : `Mapa de balonmano · ${selectedFilterLabel.toLocaleLowerCase('es')} frente al equipo seleccionado`;
  const attackPoints = mapEvents.filter((event) => event.attackingTeam === team && event.position).map((event) => ({ position: event.position!, success: mapActionSuccess(event, false) }));
  const defensePoints = mapEvents.filter((event) => event.defendingTeam === team && event.position && (event.defenseOutcome || event.action === 'Parada')).map((event) => ({ position: event.position!, success: mapActionSuccess(event, true) }));
  const liveLegend = liveMapMode === 'effectiveness'
    ? '<span><i class="heat-bad"></i>Baja</span><span><i class="heat-mid"></i>Media</span><span><i class="heat-good"></i>Alta</span>'
    : liveMapMode === 'frequency'
      ? '<span><i class="frequency-low"></i>Menos acciones</span><span><i class="frequency-high"></i>Más acciones</span>'
      : '<span><i class="heat-good"></i>Acción exitosa</span><span><i class="heat-bad"></i>Acción no exitosa</span>';
  get<HTMLElement>('#attackHeatmap').closest('article')!.querySelector('.heatmap-legend')!.innerHTML = liveLegend;
  get<HTMLElement>('#defenseHeatmap').closest('article')!.querySelector('.heatmap-legend')!.innerHTML = liveLegend;
  get<HTMLElement>('#attackHeatEmpty').textContent = liveMapFilter === 'Todas' ? 'Los lanzamientos aparecerán aquí al registrarlos.' : `Sin coordenadas registradas para ${selectedFilterLabel.toLocaleLowerCase('es')} en ataque.`;
  get<HTMLElement>('#defenseHeatEmpty').textContent = liveMapFilter === 'Todas' ? 'Las acciones defensivas aparecerán aquí al registrarlas.' : `Sin coordenadas registradas para ${selectedFilterLabel.toLocaleLowerCase('es')} en defensa.`;
  renderHeatmap(attackHeatmap, get<HTMLElement>('#attackHeatEmpty'), attackPoints, liveMapMode);
  renderHeatmap(defenseHeatmap, get<HTMLElement>('#defenseHeatEmpty'), defensePoints, liveMapMode);
  const zoneNames = ['Arriba izquierda', 'Arriba centro', 'Arriba derecha', 'Centro izquierda', 'Centro', 'Centro derecha', 'Abajo izquierda', 'Abajo centro', 'Abajo derecha'];
  const drawGoalMap = (svg: SVGSVGElement, empty: HTMLElement, counts: Array<{ zone: string; value: number; label: string; detail: string; color: string }>) => {
    const cells = zoneNames.map((zone, index) => {
      const row = Math.floor(index / 3), col = index % 3;
      const x = 56 + col * (338 / 3), y = 29 + row * 62;
      const item = counts.find((entry) => entry.zone === zone);
      const center = x + 338 / 6;
      return `<g><rect x="${x}" y="${y}" width="${338 / 3}" height="62" fill="${item?.color ?? '#ffffff'}" fill-opacity="${item?.value ? '.78' : '.12'}" stroke="#607b98" stroke-width="2"/><text x="${center}" y="${y + 27}" text-anchor="middle" fill="#17324c" font-size="16" font-weight="850"><tspan x="${center}">${item?.label ?? '—'}</tspan>${item?.detail ? `<tspan x="${center}" dy="18" font-size="13" font-weight="750">${item.detail}</tspan>` : ''}</text></g>`;
    }).join('');
    svg.innerHTML = `<rect x="38" y="12" width="374" height="220" rx="7" fill="#f8fbff" stroke="#26384d" stroke-width="3"/><rect x="38" y="12" width="18" height="220" fill="#eb3838" stroke="#242b36" stroke-width="2"/><rect x="394" y="12" width="18" height="220" fill="#eb3838" stroke="#242b36" stroke-width="2"/><rect x="38" y="12" width="374" height="17" fill="#eb3838" stroke="#242b36" stroke-width="2"/><rect x="38" y="215" width="374" height="17" fill="#eb3838" stroke="#242b36" stroke-width="2"/><rect x="56" y="29" width="338" height="186" rx="5" fill="#edf5fd"/>${cells}`;
    empty.hidden = counts.some((entry) => entry.value > 0);
  };
  const shootingZones = zoneNames.map((zone) => {
    const shots = mapEvents.filter((event) => event.attackingTeam === team && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action) && event.target === zone);
    const zoneGoals = shots.filter((event) => event.action === 'Gol').length;
    const rate = shots.length ? Math.round(zoneGoals / shots.length * 100) : 0;
    const color = !shots.length ? '#ffffff' : rate >= 65 ? '#35aa65' : rate >= 35 ? '#f3c844' : '#ea665d';
    return { zone, value: shots.length, label: shots.length ? `${zoneGoals}/${shots.length}` : '—', detail: shots.length ? `${rate}%` : '', color };
  });
  drawGoalMap(shotGoalMap, get<HTMLElement>('#shotGoalMapEmpty'), shootingZones);
  const keeperZones = zoneNames.map((zone) => {
    const faced = mapEvents.filter((event) => event.defendingTeam === team && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action) && event.target === zone);
    const conceded = faced.filter((event) => event.action === 'Gol').length;
    const stopped = faced.filter((event) => event.action === 'Parada').length;
    const value = penaltyView ? stopped : conceded;
    const rate = faced.length ? Math.round(value / faced.length * 100) : 0;
    const color = !faced.length ? '#ffffff' : penaltyView ? (rate >= 65 ? '#35aa65' : rate >= 35 ? '#f3c844' : '#ea665d') : (rate <= 35 ? '#35aa65' : rate <= 65 ? '#f3c844' : '#ea665d');
    return { zone, value: faced.length, label: faced.length ? `${value}/${faced.length}` : '—', detail: faced.length ? `${rate}%` : '', color };
  });
  drawGoalMap(keeperGoalMap, get<HTMLElement>('#keeperGoalMapEmpty'), keeperZones);
  const tableAttempts = liveMapFilter === 'Contraataques' ? attempts.filter((event) => event.isCounterattack) : penaltyView ? attempts.filter((event) => event.isPenalty) : attempts;
  const shooters = new Map<string, { goals: number; attempts: number }>();
  tableAttempts.filter((event) => event.shooter).forEach((event) => {
    const stat = shooters.get(event.shooter!) ?? { goals: 0, attempts: 0 };
    stat.attempts += 1;
    if (event.action === 'Gol') stat.goals += 1;
    shooters.set(event.shooter!, stat);
  });
  get<HTMLElement>('#shooterStatsRows').innerHTML = [...shooters.entries()].map(([name, stat]) => `<tr><td>${escapeHtml(name)}</td><td>${stat.goals}</td><td>${stat.attempts}</td><td>${percent(stat.goals, stat.attempts)}</td></tr>`).join('') || '<tr><td colspan="4">Aún no hay lanzamientos registrados</td></tr>';
  const keepers = goalkeepersByTeam[team];
  get<HTMLElement>('#keeperStatsRows').innerHTML = keepers.map((player) => {
    const faced = events.filter((event) => event.keeper === player.name && (!penaltyView || event.isPenalty) && (liveMapFilter !== 'Contraataques' || event.isCounterattack) && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action)).length;
    const saved = events.filter((event) => event.keeper === player.name && (!penaltyView || event.isPenalty) && (liveMapFilter !== 'Contraataques' || event.isCounterattack) && event.action === 'Parada').length;
    return `<tr><td>${escapeHtml(player.number)} · ${escapeHtml(player.name)}</td><td>${saved}</td><td>${faced}</td><td>${percent(saved, faced)}</td></tr>`;
  }).join('');
  const actionSpecific = liveMapFilter !== 'Todas' && liveMapFilter !== 'Lanzamientos' && liveMapFilter !== 'Penaltis' && liveMapFilter !== 'Contraataques';
  const liveTables = get<HTMLElement>('#liveTables');
  const keeperTablePanel = get<HTMLElement>('#keeperTablePanel');
  liveTables.classList.toggle('single-table', actionSpecific);
  keeperTablePanel.classList.toggle('is-hidden', actionSpecific);
  if (actionSpecific) {
    const defensiveFilters = ['Acciones defensivas', 'Parada', 'Robo', 'Blocaje', 'Interceptación', 'Falta defensiva', 'Penalti cometido', '2 min', 'Tarjeta amarilla', 'Tarjeta roja'];
    const rowsByPlayer = new Map<string, Map<string, number>>();
    mapEvents.filter((event) => {
      if (liveMapFilter === 'Acciones defensivas') return event.defendingTeam === team && Boolean(event.defenseOutcome);
      if (defensiveFilters.includes(liveMapFilter)) return event.defendingTeam === team || (event.team === team && !event.attackingTeam);
      return event.attackingTeam === team || (event.team === team && !event.defendingTeam);
    }).forEach((event) => {
      const name = event.shooter && ['Gol', 'Lanzamiento fallado', 'Parada'].includes(event.action) ? event.shooter : event.player;
      const playerActions = rowsByPlayer.get(name) ?? new Map<string, number>();
      playerActions.set(event.action, (playerActions.get(event.action) ?? 0) + 1);
      rowsByPlayer.set(name, playerActions);
    });
    const actionRows = [...rowsByPlayer.entries()].flatMap(([name, playerActions]) => [...playerActions.entries()].map(([action, total]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(action)}</td><td>${total}</td></tr>`)).join('');
    const firstPanel = liveTables.querySelector<HTMLElement>('.live-table-panel:first-child')!;
    firstPanel.querySelector('header h2')!.textContent = liveMapFilter === 'Pérdida' ? `Pérdidas · ${isHomeView ? 'nuestro equipo' : awayName}` : `${selectedFilterLabel} · ${isHomeView ? 'nuestro equipo' : awayName}`;
    firstPanel.querySelector('header p')!.textContent = 'Acciones registradas en el periodo del partido';
    firstPanel.querySelector('thead')!.innerHTML = '<tr><th>Jugador</th><th>Acción / tipo</th><th>Veces</th></tr>';
    get<HTMLElement>('#shooterStatsRows').innerHTML = actionRows || '<tr><td colspan="3">Aún no hay acciones registradas</td></tr>';
  } else {
    const firstPanel = liveTables.querySelector<HTMLElement>('.live-table-panel:first-child')!;
    firstPanel.querySelector('header p')!.textContent = 'Goles, intentos y porcentaje de éxito';
    firstPanel.querySelector('thead')!.innerHTML = '<tr><th>Jugador</th><th>Goles</th><th>Lanzamientos</th><th>Éxito</th></tr>';
  }
}

function openLiveStats(): void {
  closeMenu();
  [homePage, matchesPage, rosterPage, playersPage, actionsPage, shotPage, fieldActionPage].forEach((page) => { page.classList.remove('active'); page.classList.add('hidden'); page.setAttribute('aria-hidden', 'true'); });
  liveStatsPage.classList.add('active');
  liveStatsPage.setAttribute('aria-hidden', 'false');
  renderLiveStats();
}

function closeLiveStats(): void {
  liveStatsPage.classList.remove('active');
  liveStatsPage.setAttribute('aria-hidden', 'true');
  [homePage, matchesPage, rosterPage, actionsPage, shotPage, fieldActionPage].forEach((page) => { page.classList.remove('active'); page.classList.add('hidden'); });
  if (liveStatsReadOnly) {
    matchesPage.classList.remove('hidden');
    matchesPage.classList.add('active');
    matchesPage.setAttribute('aria-hidden', 'false');
    renderMatches();
    return;
  }
  playersPage.classList.remove('hidden');
  playersPage.setAttribute('aria-hidden', 'false');
}

function showActions(name: string, team: 'Local' | 'Visitante'): void {
  selectedPlayer = `${name} · ${team}`;
  selectedTeam = team;
  window.clearTimeout(noticeTimer);
  recordedBanner.hidden = true;
  playersPage.classList.add('hidden');
  actionsPage.classList.add('active');
  actionsPage.setAttribute('aria-hidden', 'false');
  get<HTMLParagraphElement>('#selectionNote').innerHTML = `Jugador seleccionado: <strong>${selectedPlayer}</strong>`;
  document.querySelectorAll<HTMLButtonElement>('.action-card').forEach((button) => {
    button.hidden = button.querySelector('span:last-child')?.textContent?.trim() === '1 contra 1' && !preparationContext;
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  });
}

function returnToPlayers(): void {
  liveStatsPage.classList.remove('active');
  liveStatsPage.setAttribute('aria-hidden', 'true');
  shotPage.classList.remove('active');
  shotPage.setAttribute('aria-hidden', 'true');
  fieldActionPage.classList.remove('active');
  fieldActionPage.setAttribute('aria-hidden', 'true');
  actionsPage.classList.remove('active');
  actionsPage.setAttribute('aria-hidden', 'true');
  playersPage.classList.remove('hidden');
}

function recordAction(action: string, details = ''): void {
  addMatchEvent(action);
  if (finishedEntryMode === 'single') {
    finishedEntryMode = null;
    manualEventTime = null;
    showMenuPage('partidos');
    renderMatches();
    return;
  }
  window.clearTimeout(noticeTimer);
  recordedBanner.textContent = `Acción registrada: ${action}${details ? ` · ${details}` : ''}`;
  recordedBanner.hidden = false;
  returnToPlayers();
  noticeTimer = window.setTimeout(() => { recordedBanner.hidden = true; }, 3500);
}

function showFieldAction(action: string): void {
  fieldActionPoint = null;
  selectedDuelDirection = undefined;
  selectedDuelResult = undefined;
  get<HTMLElement>('#duelOptions').hidden = action !== '1 contra 1';
  get<HTMLElement>('#duelOptions').querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); });
  selectedTurnoverType = '';
  const isTurnover = action === 'Pérdida';
  turnoverTypes.hidden = !isTurnover;
  confirmFieldAction.hidden = isTurnover;
  document.querySelectorAll<HTMLButtonElement>('.turnover-option').forEach((button) => {
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  });
  fieldActionTitle.textContent = action;
  const leftHalf = get<SVGTextElement>('#leftHalfLabel');
  const rightHalf = get<SVGTextElement>('#rightHalfLabel');
  const teamOwnsLeftHalf = selectedTeam === 'Local';
  leftHalf.textContent = teamOwnsLeftHalf ? 'Nuestro medio campo' : 'Medio campo rival';
  rightHalf.textContent = teamOwnsLeftHalf ? 'Medio campo rival' : 'Nuestro medio campo';
  fullCourt.setAttribute('aria-label', teamOwnsLeftHalf
    ? 'Campo completo: nuestro medio campo a la izquierda y medio campo rival a la derecha. Pulsa o toca para marcar la acción.'
    : 'Campo completo: medio campo rival a la izquierda y nuestro medio campo a la derecha. Pulsa o toca para marcar la acción.');
  fieldActionNote.textContent = `${action} · toca el campo para marcar dónde ocurrió · ${selectedPlayer}`;
  fieldActionMarker.style.display = 'none';
  confirmFieldAction.disabled = true;
  confirmFieldAction.innerHTML = '<span class="arrow">→</span>Confirmar';
  playersPage.classList.add('hidden');
  actionsPage.classList.remove('active');
  actionsPage.setAttribute('aria-hidden', 'true');
  shotPage.classList.remove('active');
  shotPage.setAttribute('aria-hidden', 'true');
  fieldActionPage.classList.add('active');
  fieldActionPage.setAttribute('aria-hidden', 'false');
}

function registerTurnoverIfReady(): void {
  if (fieldActionTitle.textContent !== 'Pérdida' || !fieldActionPoint || !selectedTurnoverType) return;
  const prefix = `Pérdida · ${selectedTurnoverType} · `;
  const details = (fieldActionNote.textContent ?? '').replace(prefix, '');
  recordAction(`Pérdida · ${selectedTurnoverType}`, details);
}

turnoverTypes.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('.turnover-option');
  if (!button) return;
  selectedTurnoverType = button.dataset.turnover ?? '';
  turnoverTypes.querySelectorAll<HTMLButtonElement>('.turnover-option').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  const coordinates = fieldActionPoint
    ? `${Math.round(((fieldActionPoint.x - 10) / 900) * 100)}% ancho, ${Math.round(((fieldActionPoint.y - 10) / 420) * 100)}% largo`
    : 'toca el campo para marcar dónde ocurrió';
  fieldActionNote.textContent = `${fieldActionTitle.textContent} · ${selectedTurnoverType} · ${coordinates} · ${selectedPlayer}`;
  registerTurnoverIfReady();
});
get<HTMLElement>('#duelOptions').addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button');
  if (!button) return;
  const direction = button.dataset.duelDirection;
  const result = button.dataset.duelResult;
  if (direction === 'izquierda' || direction === 'derecha') selectedDuelDirection = direction;
  if (result === 'success' || result === 'failure') selectedDuelResult = result === 'success';
  button.parentElement!.querySelectorAll<HTMLButtonElement>('button').forEach((item) => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  confirmFieldAction.disabled = !fieldActionPoint || !selectedDuelDirection || selectedDuelResult === undefined;
});

function updateConfirmState(): void {
  const shotDetailsReady = Boolean(courtPoint && selectedTarget && selectedKeeper);
  const reboundDetailsReady = selectedAction === 'Parada'
    ? Boolean(selectedShooter && selectedRebound)
    : selectedAction === 'Lanzamiento fallado'
      ? Boolean(selectedRebound)
      : true;
  confirmButton.disabled = !(shotDetailsReady && reboundDetailsReady);
}

function showShot(action: string): void {
  selectedAction = action;
  selectedPenalty = false;
  selectedCounterattack = false;
  selectedAttackPhase = undefined;
  const phaseControls = get<HTMLElement>('#attackPhaseControls');
  phaseControls.hidden = !preparationContext;
  phaseControls.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); });
  const counterattackToggle = get<HTMLButtonElement>('#counterattackToggle');
  counterattackToggle.classList.remove('selected');
  counterattackToggle.setAttribute('aria-pressed', 'false');
  const penaltyToggle = get<HTMLButtonElement>('#penaltyToggle');
  penaltyToggle.classList.remove('selected');
  penaltyToggle.setAttribute('aria-pressed', 'false');
  get<HTMLElement>('#penaltyToggleLabel').textContent = action === 'Parada' ? 'Penalti: No' : 'Penalti';
  penaltyToggle.querySelector('span')!.textContent = '7 m';
  penaltyToggle.setAttribute('aria-label', action === 'Parada' ? 'Parada de penalti: no' : 'Marcar lanzamiento de penalti');
  shotPage.querySelectorAll<HTMLButtonElement>('.result-button').forEach((button) => { button.hidden = action === 'Parada'; });
  selectedZone = '';
  selectedTarget = '';
  selectedKeeper = '';
  selectedShooter = '';
  selectedRebound = '';
  courtPoint = null;
  const isSave = action === 'Parada';
  reboundPanel.hidden = action !== 'Parada' && action !== 'Lanzamiento fallado';
  missDestinations.hidden = action !== 'Lanzamiento fallado';
  shotPage.classList.toggle('save-mode', isSave);
  saveExtras.setAttribute('aria-hidden', String(!isSave));
  get<HTMLHeadingElement>('#shotTitle').textContent = isSave ? 'Parada' : 'Lanzamiento';
  get<HTMLParagraphElement>('#shotHelp').textContent = isSave
    ? 'Registra el tiro rival, la parada y quién recuperó el rebote'
    : 'Define el resultado y la información del tiro';
  get<HTMLParagraphElement>('#shooterHelp').textContent = `Elige al lanzador del equipo ${selectedTeam === 'Local' ? 'visitante' : 'local'}`;
  const opponents = selectedTeam === 'Local' ? awayPlayers : homePlayers;
  shooterGrid.innerHTML = opponents.map(({ number, name }) => `
    <button class="shooter-card" type="button" data-shooter="${number} - ${name}" aria-pressed="false">
      <span class="shooter-number">${number}</span><span>${name}</span>
    </button>`).join('');
  const otherTeam = selectedTeam === 'Local' ? 'Visitante' : 'Local';
  const keeperTeam: Team = isSave ? selectedTeam : otherTeam;
  keeperOptions.innerHTML = goalkeepersByTeam[keeperTeam].map(({ number, name }) => `<button class="keeper-button" type="button" data-keeper="${escapeHtml(name)}" aria-pressed="false"><span>${escapeHtml(number)}</span>${escapeHtml(name)}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-rebound-team]').forEach((button, index) => {
    const team = index === 0 ? selectedTeam : otherTeam;
    button.dataset.reboundTeam = team;
    button.innerHTML = `<span>${index === 0 ? 'Mi equipo' : 'Rival'}</span><small>${team}</small>`;
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  });
  shotPage.classList.add('active');
  shotPage.setAttribute('aria-hidden', 'false');
  actionsPage.classList.remove('active');
  actionsPage.setAttribute('aria-hidden', 'true');
  document.querySelectorAll<HTMLButtonElement>('.result-button').forEach((button) => {
    button.classList.toggle('selected', button.dataset.result === action);
  });
  document.querySelectorAll<SVGGElement>('.goal-cell').forEach((choice) => choice.classList.remove('selected'));
  missDestinations.querySelectorAll<HTMLButtonElement>('.miss-destination').forEach((choice) => {
    choice.classList.remove('selected');
    choice.setAttribute('aria-pressed', 'false');
  });
  keeperOptions.querySelectorAll<HTMLButtonElement>('.keeper-button').forEach((button) => {
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
  });
  shotMarker.style.display = 'none';
  confirmButton.disabled = true;
  confirmButton.innerHTML = '<span class="arrow">→</span>Confirmar';
  shotNote.textContent = `${action} · ${selectedPlayer}`;
}

playersPage.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-player]');
  if (!button) return;
  const team = button.dataset.team;
  if (team === 'Local' || team === 'Visitante') showActions(button.dataset.player ?? '', team);
});

get<HTMLButtonElement>('#backButton').addEventListener('click', returnToPlayers);
get<HTMLButtonElement>('#cancelButton').addEventListener('click', returnToPlayers);

document.querySelectorAll<HTMLButtonElement>('.action-card').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.querySelector('span:last-child')?.textContent?.trim() ?? '';
    if (action === 'Pérdida') {
      showFieldAction(action);
      return;
    }
    if (fieldOnlyActions.has(action)) {
      showFieldAction(action);
      return;
    }
    if (action === 'Gol' || action === 'Lanzamiento fallado' || action === 'Parada') {
      showShot(action);
      return;
    }
    recordAction(action);
  });
});

function placeFieldActionPoint(x: number, y: number): void {
  const pointX = Math.max(14, Math.min(906, x));
  const pointY = Math.max(14, Math.min(426, y));
  fieldActionPoint = { x: pointX, y: pointY };
  const horizontal = Math.round(((pointX - 10) / 900) * 100);
  const vertical = Math.round(((pointY - 10) / 420) * 100);
  fieldActionMarker.setAttribute('cx', pointX.toFixed(1));
  fieldActionMarker.setAttribute('cy', pointY.toFixed(1));
  fieldActionMarker.style.display = 'block';
  if (fieldActionTitle.textContent === 'Pérdida') {
    fieldActionNote.textContent = `Pérdida · ${selectedTurnoverType || 'selecciona el tipo'} · ${horizontal}% ancho, ${vertical}% largo · ${selectedPlayer}`;
    confirmFieldAction.disabled = true;
    registerTurnoverIfReady();
  } else {
    fieldActionNote.textContent = `${fieldActionTitle.textContent} · ${horizontal}% ancho, ${vertical}% largo · ${selectedPlayer}`;
    confirmFieldAction.disabled = fieldActionTitle.textContent === '1 contra 1' && (!selectedDuelDirection || selectedDuelResult === undefined);
  }
}

fullCourt.addEventListener('click', (event: MouseEvent) => {
  const transform = fullCourt.getScreenCTM();
  if (!transform) return;
  const pointer = fullCourt.createSVGPoint();
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  const point = pointer.matrixTransform(transform.inverse());
  placeFieldActionPoint(point.x, point.y);
});

fullCourt.addEventListener('keydown', (event: KeyboardEvent) => {
  const point = fieldActionPoint ?? { x: 460, y: 220 };
  const step = event.shiftKey ? 18 : 6;
  const movements: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  const movement = movements[event.key];
  if (movement) {
    event.preventDefault();
    placeFieldActionPoint(point.x + movement[0], point.y + movement[1]);
  } else if ((event.key === 'Enter' || event.key === ' ') && !fieldActionPoint) {
    event.preventDefault();
    placeFieldActionPoint(point.x, point.y);
  }
});

get<HTMLButtonElement>('#fieldBack').addEventListener('click', () => {
  fieldActionPage.classList.remove('active');
  fieldActionPage.setAttribute('aria-hidden', 'true');
  actionsPage.classList.add('active');
  actionsPage.setAttribute('aria-hidden', 'false');
});
get<HTMLButtonElement>('#fieldCancel').addEventListener('click', returnToPlayers);
confirmFieldAction.addEventListener('click', () => {
  if (!fieldActionPoint || (fieldActionTitle.textContent === 'Pérdida' && !selectedTurnoverType) || (fieldActionTitle.textContent === '1 contra 1' && (!selectedDuelDirection || selectedDuelResult === undefined))) return;
  const details = (fieldActionNote.textContent ?? '').replace(`${fieldActionTitle.textContent} · `, '');
  recordAction(fieldActionTitle.textContent ?? 'Acción', details);
});

shooterGrid.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('.shooter-card');
  if (!button) return;
  selectedShooter = button.dataset.shooter ?? '';
  shooterGrid.querySelectorAll<HTMLButtonElement>('.shooter-card').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  shotNote.textContent = `Parada · lanzador ${selectedShooter} · ${selectedRebound ? `rebote ${selectedRebound}` : 'elige quién recuperó el rebote'}`;
  updateConfirmState();
});

get<HTMLDivElement>('#reboundOptions').addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('.rebound-button');
  if (!button) return;
  selectedRebound = button.dataset.reboundTeam ?? '';
  document.querySelectorAll<HTMLButtonElement>('.rebound-button').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  shotNote.textContent = `Parada · ${selectedShooter ? `lanzador ${selectedShooter}` : 'elige al lanzador rival'} · rebote ${selectedRebound}`;
  updateConfirmState();
});

document.querySelectorAll<HTMLButtonElement>('.result-button').forEach((button) => {
  button.addEventListener('click', () => {
    selectedAction = button.dataset.result ?? '';
    reboundPanel.hidden = selectedAction !== 'Lanzamiento fallado';
    missDestinations.hidden = selectedAction !== 'Lanzamiento fallado';
    if (selectedAction !== 'Lanzamiento fallado' && (selectedTarget === 'Palo' || selectedTarget === 'Fuera de la portería')) {
      selectedTarget = '';
      missDestinations.querySelectorAll<HTMLButtonElement>('.miss-destination').forEach((choice) => {
        choice.classList.remove('selected');
        choice.setAttribute('aria-pressed', 'false');
      });
    }
    if (reboundPanel.hidden) {
      selectedRebound = '';
      document.querySelectorAll<HTMLButtonElement>('.rebound-button').forEach((choice) => {
        choice.classList.remove('selected');
        choice.setAttribute('aria-pressed', 'false');
      });
    }
    document.querySelectorAll<HTMLButtonElement>('.result-button').forEach((choice) => {
      choice.classList.toggle('selected', choice === button);
    });
    shotNote.textContent = `${selectedAction} · ${selectedPlayer}`;
    updateConfirmState();
  });
});

function placeShotPoint(x: number, y: number): void {
  const pointX = Math.max(18, Math.min(502, x));
  const pointY = Math.max(8, Math.min(312, y));
  courtPoint = { x: pointX, y: pointY };
  const horizontal = Math.round(((pointX - 12) / 496) * 100);
  const depth = Math.round(((pointY - 4) / 312) * 100);
  selectedZone = `${horizontal}% ancho · ${depth}% fondo`;
  shotMarker.setAttribute('cx', pointX.toFixed(1));
  shotMarker.setAttribute('cy', pointY.toFixed(1));
  shotMarker.style.display = 'block';
  shotNote.textContent = `${selectedAction} · punto ${selectedZone} · ${selectedPlayer}`;
  updateConfirmState();
}

court.addEventListener('click', (event: MouseEvent) => {
  const transform = court.getScreenCTM();
  if (!transform) return;
  const pointer = court.createSVGPoint();
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  const point = pointer.matrixTransform(transform.inverse());
  placeShotPoint(point.x, point.y);
});

court.addEventListener('keydown', (event: KeyboardEvent) => {
  const step = event.shiftKey ? 12 : 4;
  const point = courtPoint ?? { x: 260, y: 174 };
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  const movement = moves[event.key];
  if (movement) {
    event.preventDefault();
    placeShotPoint(point.x + movement[0], point.y + movement[1]);
  } else if ((event.key === 'Enter' || event.key === ' ') && !courtPoint) {
    event.preventDefault();
    placeShotPoint(point.x, point.y);
  }
});

document.querySelectorAll<SVGGElement>('.goal-cell').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll<SVGGElement>('.goal-cell').forEach((choice) => choice.classList.remove('selected'));
    missDestinations.querySelectorAll<HTMLButtonElement>('.miss-destination').forEach((choice) => {
      choice.classList.remove('selected');
      choice.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('selected');
    selectedTarget = button.dataset.target ?? '';
    shotNote.textContent = `${selectedAction} · ${selectedZone || 'elige una zona de lanzamiento'} · ${selectedTarget}`;
    updateConfirmState();
  });
});

missDestinations.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('.miss-destination');
  if (!button) return;
  document.querySelectorAll<SVGGElement>('.goal-cell').forEach((cell) => cell.classList.remove('selected'));
  missDestinations.querySelectorAll<HTMLButtonElement>('.miss-destination').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  selectedTarget = button.dataset.target ?? '';
  shotNote.textContent = `${selectedAction} · ${selectedZone || 'marca el punto del lanzamiento'} · ${selectedTarget}`;
  updateConfirmState();
});

keeperOptions.addEventListener('click', (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('.keeper-button');
  if (!button) return;
  selectedKeeper = button.dataset.keeper ?? '';
  keeperOptions.querySelectorAll<HTMLButtonElement>('.keeper-button').forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle('selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
  });
  shotNote.textContent = `${selectedAction} · ${selectedZone ? `punto ${selectedZone}` : 'marca el punto del tiro'} · ${selectedTarget || 'elige destino'} · ${selectedKeeper}`;
  updateConfirmState();
});
get<HTMLButtonElement>('#shotBack').addEventListener('click', () => {
  shotPage.classList.remove('active');
  shotPage.setAttribute('aria-hidden', 'true');
  actionsPage.classList.add('active');
  actionsPage.setAttribute('aria-hidden', 'false');
});
get<HTMLButtonElement>('#shotCancel').addEventListener('click', returnToPlayers);
get<HTMLButtonElement>('#penaltyToggle').addEventListener('click', (event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement;
  selectedPenalty = !selectedPenalty;
  if (selectedPenalty) {
    selectedAttackPhase = undefined;
    get<HTMLElement>('#attackPhaseControls').querySelectorAll<HTMLButtonElement>('button').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
  }
  if (selectedPenalty && selectedCounterattack) {
    selectedCounterattack = false;
    const counterattack = get<HTMLButtonElement>('#counterattackToggle');
    counterattack.classList.remove('selected');
    counterattack.setAttribute('aria-pressed', 'false');
  }
  button.classList.toggle('selected', selectedPenalty);
  button.setAttribute('aria-pressed', String(selectedPenalty));
  get<HTMLElement>('#penaltyToggleLabel').textContent = selectedAction === 'Parada'
    ? 'Penalti: ' + (selectedPenalty ? 'Sí' : 'No')
    : 'Penalti';
  button.setAttribute('aria-label', selectedAction === 'Parada'
    ? 'Parada de penalti: ' + (selectedPenalty ? 'sí' : 'no')
    : 'Lanzamiento de penalti: ' + (selectedPenalty ? 'sí' : 'no'));
  if (selectedPenalty) {
    // 7 m desde la línea de gol, centrado en el eje del campo del medio campo dibujado.
    placeShotPoint(12 + (7 / 20) * 496, 160);
  } else {
    courtPoint = null;
    selectedZone = '';
    shotMarker.style.display = 'none';
    shotNote.textContent = `${selectedAction} · marca el punto del lanzamiento · ${selectedPlayer}`;
    updateConfirmState();
  }
  if (selectedPenalty) shotNote.textContent = `${selectedAction} · Penalti · punto de 7 metros · ${selectedTarget || 'elige la zona'} · ${selectedKeeper || 'elige portero'}`;
});
get<HTMLButtonElement>('#counterattackToggle').addEventListener('click', (event: MouseEvent) => {
  const button = event.currentTarget as HTMLButtonElement;
  selectedCounterattack = !selectedCounterattack;
  if (selectedCounterattack && selectedPenalty) get<HTMLButtonElement>('#penaltyToggle').click();
  selectedAttackPhase = selectedCounterattack ? 'contraataque' : undefined;
  if (selectedCounterattack) get<HTMLElement>('#attackPhaseControls').querySelectorAll<HTMLButtonElement>('button').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.toggle('selected', selectedCounterattack);
  button.setAttribute('aria-pressed', String(selectedCounterattack));
});
get<HTMLElement>('#attackPhaseControls').addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-attack-phase]');
  if (!button) return;
  const phase = button.dataset.attackPhase as 'posicional' | 'segunda_oleada';
  const nextPhase = selectedAttackPhase === phase ? undefined : phase;
  if (nextPhase && selectedPenalty) get<HTMLButtonElement>('#penaltyToggle').click();
  selectedAttackPhase = nextPhase;
  if (selectedAttackPhase && selectedCounterattack) { selectedCounterattack = false; const counter = get<HTMLButtonElement>('#counterattackToggle'); counter.classList.remove('selected'); counter.setAttribute('aria-pressed', 'false'); }
  get<HTMLElement>('#attackPhaseControls').querySelectorAll<HTMLButtonElement>('button').forEach((item) => { const selected = item.dataset.attackPhase === selectedAttackPhase; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
});
confirmButton.addEventListener('click', () => {
  const reboundDetails = selectedAction === 'Parada' ? ` · lanzador ${selectedShooter} · rebote ${selectedRebound}` : '';
  recordAction(selectedAction, `punto ${selectedZone} · ${selectedTarget} · ${selectedKeeper}${reboundDetails} · ${selectedPlayer}`);
});
