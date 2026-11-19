// gitlab-adr: Architecture Decision Records kept in a GitLab repository, in English and French, with GC Design System.
// A proposal is an open merge request whose title starts with titlePrefix (e.g. "[RFC]"), and every file it changes is
// part of it. Markdown files are shown; NNNN-slug-en.md and NNNN-slug-fr.md are one decision in two languages. The
// default branch holds accepted decisions under `folder`. Members vote 👍/👎 on the merge request and comment on the
// whole proposal, on a file or on a paragraph (GitLab diff threads); the chair (anyone GitLab lets merge) accepts or
// rejects. No backend: OAuth PKCE in the browser, then GitLab's CORS-enabled APIs.
// Settings: config.json next to index.html, set at deploy time. Routes: #/ (list), #/chair (chair view), and the file's
// path for one file, e.g. #/adr/0007-use-postgres-en.md. The terms of reference are 0000-terms-of-reference, so
// changing them goes through the same vote.

const el = document.getElementById('adr');
const c = await fetch('config.json').then((r) => r.json()).catch(() => ({}));
const gitlab = (c.gitlab || 'https://gitlab.com').replace(/\/+$/, '');
const folder = (c.folder || 'adr').replace(/^\/+|\/+$/g, '');
const prefix = c.titlePrefix ?? ''; // empty: every open merge request is a proposal
const TERMS = `${folder}/0000-terms-of-reference`;
const redirectUri = location.origin + location.pathname; // register this exact URL on the GitLab application
const s = sessionStorage;

// Interface text. French follows Canadian typography: no space before ? ; ! and a non-breaking space before :.
const LABELS = {
  en: {
    title: 'Architecture decisions', terms: 'Terms of reference', noConfig: 'Set project and clientId in config.json.', signIn: 'Sign in with GitLab', loading: 'Loading…', error: 'GitLab error:',
    intro: 'Proposed and accepted architecture decision records. Committee members vote and comment on proposals; the chair accepts or rejects them.',
    noAccess: "You don't have access to", proposed: 'Proposed', accepted: 'Accepted', statusProposed: 'Proposed',
    statusAccepted: 'Accepted', none: 'None yet.', by: 'by', acceptedOn: 'Accepted', yourVote: 'Your vote:',
    for: 'For', against: 'Against', all: 'All decisions', chair: 'Chair view', notFound: 'This file was not found.',
    chairIntro: 'Votes on open proposals. Accepting merges the merge request and records the tally in GitLab; rejecting closes it.',
    mr: 'Merge request', missingTitle: 'Translation missing',
    missing: 'This file is not available in English yet. It is shown in French.',
    files: 'Files in this proposal', removed: 'removed', commentPara: 'Comment on this paragraph',
    fileComments: 'Comments on this file', wholeDiscussion: 'Discussion on the whole proposal', line: 'Line',
    earlier: 'On an earlier version, line',
    vote: 'Vote', noComments: 'No comments yet.', reply: 'Reply', replyAs: 'Reply as',
    commentAs: 'Comment as', yourReply: 'Your reply', yourComment: 'Your comment', onBehalf: 'On behalf of',
    myself: 'Myself', onBehalfHint: 'Chair only: record a comment a member made at a meeting.',
    proposal: 'Proposal', notVoted: 'Not yet voted', translations: 'Missing translation', mergeStatus: 'Merge status',
    actions: 'Actions', ready: 'Ready', blocked: 'Blocked:', needsBoth: 'Needs both languages', accept: 'Accept',
    reject: 'Reject', confirmAccept: 'Accept this decision? This merges the merge request.',
    confirmReject: 'Reject this proposal? This closes the merge request.',
  },
  fr: {
    title: "Décisions d'architecture", terms: 'Cadre de référence', noConfig: 'Indiquez project et clientId dans config.json.', signIn: 'Se connecter avec GitLab', loading: 'Chargement…', error: 'Erreur GitLab :',
    intro: "Dossiers de décisions d'architecture proposés et acceptés. Les membres du comité votent et commentent les propositions; la présidence les accepte ou les rejette.",
    noAccess: "Vous n'avez pas accès à", proposed: 'Proposées', accepted: 'Acceptées', statusProposed: 'Proposée',
    statusAccepted: 'Acceptée', none: 'Aucune pour le moment.', by: 'par', acceptedOn: 'Acceptée le',
    yourVote: 'Votre vote :', for: 'Pour', against: 'Contre', all: 'Toutes les décisions', chair: 'Vue de la présidence',
    notFound: 'Ce fichier est introuvable.',
    chairIntro: 'Votes sur les propositions ouvertes. Accepter fusionne la demande de fusion et consigne le décompte dans GitLab; rejeter la ferme.',
    mr: 'Demande de fusion', missingTitle: 'Traduction manquante',
    missing: "Ce fichier n'est pas encore disponible en français. Il est affiché en anglais.",
    files: 'Fichiers de cette proposition', removed: 'supprimé', commentPara: 'Commenter ce paragraphe',
    fileComments: 'Commentaires sur ce fichier', wholeDiscussion: "Discussion sur l'ensemble de la proposition",
    line: 'Ligne', earlier: 'Sur une version antérieure, ligne',
    vote: 'Vote', noComments: 'Aucun commentaire pour le moment.', reply: 'Répondre',
    replyAs: 'Répondre en tant que', commentAs: 'Commenter en tant que', yourReply: 'Votre réponse',
    yourComment: 'Votre commentaire', onBehalf: 'Au nom de', myself: 'Moi-même',
    onBehalfHint: "Présidence seulement : consigner un commentaire fait par un membre lors d'une réunion.",
    proposal: 'Proposition', notVoted: "N'ont pas encore voté", translations: 'Traduction manquante',
    mergeStatus: 'État de la fusion', actions: 'Actions', ready: 'Prête', blocked: 'Bloquée :',
    needsBoth: 'Les deux langues sont requises', accept: 'Accepter', reject: 'Rejeter',
    confirmAccept: 'Accepter cette décision? La demande de fusion sera fusionnée.',
    confirmReject: 'Rejeter cette proposition? La demande de fusion sera fermée.',
  },
};
const stored = (() => { try { return localStorage.getItem('adr:lang'); } catch { return null; } })();
let lang = LABELS[stored] ? stored : navigator.language?.startsWith('fr') ? 'fr' : 'en';
let L = LABELS[lang];
const other = () => (lang === 'en' ? 'fr' : 'en');

