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
    agenda.forEach((item, index) => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      const date = new Date(item.datetime);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };
      const locale = 'fr-CH';
      const formatted = date.toLocaleString(locale, options).replace(',', '');
      text.innerHTML = `<strong>${escapeHtml(item.title)}</strong> – ${formatted}`;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.dataset.index = index;
      delBtn.addEventListener('click', () => {
        agenda.splice(index, 1);
        localStorage.setItem('agenda', JSON.stringify(agenda));
        renderAgenda();
      });
      li.appendChild(text);
      li.appendChild(delBtn);
      agendaList.appendChild(li);
    });
  }

  document.getElementById('agenda-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('agenda-title');
    const dateInput = document.getElementById('agenda-date');
    const timeInput = document.getElementById('agenda-time');
    const title = titleInput.value.trim();
    const dateVal = dateInput.value;
    const timeVal = timeInput.value;
    if (title && dateVal) {
      // Combine date and time; if time is missing, default to 00:00
      const datetime = new Date(
        `${dateVal}T${timeVal ? timeVal : '00:00'}`
      ).toISOString();
      agenda.push({ title, datetime });
      localStorage.setItem('agenda', JSON.stringify(agenda));
      renderAgenda();
      titleInput.value = '';
      dateInput.value = '';
      timeInput.value = '';
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
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = item.name;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Supprimer';
      delBtn.dataset.index = index;
      delBtn.addEventListener('click', () => {
        materials.splice(index, 1);
        localStorage.setItem('materials', JSON.stringify(materials));
        renderMaterials();
      });
      li.appendChild(text);
      li.appendChild(delBtn);
      materialsList.appendChild(li);
    });
  }

  document.getElementById('materials-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('material-name');
    const name = input.value.trim();
    if (name) {
      materials.push({ name });
      localStorage.setItem('materials', JSON.stringify(materials));
      renderMaterials();
      input.value = '';
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