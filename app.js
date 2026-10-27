// Thought Ecology take-home site.
// ?s=<specimen id> shows that visitor's three organisms (from the QR code on the final screen);
// #lab lists every specimen. Data: specimens/index.json, written by web_export in TouchDesigner.

const ORGANISMS = [
  {
    file: 'slime.jpg',
    fig: 'FIG. 01',
    latin: 'Physarum polycephalum',
    common: 'slime mould · single-celled organism',
    intro: 'A single cell with no brain that still finds its way. It spreads out to explore, then strengthens the paths that lead somewhere and lets the rest fade. Yours grew along the path your finger pointed.',
    stage: '01_Planning',
    question: 'What are you really trying to do?',
    body: 'Planning is choosing a direction before you act: what you are aiming for, which path to try first, and what you will watch for on the way.',
    field: labels => [['Pointing turns', labels[0][0]], ['Pointing reach', labels[1][0].replace('Pointing reach ', '')]],
  },
  {
    file: 'light.jpg',
    fig: 'FIG. 02',
    latin: 'Vibrio fischeri',
    common: 'bioluminescent bacterium · marine',
    intro: 'A sea bacterium that glows only when enough of its neighbours are close by. Each cell listens for the others before it lights up, a behaviour called quorum sensing. Your palm closures gathered its light.',
    stage: '02_Monitoring',
    question: 'Which signals do you trust?',
    body: 'Monitoring is checking in while you work: noticing which signals you act on, which you ignore, and whether you are still on the path you planned.',
    field: labels => [['Palm rhythm', labels[2][0]]],
  },
  {
    file: 'plant.jpg',
    fig: 'FIG. 03',
    latin: 'Arabidopsis thaliana',
    common: 'thale cress · flowering plant',
    intro: 'A small flowering plant and one of biology’s model organisms. Its leaves, roots and flowers take shape from the conditions it grows in, so no two are alike. Every gesture you made shaped this one.',
    stage: '03_Evaluating',
    question: 'What would make you reconsider?',
    body: 'Evaluating is looking back at what you made: what worked, what did not, and what you would change before you try again.',
    field: labels => [['Roots', labels[0][1]], ['Rosette', labels[1][1]], ['Flowers', labels[2][1]]],
  },
];

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let index = [];
let current = null;
let at = 2;                     // open on the plant; ‹ steps back through the light to the slime mould

function when(meta) {
  const d = new Date(meta.date + 'T' + meta.time);
  return {
    day: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    full: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: meta.time,
  };
}
const src = (meta, i) => 'specimens/' + encodeURIComponent(meta.id) + '/' + ORGANISMS[i].file;

function showOrganism(i) {
  at = Math.max(0, Math.min(2, i));
  const o = ORGANISMS[at];
  const img = $('organism-img');
  img.classList.add('loading');
  img.onload = () => img.classList.remove('loading');
  img.src = src(current, at);
  img.alt = o.latin + ', grown by this visitor';
  $('fig').textContent = o.fig;
  $('latin').textContent = o.latin;
  $('common').textContent = o.common;
  $('intro').textContent = o.intro;
  $('stage-title').textContent = o.stage;
  $('question').textContent = o.question;
  $('meta-body').textContent = o.body;
  const field = $('field');
  field.replaceChildren();
  if (current.labels) {
    for (const [k, v] of o.field(current.labels)) {
      const row = document.createElement('div');
      row.innerHTML = '<dt></dt><dd></dd>';
      row.children[0].textContent = k;
      row.children[1].textContent = v;
      field.append(row);
    }
  }
  field.hidden = !field.children.length;
  $('prev').disabled = at === 0;
  $('next').disabled = at === 2;
  for (const dot of $('dots').children) dot.setAttribute('aria-selected', String(+dot.dataset.i === at));
}

