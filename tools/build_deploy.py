#!/usr/bin/env python3
"""Φτιάχνει το πακέτο για το deyao.gr (Plesk του ΟΤΕ) από το repo.

Το repo μένει όπως είναι (η προεπισκόπηση στο GitHub Pages μένει κρυφή από το Google).
Στο πακέτο:
  - αφαιρείται το <meta name="robots" content="noindex,nofollow"> από τις σελίδες
  - robots.txt που επιτρέπει την ευρετηρίαση + sitemap.xml
  - δεν μπαίνουν: CNAME, εργαλεία (tools/), πρότυπα (anakoinosi.html), .git
  - ΔΕΝ μπαίνει το wp-content/: τα συνημμένα μένουν ήδη στον server.

Χρήση: python3 tools/build_deploy.py   ->  dist/deyao-site/ και dist/deyao-site.zip
"""
import os, re, shutil, urllib.parse as up, zipfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(DIST, 'deyao-site')
SITE = 'https://www.deyao.gr'

SKIP_DIRS = {'.git', '.github', 'tools', 'dist', 'wp-content', 'node_modules'}
SKIP_FILES = {'CNAME', 'anakoinosi.html', '.gitignore', '.pages.yml'}
NOINDEX = re.compile(r'<meta name="robots" content="noindex,\s*nofollow">\s*')

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
pages = []
for dp, dns, fns in os.walk(ROOT):
    rel = os.path.relpath(dp, ROOT)
    dns[:] = [d for d in dns if not (rel == '.' and d in SKIP_DIRS) and not d.startswith('.')]
    for fn in fns:
        if rel == '.' and (fn in SKIP_FILES or fn.endswith('.md')):
            continue
        if fn.startswith('.') and fn != '.htaccess':
            continue
        src = os.path.join(dp, fn)
        dst = os.path.join(OUT, rel, fn)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if fn.endswith('.html'):
            s = open(src, encoding='utf-8').read()
            if fn != '404.html':
                s = NOINDEX.sub('', s)
                p = '/' + os.path.relpath(dst, OUT).replace(os.sep, '/')
                pages.append('/' if p == '/index.html' else (p[:-len('index.html')] if p.endswith('/index.html') else p))
            open(dst, 'w', encoding='utf-8').write(s)
        else:
            shutil.copy2(src, dst)

open(os.path.join(OUT, 'robots.txt'), 'w').write(
    'User-agent: *\nDisallow: /send.php\nDisallow: /wp-admin/\n\nSitemap: ' + SITE + '/sitemap.xml\n')
today = datetime.date.today().isoformat()
with open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for p in sorted(pages):
        f.write(f'<url><loc>{SITE}{up.quote(p)}</loc><lastmod>{today}</lastmod></url>\n')
    f.write('</urlset>\n')

left = [p for p in pages if NOINDEX.search(open(os.path.join(OUT, p.lstrip('/') or 'index.html') if not p.endswith('/') else os.path.join(OUT, p.lstrip('/'), 'index.html'), encoding='utf-8').read())]
assert not left, left

z = os.path.join(DIST, 'deyao-site.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    for dp, _, fns in os.walk(OUT):
        for fn in fns:
            full = os.path.join(dp, fn)
            zf.write(full, os.path.relpath(full, OUT))
print(f'σελίδες: {len(pages)}  ->  {os.path.relpath(z, ROOT)} ({os.path.getsize(z) // 1024} KB)')
