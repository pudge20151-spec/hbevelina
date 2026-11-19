/* ==========================================================================
   ARCHIVE 022 — SCRIPT (FIXED)
   Vanilla JS, LocalStorage persistence, no frameworks
   ========================================================================== */

const STORAGE_KEY = 'archive022_v2';

const SECTION_ORDER = [
  'access',
  'player',
  'cyber',
  'mind',
  'unknown',
  'classified',
  'finallog'
];

const SECTION_LABELS = {
  access: 'ACCESS',
  player: 'PLAYER',
  cyber: 'CYBER',
  mind: 'MIND',
  unknown: 'UNKNOWN',
  classified: 'CLASSIFIED',
  finallog: 'FINAL LOG'
};

const SECTION_DESCS = {
  access: 'Точка входа в архив.',
  player: 'Игровой профиль и киберспорт.',
  cyber: 'Цифровой след и информационная безопасность.',
  mind: 'Внутренний мир — личные записи.',
  unknown: 'Неизвестное — лёгкие размышления.',
  classified: 'Засекреченный материал.',
  finallog: 'Финальная запись.'
};

const PASSWORD = 'MIND';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let state = {
  version: 2,
  sections: {
    access: 'available',
    player: 'locked',
    cyber: 'locked',
    mind: 'locked',
    unknown: 'locked',
    classified: 'locked',
    finallog: 'locked'
  },
  letters: { M: false, I: false, N: false, D: false },
  stars: { player: false, cyber: false, unknown: false },
  mindFragments: [false, false, false, false],
  mindValuesText: '',
  lastView: 'access'
};

function defaultState() {
  return {
    version: 2,
    sections: {
      access: 'available',
      player: 'locked',
      cyber: 'locked',
      mind: 'locked',
      unknown: 'locked',
      classified: 'locked',
      finallog: 'locked'
    },
    letters: { M: false, I: false, N: false, D: false },
    stars: { player: false, cyber: false, unknown: false },
    mindFragments: [false, false, false, false],
    mindValuesText: '',
    lastView: 'access'
  };
}

// ---------------------------------------------------------------------------
// LocalStorage persistence
// ---------------------------------------------------------------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const s = defaultState();
    if (parsed.sections) s.sections = { ...s.sections, ...parsed.sections };
    if (parsed.letters) s.letters = { ...s.letters, ...parsed.letters };
    if (parsed.stars) s.stars = { ...s.stars, ...parsed.stars };
    if (Array.isArray(parsed.mindFragments)) s.mindFragments = parsed.mindFragments;
    if (typeof parsed.mindValuesText === 'string') s.mindValuesText = parsed.mindValuesText;
    if (parsed.lastView) s.lastView = parsed.lastView;
    return s;
  } catch (e) {
    console.warn('Archive 022: failed to load state', e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Archive 022: failed to save state', e);
  }
}