const tr = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en : v); // config text: "x" or { "en": "x", "fr": "y" }
const site = () => tr(c.title) || L.title;

// The header is built here so its signature slot exists before GCDS first renders it (GCDS only checks then).
// With a "signature" in config.json it shows that department signature; without one, the Government of Canada's.
const header = document.createElement('gcds-header');
header.setAttribute('lang-href', '#'); // required by GCDS; the click is intercepted below to switch in place
header.setAttribute('skip-to-href', '#main-content');
if (c.signature) header.innerHTML = '<div slot="signature" class="adr-signature"></div>';
document.body.prepend(header);

// Switch language in place: GCDS components watch their own lang attribute; the app re-renders from memory.
function setLang(l) {
  lang = l;
  L = LABELS[l];
  document.documentElement.lang = l;
  document.querySelectorAll('gcds-header, .adr-footer gcds-signature').forEach((x) => x.setAttribute('lang', l));
  const sig = tr(c.signature);
  if (sig) header.querySelector('.adr-signature').innerHTML = `<a href="${h(sig.href || '#/')}"><img src="${h(sig.src)}" alt="${h(sig.alt)}"></a>`;
  try { localStorage.setItem('adr:lang', l); } catch { /* private mode: language just isn't remembered */ }
}

const h = (x) => String(x ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const day = (d) => new Date(d).toLocaleDateString(`${lang}-CA`); // YYYY-MM-DD, the GC date format
const muted = (t) => `<gcds-text text-role="secondary">${t}</gcds-text>`;
const list = (users) => users.map((u) => u.name).join(', ');
const hover = (users) => { // like GitLab: first 10 names, then +N
  const n = users.slice(0, 10).map((u) => u.name);
  return [...n, ...(users.length > n.length ? [`+${users.length - n.length}`] : [])].join(', ');
};

// Limit: first 100 of each list (open and merged MRs, files, diffs, members, threads, reactions); paginate when outgrown.
const MR = `id iid title webUrl state sourceBranch diffHeadSha detailedMergeStatus mergedAt author { name } diffStats { path }
  userPermissions { canMerge createNote } awardEmoji { nodes { name user { name username } } }`;
const LIST = `query($p: ID!, $f: String!) { currentUser { username name }
  project(fullPath: $p) { repository { rootRef tree(path: $f, recursive: true) { blobs(first: 100) { nodes { path } } } }
    open: mergeRequests(state: opened, first: 100) { nodes { ${MR} } }
    merged: mergeRequests(state: merged, sort: MERGED_AT_DESC, first: 100) { nodes { iid title mergedAt upvotes downvotes diffStats { path } } } } }`;
const BLOBS = `query($p: ID!, $r: String!, $paths: [String!]!) { project(fullPath: $p) { repository {
  blobs(ref: $r, paths: $paths, first: 100) { nodes { path rawTextBlob } } } } }`;
const DETAIL = `query($p: ID!, $iid: String!) { project(fullPath: $p) { mergeRequest(iid: $iid) { ${MR} diffRefs { baseSha headSha startSha }
  discussions(first: 100) { nodes { replyId notes { nodes { id bodyHtml system createdAt author { name }
    position { positionType newPath oldPath newLine oldLine diffRefs { headSha } } } } } } } } }`;
const MEMBERS = `query($p: ID!) { project(fullPath: $p) { projectMembers(first: 100) { nodes { accessLevel { integerValue } user { name username } } } } }`;
const TOGGLE = `mutation($id: AwardableID!, $n: String!) { awardEmojiToggle(input: { awardableId: $id, name: $n }) { toggledOn errors } }`;
const NOTE = `mutation($id: NoteableID!, $b: String!, $d: DiscussionID) { createNote(input: { noteableId: $id, body: $b, discussionId: $d }) { errors } }`;
const ACCEPT = `mutation($p: ID!, $iid: String!, $sha: String!) { mergeRequestAccept(input: { projectPath: $p, iid: $iid, sha: $sha }) { errors } }`;
const CLOSE = `mutation($p: ID!, $iid: String!) { mergeRequestUpdate(input: { projectPath: $p, iid: $iid, state: CLOSED }) { errors } }`;

async function gql(query, variables) {
  const token = s.getItem('adr:token');
  const r = await fetch(`${gitlab}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ query, variables }),
  });
  if (r.status === 401 && token) { s.removeItem('adr:token'); return gql(query, variables); } // expired: carry on signed out
  const { data, errors } = await r.json();
  const err = errors?.[0]?.message || Object.values(data || {}).find((m) => m?.errors?.length)?.errors[0];
  if (err) throw new Error(err);
  return data;
}

// REST, for what GraphQL can't do: render Markdown, read diffs, start file and line threads.
async function api(method, path, body) {
  const r = await fetch(`${gitlab}/api/v4${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.getItem('adr:token')}` },
    body: body && JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j.message ?? j.error ?? '')}`);
  return j;
}
const mrApi = (iid) => `/projects/${encodeURIComponent(c.project)}/merge_requests/${iid}`;

// GitLab renders (and sanitizes) the Markdown, so ADRs look as they do in GitLab. gitlab.com requires sign-in for this.
const markdown = async (text) => fix((await api('POST', '/markdown', { text, gfm: true, project: c.project })).html, true);

// Old line number of new line n in a unified diff, or null if the merge request added it. Lines between hunks are
// unchanged, shifted by the lines the hunks above added or removed.
// ponytail: assumes GitLab's 3 lines of context, so no hunk has an old count of 0 except in a new file (handled by caller).
function oldLine(diff, n) {
  let o = 0, w = 0; // next old and new line numbers
  for (const t of diff.split('\n')) {
    const m = t.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/);
    if (m) {
      if (n < +m[2]) break;
      [o, w] = [+m[1], +m[2]];
    } else if (t[0] === '+') { if (w === n) return null; w++; }
    else if (t[0] === '-') o++;
    else if (t[0] === ' ') { if (w === n) return o; o++; w++; }
  }
  return n + o - w;
}

