"""Collect publisher RSS summaries; no scraping, API key, or paid service."""
import concurrent.futures
import datetime as dt
import email.utils
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/news.json'
SOURCES = [
    ('Blick', 'fr', 'https://www.blick.ch/fr/sport/football/rss.xml', False),
    ('Blick', 'de', 'https://www.blick.ch/sport/fussball/superleague/rss.xml', True),
    ('20 minutes', 'fr', 'https://partner-feeds.20min.ch/rss/20minutes/sports/super-league', True),
    ('20 minutes', 'fr', 'https://partner-feeds.20min.ch/rss/20minutes/sports/football', False),
    ('20 Minuten', 'de', 'https://partner-feeds.20min.ch/rss/20minuten/sport/fussball', False),
]
RELEVANT = re.compile(r'super[- ]?league|challenge[- ]?league|young boys|\bYB\b|servette|lausanne|lugano|grasshopper|saint-gall|st[. -]+gall|\bFC(?:Z|B|SG)\b|\bGC\b|\bsion\b|xamax|thoune|\bthun\b|vaduz|winterth|luzern|lucerne|basel|bâle|fcz|sfl', re.I)

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', '', value or ''))).strip()

def safe_url(value):
    value = (value or '').strip()
    return value if urllib.parse.urlparse(value).scheme == 'https' else ''

def parse_feed(raw, source, language, dedicated=False, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    root = ET.fromstring(raw)
    articles = []
    for item in root.findall('.//item'):
        title = clean(item.findtext('title'))
        description = clean(item.findtext('description'))
        url = safe_url(item.findtext('link'))
        if re.search(r'Mach den|Startelf|stell.*auf', title, re.I):
            continue
        if not title or not url or (not dedicated and not RELEVANT.search(title + ' ' + description + ' ' + url)):
            continue
        try:
            published = email.utils.parsedate_to_datetime(item.findtext('pubDate'))
            if published.tzinfo is None:
                published = published.replace(tzinfo=dt.timezone.utc)
            published = published.astimezone(dt.timezone.utc)
        except (TypeError, ValueError, AttributeError):
            continue
        if published > now + dt.timedelta(minutes=10) or published < now - dt.timedelta(days=45):
            continue
        image = ''
        for child in item.iter():
            tag = child.tag.split('}')[-1]
            if tag in ('content', 'thumbnail', 'enclosure') and (child.get('medium') == 'image' or child.get('type', '').startswith('image/') or tag == 'thumbnail'):
                image = safe_url(child.get('url'))
                if image:
                    break
        if not image:
            match = re.search(r'<img[^>]+src=[\"\']([^\"\']+)', item.findtext('description') or '', re.I)
            image = safe_url(html.unescape(match[1])) if match else ''
        # Keep a short RSS excerpt, always linking to the publisher's full article.
        excerpt = ' '.join(description.split()[:max(0, 24-len(title.split()))])
        if excerpt and excerpt != description:
            excerpt = excerpt.rstrip('.,;:') + '…'
        articles.append(dict(id=hashlib.sha256(url.encode()).hexdigest()[:20], title=title, excerpt=excerpt,
                             url=url, image=image, source=source, language=language,
                             publishedAt=published.isoformat()))
    return articles

def collect(source):
    name, language, url, dedicated = source
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'SuperLeagueLive/1.0 RSS reader', 'Accept': 'application/rss+xml, application/xml, text/xml'})
        with urllib.request.urlopen(request, timeout=25) as response:
            articles = parse_feed(response.read(4_000_000), name, language, dedicated)
        return articles, dict(name=name, language=language, url=url, ok=True, count=len(articles))
    except Exception as error:
        return [], dict(name=name, language=language, url=url, ok=False, error=type(error).__name__)

def main():
    old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    articles, statuses = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for items, status in pool.map(collect, SOURCES):
            articles.extend(items)
            statuses.append(status)
    now = dt.datetime.now(dt.timezone.utc)
    # Preserve the last good articles during an individual publisher outage.
    merged = {a['id']: a for a in old.get('articles', []) if dt.datetime.fromisoformat(a['publishedAt']) > now-dt.timedelta(days=45)}
    merged.update({a['id']: a for a in articles})
    successful = any(s['ok'] and s['count'] for s in statuses)
    data = dict(checkedAt=now.isoformat(), updatedAt=now.isoformat() if successful else old.get('updatedAt'),
                status='ok' if successful and all(s['ok'] for s in statuses) else 'partial' if successful else 'error',
                sources=statuses, articles=sorted(merged.values(), key=lambda a:a['publishedAt'], reverse=True)[:100])
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'articles':len(data['articles']), 'status':data['status'], 'sources':statuses}, ensure_ascii=False))
    if not successful:
        raise SystemExit('All news feeds failed; previous articles retained.')

if __name__ == '__main__':
    main()
