// gitlab-adr: Architecture Decision Records kept in a GitLab repository, in English and French, with GC Design System.
// A meeting is an open merge request whose title matches titlePattern (e.g. "2026-11-20 - Meeting"). Each Markdown file
// it changes is a separate proposal (NNNN-slug-en.md and -fr.md are one proposal in two languages) with its own vote,
// comments and decision. Committee members, listed in members.json in the ADR folder, vote 👍/👎 on a ballot comment the
// site adds to the proposal's file; anyone with access comments on a paragraph, the file or the meeting. The chair
// (anyone GitLab lets merge) accepts or rejects each proposal, then closes the meeting: proposals not accepted are taken
// out of the branch and the rest is merged, so the default branch holds only accepted decisions.
// No backend: OAuth PKCE in the browser, then GitLab's CORS-enabled APIs. Settings: config.json, set at deploy time.
// Routes: #/ (list), #/chair, #/members, and a file's path for one proposal, e.g. #/adr/0007-use-postgres-en.md.

const el = document.getElementById('adr');
const c = await fetch('config.json').then((r) => r.json()).catch(() => ({}));
const gitlab = (c.gitlab || 'https://gitlab.com').replace(/\/+$/, '');
const folder = (c.folder || 'adr').replace(/^\/+|\/+$/g, '');
const pattern = (() => { try { return new RegExp(c.titlePattern ?? '', 'i'); } catch { return null; } })(); // empty: every open MR
const TERMS = `${folder}/0000-terms-of-reference`;
const MEMBERS_FILE = `${folder}/members.json`;
const ROLES = ['chair', 'vice-chair', 'member', 'observer']; // labels only: everyone on the list votes
const BALLOT = '**Vote / Vote**'; // first line of the ballot comment on each proposal
const BALLOT_BODY = `${BALLOT}\n\nCommittee members: react 👍 For or 👎 Against on this comment. Only votes from people on the member list count.\n\n`
  + 'Membres du comité : réagissez à ce commentaire avec 👍 Pour ou 👎 Contre. Seuls les votes des personnes inscrites sur la liste des membres comptent.';
const redirectUri = location.origin + location.pathname; // register this exact URL on the GitLab application
const s = sessionStorage;

