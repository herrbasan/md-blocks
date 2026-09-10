#!/usr/bin/env node
/*
MD-Blocks renderer (seed) — zero-dependency, three profiles from one parse:
  page  — continuous webpage
  print — A4 paged document (section = page, preset=page-break honored)
  deck  — slideshow (section = slide, keyboard nav, vars drive pacing)

NOT the reference renderer: the Markdown converter covers the CommonMark subset
the demos use (headings, paragraphs, lists, tables, quotes, fences, rules,
images, links, inline emphasis/code). Output is self-contained HTML+CSS per file.

Usage:  node tools/render.js <file.md> [profile]   profile: page|print|deck|all (default all)
Writes: <dir>/rendered/<name>.<profile>.html
*/

const fs = require('fs');
const path = require('path');

/* ---------------------------------------------------------------- parse */

const DIRECTIVE_RE = /^<!-- mb:(\/?)([a-z]+)((?: [^>]*?)?) -->$/;
const ATTR_RE = /([a-z][a-z0-9_-]*)=("[^"]*"|\[[^\]]*\]|\{[^}]*\}|[^\s]+)/g;

function parseAttrs(bodyRaw) {
  const attrs = {};
  let m; ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(bodyRaw)) !== null) {
    let v = m[2];
    if (v[0] === '"' || v[0] === '[' || v[0] === '{') { try { v = JSON.parse(v); } catch { } }
    attrs[m[1]] = v;
  }
  return attrs;
}

