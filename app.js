const ROOM_DATA = {
  C2: { label: '소형 C2', capacity: '권장 2~4명' },
  B1: { label: '대형 B1', capacity: '권장 4~8명' },
  C1: { label: '소형 C1', capacity: '권장 2~4명' },
  A1: { label: '중형 A1', capacity: '권장 2~6명' },
};

const PRICE = { adult: 7000, youth: 5000 };

function won(value) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function bindExclusive(selector, activeClass = 'active', onChange) {
  const nodes = [...document.querySelectorAll(selector)];
  nodes.forEach((node) => {
    node.addEventListener('click', () => {
      if (node.disabled) return;
      nodes.forEach((item) => item.classList.remove(activeClass));
      node.classList.add(activeClass);
      if (onChange) onChange(node);
    });
  });
}

function bindCounters(state, onUpdate) {
  document.querySelectorAll('[data-counter]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.counter;
      const delta = Number(button.dataset.delta || 0);
      state[key] = Math.max(0, Math.min(20, state[key] + delta));
      document.querySelectorAll(`[data-count-value="${key}"]`).forEach((el) => {
        el.textContent = state[key];
      });
      onUpdate();
    });
  });
}

function peopleTotal(state) {
  return state.adult + state.youth;
}

function priceTotal(state) {
  return state.adult * PRICE.adult + state.youth * PRICE.youth;
}

function updateCommonSummary(state) {
  const total = peopleTotal(state);
  const price = priceTotal(state);
  document.querySelectorAll('[data-summary="people"]').forEach((el) => el.textContent = `총 ${total}명`);
  document.querySelectorAll('[data-summary="breakdown"]').forEach((el) => el.textContent = `성인 ${state.adult}명 + 청소년·어린이 ${state.youth}명`);
  document.querySelectorAll('[data-summary="price"]').forEach((el) => el.textContent = won(price));
}

function validateBasic(state) {
  if (peopleTotal(state) < 1) {
    showToast('이용 인원을 1명 이상 선택해주세요.');
    return false;
  }
  return true;
}

