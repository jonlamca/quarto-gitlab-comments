# gitlab-adr

A small website where a committee proposes, discusses, votes on and records Architecture Decision Records (ADRs). Everything is stored in one GitLab repository:

- A **meeting** is a merge request named after it, such as `2026-11-20 - Meeting`. Each ADR it adds or changes is a separate **proposal**, in English and French.
- Committee members **vote** 👍 For or 👎 Against on each proposal. Anyone with access **comments** in the margin beside a paragraph, on a proposal as a whole, or on the meeting.
- The **chair** accepts or rejects each proposal, then **closes the meeting**: proposals that weren't accepted are taken out of the merge request, and the rest is merged.
- The **main branch**, named in `config.json`, holds the **accepted** decisions and the committee's member list. Who's on the committee is a list the chair keeps on the site, separate from who can open the repository.

The site is a few static files: `index.html`, `adr.js` and the deploy-time settings in `config.json`. They read GitLab in the browser, so there's no backend or build step, and new proposals show up without redeploying. It uses [GC Design System](https://design-system.alpha.canada.ca/) components and is fully bilingual on one page: the header's English/Français link switches every label and the ADR text in place.

## Set up

1. **Create a GitLab project for the ADRs**, ideally private. Copy `template/adr/` into it to start with terms of reference (see [Terms of reference](#terms-of-reference)). GitLab's roles are the access control:

   | Role | Can |
   |---|---|
   | Reporter | read and comment; vote if a voting member on the [member list](#committee-members) |
   | Developer | also push meeting branches (authors) |
   | Maintainer | also record decisions, close meetings and edit the member list (the chair) |

2. **Register an OAuth application** under **User or Group settings → Applications**:
   - Turn **Confidential** off.
   - Choose the scope `api`.
   - Set the redirect URI to the exact URL people will open the site at, for example `https://adr.example.ca/`. For local testing, also add `http://localhost:8000/`.

3. **Fill in `config.json`** at deploy time. Nothing else needs editing:

   ```json
   {
     "gitlab": "https://gitlab.com",
     "project": "your-group/adr",
     "clientId": "YOUR_APPLICATION_ID",
     "branch": "main",
     "folder": "adr",
     "titlePattern": "^\\d{4}-\\d{2}-\\d{2} - Meeting",
     "fileComments": true,
     "marginComments": true,
     "title": { "en": "StatCan Developer Program", "fr": "Programme des développeurs de StatCan" },
     "subtitle": { "en": "TIGER (technology, integration, governance, engineering review)", "fr": "TIGER (technologie, intégration, gouvernance, examen de l’ingénierie)" },
     "signature": {
       "en": { "src": "statcan-signature-en.svg", "alt": "Statistics Canada", "href": "https://www.statcan.gc.ca/en/start" },
       "fr": { "src": "statcan-signature-fr.svg", "alt": "Statistique Canada", "href": "https://www.statcan.gc.ca/fr/debut" }
     }
   }
   ```

   | Setting | What it is |
   |---|---|
   | `gitlab` | Your GitLab instance. |
   | `project` | The ADR project's full path. Required. |
   | `clientId` | The application ID from step 2. Required. |
   | `branch` | The main branch: it holds the accepted decisions and the member list, and meetings are merge requests into it. Merge requests into other branches are ignored. Default: the project's default branch. |
   | `folder` | The folder on the main branch that holds accepted ADRs and `members.json`, subfolders included, for example `adr` or `tiger`. |
   | `titlePattern` | A regular expression for meeting merge request titles. The example matches `2026-11-20 - Meeting`; in JSON each backslash is doubled. Empty: every open merge request is a meeting. |
   | `fileComments` | `false` removes the box for commenting on a proposal as a whole, leaving margin comments and meeting discussion. File comments made in GitLab, and margin comments whose line has changed, still show. Default: `true`. |
   | `marginComments` | `false` removes the margins beside paragraphs and their **Comment** buttons. Margin comments that already exist (for example, made in GitLab) show under "Comments on this file" with their line number. Default: `true`. With both set to `false`, members comment only in the meeting discussion. |
   | `title`, `subtitle` | The home page heading and the line under it. Each is one string, or an `en` and `fr` pair. |
   | `signature` | The department signature in the header, per language: image file, alt text and link. Leave it out to show the Government of Canada signature. |

   **Signature files:** this repository doesn't include Statistics Canada's signature. Get the official Federal Identity Program signature files (English and French, SVG) from your communications team, and put them next to `index.html` with the names in `config.json`.

4. **Deploy** `index.html`, `adr.js`, `config.json` and the signature files to any static host over HTTPS, such as GitLab Pages or object storage.

## Writing an ADR

Each decision is a pair of files in the ADR folder, with the same number and slug and a language suffix:

```
adr/0007-adopt-postgres-en.md
adr/0007-adopt-postgres-fr.md
```

The first `# ` heading is the decision's title. A suggested outline:

```markdown
# Adopt PostgreSQL

## Context
What prompts this decision.

## Decision
What we will do.

## Consequences
What becomes easier or harder.
```

```markdown
# Adopter PostgreSQL

## Contexte
Ce qui motive cette décision.

## Décision
Ce que nous ferons.

## Conséquences
Ce qui devient plus facile ou plus difficile.
```

To put proposals on a meeting's agenda, add their files to that meeting's branch. Someone opens one merge request per meeting into the main branch, named to match `titlePattern`, for example `2026-11-20 - Meeting`; GitLab's Web IDE can create the branch, files and merge request. Each ADR in it is a separate proposal with its own vote, comments and decision. Other files in the merge request, such as images, aren't listed on the site and are merged with the meeting. To change an accepted decision, add an edit of its files to a meeting. Markdown files without a language suffix are shown as they are, in both languages.

## Committee members

Committee membership isn't the same as access to the GitLab project: authors, observers and administrators can open it too. The member list is `members.json` in the ADR folder. It says whether each member is voting or non-voting and which group they represent, and only voting members' votes count.

The chair keeps it on the site's **Members** page: type part of a name or username to find people, tick the members, set each one as **voting** or **non-voting**, type the **group** they represent (groups already on the list are suggested, to keep names consistent), and save. The filter also finds people by group. Groups are shown next to names on the Members page and in the chair view. The page lists everyone with Reporter access or higher, so nobody types usernames, and saving commits the file to the main branch, so GitLab keeps the history. The site always reads the list from the main branch, never from a meeting's branch. To add someone without access, give them Reporter access in GitLab first. Until a list is saved, everyone with Reporter access or higher counts as a member.

**When the list changes:** open proposals count the current list. Once the chair decides a proposal, the tally recorded with the decision is what the site shows from then on, so adding or removing members later never changes a past decision. GitLab's history of `members.json` shows who was a member when.

## Terms of reference

The committee's terms of reference are ADR 0000, `0000-terms-of-reference-en.md` and `-fr.md` in the ADR folder. They cover purpose, membership, how to propose, voting period, quorum and the decision rule, how the chair decides, and when the terms are reviewed. Because they're an ADR, changing them goes through the same proposal and vote as any decision, and the home page links to them.

`template/adr/` has a starter version in both languages. Copy it into the ADR repository and replace everything in [brackets]. Have a fluent reader check the French.

## Using the site

- **Home (`#/`):** the title and subtitle from `config.json`; links to the terms of reference, the member list and the chair view; each open meeting with its proposals, their votes, your vote and any decision; then accepted decisions (the `-en.md` and `-fr.md` files in the ADR folder) with the date they were accepted.
- **A proposal (its file's path, for example `#/adr/0007-adopt-postgres-en.md`):**
  - The file, rendered by GitLab. The address names the language: switching language moves to the `-fr.md` file without reloading, and a link to a `-fr.md` file opens in French. If one language's file is missing, a notice says so and the other language is shown.
  - The other proposals at the same meeting.
  - **Margin comments:** on wide screens each paragraph has a margin beside it, as in a word processor, with its comment threads as cards and a **Comment** button that appears on hover or keyboard focus. Commented paragraphs are highlighted. On narrow screens the margin sits below the paragraph. `marginComments` in `config.json` turns this off.
  - **Vote:** 👍 For and 👎 Against. Each member gets one vote per proposal, so voting For removes an Against and the other way round. Hovering over a vote shows who voted. Reactions from anyone who isn't a voting member, including non-voting members, are shown as not counted. Voting stops once the chair records a decision.
  - **Comments on this file:** threads about the proposal as a whole, plus margin comments that can't be placed beside a paragraph, such as those on a line that has since changed. With `fileComments` set to `false` there's no box to start one, and the section only appears when it has threads to show.
  - **Meeting discussion:** the merge request's general discussion.
  - For an accepted decision: the votes and comments from the meeting that accepted it, read-only.
- **Members (`#/members`):** the committee, and for the chair the editor described in [Committee members](#committee-members).
- **Chair view (`#/chair`):** for each open meeting, every proposal with For and Against (names and groups), which voting members haven't voted yet, missing translations and the decision so far, plus GitLab's merge status. People with Maintainer access get:
  - **Accept** and **Reject** on each proposal. Each posts the tally as a reply on the proposal's ballot comment, so GitLab keeps the record; the latest decision counts, so a mistake can be corrected. Accept needs both language files.
  - **Close meeting.** Proposals that weren't accepted are taken out of the merge request in one commit: new files are deleted and changed ones are put back as they are on the main branch. Then the merge request is merged, with a summary comment. If nothing was accepted, the merge request is closed instead. The site refuses to close a meeting if new commits arrived after the page loaded, so nothing unreviewed is merged.
- **Comments made at a meeting:** when the chair comments anywhere, an **On behalf of** list lets them record what a member said. The comment is posted under the chair's account and starts with *On behalf of / Au nom de* and the member's name, written as plain text so no notification is sent.

Votes are GitLab reactions on a **ballot comment** that the site adds to each proposal's file the first time someone votes. Members can also vote by reacting 👍 or 👎 to that comment in GitLab. Comments are GitLab comments: margin comments are line comments on the merge request's changes, and file comments are GitLab file comments. So everything also shows in GitLab, and none of it is anonymous.

## Limits

- **Sign-in:** the site asks for sign-in before showing anything, because gitlab.com only renders Markdown for signed-in users. The token uses the broad `api` scope, GitLab's only scope that allows writing. It's kept in `sessionStorage` for that browser tab and expires after 2 hours.
- **Sizes:** the site reads the first 100 open and 100 merged merge requests, ADR files, file changes in a merge request, members, threads and votes.
- **Competing proposals:** if two open meetings change the same file, the site shows the first one.
- **Ballots:** if two people cast the very first vote on a proposal at the same moment, GitLab can end up with two ballot comments; the site counts the first one. Decisions count only from people with Maintainer access.
- **Closing a meeting:** files that aren't Markdown, such as images, are merged with the meeting, whichever proposal they belong to. Closing waits up to 20 seconds for GitLab to process the commit that takes proposals out; if GitLab is slower, the merge fails and the chair clicks **Close meeting** again. Meetings from forks aren't supported, since the site commits to the meeting's branch.
- **Comments belong to one file:** comments on the English version of a decision don't show on the French page, and the other way round. Meeting discussion shows on every page.
- **Margin comments:** a comment is attached to the paragraph's first line. A long thread pushes the next paragraph down rather than overlapping it. Comments on an accepted decision are placed by line as of the merge, so they can land on the wrong paragraph if the file was changed later without a proposal. Margin comments rely on GitLab marking source lines in its rendered Markdown; without that, file comments still work. Comments on renamed files haven't been tested.
- **Images:** images in a proposal may not show until it's merged, because GitLab links them to the project's default branch.
- **Translation review:** the French interface text, the French title and subtitle in `config.json`, and the French terms of reference template use Canadian typography. Have a fluent speaker review them.
- **Footer:** the footer shows only the Canada wordmark, which the Federal Identity Program requires on Government of Canada sites. It has no links or text.
- **Tested against:** the current gitlab.com API. The minimum self-managed GitLab version hasn't been checked.

## Try it locally

Set `clientId` and `project` in `config.json`, register `http://localhost:8000/` as a redirect URI, then run this from this folder (`gitlab-adr/`):

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/.

## License

MIT. See [LICENSE](../LICENSE). Third-party components are listed in [THIRD_PARTY.md](THIRD_PARTY.md).