function parseYaml(text) {
  // minimal: scalars, [a, b] lists, one nesting level, numbers/booleans
  const root = {}; const stack = [[0, root]];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.match(/^ */)[0].length;
    while (stack.length > 1 && stack[stack.length - 1][0] > indent) stack.pop();
    const parent = stack[stack.length - 1][1];
    const mm = line.match(/^ *([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!mm) continue;
    const [, key, rest] = mm;
    if (rest === '') { const obj = {}; parent[key] = obj; stack.push([indent + 2, obj]); }
    else if (rest.startsWith('[')) {
      parent[key] = rest.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      const v = rest.replace(/^['"]|['"]$/g, '');
      parent[key] = v === 'true' ? true : v === 'false' ? false : (v !== '' && !isNaN(Number(v)) ? Number(v) : v);
    }
  }
  return root;
}

function parse(src) {
  const lines = src.split(/\r?\n/);
  let i = 0;
  const doc = { frontmatter: {}, sections: [] };
  if (lines[0] === '---') {
    const fm = [];
    for (i = 1; i < lines.length && lines[i] !== '---'; i++) fm.push(lines[i]);
    i++; doc.frontmatter = parseYaml(fm.join('\n'));
  }

  // one md sink per context: section-level and per-col { children, buf }
  const newSink = () => ({ children: [], buf: [] });
  const flush = sink => { if (sink.buf.length) { sink.children.push({ type: 'md', lines: sink.buf }); sink.buf = []; } };

  let section = { attrs: {}, vars: [], children: [] };
  doc.sections.push(section);
  let sink = newSink();
  let mode = 'root';             // root | block | columns | col
  let block = null, columns = null, colSink = null;
  let fence = null;              // {char,len,dest} — dest: array lines accumulate into
  let expectVar = null;          // var awaiting its fence (blank lines between are legal)
  let varFence = null;           // {char,len,info,body,var} — consuming a var's payload fence

  for (; i < lines.length; i++) {
    const line = lines[i];

    // var fence consumption: everything until the closing fence is payload
    if (varFence) {
      const c = line.match(/^(`{3,}|~{3,})\s*$/);
      if (c && c[1][0] === varFence.char && c[1].length >= varFence.len) {
        varFence.var.value = varFence.info === 'json'
          ? JSON.parse(varFence.body.join('\n') || 'null')
          : varFence.body.join('\n');
        varFence = null;
      } else varFence.body.push(line);
      continue;
    }
    // a valueless var must meet its fence next
    if (expectVar) {
      if (line.trim() === '') continue;
      const fv = line.match(/^(`{3,}|~{3,})(.*)$/);
      if (fv && (fv[2].trim() === 'json' || fv[2].trim() === 'text')) {
        varFence = { char: fv[1][0], len: fv[1].length, info: fv[2].trim(), body: [], var: expectVar };
      }
      expectVar = null; // invalid binding: the validator reports it; parse on
      continue;
    }

    const fm = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      fence.dest.push(line); // fence lines stay in the md stream
      if (fm && fm[1][0] === fence.char && fm[1].length >= fence.len) fence = null;
      continue;
    }
    if (fm) {
      const dest = mode === 'block' ? block.body : sink.buf;
      dest.push(line);
      fence = { char: fm[1][0], len: fm[1].length, dest };
      continue;
    }

    const dm = line.match(DIRECTIVE_RE);
    if (dm) {
      const [, slash, kind, bodyRaw] = dm;
      if (slash) {
        if (kind === 'block') {
          mode = colSink ? 'col' : 'root';
          (colSink || sink).children.push({ type: 'block', attrs: block.attrs, body: block.body });
          block = null;
        } else {
          flush(colSink);
          columns.cols.push({ attrs: colSink.attrs, children: colSink.children });
          colSink = null; mode = 'root';
          section.children.push({ type: 'columns', attrs: columns.attrs, cols: columns.cols });
          columns = null;
        }
        continue;
      }
      const attrs = parseAttrs(bodyRaw);
      if (kind === 'section') { section.attrs = attrs; continue; }
      if (kind === 'col') {
        if (colSink) { flush(colSink); columns.cols.push({ attrs: colSink.attrs, children: colSink.children }); }
        colSink = { attrs, ...newSink() }; mode = 'col'; continue;
      }
      if (kind === 'columns') { flush(sink); columns = { attrs, cols: [] }; mode = 'columns'; continue; }
      if (kind === 'var') {
        flush(sink);
        const v = { name: attrs.name, value: attrs.value };
        section.vars.push(v);
        if (attrs.value === undefined) expectVar = v;
        continue;
      }
      if (kind === 'block') {
        flush(sink);
        block = { attrs, body: [] }; mode = 'block';
        continue;
      }
    }

    // ordinary HTML comment: preserved in source, invisible in rendering
    if (/^<!--.*-->$/.test(line.trim())) continue;

    if (mode === 'root' && /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flush(sink);
      section = { attrs: {}, vars: [], children: [] };
      doc.sections.push(section);
      continue;
    }
    if (mode === 'block') block.body.push(line);
    else if (mode === 'col') colSink.buf.push(line);
    else if (mode === 'root') sink.buf.push(line);
    // 'columns' before first col: blanks/comments only (validated)
  }
  flush(sink);
  return doc;
}

/* ------------------------------------------------------- markdown → html */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// output lives in <dir>/rendered/ — relative asset refs must climb one level
const src = s => /^(https?:|data:|#|\/)/.test(s) ? s : '../' + s;

function inline(s) {
  let rest = esc(s);
  const codes = [];
  rest = rest.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\x00${codes.length - 1}\x00`; });
  rest = rest
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, s2) => `<img src="${src(s2)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  rest = rest.replace(/\x00(\d+)\x00/g, (_, n) => `<code>${codes[+n]}</code>`);
  return rest;
}

function mdToHtml(lines) {
  const out = [];
  let para = [], list = null, quote = null, table = null, pre = null;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(it => `<li>${inline(it)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote) { out.push(`<blockquote>${mdToHtml(quote)}</blockquote>`); quote = null; } };
  const flushTable = () => {
    if (table && table.rows.length) {
      const [head, ...body] = table.rows;
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    }
    table = null;
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    if (pre) {
      if (new RegExp('^' + pre.char + '{3,}\\s*$').test(line)) { out.push(`<pre><code>${esc(pre.body.join('\n'))}</code></pre>`); pre = null; }
      else pre.body.push(line);
      continue;
    }
    if (/^(`{3,}|~{3,})/.test(line)) { flushAll(); pre = { char: line[0], body: [] }; continue; }

    if (line.trim() === '') { flushAll(); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushAll(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

    if (line.startsWith('>')) { flushPara(); flushList(); flushTable(); (quote = quote || []).push(line.replace(/^>\s?/, '')); continue; }

    const t = line.match(/^\|(.+)\|\s*$/);
    if (t) {
      flushPara(); flushList(); flushQuote();
      const cells = t[1].split('|').map(c => c.trim());
      if (cells.every(c => /^:?-+:?$/.test(c))) continue;
      (table = table || { rows: [] }).rows.push(cells);
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.*)$/);
    if (ul) { flushPara(); flushQuote(); flushTable(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(ul[1]); continue; }

    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) { flushPara(); flushQuote(); flushTable(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(ol[1]); continue; }

    flushList(); flushQuote(); flushTable();
    para.push(line.trim());
  }
  if (pre && pre.body.length) out.push(`<pre><code>${esc(pre.body.join('\n'))}</code></pre>`);
  flushAll();
  return out.join('\n');
}

/* ------------------------------------------------------------- profiles */

const PRESET_BLOCK = { lead: 'lead', note: 'callout note', warning: 'callout warning', card: 'card', cta: 'cta', 'page-break': 'page-break' };
const MEDIA_EXT = /\.(mp4|webm|mov|mp3|wav|ogg|m4a|pdf|zip)$/i;

function classifyBlock(block) {
  const body = block.body.filter(l => l.trim() !== '');
  if (!body.length) return { kind: 'empty' };
  const first = body[0];
  const img = first.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
  if (img) return { kind: 'image', src: img[1], caption: body.slice(1) };
  if (/^[-*+]\s+!\[/.test(first)) {
    const items = [];
    for (const l of body) { const m2 = l.match(/^[-*+]\s+!\[([^\]]*)\]\(([^)]+)\)$/); if (m2) items.push({ alt: m2[1], src: m2[2] }); }
    const listLines = body.filter(l => /^[-*+]\s/.test(l)).length;
    if (items.length && items.length === listLines)
      return { kind: 'image-list', items, caption: body.slice(items.length) };
  }
  const link = first.match(/^\[!\[[^\]]*\]\([^)]+\)\]\(([^)]+)\)$/) || first.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link && MEDIA_EXT.test(link[1] || link[2] || '')) return { kind: 'media', caption: body.slice(1) };
  return { kind: 'text' };
}

