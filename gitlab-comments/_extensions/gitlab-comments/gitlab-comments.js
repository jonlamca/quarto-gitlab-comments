// GitLab-backed comments + votes for Quarto pages. One GitLab issue per page; comments are notes.
// Config arrives as data-* on #gitlab-comments (see gitlab-comments.lua). Sign-in: OAuth PKCE, no backend.
document.addEventListener('DOMContentLoaded', () => { // Quarto puts dependency scripts in <head>
  const el = document.getElementById('gitlab-comments');
  if (!el) return;
  // Interface text, picked from the page's `lang:` (Quarto writes it to <html lang>). French: Canadian typography.
  const lang = document.documentElement.lang || 'en';
  const LABELS = {
    en: { loading: 'Loading comments…', unavailable: 'Comments unavailable:', noAccess: "You don't have access to",
      signIn: 'Sign in with GitLab', comments: 'Comments', helpful: 'Was this helpful?', reply: 'Reply', replyAs: 'Reply as',
      commentAs: 'Comment as', yourReply: 'Your reply', yourComment: 'Your comment', view: 'View on GitLab',
      lockedTitle: 'Discussion locked', locked: 'Only project members can comment or vote.' },
    fr: { loading: 'Chargement des commentaires…', unavailable: 'Commentaires non disponibles :', noAccess: "Vous n'avez pas accès à",
      signIn: 'Se connecter avec GitLab', comments: 'Commentaires', helpful: 'Cette page vous a-t-elle été utile?', reply: 'Répondre',
      replyAs: 'Répondre en tant que', commentAs: 'Commenter en tant que', yourReply: 'Votre réponse', yourComment: 'Votre commentaire',
      view: 'Voir dans GitLab', lockedTitle: 'Discussion verrouillée', locked: 'Seuls les membres du projet peuvent commenter ou voter.' },
  };
  const L = LABELS[lang.slice(0, 2)] || LABELS.en;
  el.textContent = L.loading;
  const c = el.dataset;
  const gitlab = (c.gitlab || 'https://gitlab.com').replace(/\/+$/, '');
  const origin = c.origin || location.hostname;
  const offset = document.querySelector('meta[name="quarto:offset"]')?.content; // website root, Quarto-provided
  const pageUrl = location.origin + location.pathname;
  const redirectUri = c.redirectUri || (offset ? new URL(offset, location.href).href : pageUrl);
  const title = `[${origin}] ${c.page}`;
  const votes = c.votes || 'both';
  const pageVotes = votes === 'both' || votes === 'page';
  const noteVotes = votes === 'both' || votes === 'comments';
  const signInLabel = c.signInLabel || L.signIn;
  const s = sessionStorage;
  const h = (x) => String(x ?? '').replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const random = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
  let iid = c.issue || null; // pinned in front matter, or learned on first lookup/creation
  let issue = null;
  let me = null;
  let myName = '';
  let voters = {}; // `${awardable id} ${emoji}` -> [{ name, username }]: who voted, for "mine" and the hover list
  let canAct = true; // false when GitLab won't let this user comment (e.g. locked discussion, not a member)

  // Limit: first 100 threads (system notes count too), search keeps top 5 title matches; paginate when a page outgrows that.
  const READ = `query($p: ID!, $iid: String, $s: String, $in: [IssuableSearchableField!]) { currentUser { username name }
    project(fullPath: $p) { issues(iid: $iid, search: $s, in: $in, first: 5) { nodes { id iid title webUrl upvotes downvotes discussionLocked userPermissions { createNote }
      discussions(first: 100) { nodes { replyId notes { nodes { id body system createdAt author { name }
        awardEmoji { nodes { name user { name username } } } } } } } } } } }`;
  const TOGGLE = `mutation($id: AwardableID!, $n: String!) { awardEmojiToggle(input: { awardableId: $id, name: $n }) { toggledOn errors } }`;
  const NOTE = `mutation($id: NoteableID!, $b: String!, $d: DiscussionID) {
    createNote(input: { noteableId: $id, body: $b, discussionId: $d }) { errors } }`;
  const ISSUE = `mutation($p: ID!, $t: String!, $d: String, $l: [String!]) {
    createIssue(input: { projectPath: $p, title: $t, description: $d, labels: $l }) { issue { id iid } errors } }`;

  async function gql(query, variables) {
    const token = s.getItem('glc:token');
    const r = await fetch(`${gitlab}/api/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 401 && token) { s.removeItem('glc:token'); return gql(query, variables); } // expired: carry on signed out
    const { data, errors } = await r.json();
    const err = errors?.[0]?.message || Object.values(data || {}).find((m) => m?.errors?.length)?.errors[0];
    if (err) throw new Error(err);
    return data;
  }

  async function signIn() {
    const verifier = random();
    const state = random();
    s.setItem('glc:verifier', verifier);
    s.setItem('glc:state', state);
    s.setItem('glc:return', `${location.href.split('#')[0]}#gitlab-comments`); // land back on the comments, not the page top
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    location.href = `${gitlab}/oauth/authorize?${new URLSearchParams({ client_id: c.clientId, redirect_uri: redirectUri,
      response_type: 'code', state, scope: 'api', code_challenge: challenge, code_challenge_method: 'S256' })}`;
  }

  async function callback() {
    const q = new URLSearchParams(location.search);
    const state = s.getItem('glc:state');
    if (!state || !q.has('code') || q.get('state') !== state) return false;
    s.removeItem('glc:state');
    const r = await fetch(`${gitlab}/oauth/token`, { method: 'POST', body: new URLSearchParams({
      client_id: c.clientId, code: q.get('code'), grant_type: 'authorization_code',
      redirect_uri: redirectUri, code_verifier: s.getItem('glc:verifier') }) });
    if (r.ok) s.setItem('glc:token', (await r.json()).access_token);
    else console.error('gitlab-comments: token exchange failed', await r.text());
    location.replace(s.getItem('glc:return') || redirectUri);
    return true;
  }

  // Issue has upvotes/downvotes but no award list in GraphQL, so who voted on the page comes from REST.
  async function issueAwards() {
    const token = s.getItem('glc:token');
    // Limit: first 100 awards; past that, the hover list ends in "+N" and "mine" may miss; paginate if pages get that popular.
    const r = await fetch(`${gitlab}/api/v4/projects/${encodeURIComponent(c.project)}/issues/${issue.iid}/award_emoji?per_page=100`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return r.ok ? r.json() : [];
  }

  // UI is GC Design System web components (loaded by the filter); spacing and colours use its tokens.
  const who = (id, n) => voters[`${id} ${n}`] || [];
  const voteBtn = (id, n, count) => {
    const users = who(id, n);
    const names = users.slice(0, 10).map((u) => u.name); // hover list, like GitLab's: first names, then "+N"
    const tip = [...names, ...(count > names.length ? [`+${count - names.length}`] : [])].join(', ');
    const on = users.some((u) => u.username === me);
    return `<gcds-button size="small" button-role="${on ? 'primary' : 'secondary'}" data-vote="${n}" data-id="${h(id)}"
      aria-pressed="${on}" title="${h(tip)}" ${canAct ? '' : 'disabled'}>${n === 'thumbsup' ? '👍' : '👎'} ${count}</gcds-button>`;
  };
  const bar = (id, up, down, label = '') => `<div style="display: flex; align-items: center; gap: var(--gcds-spacing-100); margin-bottom: var(--gcds-spacing-200)">
    ${label && `<gcds-text margin-bottom="0">${h(label)}</gcds-text>`}
    ${voteBtn(id, 'thumbsup', up)}${voteBtn(id, 'thumbsdown', down)}</div>`;
  const noteBar = (n) => bar(n.id, who(n.id, 'thumbsup').length, who(n.id, 'thumbsdown').length);

  const indent = 'margin-left: var(--gcds-spacing-400)';
  const comment = (n, reply) => `<div style="${reply ? `${indent}; padding-left: var(--gcds-spacing-300); border-left: var(--gcds-border-width-lg) solid var(--gcds-color-grayscale-100)` : ''}">
    <gcds-text size="caption" text-role="secondary" margin-bottom="0">${h(n.author?.name)} · ${new Date(n.createdAt).toLocaleDateString(lang)}</gcds-text>
    <gcds-text margin-bottom="100" style="white-space: pre-wrap">${h(n.body.replace(/\n\n— via [^\n]*$/, ''))}</gcds-text>
    ${noteVotes ? noteBar(n) : ''}</div>`;

  // Same box for new comments and replies; data-thread is empty for a new top-level comment.
  const form = (thread = '') => `<gcds-textarea textarea-id="glc-${h(thread.split('/').pop() || 'new')}" name="comment" rows="3"
      label="${thread ? L.yourReply : L.yourComment}" ${thread ? 'autofocus' : ''}></gcds-textarea>
    <gcds-button size="small" data-action="post" data-thread="${h(thread)}">${thread ? L.replyAs : L.commentAs} ${h(me)}</gcds-button>`;
  const muted = (text) => `<gcds-text text-role="secondary">${text}</gcds-text>`;

  async function render() {
    let d;
    try {
      d = await gql(READ, iid ? { p: c.project, iid } : { p: c.project, s: title, in: ['TITLE'] });
    } catch (e) {
      el.innerHTML = muted(`${L.unavailable} ${h(e.message)}`);
      return;
    }
    me = d.currentUser?.username || null;
    myName = d.currentUser?.name;
    const signInBtn = `<gcds-button>${h(signInLabel)}</gcds-button>`;
    if (!d.project) { // private project and signed out, or no access
      el.innerHTML = me ? muted(`${L.noAccess} ${h(c.project)}.`) : signInBtn;
      return;
    }
    issue = d.project.issues.nodes.find((i) => iid || i.title === title) || null;
    if (issue) iid = issue.iid;
    // GitLab's lock rule blocks notes and award emoji together for non-members, so createNote gates both.
    // Signed out, GitLab can't say yet: allow (buttons start sign-in) unless locked; members can still use Sign in.
    canAct = me ? issue?.userPermissions.createNote ?? true : !issue?.discussionLocked;
    voters = {};
    const add = (id, awards) => awards.forEach((a) => a.user && (voters[`${id} ${a.name}`] ||= []).push(a.user));
    if (issue && pageVotes) add(issue.id, await issueAwards());
    issue?.discussions.nodes.forEach((t) => t.notes.nodes.forEach((n) => add(n.id, n.awardEmoji.nodes)));
    el.innerHTML = `<gcds-heading tag="h2">${L.comments}</gcds-heading>
      ${issue?.discussionLocked ? `<gcds-notice type="info" notice-title-tag="h3" notice-title="${L.lockedTitle}"
        style="display: block; margin-bottom: var(--gcds-spacing-300)"><gcds-text>${L.locked}</gcds-text></gcds-notice>` : ''}
      ${pageVotes ? bar(issue?.id, issue?.upvotes || 0, issue?.downvotes || 0, c.voteLabel || L.helpful) : ''}
      ${(issue?.discussions.nodes || []).filter((t) => !t.notes.nodes[0]?.system).map((t) =>
        `<div style="border-top: var(--gcds-border-width-sm) solid var(--gcds-color-grayscale-100); padding: var(--gcds-spacing-200) 0">
        ${t.notes.nodes.map((n, i) => comment(n, i > 0)).join('')}
        ${canAct ? `<div style="${indent}"><gcds-button button-role="secondary" size="small" data-reply="${h(t.replyId)}">${L.reply}</gcds-button></div>` : ''}</div>`).join('')}
      <div style="margin-top: var(--gcds-spacing-200)">${!me ? signInBtn : canAct ? form() : ''}</div>
      ${issue ? `<gcds-text size="caption" margin-top="200"><gcds-link href="${h(issue.webUrl)}">${L.view}</gcds-link></gcds-text>` : ''}`;
  }

  async function ensureIssue() {
    if (issue) return issue.id;
    const d = await gql(ISSUE, { p: c.project, t: title, l: [origin],
      d: `Comments on [${document.title}](${pageUrl}) from **${origin}** (\`${c.page}\`).` });
    issue = d.createIssue.issue;
    iid = issue.iid;
    return issue.id;
  }

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('gcds-button'); // disabled gcds-buttons swallow the click
    if (!b) return;
    if (!me) return signIn(); // any button while signed out starts sign-in
    if (b.dataset.reply) return (b.outerHTML = form(b.dataset.reply)); // reply box in that thread; autofocus moves focus there
    b.disabled = true;
    try {
      if (b.dataset.vote) { // swap just this button: a re-render would wipe half-typed comments
        const [id, n] = [b.dataset.id || (await ensureIssue()), b.dataset.vote];
        const on = (await gql(TOGGLE, { id, n })).awardEmojiToggle.toggledOn;
        voters[`${id} ${n}`] = who(id, n).filter((u) => u.username !== me).concat(on ? [{ name: myName, username: me }] : []);
        // New element, since gcds-button only copies aria-pressed to its inner <button> on load.
        b.insertAdjacentHTML('afterend', voteBtn(id, n, +b.textContent.trim().split(' ')[1] + (on ? 1 : -1)));
        const nb = b.nextElementSibling;
        b.remove();
        await nb.componentOnReady?.();
        return nb.focus();
      } else if (b.dataset.action === 'post') {
        const body = b.previousElementSibling.value.trim();
        if (body) await gql(NOTE, { id: await ensureIssue(), b: `${body}\n\n— via ${origin}: ${pageUrl}`, d: b.dataset.thread || null });
        await render();
      }
    } catch (err) {
      alert(`GitLab: ${err.message}`); // nothing re-rendered, so typed text is kept
    }
    b.disabled = false;
  });

  callback().then((done) => done || render(), render);
});