function resetState() {
  state = defaultState();
  saveState();
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------
function completedCount() {
  return Object.values(state.sections).filter(v => v === 'completed').length;
}

function updateProgress() {
  const el = document.getElementById('progressCount');
  if (el) el.textContent = `${completedCount()}/7`;
  const hubStatus = document.getElementById('hubStatus');
  if (hubStatus) hubStatus.textContent = `${completedCount()} / 7 ЗАВЕРШЕНО`;
  const hubCount = document.getElementById('hubProgressCount');
  const hubValue = document.getElementById('hubProgressValue');
  const hubFill = document.getElementById('hubProgressFill');
  const count = completedCount();
  const percent = Math.round((count / SECTION_ORDER.length) * 100);
  if (hubCount) hubCount.textContent = `${count} из ${SECTION_ORDER.length}`;
  if (hubValue) hubValue.textContent = `${percent}%`;
  if (hubFill) hubFill.style.width = `${percent}%`;
}

// ---------------------------------------------------------------------------
// Unlocking / completion
// ---------------------------------------------------------------------------
function unlock(sectionId) {
  if (!state.sections[sectionId]) return;
  if (state.sections[sectionId] === 'locked') {
    state.sections[sectionId] = 'available';
    saveState();
  }
}

function completeSection(sectionId) {
  if (!state.sections[sectionId]) return;
  if (state.sections[sectionId] === 'completed') return; // already done
  state.sections[sectionId] = 'completed';
  saveState();
  updateProgress();
  renderHub();

  switch (sectionId) {
    case 'access':
      unlock('player');
      break;
    case 'player':
      unlock('cyber');
      break;
    case 'cyber':
      unlock('mind');
      break;
    case 'mind':
      unlock('unknown');
      break;
    case 'unknown':
      tryUnlockClassified();
      break;
    case 'classified':
      unlock('finallog');
      break;
  }

  saveState();
  renderHub();
  updateProgress();
}

function tryUnlockClassified() {
  const allLetters = Object.values(state.letters).every(Boolean);
  if (allLetters && state.sections.unknown === 'completed') {
    unlock('classified');
  }
}

function setLetter(letter) {
  if (state.letters[letter]) return;
  state.letters[letter] = true;
  saveState();
  updateProgress();
  renderHub();
  tryUnlockClassified();
  showToast(`Буква ${letter} найдена`);
}

function setStar(which) {
  if (state.stars[which]) return;
  state.stars[which] = true;
  saveState();
  renderHub();
}
// ---------------------------------------------------------------------------
// View router
// ---------------------------------------------------------------------------
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    state.lastView = viewId;
    saveState();
  }
  updateProgress();
}

function navigateTo(sectionId) {
  if (!state.sections[sectionId]) return;
  const status = state.sections[sectionId];
  if (status === 'locked') {
    showToast('Раздел ещё закрыт.');
    return;
  }
  showView(sectionId);
}

