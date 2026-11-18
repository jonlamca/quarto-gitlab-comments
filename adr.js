// gitlab-adr: Architecture Decision Records kept in a GitLab repository, in English and French, with GC Design System.
// A proposal is a merge request that adds or changes adr/NNNN-slug-en.md and adr/NNNN-slug-fr.md. The default branch
// holds accepted decisions. Committee members vote 👍/👎 on the merge request and comment; the chair (anyone GitLab
// lets merge) accepts or rejects. No backend: OAuth PKCE in the browser, then GitLab's CORS-enabled APIs.
// Config: data-* on #adr in index.html. Routes: #/ (list), #/adr/<NNNN-slug> (one decision), #/chair (chair view).

const el = document.getElementById('adr');
const c = el.dataset;
const gitlab = (c.gitlab || 'https://gitlab.com').replace(/\/+$/, '');
const folder = (c.folder || 'adr').replace(/^\/+|\/+$/g, '');
const redirectUri = location.origin + location.pathname; // register this exact URL on the GitLab application
const s = sessionStorage;

// Interface text. French follows Canadian typography: no space before ? ; ! and a non-breaking space before :.
const LABELS = {
  en: {
    title: 'Architecture decisions', signIn: 'Sign in with GitLab', loading: 'Loading…', error: 'GitLab error:',
    intro: 'Proposed and accepted architecture decision records. Committee members vote and comment on proposals; the chair accepts or rejects them.',
    noAccess: "You don't have access to", proposed: 'Proposed', accepted: 'Accepted', statusProposed: 'Proposed',
    statusAccepted: 'Accepted', none: 'None yet.', by: 'by', acceptedOn: 'Accepted', yourVote: 'Your vote:',
    for: 'For', against: 'Against', all: 'All decisions', chair: 'Chair view', notFound: 'This decision was not found.',
    chairIntro: 'Votes on open proposals. Accepting merges the merge request and records the tally in GitLab; rejecting closes it.',
    mr: 'Merge request', missingTitle: 'Translation missing',
    missing: 'This decision is not available in English yet. It is shown in French.',
    vote: 'Vote', discussion: 'Discussion', noComments: 'No comments yet.', reply: 'Reply', replyAs: 'Reply as',
    commentAs: 'Comment as', yourReply: 'Your reply', yourComment: 'Your comment', onBehalf: 'On behalf of',
    myself: 'Myself', onBehalfHint: 'Chair only: record a comment a member made at a meeting.',
    decision: 'Decision', notVoted: 'Not yet voted', translations: 'Missing translation', mergeStatus: 'Merge status',
    actions: 'Actions', ready: 'Ready', blocked: 'Blocked:', needsBoth: 'Needs both languages', accept: 'Accept',
    reject: 'Reject', confirmAccept: 'Accept this decision? This merges the merge request.',
    confirmReject: 'Reject this proposal? This closes the merge request.',
  },
  fr: {
    title: "Décisions d'architecture", signIn: 'Se connecter avec GitLab', loading: 'Chargement…', error: 'Erreur GitLab :',
    intro: "Dossiers de décisions d'architecture proposés et acceptés. Les membres du comité votent et commentent les propositions; la présidence les accepte ou les rejette.",
    noAccess: "Vous n'avez pas accès à", proposed: 'Proposées', accepted: 'Acceptées', statusProposed: 'Proposée',
    statusAccepted: 'Acceptée', none: 'Aucune pour le moment.', by: 'par', acceptedOn: 'Acceptée le',
    yourVote: 'Votre vote :', for: 'Pour', against: 'Contre', all: 'Toutes les décisions', chair: 'Vue de la présidence',
    notFound: 'Cette décision est introuvable.',
    chairIntro: 'Votes sur les propositions ouvertes. Accepter fusionne la demande de fusion et consigne le décompte dans GitLab; rejeter la ferme.',
    mr: 'Demande de fusion', missingTitle: 'Traduction manquante',
    missing: "Cette décision n'est pas encore disponible en français. Elle est affichée en anglais.",
    vote: 'Vote', discussion: 'Discussion', noComments: 'Aucun commentaire pour le moment.', reply: 'Répondre',
    replyAs: 'Répondre en tant que', commentAs: 'Commenter en tant que', yourReply: 'Votre réponse',
    yourComment: 'Votre commentaire', onBehalf: 'Au nom de', myself: 'Moi-même',
    onBehalfHint: "Présidence seulement : consigner un commentaire fait par un membre lors d'une réunion.",
    decision: 'Décision', notVoted: "N'ont pas encore voté", translations: 'Traduction manquante',
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

// Switch language in place: GCDS header and footer watch their own lang attribute; the app re-renders from memory.
function setLang(l) {
  lang = l;
  L = LABELS[l];
  document.documentElement.lang = l;
  document.querySelectorAll('gcds-header, gcds-footer').forEach((x) => x.setAttribute('lang', l));
  document.title = L.title;
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

// Limit: first 100 of each list (open and merged MRs, ADR files, members, threads, reactions); paginate when outgrown.
const MR = `id iid title webUrl state sourceBranch diffHeadSha detailedMergeStatus mergedAt author { name } diffStats { path }
  userPermissions { canMerge createNote } awardEmoji { nodes { name user { name username } } }`;
const LIST = `query($p: ID!, $f: String!) { currentUser { username name }
  project(fullPath: $p) { repository { rootRef tree(path: $f) { blobs(first: 100) { nodes { path } } } }
    open: mergeRequests(state: opened, first: 100) { nodes { ${MR} } }
    merged: mergeRequests(state: merged, sort: MERGED_AT_DESC, first: 100) { nodes { iid mergedAt upvotes downvotes diffStats { path } } } } }`;
const BLOBS = `query($p: ID!, $r: String!, $paths: [String!]!) { project(fullPath: $p) { repository {
  blobs(ref: $r, paths: $paths, first: 100) { nodes { path rawTextBlob } } } } }`;
const DETAIL = `query($p: ID!, $iid: String!) { project(fullPath: $p) { mergeRequest(iid: $iid) { ${MR}
  discussions(first: 100) { nodes { replyId notes { nodes { id bodyHtml system createdAt author { name } } } } } } } }`;
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

// GitLab renders (and sanitizes) the Markdown, so ADRs look as they do in GitLab. gitlab.com requires sign-in for this.
async function markdown(text) {
  const r = await fetch(`${gitlab}/api/v4/markdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.getItem('adr:token')}` },
    body: JSON.stringify({ text, gfm: true, project: c.project }),
  });
  if (!r.ok) throw new Error(`markdown ${r.status}`);
  return fix((await r.json()).html, true);
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
let adrs = []; // { slug, main: {en, fr} paths on the default branch, mr: open proposal, prop: {en, fr} its paths, text, merged }
let doc = null; // the decision on screen: { a, mr (with discussions), html: {en, fr} }
let members = []; // committee: Reporter access or higher
let failed = null;

const route = () => location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
const adrPath = (path) => path.startsWith(`${folder}/`) && path.slice(folder.length + 1).match(/^([^/]+)-(en|fr)\.md$/);
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
  const by = {};
  const entry = (slug) => (by[slug] ||= { slug, main: {}, prop: {}, text: {} });
  for (const { path } of project.repository.tree?.blobs.nodes || []) {
    const m = adrPath(path);
    if (m) entry(m[1]).main[m[2]] = path;
  }
  for (const mr of project.open.nodes) for (const { path } of mr.diffStats || []) {
    const m = adrPath(path);
    if (m && (entry(m[1]).mr ||= mr) === mr) by[m[1]].prop[m[2]] = path; // Limit: two open MRs on one ADR, first wins
  }
  for (const mr of project.merged.nodes) for (const { path } of mr.diffStats || []) {
    const m = adrPath(path);
    if (m && by[m[1]]) by[m[1]].merged ||= mr; // newest merge that touched it
  }
  adrs = Object.values(by).sort((a, b) => b.slug.localeCompare(a.slug)); // newest number first

  // Text: a proposal's files from its branch, everything else from the default branch. One query per branch.
  const refs = [[rootRef, adrs.flatMap((a) => Object.values(a.main))],
    ...project.open.nodes.map((mr) => [mr.sourceBranch, adrs.filter((a) => a.mr === mr).flatMap((a) => Object.values(a.prop))])];
  const blobs = Object.assign({}, ...await Promise.all(refs.filter(([, paths]) => paths.length).map(([r, paths]) =>
    gql(BLOBS, { p: c.project, r, paths }).then((x) => Object.fromEntries(x.project.repository.blobs.nodes.map((b) => [`${r}:${b.path}`, b.rawTextBlob]))))));
  for (const a of adrs) for (const l of ['en', 'fr']) {
    a.text[l] = (a.prop[l] && blobs[`${a.mr.sourceBranch}:${a.prop[l]}`]) ?? (a.main[l] && blobs[`${rootRef}:${a.main[l]}`]);
  }

  const [view, slug] = route();
  const a = view === 'adr' && adrs.find((x) => x.slug === slug);
  if (a) {
    const iid = (a.mr || a.merged)?.iid;
    const [mr, en, fr] = await Promise.all([iid && gql(DETAIL, { p: c.project, iid }).then((x) => x.project.mergeRequest),
      ...['en', 'fr'].map((l) => a.text[l] != null && markdown(a.text[l]))]);
    doc = { a, mr, html: { en, fr } };
  }
  members = view === 'chair' || doc?.mr?.userPermissions.canMerge
    ? (await gql(MEMBERS, { p: c.project })).project.projectMembers.nodes.filter((m) => m.user && m.accessLevel.integerValue >= 20).map((m) => m.user)
    : [];
}

const title = (a) => {
  const t = a.text[lang] ?? a.text[other()];
  return t?.match(/^#\s+(.+)$/m)?.[1].trim() || a.slug;
};
const label = (a) => `${a.slug.match(/^\d+/)?.[0] ?? ''} · ${title(a)}`.replace(/^ · /, '');
const back = () => `<p><gcds-link href="#/">← ${L.all}</gcds-link></p>`;
const missingLangs = (a) => ['en', 'fr'].filter((l) => !a.prop[l] && !a.main[l]);

function listView() {
  const item = (a, meta) => `<li><gcds-link href="#/adr/${h(encodeURIComponent(a.slug))}">${h(label(a))}</gcds-link>
    <gcds-text size="caption" text-role="secondary" margin-bottom="0">${meta}</gcds-text></li>`;
  const yourVote = (mr) => {
    const v = mine(mr, 'thumbsup') ? L.for : mine(mr, 'thumbsdown') ? L.against : '';
    return v ? ` · ${L.yourVote} ${v}` : '';
  };
  const prop = adrs.filter((a) => a.mr);
  const acc = adrs.filter((a) => a.main.en || a.main.fr);
  return `<gcds-heading tag="h1">${L.title}</gcds-heading>
    <gcds-text>${L.intro}</gcds-text>
    <p><gcds-link href="#/chair">${L.chair}</gcds-link></p>
    <gcds-heading tag="h2">${L.proposed}</gcds-heading>
    ${prop.length ? `<ul class="adr-list">${prop.map((a) => item(a, `${L.by} ${h(a.mr.author?.name)} · 👍 ${votes(a.mr, 'thumbsup').length} · 👎 ${votes(a.mr, 'thumbsdown').length}${yourVote(a.mr)}`)).join('')}</ul>` : muted(L.none)}
    <gcds-heading tag="h2">${L.accepted}</gcds-heading>
    ${acc.length ? `<ul class="adr-list">${acc.map((a) => item(a, a.merged
      ? `${L.acceptedOn} ${day(a.merged.mergedAt)} · 👍 ${a.merged.upvotes} · 👎 ${a.merged.downvotes}` : L.statusAccepted)).join('')}</ul>` : muted(L.none)}`;
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
  <gcds-text size="caption" text-role="secondary" margin-bottom="0">${h(n.author?.name)} · ${day(n.createdAt)}</gcds-text>
  <div class="adr-md adr-note">${fix(n.bodyHtml)}</div></div>`;

// Same box for comments and replies; the chair also gets "On behalf of" to record what members said at a meeting.
const form = (thread = '') => {
  const id = h(thread.split('/').pop() || 'new');
  const chair = doc.mr.userPermissions.canMerge && members.length > 1;
  return `<div class="adr-form">
    ${chair ? `<gcds-select select-id="adr-behalf-${id}" name="behalf" label="${L.onBehalf}" hint="${L.onBehalfHint}">
      <option value="">${L.myself}</option>
      ${members.filter((u) => u.username !== me.username).map((u) => `<option value="${h(u.name)}">${h(u.name)}</option>`).join('')}</gcds-select>` : ''}
    <gcds-textarea textarea-id="adr-text-${id}" name="comment" rows="3" label="${thread ? L.yourReply : L.yourComment}" ${thread ? 'autofocus' : ''}></gcds-textarea>
    <gcds-button size="small" data-action="post" data-thread="${h(thread)}">${thread ? L.replyAs : L.commentAs} ${h(me.name)}</gcds-button></div>`;
};

function docView() {
  if (!doc) return `${back()}${muted(L.notFound)}`;
  const { a, mr, html } = doc;
  const shown = html[lang] ? lang : other(); // this language's file is missing: show the other one, and say so
  const open = mr?.state === 'opened';
  const canAct = open && mr.userPermissions.createNote;
  const threads = mr?.discussions.nodes.filter((t) => !t.notes.nodes[0]?.system).map((t) => `<div class="adr-thread">
    ${t.notes.nodes.map((n, i) => note(n, i > 0)).join('')}
    ${canAct ? `<div style="${indent}"><gcds-button button-role="secondary" size="small" data-reply="${h(t.replyId)}">${L.reply}</gcds-button></div>` : ''}</div>`).join('');
  return `${back()}
    <gcds-heading tag="h1">${h(label(a))}</gcds-heading>
    <gcds-text text-role="secondary">${a.mr ? L.statusProposed : L.statusAccepted}${mr ? ` · ${L.by} ${h(mr.author?.name)} ·
      <gcds-link href="${h(mr.webUrl)}">${L.mr} !${h(mr.iid)}</gcds-link>` : ''}</gcds-text>
    ${shown !== lang ? `<gcds-notice type="warning" notice-title-tag="h2" notice-title="${L.missingTitle}"
      style="display: block; margin-bottom: var(--gcds-spacing-300)"><gcds-text>${L.missing}</gcds-text></gcds-notice>` : ''}
    <div class="adr-md" lang="${shown}">${html[shown] || ''}</div>
    ${mr ? `<gcds-heading tag="h2">${L.vote}</gcds-heading><div class="adr-votes" id="adr-votes">${voteBar(mr)}</div>
      <gcds-heading tag="h2">${L.discussion}</gcds-heading>${threads || muted(L.noComments)}${canAct ? form() : ''}` : ''}`;
}

function chairView() {
  const rows = adrs.filter((a) => a.mr).map((a) => {
    const { mr } = a;
    const voted = new Set([...votes(mr, 'thumbsup'), ...votes(mr, 'thumbsdown')].map((u) => u.username));
    const missing = missingLangs(a);
    const ready = mr.detailedMergeStatus === 'MERGEABLE' && !missing.length; // GC: publish in both official languages
    const cell = (users) => `${users.length}${users.length ? `<br>${h(list(users))}` : ''}`;
    return `<tr><th scope="row"><gcds-link href="#/adr/${h(encodeURIComponent(a.slug))}">${h(label(a))}</gcds-link></th>
      <td>${cell(votes(mr, 'thumbsup'))}</td><td>${cell(votes(mr, 'thumbsdown'))}</td>
      <td>${h(list(members.filter((u) => !voted.has(u.username)))) || '—'}</td>
      <td>${missing.map((l) => l.toUpperCase()).join(', ') || '—'}</td>
      <td>${mr.detailedMergeStatus === 'MERGEABLE' ? L.ready : `${L.blocked} ${h(mr.detailedMergeStatus.toLowerCase().replace(/_/g, ' '))}`}</td>
      <td>${mr.userPermissions.canMerge ? `<gcds-button size="small" data-accept="${h(mr.iid)}" ${ready ? '' : 'disabled'}
        title="${missing.length ? L.needsBoth : ''}">${L.accept}</gcds-button>
        <gcds-button size="small" button-role="danger" data-reject="${h(mr.iid)}">${L.reject}</gcds-button>` : '—'}</td></tr>`;
  });
  return `${back()}<gcds-heading tag="h1">${L.chair}</gcds-heading><gcds-text>${L.chairIntro}</gcds-text>
    ${rows.length ? `<div class="adr-scroll"><table class="adr-table"><thead><tr><th scope="col">${L.decision}</th>
      <th scope="col">👍 ${L.for}</th><th scope="col">👎 ${L.against}</th><th scope="col">${L.notVoted}</th>
      <th scope="col">${L.translations}</th><th scope="col">${L.mergeStatus}</th><th scope="col">${L.actions}</th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>` : muted(L.none)}`;
}

function render() {
  const [view] = route();
  el.innerHTML = failed ? muted(`${L.error} ${h(failed)}`)
    : !me ? `<gcds-heading tag="h1">${L.title}</gcds-heading><gcds-text>${L.intro}</gcds-text>
      <gcds-button data-action="signin">${L.signIn}</gcds-button>`
    : !project ? muted(`${L.noAccess} ${h(c.project)}.`)
    : view === 'adr' ? docView() : view === 'chair' ? chairView() : listView();
}

async function go() {
  el.innerHTML = muted(L.loading);
  failed = null;
  try { await load(); } catch (e) { failed = e.message; }
  render();
  scrollTo(0, 0);
}

// The tally goes into GitLab with the decision, in both languages, so the record doesn't depend on this site.
const tally = (verdict, mr) => `**${verdict}** — 👍 For / Pour : ${votes(mr, 'thumbsup').length} (${list(votes(mr, 'thumbsup')) || '—'}) · `
  + `👎 Against / Contre : ${votes(mr, 'thumbsdown').length} (${list(votes(mr, 'thumbsdown')) || '—'})`;

async function toggle(mr, n) {
  const on = (await gql(TOGGLE, { id: mr.id, n })).awardEmojiToggle.toggledOn;
  const rest = mr.awardEmoji.nodes.filter((x) => !(x.name === n && x.user?.username === me.username));
  mr.awardEmoji.nodes = on ? [...rest, { name: n, user: me }] : rest;
}

el.addEventListener('click', async (e) => {
  const b = e.target.closest('gcds-button'); // disabled gcds-buttons swallow the click
  if (!b) return;
  if (b.dataset.action === 'signin') return signIn();
  if (b.dataset.reply) return (b.outerHTML = form(b.dataset.reply)); // reply box in that thread; autofocus moves focus there
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
        await gql(NOTE, { id: doc.mr.id, b: who ? `_On behalf of / Au nom de ${who}_\n\n${text}` : text, d: b.dataset.thread || null });
        doc.mr = (await gql(DETAIL, { p: c.project, iid: doc.mr.iid })).project.mergeRequest;
        render();
      }
    }
    const iid = b.dataset.accept || b.dataset.reject;
    const mr = iid && adrs.find((a) => a.mr?.iid === iid)?.mr;
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

// The header's language link switches in place (capture phase, before it navigates).
document.addEventListener('click', (e) => {
  if (!e.composedPath().some((n) => n.tagName === 'GCDS-LANG-TOGGLE')) return;
  e.preventDefault();
  setLang(other());
  render();
}, true);
addEventListener('hashchange', () => (!location.hash || location.hash.startsWith('#/')) && go());

setLang(lang);
await callback();
go();