// Point GitLab's root-relative links and images at GitLab, and drop heading anchors, which would fight the hash routes.
function fix(html, dropTitle) {
  const t = document.createElement('template');
  t.innerHTML = html || '';
  const f = t.content;
  f.querySelectorAll('a.anchor').forEach((a) => a.remove());
  if (dropTitle && f.firstElementChild?.tagName === 'H1') f.firstElementChild.remove(); // it becomes the page's h1
  const abs = (u) => (u?.startsWith('/') && !u.startsWith('//') ? gitlab + u : u);
  f.querySelectorAll('[href]').forEach((a) => a.setAttribute('href', abs(a.getAttribute('href'))));
  f.querySelectorAll('img').forEach((i) => i.setAttribute('src', abs(i.dataset.src || i.getAttribute('src')))); // GitLab lazy-loads via data-src
  return t.innerHTML;
}

async function signIn() {
  const verifier = random();
  const state = random();
  s.setItem('adr:verifier', verifier);
  s.setItem('adr:state', state);
  s.setItem('adr:return', location.hash);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  location.href = `${gitlab}/oauth/authorize?${new URLSearchParams({ client_id: c.clientId, redirect_uri: redirectUri,
    response_type: 'code', state, scope: 'api', code_challenge: challenge, code_challenge_method: 'S256' })}`;
}

async function callback() {
  const q = new URLSearchParams(location.search);
  const state = s.getItem('adr:state');
  if (!state || !q.has('code') || q.get('state') !== state) return;
  s.removeItem('adr:state');
  const r = await fetch(`${gitlab}/oauth/token`, { method: 'POST', body: new URLSearchParams({
    client_id: c.clientId, code: q.get('code'), grant_type: 'authorization_code',
    redirect_uri: redirectUri, code_verifier: s.getItem('adr:verifier') }) });
  if (r.ok) s.setItem('adr:token', (await r.json()).access_token);
  else console.error('gitlab-adr: token exchange failed', await r.text());
  history.replaceState(null, '', location.pathname + (s.getItem('adr:return') || '')); // drop ?code, back to the route
}

