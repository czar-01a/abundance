/* Dataset builder demo: live estimates, sample episode, delivery preview */
(function () {
  var form = document.getElementById('builder-form');
  if (!form) return;

  var TASKS = {
    pick: { name: 'pick_place', label: 'Pick and place', sec: 20, say: 'Put the red block in the bowl.',
      steps: [['Reach', 3], ['Grasp block', 3], ['Lift', 2], ['Move', 4], ['Place in bowl', 3], ['Release', 2]] },
    household: { name: 'household_manip', label: 'Household manipulation', sec: 45, say: 'Fold the towel and place it in the basket.',
      steps: [['Reach', 3], ['Grasp towel', 4], ['Fold in half', 9], ['Fold again', 8], ['Lift', 3], ['Place in basket', 5]] },
    warehouse: { name: 'warehouse_pick', label: 'Warehouse picking', sec: 30, say: 'Pick the blue box and put it on the conveyor.',
      steps: [['Scan shelf', 4], ['Reach', 3], ['Grasp box', 4], ['Lift', 3], ['Turn', 3], ['Place on conveyor', 4]] },
    assembly: { name: 'assembly', label: 'Assembly', sec: 60, say: 'Insert the bracket and fasten both screws.',
      steps: [['Pick bracket', 4], ['Align', 5], ['Insert', 4], ['Pick screwdriver', 3], ['Fasten screw 1', 7], ['Fasten screw 2', 7]] },
    folding: { name: 'cloth_folding', label: 'Cloth folding', sec: 60, say: 'Fold the T-shirt and stack it.',
      steps: [['Flatten', 8], ['Grasp sleeve', 4], ['Fold sleeves', 10], ['Fold in half', 8], ['Stack', 5]] },
    food: { name: 'food_prep', label: 'Food prep', sec: 90, say: 'Slice the cucumber and plate it.',
      steps: [['Wash', 6], ['Pick knife', 3], ['Slice', 14], ['Transfer', 5], ['Plate', 6]] },
    sports: { name: 'sports_motion', label: 'Sports motion', sec: 20, say: 'Shoot a free throw.',
      steps: [['Set stance', 3], ['Dribble', 4], ['Gather', 2], ['Jump', 2], ['Release', 2], ['Land', 2]] },
    other: { name: 'custom_task', label: 'Custom task', sec: 60, say: 'Your task, described in plain language.',
      steps: [['Set up', 4], ['Reach', 3], ['Grasp', 4], ['Manipulate', 12], ['Place', 4], ['Reset', 3]] }
  };
  var MODS = {
    video: { label: 'Egocentric video', gb: 7, kind: 'frames', lerobot: 'observation.images.ego' },
    wrist: { label: 'Wrist camera', gb: 5, kind: 'frames', lerobot: 'observation.images.wrist' },
    joints: { label: 'Joint states', gb: 0.05, kind: 'wave', seed: 4 },
    teleop: { label: 'Teleop actions', gb: 0.05, kind: 'wave', seed: 3 },
    depth: { label: 'Depth', gb: 5, kind: 'frames', lerobot: 'observation.images.depth' },
    hands: { label: 'Hand pose', gb: 0.1, kind: 'wave', seed: 2 },
    force: { label: 'Force/torque', gb: 0.05, kind: 'wave', seed: 9 },
    imu: { label: 'IMU', gb: 0.02, kind: 'wave', seed: 5 },
    lidar: { label: 'LiDAR', gb: 10, kind: 'frames' },
    tactile: { label: 'Tactile', gb: 1, kind: 'wave', seed: 7 },
    audio: { label: 'Audio', gb: 0.2, kind: 'wave', seed: 11 },
    other: { label: 'Other sensor', gb: 1, kind: 'wave', seed: 13 }
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function vals(name) { return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) { return el.value; }); }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function size(gb) { return gb >= 1000 ? (gb / 1000).toFixed(gb >= 10000 ? 0 : 1) + ' TB' : Math.max(1, Math.round(gb)) + ' GB'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function otherText(name) { var v = $(name + '-other').value.trim(); return v; }
  function syncOthers() {
    ['task', 'body', 'mod', 'note'].forEach(function (name) {
      var on = !!form.querySelector('input[name="' + name + '"][value="other"]:checked'), box = $(name + '-other');
      if (box.hidden === on) { box.hidden = !on; if (on && document.activeElement && document.activeElement.value === 'other') box.focus(); }
    });
  }
  function chipLabel(name, v) {
    if (!v) return 'Not selected';
    if (v === 'other') return otherText(name) || 'Other';
    return form.querySelector('input[name="' + name + '"][value="' + v + '"]').parentNode.textContent.trim();
  }
  var GENERIC = { name: 'your_dataset', label: 'Your dataset', sec: 60, say: 'Your task, described in plain language.',
    steps: [['Set up', 4], ['Reach', 3], ['Grasp', 4], ['Manipulate', 12], ['Place', 4], ['Reset', 3]] };
  function taskInfo(s) {
    if (!s.task) return GENERIC;
    var t = TASKS[s.task];
    if (s.task !== 'other') return t;
    var txt = otherText('task');
    return { name: t.name, label: txt || t.label, sec: t.sec, steps: t.steps, say: txt ? txt.replace(/\.?$/, '.') : t.say };
  }

  function readState() {
    return {
      task: val('task'), body: val('body'), mods: vals('mod'), notes: vals('note'), format: val('format'),
      hours: +$('hours').value, envs: +$('envs').value
    };
  }

  function estimates(s) {
    var t = taskInfo(s);
    var episodes = Math.round(s.hours * 3600 / t.sec);
    var people = Math.max(Math.ceil(s.envs * 1.2), Math.ceil(s.hours / 40));
    var hardware = !!s.body && s.body !== 'human';
    var firstDays = 7 + (hardware ? 7 : 0) + (s.mods.indexOf('tactile') > -1 ? 4 : 0);
    var weeks = 2 + Math.ceil(s.hours / (people * 10)) + Math.ceil(s.hours / 500) + (hardware ? 1 : 0);
    var gb = s.mods.reduce(function (sum, m) { return sum + MODS[m].gb; }, 0) * s.hours;
    return { episodes: episodes, people: people, firstDays: firstDays, weeks: weeks, gb: gb };
  }

  /* ---------- sample episode ---------- */
  var playing = !reduce, t0 = null, pos = 0, raf = null, segEls = [], cur = -1;
  var LOOP_MS = 9000;

  function wave(seed, w, h) {
    var pts = [], n = 90;
    for (var i = 0; i <= n; i++) {
      var x = i / n;
      var y = Math.sin(x * (6 + seed) + seed) * 0.45 + Math.sin(x * (17 + seed * 2)) * 0.2 + Math.sin(x * 41 + seed * 3) * 0.08;
      pts.push((x * w).toFixed(1) + ',' + (h / 2 - y * h * 0.42).toFixed(1));
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="#0A74E0" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
  }
  function frames(w, h) {
    var out = '', n = 28, gap = 2, fw = (w - gap * (n - 1)) / n;
    for (var i = 0; i < n; i++) out += '<rect x="' + (i * (fw + gap)).toFixed(1) + '" y="3" width="' + fw.toFixed(1) + '" height="' + (h - 6) + '" rx="2" fill="' + (i % 2 ? '#CFE6FB' : '#B9DBFA') + '"/>';
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' + out + '</svg>';
  }

  function buildEpisode(s) {
    var t = taskInfo(s), lanes = $('lanes');
    lanes.textContent = '';
    var total = t.steps.reduce(function (a, st) { return a + st[1]; }, 0);
    var actLane = el('div', 'lane');
    actLane.appendChild(el('div', 'lane-name', s.notes.indexOf('actions') > -1 ? 'Action labels' : 'Task steps'));
    var track = el('div', 'lane-track'), row = el('div', 'seg-row');
    segEls = t.steps.map(function (st, i) {
      var d = el('div', null, st[0]);
      d.style.width = (st[1] / total * 100) + '%';
      d.style.background = i % 2 ? '#D6EBFD' : '#EAF5FF';
      row.appendChild(d);
      return d;
    });
    track.appendChild(row); actLane.appendChild(track); lanes.appendChild(actLane);
    s.mods.forEach(function (m) {
      var lane = el('div', 'lane');
      lane.appendChild(el('div', 'lane-name', m === 'other' ? (otherText('mod') || MODS[m].label) : MODS[m].label));
      var tr = el('div', 'lane-track');
      tr.innerHTML = MODS[m].kind === 'frames' ? frames(400, 26) : wave(MODS[m].seed, 400, 26);
      lane.appendChild(tr); lanes.appendChild(lane);
    });
    var head = el('div', 'playhead'); head.id = 'playhead'; lanes.appendChild(head);
    $('say').hidden = s.notes.indexOf('language') < 0;
    $('say').textContent = '\u201C' + t.say + '\u201D';
    cur = -1;
    paint();
  }

  function paint() {
    var s = readState(), t = taskInfo(s);
    var total = t.steps.reduce(function (a, st) { return a + st[1]; }, 0);
    var head = $('playhead'), lanes = $('lanes');
    if (!head) return;
    var nameW = lanes.querySelector('.lane-track').offsetLeft;
    var trackW = lanes.clientWidth - nameW;
    head.style.left = (nameW + pos * trackW - 1) + 'px';
    var sec = pos * total, acc = 0, idx = t.steps.length - 1;
    for (var i = 0; i < t.steps.length; i++) { acc += t.steps[i][1]; if (sec < acc) { idx = i; break; } }
    if (idx !== cur) {
      segEls.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
      $('now-step').textContent = t.steps[idx][0];
      cur = idx;
    }
    $('now-time').textContent = sec.toFixed(1) + 's / ' + total + '.0s';
  }

  function tick(ts) {
    if (t0 === null) t0 = ts - pos * LOOP_MS;
    pos = ((ts - t0) % LOOP_MS) / LOOP_MS;
    paint();
    raf = requestAnimationFrame(tick);
  }
  function setPlaying(on) {
    playing = on;
    $('play').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('play-label').textContent = on ? 'Pause' : 'Play';
    $('play-icon').innerHTML = on ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' : '<path d="M7 5l12 7-12 7z"/>';
    cancelAnimationFrame(raf); t0 = null;
    if (on) raf = requestAnimationFrame(tick);
  }
  $('play').addEventListener('click', function () { setPlaying(!playing); });
  $('lanes').addEventListener('click', function (e) {
    var track = $('lanes').querySelector('.lane-track'), r = track.getBoundingClientRect();
    pos = Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)); t0 = null; paint();
  });

  /* ---------- delivery preview ---------- */
  function tree(s, e) {
    var t = taskInfo(s), n = t.name + '_v1/', L = [];
    var has = function (m) { return s.mods.indexOf(m) > -1; }, note = function (a) { return s.notes.indexOf(a) > -1; };
    if (s.format === 'lerobot') {
      L.push('<b>' + n + '</b>', '  meta/', '    info.json', '    episodes.jsonl');
      if (note('language')) L.push('    tasks.jsonl');
      L.push('  data/chunk-000/', '    episode_000000.parquet', '    \u2026');
      ['video', 'wrist', 'depth'].forEach(function (m) { if (has(m)) L.push('  videos/chunk-000/' + MODS[m].lerobot + '/', '    episode_000000.mp4'); });
    } else if (s.format === 'rlds') {
      L.push('<b>' + n + '</b>', '  1.0.0/', '    dataset_info.json', '    features.json');
      var shards = Math.max(1, Math.ceil(e.gb / 4));
      L.push('    ' + t.name + '-train.tfrecord-00000-of-' + String(shards).padStart(5, '0'), '    \u2026');
    } else {
      L.push('<b>' + n + '</b>', '  episodes/', '    ep_0001.mcap', '    ep_0002.mcap', '    \u2026');
      if (s.notes.length) L.push('  annotations/');
      if (note('actions')) L.push('    actions.parquet');
      if (note('language')) L.push('    instructions.jsonl');
      if (note('boxes')) L.push('    objects.parquet');
      if (note('success')) L.push('    outcomes.parquet');
      if (note('masks')) L.push('    masks/');
      if (note('keypoints')) L.push('    keypoints.parquet');
      L.push('  metadata.json');
    }
    return L.join('\n');
  }
  function code(s) {
    var n = taskInfo(s).name + '_v1';
    if (s.format === 'lerobot') return '<span class="c"># pip install lerobot</span>\nfrom lerobot.datasets.lerobot_dataset import LeRobotDataset\n\nds = LeRobotDataset(<span class="s">"abundance/' + n + '"</span>)\nframe = ds[0]\nframe.keys()';
    if (s.format === 'rlds') return '<span class="c"># pip install tensorflow-datasets</span>\nimport tensorflow_datasets as tfds\n\nds = tfds.builder_from_directory(\n    <span class="s">"' + n + '/1.0.0"</span>\n).as_dataset(split=<span class="s">"train"</span>)\nfor ep in ds.take(1):\n    steps = ep[<span class="s">"steps"</span>]';
    return '<span class="c"># pip install mcap</span>\nfrom mcap.reader import make_reader\n\nf = open(<span class="s">"episodes/ep_0001.mcap"</span>, <span class="s">"rb"</span>)\nfor _, ch, msg in make_reader(f).iter_messages():\n    print(ch.topic, msg.log_time)';
  }

  /* ---------- task description + demo media ---------- */
  var files = [], MAX_FILES = 5;
  function kb(n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB'; }
  function thumb(f, cls) {
    var m = f.file.type.indexOf('video') === 0 ? el('video') : el('img');
    var isVid = m.tagName === 'VIDEO';
    m.src = isVid && !cls ? f.url + '#t=0.1' : f.url;
    if (isVid) { m.preload = 'metadata'; m.muted = true; m.playsInline = true; m.loop = true; m.setAttribute('aria-label', f.file.name); if (cls) m.autoplay = !reduce; }
    else m.alt = f.file.name;
    return m;
  }
  function renderMedia() {
    var list = $('media-list'); list.textContent = '';
    files.forEach(function (f, i) {
      var row = el('div', 'mitem'), info = el('div');
      row.appendChild(thumb(f));
      info.appendChild(el('div', 'mname', f.file.name));
      info.appendChild(el('div', 'msize', kb(f.file.size)));
      row.appendChild(info);
      var x = el('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + f.file.name);
      x.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>';
      x.addEventListener('click', function () { URL.revokeObjectURL(f.url); files.splice(i, 1); renderMedia(); render(); });
      row.appendChild(x); list.appendChild(row);
    });
    $('media-note').hidden = !files.length;
    $('drop').hidden = files.length >= MAX_FILES;
    var ref = $('ref'), box = $('ref-media');
    box.textContent = '';
    ref.hidden = !files.length;
    if (files.length) {
      var v = thumb(files[0], true); box.appendChild(v);
      if (v.tagName === 'VIDEO' && !reduce) v.play().catch(function () {});
      $('ref-name').textContent = files[0].file.name + (files.length > 1 ? ' + ' + (files.length - 1) + ' more' : '');
    }
  }
  function addFiles(list) {
    Array.prototype.forEach.call(list, function (file) {
      if (files.length >= MAX_FILES) return;
      if (!/^(video|image)\//.test(file.type)) return;
      files.push({ file: file, url: URL.createObjectURL(file) });
    });
    renderMedia(); render();
  }
  $('media').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  /* ---------- render ---------- */
  var lastTask = null, lastMods = '', lastNotes = '';
  function render() {
    syncOthers();
    var s = readState(), e = estimates(s), ti = taskInfo(s);
    ['hours', 'envs'].forEach(function (id) {
      var r = $(id); r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    });
    $('hours-out').textContent = fmt(s.hours) + ' hrs';
    $('envs-out').textContent = fmt(s.envs) + ' locations';
    $('st-episodes').textContent = fmt(e.episodes);
    $('st-people').textContent = fmt(e.people);
    $('st-first').textContent = e.firstDays + ' days';
    $('st-weeks').textContent = e.weeks + ' weeks';
    $('size').textContent = s.mods.length ? size(e.gb) + ' raw' : 'Pick a modality';
    $('ep-title').textContent = ti.label + ' \u00B7 episode 0001';
    $('tree').innerHTML = tree(s, e);
    $('code').innerHTML = code(s);
    var key = s.task + '|' + ti.say + '|' + otherText('mod');
    if (key !== lastTask || s.mods.join() !== lastMods || s.notes.join() !== lastNotes) {
      lastTask = key; lastMods = s.mods.join(); lastNotes = s.notes.join();
      buildEpisode(s);
    }
    var lines = [
      'Hi Abundance team,', '', 'I would like a dataset with this spec:',
      '- Task: ' + chipLabel('task', s.task),
      '- Embodiment: ' + chipLabel('body', s.body),
      '- Modalities: ' + (s.mods.map(function (m) { return chipLabel('mod', m); }).join(', ') || 'None'),
      '- Annotations: ' + (s.notes.map(function (v) { return chipLabel('note', v); }).join(', ') || 'None'),
      '- Task description: ' + ($('task-desc').value.trim() || 'Not provided'),
      '- Reference media: ' + (files.length ? files.map(function (f) { return f.file.name; }).join(', ') + ' (attached to this email)' : 'None'),
      '- Volume: ' + fmt(s.hours) + ' hours across ' + s.envs + ' locations',
      '- Format: ' + form.querySelector('input[name="format"]:checked').parentNode.textContent.trim()
    ];
    $('send-spec').href = 'mailto:hello@abundancephysical.com?subject=' + encodeURIComponent('Dataset request: ' + ti.label) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  // Task and Embodiment: pick one at a time, click again to unselect
  form.addEventListener('change', function (e) {
    var t = e.target;
    if ((t.name === 'task' || t.name === 'body') && t.checked) {
      form.querySelectorAll('input[name="' + t.name + '"]').forEach(function (o) { if (o !== t) o.checked = false; });
    }
  }, true);
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  window.addEventListener('resize', paint);
  render();
  setPlaying(playing);
})();
