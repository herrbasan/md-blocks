"""
MD-Blocks smoke checker (2026-09-10) — the mechanical validator used in authoring-test round 2.

Checks, against spec v1: frontmatter presence/closure, directive grammar and placement,
block/columns balance, col/weights arity, duplicate ids/keys/var-names, var fence binding,
JSON payload validity (weights, focal, var fences).

This is NOT the reference parser — it is the archived test tooling. It validates; it does not
build a tree, chunk implicit runs, or check the editor contract (spec §6). Kept so future work
can see exactly what the round-2 results were measured with.

Usage:  python check.py <file.md> [more.md ...]
Requires: markdown-it-py
"""

from pathlib import Path
from markdown_it import MarkdownIt
import json, re, sys

parser = MarkdownIt('commonmark').enable(['table', 'strikethrough'])

def check(path):
    src = Path(path).read_text(encoding='utf-8')
    lines = src.splitlines()
    errors, warnings = [], []
    if lines[0].strip() != '---':
        errors.append('no frontmatter at line 1')
    else:
        try:
            next(i for i in range(1, len(lines)) if lines[i].strip() == '---')
        except StopIteration:
            errors.append('frontmatter not closed')
    tokens = parser.parse(src)
    stack, ids, varnames, section_no = [], set(), {}, 1
    for i, t in enumerate(tokens):
        if t.type == 'html_block' and t.content.lstrip().startswith('<!-- bm:'):
            m = re.fullmatch(r'<!-- bm:([a-z/]+)([^>]*?)-->\s*', t.content.strip(), re.S)
            if not m:
                errors.append('malformed directive line %s' % t.map[0]); continue
            kind, body = m.groups()
            pairs = re.findall(r'([a-z][a-z0-9_-]*)=("(?:[^"\\]|\\.)*"|\[.*?\]|\{.*?\}|\S+)', body)
            attrs = dict(pairs)
            keys = re.findall(r'([a-z][a-z0-9_-]*)=', body)
            if len(keys) != len(set(keys)):
                errors.append('duplicate key line %s' % t.map[0])
            if t.level != 0:
                errors.append('%s not at root, line %s' % (kind, t.map[0]))
            for k in ('weights', 'focal'):
                if k in attrs:
                    try: json.loads(attrs[k])
                    except Exception: errors.append('invalid JSON in %s line %s: %s' % (k, t.map[0], attrs[k]))
            if 'id' in attrs:
                v = attrs['id'].strip('"')
                if v in ids: errors.append('duplicate id ' + v)
                ids.add(v)
            if kind == 'section':
                if stack: errors.append('section inside container line %s' % t.map[0])
            elif kind == 'block':
                if stack and stack[-1][0] != 'col': errors.append('block nesting line %s' % t.map[0])
                stack.append(['block', attrs])
            elif kind == '/block':
                if not (stack and stack[-1][0] == 'block'): errors.append('stray /block line %s' % t.map[0])
                else: stack.pop()
                if attrs: errors.append('/block with attrs line %s' % t.map[0])
            elif kind == 'columns':
                if stack: errors.append('columns inside container line %s' % t.map[0])
                stack.append(['columns', attrs, 0])
            elif kind == 'col':
                if not (stack and stack[-1][0] == 'columns'): errors.append('col outside columns line %s' % t.map[0])
                else: stack[-1][2] += 1
            elif kind == '/columns':
                if not (stack and stack[-1][0] == 'columns'): errors.append('stray /columns line %s' % t.map[0]); continue
                top = stack.pop()
                if top[2] < 2: errors.append('columns with %d cols line %s' % (top[2], t.map[0]))
                w = top[1].get('weights')
                if w:
                    try:
                        if len(json.loads(w)) != top[2]: errors.append('weights != col count line %s' % t.map[0])
                    except Exception: pass
            elif kind == 'var':
                if stack: errors.append('var inside container line %s' % t.map[0])
                name = attrs.get('name', '').strip('"')
                if not name: errors.append('var without name line %s' % t.map[0])
                if name in varnames.get(section_no, set()): errors.append('duplicate var %s in section %d' % (name, section_no))
                varnames.setdefault(section_no, set()).add(name)
                if 'value' not in attrs:
                    j = i + 1
                    ok = (j < len(tokens)
                          and all(not g.strip() for g in lines[t.map[1]:tokens[j].map[0]])
                          and tokens[j].type == 'fence' and tokens[j].info in ('json', 'text'))
                    if not ok:
                        errors.append('var without value/fence line %s' % t.map[0])
                    elif tokens[j].info == 'json':
                        try: json.loads(tokens[j].content)
                        except Exception: errors.append('var fence invalid JSON line %s' % tokens[j].map[0])
            else:
                errors.append('unknown kind %s line %s' % (kind, t.map[0]))
        elif t.type == 'hr' and t.level == 0 and not stack:
            section_no += 1
    if stack:
        errors.append('unclosed: %s' % [s[0] for s in stack])
    return section_no, errors, warnings

if __name__ == '__main__':
    for arg in sys.argv[1:]:
        sections, errors, warnings = check(arg)
        print('%s | sections: %d | ERRORS: %d | WARNINGS: %d' % (arg, sections, len(errors), len(warnings)))
        for e in errors: print('  E:', e)
        for w in warnings: print('  W:', w)