// State, refreshed by load() on each route change; render() draws it in the current language.
let me = null; // { username, name }
let project = null;
let proposals = []; // open merge requests with the title prefix
let byKey = {}; // Markdown files by path without -en/-fr.md: { key, main: {lang: path} on the default branch, prop: {lang: path} in
                // the proposal mr, mr, merged: newest merge that touched it, text: {lang} }. lang is en, fr, or '' (no suffix)
let doc = null; // the file on screen: { a, mr (with discussions), html: {en, fr, ''} }
let members = []; // committee: Reporter access or higher
let failed = null;

const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const href = (p) => `#/${enc(p)}`;
const route = () => { try { return decodeURIComponent(location.hash.slice(2)); } catch { return ''; } }; // '', 'chair' or a path
const isMd = (p) => p.endsWith('.md');
const langOf = (p) => p.match(/-(en|fr)\.md$/)?.[1] ?? '';
const keyOf = (p) => p.replace(/(-(en|fr))?\.md$/, '');
const base = (p) => p.split('/').pop();
const variants = (a) => ({ ...a.main, ...a.prop });
const pathFor = (a) => { const v = variants(a); return v[lang] ?? v[other()] ?? v['']; };
const removed = (a) => Object.keys(a.prop).length && Object.keys(a.prop).every((l) => a.text[l] == null);
const votes = (mr, n) => mr.awardEmoji.nodes.filter((x) => x.name === n && x.user).map((x) => x.user);
const mine = (mr, n) => votes(mr, n).some((u) => u.username === me.username);

async function load() {
  doc = null;
  me = null;
  if (!s.getItem('adr:token')) return;
  const d = await gql(LIST, { p: c.project, f: folder });
  me = d.currentUser;
  project = d.project;
  if (!me || !project) return;
  const rootRef = project.repository.rootRef;
  const rfc = (mr) => mr.title.startsWith(prefix);
  proposals = project.open.nodes.filter(rfc);
  byKey = {};
  const entry = (path) => (byKey[keyOf(path)] ||= { key: keyOf(path), main: {}, prop: {}, text: {} });
  for (const { path } of project.repository.tree?.blobs.nodes || []) if (isMd(path)) entry(path).main[langOf(path)] = path;
  for (const mr of proposals) for (const { path } of mr.diffStats || []) {
    if (isMd(path) && (entry(path).mr ||= mr) === mr) byKey[keyOf(path)].prop[langOf(path)] = path; // Limit: two proposals on one file, first wins
  }
  for (const mr of project.merged.nodes.filter(rfc)) for (const { path } of mr.diffStats || []) {
    if (byKey[keyOf(path)]) byKey[keyOf(path)].merged ||= mr;
  }

  // Text: a proposal's files from its branch, everything else from the default branch. One query per branch.
  const docs = Object.values(byKey);
  const refs = [[rootRef, docs.flatMap((a) => Object.values(a.main))],
    ...proposals.map((mr) => [mr.sourceBranch, docs.filter((a) => a.mr === mr).flatMap((a) => Object.values(a.prop))])];
  const blobs = Object.assign({}, ...await Promise.all(refs.filter(([, paths]) => paths.length).map(([r, paths]) =>
    gql(BLOBS, { p: c.project, r, paths }).then((x) => Object.fromEntries(x.project.repository.blobs.nodes.map((b) => [`${r}:${b.path}`, b.rawTextBlob]))))));
  for (const a of docs) for (const l of Object.keys(variants(a))) {
    a.text[l] = a.prop[l] ? blobs[`${a.mr.sourceBranch}:${a.prop[l]}`] : blobs[`${rootRef}:${a.main[l]}`]; // none: removed
  }

  const path = route();
  const a = byKey[keyOf(path)];
  if (a) {
    const iid = (a.mr || a.merged)?.iid;
    const [mr, en, fr, none] = await Promise.all([iid && gql(DETAIL, { p: c.project, iid }).then((x) => x.project.mergeRequest),
      ...['en', 'fr', ''].map((l) => a.text[l] != null && markdown(a.text[l]))]);
    doc = { a, mr, html: { en, fr, '': none } };
  }
  members = path === 'chair' || doc?.mr?.userPermissions.canMerge
    ? (await gql(MEMBERS, { p: c.project })).project.projectMembers.nodes.filter((m) => m.user && m.accessLevel.integerValue >= 20).map((m) => m.user)
    : [];
}