// Interface text. French follows Canadian typography: no space before ? ; ! and a non-breaking space before :.
const LABELS = {
  en: {
    title: 'Architecture decisions', terms: 'Terms of reference', members: 'Members', noConfig: 'Set project and clientId in config.json.',
    badPattern: 'titlePattern in config.json is not a valid regular expression.', signIn: 'Sign in with GitLab', loading: 'Loading…', error: 'GitLab error:',
    intro: 'Proposed and accepted architecture decision records. Committee members vote on each proposal at a meeting; the chair accepts or rejects it.',
    noAccess: "You don't have access to", proposed: 'Proposed', accepted: 'Accepted', statusProposed: 'Proposed',
    statusAccepted: 'Accepted', decAccepted: 'Accepted', decRejected: 'Rejected',
    willMerge: 'Accepted at the meeting; merged when the meeting closes.', willGo: 'Rejected at the meeting; taken out when the meeting closes.',
    none: 'None yet.', acceptedOn: 'Accepted', yourVote: 'Your vote:', for: 'For', against: 'Against', all: 'All decisions',
    chair: 'Chair view', notFound: 'This file was not found.', meeting: 'Meeting',
    chairIntro: 'Votes on each proposal at open meetings. Accept or reject each one; then close the meeting to merge the accepted proposals.',
    missingTitle: 'Translation missing', missing: 'This file is not available in English yet. It is shown in French.',
    others: 'At this meeting', supporting: 'Supporting files:', removed: 'removed', comment: 'Comment', onPara: ' on this paragraph',
    fileComments: 'Comments on this file', meetingDiscussion: 'Meeting discussion', line: 'Line', earlier: 'On an earlier version, line',
    vote: 'Vote', notCounted: 'Not counted (not on the member list):', onlyMembers: 'Only committee members can vote.',
    noComments: 'No comments yet.', reply: 'Reply', replyAs: 'Reply as', commentAs: 'Comment as', yourReply: 'Your reply',
    yourComment: 'Your comment', onBehalf: 'On behalf of', myself: 'Myself', onBehalfHint: 'Chair only: record a comment a member made at a meeting.',
    proposal: 'Proposal', notVoted: 'Not yet voted', translations: 'Missing translation', mergeStatus: 'Merge status:',
    decision: 'Decision', actions: 'Actions', ready: 'Ready', blocked: 'Blocked:', needsBoth: 'Needs both languages', accept: 'Accept',
    reject: 'Reject', closeMeeting: 'Close meeting', closeHint: 'Merges the accepted proposals and takes the others out of this merge request.',
    confirmClose: 'Close this meeting? The accepted proposals are merged; the others are taken out of the merge request.', acceptedList: 'Accepted:', takenOut: 'Taken out:',
    changed: 'New commits were pushed after this page loaded. Check the proposals and votes, then try again.',
    membersTitle: 'Committee members', membersIntro: 'Only these people’s votes count, and the chair view lists the ones who haven’t voted.',
    noListTitle: 'No member list yet', noList: 'Everyone with Reporter access or higher counts as a member until the chair saves a list on the Members page.',
    filter: 'Find by name or username', candidates: 'People with Reporter access or higher to the GitLab project. To add someone else, give them access in GitLab first.',
    noAccessNote: 'no access', save: 'Save member list', roleFor: 'Role for',
    roles: { chair: 'Chair', 'vice-chair': 'Vice-chair', member: 'Member', observer: 'Observer' },
  },
  fr: {
    title: "Décisions d'architecture", terms: 'Cadre de référence', members: 'Membres', noConfig: 'Indiquez project et clientId dans config.json.',
    badPattern: "titlePattern dans config.json n'est pas une expression régulière valide.", signIn: 'Se connecter avec GitLab', loading: 'Chargement…', error: 'Erreur GitLab :',
    intro: "Dossiers de décisions d'architecture proposés et acceptés. Les membres du comité votent sur chaque proposition lors d'une réunion; la présidence l'accepte ou la rejette.",
    noAccess: "Vous n'avez pas accès à", proposed: 'Proposées', accepted: 'Acceptées', statusProposed: 'Proposée',
    statusAccepted: 'Acceptée', decAccepted: 'Acceptée', decRejected: 'Rejetée',
    willMerge: 'Acceptée lors de la réunion; fusionnée à la clôture de la réunion.', willGo: 'Rejetée lors de la réunion; retirée à la clôture de la réunion.',
    none: 'Aucune pour le moment.', acceptedOn: 'Acceptée le', yourVote: 'Votre vote :', for: 'Pour', against: 'Contre',
    all: 'Toutes les décisions', chair: 'Vue de la présidence', notFound: 'Ce fichier est introuvable.', meeting: 'Réunion',
    chairIntro: 'Votes sur chaque proposition des réunions ouvertes. Acceptez ou rejetez chacune, puis clôturez la réunion pour fusionner les propositions acceptées.',
    missingTitle: 'Traduction manquante', missing: "Ce fichier n'est pas encore disponible en français. Il est affiché en anglais.",
    others: 'À cette réunion', supporting: "Fichiers d'appui :", removed: 'supprimé', comment: 'Commenter', onPara: ' ce paragraphe',
    fileComments: 'Commentaires sur ce fichier', meetingDiscussion: 'Discussion de la réunion', line: 'Ligne',
    earlier: 'Sur une version antérieure, ligne', vote: 'Vote', notCounted: 'Non comptés (absents de la liste des membres) :',
    onlyMembers: 'Seuls les membres du comité peuvent voter.', noComments: 'Aucun commentaire pour le moment.', reply: 'Répondre',
    replyAs: 'Répondre en tant que', commentAs: 'Commenter en tant que', yourReply: 'Votre réponse', yourComment: 'Votre commentaire',
    onBehalf: 'Au nom de', myself: 'Moi-même', onBehalfHint: "Présidence seulement : consigner un commentaire fait par un membre lors d'une réunion.",
    proposal: 'Proposition', notVoted: "N'ont pas encore voté", translations: 'Traduction manquante', mergeStatus: 'État de la fusion\u00a0:',
    decision: 'Décision', actions: 'Actions', ready: 'Prête', blocked: 'Bloquée :', needsBoth: 'Les deux langues sont requises',
    accept: 'Accepter', reject: 'Rejeter', closeMeeting: 'Clôturer la réunion',
    closeHint: 'Fusionne les propositions acceptées et retire les autres de cette demande de fusion.',
    confirmClose: 'Clôturer cette réunion? Les propositions acceptées seront fusionnées; les autres seront retirées de la demande de fusion.',
    acceptedList: 'Acceptées\u00a0:', takenOut: 'Retirées\u00a0:', changed: 'De nouveaux commits ont été poussés après le chargement de cette page. Vérifiez les propositions et les votes, puis réessayez.',
    membersTitle: 'Membres du comité', membersIntro: "Seuls les votes de ces personnes comptent, et la vue de la présidence indique celles qui n'ont pas encore voté.",
    noListTitle: 'Pas encore de liste des membres', noList: "Toute personne ayant le rôle Reporter ou un rôle supérieur compte comme membre jusqu'à ce que la présidence enregistre une liste dans la page Membres.",
    filter: "Chercher par nom ou nom d'utilisateur", candidates: "Personnes ayant le rôle Reporter ou un rôle supérieur dans le projet GitLab. Pour ajouter quelqu'un d'autre, donnez-lui d'abord accès dans GitLab.",
    noAccessNote: 'sans accès', save: 'Enregistrer la liste des membres', roleFor: 'Rôle de',
    roles: { chair: 'Présidence', 'vice-chair': 'Vice-présidence', member: 'Membre', observer: 'Personne observatrice' },
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
const caption = (t) => `<gcds-text size="caption" text-role="secondary" margin-bottom="0">${t}</gcds-text>`;
const notice = (title, text) => `<gcds-notice type="info" notice-title-tag="h2" notice-title="${h(title)}"
  style="display: block; margin-bottom: var(--gcds-spacing-300)"><gcds-text>${text}</gcds-text></gcds-notice>`;
const list = (users) => users.map((u) => u.name).join(', ');
const hover = (users) => { // like GitLab: first 10 names, then +N
  const n = users.slice(0, 10).map((u) => u.name);
  return [...n, ...(users.length > n.length ? [`+${users.length - n.length}`] : [])].join(', ');
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Limit: first 100 of each list (open and merged MRs, files, diffs, project members, threads, reactions); paginate when outgrown.
const MR = `id iid title webUrl state sourceBranch diffHeadSha detailedMergeStatus mergedAt author { name } diffStats { path }
  userPermissions { canMerge createNote }`;
const LIST = `query($p: ID!, $f: String!) { currentUser { username name }
  project(fullPath: $p) { userPermissions { pushCode } repository { rootRef tree(path: $f, recursive: true) { blobs(first: 100) { nodes { path } } } }
    projectMembers(first: 100) { nodes { accessLevel { integerValue } user { name username } } }
    open: mergeRequests(state: opened, first: 100) { nodes { ${MR} } }
    merged: mergeRequests(state: merged, sort: MERGED_AT_DESC, first: 100) { nodes { iid title mergedAt diffStats { path } } } } }`;
const BLOBS = `query($p: ID!, $r: String!, $paths: [String!]!) { project(fullPath: $p) { repository {
  blobs(ref: $r, paths: $paths, first: 100) { nodes { path rawTextBlob } } } } }`;
const DETAIL = `query($p: ID!, $iid: String!) { project(fullPath: $p) { mergeRequest(iid: $iid) { ${MR} diffRefs { baseSha headSha startSha }
  discussions(first: 100) { nodes { replyId notes { nodes { id body bodyHtml system createdAt author { name username }
    awardEmoji { nodes { name user { name username } } } position { positionType newPath oldPath newLine oldLine diffRefs { headSha } } } } } } } } }`;
const HEAD = `query($p: ID!, $iid: String!) { project(fullPath: $p) { mergeRequest(iid: $iid) { diffHeadSha } } }`;
const TOGGLE = `mutation($id: AwardableID!, $n: String!) { awardEmojiToggle(input: { awardableId: $id, name: $n }) { toggledOn errors } }`;
const NOTE = `mutation($id: NoteableID!, $b: String!, $d: DiscussionID) { createNote(input: { noteableId: $id, body: $b, discussionId: $d }) { errors } }`;
const ACCEPT = `mutation($p: ID!, $iid: String!, $sha: String!) { mergeRequestAccept(input: { projectPath: $p, iid: $iid, sha: $sha }) { errors } }`;
const CLOSE = `mutation($p: ID!, $iid: String!) { mergeRequestUpdate(input: { projectPath: $p, iid: $iid, state: CLOSED }) { errors } }`;
const COMMIT = `mutation($p: ID!, $b: String!, $m: String!, $a: [CommitAction!]!) {
  commitCreate(input: { projectPath: $p, branch: $b, message: $m, actions: $a }) { commit { sha } errors } }`;

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
const blobsAt = (r, paths) => (paths.length ? gql(BLOBS, { p: c.project, r, paths })
  .then((x) => Object.fromEntries(x.project.repository.blobs.nodes.map((b) => [b.path, b.rawTextBlob]))) : {});
const detail = async (iid) => (await gql(DETAIL, { p: c.project, iid })).project.mergeRequest;
const headOf = async (iid) => (await gql(HEAD, { p: c.project, iid })).project.mergeRequest.diffHeadSha;

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
let rootRef = 'main';
let meetings = []; // open merge requests whose title matches titlePattern
let details = {}; // iid -> merge request with discussions (open meetings, and the one that accepted the file on screen)
let byKey = {}; // proposals: Markdown files by path without -en/-fr.md: { key, main: {lang: path} on the default branch,
                // prop: {lang: path} in the meeting mr, mr, merged: newest meeting that touched it, text: {lang} }. lang: en, fr or ''
let doc = null; // the proposal on screen: { a, mr (= details[iid]), html: {en, fr, ''} }
let people = []; // project members with Reporter access or higher: the people who can be on the committee
let members = []; // the committee: members.json, or everyone in people until there is one
let hasList = false;
let maintainers = new Set(); // usernames whose decisions count
let failed = null;

const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const href = (p) => `#/${enc(p)}`;
const route = () => { try { return decodeURIComponent(location.hash.slice(2)); } catch { return ''; } }; // '', chair, members or a path
const isMd = (p) => p.endsWith('.md');
const langOf = (p) => p.match(/-(en|fr)\.md$/)?.[1] ?? '';
const keyOf = (p) => p.replace(/(-(en|fr))?\.md$/, '');
const base = (p) => p.split('/').pop();
const variants = (a) => ({ ...a.main, ...a.prop });
const pathFor = (a) => { const v = variants(a); return v[lang] ?? v[other()] ?? v['']; };
const removed = (a) => Object.keys(a.prop).length && Object.keys(a.prop).every((l) => a.text[l] == null);
const proposalsOf = (mr) => { // in the merge request's file order, one entry per language pair
  const seen = new Set();
  return (mr.diffStats || []).map(({ path }) => isMd(path) && byKey[keyOf(path)]).filter((a) => a && a.mr?.iid === mr.iid && !seen.has(a) && seen.add(a));
};

// Votes: 👍/👎 reactions on the proposal's ballot, a file comment starting with BALLOT. Only current members' reactions count.
// Decisions: the latest reply in the ballot thread starting "**Accepted /" or "**Rejected /" by someone with Maintainer access.
// A decision carries its tally (also as JSON in an HTML comment, which GitLab doesn't show), and from then on that tally is
// what the site shows, so later changes to the member list don't rewrite past decisions.
const ballotPath = (a) => a.prop.en ?? a.prop.fr ?? a.prop[''] ?? a.main.en ?? a.main.fr ?? a.main[''];
const isBallot = (t) => t.notes.nodes[0]?.body?.startsWith(BALLOT);
const ballot = (mr, a) => mr?.discussions.nodes.find((t) => isBallot(t) && t.notes.nodes[0].position?.newPath === ballotPath(a)); // first, if two were started at once
const reactors = (x, n) => (x?.awardEmoji.nodes || []).filter((r) => r.name === n && r.user).map((r) => r.user);
const isMember = (u) => members.some((m) => m.username === u.username);
const roleOf = (u) => members.find((m) => m.username === u.username)?.role;
const named = (users) => users.map((u) => (roleOf(u) && roleOf(u) !== 'member' ? `${u.name} (${L.roles[roleOf(u)]})` : u.name)).join(', ');
const decisionNote = (mr, a) => [...(ballot(mr, a)?.notes.nodes || [])].reverse()
  .find((x) => maintainers.has(x.author?.username) && /^\*\*(Accepted|Rejected) \//.test(x.body));
const decision = (mr, a) => decisionNote(mr, a)?.body.match(/^\*\*(\w+)/)[1];
const frozen = (mr, a) => { try { return JSON.parse(decisionNote(mr, a).body.match(/<!-- tally (.+?) -->/)[1]); } catch { return null; } };
const live = (mr, a, n) => reactors(ballot(mr, a)?.notes.nodes[0], n).filter(isMember);
const votes = (mr, a, n) => frozen(mr, a)?.[n] ?? live(mr, a, n);
const uncounted = (mr, a) => (frozen(mr, a) ? [] : ['thumbsup', 'thumbsdown'].flatMap((n) => reactors(ballot(mr, a)?.notes.nodes[0], n).filter((u) => !isMember(u))));
const mine = (x, n) => reactors(x, n).some((u) => u.username === me.username);

async function load() {
  doc = null;
  me = null;
  if (!s.getItem('adr:token')) return;
  const d = await gql(LIST, { p: c.project, f: folder });
  me = d.currentUser;
  project = d.project;
  if (!me || !project) return;
  rootRef = project.repository.rootRef;
  const pm = project.projectMembers.nodes.filter((m) => m.user);
  people = pm.filter((m) => m.accessLevel.integerValue >= 20).map((m) => m.user);
  maintainers = new Set(pm.filter((m) => m.accessLevel.integerValue >= 40).map((m) => m.user.username));
  const rfc = (mr) => pattern.test(mr.title);
  meetings = project.open.nodes.filter(rfc);
  byKey = {};
  const entry = (path) => (byKey[keyOf(path)] ||= { key: keyOf(path), main: {}, prop: {}, text: {} });
  for (const { path } of project.repository.tree?.blobs.nodes || []) if (isMd(path)) entry(path).main[langOf(path)] = path;
  for (const mr of meetings) for (const { path } of mr.diffStats || []) {
    if (isMd(path) && (entry(path).mr ||= mr) === mr) byKey[keyOf(path)].prop[langOf(path)] = path; // Limit: two meetings on one file, first wins
  }
  for (const mr of project.merged.nodes.filter(rfc)) for (const { path } of mr.diffStats || []) {
    if (byKey[keyOf(path)]) byKey[keyOf(path)].merged ||= mr;
  }

  // Text: a proposal's files from its meeting's branch, everything else (and members.json) from the default branch.
  const docs = Object.values(byKey);
  const [main, ...branches] = await Promise.all([blobsAt(rootRef, [...docs.flatMap((a) => Object.values(a.main)), MEMBERS_FILE]),
    ...meetings.map((mr) => blobsAt(mr.sourceBranch, docs.filter((a) => a.mr === mr).flatMap((a) => Object.values(a.prop))))]);
  for (const a of docs) for (const l of Object.keys(variants(a))) {
    a.text[l] = a.prop[l] ? branches[meetings.indexOf(a.mr)][a.prop[l]] : main[a.main[l]]; // none: removed
  }
  try {
    members = JSON.parse(main[MEMBERS_FILE]).members.filter((u) => u.username).map((u) => ({ ...u, role: ROLES.includes(u.role) ? u.role : 'member' }));
    hasList = true;
  } catch { members = people.map((u) => ({ ...u, role: 'member' })); hasList = false; }

  // Votes, comments and decisions: one query per open meeting (usually one or two), plus the meeting that accepted the file shown.
  const a = byKey[keyOf(route())];
  const iids = [...meetings.map((mr) => mr.iid), ...(a && !a.mr && a.merged ? [a.merged.iid] : [])];
  details = Object.fromEntries(await Promise.all(iids.map(async (iid) => [iid, await detail(iid)])));
  if (a) {
    const [en, fr, none] = await Promise.all(['en', 'fr', ''].map((l) => a.text[l] != null && markdown(a.text[l])));
    doc = { a, mr: details[(a.mr || a.merged)?.iid], html: { en, fr, '': none } };
  }
}

const title = (a) => (a.text[lang] ?? a.text[other()] ?? a.text[''])?.match(/^#\s+(.+)$/m)?.[1].trim() || base(a.key);
const num = (a) => base(a.key).match(/^\d+/)?.[0];
const label = (a) => (num(a) ? `${num(a)} · ${title(a)}` : title(a));
const docLink = (a) => (removed(a) ? `${h(label(a))} (${L.removed})` : `<gcds-link href="${h(href(pathFor(a)))}">${h(label(a))}</gcds-link>`);
const blobLink = (mr, path) => `<gcds-link href="${h(`${gitlab}/${c.project}/-/blob/${enc(mr.sourceBranch)}/${enc(path)}`)}" external>${h(base(path))}</gcds-link>`;
const intro = () => `<gcds-heading tag="h1" margin-bottom="200">${h(site())}</gcds-heading>
  ${c.subtitle ? `<p class="adr-subtitle">${h(tr(c.subtitle))}</p>` : ''}<gcds-text>${L.intro}</gcds-text>`;
const back = () => `<p><gcds-link href="#/">← ${L.all}</gcds-link></p>`;
const decLabel = (dec) => (dec === 'Accepted' ? L.decAccepted : dec === 'Rejected' ? L.decRejected : '');
const missingLangs = (a) => { // only for files named -en.md / -fr.md
  const langs = Object.keys(variants(a));
  return langs.some(Boolean) ? ['en', 'fr'].filter((l) => !langs.includes(l)) : [];
};

// A meeting's proposals (current one in bold) and its supporting files, which link to GitLab.
const files = (mr, current) => `<ul class="adr-files">${proposalsOf(mr).map((a) => `<li>${a === current
  ? `<strong aria-current="page">${h(label(a))}</strong>` : docLink(a)}</li>`).join('')}
  ${(mr.diffStats || []).filter((x) => !isMd(x.path)).map((x) => `<li>${blobLink(mr, x.path)}</li>`).join('')}</ul>`;

function listView() {
  const yourVote = (m, a) => {
    const x = ballot(m, a)?.notes.nodes[0];
    const v = mine(x, 'thumbsup') ? L.for : mine(x, 'thumbsdown') ? L.against : '';
    return v ? ` · ${L.yourVote} ${v}` : '';
  };
  const meeting = (mr) => {
    const m = details[mr.iid];
    const props = proposalsOf(mr).map((a) => `<li>${docLink(a)}${caption(`👍 ${votes(m, a, 'thumbsup').length} · 👎 ${votes(m, a, 'thumbsdown').length}${yourVote(m, a)}${
      decision(m, a) ? ` · <strong>${decLabel(decision(m, a))}</strong>` : ''}`)}</li>`);
    const other = (mr.diffStats || []).filter((x) => !isMd(x.path));
    return `<gcds-heading tag="h3">${h(mr.title)}</gcds-heading>
      ${props.length ? `<ul class="adr-list">${props.join('')}</ul>` : muted(L.none)}
      ${other.length ? `<p>${caption(`${L.supporting} ${other.map((x) => blobLink(mr, x.path)).join(', ')}`)}</p>` : ''}`;
  };
  // Accepted decisions: -en.md / -fr.md files on the default branch (not a README), newest number first.
  const acc = Object.values(byKey).filter((a) => Object.keys(a.main).some(Boolean)).sort((a, b) => base(b.key).localeCompare(base(a.key)))
    .map((a) => `<li><gcds-link href="${h(href(pathFor(a)))}">${h(label(a))}</gcds-link>
      ${caption(a.merged ? `${L.acceptedOn} ${day(a.merged.mergedAt)}` : L.statusAccepted)}</li>`);
  const terms = byKey[TERMS];
  return `${intro()}
    <p>${terms ? `<gcds-link href="${h(href(pathFor(terms)))}">${L.terms}</gcds-link> · ` : ''}<gcds-link href="#/members">${L.members}</gcds-link> ·
      <gcds-link href="#/chair">${L.chair}</gcds-link></p>
    <gcds-heading tag="h2">${L.proposed}</gcds-heading>
    ${meetings.map(meeting).join('') || muted(L.none)}
    <gcds-heading tag="h2">${L.accepted}</gcds-heading>
    ${acc.length ? `<ul class="adr-list">${acc.join('')}</ul>` : muted(L.none)}`;
}

const voteBar = (mr, a) => ['thumbsup', 'thumbsdown'].map((n) => {
  const users = votes(mr, a, n);
  const on = mine(ballot(mr, a)?.notes.nodes[0], n);
  const can = mr.state === 'opened' && mr.userPermissions.createNote && isMember(me) && !decision(mr, a) && !!a.prop[langOf(ballotPath(a))];
  return `<gcds-button size="small" button-role="${on ? 'primary' : 'secondary'}" data-vote="${n}" aria-pressed="${on}"
    title="${h(hover(users))}" ${can ? '' : 'disabled'}>${n === 'thumbsup' ? `👍 ${L.for}` : `👎 ${L.against}`} ${users.length}</gcds-button>`;
}).join('');

const note = (n, reply) => `<div${reply ? ' class="adr-reply"' : ''}>
  ${caption(`${h(n.author?.name)} · ${day(n.createdAt)}`)}
  <div class="adr-md adr-note">${fix(n.bodyHtml)}</div></div>`;
const thread = (t, canAct, where = '') => `<div class="adr-thread">${where ? caption(where) : ''}
  ${t.notes.nodes.map((n, i) => note(n, i > 0)).join('')}
  ${canAct ? `<div class="adr-act"><gcds-button button-role="secondary" size="small" data-reply="${h(t.replyId)}">${L.reply}</gcds-button></div>` : ''}</div>`;

// One box for every comment: { thread } replies, { at: line } starts a paragraph thread, { at: 'file' } a file thread, and
// nothing a thread on the meeting. The chair also gets "On behalf of" to record what members said at a meeting.
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

// Margin comments. GitLab marks each rendered block with data-sourcepos="startLine:col-endLine:col". Each paragraph gets a
// margin beside it (below it on narrow screens) with the threads on its lines in the current version, and a button that
// starts a thread on its first line.
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
    w.className = `adr-block${here.length ? ' adr-has' : ''}`;
    b.replaceWith(w);
    w.append(b);
    w.insertAdjacentHTML('beforeend', `<div class="adr-margin">${here.map((x) => thread(x, canComment)).join('')}${canComment
      ? `<gcds-button class="adr-c" button-role="secondary" size="small" data-para="${m[1]}">${L.comment}<span class="adr-sr">${L.onPara}</span></gcds-button>` : ''}</div>`);
  }
  return t.innerHTML;
}

// Wide screens: margin cards hang beside their paragraph (height 0 in CSS) instead of pushing the text down, and a card
// that would overlap the one above moves down, as in a word processor. Narrow screens: margins sit below their paragraph.
function stack() {
  const md = el.querySelector('.adr-with-margin');
  if (!md) return;
  md.style.paddingBottom = '';
  const margins = [...md.querySelectorAll('.adr-margin')];
  margins.forEach((m) => { m.style.transform = ''; });
  if (margins[0]?.offsetHeight) return; // narrow screen
  let bottom = 0;
  for (const m of margins) {
    const top = m.getBoundingClientRect().top + scrollY;
    const shift = Math.max(0, bottom - top);
    if (shift) m.style.transform = `translateY(${shift}px)`;
    bottom = top + shift + m.scrollHeight + 12;
  }
  md.style.paddingBottom = `${Math.max(0, bottom - (md.getBoundingClientRect().bottom + scrollY))}px`; // room for the last card
}
const resized = new ResizeObserver(() => requestAnimationFrame(stack)); // window resizes, and cards growing as GCDS renders them

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
  const threads = (mr?.discussions.nodes || []).filter((t) => !t.notes.nodes[0]?.system && !isBallot(t));
  const pos = (t) => t.notes.nodes[0].position;
  const current = (p) => p.diffRefs?.headSha === mr.diffHeadSha; // GitLab moves positions forward when lines survive a push
  const lineOf = (t) => (pos(t).positionType === 'text' && current(pos(t)) ? pos(t).newLine : null);
  const onFile = threads.filter((t) => pos(t) && (pos(t).newPath === path || pos(t).oldPath === path));
  const placed = new Set();
  const body = blocks(html[shown] || '', onFile, lineOf, placed, canComment);
  const where = (p) => (p.positionType !== 'text' ? '' : `${current(p) ? L.line : L.earlier} ${p.newLine ?? p.oldLine}`);
  const show = (ts) => ts.map((t) => thread(t, canAct, where(pos(t) || {}))).join('');
  const dec = a.mr && decision(mr, a);
  const off = mr ? uncounted(mr, a) : [];
  return `${back()}
    <gcds-heading tag="h1">${h(label(a))}</gcds-heading>
    <gcds-text text-role="secondary">${!a.mr ? L.statusAccepted : dec ? `<strong>${dec === 'Accepted' ? L.willMerge : L.willGo}</strong>` : L.statusProposed}${mr
      ? ` · ${L.meeting} <gcds-link href="${h(mr.webUrl)}">${h(mr.title)}</gcds-link>` : ''}</gcds-text>
    ${a.mr && (a.mr.diffStats || []).length > 1 ? `${caption(L.others)}${files(a.mr, a)}` : ''}
    ${shown === other() ? `<gcds-notice type="warning" notice-title-tag="h2" notice-title="${L.missingTitle}"
      style="display: block; margin-bottom: var(--gcds-spacing-300)"><gcds-text>${L.missing}</gcds-text></gcds-notice>` : ''}
    <div class="adr-md${body.includes('adr-margin') ? ' adr-with-margin' : ''}" lang="${shown || lang}">${body}</div>
    ${mr ? `<gcds-heading tag="h2">${L.vote}</gcds-heading><div class="adr-votes" id="adr-votes">${voteBar(mr, a)}</div>
      ${off.length ? `<p>${caption(`${L.notCounted} ${h(list(off))}`)}</p>` : ''}
      ${open && !isMember(me) && !dec ? `<p>${caption(L.onlyMembers)}</p>` : ''}
      <gcds-heading tag="h2">${L.fileComments}</gcds-heading>${show(onFile.filter((t) => !placed.has(t))) || muted(L.noComments)}${canComment ? form({ at: 'file' }) : ''}
      <gcds-heading tag="h2">${L.meetingDiscussion}</gcds-heading>${show(threads.filter((t) => !pos(t))) || muted(L.noComments)}${canAct ? form() : ''}` : ''}`;
}

function chairView() {
  const cell = (users) => `${users.length}${users.length ? `<br>${h(named(users))}` : ''}`;
  const meeting = (mr) => {
    const m = details[mr.iid];
    const rows = proposalsOf(mr).map((a) => {
      const yes = votes(m, a, 'thumbsup');
      const no = votes(m, a, 'thumbsdown');
      const voted = new Set([...yes, ...no].map((u) => u.username));
      const missing = missingLangs(a);
      const off = uncounted(m, a);
      const btn = (v, text, role) => `<gcds-button size="small" button-role="${role}" data-decide="${v}" data-iid="${h(mr.iid)}" data-key="${h(a.key)}"
        ${v === 'Accepted' && missing.length ? `disabled title="${L.needsBoth}"` : ''}>${text}</gcds-button>`;
      return `<tr><th scope="row">${docLink(a)}</th><td>${cell(yes)}</td><td>${cell(no)}</td>
        <td>${decision(m, a) ? '—' : h(named(members.filter((u) => !voted.has(u.username)))) || '—'}${off.length ? `<br>${L.notCounted} ${h(list(off))}` : ''}</td>
        <td>${missing.map((l) => l.toUpperCase()).join(', ') || '—'}</td>
        <td>${decLabel(decision(m, a)) || '—'}</td>
        <td>${mr.userPermissions.canMerge ? `${btn('Accepted', L.accept, 'primary')} ${btn('Rejected', L.reject, 'secondary')}` : '—'}</td></tr>`;
    });
    const ok = mr.detailedMergeStatus === 'MERGEABLE';
    return `<gcds-heading tag="h2">${h(mr.title)}</gcds-heading>
      <gcds-text><gcds-link href="${h(mr.webUrl)}">!${h(mr.iid)}</gcds-link> · ${L.mergeStatus} ${ok ? L.ready
        : `${L.blocked} ${h(mr.detailedMergeStatus.toLowerCase().replace(/_/g, ' '))}`}</gcds-text>
      ${rows.length ? `<div class="adr-scroll"><table class="adr-table"><thead><tr><th scope="col">${L.proposal}</th>
        <th scope="col">👍 ${L.for}</th><th scope="col">👎 ${L.against}</th><th scope="col">${L.notVoted}</th>
        <th scope="col">${L.translations}</th><th scope="col">${L.decision}</th><th scope="col">${L.actions}</th></tr></thead>
        <tbody>${rows.join('')}</tbody></table></div>` : muted(L.none)}
      ${mr.userPermissions.canMerge ? `<p><gcds-button data-close="${h(mr.iid)}" ${ok ? '' : 'disabled'}>${L.closeMeeting}</gcds-button></p>${caption(L.closeHint)}` : ''}`;
  };
  return `${back()}<gcds-heading tag="h1">${L.chair}</gcds-heading><gcds-text>${L.chairIntro}</gcds-text>
    ${hasList ? '' : notice(L.noListTitle, L.noList)}${meetings.map(meeting).join('') || muted(L.none)}`;
}

// The member list is picked from the project's people, so nobody types usernames; each person also gets a role, which is
// shown next to their name and has no effect on voting. Saving commits members.json.
function membersView() {
  const listed = new Set(hasList ? members.map((u) => u.username) : []);
  const roles = (u) => `<select class="adr-role" aria-label="${h(`${L.roleFor} ${u.name}`)}">${ROLES.map((r) => `<option value="${r}"
    ${(roleOf(u) || 'member') === r ? 'selected' : ''}>${L.roles[r]}</option>`).join('')}</select>`;
  const candidates = [...people, ...members.filter((u) => !people.some((p) => p.username === u.username))]
    .sort((x, y) => x.name.localeCompare(y.name));
  const noAccess = (u) => !people.some((p) => p.username === u.username);
  return `${back()}<gcds-heading tag="h1">${L.membersTitle}</gcds-heading><gcds-text>${L.membersIntro}</gcds-text>
    ${hasList ? '' : notice(L.noListTitle, L.noList)}
    ${project.userPermissions.pushCode ? `<gcds-input input-id="adr-filter" name="filter" type="search" label="${L.filter}" hint="${L.candidates}"></gcds-input>
      <ul class="adr-people">${candidates.map((u) => `<li data-q="${h(`${u.name} ${u.username}`.toLowerCase())}"><label>
        <input type="checkbox" value="${h(u.username)}" data-name="${h(u.name)}" ${listed.has(u.username) ? 'checked' : ''}>
        ${h(u.name)} <span class="adr-handle">@${h(u.username)}${noAccess(u) ? ` · ${L.noAccessNote}` : ''}</span></label>${roles(u)}</li>`).join('')}</ul>
      <gcds-button data-action="save-members">${L.save}</gcds-button>`
    : `<ul class="adr-list">${members.map((u) => `<li>${h(u.name)} <span class="adr-handle">@${h(u.username)}</span> · ${L.roles[u.role]}</li>`).join('')}</ul>`}`;
}

function render() {
  const path = route();
  document.title = doc ? `${label(doc.a)} – ${site()}` : site();
  el.innerHTML = !c.project || !c.clientId ? muted(L.noConfig)
    : !pattern ? muted(L.badPattern)
    : failed ? muted(`${L.error} ${h(failed)}`)
    : !me ? `${intro()}<gcds-button data-action="signin">${L.signIn}</gcds-button>`
    : !project ? muted(`${L.noAccess} ${h(c.project)}.`)
    : path === 'chair' ? chairView() : path === 'members' ? membersView() : path ? docView() : listView();
  resized.disconnect();
  el.querySelectorAll('.adr-with-margin, .adr-margin > *').forEach((x) => resized.observe(x));
}

async function go() {
  const l = langOf(route());
  if (l && l !== lang) setLang(l); // a link to a -fr.md file opens in French
  if (!c.project || !c.clientId || !pattern) return render();
  el.innerHTML = muted(L.loading);
  failed = null;
  try { await load(); } catch (e) { failed = e.message; }
  render();
  scrollTo(0, 0);
}

// The tally goes into GitLab with the decision, in both languages, so the record doesn't depend on this site. The same
// tally as JSON lets the site show exactly what was decided, whatever happens to the member list later.
const tally = (verdict, mr, a) => {
  const [yes, no] = ['thumbsup', 'thumbsdown'].map((n) => live(mr, a, n).map(({ username, name }) => ({ username, name })));
  return `**${verdict}** — 👍 For / Pour : ${yes.length} (${list(yes) || '—'}) · 👎 Against / Contre : ${no.length} (${list(no) || '—'})`
    + `\n\n<!-- tally ${JSON.stringify({ thumbsup: yes, thumbsdown: no }).replace(/--/g, '- -')} -->`;
};
const nums = (docs) => docs.map((a) => num(a) ?? base(a.key)).join(', ') || '—';

async function toggle(x, n) {
  const on = (await gql(TOGGLE, { id: x.id, n })).awardEmojiToggle.toggledOn;
  const rest = x.awardEmoji.nodes.filter((r) => !(r.name === n && r.user?.username === me.username));
  x.awardEmoji.nodes = on ? [...rest, { name: n, user: me }] : rest;
}

// File, paragraph and ballot threads are GitLab diff threads. GraphQL can't start file threads, so this uses REST. A comment
// on an unchanged line needs that line's old number too, worked out from the merge request's diff.
async function discuss(mr, path, body, line = null) {
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

// The proposal's ballot thread, started on first use.
async function ballotFor(iid, a) {
  if (!ballot(details[iid], a)) {
    await discuss(details[iid], ballotPath(a), BALLOT_BODY);
    details[iid] = await detail(iid);
    if (doc?.mr?.iid === iid) doc.mr = details[iid];
  }
  return ballot(details[iid], a);
}

// Close a meeting: take the proposals that weren't accepted out of the branch (new files deleted, changed ones put back as
// they are on the default branch), then merge the rest. Nothing accepted: the merge request is closed instead.
async function closeMeeting(iid) {
  const mr = details[iid];
  const props = proposalsOf(mr);
  const keep = props.filter((a) => decision(mr, a) === 'Accepted');
  const drop = props.filter((a) => !keep.includes(a));
  if (!confirm(`${L.confirmClose}\n\n${L.acceptedList} ${nums(keep)}\n${L.takenOut} ${nums(drop)}`)) return;
  if (await headOf(iid) !== mr.diffHeadSha) throw new Error(L.changed); // nothing unreviewed gets merged
  const summary = `**Meeting closed / Réunion terminée**\n\n- Accepted / Acceptées : ${nums(keep)}\n- Taken out / Retirées : ${nums(drop)}`;
  if (!keep.length) {
    await gql(CLOSE, { p: c.project, iid });
    return gql(NOTE, { id: mr.id, b: summary });
  }
  let sha = mr.diffHeadSha;
  if (drop.length) {
    const paths = drop.flatMap((a) => Object.values(a.prop));
    const main = await blobsAt(rootRef, paths);
    const onBranch = (p) => byKey[keyOf(p)].text[langOf(p)] != null;
    const actions = paths.map((p) => (main[p] != null
      ? { action: onBranch(p) ? 'UPDATE' : 'CREATE', filePath: p, content: main[p] }
      : { action: 'DELETE', filePath: p }));
    sha = (await gql(COMMIT, { p: c.project, b: mr.sourceBranch, m: 'Take out proposals not accepted at this meeting', a: actions })).commitCreate.commit.sha;
    // ponytail: polls up to 20 s for GitLab to pick up the push; if it's slower the merge fails and the chair clicks again.
    for (let i = 0; i < 20 && await headOf(iid) !== sha; i++) await wait(1000);
  }
  await gql(ACCEPT, { p: c.project, iid, sha });
  await gql(NOTE, { id: mr.id, b: summary });
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
    stack();
  };
  if (b.dataset.reply) return open(form({ thread: b.dataset.reply })); // reply box in that thread
  if (b.dataset.para) return open(form({ at: b.dataset.para })); // comment box beside that paragraph
  b.disabled = true;
  try {
    if (b.dataset.vote) { // one vote per member: voting For drops an Against, and the other way round
      const n = b.dataset.vote;
      const x = n === 'thumbsup' ? 'thumbsdown' : 'thumbsup';
      const v = (await ballotFor(doc.mr.iid, doc.a)).notes.nodes[0];
      if (!mine(v, n) && mine(v, x)) await toggle(v, x);
      await toggle(v, n);
      document.getElementById('adr-votes').innerHTML = voteBar(doc.mr, doc.a); // just the bar: typed comments survive
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
        if (at) await discuss(doc.mr, shownPath(), body, at === 'file' ? null : +at);
        else await gql(NOTE, { id: doc.mr.id, b: body, d: b.dataset.thread || null });
        doc.mr = details[doc.mr.iid] = await detail(doc.mr.iid);
        render();
      }
    }
    if (b.dataset.decide) { // recorded as a reply in the ballot thread, with the tally; the latest decision counts
      const { iid } = b.dataset;
      const a = byKey[b.dataset.key];
      const t = await ballotFor(iid, a);
      await gql(NOTE, { id: details[iid].id, b: tally(b.dataset.decide === 'Accepted' ? 'Accepted / Acceptée' : 'Rejected / Rejetée', details[iid], a), d: t.replyId });
      details[iid] = await detail(iid);
      return render();
    }
    if (b.dataset.close) {
      try { await closeMeeting(b.dataset.close); } finally { go(); } // reload either way, so a retry starts from GitLab's state
      return;
    }
    if (b.dataset.action === 'save-members') {
      const picked = [...el.querySelectorAll('.adr-people input:checked')]
        .map((i) => ({ username: i.value, name: i.dataset.name, role: i.closest('li').querySelector('.adr-role').value }));
      await gql(COMMIT, { p: c.project, b: rootRef, m: 'Update committee members', a: [{ action: hasList ? 'UPDATE' : 'CREATE',
        filePath: MEMBERS_FILE, content: `${JSON.stringify({ members: picked }, null, 2)}\n` }] });
      return go();
    }
  } catch (err) {
    alert(`GitLab: ${err.message}`); // nothing re-rendered, so typed text is kept
  }
  b.disabled = false;
});

// Members page: filter the people list as you type.
el.addEventListener('input', (e) => {
  if (e.target.getAttribute?.('input-id') !== 'adr-filter') return;
  const q = (e.composedPath()[0].value || '').toLowerCase().trim();
  el.querySelectorAll('.adr-people li').forEach((li) => { li.hidden = !li.dataset.q.includes(q); });
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