// ---------------------------------------------------------------------------
// Hub rendering
// ---------------------------------------------------------------------------
function renderHub() {
  const grid = document.getElementById('sectionsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const moduleMeta = {
    access:    { number: '01', category: 'ENTRY POINT', icon: '↳', hint: 'Начать знакомство с архивом' },
    player:    { number: '02', category: 'PROFILE', icon: '◈', hint: 'Открыть игровой профиль' },
    cyber:     { number: '03', category: 'DIGITAL TRACE', icon: '⌘', hint: 'Открыть CYBER TERMINAL' },
    mind:      { number: '04', category: 'PERSONAL NOTES', icon: '✳', hint: 'Перейти к личным записям' },
    unknown:   { number: '05', category: 'UNSORTED FILES', icon: '？', hint: 'Исследовать неизвестное' },
    classified:{ number: '06', category: 'RESTRICTED', icon: '▣', hint: 'Открыть засекреченные материалы' },
    finallog:  { number: '07', category: 'FINAL RECORD', icon: '↗', hint: 'Перейти к финальной записи' }
  };

  SECTION_ORDER.forEach(id => {
    const status = state.sections[id];
    const meta = moduleMeta[id];
    const title = SECTION_LABELS[id];
    const desc = status === 'completed' ? 'Этот раздел уже пройден.' : SECTION_DESCS[id];
    const statusLabel = status === 'locked' ? 'LOCKED' : status === 'available' ? 'AVAILABLE' : 'COMPLETED';
    const cell = document.createElement('article');
    cell.className = 'section-cell';
    cell.innerHTML = `
      <button class="section-link ${status}" data-section="${id}" ${status === 'locked' ? 'disabled aria-disabled="true"' : ''} aria-label="${statusLabel}: ${title}">
        <span class="hub-card-top"><span class="hub-card-number">${meta.number} / ${meta.category}</span><span class="hub-card-icon" aria-hidden="true">${meta.icon}</span></span>
        <span class="hub-card-title">${title}</span>
        <span class="hub-card-desc">${desc}</span>
        <span class="hub-card-bottom"><span class="section-badge">${statusLabel}</span><span class="hub-card-hint">${status === 'locked' ? 'ДОСТУП ЗАКРЫТ' : meta.hint}</span></span>
      </button>
    `;
    grid.appendChild(cell);
  });

  grid.onclick = (e) => {
    const btn = e.target.closest('button[data-section]');
    if (!btn || btn.disabled) return;
    navigateTo(btn.dataset.section);
  };

  // Keep the HUB progress panel in sync with the global archive counter
  // whenever the directory is rendered or reopened.
  updateProgress();
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
function initApp() {
  state = loadState();

  renderHub();
  updateProgress();

  const start = state.lastView && state.sections[state.lastView] !== 'locked'
    ? state.lastView : 'access';
  showView(start);

  if (state.sections.access === 'completed') {
    const bInit = document.getElementById('btnInit');
    const puzzle = document.getElementById('accessPuzzle');
    const completed = document.getElementById('accessCompleted');
    const feedback = document.getElementById('accessFeedback');
    if (bInit) bInit.hidden = true;
    if (puzzle) puzzle.hidden = true;
    if (completed) completed.hidden = false;
    if (feedback) {
      feedback.className = 'puzzle-feedback feedback-ok';
      feedback.textContent = 'Раздел ACCESS пройден. PLAYER открыт.';
    }
  }

  const btnInit = document.getElementById('btnInit');
  if (btnInit) {
    btnInit.addEventListener('click', () => {
      const loader = document.getElementById('accessLoader');
      const hint = document.getElementById('accessHint');
      btnInit.hidden = true;
      loader.hidden = false;
      hint.hidden = false;
      setTimeout(() => {
        loader.hidden = true;
        hint.hidden = true;
        document.getElementById('accessPuzzle').hidden = false;
        showToast('Первая загадка разблокирована.');
      }, 1400);
    });
  }

  const openSettings = document.getElementById('openSettings');
  const modalOverlay = document.getElementById('modalOverlay');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnReset = document.getElementById('btnReset');

  if (openSettings) {
    openSettings.addEventListener('click', () => {
      modalOverlay.hidden = false;
      requestAnimationFrame(() => modalOverlay.classList.add('visible'));
    });
  }
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      modalOverlay.classList.remove('visible');
      setTimeout(() => { modalOverlay.hidden = true; }, 300);
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Сбросить весь прогресс архива? Это действие нельзя отменить.')) {
        resetState();
        renderHub();
        updateProgress();
        showView('access');
        const bInit = document.getElementById('btnInit');
        const loader = document.getElementById('accessLoader');
        const hint = document.getElementById('accessHint');
        const puzzle = document.getElementById('accessPuzzle');
        const completed = document.getElementById('accessCompleted');
        const feedback = document.getElementById('accessFeedback');
        if (bInit) { bInit.hidden = false; }
        if (loader) loader.hidden = true;
        if (hint) hint.hidden = true;
        if (puzzle) puzzle.hidden = true;
        if (completed) completed.hidden = true;
        if (feedback) feedback.textContent = '';
        showToast('Прогресс сброшен.');
        modalOverlay.classList.remove('visible');
        setTimeout(() => { modalOverlay.hidden = true; }, 300);
      }
    });
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('visible');
        setTimeout(() => { modalOverlay.hidden = true; }, 300);
      }
    });
  }

  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showView('hub');
    });
  });

  const openHub = document.getElementById('openHub');
  if (openHub) {
    openHub.addEventListener('click', () => {
      showView('hub');
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);

// ===========================================================================
// ACCESS — first puzzle (multi-choice, correct: information security)
// ===========================================================================
function initAccess() {
  const chips = document.querySelectorAll('#accessOptions .option-chip');
  const confirm = document.getElementById('accessConfirm');
  const feedback = document.getElementById('accessFeedback');
  let selectedValue = null;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.dataset.active === 'true') {
        chip.dataset.active = 'false';
        selectedValue = null;
      } else {
        chips.forEach(c => { c.dataset.active = 'false'; });
        chip.dataset.active = 'true';
        selectedValue = chip.dataset.value;
      }
      confirm.hidden = !selectedValue;
      feedback.textContent = '';
    });
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        chip.click();
      }
    });
  });

  confirm.addEventListener('click', () => {
    if (selectedValue === 'b') {
      completeSection('access');
      document.getElementById('accessPuzzle').hidden = true;
      document.getElementById('accessCompleted').hidden = false;
      confirm.hidden = true;
      feedback.className = 'puzzle-feedback feedback-ok';
      feedback.textContent = 'Доступ подтверждён. Раздел PLAYER открыт.';
      showView('player');
    } else {
      feedback.className = 'puzzle-feedback feedback-bad';
      feedback.textContent = 'Неверно. Подсказки указывают на информационную безопасность.';
    }
  });
}

