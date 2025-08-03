/*
 * DaCapo. client‑side logic
 *
 * This script powers the navigation, persistent storage and
 * interactive features of the DaCapo. web application. All user data
 * is stored locally in the browser via localStorage to ensure the
 * application operates offline. No external libraries are used,
 * keeping the footprint minimal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ------ Tab Navigation ------
  const navButtons = document.querySelectorAll('nav button');
  const pages = document.querySelectorAll('.page');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active button
      navButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      // Show selected page
      const target = btn.dataset.target;
      pages.forEach((page) => {
        if (page.id === target) {
          page.classList.add('active');
        } else {
          page.classList.remove('active');
        }
      });
    });
  });

  // ------ Répertoire functionality ------
  const repList = document.getElementById('repertoire-list');
  let repertoire = [];
  try {
    repertoire = JSON.parse(localStorage.getItem('repertoire')) || [];
  } catch (e) {
    repertoire = [];
  }

  function renderRepertoire() {
    repList.innerHTML = '';
    repertoire.forEach((item, index) => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.innerHTML = `<strong>${escapeHtml(item.title)}</strong> – ${escapeHtml(item.composer)}`;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.dataset.index = index;
      delBtn.addEventListener('click', () => {
        repertoire.splice(index, 1);
        localStorage.setItem('repertoire', JSON.stringify(repertoire));
        renderRepertoire();
      });
      li.appendChild(text);
      li.appendChild(delBtn);
      repList.appendChild(li);
    });
  }

  document.getElementById('repertoire-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('rep-title');
    const composerInput = document.getElementById('rep-composer');
    const title = titleInput.value.trim();
    const composer = composerInput.value.trim();
    if (title && composer) {
      repertoire.push({ title, composer });
      localStorage.setItem('repertoire', JSON.stringify(repertoire));
      renderRepertoire();
      titleInput.value = '';
      composerInput.value = '';
    }
  });

  renderRepertoire();

  // ------ Agenda functionality ------
  const agendaList = document.getElementById('agenda-list');
  let agenda = [];
  try {
    agenda = JSON.parse(localStorage.getItem('agenda')) || [];
  } catch (e) {
    agenda = [];
  }

  function renderAgenda() {
    // Sort by datetime ascending
    agenda.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    agendaList.innerHTML = '';
    const now = new Date();
    agenda.forEach((item, index) => {
      const li = document.createElement('li');
      // compute remaining days for countdown
      const eventDate = new Date(item.datetime);
      const diffMs = eventDate - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let countdownText;
      if (diffDays > 1) {
        countdownText = `Dans ${diffDays} jours`;
      } else if (diffDays === 1) {
        countdownText = 'Dans 1 jour';
      } else if (diffDays === 0) {
        countdownText = 'Aujourd’hui';
      } else {
        countdownText = 'Passé';
      }
      // assign 'soon' class if event is upcoming within 7 days
      if (diffDays >= 0 && diffDays <= 7) {
        li.classList.add('soon');
      }
      const date = eventDate;
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };
      const locale = 'fr-CH';
      const formatted = date.toLocaleString(locale, options).replace(',', '');
      // container to hold title/date
      const content = document.createElement('span');
      content.innerHTML = `<strong>${escapeHtml(item.title)}</strong> – ${formatted}`;
      // note
      if (item.note) {
        const noteDiv = document.createElement('span');
        noteDiv.className = 'note';
        noteDiv.textContent = item.note;
        content.appendChild(noteDiv);
      }
      // countdown
      const countdownDiv = document.createElement('span');
      countdownDiv.className = 'countdown';
      countdownDiv.textContent = countdownText;
      content.appendChild(countdownDiv);
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.dataset.index = index;
      delBtn.addEventListener('click', () => {
        agenda.splice(index, 1);
        localStorage.setItem('agenda', JSON.stringify(agenda));
        renderAgenda();
      });
      li.appendChild(content);
      li.appendChild(delBtn);
      agendaList.appendChild(li);
    });
  }

  document.getElementById('agenda-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('agenda-title');
    const dateInput = document.getElementById('agenda-date');
    const timeInput = document.getElementById('agenda-time');
    const noteInput = document.getElementById('agenda-note');
    const title = titleInput.value.trim();
    const dateVal = dateInput.value;
    const timeVal = timeInput.value;
    const note = noteInput.value.trim();
    if (title && dateVal) {
      // Combine date and time; if time is missing, default to 00:00
      const datetime = new Date(
        `${dateVal}T${timeVal ? timeVal : '00:00'}`
      ).toISOString();
      agenda.push({ title, datetime, note });
      localStorage.setItem('agenda', JSON.stringify(agenda));
      renderAgenda();
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
      noteInput.value = '';
    }
  });

  renderAgenda();

  // ------ Materials functionality ------
  const materialsList = document.getElementById('materials-list');
  let materials = [];
  try {
    materials = JSON.parse(localStorage.getItem('materials')) || [];
  } catch (e) {
    materials = [];
  }

  function renderMaterials() {
    materialsList.innerHTML = '';
    materials.forEach((item, index) => {
      // ensure default fields exist (for backward compatibility)
      if (typeof item.quantity === 'undefined') item.quantity = 1;
      if (typeof item.purchased === 'undefined') item.purchased = false;
      const li = document.createElement('li');
      // apply purchased class
      if (item.purchased) {
        li.classList.add('purchased');
      }
      const container = document.createElement('span');
      // checkbox for purchased
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.purchased;
      checkbox.addEventListener('change', () => {
        item.purchased = checkbox.checked;
        localStorage.setItem('materials', JSON.stringify(materials));
        renderMaterials();
      });
      container.appendChild(checkbox);
      // name and quantity
      const label = document.createElement('span');
      label.textContent = `${item.name}${item.quantity && item.quantity > 1 ? ' (' + item.quantity + ')' : ''}`;
      container.appendChild(label);
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.dataset.index = index;
      delBtn.addEventListener('click', () => {
        materials.splice(index, 1);
        localStorage.setItem('materials', JSON.stringify(materials));
        renderMaterials();
      });
      li.appendChild(container);
      li.appendChild(delBtn);
      materialsList.appendChild(li);
    });
  }

  document.getElementById('materials-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('material-name');
    const qtyInput = document.getElementById('material-qty');
    const name = nameInput.value.trim();
    // quantity may be empty; default to 1
    const qtyVal = parseInt(qtyInput.value, 10);
    const qty = isNaN(qtyVal) || qtyVal < 1 ? 1 : qtyVal;
    if (name) {
      materials.push({ name, quantity: qty, purchased: false });
      localStorage.setItem('materials', JSON.stringify(materials));
      renderMaterials();
      nameInput.value = '';
      qtyInput.value = '';
    }
  });

  renderMaterials();

  // ------ Metronome & tuner functionality ------
  let audioCtx;
  let metronomeTimer = null;
  let tunerOscillator = null;
  const bpmSlider = document.getElementById('bpm');
  const bpmDisplay = document.getElementById('bpm-display');
  const metronomeToggle = document.getElementById('metronome-toggle');
  const metronomeVisual = document.getElementById('metronome-visual');
  const tunerToggle = document.getElementById('tuner-toggle');

  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
  }

  function playClick() {
    ensureAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  function startMetronome() {
    const bpm = parseInt(bpmSlider.value, 10);
    const interval = 60000 / bpm;
    playClick();
    metronomeVisual.classList.add('active');
    setTimeout(() => metronomeVisual.classList.remove('active'), 100);
    metronomeTimer = setInterval(() => {
      playClick();
      metronomeVisual.classList.add('active');
      setTimeout(() => metronomeVisual.classList.remove('active'), 100);
    }, interval);
    metronomeToggle.textContent = 'Stopper';
  }

  function stopMetronome() {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
    metronomeToggle.textContent = 'Démarrer';
    metronomeVisual.classList.remove('active');
  }

  bpmSlider.addEventListener('input', () => {
    bpmDisplay.textContent = bpmSlider.value;
    if (metronomeTimer) {
      // If running, restart with new tempo
      stopMetronome();
      startMetronome();
    }
  });

  metronomeToggle.addEventListener('click', () => {
    // Unlock audio context on user gesture if necessary
    ensureAudioContext();
    if (metronomeTimer) {
      stopMetronome();
    } else {
      startMetronome();
    }
  });

  tunerToggle.addEventListener('click', () => {
    ensureAudioContext();
    if (tunerOscillator) {
      tunerOscillator.stop();
      tunerOscillator.disconnect();
      tunerOscillator = null;
      tunerToggle.textContent = 'Accordeur A=442 Hz';
    } else {
      tunerOscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      tunerOscillator.frequency.value = 442;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      tunerOscillator.connect(gain).connect(audioCtx.destination);
      tunerOscillator.start();
      tunerToggle.textContent = 'Arrêter l’accordeur';
    }
  });

  // ------ Tap tempo functionality ------
  const tapButton = document.getElementById('tap-tempo');
  // Array to keep timestamps of taps
  let tapTimes = [];
  const TAP_RESET_MS = 2000; // reset taps if user waits >2s between taps
  if (tapButton) {
    tapButton.addEventListener('click', () => {
      const now = Date.now();
      // Reset sequence if last tap is too old
      if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > TAP_RESET_MS) {
        tapTimes = [];
      }
      tapTimes.push(now);
      if (tapTimes.length >= 2) {
        // compute intervals between taps
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
          intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpmFromTap = Math.round(60000 / avgInterval);
        // clamp BPM to slider range
        const clamped = Math.min(Math.max(bpmFromTap, parseInt(bpmSlider.min, 10)), parseInt(bpmSlider.max, 10));
        bpmSlider.value = clamped;
        bpmDisplay.textContent = clamped;
        // restart metronome if running
        if (metronomeTimer) {
          stopMetronome();
          startMetronome();
        }
      }
    });
  }

  // ------ Links (useful sites) functionality ------
  const linksContainer = document.getElementById('links-container');
  let links = [];
  try {
    links = JSON.parse(localStorage.getItem('links')) || [];
  } catch (e) {
    links = [];
  }

  function renderLinks() {
    linksContainer.innerHTML = '';
    links.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'site-item';
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.name;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.addEventListener('click', () => {
        links.splice(index, 1);
        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
      });
      div.appendChild(a);
      div.appendChild(delBtn);
      linksContainer.appendChild(div);
    });
  }

  const linksForm = document.getElementById('links-form');
  if (linksForm) {
    linksForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('link-name');
      const urlInput = document.getElementById('link-url');
      let name = nameInput.value.trim();
      let url = urlInput.value.trim();
      if (name && url) {
        // Prepend protocol if missing
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
        links.push({ name, url });
        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
        nameInput.value = '';
        urlInput.value = '';
      }
    });
    // initial render
    renderLinks();
  }

  // Utility: escape HTML to prevent code injection in saved items
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});