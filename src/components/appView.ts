export const appView = String.raw`
<div class="app">
    <header class="topbar">
      <button class="menu-trigger" id="menuTrigger" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button>
      <div class="clock" aria-label="Cronómetro del partido"><span class="clock-icon">◴</span><span id="gameClock">00:00</span></div>
      <div class="clock-controls" id="clockControls" hidden aria-label="Controles del cronómetro">
        <button class="clock-control" id="clockMinusSecond" type="button" aria-label="Retroceder un segundo" title="−1 segundo">−1</button>
        <button class="clock-control" id="pauseClock" type="button" aria-label="Pausar cronómetro" title="Pausar">Ⅱ</button>
        <button class="clock-control" id="resumeClock" type="button" aria-label="Reanudar cronómetro" title="Reanudar">▶</button>
        <button class="clock-control" id="clockPlusSecond" type="button" aria-label="Avanzar un segundo" title="+1 segundo">+1</button>
      </div>
      <div class="period">1.ª Parte</div>
      <div class="score" aria-label="Marcador del partido">
        <div class="team-score"><span id="topLocalName">Local</span><i></i></div><span class="number" id="topLocalScore">0</span><span class="dash">–</span><span class="number away" id="topVisitorScore">0</span><div class="team-score away"><span id="topVisitorName">Visitante</span><i></i></div>
      </div>
      <button class="live-stats-trigger" id="liveStatsTrigger" type="button" hidden><span>▥</span>Estadísticas</button>
      <div class="brand"><img class="brand-wordmark" src="/handstats-wordmark.svg" alt="HandStats"></div>
    </header>
    <div class="menu-backdrop" id="menuBackdrop" hidden></div>
    <nav class="side-menu" id="sideMenu" aria-label="Navegación" aria-hidden="true">
      <div class="menu-heading"><img class="brand-wordmark" src="/handstats-wordmark.svg" alt="HandStats"></div>
      <button class="menu-item" type="button" data-page="partidos"><span>◉</span>Partidos</button>
      <button class="menu-item" type="button" data-page="plantilla"><span>◉</span>Plantilla</button>
      <button class="menu-item" type="button" data-page="estadisticas-generales"><span>▥</span>Estadísticas generales</button>
      <button class="menu-item" type="button" data-page="preparacion"><span>◈</span>Preparación de partidos</button>
    </nav>
    <section class="home-page active" id="homePage">
      <div class="home-content">
        <img class="home-mark" src="/handstats-wordmark.svg" alt="HandStats">
        <h1>Registra el partido.<br><span>Entiende el juego.</span></h1>
        <p class="home-copy">Acciones rápidas durante el encuentro. Datos claros para revisar después.</p>
        <div class="home-choices">
          <button class="home-choice match-choice" type="button" data-page="partidos"><span class="choice-icon">◉</span><strong>Partido</strong><small>Registrar las acciones del partido</small><span class="choice-arrow">→</span></button>
          <button class="home-choice roster-choice" type="button" data-page="plantilla"><span class="choice-icon">◉</span><strong>Plantilla</strong><small>Consultar los jugadores de los equipos</small><span class="choice-arrow">→</span></button>
          <button class="home-choice general-choice" type="button" data-page="estadisticas-generales"><span class="choice-icon">▥</span><strong>Estadísticas generales</strong><small>Revisar el rendimiento de la temporada</small><span class="choice-arrow">→</span></button>
          <button class="home-choice preparation-choice" type="button" data-page="preparacion"><span class="choice-icon">◈</span><strong>Preparación de partidos</strong><small>Consultar equipos rivales</small><span class="choice-arrow">→</span></button>
        </div>
      </div>
      <div class="home-decoration" aria-hidden="true"><span>H</span></div>
    </section>
    <section class="preparation-page" id="preparationPage" aria-hidden="true">
      <main>
        <header class="preparation-heading"><div><span class="preparation-eyebrow">ANÁLISIS DE RIVALES</span><h1>Preparación de partidos</h1><p>Consulta los equipos que has guardado para preparar tus próximos encuentros.</p></div><button class="nav-button" id="preparationHome" type="button"><span class="arrow">←</span>Inicio</button></header>
        <section class="preparation-teams" aria-labelledby="preparationTeamsTitle"><div class="preparation-teams-heading"><div><h2 id="preparationTeamsTitle">Equipos guardados</h2><p id="preparationTeamCount">Los equipos disponibles aparecerán aquí.</p></div><button class="create-match-button" id="addPreparationTeam" type="button"><span>＋</span>Añadir equipo</button></div><div id="preparationTeamList" aria-live="polite"></div></section>
      </main>
    </section>
    <section class="preparation-page" id="preparationDetailPage" aria-hidden="true"><main><header class="preparation-heading"><div><span class="preparation-eyebrow">PREPARACIÓN DE PARTIDOS</span><h1 id="preparationDetailName"></h1><p>Consulta la plantilla y los partidos de este equipo.</p></div><button class="nav-button" id="preparationDetailBack" type="button"><span class="arrow">←</span>Equipos</button></header><div class="preparation-detail-actions"><button class="home-choice" data-team-section="partidos" type="button"><span class="choice-icon">◉</span><strong>Partidos</strong><small>Registrar y consultar encuentros</small><span class="choice-arrow">→</span></button><button class="home-choice" data-team-section="plantilla" type="button"><span class="choice-icon">◉</span><strong>Plantilla</strong><small>Administrar jugadores</small><span class="choice-arrow">→</span></button><button class="home-choice" data-team-section="estadisticas" type="button"><span class="choice-icon">▥</span><strong>Estadísticas generales</strong><small>Analizar el rendimiento</small><span class="choice-arrow">→</span></button></div></main></section>
    <dialog class="preparation-dialog" id="preparationTeamDialog" aria-labelledby="preparationDialogTitle"><form class="match-form" id="preparationTeamForm"><header class="match-form-heading"><div><h2 id="preparationDialogTitle">Añadir equipo</h2><p>Guarda un equipo para preparar tus partidos.</p></div><button class="modal-close" id="closePreparationDialog" type="button" aria-label="Cerrar">×</button></header><label class="match-field">Nombre del equipo<input id="preparationTeamName" name="name" maxlength="80" placeholder="Ej. Balonmano Norte" autocomplete="off" required></label><p class="match-form-error" id="preparationTeamError" role="alert" hidden></p><footer class="match-form-actions"><button class="nav-button" id="cancelPreparationTeam" type="button">Cancelar</button><button class="create-match-button" type="submit">Guardar equipo</button></footer></form></dialog>
    <dialog class="preparation-dialog squad-dialog" id="preparationSquadDialog" aria-labelledby="squadTitle"><form class="match-form" id="preparationSquadForm"><header class="match-form-heading"><div><h2 id="squadTitle">Convocatoria</h2><p>Selecciona los jugadores de la plantilla y añade los del rival.</p></div><button class="modal-close" id="squadClose" type="button" aria-label="Cerrar">×</button></header><div class="squad-list" id="squadPlayerList"></div><label class="match-field">Jugadores del rival <small>Uno por línea: dorsal, nombre. Ejemplo: 10, Ana López</small><textarea id="squadOpponents" rows="5" placeholder="10, Ana López&#10;12, Marcos Pérez"></textarea></label><p class="match-form-error" id="squadError" role="alert" hidden></p><footer class="match-form-actions"><button class="nav-button" id="squadCancel" type="button">Cancelar</button><button class="create-match-button" type="submit">Guardar convocatoria</button></footer></form></dialog>
    <section class="matches-page" id="matchesPage" aria-hidden="true">
      <main>
        <div class="matches-heading"><div><h1>Partidos</h1><p>Busca un encuentro o crea uno nuevo para empezar a registrar estadísticas.</p></div><button class="create-match-button" id="openMatchForm" type="button"><span>＋</span>Crear partido</button></div>
        <section class="matches-toolbar" aria-label="Buscar y filtrar partidos">
          <label class="match-search"><span>⌕</span><input id="matchSearch" type="search" placeholder="Buscar por equipo o competición" aria-label="Buscar partidos"></label>
          <label class="match-filter"><span>Estado</span><select id="matchStatusFilter" aria-label="Filtrar partidos por estado"><option value="todos">Todos</option><option value="Pendiente">Pendientes</option><option value="En juego">En juego</option><option value="Finalizado">Finalizados</option></select></label>
        </section>
        <div class="match-list" id="matchList" aria-live="polite"></div>
        <footer class="footer"><button class="nav-button" id="matchesHome" type="button"><span class="arrow">←</span>Inicio</button></footer>
      </main>
    </section>
    <div class="match-modal-backdrop" id="matchModalBackdrop" hidden></div>
    <section class="match-modal" id="matchModal" role="dialog" aria-modal="true" aria-labelledby="matchFormTitle" aria-hidden="true">
      <form class="match-form" id="matchForm">
        <header class="match-form-heading"><div><h2 id="matchFormTitle">Crear partido</h2></div><button class="modal-close" id="closeMatchForm" type="button" aria-label="Cerrar">×</button></header>
        <label class="match-field">Competición<input name="competition" placeholder="Ej. Liga — Jornada 4" required></label>
        <div class="match-form-teams"><label class="match-field">Equipo local<input name="home" placeholder="Nombre del equipo local" required></label><label class="match-field">Equipo visitante<input name="away" placeholder="Nombre del equipo visitante" required></label></div>
        <div class="match-form-teams"><label class="match-field">Fecha<input name="date" type="date" required></label><label class="match-field">Hora<input name="time" type="time" required></label></div>
        <label class="match-field">Lugar<input name="venue" placeholder="Pabellón o localidad"></label>
        <p class="match-form-error" id="matchFormError" role="alert" hidden></p>
        <footer class="match-form-actions"><button class="nav-button cancel" id="cancelMatchForm" type="button">Cancelar</button><button class="create-match-button" type="submit">Crear y registrar <span>→</span></button></footer>
      </form>
    </section>
    <section class="roster-page" id="rosterPage" aria-hidden="true">
      <main>
        <div class="roster-page-heading"><div><h1 class="page-title"><span class="title-icon">◉</span>Plantilla</h1><p class="roster-copy">Administra los jugadores de tus equipos.</p></div><button class="create-match-button" id="addPlayerButton" type="button"><span>＋</span>Añadir jugador</button></div>
        <section class="roster-toolbar" aria-label="Buscar y filtrar jugadores">
          <label class="match-search"><span>⌕</span><input id="playerSearch" type="search" placeholder="Buscar por nombre o dorsal" aria-label="Buscar jugadores"></label>
          <label class="match-filter"><span>Estado</span><select id="playerStatusFilter" aria-label="Filtrar por estado"><option value="todos">Todos</option><option value="disponible">Disponible</option><option value="lesionado">Lesionado</option></select></label>
        </section>
        <div class="roster-list" id="rosterList" aria-live="polite"></div>
        <footer class="footer"><button class="nav-button" id="rosterBack" type="button"><span class="arrow">←</span>Inicio</button></footer>
      </main>
    </section>
    <section class="general-stats-page" id="generalStatsPage" aria-hidden="true">
      <main>
        <header class="general-stats-heading"><div><span class="general-eyebrow">TEMPORADA 2026–27</span><h1>Estadísticas generales</h1><p>Rendimiento acumulado del equipo y de cada jugador.</p></div><button class="nav-button" id="generalStatsHome" type="button"><span class="arrow">←</span>Inicio</button></header>
        <section class="general-filters" aria-label="Filtros de estadísticas">
          <label class="general-filter-field">Sede<select id="generalVenueFilter"><option value="all">Local y visitante</option><option value="home">Solo como local</option><option value="away">Solo fuera de casa</option></select></label>
          <label class="general-filter-field">Partido<select id="generalMatchFilter"><option value="all">Todos los partidos</option></select></label>
          <label class="general-filter-field">Desde<input id="generalDateFrom" type="date"></label>
          <label class="general-filter-field">Hasta<input id="generalDateTo" type="date"></label>
          <label class="general-filter-field">Acción<select id="generalActionFilter"><option value="all">Todas las acciones</option><option value="penalties">Solo penaltis</option></select></label>
          <button class="general-filter-reset" id="generalFilterReset" type="button">Limpiar filtros</button>
        </section>
        <section class="general-stat-cards" aria-label="Resumen de temporada">
          <article class="general-stat-card"><span>Partidos jugados</span><strong id="generalMatchesPlayed">0</strong><small id="generalRecord">0V · 0E · 0D</small></article>
          <article class="general-stat-card"><span>Goles a favor</span><strong id="generalGoalsFor">0</strong><small id="generalGoalsForAvg">0 por partido</small></article>
          <article class="general-stat-card"><span>Goles en contra</span><strong id="generalGoalsAgainst">0</strong><small id="generalGoalsAgainstAvg">0 por partido</small></article>
          <article class="general-stat-card"><span>Posesiones propias medias</span><strong id="generalPossessionsAvg">—</strong><small id="generalPossessionsTotal">0 posesiones en 0 partidos</small></article>
          <article class="general-stat-card"><span>Ataques que llegan a lanzar</span><strong id="generalAttackReach">—</strong><small id="generalAttackReachCount">0 lanzamientos de 0 ataques</small></article>
          <article class="general-stat-card"><span>Efectividad de lanzamiento</span><strong id="generalShotEfficiency">—</strong><small id="generalShotTotals">0 goles / 0 lanzamientos</small></article>
          <article class="general-stat-card"><span>Penaltis anotados</span><strong id="generalPenaltyRate">—</strong><small id="generalPenaltyTotals">0 goles / 0 penaltis</small></article>
          <article class="general-stat-card"><span>Llegadas rivales a lanzamiento</span><strong id="generalRivalReach">—</strong><small id="generalRivalReachCount">0 lanzamientos de 0 ataques</small></article>
          <article class="general-stat-card"><span>Goles recibidos por lanzamiento</span><strong id="generalGoalsConcededRate">—</strong><small id="generalGoalsConcededCount">0 goles / 0 lanzamientos rivales</small></article>
          <article class="general-stat-card"><span>Golpes francos a favor</span><strong id="generalFreeThrows">0</strong><small>Faltas rivales y acciones provocadas</small></article>
          <article class="general-stat-card"><span>Paradas</span><strong id="generalSaves">0</strong><small id="generalSaveRate">— de eficacia de portería</small></article>
        </section>
        <section class="preparation-metrics" id="generalPreparationMetrics" hidden></section>
        <section class="general-charts">
          <article class="general-chart-panel"><header><div><h2>Marcadores por partido</h2><p>Goles a favor y en contra en cada encuentro</p></div><div class="chart-legend"><span><i class="chart-for"></i>A favor</span><span><i class="chart-against"></i>En contra</span></div></header><div class="general-chart-scroll"><svg id="generalScoreChart" viewBox="0 0 760 250" role="img" aria-label="Gráfica de goles por partido"></svg><p class="general-chart-empty" id="generalScoreEmpty">No hay partidos finalizados en este periodo.</p></div></article>
          <article class="general-chart-panel"><header><div><h2>Acciones registradas</h2><p>Totales en los partidos filtrados</p></div></header><div class="action-breakdown" id="generalActionBreakdown"></div></article>
        </section>
        <section class="general-heatmap-section" aria-label="Mapas de calor generales"><div class="general-heatmap-controls"><div class="general-map-side-switch" role="group" aria-label="Seleccionar mapas"><button type="button" data-general-map-side="all" class="selected" aria-pressed="true">Todos</button><button type="button" data-general-map-side="attack" aria-pressed="false">Ataque</button><button type="button" data-general-map-side="defense" aria-pressed="false">Defensa</button></div><div class="general-action-carousel"><button class="map-filter-arrow" type="button" data-general-map-scroll="-1" aria-label="Desplazar acciones a la izquierda">‹</button><div class="general-action-track" id="generalMapActionFilter" role="group" aria-label="Filtrar por acción"><button type="button" data-general-map-action="Todas" class="map-filter-chip selected" aria-pressed="true">Todas</button></div><button class="map-filter-arrow" type="button" data-general-map-scroll="1" aria-label="Desplazar acciones a la derecha">›</button></div><div class="map-mode-switch general-map-mode-switch" id="generalMapModeControl" role="group" aria-label="Modo de visualización"><button type="button" data-general-map-mode="effectiveness" class="selected" aria-pressed="true">Efectividad</button><button type="button" data-general-map-mode="frequency" aria-pressed="false">Frecuencia</button><button type="button" data-general-map-mode="points" aria-pressed="false">Puntos</button></div></div><div class="general-heatmaps"><article class="general-chart-panel" id="generalAttackMapPanel"><header><div><h2>Ataque</h2><p>Acciones ofensivas del equipo según los filtros</p></div></header><div class="general-heatmap-wrap"><svg id="generalAttackHeatmap" viewBox="0 0 920 440" role="img" aria-label="Mapa de calor general de ataque"></svg><p class="general-chart-empty" id="generalAttackHeatEmpty">No hay acciones con coordenadas para estos filtros.</p></div><div class="heatmap-legend"><span><i class="heat-good"></i>Acción exitosa</span><span><i class="heat-bad"></i>Acción no exitosa</span></div></article><article class="general-chart-panel" id="generalDefenseMapPanel"><header><div><h2>Defensa</h2><p>Acciones defensivas del equipo según los filtros</p></div></header><div class="general-heatmap-wrap"><svg id="generalDefenseHeatmap" viewBox="0 0 920 440" role="img" aria-label="Mapa de calor general de defensa"></svg><p class="general-chart-empty" id="generalDefenseHeatEmpty">No hay acciones con coordenadas para estos filtros.</p></div><div class="heatmap-legend"><span><i class="heat-good"></i>Acción defensiva exitosa</span><span><i class="heat-bad"></i>Acción defensiva no exitosa</span></div></article></div></section>
        <section class="general-penalty-maps" aria-label="Penaltis por zona de portería"><article class="general-chart-panel"><header><div><h2>Penaltis lanzados por zona</h2><p>Goles / lanzamientos de nuestro equipo según los filtros</p></div></header><div class="general-penalty-goal-wrap"><svg id="generalPenaltyShotMap" viewBox="0 0 450 245" role="img" aria-label="Penaltis lanzados por nuestro equipo por zona"></svg><p class="general-chart-empty" id="generalPenaltyShotEmpty">No hay penaltis registrados con estos filtros.</p></div></article><article class="general-chart-panel"><header><div><h2>Penaltis parados por zona</h2><p>Paradas / penaltis recibidos por nuestro portero</p></div></header><div class="general-penalty-goal-wrap"><svg id="generalPenaltySaveMap" viewBox="0 0 450 245" role="img" aria-label="Penaltis parados por nuestro equipo por zona"></svg><p class="general-chart-empty" id="generalPenaltySaveEmpty">No hay penaltis registrados con estos filtros.</p></div></section>
        <article class="general-player-panel"><header><div><h2>Estadísticas por jugador</h2><p>Producción, disciplina, defensa y participación ofensiva</p></div><label class="general-player-search"><span>⌕</span><input id="generalPlayerSearch" type="search" placeholder="Buscar jugador" aria-label="Buscar jugador en estadísticas"></label></header><div class="general-table-scroll"><table class="stats-table general-player-table"><thead><tr><th data-sort-column="name"><span>Jugador</span><button class="sort-toggle" type="button" data-sort="name" aria-label="Ordenar por jugador">↕</button></th><th data-sort-column="goals"><span>Goles</span><button class="sort-toggle" type="button" data-sort="goals" aria-label="Ordenar por goles">↕</button></th><th data-sort-column="assists"><span>Asistencias</span><button class="sort-toggle" type="button" data-sort="assists" aria-label="Ordenar por asistencias">↕</button></th><th data-sort-column="freeThrows"><span>Golpes francos</span><button class="sort-toggle" type="button" data-sort="freeThrows" aria-label="Ordenar por golpes francos">↕</button></th><th data-sort-column="twoMin"><span>2 min</span><button class="sort-toggle" type="button" data-sort="twoMin" aria-label="Ordenar por exclusiones de dos minutos">↕</button></th><th data-sort-column="yellow"><span>Amarillas</span><button class="sort-toggle" type="button" data-sort="yellow" aria-label="Ordenar por tarjetas amarillas">↕</button></th><th data-sort-column="red"><span>Rojas</span><button class="sort-toggle" type="button" data-sort="red" aria-label="Ordenar por tarjetas rojas">↕</button></th><th data-sort-column="steals"><span>Robos</span><button class="sort-toggle" type="button" data-sort="steals" aria-label="Ordenar por robos">↕</button></th><th data-sort-column="blocks"><span>Blocajes</span><button class="sort-toggle" type="button" data-sort="blocks" aria-label="Ordenar por blocajes">↕</button></th><th data-sort-column="losses"><span>Pérdidas</span><button class="sort-toggle" type="button" data-sort="losses" aria-label="Ordenar por pérdidas">↕</button></th></tr></thead><tbody id="generalPlayerRows"></tbody></table></div></article>
      </main>
    </section>
    <div class="individual-player-backdrop" id="individualPlayerBackdrop" hidden></div>
    <section class="individual-player-modal" id="individualPlayerModal" role="dialog" aria-modal="true" aria-labelledby="individualPlayerName" aria-hidden="true" tabindex="-1">
      <header class="individual-player-heading"><div><span class="general-eyebrow">FICHA INDIVIDUAL</span><h2 id="individualPlayerName"></h2><p id="individualPlayerContext">Estadísticas con los filtros seleccionados</p></div><button class="modal-close" id="closeIndividualPlayer" type="button" aria-label="Cerrar">×</button></header>
      <div class="individual-player-content" id="individualPlayerContent"></div>
    </section>
    <div class="player-modal-backdrop" id="playerModalBackdrop" hidden></div>
    <section class="player-modal" id="playerModal" role="dialog" aria-modal="true" aria-labelledby="playerFormTitle" aria-hidden="true">
      <form class="player-form" id="playerForm">
        <header class="match-form-heading"><div><h2 id="playerFormTitle">Añadir jugador</h2></div><button class="modal-close" id="closePlayerForm" type="button" aria-label="Cerrar">×</button></header>
        <div class="match-form-teams"><label class="match-field">Nombre y apellidos<input name="name" placeholder="Nombre del jugador" required maxlength="60"></label><label class="match-field">Dorsal<input name="number" placeholder="Ej. 24" required inputmode="numeric" maxlength="3"></label></div>
        <section class="player-extra-fields" id="playerExtraFields" hidden aria-label="Información adicional del jugador">
          <p>Información adicional <small>Opcional · puedes añadirla al editar</small></p>
          <div class="player-extra-grid">
            <label class="match-field">Altura (cm)<input name="heightCm" type="number" min="100" max="250" placeholder="Ej. 182"></label>
            <label class="match-field">Peso (kg)<input name="weightKg" type="number" min="30" max="200" placeholder="Ej. 78"></label>
            <label class="match-field">Edad<input name="age" type="number" min="10" max="80" placeholder="Ej. 24"></label>
            <label class="match-field">Posición<input name="position" placeholder="Ej. Extremo"></label>
          </div>
        </section>
        <label class="injury-toggle"><input name="injured" type="checkbox"><span><strong>Jugador lesionado</strong><small>Se mostrará como no disponible en la plantilla.</small></span></label>
        <p class="player-form-error" id="playerFormError" role="alert" hidden></p>
        <footer class="match-form-actions"><button class="nav-button cancel" id="cancelPlayerForm" type="button">Cancelar</button><button class="create-match-button" type="submit"><span>→</span>Guardar jugador</button></footer>
      </form>
    </section>
    <section class="players-page hidden" id="playersPage">
      <main>
        <h1 class="page-title"><span class="title-icon">◉</span>Selecciona el jugador que realiza la acción</h1>
        <p class="current-match-note" id="currentMatchLabel"></p>
        <div class="recorded-banner" id="recordedBanner" role="status" hidden></div>
        <div class="columns">
          <section class="team-panel" aria-label="Jugadores del equipo local">
            <h2 class="team-heading"><span class="jersey">◉</span>Local</h2><div class="cards" id="homePlayers"></div>
          </section>
          <section class="team-panel" aria-label="Jugadores del equipo visitante">
            <h2 class="team-heading visitor"><span class="jersey">◉</span>Visitante</h2><div class="cards visitor-cards" id="awayPlayers"></div>
          </section>
        </div>
        <footer class="footer"><button class="nav-button" type="button" aria-label="Volver"><span class="arrow">←</span>Volver</button></footer>
      </main>
    </section>
    <section class="live-stats-page" id="liveStatsPage" aria-hidden="true">
      <main>
        <section class="preparation-metrics" id="livePreparationMetrics" hidden></section>
        <header class="live-stats-heading">
          <div><h1>Estadísticas en vivo</h1><p id="liveMatchLabel">Selecciona un partido para ver sus datos.</p></div>
          <button class="nav-button" id="liveStatsBack" type="button"><span class="arrow">←</span>Volver al partido</button>
        </header>
        <div class="live-team-switch" role="group" aria-label="Equipo seleccionado">
          <button class="live-team-button selected" type="button" data-live-team="Local" aria-pressed="true">Local</button>
          <button class="live-team-button" type="button" data-live-team="Visitante" aria-pressed="false">Visitante</button>
        </div>
        <section class="live-map-filter" aria-label="Filtrar mapas por tipo de acción">
          <span class="live-map-filter-label">Ver mapas de</span>
          <div class="map-filter-carousel">
            <button class="map-filter-arrow" id="mapFilterPrev" type="button" aria-label="Desplazar acciones hacia la izquierda">‹</button>
            <div class="map-filter-track" id="liveMapFilter" role="group" aria-label="Tipo de acción">
              <button class="map-filter-chip selected" type="button" data-map-filter="Todas" aria-pressed="true">Todas</button>
              <button class="map-filter-chip" type="button" data-map-filter="Lanzamientos" aria-pressed="false">Lanzamientos</button>
              <button class="map-filter-chip" type="button" data-map-filter="Penaltis" aria-pressed="false">Penaltis</button>
              <button class="map-filter-chip" type="button" data-map-filter="Contraataques" aria-pressed="false">Contraataques</button>
              <button class="map-filter-chip" type="button" data-map-filter="Gol" aria-pressed="false">Goles</button>
              <button class="map-filter-chip" type="button" data-map-filter="Lanzamiento fallado" aria-pressed="false">Fallos</button>
              <button class="map-filter-chip" type="button" data-map-filter="Parada" aria-pressed="false">Paradas</button>
              <button class="map-filter-chip" type="button" data-map-filter="Pérdida" aria-pressed="false">Pérdidas</button>
              <button class="map-filter-chip" type="button" data-map-filter="Acciones defensivas" aria-pressed="false">Defensa</button>
              <button class="map-filter-chip" type="button" data-map-filter="Robo" aria-pressed="false">Robos</button>
              <button class="map-filter-chip" type="button" data-map-filter="Blocaje" aria-pressed="false">Blocajes</button>
              <button class="map-filter-chip" type="button" data-map-filter="Interceptación" aria-pressed="false">Interceptaciones</button>
              <button class="map-filter-chip" type="button" data-map-filter="Falta defensiva" aria-pressed="false">Faltas defensivas</button>
              <button class="map-filter-chip" type="button" data-map-filter="Penalti cometido" aria-pressed="false">Penalti cometido</button>
              <button class="map-filter-chip" type="button" data-map-filter="7 m provocado" aria-pressed="false">7 m provocados</button>
              <button class="map-filter-chip" type="button" data-map-filter="Golpe franco" aria-pressed="false">Golpes francos</button>
              <button class="map-filter-chip" type="button" data-map-filter="Falta en ataque" aria-pressed="false">Faltas en ataque</button>
              <button class="map-filter-chip" type="button" data-map-filter="Asistencia" aria-pressed="false">Asistencias</button>
              <button class="map-filter-chip" type="button" data-map-filter="Penetración" aria-pressed="false">Penetraciones</button>
              <button class="map-filter-chip" type="button" data-map-filter="1 contra 1" aria-pressed="false" hidden>1 contra 1</button>
              <button class="map-filter-chip" type="button" data-map-filter="2 min" aria-pressed="false">Exclusiones</button>
              <button class="map-filter-chip" type="button" data-map-filter="Tarjeta amarilla" aria-pressed="false">Tarjetas amarillas</button>
              <button class="map-filter-chip" type="button" data-map-filter="Tarjeta roja" aria-pressed="false">Tarjetas rojas</button>
            </div>
            <button class="map-filter-arrow" id="mapFilterNext" type="button" aria-label="Desplazar acciones hacia la derecha">›</button>
          </div>
          <div class="map-mode-switch live-map-mode-switch" id="liveMapModeControl" role="group" aria-label="Modo de visualización del mapa"><button type="button" data-live-map-mode="effectiveness" class="selected" aria-pressed="true">Efectividad</button><button type="button" data-live-map-mode="frequency" aria-pressed="false">Frecuencia</button><button type="button" data-live-map-mode="points" aria-pressed="false">Puntos</button></div>
        </section>
        <section class="live-kpis" aria-label="Eficacia del equipo">
          <article class="live-kpi"><span>Ataques que acaban en lanzamiento</span><strong id="attackRate">—</strong><small id="attackCount">0 lanzamientos de 0 ataques</small></article>
          <article class="live-kpi"><span>Efectividad de lanzamiento</span><strong id="shotRate">—</strong><small id="shotCount">0 goles de 0 lanzamientos</small></article>
          <article class="live-kpi"><span>Defensa evita lanzamiento</span><strong id="defenseRate">—</strong><small id="defenseCount">0 ataques rivales sin lanzamiento</small></article>
          <article class="live-kpi"><span>Llegadas rivales a lanzamiento</span><strong id="rivalArrivalRate">—</strong><small id="rivalArrivalCount">0 lanzamientos rivales de 0 ataques</small></article>
          <article class="live-kpi"><span>Goles recibidos</span><strong id="concededRate">—</strong><small id="concededCount">0 goles de 0 lanzamientos rivales</small></article>
          <article class="live-kpi"><span id="keeperKpiTitle">Paradas · nuestro portero</span><strong id="keeperRate">—</strong><small id="keeperCount">0 paradas de 0 lanzamientos</small></article>
        </section>
        <section class="live-possession-panel" aria-label="Estimación de posesiones del partido">
          <div class="live-possession-copy"><span class="live-possession-eyebrow">RITMO DE PARTIDO</span><h2 id="possessionProjectionTitle">Posesiones propias estimadas al final</h2><p id="possessionProjectionNote">Proyección sobre un partido de 60 minutos desde el inicio del registro.</p></div>
          <div class="live-possession-number"><strong id="livePossessionProjection">—</strong><span id="livePossessionLabel">posesiones estimadas</span></div>
          <div class="live-possession-current"><span id="livePossessionCurrent">0 posesiones propias</span><small id="livePossessionElapsed">Ritmo: esperando el inicio</small></div>
        </section>
        <section class="live-maps" aria-label="Mapas de calor del partido">
          <article class="live-map-panel"><header><div><h2>Ataque</h2><p>Mapa de balonmano · zonas de lanzamiento y resultado</p></div></header><div class="heatmap-wrap"><svg id="attackHeatmap" class="heatmap-court" viewBox="0 0 920 440" role="img" aria-label="Mapa de calor sobre pista de balonmano"></svg><p class="heatmap-empty" id="attackHeatEmpty">Los lanzamientos aparecerán aquí al registrarlos.</p></div><div class="heatmap-legend"><span><i class="heat-good"></i>Gol</span><span><i class="heat-bad"></i>Lanzamiento fallado</span></div></article>
          <article class="live-map-panel"><header><div><h2>Defensa</h2><p>Mapa de balonmano · acciones defensivas exitosas y no exitosas</p></div></header><div class="heatmap-wrap"><svg id="defenseHeatmap" class="heatmap-court" viewBox="0 0 920 440" role="img" aria-label="Mapa de calor defensivo sobre pista de balonmano"></svg><p class="heatmap-empty" id="defenseHeatEmpty">Las acciones defensivas aparecerán aquí al registrarlas.</p></div><div class="heatmap-legend"><span><i class="heat-good"></i>Defensa exitosa</span><span><i class="heat-bad"></i>Defensa no exitosa</span></div></article>
        </section>
        <section class="live-goal-maps" id="liveGoalMaps" aria-label="Eficacia por zonas de portería">
          <article class="live-map-panel goal-efficiency-panel"><header><div><h2 id="shotGoalMapTitle">Efectividad de nuestros lanzamientos</h2><p id="shotGoalMapSubtitle">Porcentaje de gol en cada zona de la portería rival</p></div></header><div class="goal-map-wrap"><svg id="shotGoalMap" class="goal-efficiency-map" viewBox="0 0 450 245" role="img" aria-label="Efectividad de lanzamiento por zona de portería"></svg><p class="heatmap-empty" id="shotGoalMapEmpty">Se mostrará al registrar lanzamientos.</p></div><div class="heatmap-legend efficiency-legend"><span><i class="eff-low"></i>Baja</span><span><i class="eff-mid"></i>Media</span><span><i class="eff-high"></i>Alta</span></div></article>
          <article class="live-map-panel goal-efficiency-panel"><header><div><h2 id="keeperGoalMapTitle">Goles recibidos por nuestro portero</h2><p id="keeperGoalMapSubtitle">Goles / lanzamientos rivales por zona (menor porcentaje, mejor)</p></div></header><div class="goal-map-wrap"><svg id="keeperGoalMap" class="goal-efficiency-map" viewBox="0 0 450 245" role="img" aria-label="Goles recibidos sobre lanzamientos rivales por zona de la portería"></svg><p class="heatmap-empty" id="keeperGoalMapEmpty">Se mostrará al registrar lanzamientos rivales.</p></div><div class="heatmap-legend efficiency-legend"><span><i class="eff-high"></i>Mejor · pocos goles</span><span><i class="eff-mid"></i>Intermedio</span><span><i class="eff-low"></i>Peor · muchos goles</span></div></article>
        </section>
        <section class="live-tables" id="liveTables">
          <article class="live-table-panel"><header><div><h2 id="shooterTableTitle">Lanzamientos del equipo local</h2><p>Goles, intentos y porcentaje de éxito</p></div></header><div class="live-table-scroll"><table class="stats-table"><thead><tr><th>Jugador</th><th>Goles</th><th>Lanzamientos</th><th>Éxito</th></tr></thead><tbody id="shooterStatsRows"></tbody></table></div></article>
          <article class="live-table-panel" id="keeperTablePanel"><header><div><h2 id="keeperTableTitle">Porteros del equipo local</h2><p>Paradas y porcentaje sobre lanzamientos recibidos</p></div></header><div class="live-table-scroll"><table class="stats-table"><thead><tr><th>Portero</th><th>Paradas</th><th>Recibidos</th><th>Éxito</th></tr></thead><tbody id="keeperStatsRows"></tbody></table></div></article>
        </section>
        <p class="live-stats-footnote">Un ataque cuenta como llegada cuando termina en lanzamiento. La eficacia de lanzamiento compara goles con lanzamientos; la defensa muestra las llegadas rivales y los goles que convierten.</p>
      </main>
    </section>
    <section class="actions-page" id="actionsPage" aria-hidden="true">
      <main>
        <h1 class="page-title"><span class="title-icon">＋</span>Selecciona la acción realizada</h1>
        <div class="action-grid">
          <section class="action-list"><h2 class="action-heading"><img src="/icons/actions/offense-heading.svg" alt="" aria-hidden="true">Ofensiva</h2><div class="action-items" id="offense"></div></section>
          <section class="action-list defensive"><h2 class="action-heading defense"><img src="/icons/actions/defense-heading.svg" alt="" aria-hidden="true">Defensiva</h2><div class="action-items" id="defense"></div></section>
        </div>
        <p class="selection-note" id="selectionNote" aria-live="polite"></p>
        <footer class="footer actions-footer"><button class="nav-button" id="backButton" type="button"><span class="arrow">←</span>Volver</button><button class="nav-button cancel" id="cancelButton" type="button"><span class="arrow">×</span>Cancelar</button></footer>
      </main>
    </section>
    <section class="shot-page" id="shotPage" aria-hidden="true">
      <main>
        <div class="shot-topline">
          <div class="shot-title"><span class="target-icon">◎</span><div><h1 id="shotTitle">Lanzamiento</h1><p id="shotHelp">Define el resultado y la información del tiro</p></div></div>
          <div class="shot-type-controls"><button class="penalty-toggle" id="penaltyToggle" type="button" aria-pressed="false" title="Indica si el lanzamiento fue de 7 metros"><span>7 m</span><strong id="penaltyToggleLabel">Penalti</strong></button><button class="counterattack-toggle" id="counterattackToggle" type="button" aria-pressed="false"><span aria-hidden="true">↗</span><strong>Contraataque</strong></button></div>
          <button class="result-button goal" data-result="Gol" type="button"><span>●</span>Gol</button>
          <button class="result-button miss" data-result="Lanzamiento fallado" type="button"><span>⊗</span>Lanzamiento fallado</button>
        </div>
        <div class="attack-phase-controls" id="attackPhaseControls" hidden role="group" aria-label="Tipo de ataque"><strong>Tipo de ataque</strong><button type="button" data-attack-phase="posicional" aria-pressed="false">Posicional</button><button type="button" data-attack-phase="segunda_oleada" aria-pressed="false">Segunda oleada</button><span>Para contraataque, usa el botón de arriba.</span></div>
        <div class="shot-panels">
          <section class="shot-panel">
            <div class="panel-heading"><span class="panel-icon">◉</span><div><h2>Zona de lanzamiento</h2><p>Selecciona desde dónde se ha lanzado</p></div></div>
            <div class="court-wrap">
              <svg class="court" viewBox="0 0 520 320" preserveAspectRatio="none" role="application" tabindex="0" aria-label="Pulsa o toca el campo para marcar el punto exacto del lanzamiento. Usa las flechas para ajustar el punto.">
                <image href="/handball-half-court.svg" x="0" y="0" width="520" height="320" preserveAspectRatio="none"/>
                <circle id="shotMarker" class="court-dot" cx="0" cy="0" r="9" style="display:none" aria-hidden="true"/>
              </svg>
            </div>
          </section>
          <div class="right-stack">
            <section class="shot-panel goal-panel">
              <div class="panel-heading"><span class="panel-icon">▤</span><div><h2>Dirección del lanzamiento</h2><p>Selecciona dónde ha ido el balón</p></div></div>
              <div class="goal-wrap">
                <svg class="goal" viewBox="0 0 450 245" preserveAspectRatio="none" role="group" aria-label="Selecciona la zona de la portería">
                  <rect class="goal-outline" x="38" y="12" width="374" height="220" rx="7"/>
                  <rect class="goal-rail" x="38" y="12" width="18" height="220"/><rect class="goal-rail" x="394" y="12" width="18" height="220"/>
                  <rect class="goal-rail" x="38" y="12" width="374" height="17"/><rect class="goal-rail" x="38" y="215" width="374" height="17"/>
                  <rect class="goal-net" x="56" y="29" width="338" height="186" rx="5"/>
                  <g class="goal-cell" data-target="Arriba izquierda"><rect x="56" y="29" width="112.7" height="62" rx="5"/></g><g class="goal-cell" data-target="Arriba centro"><rect x="168.7" y="29" width="112.7" height="62"/></g><g class="goal-cell" data-target="Arriba derecha"><rect x="281.4" y="29" width="112.6" height="62" rx="5"/></g>
                  <g class="goal-cell" data-target="Centro izquierda"><rect x="56" y="91" width="112.7" height="62"/></g><g class="goal-cell" data-target="Centro"><rect x="168.7" y="91" width="112.7" height="62"/></g><g class="goal-cell" data-target="Centro derecha"><rect x="281.4" y="91" width="112.6" height="62"/></g>
                  <g class="goal-cell" data-target="Abajo izquierda"><rect x="56" y="153" width="112.7" height="62" rx="5"/></g><g class="goal-cell" data-target="Abajo centro"><rect x="168.7" y="153" width="112.7" height="62"/></g><g class="goal-cell" data-target="Abajo derecha"><rect x="281.4" y="153" width="112.6" height="62" rx="5"/></g>
                </svg>
              </div>
              <div class="miss-destinations" id="missDestinations" hidden role="group" aria-label="Destino del lanzamiento fallado">
                <button class="miss-destination" type="button" data-target="Palo" aria-pressed="false">↗ Palo</button>
                <button class="miss-destination" type="button" data-target="Fuera de la portería" aria-pressed="false">↗ Fuera de la portería</button>
              </div>
            </section>
            <section class="shot-panel keeper-panel">
              <div class="panel-heading"><span class="panel-icon">○</span><div><h2>Portero</h2><p>Selecciona el portero que estaba en la portería</p></div></div>
              <div class="keeper-options" id="keeperOptions" role="group" aria-label="Selecciona el portero"></div>
              <div class="rebound-panel" id="reboundPanel" hidden>
                <div class="rebound-heading"><span>↩</span><div><strong>Rebote</strong><small>¿Quién recuperó el balón?</small></div></div>
                <div class="rebound-options" id="reboundOptions" role="group" aria-label="Selecciona quién recuperó el rebote">
                  <button class="rebound-button" type="button" data-rebound-team="" aria-pressed="false">Mi equipo</button>
                  <button class="rebound-button" type="button" data-rebound-team="" aria-pressed="false">Rival</button>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div class="save-extras" id="saveExtras" aria-hidden="true">
          <section class="shot-panel shooter-panel">
            <div class="panel-heading"><span class="panel-icon">◉</span><div><h2>Lanzador rival</h2><p id="shooterHelp">Selecciona quién realizó el lanzamiento</p></div></div>
            <div class="shooter-grid" id="shooterGrid" role="group" aria-label="Selecciona al jugador rival que lanzó"></div>
          </section>
        </div>
        <p class="selection-note" id="shotNote" aria-live="polite"></p>
        <footer class="footer shot-footer"><button class="nav-button" id="shotBack" type="button"><span class="arrow">←</span>Volver</button><button class="nav-button cancel" id="shotCancel" type="button"><span class="arrow">⊗</span>Cancelar</button><button class="nav-button confirm-button" id="confirmShot" type="button" disabled><span class="arrow">→</span>Confirmar</button></footer>
      </main>
    </section>
    <section class="field-action-page" id="fieldActionPage" aria-hidden="true">
      <main>
        <div class="field-action-heading">
          <span class="target-icon">◎</span>
          <div><h1 id="fieldActionTitle">Acción</h1><p>Marca en el campo dónde ocurrió</p></div>
        </div>
        <section class="turnover-types" id="turnoverTypes" hidden aria-label="Tipo de pérdida">
          <span>Tipo de pérdida</span>
          <div class="turnover-options" role="group" aria-label="Selecciona el motivo de la pérdida">
            <button class="turnover-option" type="button" data-turnover="Fallo de pase" aria-pressed="false">Fallo de pase</button>
            <button class="turnover-option" type="button" data-turnover="Fallo de recepción" aria-pressed="false">Fallo de recepción</button>
            <button class="turnover-option" type="button" data-turnover="Dobles" aria-pressed="false">Dobles</button>
            <button class="turnover-option" type="button" data-turnover="Pasos" aria-pressed="false">Pasos</button>
          </div>
        </section>
        <section class="duel-options" id="duelOptions" hidden><div><strong>Salida del atacante</strong><div role="group" aria-label="Lado de salida"><button type="button" data-duel-direction="izquierda" aria-pressed="false">← Izquierda</button><button type="button" data-duel-direction="derecha" aria-pressed="false">Derecha →</button></div></div><div><strong>Resultado del 1 contra 1</strong><div role="group" aria-label="Resultado del duelo"><button type="button" data-duel-result="success" aria-pressed="false">Supera al defensor</button><button type="button" data-duel-result="failure" aria-pressed="false">No supera al defensor</button></div></div><p>El lado se refiere a la izquierda o derecha del atacante.</p></section>
        <section class="field-map-panel" aria-label="Mapa del campo de balonmano">
          <svg class="full-court" viewBox="0 0 920 440" role="application" tabindex="0" aria-label="Pulsa o toca el campo para marcar el punto exacto. Usa las flechas para ajustar el punto.">
            <image href="/handball-court.svg" x="0" y="0" width="920" height="440" preserveAspectRatio="none"/>
            <g class="field-half-label own-half-label"><rect x="91" y="26" width="270" height="38" rx="19"/><text id="leftHalfLabel" x="226" y="46">Nuestro medio campo</text></g>
            <g class="field-half-label rival-half-label"><rect x="559" y="26" width="270" height="38" rx="19"/><text id="rightHalfLabel" x="694" y="46">Medio campo rival</text></g>
            <circle id="fieldActionMarker" class="field-marker" cx="0" cy="0" r="12" style="display:none" aria-hidden="true"/>
          </svg>
        </section>
        <p class="selection-note field-map-note" id="fieldActionNote" aria-live="polite">Toca el campo para marcar la acción</p>
        <footer class="footer field-action-footer">
          <button class="nav-button" id="fieldBack" type="button"><span class="arrow">←</span>Volver</button>
          <button class="nav-button cancel" id="fieldCancel" type="button"><span class="arrow">⊗</span>Cancelar</button>
          <button class="nav-button confirm-button" id="confirmFieldAction" type="button" disabled><span class="arrow">→</span>Confirmar</button>
        </footer>
      </main>
    </section>
  </div>
`;
