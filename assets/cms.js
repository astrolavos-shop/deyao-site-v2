/* Εμφάνιση περιεχομένου από το Pages CMS (data/*.json).
   Χρήση σε σελίδα: <div data-cms="anakoinoseis"></div> και <script src="/assets/cms.js"></script>
   Επιλογές:
   data-where="πεδίο=τιμή1|τιμή2"  φιλτράρισμα (π.χ. katigoria=Δελτίο Τύπου, eidos=Προμήθεια|). Κενή τιμή = και όσα δεν έχουν τιμή.
   data-programma="ΕΣΠΑ 2021-2027|ΠΕΚΑ 2021-2027", data-eidos="Ισολογισμός"  συντομεύσεις του data-where
   data-limit="5"           μόνο οι πιο πρόσφατες
   data-title="..."          επικεφαλίδα που εμφανίζεται μόνο αν υπάρχουν καταχωρίσεις (data-title-tag="h3" προαιρετικά)
   data-quiet               κανένα μήνυμα όταν δεν υπάρχουν καταχωρίσεις
   data-into="id"           προσθήκη μέσα σε υπάρχουσα λίστα της σελίδας (ταξινόμηση κατά ημερομηνία) ή στη συλλογή φωτογραφιών
   data-card data-max="5"   κάρτες της αρχικής σελίδας (μαζί με data-into), κρατά τις πιο πρόσφατες */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function gr(d) { var p = String(d || '').slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : esc(d); }
  function name(u) { try { return decodeURIComponent(String(u).split('/').pop()).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '); } catch (e) { return 'Αρχείο'; } }
  function ext(u) { var m = String(u).match(/\.([a-z0-9]+)$/i); return m ? m[1].toUpperCase() : 'ΑΡΧΕΙΟ'; }
  function doc(u, label) { return u ? '<a class="doc" href="' + esc(u) + '"><div>' + esc(label || name(u)) + '</div><span>' + ext(u) + '</span></a>' : ''; }
  function files(l) { return (l || []).filter(Boolean).map(function (u) { return '<li><a href="' + esc(u) + '">' + esc(name(u)) + '</a> <small>(' + ext(u) + ')</small></li>'; }).join(''); }
  function hash(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function iid(k, x) { return 'c-' + k + '-' + String(x.imerominia || x.etos || '').slice(0, 10) + '-' + hash(x.titlos || x.thema || x.perioxes || x.arithmos); }
  function li(id, date, pill, title, body) {
    return '<li id="' + id + '"><time datetime="' + esc(String(date).slice(0, 10)) + '">' + gr(date) + '</time>' + (pill ? '<span class="pill">' + esc(pill) + '</span>' : '') +
      '<span class="tt">' + (body ? '<details><summary>' + title + '</summary>' + body + '</details>' : title) + '</span></li>';
  }
  var MON = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  function card(href, date, tag, title, meta) {
    var p = String(date || '').slice(0, 10).split('-');
    return '<a class="ecard" href="' + esc(href) + '"><span class="etop"><time class="cal" datetime="' + esc(p.join('-')) + '"><b>' + esc(p[2] || '') + '</b><span>' + (MON[+p[1] - 1] || '') + '</span><small>' + esc(p[0]) + '</small></time><span class="etag">' + esc(tag) + '</span></span><h3>' + esc(title) + '</h3><span class="emeta"><span>' + esc(meta) + '</span><span class="ego" aria-hidden="true">Προβολή</span></span></a>';
  }
  var CAT = {'Δεξαμενές νερού της ΔΕΥΑ Ορεστιάδας': 'dexamenes', 'Εγκαταστάσεις βιολογικού καθαρισμού Όρδας': 'viologikos', 'Εγκαταστάσεις δεξαμενών Ορεστιάδας': 'dexamenes-oresti', 'Μονάδα καθαρισμού φίλτρων νερού Λεπτής Ορεστιάδας': 'leptis', 'Συλλεκτικές φωτογραφίες της Ορεστιάδας': 'syllektikes'};
  function recount(g) {
    document.querySelectorAll('#galtabs .chip').forEach(function (c) {
      var k = c.getAttribute('data-k');
      var n = k ? g.querySelectorAll('[data-cat="' + k + '"]').length : g.querySelectorAll('a.g').length;
      c.textContent = c.textContent.replace(/\(\d+\)\s*$/, '(' + n + ')');
    });
  }
  function dt(e) { var t = e.querySelector('time'); return t ? t.getAttribute('datetime') || '' : ''; }
  function resort(box) {
    [].slice.call(box.children).sort(function (a, b) { return dt(b).localeCompare(dt(a)); }).forEach(function (e) { box.appendChild(e); });
  }
  var PAGE = {anakoinoseis: '/nea.html', diagonismoi: '/diagonismoi.html', diakopes: '/diakopes.html', apofaseis: '/i-deyao.html'};
  var R = {
    apofaseis: function (x, id) {
      var t = 'Απόφαση ' + esc(x.arithmos) + ': ' + esc(x.thema);
      var b = (x.ada ? '<p>ΑΔΑ: <a href="https://diavgeia.gov.gr/decision/view/' + encodeURIComponent(x.ada) + '">' + esc(x.ada) + '</a></p>' : '') + doc(x.pdf, 'Απόφαση ' + x.arithmos);
      return li(id, x.imerominia, 'Απόφαση ΔΣ', t, b);
    },
    diakopes: function (x, id) {
      var t = esc(x.perioxes) + (x.ores ? ', ' + esc(x.ores) : '');
      var b = '<p>Κατάσταση: <b>' + esc(x.katastasi || 'Προγραμματισμένη') + '</b></p>' + (x.keimeno ? '<p>' + esc(x.keimeno) + '</p>' : '');
      return li(id, x.imerominia, 'Διακοπή νερού', t, b);
    },
    anakoinoseis: function (x, id) {
      var f = files(x.synimmena);
      return li(id, x.imerominia, x.katigoria || 'Ανακοίνωση', esc(x.titlos), (x.keimeno || '') + (f ? '<ul class="flist">' + f + '</ul>' : ''));
    },
    diagonismoi: function (x, id) {
      var f = files(x.synimmena);
      var b = (x.kodikos ? '<p>' + esc(x.kodikos) + '</p>' : '') + (x.keimeno ? '<p>' + esc(x.keimeno) + '</p>' : '') + (f ? '<ul class="flist">' + f + '</ul>' : '');
      return li(id, x.imerominia, x.eidos || 'Διαγωνισμός', esc(x.titlos), b);
    },
    programmata: function (x) { return doc(x.pdf, x.titlos + ' (' + x.etos + ')' + (x.programma ? ' · ' + x.programma : '')); },
    oikonomika: function (x) { return doc(x.pdf, x.titlos); },
    fotografies: function (x) {
      if (!x.eikona) return '';
      var cap = x.titlos || 'Φωτογραφία';
      return '<a class="g" href="' + esc(x.eikona) + '" data-cat="' + esc(CAT[x.katigoria] || 'cms') + '" data-cap="' + esc(cap) + '" aria-label="Μεγέθυνση: ' + esc(cap) + '"><img src="' + esc(x.eikona) + '" alt="' + esc(x.perigrafi || cap) + '" loading="lazy"></a>';
    }
  };
  var C = {
    anakoinoseis: function (x) { var n = (x.synimmena || []).filter(Boolean).length; return [x.katigoria || 'Ανακοίνωση', x.titlos, n ? n + (n === 1 ? ' αρχείο' : ' αρχεία') : 'Ανακοίνωση']; },
    diagonismoi: function (x) { var n = (x.synimmena || []).filter(Boolean).length; return ['Διαγωνισμός', x.titlos, n ? n + (n === 1 ? ' αρχείο' : ' αρχεία') : (x.kodikos || 'Διαγωνισμός')]; },
    diakopes: function (x) { return ['Διακοπή νερού', 'Διακοπή νερού: ' + x.perioxes + (x.ores ? ', ' + x.ores : ''), x.katastasi || 'Ανακοίνωση']; },
    apofaseis: function (x) { return ['Απόφαση ΔΣ', 'Απόφαση ' + x.arithmos + ': ' + x.thema, 'Απόφαση ΔΣ']; }
  };
  var LIST = {programmata: 'div', oikonomika: 'div', fotografies: 'div'};
  function conds(el) {
    var c = [];
    (el.getAttribute('data-where') || '').split(';').forEach(function (w) { var i = w.indexOf('='); if (i > 0) c.push([w.slice(0, i).trim(), w.slice(i + 1).split('|')]); });
    if (el.getAttribute('data-programma')) c.push(['programma', el.getAttribute('data-programma').split('|')]);
    if (el.getAttribute('data-eidos')) c.push(['eidos', el.getAttribute('data-eidos').split('|')]);
    return c;
  }
  document.querySelectorAll('[data-cms]').forEach(function (el) {
    var k = el.getAttribute('data-cms'); if (!R[k]) return;
    var quiet = el.hasAttribute('data-quiet');
    fetch('/data/' + k + '.json', {cache: 'no-cache'}).then(function (r) { return r.json(); }).then(function (l) {
      l = (l || []).slice().sort(function (a, b) { return String(b.imerominia || b.etos || '').localeCompare(String(a.imerominia || a.etos || '')); });
      conds(el).forEach(function (c) { l = l.filter(function (x) { return c[1].indexOf(String(x[c[0]] || '')) >= 0; }); });
      var n = parseInt(el.getAttribute('data-limit'), 10); if (n) l = l.slice(0, n);
      if (!l.length) { el.innerHTML = quiet ? '' : '<p>Δεν υπάρχουν καταχωρίσεις.</p>'; return; }
      var into = el.getAttribute('data-into') && document.getElementById(el.getAttribute('data-into'));
      var html;
      if (el.hasAttribute('data-card') && C[k]) {
        html = l.map(function (x) { var c = C[k](x); return card(PAGE[k] + '#' + iid(k, x), x.imerominia, c[0], c[1], c[2]); }).join('');
      } else {
        html = l.map(function (x) { return R[k](x, iid(k, x)); }).join('');
      }
      if (into) {
        if (k === 'fotografies') { into.insertAdjacentHTML('afterbegin', html); recount(into); return; }
        into.insertAdjacentHTML('beforeend', html); resort(into);
        var max = parseInt(el.getAttribute('data-max'), 10);
        if (max) while (into.children.length > max) into.removeChild(into.lastElementChild);
        return;
      }
      var title = el.getAttribute('data-title'), tag = el.getAttribute('data-title-tag') || 'h2';
      el.innerHTML = (title ? '<' + tag + '>' + esc(title) + '</' + tag + '>' : '') + (LIST[k] ? html : '<ul class="nlist">' + html + '</ul>');
    }).catch(function () { el.innerHTML = quiet ? '' : '<p>Δεν ήταν δυνατή η φόρτωση.</p>'; });
  });
  if (location.hash.indexOf('#c-') === 0) setTimeout(function () { var t = document.getElementById(location.hash.slice(1)); if (t) { var d = t.querySelector('details'); if (d) d.open = true; t.scrollIntoView(); } }, 800);
})();