// ===========================================================================
// PLAYER — READ THE GAME puzzle + hidden star (letter M)
// ===========================================================================
function initPlayer() {
  const puzzle = document.getElementById('playerPuzzle');
  const record = document.getElementById('playerRecord');
  const options = document.querySelectorAll('#playerOptions .option-btn');
  const confirm = document.getElementById('playerConfirm');
  const feedback = document.getElementById('playerFeedback');
  let selected = null;

  // Show puzzle on entry if section not completed
  if (state.sections.player === 'completed') {
    if (puzzle) puzzle.hidden = true;
    if (record) record.hidden = false;
  } else {
    if (puzzle) puzzle.hidden = false;
    if (record) record.hidden = true;
  }

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      options.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selected = btn.dataset.value;
      confirm.hidden = false;
      feedback.textContent = '';
    });
  });

  confirm.addEventListener('click', () => {
    if (selected === 'b') {
      completeSection('player');
      if (puzzle) puzzle.hidden = true;
      if (record) record.hidden = false;
      confirm.hidden = true;
      feedback.className = 'puzzle-feedback feedback-ok';
      feedback.textContent = 'Верно. Раздел PLAYER пройден.';
    } else {
      feedback.className = 'puzzle-feedback feedback-bad';
      feedback.textContent = 'Подумай о том, как я читаю игру.';
    }
  });

  // Hidden star → letter M
  const star = document.getElementById('playerStar');
  if (star) {
    star.addEventListener('click', () => {
      setStar('player');
      setLetter('M');
      star.style.color = '#fff';
      star.style.transform = 'scale(1.4) rotate(-10deg)';
    });
    if (state.stars.player) {
      star.style.color = '#fff';
      star.style.transform = 'scale(1.4) rotate(-10deg)';
    }
  }
}

