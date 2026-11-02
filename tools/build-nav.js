// Writes the main menu into every page, so all pages share one menu.
// Edit the MENU list below, then run: node tools/build-nav.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const MENU = [
  { label: 'Home', href: 'index.html' },
  { label: 'Schedule & Scores', id: 'nav-games', links: [
    { label: 'Schedule', href: 'schedule.html' },
    { label: 'Scores', href: 'scores.html' },
  ] },
  { label: 'Team', id: 'nav-team', links: [
    { label: 'Roster', href: 'roster.html' },
    { label: 'Coaches', href: 'coaches.html' },
    { label: 'Stats', href: 'stats.html' },
    { label: 'Quizzes', href: 'quiz.html' },
  ] },
  { label: 'Program', id: 'nav-program', links: [
    { label: 'News', href: 'news.html' },
    { label: 'Records', href: 'records.html' },
    { label: 'Alumni', href: 'alumni.html' },
    { label: 'Player Tracker', href: 'tracker.html' },
    { label: 'Gallery', href: 'gallery.html' },
  ] },
  { label: 'Shop', href: 'https://granitehillsbaseball.itemorder.com/shop/home/', external: true },
  { label: 'Contact', href: 'contact.html' },
  { label: 'Sign Up', href: 'new-player.html', signup: true },
];

const esc = (text) => text.replace(/&/g, '&amp;');

function link(item, page, indent) {
  const classes = [];
  if (item.signup) classes.push('nav-signup');
  if (item.href === page) classes.push('active');
  const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
  const ext = item.external ? ' target="_blank" rel="noopener"' : '';
  const li = item.signup ? '<li class="nav-signup-item">' : '<li>';
  return `${indent}${li}<a href="${item.href}"${cls}${ext}>${esc(item.label)}</a></li>`;
}

function menu(page) {
  const lines = ['      <nav class="main-nav" id="mainNav">', '        <ul>'];
  for (const item of MENU) {
    if (!item.links) {
      lines.push(link(item, page, '          '));
      continue;
    }
    const current = item.links.some((sub) => sub.href === page);
    lines.push('          <li class="nav-group">');
    lines.push(`            <button type="button" class="nav-group-toggle${current ? ' active' : ''}" aria-expanded="false" aria-controls="${item.id}">${esc(item.label)}</button>`);
    lines.push(`            <ul class="nav-sub" id="${item.id}">`);
    for (const sub of item.links) lines.push(link(sub, page, '              '));
    lines.push('            </ul>');
    lines.push('          </li>');
  }
  lines.push('        </ul>', '      </nav>');
  return lines.join('\n');
}

const BURGER = '<button class="hamburger" id="hamburger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mainNav">';

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, 'utf8');
  const eol = before.includes('\r\n') ? '\r\n' : '\n';
  const nav = /[ \t]*<nav class="main-nav" id="mainNav">[\s\S]*?<\/nav>/;
  if (!nav.test(before)) {
    console.log('no menu found: ' + file);
    continue;
  }
  const after = before
    .replace(nav, () => menu(file).replace(/\n/g, eol))
    .replace(/<button class="hamburger" id="hamburger"[^>]*>/, BURGER);
  fs.writeFileSync(full, after);
  console.log('menu written: ' + file);
}
