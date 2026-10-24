"""Collect publisher RSS and official SFL public article metadata, without API keys."""
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
    ('BSC Young Boys', 'de', 'https://www.bscyb.ch/news', True),
    ('Swiss Football League', 'fr', 'https://sfl.ch/', True),
    ('Swiss Football League', 'de', 'https://sfl.ch/de', True),
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

def parse_yb(raw, now=None):
    """Read official listing metadata; the listing supplies dates, not times."""
    from zoneinfo import ZoneInfo
    now = now or dt.datetime.now(dt.timezone.utc)
    found = {}
    for block in re.split(r"<div\s+class=['\"]news-item[^'\"]*['\"]>", raw.decode('utf-8'))[1:]:
        date = re.search(r'class="news-date">(\d{2}\.\d{2}\.\d{2})</div>', block)
        link = re.search(r'class="news-title">.*?<a href="(news\?nid=\d+)">(.*?)</a>', block, re.S)
        if not date or not link:
            continue
        published = dt.datetime.strptime(date[1], '%d.%m.%y').replace(tzinfo=ZoneInfo('Europe/Zurich')).astimezone(dt.timezone.utc)
        if not now-dt.timedelta(days=45) < published <= now+dt.timedelta(minutes=10):
            continue
        url = 'https://www.bscyb.ch/' + html.unescape(link[1])
        title = clean(link[2])
        image = re.search(r'<img[^>]+(?:data-src|src)="([^"<>]+)"', block)
        category = re.search(r'class="news-head">(.*?)</div>', block, re.S)
        identity = hashlib.sha256(url.encode()).hexdigest()[:20]
        found[identity] = dict(id=identity, title=title, excerpt=clean(category[1]) if category else '',
            url=url, image=safe_url(html.unescape(image[1])) if image else '', source='BSC Young Boys',
            official=True, language='de', publishedAt=published.isoformat(), dateOnly=True)
    if not found:
        raise ValueError('No current official Young Boys articles')
    return list(found.values())

def collect(source):
    name, language, url, dedicated = source
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'SuperLeagueLive/1.0 RSS reader', 'Accept': 'application/rss+xml, application/xml, text/xml'})
        with urllib.request.urlopen(request, timeout=25) as response:
            raw = response.read(4_000_000)
        articles = parse_yb(raw) if name == 'BSC Young Boys' else parse_sfl(raw, language) if name == 'Swiss Football League' else parse_feed(raw, name, language, dedicated)
        return articles, dict(name=name, language=language, url=url, ok=True, count=len(articles))
    except Exception as error:
        return [], dict(name=name, language=language, url=url, ok=False, error=type(error).__name__)

def parse_sfl(raw, language):
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', raw.decode(), re.S)
    if not match:
        raise ValueError('Official SFL article metadata missing')
    page = json.loads(match[1])['props']['pageProps']['page']
    found = {}
    now = dt.datetime.now(dt.timezone.utc)
    def walk(value):
        if isinstance(value, dict):
            if value.get('type') == 'edito___article' and value.get('slug'):
                title = clean(value.get('title'))
                published = dt.datetime.fromisoformat(value['publication_date'].replace('Z', '+00:00'))
                if now-dt.timedelta(days=45) < published <= now+dt.timedelta(minutes=10):
                    url = 'https://sfl.ch/' + ('de/' if language=='de' else '') + 'articles/' + value['slug']
                    identity = hashlib.sha256(url.encode()).hexdigest()[:20]
                    excerpt = ' '.join(clean(value.get('summary')).split()[:max(0,24-len(title.split()))])
                    image = safe_url(value.get('images',{}).get('main',{}).get('url'))
                    found[identity] = dict(id=identity, title=title, excerpt=excerpt+'…' if excerpt else '',
                        url=url, image=image, source='Swiss Football League', official=True,
                        language=language, publishedAt=published.isoformat())
            for key, child in value.items():
                if key not in ('body', 'webConfig', '__ni18n_server__'):
                    walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    walk(page)
    if not found:
        raise ValueError('No current official SFL articles')
    return list(found.values())

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
