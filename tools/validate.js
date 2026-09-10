#!/usr/bin/env node
/*
MD-Blocks structural validator — DEMONSTRATION ARTIFACT. Zero-dependency, line-level.
Validates demo documents against md-blocks-spec.md v1.

It exists to keep the examples honest and to show that the spec's rules (§7) are checkable.
It is NOT the reference parser: no CommonMark tokenization, no tree build, no §6 (editor
contract) checks. It knows fences, thematic breaks, the directive grammar and placement
rules, columns/var arity and binding, duplicate ids and var names, and JSON attribute values.
Directives inside list items or blockquotes are caught only when indented — a known
approximation. When this tool and the spec disagree, the spec wins and this gets fixed.

Usage: node tools/validate.js <file.md> [more.md ...]
Exit:  0 = clean (warnings allowed), 1 = errors.
*/

const fs = require('fs');
const path = require('path');

const STRUCTURAL = new Set(['section', 'block', 'columns', 'col', 'var']);
const CLOSEABLE = new Set(['block', 'columns']);
const ATTRS = {
  section:  new Set(['id', 'label', 'preset']),
  block:    new Set(['id', 'label', 'preset', 'kind', 'focal']),
  columns:  new Set(['id', 'label', 'preset', 'weights']),
  col:      new Set(['id', 'label', 'preset']),
  var:      new Set(['name', 'value']),
};
const KINDS = new Set(['image', 'video', 'audio', 'file']);
const DIRECTIVE_RE = /^<!-- mb:(\/?)([a-z]+)((?: [^>]*?)?) -->$/;
const ATTR_RE = /([a-z][a-z0-9_-]*)=("[^"]*"|\[[^\]]*\]|\{[^}]*\}|[^\s]+)/g;