// ===========================================================================
// CYBER — FIND THE ANOMALY puzzle + hidden star (letter I)
// ===========================================================================
function initCyber() {
  // CYBER module navigation: each card opens its own dossier inside this view.
  const cyberMain = document.getElementById('cyberMain');
  const cyberPuzzle = document.getElementById('cyberPuzzle');
  const cyberExplain = document.getElementById('cyberExplain');
  const cyberPanels = document.querySelectorAll('[data-cyber-panel]');
  const openCyberPanel = (name) => {
    const panel = document.querySelector(`[data-cyber-panel=\"${name}\"]`);
    if (!panel) return;
    if (cyberMain) cyberMain.hidden = true;
    if (cyberPuzzle) cyberPuzzle.hidden = true;
    if (cyberExplain) cyberExplain.hidden = true;
    cyberPanels.forEach(item => { item.hidden = item !== panel; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeCyberPanel = () => {
    cyberPanels.forEach(item => { item.hidden = true; });
    if (cyberMain) cyberMain.hidden = false;
    if (cyberPuzzle && state.sections.cyber !== 'completed') cyberPuzzle.hidden = false;
    if (cyberExplain && state.sections.cyber === 'completed') cyberExplain.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.querySelectorAll('[data-cyber-open]').forEach(card => {
    const activate = () => openCyberPanel(card.dataset.cyberOpen);
    card.addEventListener('click', (event) => {
      if (event.target.closest('#cyberStar')) return;
      activate();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
    });
  });
  document.querySelectorAll('.cyber-panel-back').forEach(button => button.addEventListener('click', closeCyberPanel));
  const commandInput = document.getElementById('cyberCommand');
  const commandButton = document.getElementById('cyberRunCommand');
  const commandHint = document.getElementById('cyberCommandHint');
  const runCommand = () => {
    if (!commandInput) return;
    const command = commandInput.value.trim().toLowerCase().replace(/\s+/g, ' ');
    const match = command.match(/^open (checkscam|osint|phishing|future)$/);
    if (match) { openCyberPanel(match[1]); if (commandHint) commandHint.textContent = `MODULE OPENED: ${match[1].toUpperCase()}`; commandInput.value = ''; return; }
    if (command === 'help') { if (commandHint) commandHint.textContent = 'Команды: open checkscam | open osint | open phishing | open future'; return; }
    if (command === 'back') { closeCyberPanel(); if (commandHint) commandHint.textContent = 'Возврат в CYBER TERMINAL.'; return; }
    if (commandHint) commandHint.textContent = 'Команда не распознана. Введите help.';
  };
  if (commandButton) commandButton.addEventListener('click', runCommand);
  if (commandInput) commandInput.addEventListener('keydown', event => { if (event.key === 'Enter') runCommand(); });

  const puzzle = document.getElementById('cyberPuzzle');
  const explain = document.getElementById('cyberExplain');
  const options = document.querySelectorAll('#cyberOptions .option-btn');
  const confirm = document.getElementById('cyberConfirm');
  const feedback = document.getElementById('cyberFeedback');
  let selected = null;

  if (state.sections.cyber === 'completed') {
    if (puzzle) puzzle.hidden = true;
    if (explain) explain.hidden = false;
  } else {
    if (puzzle) puzzle.hidden = false;
    if (explain) explain.hidden = true;
  }

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      options.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selected = btn.dataset.value;
      confirm.hidden = false;
      feedback.textContent = '';
    });
  });

  confirm.addEventListener('click', () => {
    if (selected === 'b') {
      completeSection('cyber');
      if (puzzle) puzzle.hidden = true;
      if (explain) explain.hidden = false;
      confirm.hidden = true;
      feedback.className = 'puzzle-feedback feedback-ok';
      feedback.textContent = 'Верно. Раздел CYBER пройден.';
    } else {
      feedback.className = 'puzzle-feedback feedback-bad';
      feedback.textContent = 'Посмотрите на настоящий домен, а не на знакомые слова.';
    }
  });

  const star = document.getElementById('cyberStar');
  if (star) {
    star.addEventListener('click', (event) => {
      event.stopPropagation();
      setStar('cyber');
      setLetter('I');
      star.style.color = '#fff';
      star.style.transform = 'scale(1.3)';
    });
    if (state.stars.cyber) {
      star.style.color = '#fff';
      star.style.transform = 'scale(1.3)';
    }
  }
}

// ===========================================================================
// MIND — FRAGMENTS puzzle (letter N) + editable RECORD 04
// ===========================================================================
function initMind() {
  const fragCountEl = document.getElementById('fragCount');
  const record = document.getElementById('mindRecord');
  const puzzle = document.getElementById('mindPuzzle');

  if (state.mindFragments.every(Boolean)) {
    if (record) record.hidden = false;
    if (puzzle) puzzle.hidden = true;
  }

  state.mindFragments.forEach((collected, i) => {
    const frag = document.getElementById(`mindFrag${i + 1}`);
    if (frag && collected) {
      frag.classList.add('collected');
      frag.style.color = '#fff';
    }
  });
  if (fragCountEl) fragCountEl.textContent = `${state.mindFragments.filter(Boolean).length}/4`;

  document.querySelectorAll('.fragment').forEach((frag, i) => {
    frag.addEventListener('click', () => {
      if (state.mindFragments[i]) return;
      state.mindFragments[i] = true;
      frag.classList.add('collected');
      frag.style.color = '#fff';
      saveState();
      if (fragCountEl) fragCountEl.textContent = `${state.mindFragments.filter(Boolean).length}/4`;

      if (state.mindFragments.every(Boolean)) {
        if (record) record.hidden = false;
        setLetter('N');
        completeSection('mind');
        if (puzzle) puzzle.hidden = true;
      }
    });
  });

  const editable = document.getElementById('mindEditable');
  const placeholderText = document.getElementById('mindText4');
  if (editable) {
    editable.textContent = state.mindValuesText || editable.getAttribute('placeholder') || '';
    editable.addEventListener('input', () => {
      state.mindValuesText = editable.textContent;
      saveState();
      if (placeholderText) placeholderText.hidden = true;
    });
  }
}

