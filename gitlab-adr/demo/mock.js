// Demo only (see run.sh): a fake GitLab in the browser, so gitlab-adr shows sample meetings, votes and comments without a
// GitLab project. Data lives in memory and resets on every reload. Writes are recorded in window.__calls for inspection.
// Never deploy this file: the site you deploy (index.html, adr.js, config.json) doesn't load it.
(() => {
  sessionStorage.setItem('adr:token', 'mock-token'); // signed in as Alex Tremblay (chair), no GitLab needed
  const real = window.fetch;
  window.__calls = [];
  const u = (username, name) => ({ username, name });
  const alex = u('alex', 'Alex Tremblay'), priya = u('priya', 'Priya Shah'), marco = u('marco', 'Marco Rossi'),
    dana = u('dana', 'Dana Kim'), sam = u('sam', 'Sam Okafor'), bob = u('bob', 'Bob Guest'), lee = u('lee', 'Lee Wong'),
    kim = u('kim', 'Kim Nguyen'), ravi = u('ravi', 'Ravi Patel');
  const award = (name, user) => ({ name, user });
  const ago = (d) => new Date(Date.now() - d * 864e5).toISOString();
  let nextNote = 100;
  const n = (user, d, body, { position = null, awards = [], system = false } = {}) => ({ id: `gid://gitlab/Note/${nextNote++}`, body,
    bodyHtml: md(body), system, createdAt: ago(d), author: user, position, awardEmoji: { nodes: awards } });
  const at = (positionType, newPath, newLine, headSha) => ({ positionType, newPath, oldPath: newPath, newLine, oldLine: null, diffRefs: { headSha } });
  const thread = (id, ...notes) => ({ replyId: `gid://gitlab/Discussion/${id}`, notes: { nodes: notes } });
  const BALLOT = '**Vote / Vote**\n\nCommittee members: react 👍 For or 👎 Against on this comment.';
  const perms = { canMerge: true, createNote: true };

  // Tiny stand-in for GitLab's renderer, with data-sourcepos on each top-level block like GitLab's.
  const esc = (t) => t.replace(/[&<>]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const inline = (t) => esc(t).replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<a class="no-attachment-icon" href="$2" target="_blank"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="$1" class="lazy" data-src="$2"></a>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>').replace(/_([^_]+)_/g, '<em>$1</em>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const block = (b, sp) => {
    const m = b.match(/^(#+) (.+)/);
    if (m) return `<h${m[1].length}${sp} dir="auto"><a href="#x" aria-hidden="true" class="anchor" id="user-content-x"></a>${inline(m[2])}</h${m[1].length}>`;
    if (/^(- |\d+\. )/.test(b)) { const tag = b.startsWith('- ') ? 'ul' : 'ol'; return `<${tag}${sp}>${b.split(/\n(?=- |\d+\. )/).map((li) => `<li>${inline(li.replace(/^(- |\d+\. )/, ''))}</li>`).join('')}</${tag}>`; }
    if (b.startsWith('|')) {
      const rows = b.split('\n').filter((r) => !/^\|-/.test(r)).map((r) => r.split('|').slice(1, -1).map((x) => x.trim()));
      return `<table${sp}><thead><tr>${rows[0].map((x) => `<th>${inline(x)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((x) => `<td>${inline(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    return `<p${sp} dir="auto">${inline(b).replace(/\n/g, '<br>')}</p>`;
  };
  function md(text) {
    const lines = text.split('\n');
    const out = [];
    for (let i = 0; i < lines.length;) {
      if (!lines[i].trim()) { i++; continue; }
      const s0 = i;
      if (/^#+ /.test(lines[i])) i++; else while (i < lines.length && lines[i].trim() && !/^#+ /.test(lines[i])) i++;
      out.push(block(lines.slice(s0, i).join('\n'), ` data-sourcepos="${s0 + 1}:1-${i}:${lines[i - 1].length}"`));
    }
    return out.join('\n');
  }

  const P3 = 'adr/0003-adopt-postgres-en.md', P5 = 'adr/0005-pg-backups-en.md', P2 = 'adr/platform/0002-gitlab-as-record-en.md';
  const mrs = {
    7: { id: 'gid://gitlab/MergeRequest/7', iid: '7', title: '2026-11-20 - Meeting', webUrl: 'https://gitlab.example.com/demo/adr/-/merge_requests/7',
      state: 'opened', targetBranch: 'main', sourceBranch: 'meeting-2026-11-20', diffHeadSha: 'abc123', detailedMergeStatus: 'MERGEABLE', mergedAt: null, author: priya,
      diffStats: ['adr/0003-adopt-postgres-en.md', 'adr/0003-adopt-postgres-fr.md', 'adr/0005-pg-backups-en.md', 'adr/0005-pg-backups-fr.md', P2,
        'adr/img/pg-diagram.png'].map((path) => ({ path })), userPermissions: perms, diffRefs: { baseSha: 'base7', headSha: 'abc123', startSha: 'base7' },
      discussions: { nodes: [
        thread('s1', n(priya, 6, 'added 1 commit', { system: true })),
        thread('t1', n(marco, 5, 'Do we have a DBA for this? See [#4](/demo/adr/-/issues/4).'), n(priya, 4, 'Yes, the platform team has agreed to support it.')),
        thread('b3', n(alex, 5, BALLOT, { position: at('file', P3, null, 'abc123'), awards: [award('thumbsup', marco), award('thumbsup', dana), award('thumbsdown', alex), award('thumbsup', lee)] })),
        thread('b5', n(alex, 5, BALLOT, { position: at('file', P5, null, 'abc123'), awards: [award('thumbsup', priya), award('thumbsup', marco), award('thumbsup', sam)] }),
          n(alex, 1, '**Accepted / Acceptée** — 👍 For / Pour : 2 (Priya Shah, Marco Rossi) · 👎 Against / Contre : 0 (—)')),
        thread('f1', n(dana, 3, 'Should this cover managed cloud databases too?', { position: at('file', P3, null, 'abc123') })),
        thread('p1', n(marco, 2, 'Which three? Worth listing them.', { position: at('text', P3, 4, 'abc123') }), n(priya, 1, 'They are on the inventory page.')),
        thread('o1', n(sam, 6, 'Typo: PostgresSQL.', { position: at('text', P3, 7, 'old999') })),
      ] } },
    8: { id: 'gid://gitlab/MergeRequest/8', iid: '8', title: '2026-12-04 - Meeting', webUrl: 'https://gitlab.example.com/demo/adr/-/merge_requests/8',
      state: 'opened', targetBranch: 'main', sourceBranch: 'meeting-2026-12-04', diffHeadSha: 'def456', detailedMergeStatus: 'MERGEABLE', mergedAt: null, author: sam,
      diffStats: [{ path: 'adr/0004-retire-ftp-en.md' }], userPermissions: perms, diffRefs: { baseSha: 'b8', headSha: 'def456', startSha: 'b8' },
      discussions: { nodes: [] } },
    10: { id: 'gid://gitlab/MergeRequest/10', iid: '10', title: '2026-12-11 - Meeting', webUrl: 'https://gitlab.example.com/demo/adr/-/merge_requests/10',
      state: 'opened', targetBranch: 'develop', sourceBranch: 'meeting-dev', diffHeadSha: 'ddd', detailedMergeStatus: 'MERGEABLE', mergedAt: null, author: bob,
      diffStats: [{ path: 'adr/0009-dev-only-en.md' }], userPermissions: perms, discussions: { nodes: [] } },
    9: { id: 'gid://gitlab/MergeRequest/9', iid: '9', title: 'Fix a typo in the README', webUrl: 'https://gitlab.example.com/demo/adr/-/merge_requests/9',
      state: 'opened', targetBranch: 'main', sourceBranch: 'typo', diffHeadSha: 'fff', detailedMergeStatus: 'MERGEABLE', mergedAt: null, author: bob,
      diffStats: [{ path: 'adr/README.md' }], userPermissions: perms, discussions: { nodes: [] } },
    3: { id: 'gid://gitlab/MergeRequest/3', iid: '3', title: '2026-10-02 - Meeting', webUrl: 'https://gitlab.example.com/demo/adr/-/merge_requests/3',
      state: 'merged', targetBranch: 'main', sourceBranch: 'meeting-2026-10-02', diffHeadSha: 'aaa', detailedMergeStatus: 'NOT_OPEN', mergedAt: '2026-10-02T15:00:00Z', author: dana,
      diffStats: [{ path: 'adr/0001-use-gcds-en.md' }, { path: 'adr/0001-use-gcds-fr.md' }], userPermissions: perms,
      diffRefs: { baseSha: 'b3', headSha: 'aaa', startSha: 'b3' },
      discussions: { nodes: [
        thread('a0', n(marco, 50, 'Pin the version in one place.', { position: at('text', 'adr/0001-use-gcds-en.md', 4, 'aaa') })),
        thread('ab', n(alex, 52, BALLOT, { position: at('file', 'adr/0001-use-gcds-en.md', null, 'aaa'), awards: [alex, priya, marco, dana].map((x) => award('thumbsup', x)) }),
          n(alex, 47, '**Accepted / Acceptée** — 👍 For / Pour : 4 (Alex Tremblay, Priya Shah, Marco Rossi, Dana Kim) · 👎 Against / Contre : 0 (—)')),
      ] } },
  };
  const files = {
    'main:adr/0001-use-gcds-en.md': '# Use GC Design System\n\n## Context\nOur sites need a consistent Government of Canada look.\n\n## Decision\nUse GCDS components, pinned to a version.',
    'main:adr/0001-use-gcds-fr.md': '# Utiliser Système de design GC\n\n## Contexte\nNos sites ont besoin d\'une apparence uniforme du gouvernement du Canada.\n\n## Décision\nUtiliser les composants de Système de design GC, à une version fixe.',
    [`main:${P2}`]: '# Use GitLab as the system of record\n\n## Decision\nDecisions live in GitLab merge requests.',
    [`meeting-2026-11-20:${P2}`]: '# Use GitLab as the system of record\n\n## Context\nWe need one place for decisions.\n\n## Decision\nDecisions live in GitLab merge requests.',
    'meeting-2026-11-20:adr/0003-adopt-postgres-en.md': '# Adopt PostgreSQL\n\n## Context\nWe run three database engines. See [the inventory](/demo/adr/-/wikis/inventory).\n\n## Decision\nNew services use PostgreSQL.\n\n| Option | Cost |\n|---|---|\n| PostgreSQL | Low |\n| Oracle | High |',
    'meeting-2026-11-20:adr/0003-adopt-postgres-fr.md': '# Adopter PostgreSQL\n\n## Contexte\nNous utilisons trois moteurs de base de données.\n\n## Décision\nLes nouveaux services utilisent PostgreSQL.\n\n| Option | Coût |\n|---|---|\n| PostgreSQL | Faible |\n| Oracle | Élevé |',
    'meeting-2026-11-20:adr/0005-pg-backups-en.md': "---\nstatus: proposed\ndate: 2026-11-15\ndecision-makers:\n  - Priya Shah\n  - Marco Rossi\nconsulted: [Dana Kim, \"Lee Wong\"]\n# informed: {list everyone kept up to date}\n---\n# Back up PostgreSQL nightly\n\n## Context\nBackups today are manual and nobody has tested a restore.\n\n## Decision\nTake nightly backups and test a restore monthly.\n\n![Backup flow](img/backup-flow.svg)\n\n### Retention\nKeep 35 days of backups.\n\n## Consequences\nStorage costs rise slightly.",
    'meeting-2026-11-20:adr/0005-pg-backups-fr.md': "---\nstatus: proposée\ndate: 2026-11-15\ndecision-makers:\n  - Priya Shah\n  - Marco Rossi\nconsulted: [Dana Kim, \"Lee Wong\"]\n---\n# Sauvegarder PostgreSQL chaque nuit\n\n## Contexte\nLes sauvegardes sont manuelles et personne n'a testé de restauration.\n\n## Décision\nFaire une sauvegarde chaque nuit et tester une restauration chaque mois.\n\n![Flux de sauvegarde](img/backup-flow.svg)\n\n### Conservation\nConserver 35 jours de sauvegardes.\n\n## Conséquences\nLes coûts de stockage augmentent légèrement.",
    'meeting-2026-12-04:adr/0004-retire-ftp-en.md': "---\ntitle: Retire FTP by 2027\n---\n\n## Decision\nReplace FTP transfers with SFTP by 2027.",
    'main:adr/members.json': JSON.stringify({ members: [{ ...alex, voting: true, group: 'Enterprise Architecture' }, { ...priya, voting: true, group: 'Data Platform' },
      { ...marco, voting: true, group: 'IT Security' }, { ...dana, voting: false, group: 'Communications' }] }, null, 2),
    'main:adr/img/logo.png': '',
    'meeting-2026-11-20:adr/img/backup-flow.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 90" font-family="sans-serif" font-size="15"><g fill="#e8f0f8" stroke="#26374a"><rect x="5" y="20" width="140" height="50" rx="6"/><rect x="190" y="20" width="140" height="50" rx="6"/><rect x="375" y="20" width="140" height="50" rx="6"/></g><g fill="#26374a" text-anchor="middle"><text x="75" y="50">Database</text><text x="260" y="50">Nightly backup</text><text x="445" y="50">Monthly restore</text></g><g stroke="#26374a" stroke-width="2"><line x1="145" y1="45" x2="185" y2="45"/><line x1="330" y1="45" x2="370" y2="45"/></g></svg>',
    'meeting-2026-11-20:adr/members.json': JSON.stringify({ members: [{ username: 'bob', name: 'Bob Guest', voting: true }] }),
  };
  // GitLab's id for a file's content (here a short hash): it changes with every edit, which is how the site tells versions apart.
  const oid = (t) => { let x = 2166136261; for (const ch of t) x = Math.imul(x ^ ch.charCodeAt(0), 16777619) >>> 0; return x.toString(16).padStart(8, '0').repeat(5); };
  // The sample ballots are for the proposals' current versions.
  const version = (branch, key) => ['en', 'fr'].filter((l) => files[`${branch}:${key}-${l}.md`] != null).map((l) => `${l}:${oid(files[`${branch}:${key}-${l}.md`]).slice(0, 12)}`).join(',');
  for (const [id, key] of [['b3', 'adr/0003-adopt-postgres'], ['b5', 'adr/0005-pg-backups']]) {
    mrs[7].discussions.nodes.find((d) => d.replyId.endsWith(`/${id}`)).notes.nodes[0].body += `\n\n<!-- version ${version('meeting-2026-11-20', key)} -->`;
  }
  const people = [[alex, 40], [priya, 30], [marco, 30], [dana, 20], [sam, 30], [lee, 20], [bob, 10]];
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const notes = () => Object.values(mrs).flatMap((m) => m.discussions.nodes.flatMap((d) => d.notes.nodes));
  // REST diffs, from the current files: new files are all additions; changed ones get a single hunk (enough for 0002).
  const diffs = (mr) => mr.diffStats.filter((d) => !d.path.endsWith('.png')).map(({ path }) => {
    const now = files[`${mr.sourceBranch}:${path}`] ?? '';
    const was = files[`main:${path}`];
    if (was == null) return { old_path: path, new_path: path, new_file: true, diff: `@@ -0,0 +1,${now.split('\n').length} @@\n${now.split('\n').map((l) => `+${l}`).join('\n')}` };
    return { old_path: path, new_path: path, new_file: false, diff: '@@ -1,4 +1,7 @@\n # Use GitLab as the system of record\n \n+## Context\n+We need one place for decisions.\n+\n ## Decision\n Decisions live in GitLab merge requests.' };
  });
  // Terms of reference come from the repo's template, so the preview shows the real starter text.
  const tor = Promise.all(['en', 'fr'].map((l) => real(`template/adr/0000-terms-of-reference-${l}.md`).then((r) => r.text())))
    .then(([en, fr]) => Object.assign(files, { 'main:adr/0000-terms-of-reference-en.md': en, 'main:adr/0000-terms-of-reference-fr.md': fr }));

  window.fetch = async (url, opts = {}) => {
    url = String(url);
    if (!/\/(api\/graphql|api\/v4\/|oauth\/token)/.test(url)) return real(url, opts); // only GitLab's API, whatever its host
    await new Promise((r) => setTimeout(r, 120));
    if (url.endsWith('/oauth/token')) return json({ access_token: 'mock-token' });
    if (url.endsWith('/api/v4/markdown')) return json({ html: md(JSON.parse(opts.body).text) });
    await tor;
    const raw = url.match(/\/repository\/files\/([^/]+)\/raw\?ref=([^&]+)/);
    if (raw) {
      const body = files[`${decodeURIComponent(raw[2])}:${decodeURIComponent(raw[1])}`];
      window.__calls.push({ op: 'GET raw', path: decodeURIComponent(raw[1]), ref: decodeURIComponent(raw[2]), found: body != null });
      return body == null ? json({ message: '404 File Not Found' }, 404) : new Response(body, { headers: { 'Content-Type': 'text/plain' } });
    }
    const rest = url.match(/\/api\/v4\/projects\/[^/]+\/merge_requests\/(\d+)\/(diffs|discussions)/);
    if (rest && rest[2] === 'diffs') return json(diffs(mrs[rest[1]]));
    if (rest) {
      const { body, position: p } = JSON.parse(opts.body);
      window.__calls.push({ op: 'POST discussions', iid: rest[1], body: body.slice(0, 40), position: p });
      mrs[rest[1]].discussions.nodes.push(thread(`r${nextNote}`, n(alex, 0, body, { position: { positionType: p.position_type, newPath: p.new_path,
        oldPath: p.old_path, newLine: p.new_line ?? null, oldLine: p.old_line ?? null, diffRefs: { headSha: p.head_sha } } })));
      return json({ id: 'r' }, 201);
    }
    const { query, variables: v } = JSON.parse(opts.body);
    const mutation = query.trim().startsWith('mutation');
    if (mutation) window.__calls.push({ op: query.match(/\{\s*(\w+)/)[1], ...v, ...(v.a && { a: v.a.map((x) => `${x.action} ${x.filePath}`) }), ...(v.b?.length > 60 && { b: v.b.slice(0, 60) }) });
    if (mutation && query.includes('awardEmojiToggle')) {
      const x = notes().find((m) => m.id === v.id);
      const had = x.awardEmoji.nodes.some((a) => a.name === v.n && a.user.username === 'alex');
      x.awardEmoji.nodes = had ? x.awardEmoji.nodes.filter((a) => !(a.name === v.n && a.user.username === 'alex')) : [...x.awardEmoji.nodes, award(v.n, alex)];
      return json({ data: { awardEmojiToggle: { toggledOn: !had, errors: [] } } });
    }
    if (mutation && query.includes('createNote')) {
      const mr = Object.values(mrs).find((m) => m.id === v.id);
      const note = n(alex, 0, v.b);
      const t = mr.discussions.nodes.find((d) => d.replyId === v.d);
      if (t) t.notes.nodes.push(note); else mr.discussions.nodes.push(thread(`n${nextNote}`, note));
      return json({ data: { createNote: { errors: [] } } });
    }
    if (mutation && query.includes('commitCreate')) { // apply the actions; a meeting branch's new head shows up a little later, like GitLab's
      const mr = Object.values(mrs).find((m) => m.sourceBranch === v.b);
      for (const x of v.a) {
        if (x.action === 'DELETE') delete files[`${v.b}:${x.filePath}`]; else files[`${v.b}:${x.filePath}`] = x.content;
        if (mr && (x.action === 'DELETE' || files[`main:${x.filePath}`] === x.content)) mr.diffStats = mr.diffStats.filter((d) => d.path !== x.filePath);
      }
      const sha = `sha${nextNote++}`;
      if (mr) setTimeout(() => { mr.diffHeadSha = sha; mr.diffRefs.headSha = sha; }, 1500);
      return json({ data: { commitCreate: { commit: { sha }, errors: [] } } });
    }
    if (mutation && query.includes('mergeRequestAccept')) {
      if (mrs[v.iid].diffHeadSha !== v.sha) return json({ data: { mergeRequestAccept: { errors: ['SHA does not match HEAD of source branch'] } } });
      Object.assign(mrs[v.iid], { state: 'merged', mergedAt: new Date().toISOString() });
      return json({ data: { mergeRequestAccept: { errors: [] } } });
    }
    if (mutation && query.includes('mergeRequestUpdate')) { mrs[v.iid].state = 'closed'; return json({ data: { mergeRequestUpdate: { errors: [] } } }); }
    if (query.includes('currentUser')) {
      const merged = Object.values(mrs).filter((m) => m.state === 'merged');
      for (const m of merged) for (const { path } of m.diffStats) if (files[`${m.sourceBranch}:${path}`] != null) files[`main:${path}`] = files[`${m.sourceBranch}:${path}`]; // merged files live on main
      const tree = [...new Set([...Object.keys(files).filter((k) => k.startsWith('main:')).map((k) => k.slice(5)), 'adr/README.md'])];
      return json({ data: { currentUser: alex, project: { userPermissions: { pushCode: true }, repository: { rootRef: 'main', tree: { blobs: { nodes: tree.map((path) => ({ path })) } } },
        projectMembers: { nodes: people.map(([user, a]) => ({ user, accessLevel: { integerValue: a } })) },
        open: { nodes: Object.values(mrs).filter((m) => m.state === 'opened') },
        merged: { nodes: merged.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt)) } } } });
    }
    if (query.includes('projectMembers(')) { // direct members, plus people with access through groups, a few per page
      const nodes = [...people.map(([user, a]) => ({ __typename: 'ProjectMember', user, accessLevel: { integerValue: a } })),
        { __typename: 'GroupMember', user: kim, accessLevel: { integerValue: 30 }, group: { fullPath: 'statcan/architecture' } }, // inherited only
        { __typename: 'GroupMember', user: priya, accessLevel: { integerValue: 20 }, group: { fullPath: 'statcan' } }, // also a direct member
        { __typename: 'GroupMember', user: ravi, accessLevel: { integerValue: 20 }, group: { fullPath: 'statcan/data-science' } }]; // shared group
      const from = +(v.after || 0);
      return json({ data: { project: { projectMembers: { pageInfo: { hasNextPage: from + 4 < nodes.length, endCursor: String(from + 4) }, nodes: nodes.slice(from, from + 4) } } } });
    }
    if (query.includes('blobs(')) return json({ data: { project: { repository: { blobs: { nodes: v.paths.filter((p) => files[`${v.r}:${p}`] != null).map((p) => ({ path: p, rawTextBlob: files[`${v.r}:${p}`], oid: oid(files[`${v.r}:${p}`]) })) } } } } });
    if (query.includes('{ diffHeadSha } } }')) return json({ data: { project: { mergeRequest: { diffHeadSha: mrs[v.iid].diffHeadSha } } } });
    if (query.includes('mergeRequest(iid')) return json({ data: { project: { mergeRequest: structuredClone(mrs[v.iid]) } } });
    return json({ errors: [{ message: `mock: unhandled ${query.slice(0, 60)}` }] });
  };
})();
