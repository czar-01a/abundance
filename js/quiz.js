/* Help me choose: four questions, then the jobs that fit best */
(function () {
  var CAT_OF = { 'Factory': 'industrial', '3D Printer': 'industrial', 'Energy': 'infrastructure', 'Build': 'infrastructure', 'Intelligence': 'infrastructure',
    'Home': 'consumer', 'Food': 'consumer', 'Sports': 'consumer', 'Research': 'frontier', 'Medicine': 'frontier', 'Beyond': 'frontier' };
  var JOBS = (window.ABUNDANCE_JOBS || []).map(function (r) { return { title: r[0], product: r[1], mode: r[2], kind: r[3], lo: r[4], hi: r[5] }; });

  var Q = [
    { key: 'cat', q: 'What kind of work interests you most?', opts: [
      ['industrial', 'Factories and manufacturing', 'Assembly, warehouses, 3D printing'],
      ['infrastructure', 'Energy and construction', 'Solar, electrical, building trades'],
      ['consumer', 'Home, food, and sports', 'Chores, cooking, athletic movement'],
      ['frontier', 'Research, medicine, and beyond', 'Labs, healthcare, space and extreme settings'],
      ['any', 'I’m open to anything', '']] },
    { key: 'role', q: 'What would you most like to do?', opts: [
      ['record', 'Record myself doing tasks', 'Film everyday or skilled work'],
      ['teleop', 'Control robots remotely', 'Drive robots from a computer or headset'],
      ['annotate', 'Label and review data', 'Tag videos and images from home'],
      ['expert', 'Share expert know-how', 'Design tasks or advise as a specialist'],
      ['any', 'Not sure yet', '']] },
    { key: 'mode', q: 'Where do you want to work?', opts: [
      ['Remote', 'Remote', 'From home'],
      ['On-site', 'On-site', 'At a location we set up'],
      ['any', 'Either works', '']] },
    { key: 'kind', q: 'How much time can you give?', opts: [
      ['Full-time', 'Full-time', ''],
      ['Part-time', 'Part-time', ''],
      ['Contract', 'Contract', 'A set project with an end date'],
      ['Flexible', 'Flexible', 'Pick up work when you want'],
      ['any', 'Any of these', '']] }
  ];
  var ROLE_WORDS = {
    record: /recorder|demonstrator|motion capture|performer|athlete|cook|chef|barista|record/i,
    teleop: /teleoperator|pilot|operator/i,
    annotate: /annotator|reviewer|annotation/i,
    expert: /expert|engineer|researcher|specialist|technician|machinist|designer|coach|nurse|therapist|— md|phd/i
  };

  var $ = function (id) { return document.getElementById(id); };
  var form = $('quiz'), opts = $('quiz-opts'), next = $('quiz-next'), prev = $('quiz-prev');
  var results = $('quiz-results'), step = 0, answers = {};

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function show() {
    var q = Q[step];
    $('quiz-step').textContent = 'Question ' + (step + 1) + ' of ' + Q.length;
    $('quiz-bar').style.width = ((step + 1) / Q.length * 100) + '%';
    $('quiz-q').textContent = q.q;
    opts.textContent = '';
    q.opts.forEach(function (o) {
      var lab = el('label', 'qopt'), input = el('input');
      input.type = 'radio'; input.name = 'q' + step; input.value = o[0];
      if (answers[q.key] === o[0]) input.checked = true;
      var txt = el('span', 'qtext');
      txt.appendChild(el('span', 'qlabel', o[1]));
      if (o[2]) txt.appendChild(el('span', 'qhint', o[2]));
      lab.appendChild(input); lab.appendChild(txt); opts.appendChild(lab);
    });
    // Restart the fade for each new question
    opts.style.animation = 'none'; void opts.offsetWidth; opts.style.animation = '';
    next.disabled = !answers[q.key];
    next.textContent = step === Q.length - 1 ? 'See my matches' : 'Next';
    prev.hidden = step === 0;
  }

  opts.addEventListener('change', function (e) { answers[Q[step].key] = e.target.value; next.disabled = false; });
  prev.addEventListener('click', function () { if (step > 0) { step--; show(); } });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!answers[Q[step].key]) return;
    if (step < Q.length - 1) { step++; show(); opts.querySelector('input').focus(); return; }
    finish();
  });

  function score(j, a, loose) {
    if (a.cat !== 'any' && CAT_OF[j.product] !== a.cat) return -1;
    var s = 0;
    if (a.mode !== 'any') { if (j.mode === a.mode) s += 3; else if (!loose.mode) return -1; }
    if (a.kind !== 'any') { if (j.kind === a.kind) s += 2; else if (!loose.kind) return -1; }
    if (a.role !== 'any' && ROLE_WORDS[a.role].test(j.title)) s += 4;
    return s;
  }

  function finish() {
    var a = answers, loose = { mode: false, kind: false }, list;
    // Strict first; if too few fit, relax commitment, then work mode
    [[false, false], [false, true], [true, true]].some(function (l) {
      loose = { mode: l[0], kind: l[1] };
      list = JOBS.map(function (j) { return { j: j, s: score(j, a, loose) }; }).filter(function (x) { return x.s >= 0; });
      return list.length >= 3;
    });
    list.sort(function (x, y) { return y.s - x.s || y.j.hi - x.j.hi; });
    var exact = JOBS.filter(function (j) { return score(j, a, { mode: false, kind: false }) >= 0; }).length;

    var grid = $('quiz-grid'); grid.textContent = '';
    list.slice(0, 6).forEach(function (x) { grid.appendChild(card(x.j)); });

    var bits = [];
    if (a.mode !== 'any') bits.push(a.mode.toLowerCase());
    if (a.kind !== 'any') bits.push(a.kind.toLowerCase());
    $('quiz-summary').textContent = (loose.mode || loose.kind)
      ? 'We didn’t find many exact fits, so we widened the search a little. Here are the closest jobs.'
      : 'Based on your answers' + (bits.length ? ' (' + bits.join(', ') + ')' : '') + ', these jobs fit you best.';

    var qs = [];
    if (a.cat !== 'any') qs.push('cat=' + a.cat);
    if (a.mode !== 'any') qs.push('mode=' + encodeURIComponent(a.mode));
    if (a.kind !== 'any') qs.push('kind=' + encodeURIComponent(a.kind));
    var all = $('quiz-all');
    all.href = 'jobs.html' + (qs.length ? '?' + qs.join('&') : '');
    all.textContent = exact > 0 ? 'See all ' + exact + ' matches' : 'Browse all jobs';
    if (exact === 0) all.href = 'jobs.html';

    form.hidden = true; results.hidden = false;
    var head = document.getElementById('site-header');
    window.scrollTo(0, results.getBoundingClientRect().top + window.pageYOffset - (head ? head.offsetHeight : 0) - 24);
    results.focus({ preventScroll: true });
  }

  var ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M8 7h9v9"></path></svg>';
  function card(j) {
    var action = CAT_OF[j.product] === 'industrial' || j.title === 'Line Cook' ? 'Waitlist' : 'Reserve';
    var art = el('article', 'job');
    var cover = el('a', 'cover'); cover.href = action === 'Waitlist' ? 'waitlist.html?type=job&item=' + encodeURIComponent(j.title) : 'signup.html'; cover.setAttribute('aria-label', action + ' ' + j.title);
    art.appendChild(cover);
    var top = el('div', 'top'); top.appendChild(el('span', 'product', j.product)); art.appendChild(top);
    art.appendChild(el('h3', 'title', j.title));
    art.appendChild(el('div', 'meta', j.mode + ' · ' + j.kind));
    var bottom = el('div', 'bottom');
    bottom.appendChild(el('span', 'pay', '$' + j.lo + '–$' + j.hi + '/hr'));
    var act = el('span', 'action', action);
    var t = document.createElement('template'); t.innerHTML = ARROW; act.appendChild(t.content.firstChild);
    bottom.appendChild(act); art.appendChild(bottom);
    return art;
  }

  $('quiz-restart').addEventListener('click', function () {
    answers = {}; step = 0; results.hidden = true; form.hidden = false; show();
    opts.querySelector('input').focus();
  });

  show();
})();