// ===========================================================================
// UNKNOWN — hidden star (letter D) + OPEN CLASSIFIED
// ===========================================================================
function initUnknown() {
  const cards = document.querySelectorAll('.unk-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.star-trigger')) return;
      card.classList.toggle('flipped');
    });
  });

  const trigger = document.getElementById('unkStarTrigger');
  const message = document.getElementById('unkStarMessage');
  const btnOpen = document.getElementById('btnOpenClassified');

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      setStar('unknown');
      setLetter('D');
      trigger.style.color = '#fff';
      trigger.style.transform = 'scale(1.4) rotate(10deg)';
      if (message) message.hidden = false;
      completeSection('unknown');
    });
    if (state.stars.unknown) {
      trigger.style.color = '#fff';
      trigger.style.transform = 'scale(1.4) rotate(10deg)';
      if (message) message.hidden = false;
    }
  }

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (state.sections.classified === 'locked') {
        showToast('Нужно собрать все четыре буквы пароля.');
        return;
      }
      navigateTo('classified');
    });
  }
}

// ===========================================================================
// CLASSIFIED — password input (MIND)
// ===========================================================================
function initClassified() {
  const inputs = document.querySelectorAll('#codeInputs .code-char');
  const feedback = document.getElementById('classifiedFeedback');

  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-ZЁА-Я]/g, '');
      if (input.value && i < inputs.length - 1) {
        inputs[i + 1].focus();
      }
      if (i === inputs.length - 1 && input.value) {
        checkPassword();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
      }
    });
  });

  const btnOneMore = document.getElementById('btnOneMoreThing');
  const psMessage = document.getElementById('psMessage');
  if (btnOneMore && psMessage) {
    btnOneMore.addEventListener('click', () => {
      psMessage.hidden = false;
      btnOneMore.hidden = true;
    });
  }

  function checkPassword() {
    let code = '';
    inputs.forEach(input => { code += input.value; });
    if (code === PASSWORD) {
      inputs.forEach(input => input.classList.add('filled'));
      feedback.className = 'puzzle-feedback feedback-ok';
      feedback.textContent = 'Пароль принят.';
      document.getElementById('accessLocked').hidden = true;
      document.getElementById('accessGranted').hidden = false;
      completeSection('classified');
    } else {
      feedback.className = 'puzzle-feedback feedback-bad';
      feedback.textContent = 'Неверный код доступа.';
      setTimeout(() => {
        inputs.forEach(input => { input.value = ''; input.classList.remove('filled'); });
        feedback.textContent = '';
        inputs[0].focus();
      }, 900);
    }
  }
}

// ===========================================================================
// FINAL LOG — envelope open + close archive
// ===========================================================================
function initFinal() {
  const envelopeFront = document.getElementById('envelopeFront');
  const envelopeLetter = document.getElementById('envelopeLetter');
  const btnClose = document.getElementById('btnCloseArchive');
  const endMessage = document.getElementById('endMessage');

  const envelope = document.getElementById('envelope');
  let letterOpened = false;

  if (envelope && envelopeFront && envelopeLetter) {
    envelope.addEventListener('click', () => {
      if (letterOpened) return;
      letterOpened = true;
      envelopeFront.classList.add('opened');
      envelopeLetter.hidden = false;
      envelopeLetter.classList.add('opened');
      showToast('Письмо открыто.');
      if (btnClose) btnClose.disabled = false;
    });
  }

  if (btnClose) {
    btnClose.disabled = true;
    btnClose.addEventListener('click', () => {
      if (!letterOpened || !envelope) return;
      envelope.style.opacity = '0';
      envelope.style.transform = 'scale(0.92)';
      setTimeout(() => {
        envelope.hidden = true;
        if (endMessage) endMessage.hidden = false;
        completeSection('finallog');
        showToast('Архив закрыт.');
      }, 500);
    });
  }
}

// Wire up all section interactions after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAccess();
  initPlayer();
  initCyber();
  initMind();
  initUnknown();
  initClassified();
  initFinal();
});