function renderSpecimen() {
  const id = params.get('s');
  current = index.find(m => m.id === id) || index[0];
  if (!current) {
    $('specimen').innerHTML = '<p class="empty">No specimens yet.</p>';
    return;
  }
  const w = when(current);
  $('record').innerHTML = '<span></span><span></span>';
  $('record').children[0].textContent = 'Specimen ' + current.id.slice(0, 13);
  $('record').children[1].textContent = w.full + ' · ' + w.time;
  const dots = $('dots');
  dots.replaceChildren();
  ORGANISMS.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'dot';
    b.dataset.i = i;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', o.latin);
    b.textContent = '0' + (i + 1);
    b.onclick = () => showOrganism(i);
    dots.append(b);
  });
  showOrganism(at);
  // warm the cache so stepping back is instant
  ORGANISMS.forEach((_, i) => { new Image().src = src(current, i); });
}

function renderLab() {
  const list = $('lab-list');
  list.replaceChildren();
  if (!index.length) {
    list.innerHTML = '<li class="empty">No specimens yet.</li>';
    return;
  }
  for (const meta of index) {
    const w = when(meta);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'lab-row' + (current && meta.id === current.id && params.get('s') ? ' mine' : '');
    a.href = '?s=' + encodeURIComponent(meta.id);
    a.innerHTML = '<span class="when"><strong></strong></span>';
    a.querySelector('strong').textContent = w.day;
    a.querySelector('.when').append(w.time);
    ORGANISMS.forEach((o, i) => {
      const d = document.createElement('span');
      d.className = 'dish';
      d.role = 'img';
      d.setAttribute('aria-label', o.latin + ', ' + w.day + ' ' + w.time);
      d.style.backgroundImage = 'url("' + src(meta, i) + '")';
      a.append(d);
    });
    li.append(a);
    list.append(li);
  }
}

function route() {
  const lab = location.hash === '#lab';
  $('specimen').hidden = lab;
  $('lab').hidden = !lab;
  document.querySelectorAll('.tab').forEach(t => {
    if ((t.dataset.nav === 'lab') === lab) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  if (lab) renderLab();
  window.scrollTo(0, 0);
}

// "Yours" keeps the visitor's own specimen id
document.querySelectorAll('[data-nav="specimen"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    route();
  });
});
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);

$('prev').onclick = () => showOrganism(at - 1);
$('next').onclick = () => showOrganism(at + 1);
document.addEventListener('keydown', e => {
  if (!$('specimen').hidden && e.key === 'ArrowLeft') showOrganism(at - 1);
  if (!$('specimen').hidden && e.key === 'ArrowRight') showOrganism(at + 1);
});
// swipe on the plate
let x0 = null;
$('plate').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
$('plate').addEventListener('touchend', e => {
  if (x0 === null) return;
  const dx = e.changedTouches[0].clientX - x0;
  if (Math.abs(dx) > 40) showOrganism(at + (dx > 0 ? -1 : 1));
  x0 = null;
});

// A visitor scans the QR while their specimen is still uploading (a minute or so on GitHub
// Pages), so a missing id shows a "developing" note and checks again until it arrives.
const fresh = url => fetch(url + '?t=' + Date.now(), { cache: 'no-store' })
  .then(r => r.ok ? r.json() : null).catch(() => null);

async function load() {
  const data = await fresh('specimens/index.json');
  index = Array.isArray(data) ? data : [];
  const id = params.get('s');
  if (id && !index.some(m => m.id === id)) {
    const meta = await fresh('specimens/' + encodeURIComponent(id) + '/meta.json');
    if (meta) index.unshift(meta);
  }
  return !id || index.some(m => m.id === id);
}

async function start(tries = 0) {
  const ready = await load();
  const waiting = !ready && tries < 40;
  document.body.classList.toggle('developing', waiting);
  if (waiting) {
    setTimeout(() => start(tries + 1), 8000);
    return;
  }
  renderSpecimen();
  route();
}
start();
