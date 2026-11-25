/* Εμφάνιση περιεχομένου από το Pages CMS (data/*.json).
   Χρήση σε σελίδα: <div data-cms="apofaseis"></div> και <script src="/assets/cms.js"></script>
   Προαιρετικά data-limit="5" για τις πιο πρόσφατες μόνο,
   data-programma="ΕΣΠΑ 2021-2027" (programmata) και data-eidos="Ισολογισμός" (programmata, oikonomika) για φιλτράρισμα,
   data-programma δέχεται και πολλά με | (π.χ. "ΕΣΠΑ 2021-2027|ΠΕΚΑ 2021-2027"), data-title: επικεφαλίδα που εμφανίζεται μόνο αν υπάρχουν καταχωρίσεις,
   data-quiet: χωρίς μήνυμα όταν δεν υπάρχουν καταχωρίσεις (για σελίδες με ήδη υπάρχουσα λίστα). */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function gr(d) { var p = String(d || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : esc(d); }
  function name(u) { try { return decodeURIComponent(String(u).split('/').pop()).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '); } catch (e) { return 'Αρχείο'; } }
  function ext(u) { var m = String(u).match(/\.([a-z0-9]+)$/i); return m ? m[1].toUpperCase() : 'ΑΡΧΕΙΟ'; }
  function doc(u, label) { return u ? '<a class="doc" href="' + esc(u) + '"><div>' + esc(label || name(u)) + '</div><span>' + ext(u) + '</span></a>' : ''; }
  function files(l) { return (l || []).filter(Boolean).map(function (u) { return '<li><a href="' + esc(u) + '">' + esc(name(u)) + '</a> <small>(' + ext(u) + ')</small></li>'; }).join(''); }
  function li(date, pill, title, body) {
    return '<li><time datetime="' + esc(String(date).slice(0, 10)) + '">' + gr(date) + '</time>' + (pill ? '<span class="pill">' + esc(pill) + '</span>' : '') +
      '<span class="tt">' + (body ? '<details><summary>' + title + '</summary>' + body + '</details>' : title) + '</span></li>';
  }
  var R = {
    apofaseis: function (x) {
      var t = 'Απόφαση ' + esc(x.arithmos) + ': ' + esc(x.thema);
      var b = (x.ada ? '<p>ΑΔΑ: <a href="https://diavgeia.gov.gr/decision/view/' + encodeURIComponent(x.ada) + '">' + esc(x.ada) + '</a></p>' : '') + doc(x.pdf, 'Απόφαση ' + x.arithmos);
      return li(x.imerominia, 'Απόφαση ΔΣ', t, b);
    },
    diakopes: function (x) {
      var st = x.katastasi === 'Σε εξέλιξη' ? 'now' : x.katastasi === 'Ολοκληρώθηκε' ? 'done' : 'plan';
      return '<div class="it ' + st + '"><div><b>' + esc(x.perioxes) + '</b> ' + gr(x.imerominia) + (x.ores ? ', ' + esc(x.ores) : '') +
        (x.keimeno ? '<br><small>' + esc(x.keimeno) + '</small>' : '') + '</div><span class="st ' + st + '">' + esc(x.katastasi || 'Προγραμματισμένη') + '</span></div>';
    },
    anakoinoseis: function (x) {
      var f = files(x.synimmena);
      return li(x.imerominia, x.katigoria || 'Ανακοίνωση', esc(x.titlos), (x.keimeno || '') + (f ? '<ul class="flist">' + f + '</ul>' : ''));
    },
    diagonismoi: function (x) {
      var f = files(x.synimmena);
      var b = (x.kodikos ? '<p>' + esc(x.kodikos) + '</p>' : '') + (x.keimeno ? '<p>' + esc(x.keimeno) + '</p>' : '') + (f ? '<ul class="flist">' + f + '</ul>' : '');
      return li(x.imerominia, 'Διαγωνισμός', esc(x.titlos), b);
    },
    programmata: function (x) { return doc(x.pdf, x.titlos + ' (' + x.etos + ')' + (x.programma ? ' · ' + x.programma : '')); },
    oikonomika: function (x) { return doc(x.pdf, x.titlos); }
  };
  var LIST = {diakopes: 'div', programmata: 'div', oikonomika: 'div'};
  document.querySelectorAll('[data-cms]').forEach(function (el) {
    var k = el.getAttribute('data-cms'); if (!R[k]) return;
    var quiet = el.hasAttribute('data-quiet');
    fetch('/data/' + k + '.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(function (l) {
      l = (l || []).slice().sort(function (a, b) { return String(b.imerominia || b.etos).localeCompare(String(a.imerominia || a.etos)); });
      var fp = el.getAttribute('data-programma'); if (fp) { var fps = fp.split('|'); l = l.filter(function (x) { return fps.indexOf(x.programma) >= 0; }); }
      var fe = el.getAttribute('data-eidos'); if (fe) l = l.filter(function (x) { return x.eidos === fe; });
      var n = parseInt(el.getAttribute('data-limit'), 10); if (n) l = l.slice(0, n);
      if (!l.length) { el.innerHTML = quiet ? '' : '<p>Δεν υπάρχουν καταχωρίσεις.</p>'; return; }
      var html = l.map(R[k]).join('');
      var title = el.getAttribute('data-title');
      el.innerHTML = (title ? '<h2>' + esc(title) + '</h2>' : '') + (LIST[k] ? html : '<ul class="nlist">' + html + '</ul>');
    }).catch(function () { el.innerHTML = quiet ? '' : '<p>Δεν ήταν δυνατή η φόρτωση.</p>'; });
  });
})();
