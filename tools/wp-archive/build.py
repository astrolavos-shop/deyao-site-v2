#!/usr/bin/env python3
"""Μεταφορά των παλιών άρθρων του WordPress (www.deyao.gr) σε στατικές σελίδες.

Για κάθε άρθρο φτιάχνεται η σελίδα /arxeio/<slug>/index.html· το .htaccess
ανακατευθύνει την παλιά διεύθυνση /<slug>/ εκεί, ώστε οι παλιές
διευθύνσεις (Google, Διαύγεια, παλιοί σύνδεσμοι) να συνεχίσουν να δουλεύουν.
Τα συνημμένα μένουν στις ίδιες διευθύνσεις /wp-content/uploads/... .

Χρήση: python3 tools/wp-archive/build.py <φάκελος με posts*.json από το wp-json>
Γράφει επίσης το tools/wp-archive/redirects.json (ID άρθρου -> διεύθυνση).
"""
import glob, html, json, os, re, sys, urllib.parse as up

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1]

CATS = {50: 'Ανακοινώσεις', 77: 'Δελτία τύπου', 64: 'Διαγωνισμοί', 72: 'Διαγωνισμοί έργων',
        76: 'Διαγωνισμοί προμηθειών', 70: 'Διακοπές νερού', 66: 'Έργα', 49: 'Νέα',
        51: 'Προκηρύξεις', 65: 'Προμήθειες', 62: 'Προσκλήσεις', 1: 'Ανακοινώσεις'}

posts = [p for f in sorted(glob.glob(os.path.join(SRC, 'posts*.json'))) for p in json.load(open(f))]

tpl = open(os.path.join(ROOT, 'anakoinosi.html'), encoding='utf-8').read()
head, rest = tpl.split('<main', 1)
_, foot = rest.split('</main>', 1)


def rootify(s):
    """Σχετικές διευθύνσεις (assets/x, nea.html) -> απόλυτες (/assets/x)."""
    return re.sub(r'(\b(?:href|src)=")(?!https?:|mailto:|tel:|#|/|data:|javascript:)', r'\1/', s)


head = rootify(head)
foot = rootify(foot)
head = head.replace('<meta name="robots" content="noindex,nofollow">\n', '')


def local(u):
    return re.sub(r'https?://(?:www\.)?deyao\.gr(?=/)', '', u)


def clean(h):
    h = re.sub(r'<object\b.*?</object>', '', h, flags=re.S)
    # μπλοκ αρχείου του WordPress -> κουτί εγγράφου του νέου site
    def block(m):
        a = re.search(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', m.group(0), re.S)
        if not a:
            return ''
        href, txt = a.group(1), re.sub(r'<[^>]+>', '', a.group(2)).strip() or 'Αρχείο'
        ext = os.path.splitext(up.urlparse(href).path)[1].lstrip('.').upper() or 'ΑΡΧΕΙΟ'
        return f'<a class="doc" href="{href}"><div>{txt}</div><span>{ext}</span></a>'
    h = re.sub(r'<div[^>]*class="wp-block-file[^"]*"[^>]*>.*?</div>', block, h, flags=re.S)
    h = re.sub(r'\s(?:data-wp-[\w-]+|aria-describedby|srcset|sizes|decoding|loading|fetchpriority)="[^"]*"', '', h)
    h = re.sub(r'\sclass="wp-[^"]*"', '', h)
    h = re.sub(r'(href|src)="(https?://(?:www\.)?deyao\.gr/[^"]*)"', lambda m: f'{m.group(1)}="{local(m.group(2))}"', h)
    h = re.sub(r'<p>(?:\s|&nbsp;)*</p>', '', h)
    return h.strip()


redirects = {}
made = 0
for p in posts:
    path = up.unquote(up.urlparse(p['link']).path)  # /<slug>/
    path = '/arxeio' + path
    redirects[str(p['id'])] = path
    title = html.unescape(re.sub(r'<[^>]+>', '', p['title']['rendered'])).strip()
    t = html.escape(title, quote=False)
    d = p['date'][:10]
    dd = '/'.join(reversed(d.split('-')))
    cat = next((CATS[c] for c in p['categories'] if c in CATS), 'Ανακοινώσεις')
    body = clean(p['content']['rendered'])
    h = head
    h = re.sub(r'<title>.*?</title>', f'<title>{t} – ΔΕΥΑΟ</title>', h)
    h = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="{html.escape(title)} – ΔΕΥΑΟ, {dd}">', h)
    main = (f'<main id="main"><div class="pagehead"><div class="wrap"><nav class="crumbs" aria-label="Διαδρομή">'
            f'<a href="/index.html">Αρχική</a> › <a href="/nea.html">Νέα</a> › <a href="/arxeio.html">Αρχείο αναρτήσεων</a></nav>'
            f'<h1>{t}</h1></div></div><div class="wrap layout"><aside class="side" aria-label="Μενού ενότητας"><h2>Νέα</h2>'
            f'<a href="/nea.html">Ανακοινώσεις</a><a href="/nea.html#deltia-typou">Δελτία Τύπου</a><a href="/diakopes.html">Διακοπές Υδροδότησης</a>'
            f'<a href="/arxeio.html">Αρχείο αναρτήσεων</a></aside><div class="prose">'
            f'<p><span class="pill">{cat}</span> · <time datetime="{d}">{dd}</time></p>{body}'
            f'<p><a class="btn alt" href="/arxeio.html">← Αρχείο αναρτήσεων</a></p></div></div></main>')
    out = os.path.join(ROOT, path.strip('/'), 'index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(h + main + foot)
    made += 1

json.dump(redirects, open(os.path.join(os.path.dirname(__file__), 'redirects.json'), 'w'), ensure_ascii=False, indent=0)
print('σελίδες:', made)
