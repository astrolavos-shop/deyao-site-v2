#!/usr/bin/env python3
"""Φτιάχνει το .htaccess με τις ανακατευθύνσεις από τις διευθύνσεις του παλιού WordPress.

- /?p=ID, /?page_id=ID           -> νέα σελίδα
- /<slug-άρθρου>/                -> /arxeio/<slug-άρθρου>/
- /<παλιά-σελίδα>/               -> αντίστοιχη νέα σελίδα (pages-map.json)
- /category/..., /feed/, /tag/... -> /nea.html
Τα αρχεία /wp-content/uploads/... μένουν στον server στις ίδιες διευθύνσεις.

Χρήση: python3 tools/wp-archive/htaccess.py <φάκελος με pages1.json από το wp-json>
"""
import json, os, re, sys, urllib.parse as up

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
posts = json.load(open(os.path.join(HERE, 'redirects.json')))
pmap = json.load(open(os.path.join(HERE, 'pages-map.json')))
pages = json.load(open(os.path.join(sys.argv[1], 'pages1.json')))


def enc(path):
    # το % γράφεται \% γιατί αλλιώς ο Apache το διαβάζει ως %1-%9 (αναφορά σε RewriteCond)
    return up.quote(path, safe='/#').replace('%', '\\%')


L = ['# Δημιουργήθηκε από το tools/wp-archive/htaccess.py. Μην το αλλάζετε με το χέρι.',
     'Options -Indexes',
     'DirectoryIndex index.html index.php',
     'AddDefaultCharset utf-8',
     'ErrorDocument 404 /404.html',
     '',
     '<IfModule mod_rewrite.c>',
     'RewriteEngine On',
     'RewriteBase /',
     '',
     '# Ασφάλεια: κώδικας του παλιού WordPress δεν εκτελείται πια',
     'RewriteRule ^wp-content/.*\\.(php|phtml|phar)$ - [F,L]',
     'RewriteRule ^(wp-admin|wp-includes)(/|$) - [F,L]',
     'RewriteRule ^(wp-login|xmlrpc|wp-cron|wp-config|wp-settings|wp-load)\\.php$ - [F,L]',
     '',
     '# Τα συνημμένα του παλιού site μένουν ως έχουν',
     'RewriteRule ^wp-content/ - [L]',
     '',
     '# Παλιοί σύνδεσμοι ?p=ID (άρθρα)']
for pid, path in posts.items():
    L += [f'RewriteCond %{{QUERY_STRING}} (^|&)p={pid}(&|$)', f'RewriteRule ^(index\\.php)?$ {enc(path)} [R=301,L,NE,QSD]']
L += ['', '# Παλιοί σύνδεσμοι ?page_id=ID (σελίδες)']
for x in pages:
    path = up.unquote(up.urlparse(x['link']).path)
    L += [f'RewriteCond %{{QUERY_STRING}} (^|&)page_id={x["id"]}(&|$)', f'RewriteRule ^(index\\.php)?$ {enc(pmap[path])} [R=301,L,NE,QSD]']
L += ['', '# Παλιά αναζήτηση ?s=... -> νέα αναζήτηση',
      'RewriteCond %{QUERY_STRING} (^|&)s=([^&]*)',
      'RewriteRule ^(index\\.php)?$ /search.html?q=%2 [R=301,L,NE]']
L += ['', '# Παλιές σελίδες του WordPress -> νέες σελίδες']
for old, new in sorted(pmap.items(), key=lambda kv: -len(kv[0])):
    if old == '/':
        continue
    rx = re.escape(old.strip('/')).replace('\\/', '/').replace('\\-', '-')
    L.append(f'RewriteRule ^{rx}/?$ {enc(new)} [R=301,L,NE]')
L += ['',
      'RewriteRule ^arxeio/?$ /arxeio.html [R=301,L]',
      '',
      '# Κατηγορίες, ετικέτες, RSS του παλιού site',
      'RewriteRule ^(category|tag|author|feed|comments)(/.*)?$ /nea.html [R=301,L]',
      'RewriteRule ^[^/]+/feed/?$ /nea.html [R=301,L]',
      '',
      '# Παλιά άρθρα /<slug>/ -> /arxeio/<slug>/']
for path in posts.values():
    slug = path[len('/arxeio/'):].strip('/')
    L.append(f'RewriteRule ^{re.escape(slug).replace(chr(92) + "-", "-")}/?$ {enc(path)} [R=301,L,NE]')
L += ['# (εφεδρικός κανόνας για ό,τι δεν καλύφθηκε παραπάνω)',
      'RewriteCond %{REQUEST_FILENAME} !-f',
      'RewriteCond %{REQUEST_FILENAME} !-d',
      'RewriteCond %{DOCUMENT_ROOT}/arxeio/$1 -d',
      'RewriteRule ^([^/]+)/?$ /arxeio/$1/ [R=301,L]',
      '</IfModule>',
      '',
      '<IfModule mod_headers.c>',
      '<FilesMatch "\\.(css|js|png|jpe?g|webp|svg|woff2?)$">',
      'Header set Cache-Control "public, max-age=604800"',
      '</FilesMatch>',
      '</IfModule>',
      '']
open(os.path.join(ROOT, '.htaccess'), 'w', encoding='utf-8').write('\n'.join(L))
print('γραμμές:', len(L))
