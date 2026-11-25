/* Worker για το deyao.gr στο Cloudflare.
 * Δημιουργείται από το tools/cloudflare/build_worker.py — μην το αλλάζετε με το χέρι.
 *
 * - /wp-content/...  -> ο παλιός server (τα PDF μένουν εκεί που είναι)
 * - παλιές διευθύνσεις WordPress (?p=, ?page_id=, ?s=, /<slug>/, παλιές σελίδες) -> 301 στις νέες
 * - /send.php (POST) -> email στη ΔΕΥΑΟ μέσω Resend (μεταβλητή RESEND_KEY)
 * - όλα τα άλλα -> το νέο site στο Cloudflare Pages (μεταβλητή PAGES_ORIGIN)
 */
const POSTS = __POSTS__;        // ID άρθρου -> /arxeio/<slug>/
const PAGE_IDS = __PAGE_IDS__;  // ID σελίδας -> νέα σελίδα
const OLD_PAGES = __OLD_PAGES__; // παλιά διαδρομή (χωρίς / στην αρχή/τέλος) -> νέα σελίδα
const SLUGS = __SLUGS__;        // slug παλιού άρθρου -> /arxeio/<slug>/

const TO = 'deyaor@otenet.gr';
const FROM = 'Ιστοσελίδα ΔΕΥΑΟ <no-reply@deyao.gr>';
const FORMS = {
  epikoinonia: { subject: 'Μήνυμα από τη φόρμα επικοινωνίας', back: '/epikoinonia.html' },
  parapona: { subject: 'Παράπονο / πρόταση από την ιστοσελίδα', back: '/parapona.html' },
};

function go(url, to) {
  return Response.redirect(new URL(encodeURI(to), url).toString(), 301);
}
function oneline(s) { return String(s || '').replace(/[\r\n\t]+/g, ' ').trim(); }

async function send(req, env) {
  const ajax = (req.headers.get('accept') || '').includes('application/json');
  const f = await req.formData();
  const cfg = FORMS[f.get('form')];
  if (!cfg) return new Response('Bad request', { status: 400 });
  const done = (ok, code = 200) => ajax
    ? new Response(JSON.stringify({ ok }), { status: ok ? 200 : code, headers: { 'content-type': 'application/json; charset=utf-8' } })
    : Response.redirect(new URL(cfg.back + (ok ? '?sent=1' : '?error=1') + '#form', req.url).toString(), 303);
  if ((f.get('website') || '') !== '') return done(true); // bot
  const name = oneline(f.get('name')).slice(0, 120);
  const contact = oneline(f.get('contact')).slice(0, 160);
  const topic = oneline(f.get('topic')).slice(0, 40);
  const message = String(f.get('message') || '').slice(0, 5000);
  const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (!name || !contact || !message.trim()) return done(false, 422);
  if (f.get('form') === 'epikoinonia' && !isMail) return done(false, 422);
  if (!env.RESEND_KEY) return done(false, 500);
  const when = new Date().toLocaleString('el-GR', { timeZone: 'Europe/Athens' });
  const text = `Ονοματεπώνυμο: ${name}\nEmail / τηλέφωνο: ${contact}\n${topic ? 'Θέμα: ' + topic + '\n' : ''}\nΜήνυμα:\n${message}\n\n--\nΣτάλθηκε από τη φόρμα ${cfg.back} του deyao.gr, ${when}\n`;
  const body = { from: FROM, to: [TO], subject: `${cfg.subject}${topic ? ' (' + topic + ')' : ''} – ${name}`, text };
  if (isMail) body.reply_to = contact;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.RESEND_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return done(r.ok, 500);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    let path;
    try { path = decodeURIComponent(url.pathname); } catch (e) { path = url.pathname; }
    const q = url.searchParams;

    // παλιός κώδικας WordPress: κλειστός
    if (/^\/(wp-admin|wp-includes)(\/|$)/.test(path) || /^\/(wp-login|xmlrpc|wp-cron|wp-config|wp-settings|wp-load)\.php$/.test(path)
        || (path.startsWith('/wp-content/') && /\.(php|phtml|phar)$/i.test(path))) {
      return new Response('Forbidden', { status: 403 });
    }
    // τα συνημμένα μένουν στον παλιό server
    if (path.startsWith('/wp-content/')) return fetch(req);

    if (path === '/send.php' && req.method === 'POST') return send(req, env);

    if (path === '/' || path === '/index.php') {
      if (q.has('p') && POSTS[q.get('p')]) return go(url, POSTS[q.get('p')]);
      if (q.has('page_id') && PAGE_IDS[q.get('page_id')]) return go(url, PAGE_IDS[q.get('page_id')]);
      if (q.has('s')) return Response.redirect(new URL('/search.html?q=' + encodeURIComponent(q.get('s')), url).toString(), 301);
    }
    const key = path.replace(/^\/+|\/+$/g, '');
    if (key === 'arxeio') return go(url, '/arxeio.html');
    if (OLD_PAGES[key]) return go(url, OLD_PAGES[key]);
    if (/^(category|tag|author|feed|comments)(\/|$)/.test(key) || /^[^/]+\/feed$/.test(key)) return go(url, '/nea.html');
    if (SLUGS[key]) return go(url, SLUGS[key]);

    // το νέο site (Cloudflare Pages)
    const origin = new URL(env.PAGES_ORIGIN || 'https://deyao-site.pages.dev');
    const target = new URL(url.pathname + url.search, origin);
    return fetch(new Request(target, req));
  },
};
