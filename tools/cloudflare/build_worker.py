#!/usr/bin/env python3
"""Φτιάχνει το dist/worker.js (ένα αρχείο, για επικόλληση στο Cloudflare Workers).

Χρήση: python3 tools/cloudflare/build_worker.py <φάκελος με pages1.json από το wp-json>
Το pages1.json χρειάζεται μόνο για τα ?page_id=· αν λείπει, παραλείπονται.
"""
import json, os, sys, urllib.parse as up

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
WP = os.path.join(ROOT, 'tools', 'wp-archive')

posts = json.load(open(os.path.join(WP, 'redirects.json')))
pmap = json.load(open(os.path.join(WP, 'pages-map.json')))
page_ids = {}
src = os.path.join(sys.argv[1], 'pages1.json') if len(sys.argv) > 1 else os.path.join(WP, 'page-ids.json')
if os.path.exists(src):
    data = json.load(open(src))
    if isinstance(data, list):
        page_ids = {str(x['id']): pmap[up.unquote(up.urlparse(x['link']).path)] for x in data}
    else:
        page_ids = data
    json.dump(page_ids, open(os.path.join(WP, 'page-ids.json'), 'w'), ensure_ascii=False, indent=0)

old_pages = {k.strip('/'): v for k, v in pmap.items() if k.strip('/')}
slugs = {v[len('/arxeio/'):].strip('/'): v for v in posts.values()}

js = open(os.path.join(HERE, 'worker.template.js'), encoding='utf-8').read()
for name, val in [('__POSTS__', posts), ('__PAGE_IDS__', page_ids), ('__OLD_PAGES__', old_pages), ('__SLUGS__', slugs)]:
    js = js.replace(name, json.dumps(val, ensure_ascii=False))
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
open(os.path.join(ROOT, 'dist', 'worker.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(HERE, 'worker.js'), 'w', encoding='utf-8').write(js)  # αντίγραφο στο repo, για επικόλληση
print('dist/worker.js', len(js) // 1024, 'KB', '| άρθρα', len(posts), '| page_id', len(page_ids), '| σελίδες', len(old_pages))