function blockHtml(block) {
  const p = block.attrs.preset;
  if (p === 'page-break') return `<div class="page-break" data-preset="page-break"></div>`;
  const cls = ['block', PRESET_BLOCK[p] || ''].filter(Boolean).join(' ');
  const media = classifyBlock(block);
  if (media.kind === 'image' || media.kind === 'image-list') {
    const f = block.attrs.focal || {};
    const imgs = media.kind === 'image'
      ? `<img src="${src(media.src)}" alt="" style="object-position:${(f.x ?? .5) * 100}% ${(f.y ?? .5) * 100}%">`
      : `<div class="gallery-grid">${media.items.map(it => `<figure><img src="${src(it.src)}" alt="${esc(it.alt)}"></figure>`).join('')}</div>`;
    const cap = media.caption.length ? `<figcaption>${mdToHtml(media.caption)}</figcaption>` : '';
    return `<figure class="${cls} ${p === 'gallery' ? 'gallery' : 'hero'}" data-preset="${p || ''}">${imgs}${cap}</figure>`;
  }
  if (media.kind === 'media') return `<div class="${cls}" data-preset="${p || ''}">${media.caption.length ? mdToHtml(media.caption) : ''}</div>`;
  return `<div class="${cls}" data-preset="${p || ''}">${mdToHtml(block.body)}</div>`;
}

function childrenHtml(children) {
  return children.map(c => {
    if (c.type === 'md') return `<div class="md">${mdToHtml(c.lines)}</div>`;
    if (c.type === 'block') return blockHtml(c);
    if (c.type === 'columns') {
      const w = (c.attrs.weights && c.attrs.weights.length === c.cols.length)
        ? c.attrs.weights
        : c.cols.map(() => 1);
      const tmpl = w.map(x => `${x}fr`).join(' ');
      const cols = c.cols.map(col =>
        `<div class="col ${col.attrs.preset === 'card' ? 'card' : ''}">${childrenHtml(col.children)}</div>`).join('');
      return `<div class="columns" data-preset="${c.attrs.preset || ''}" style="grid-template-columns:${tmpl}">${cols}</div>`;
    }
    return '';
  }).join('\n');
}