const title = (a) => (a.text[lang] ?? a.text[other()] ?? a.text[''])?.match(/^#\s+(.+)$/m)?.[1].trim() || base(a.key);
const num = (a) => base(a.key).match(/^\d+/)?.[0];
const label = (a) => (num(a) ? `${num(a)} · ${title(a)}` : title(a));
const mrTitle = (mr) => mr.title.slice(prefix.length).trim() || mr.title;
const intro = () => `<gcds-heading tag="h1" margin-bottom="200">${h(site())}</gcds-heading>
  ${c.subtitle ? `<p class="adr-subtitle">${h(tr(c.subtitle))}</p>` : ''}<gcds-text>${L.intro}</gcds-text>`;
const back = () => `<p><gcds-link href="#/">← ${L.all}</gcds-link></p>`;
const caption = (t) => `<gcds-text size="caption" text-role="secondary" margin-bottom="0">${t}</gcds-text>`;
const missingLangs = (a) => { // only for files named -en.md / -fr.md
  const langs = Object.keys(variants(a));
  return langs.some(Boolean) ? ['en', 'fr'].filter((l) => !langs.includes(l)) : [];
};

// A merge request's files: Markdown files (one entry per language pair) link here, others to GitLab.
function files(mr, current) {
  const seen = new Set();
  return `<ul class="adr-files">${(mr.diffStats || []).map(({ path }) => {
    if (!isMd(path)) return `<li><gcds-link href="${h(`${gitlab}/${c.project}/-/blob/${enc(mr.sourceBranch)}/${enc(path)}`)}" external>${h(base(path))}</gcds-link></li>`;
    const a = byKey[keyOf(path)];
    if (seen.has(a)) return '';
    seen.add(a);
    return `<li>${removed(a) ? `${h(label(a))} (${L.removed})` : a === current ? `<strong aria-current="page">${h(label(a))}</strong>`
      : `<gcds-link href="${h(href(pathFor(a)))}">${h(label(a))}</gcds-link>`}</li>`;
  }).join('')}</ul>`;
}
const firstDoc = (mr) => (mr.diffStats || []).map(({ path }) => isMd(path) && byKey[keyOf(path)]).find((a) => a && a.mr === mr && !removed(a));
const mrLink = (mr) => { const a = firstDoc(mr); return `<gcds-link href="${h(a ? href(pathFor(a)) : mr.webUrl)}">${h(mrTitle(mr))}</gcds-link>`; };

function listView() {
  const yourVote = (mr) => {
    const v = mine(mr, 'thumbsup') ? L.for : mine(mr, 'thumbsdown') ? L.against : '';
    return v ? ` · ${L.yourVote} ${v}` : '';
  };
  const prop = proposals.map((mr) => `<li>${mrLink(mr)}
    ${caption(`${L.by} ${h(mr.author?.name)} · 👍 ${votes(mr, 'thumbsup').length} · 👎 ${votes(mr, 'thumbsdown').length}${yourVote(mr)}`)}
    ${(mr.diffStats || []).length > 1 ? files(mr) : ''}</li>`);
  // Accepted decisions: -en.md / -fr.md files on the default branch (not a README), newest number first.
  const acc = Object.values(byKey).filter((a) => Object.keys(a.main).some(Boolean)).sort((a, b) => base(b.key).localeCompare(base(a.key)))
    .map((a) => `<li><gcds-link href="${h(href(pathFor(a)))}">${h(label(a))}</gcds-link>
      ${caption(a.merged ? `${L.acceptedOn} ${day(a.merged.mergedAt)} · 👍 ${a.merged.upvotes} · 👎 ${a.merged.downvotes}` : L.statusAccepted)}</li>`);
  const terms = byKey[TERMS];
  return `${intro()}
    <p>${terms ? `<gcds-link href="${h(href(pathFor(terms)))}">${L.terms}</gcds-link> · ` : ''}<gcds-link href="#/chair">${L.chair}</gcds-link></p>
    <gcds-heading tag="h2">${L.proposed}</gcds-heading>
    ${prop.length ? `<ul class="adr-list">${prop.join('')}</ul>` : muted(L.none)}
    <gcds-heading tag="h2">${L.accepted}</gcds-heading>
    ${acc.length ? `<ul class="adr-list">${acc.join('')}</ul>` : muted(L.none)}`;
}

const voteBar = (mr) => ['thumbsup', 'thumbsdown'].map((n) => {
  const users = votes(mr, n);
  const on = mine(mr, n);
  const can = mr.state === 'opened' && mr.userPermissions.createNote; // GitLab's lock rule blocks reactions with notes
  return `<gcds-button size="small" button-role="${on ? 'primary' : 'secondary'}" data-vote="${n}" aria-pressed="${on}"
    title="${h(hover(users))}" ${can ? '' : 'disabled'}>${n === 'thumbsup' ? `👍 ${L.for}` : `👎 ${L.against}`} ${users.length}</gcds-button>`;
}).join('');

const indent = 'margin-left: var(--gcds-spacing-400)';
const note = (n, reply) => `<div style="${reply ? `${indent}; padding-left: var(--gcds-spacing-300); border-left: var(--gcds-border-width-lg) solid var(--gcds-color-grayscale-100)` : ''}">
  ${caption(`${h(n.author?.name)} · ${day(n.createdAt)}`)}
  <div class="adr-md adr-note">${fix(n.bodyHtml)}</div></div>`;
const thread = (t, canAct, where = '') => `<div class="adr-thread">${where ? caption(where) : ''}
  ${t.notes.nodes.map((n, i) => note(n, i > 0)).join('')}
  ${canAct ? `<div style="${indent}"><gcds-button button-role="secondary" size="small" data-reply="${h(t.replyId)}">${L.reply}</gcds-button></div>` : ''}</div>`;

// One box for every comment: { thread } replies, { at: line } starts a paragraph thread, { at: 'file' } a file thread, and
// nothing a thread on the whole proposal. The chair also gets "On behalf of" to record what members said at a meeting.
const form = ({ thread = '', at = '' } = {}) => {
  const id = h(thread.split('/').pop() || (at && `at-${at}`) || 'new');
  const chair = doc.mr.userPermissions.canMerge && members.length > 1;
  return `<div class="adr-form">
    ${chair ? `<gcds-select select-id="adr-behalf-${id}" name="behalf" label="${L.onBehalf}" hint="${L.onBehalfHint}">
      <option value="">${L.myself}</option>
      ${members.filter((u) => u.username !== me.username).map((u) => `<option value="${h(u.name)}">${h(u.name)}</option>`).join('')}</gcds-select>` : ''}
    <gcds-textarea textarea-id="adr-text-${id}" name="comment" rows="3" label="${thread ? L.yourReply : L.yourComment}"></gcds-textarea>
    <gcds-button size="small" data-action="post" data-thread="${h(thread)}" data-at="${h(at)}">${thread ? L.replyAs : L.commentAs} ${h(me.name)}</gcds-button></div>`;
};

// Paragraph comments. GitLab marks each rendered block with data-sourcepos="startLine:col-endLine:col"; threads on a line
// of the current version go under the block holding that line, and its button starts a thread on the block's first line.
function blocks(html, threads, lineOf, placed, canComment) {
  const t = document.createElement('template');
  t.innerHTML = html;
  for (const b of [...t.content.children]) {
    const m = (b.dataset.sourcepos || b.querySelector('[data-sourcepos]')?.dataset.sourcepos || '').match(/^(\d+):\d+-(\d+):/);
    if (!m || /^H\d$/.test(b.tagName)) continue; // headings: their threads go under "Comments on this file"
    const here = threads.filter((x) => lineOf(x) >= +m[1] && lineOf(x) <= +m[2]);
    here.forEach((x) => placed.add(x));
    if (!here.length && !canComment) continue;
    const w = document.createElement('div');
    w.className = 'adr-block';
    b.replaceWith(w);
    w.append(b);
    w.insertAdjacentHTML('beforeend', here.map((x) => thread(x, canComment)).join('')
      + (canComment ? `<gcds-button class="adr-c" button-role="secondary" size="small" data-para="${m[1]}">${L.commentPara}</gcds-button>` : ''));
  }
  return t.innerHTML;
}

const shownLang = () => [lang, other(), ''].find((l) => doc.html[l]); // this language, else the other, else no suffix
const shownPath = () => variants(doc.a)[shownLang()];

function docView() {
  if (!doc) return `${back()}${muted(L.notFound)}`;
  const { a, mr, html } = doc;
  const shown = shownLang();
  const path = shownPath();
  const open = mr?.state === 'opened';
  const canAct = open && mr.userPermissions.createNote;
  const canComment = canAct && !!a.prop[shown]; // diff threads only on files this merge request changes
  const threads = (mr?.discussions.nodes || []).filter((t) => !t.notes.nodes[0]?.system);
  const pos = (t) => t.notes.nodes[0].position;
  const current = (p) => p.diffRefs?.headSha === mr.diffHeadSha; // GitLab moves positions forward when lines survive a push
  const lineOf = (t) => (pos(t).positionType === 'text' && current(pos(t)) ? pos(t).newLine : null);
  const onFile = threads.filter((t) => pos(t) && (pos(t).newPath === path || pos(t).oldPath === path));
  const placed = new Set();
  const body = blocks(html[shown] || '', onFile, lineOf, placed, canComment);
  const where = (p) => (p.positionType !== 'text' ? '' : `${current(p) ? L.line : L.earlier} ${p.newLine ?? p.oldLine}`);
  const show = (ts) => ts.map((t) => thread(t, canAct, where(pos(t) || {}))).join('');
  const fileThreads = onFile.filter((t) => !placed.has(t));
  const general = threads.filter((t) => !pos(t));
  return `${back()}
    <gcds-heading tag="h1">${h(label(a))}</gcds-heading>
    <gcds-text text-role="secondary">${a.mr ? L.statusProposed : L.statusAccepted}${mr ? ` · ${L.by} ${h(mr.author?.name)} ·
      <gcds-link href="${h(mr.webUrl)}">${L.mr} !${h(mr.iid)}</gcds-link>` : ''}</gcds-text>
    ${a.mr && (a.mr.diffStats || []).length > 1 ? `${caption(L.files)}${files(a.mr, a)}` : ''}
    ${shown === other() ? `<gcds-notice type="warning" notice-title-tag="h2" notice-title="${L.missingTitle}"
      style="display: block; margin-bottom: var(--gcds-spacing-300)"><gcds-text>${L.missing}</gcds-text></gcds-notice>` : ''}
    <div class="adr-md" lang="${shown || lang}">${body}</div>
    ${mr ? `<gcds-heading tag="h2">${L.vote}</gcds-heading><div class="adr-votes" id="adr-votes">${voteBar(mr)}</div>
      <gcds-heading tag="h2">${L.fileComments}</gcds-heading>${show(fileThreads) || muted(L.noComments)}${canComment ? form({ at: 'file' }) : ''}
      <gcds-heading tag="h2">${L.wholeDiscussion}</gcds-heading>${show(general) || muted(L.noComments)}${canAct ? form() : ''}` : ''}`;
}

function chairView() {
  const rows = proposals.map((mr) => {
    const voted = new Set([...votes(mr, 'thumbsup'), ...votes(mr, 'thumbsdown')].map((u) => u.username));
    const missing = Object.values(byKey).filter((a) => a.mr === mr)
      .flatMap((a) => missingLangs(a).map((l) => `${num(a) ?? base(a.key)} ${l.toUpperCase()}`));
    const ready = mr.detailedMergeStatus === 'MERGEABLE' && !missing.length; // GC: publish in both official languages
    const cell = (users) => `${users.length}${users.length ? `<br>${h(list(users))}` : ''}`;
    return `<tr><th scope="row">${mrLink(mr)}</th>
      <td>${cell(votes(mr, 'thumbsup'))}</td><td>${cell(votes(mr, 'thumbsdown'))}</td>
      <td>${h(list(members.filter((u) => !voted.has(u.username)))) || '—'}</td>
      <td>${h(missing.join(', ')) || '—'}</td>
      <td>${mr.detailedMergeStatus === 'MERGEABLE' ? L.ready : `${L.blocked} ${h(mr.detailedMergeStatus.toLowerCase().replace(/_/g, ' '))}`}</td>
      <td>${mr.userPermissions.canMerge ? `<gcds-button size="small" data-accept="${h(mr.iid)}" ${ready ? '' : 'disabled'}
        title="${missing.length ? L.needsBoth : ''}">${L.accept}</gcds-button>
        <gcds-button size="small" button-role="danger" data-reject="${h(mr.iid)}">${L.reject}</gcds-button>` : '—'}</td></tr>`;
  });
  return `${back()}<gcds-heading tag="h1">${L.chair}</gcds-heading><gcds-text>${L.chairIntro}</gcds-text>
    ${rows.length ? `<div class="adr-scroll"><table class="adr-table"><thead><tr><th scope="col">${L.proposal}</th>
      <th scope="col">👍 ${L.for}</th><th scope="col">👎 ${L.against}</th><th scope="col">${L.notVoted}</th>
      <th scope="col">${L.translations}</th><th scope="col">${L.mergeStatus}</th><th scope="col">${L.actions}</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>` : muted(L.none)}`;
}

function render() {
  const path = route();
  document.title = doc ? `${label(doc.a)} – ${site()}` : site();
  el.innerHTML = !c.project || !c.clientId ? muted(L.noConfig)
    : failed ? muted(`${L.error} ${h(failed)}`)
    : !me ? `${intro()}<gcds-button data-action="signin">${L.signIn}</gcds-button>`
    : !project ? muted(`${L.noAccess} ${h(c.project)}.`)
    : path === 'chair' ? chairView() : path ? docView() : listView();
}

async function go() {
  const l = langOf(route());
  if (l && l !== lang) setLang(l); // a link to a -fr.md file opens in French
  if (!c.project || !c.clientId) return render();
  el.innerHTML = muted(L.loading);
  failed = null;
  try { await load(); } catch (e) { failed = e.message; }
  render();
  scrollTo(0, 0);
}

// The tally goes into GitLab with the decision, in both languages, so the record doesn't depend on this site.
const tally = (verdict, mr) => `**${verdict}** — 👍 For / Pour : ${votes(mr, 'thumbsup').length} (${list(votes(mr, 'thumbsup')) || '—'}) · `
  + `👎 Against / Contre : ${votes(mr, 'thumbsdown').length} (${list(votes(mr, 'thumbsdown')) || '—'})`;

async function toggle(mr, n) {
  const on = (await gql(TOGGLE, { id: mr.id, n })).awardEmojiToggle.toggledOn;
  const rest = mr.awardEmoji.nodes.filter((x) => !(x.name === n && x.user?.username === me.username));
  mr.awardEmoji.nodes = on ? [...rest, { name: n, user: me }] : rest;
}

// File and paragraph threads are GitLab diff threads. GraphQL can't start file threads, so this uses REST. A comment on an
// unchanged line needs that line's old number too, worked out from the merge request's diff.
async function discuss(body, line) {
  const { mr } = doc;
  const path = shownPath();
  const f = (await api('GET', `${mrApi(mr.iid)}/diffs?per_page=100`)).find((x) => x.new_path === path);
  const { baseSha, headSha, startSha } = mr.diffRefs;
  const position = { base_sha: baseSha, head_sha: headSha, start_sha: startSha, position_type: line ? 'text' : 'file',
    new_path: path, old_path: f?.old_path ?? path };
  if (line) {
    position.new_line = line;
    const old = f && !f.new_file ? oldLine(f.diff, line) : null;
    if (old) position.old_line = old;
  }
  await api('POST', `${mrApi(mr.iid)}/discussions`, { body, position });
}

el.addEventListener('click', async (e) => {
  const b = e.target.closest('gcds-button'); // disabled gcds-buttons swallow the click
  if (!b) return;
  if (b.dataset.action === 'signin') return signIn();
  const open = async (html) => { // swap the button for a comment box and move focus into it (autofocus is blocked after a click)
    b.insertAdjacentHTML('afterend', html);
    const t = b.nextElementSibling.querySelector('gcds-textarea');
    b.remove();
    await t.componentOnReady?.();
    t.focus(); // it delegates focus to its textarea
  };
  if (b.dataset.reply) return open(form({ thread: b.dataset.reply })); // reply box in that thread
  if (b.dataset.para) return open(form({ at: b.dataset.para })); // comment box under that paragraph
  b.disabled = true;
  try {
    if (b.dataset.vote) { // one vote per member: voting For drops an Against, and the other way round
      const n = b.dataset.vote;
      const x = n === 'thumbsup' ? 'thumbsdown' : 'thumbsup';
      if (!mine(doc.mr, n) && mine(doc.mr, x)) await toggle(doc.mr, x);
      await toggle(doc.mr, n);
      document.getElementById('adr-votes').innerHTML = voteBar(doc.mr); // just the bar: typed comments survive
      const nb = el.querySelector(`[data-vote="${n}"]`);
      await nb.componentOnReady?.();
      return nb.focus();
    }
    if (b.dataset.action === 'post') {
      const f = b.closest('.adr-form');
      const text = f.querySelector('gcds-textarea').value?.trim();
      const who = f.querySelector('gcds-select')?.value;
      if (text) {
        const body = who ? `_On behalf of / Au nom de ${who}_\n\n${text}` : text;
        const { at } = b.dataset;
        if (at) await discuss(body, at === 'file' ? null : +at);
        else await gql(NOTE, { id: doc.mr.id, b: body, d: b.dataset.thread || null });
        doc.mr = (await gql(DETAIL, { p: c.project, iid: doc.mr.iid })).project.mergeRequest;
        render();
      }
    }
    const iid = b.dataset.accept || b.dataset.reject;
    const mr = iid && proposals.find((m) => m.iid === iid);
    if (mr && confirm(b.dataset.accept ? L.confirmAccept : L.confirmReject)) {
      // Act first, then record: a merge GitLab refuses (e.g. commits pushed after the vote, so sha differs) leaves no tally.
      if (b.dataset.accept) await gql(ACCEPT, { p: c.project, iid, sha: mr.diffHeadSha });
      else await gql(CLOSE, { p: c.project, iid });
      await gql(NOTE, { id: mr.id, b: tally(b.dataset.accept ? 'Accepted / Acceptée' : 'Rejected / Rejetée', mr) });
      return go();
    }
  } catch (err) {
    alert(`GitLab: ${err.message}`); // nothing re-rendered, so typed text is kept
  }
  b.disabled = false;
});

// The header's language link switches in place (capture phase, before it navigates). On a file page the address moves
// to the file in the new language when there is one; both are already rendered, so nothing is fetched.
document.addEventListener('click', (e) => {
  if (!e.composedPath().some((n) => n.tagName === 'GCDS-LANG-TOGGLE')) return;
  e.preventDefault();
  setLang(other());
  const p = doc && shownPath();
  if (p && p !== route()) history.replaceState(null, '', href(p));
  render();
}, true);
addEventListener('hashchange', () => (!location.hash || location.hash.startsWith('#/')) && go());

setLang(lang);
await callback();
go();