function validate(file) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  const errors = [], warnings = [];
  const err = (n, msg) => errors.push(`${file}:${n + 1}: ${msg}`);
  const warn = (n, msg) => warnings.push(`${file}:${n + 1}: ${msg}`);

  // Frontmatter: --- on line 1, closed by the next --- line.
  let i = 0;
  if (lines[0] !== '---') err(0, 'no frontmatter at line 1');
  else {
    for (i = 1; i < lines.length; i++) {
      if (lines[i] === '---') break;
      if (lines[i] === '') continue;
    }
    if (i >= lines.length) { err(0, 'frontmatter not closed'); i = lines.length; }
    else i++; // resume after the closing --- line
  }

  let mode = 'root';            // root | block | columns
  let sawCol = false;           // inside columns: any col marker seen yet
  let openBlockLine = 0, openColumnsLine = 0, colCount = 0, columnsWeights = null, columnsLine = 0;
  let sectionNo = 1, sectionHasSection = false;
  const ids = new Map();        // id -> line
  const varNames = new Map();   // name (per section) -> line
  let directiveCount = 0;
  let fence = null;             // {char, len} while inside a fence
  let expectVarFence = null;    // {line, name} — var without value= must meet its fence next

  for (; i < lines.length; i++) {
    const line = lines[i];

    // Fence handling
    const fm = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (fm && fm[1][0] === fence.char && fm[1].length >= fence.len && fm[2].trim() === '') fence = null;
      continue;
    }
    if (fm) {
      if (expectVarFence) {
        const info = fm[2].trim();
        if (info !== 'json' && info !== 'text') err(i, `var "${expectVarFence.name}" fence must be \`\`\`json or \`\`\`text, got "${info}"`);
        else if (info === 'json') {
          // collect fence body and JSON.parse it
          let body = [], j = i + 1;
          for (; j < lines.length; j++) {
            const c = lines[j].match(/^ {0,3}(`{3,}|~{3,})/);
            if (c) break;
            body.push(lines[i + 1 + (j - (i + 1))]);
          }
          const text = lines.slice(i + 1, j).join('\n');
          try { JSON.parse(text); }
          catch (e) { err(i, `var "${expectVarFence.name}" JSON payload does not parse: ${e.message}`); }
        }
        expectVarFence = null;
        fence = { char: fm[1][0], len: fm[1].length };
        continue;
      }
      fence = { char: fm[1][0], len: fm[1].length };
      continue;
    }

    // Directive recognition (exact line, column 0)
    const indented = /^ +<!-- mb:/.test(line);
    if (indented) { err(i, 'directive must start at column 0'); continue; }
    const dm = line.match(DIRECTIVE_RE);
    if (dm) {
      const [, slash, kind, bodyRaw] = dm;
      if (!STRUCTURAL.has(kind)) { err(i, `unknown directive kind "${kind}"`); continue; }
      directiveCount++;

      if (slash) {
        if (!CLOSEABLE.has(kind)) { err(i, `/${kind} is not a closing marker`); continue; }
        if (bodyRaw.trim() !== '') { err(i, `/${kind} takes no attributes`); continue; }
        if (kind === 'block') {
          if (mode !== 'block') { err(i, `stray /block (no open block)`); continue; }
          mode = 'root';
        } else { // columns
          if (mode !== 'columns') { err(i, `stray /columns (no open columns)`); continue; }
          if (colCount < 2) err(openColumnsLine, `columns has ${colCount} col marker(s), minimum 2`);
          if (columnsWeights !== null && columnsWeights.length !== colCount)
            err(openColumnsLine, `weights has ${columnsWeights.length} entries but ${colCount} cols`);
          mode = 'root';
        }
        continue;
      }

      // opening/marker directives — placement
      if (kind === 'col') {
        if (mode !== 'columns') { err(i, 'col outside columns'); continue; }
        sawCol = true; colCount++;
      } else if (kind === 'block') {
        if (mode === 'block') { err(i, `nested block (block opened at line ${openBlockLine + 1})`); continue; }
        if (mode === 'columns' && !sawCol) { err(i, 'block before first col inside columns'); continue; }
      } else if (kind === 'columns') {
        if (mode !== 'root') { err(i, `nested columns (inside ${mode})`); continue; }
      } else if (kind === 'section') {
        if (mode !== 'root') { err(i, `mb:section inside ${mode}`); continue; }
        if (sectionHasSection) { err(i, `second mb:section in section ${sectionNo}`); continue; }
        sectionHasSection = true;
      } else if (kind === 'var') {
        if (mode !== 'root') { err(i, `var inside ${mode} — vars are section-level only`); continue; }
      }

      // attributes
      const attrs = {};
      let m;
      ATTR_RE.lastIndex = 0;
      while ((m = ATTR_RE.exec(bodyRaw)) !== null) {
        const key = m[1], raw = m[2];
        if (Object.prototype.hasOwnProperty.call(attrs, key)) { err(i, `duplicate attribute "${key}"`); continue; }
        if (/[<>]/.test(raw)) { err(i, `raw < or > in value of "${key}" — use JSON escapes`); continue; }
        let val = raw;
        if (raw[0] === '"' || raw[0] === '[' || raw[0] === '{') {
          try { val = JSON.parse(raw); }
          catch (e) { err(i, `attribute "${key}" value is not valid JSON: ${raw}`); continue; }
        }
        attrs[key] = val;
      }
      // stray tokens that are not key=value (e.g. "mb:block note")
      const consumed = bodyRaw.replace(ATTR_RE, '').trim();
      if (consumed !== '') err(i, `unrecognized attribute text: "${consumed}"`);
      for (const key of Object.keys(attrs)) {
        if (!ATTRS[kind].has(key)) err(i, `unknown attribute "${key}" on ${kind}`);
      }

      if (kind === 'block') {
        if (attrs.kind !== undefined && !KINDS.has(attrs.kind))
          err(i, `kind "${attrs.kind}" not in image|video|audio|file`);
        if (attrs.focal !== undefined) {
          const f = attrs.focal;
          if (typeof f !== 'object' || f === null || typeof f.x !== 'number' || typeof f.y !== 'number')
            err(i, 'focal must be {"x":0..1,"y":0..1}');
          else if (f.x < 0 || f.x > 1 || f.y < 0 || f.y > 1) warn(i, 'focal value outside 0..1');
        }
        mode = 'block'; openBlockLine = i;
      } else if (kind === 'columns') {
        mode = 'columns'; sawCol = false; colCount = 0;
        openColumnsLine = i; columnsLine = i;
        columnsWeights = Object.prototype.hasOwnProperty.call(attrs, 'weights') ? attrs.weights : null;
        if (columnsWeights !== null) {
          if (!Array.isArray(columnsWeights) || columnsWeights.some(w => typeof w !== 'number' || w <= 0))
            err(i, 'weights must be a JSON array of positive numbers');
        }
      } else if (kind === 'var') {
        if (attrs.name === undefined) { err(i, 'var requires name='); continue; }
        const scoped = `${sectionNo}:${attrs.name}`;
        if (varNames.has(scoped)) err(i, `duplicate var name "${attrs.name}" in section ${sectionNo} (first at line ${varNames.get(scoped) + 1})`);
        else varNames.set(scoped, i);
        if (attrs.value === undefined) expectVarFence = { line: i, name: attrs.name };
      }
      if (attrs.id !== undefined) {
        if (ids.has(attrs.id)) err(i, `duplicate id "${attrs.id}" (first at line ${ids.get(attrs.id) + 1})`);
        else ids.set(attrs.id, i);
      }
      continue;
    }

    // Plain line
    if (expectVarFence && line.trim() !== '') {
      err(i, `content between var "${expectVarFence.name}" (line ${expectVarFence.line + 1}) and its fence — the pair is one lexical unit`);
      expectVarFence = null;
    }

    // Thematic break = section separator, but only at root level (inside block/columns it is content)
    if (mode === 'root' && /^ {0,0}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      // setext trap: a paragraph line DIRECTLY above (no blank line) makes this an H2, not a rule
      const prev = i > 0 ? lines[i - 1] : null;
      if (prev !== null && prev.trim() !== '' && !/^(#{1,6} |>| |- |\* |\+ |\||\d+\. |```|~~~|<!--)/.test(prev)) {
        warn(i, `--- under a paragraph line is a setext H2, not a section separator (preceding line ${prev.trim().slice(0, 40)})`);
        continue;
      }
      sectionNo++; sectionHasSection = false;
      continue;
    }
    // columns before first col: only blanks and ordinary comments
    if (mode === 'columns' && !sawCol && line.trim() !== '' && !/^<!--(?! mb:)/.test(line.trim()))
      err(i, `content inside columns before the first col marker`);
  }

  if (mode === 'block') err(lines.length - 1, `unclosed block (opened at line ${openBlockLine + 1})`);
  if (mode === 'columns') {
    err(lines.length - 1, `unclosed columns (opened at line ${openColumnsLine + 1})`);
    if (colCount < 2) err(openColumnsLine, `columns has ${colCount} col marker(s), minimum 2`);
  }
  if (expectVarFence) err(lines.length - 1, `var "${expectVarFence.name}" (line ${expectVarFence.line + 1}) has no value= and no following fence`);
  if (directiveCount === 0) console.log(`${file}: informational — frontmatter present but zero directives ("no structure")`);

  for (const w of warnings) console.log(`warning  ${w}`);
  for (const e of errors) console.log(`error    ${e}`);
  console.log(`${file}: ${errors.length} error(s), ${warnings.length} warning(s), ${directiveCount} directives, ${sectionNo} section(s)`);
  return errors.length === 0;
}

const files = process.argv.slice(2);
if (files.length === 0) { console.error('usage: node tools/validate.js <file.md> [more.md ...]'); process.exit(2); }
let ok = true;
for (const f of files) if (!validate(f)) ok = false;
process.exit(ok ? 0 : 1);