const CSS_BASE = `
:root { --ink:#1c2733; --dim:#5b6b7a; --bg:#faf9f7; --card:#ffffff; --line:#e3e0da; --accent:#0e6b63; --warn:#a2541f;
  --dark-ink:#e9eef2; --dark-bg:#17222b; --space:1.4rem; --radius:10px; }
* { box-sizing:border-box; }
body { margin:0; font:16px/1.65 Georgia,'Iowan Old Style','Times New Roman',serif; color:var(--ink); background:var(--bg); }
h1,h2,h3,h4 { font-family:'Segoe UI',system-ui,sans-serif; line-height:1.25; margin:1.4em 0 .5em; }
h1 { font-size:2rem; } h2 { font-size:1.45rem; } h3 { font-size:1.15rem; }
p { margin:.6em 0; } img { max-width:100%; display:block; border-radius:var(--radius); }
code { font:0.9em/1.4 'Cascadia Code',Consolas,monospace; background:#efece6; padding:.1em .35em; border-radius:4px; }
pre { background:#211e19; color:#e8e3d8; padding:1em 1.2em; border-radius:var(--radius); overflow:auto; }
pre code { background:none; color:inherit; }
blockquote { margin:.8em 0; padding:.4em 1.1em; border-left:3px solid var(--accent); color:var(--dim); font-style:italic; }
table { border-collapse:collapse; margin:1em 0; width:100%; }
th,td { border:1px solid var(--line); padding:.45em .7em; text-align:left; font-family:'Segoe UI',system-ui,sans-serif; font-size:.92em; }
th { background:#f0eee9; }
a { color:var(--accent); }
.md > :first-child, .block > :first-child, .col > :first-child { margin-top:0; }
.md > :last-child, .block > :last-child, .col > :last-child { margin-bottom:0; }
.block.lead { font-size:1.2em; color:#33414e; }
.block.callout { border-left:4px solid var(--accent); background:#eef4f3; padding:.9em 1.2em; border-radius:0 var(--radius) var(--radius) 0; }
.block.callout.warning { border-left-color:var(--warn); background:#f7efe6; }
.block.card, .col.card { background:var(--card); border:1px solid var(--line); padding:1.1em 1.3em; border-radius:var(--radius); box-shadow:0 1px 4px rgba(20,30,40,.05); }
.block.cta { text-align:center; font-size:1.15em; padding:1em; }
figure.hero { margin:1em 0; }
figure.hero img { width:100%; max-height:52vh; object-fit:cover; }
figure.hero figcaption { color:var(--dim); font-size:.92em; padding:.5em .2em 0; }
.gallery-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:.7em; }
section.region { padding:calc(var(--space)*2) max(6vw, calc((100vw - 980px)/2)); }
section.region.dark { background:var(--dark-bg); color:var(--dark-ink); }
section.region.dark .block.card, section.region.dark .col.card { background:#20303b; border-color:#2c3f4c; }
.columns { display:grid; gap:var(--space); align-items:start; }
.columns .col { min-width:0; }
@media (max-width:760px) { .columns { grid-template-columns:1fr !important; } }
`;

const CSS_PAGE = `
header.doc { padding:3rem max(6vw, calc((100vw - 980px)/2)) 1rem; }
header.doc .meta { color:var(--dim); font-family:'Segoe UI',system-ui,sans-serif; font-size:.9em; }
header.doc .meta span { background:#efece6; border-radius:99px; padding:.15em .8em; margin-right:.4em; display:inline-block; }
`;

const CSS_PRINT = `
@page { size:A4; margin:0; }
body { background:#eceae6; font-size:11.5pt; }
.sheet { background:#fff; width:210mm; min-height:297mm; margin:8mm auto; padding:18mm 16mm; box-shadow:0 2px 10px rgba(0,0,0,.12); }
.sheet.dochead { padding-bottom:0; }
@media print {
  body { background:#fff; }
  .sheet { margin:0; box-shadow:none; width:auto; min-height:auto; break-after:page; }
  .sheet:last-child { break-after:auto; }
  .page-break { break-after:page; height:0; border:none; margin:0; }
}
section.region { padding:0; }
.page-break { height:0; border-top:2px dashed #d8d4cc; margin:1.5em 0; }
`;