function showComplete(summaryText) {
  const form = document.querySelector('[data-reservation-form]');
  const complete = document.querySelector('[data-complete]');
  if (form) form.classList.add('hide');
  if (complete) {
    complete.classList.remove('hide');
    const target = complete.querySelector('[data-complete-summary]');
    if (target) target.textContent = summaryText;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initKimcaddie() {
  const state = { adult: 2, youth: 3, date: '오늘', time: '13:20', room: 'A1', difficulty: '베이직' };
  const update = () => {
    updateCommonSummary(state);
    const room = ROOM_DATA[state.room];
    document.querySelectorAll('[data-summary="room"]').forEach((el) => el.textContent = `${room.label} · ${state.difficulty}`);
    document.querySelectorAll('[data-summary="datetime"]').forEach((el) => el.textContent = `${state.date} ${state.time}`);
  };

  bindCounters(state, update);
  bindExclusive('[data-kim-date]', 'active', (node) => { state.date = node.dataset.value; update(); });
  bindExclusive('[data-kim-time]', 'active', (node) => { state.time = node.dataset.value; update(); });
  bindExclusive('[data-kim-room]', 'active', (node) => { state.room = node.dataset.value; update(); });
  bindExclusive('[data-kim-difficulty]', 'active', (node) => { state.difficulty = node.dataset.value; update(); });

  document.querySelector('[data-kim-reserve]')?.addEventListener('click', () => {
    if (!validateBasic(state)) return;
    if (!document.querySelector('#kim-safety')?.checked) {
      showToast('안전 주의사항에 동의해주세요.');
      return;
    }
    showComplete(`${state.date} ${state.time} · ${ROOM_DATA[state.room].label} · 총 ${peopleTotal(state)}명`);
  });
  update();
}

function initCatchtable() {
  const state = { adult: 2, youth: 3, mode: 'now', date: '오늘', time: '13:20', room: 'A1', difficulty: '베이직' };
  let step = 0;
  const panels = [...document.querySelectorAll('[data-catch-step]')];
  const next = document.querySelector('[data-catch-next]');
  const back = document.querySelector('[data-catch-back]');

  function render() {
    panels.forEach((panel, index) => panel.classList.toggle('active', index === step));
    document.querySelectorAll('.progress-dot').forEach((dot, index) => dot.classList.toggle('on', index <= step));
    if (back) back.classList.toggle('hide', step === 0);
    if (next) next.textContent = step === panels.length - 1 ? `${won(priceTotal(state))} · 예약하기` : '다음';
    updateCommonSummary(state);
    document.querySelectorAll('[data-summary="room"]').forEach((el) => el.textContent = `${ROOM_DATA[state.room].label} · ${state.difficulty}`);
    document.querySelectorAll('[data-summary="datetime"]').forEach((el) => el.textContent = state.mode === 'now' ? '지금 바로 이용' : `${state.date} ${state.time}`);
  }

  bindCounters(state, render);
  bindExclusive('[data-catch-mode]', 'active', (node) => {
    state.mode = node.dataset.value;
    document.querySelector('[data-schedule-options]')?.classList.toggle('hide', state.mode === 'now');
    render();
  });
  bindExclusive('[data-catch-time]', 'active', (node) => { state.time = node.dataset.value; render(); });
  bindExclusive('[data-catch-room]', 'active', (node) => { state.room = node.dataset.value; render(); });
  bindExclusive('[data-catch-difficulty]', 'active', (node) => { state.difficulty = node.dataset.value; render(); });

  next?.addEventListener('click', () => {
    if (step === 1 && !validateBasic(state)) return;
    if (step < panels.length - 1) {
      step += 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!document.querySelector('#catch-safety')?.checked) {
      showToast('안전 주의사항에 동의해주세요.');
      return;
    }
    const when = state.mode === 'now' ? '지금 바로' : `${state.date} ${state.time}`;
    showComplete(`${when} · ${ROOM_DATA[state.room].label} · 총 ${peopleTotal(state)}명`);
  });
  back?.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  render();
}

function initToss() {
  const state = { adult: 2, youth: 3, date: '오늘', time: '13:20', room: 'A1', difficulty: '베이직' };
  let step = 0;
  const panels = [...document.querySelectorAll('[data-toss-step]')];
  const next = document.querySelector('[data-toss-next]');
  const back = document.querySelector('[data-toss-back]');

  function render() {
    panels.forEach((panel, index) => panel.classList.toggle('active', index === step));
    document.querySelectorAll('.progress-dot').forEach((dot, index) => dot.classList.toggle('on', index <= step));
    back?.classList.toggle('hide', step === 0);
    if (next) {
      next.textContent = step === panels.length - 1 ? '이 내용으로 예약하기' : '다음';
    }
    updateCommonSummary(state);
    document.querySelectorAll('[data-summary="room"]').forEach((el) => el.textContent = `${ROOM_DATA[state.room].label} · ${state.difficulty}`);
    document.querySelectorAll('[data-summary="datetime"]').forEach((el) => el.textContent = `${state.date} ${state.time}`);
  }

  bindCounters(state, render);
  bindExclusive('[data-toss-date]', 'active', (node) => { state.date = node.dataset.value; render(); });
  bindExclusive('[data-toss-time]', 'active', (node) => { state.time = node.dataset.value; render(); });
  bindExclusive('[data-toss-room]', 'active', (node) => { state.room = node.dataset.value; render(); });
  bindExclusive('[data-toss-difficulty]', 'active', (node) => { state.difficulty = node.dataset.value; render(); });

  next?.addEventListener('click', () => {
    if (step === 1 && !validateBasic(state)) return;
    if (step < panels.length - 1) {
      step += 1;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!document.querySelector('#toss-safety')?.checked) {
      showToast('안전 주의사항에 동의해주세요.');
      return;
    }
    showComplete(`${state.date} ${state.time} · ${ROOM_DATA[state.room].label} · 총 ${peopleTotal(state)}명`);
  });
  back?.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  render();
}

function initHome() {
  document.querySelectorAll('[data-demo-alert]').forEach((node) => {
    node.addEventListener('click', () => showToast('각 카드를 눌러 실제 목업을 체험해보세요.'));
  });
}

const page = document.body.dataset.page;
if (page === 'kimcaddie') initKimcaddie();
if (page === 'catchtable') initCatchtable();
if (page === 'toss') initToss();
if (page === 'home') initHome();