const CSS_DECK = `
body.deck { background:#0d1216; overflow:hidden; }
#stage { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; }
#slideWrap { width:1280px; height:720px; position:relative; transform-origin:center center; }
.slide { position:absolute; inset:0; display:none; padding:60px 76px; background:var(--bg); color:var(--ink); border-radius:4px; overflow:hidden; }
.slide.active { display:block; }
.slide.dark { background:var(--dark-bg); color:var(--dark-ink); }
.slide h1 { font-size:2.8rem; margin-top:.2em; }
.slide .block.lead { font-size:1.5em; }
.slide figure.hero img { max-height:400px; }
.slide .md:first-child h1 { margin-top:.35em; }
#bar { position:fixed; left:0; bottom:0; height:4px; background:var(--accent); width:0; transition:width .2s; }
#count { position:fixed; right:16px; bottom:10px; color:#8fa1ae; font:13px 'Segoe UI',sans-serif; }
`;

const DECK_JS = `
const slides=[...document.querySelectorAll('.slide')];let i=0;
function show(n){slides[i]&&slides[i].classList.remove('active');i=(n+slides.length)%slides.length;slides[i].classList.add('active');
document.getElementById('bar').style.width=((i+1)/slides.length*100)+'%';
document.getElementById('count').textContent=(i+1)+' / '+slides.length;}
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720);document.getElementById('slideWrap').style.transform='scale('+s+')';}
addEventListener('resize',fit);fit();show(0);
addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown','Enter'].includes(e.key)){e.preventDefault();show(i+1);}
if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();show(i-1);}
if(e.key==='Home')show(0);if(e.key==='End')show(slides.length-1);});
addEventListener('click',e=>{if(e.clientX>innerWidth/2)show(i+1);else show(i-1);});
`;

function shell(title, css, body, js) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS_BASE}${css}</style></head>
<body${js ? ' class="deck"' : ''}>${body}${js ? `<script>${js}</script>` : ''}</body></html>`;
}

function render(doc, profile, name) {
  const fm = doc.frontmatter; const title = fm.title || name;
  if (profile === 'page') {
    const tags = (fm.tags || []).map(t => `<span>${esc(String(t))}</span>`).join('');
    const header = `<header class="doc"><h1>${esc(title)}</h1>${tags ? `<p class="meta">${tags}</p>` : ''}</header>`;
    const body = doc.sections.map(s =>
      `<section class="region ${s.attrs.preset || ''}"${s.attrs.id ? ` id="${esc(s.attrs.id)}"` : ''} data-preset="${s.attrs.preset || ''}">${childrenHtml(s.children)}</section>`).join('\n');
    return shell(title, CSS_PAGE, header + body);
  }
  if (profile === 'print') {
    const meta = [fm.version ? 'v' + fm.version : '', fm.updated || fm.date || '', fm.audience].filter(Boolean).join(' · ');
    const head = `<div class="sheet dochead"><h1>${esc(title)}</h1>${meta ? `<p class="meta">${esc(meta)}</p>` : ''}<hr></div>`;
    const body = doc.sections.map(s =>
      `<div class="sheet"><section class="region ${s.attrs.preset || ''}" data-preset="${s.attrs.preset || ''}">${childrenHtml(s.children)}</section></div>`).join('\n');
    return shell(title + ' — print', CSS_PRINT, head + body);
  }
  if (profile === 'deck') {
    const body = doc.sections.map(s => {
      const secs = s.vars.find(v => v.name === 'seconds');
      return `<div class="slide ${s.attrs.preset === 'dark' ? 'dark' : ''}"${secs ? ` data-seconds="${secs.value}"` : ''}>${childrenHtml(s.children)}</div>`;
    }).join('\n');
    return shell(title, CSS_DECK, `<div id="stage"><div id="slideWrap">${body}</div></div><div id="bar"></div><div id="count"></div>`, DECK_JS);
  }
  throw new Error('unknown profile ' + profile);
}

/* --------------------------------------------------------------- main */

const [file, profileArg] = process.argv.slice(2);
if (!file) { console.error('usage: node tools/render.js <file.md> [page|print|deck|all]'); process.exit(2); }
const profiles = profileArg && profileArg !== 'all' ? [profileArg] : ['page', 'print', 'deck'];
const source = fs.readFileSync(file, 'utf8');
const doc = parse(source);
const base = path.basename(file, '.md');
const outDir = path.join(path.dirname(file), 'rendered');
fs.mkdirSync(outDir, { recursive: true });
for (const p of profiles) {
  const out = path.join(outDir, `${base}.${p}.html`);
  fs.writeFileSync(out, render(doc, p, base));
  console.log(`${out} (${doc.sections.length} sections)`);
}
