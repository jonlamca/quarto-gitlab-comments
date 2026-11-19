# gitlab-adr

A small website where a committee proposes, discusses, votes on and records Architecture Decision Records (ADRs). Everything is stored in one GitLab repository:

- A **proposal** is a merge request whose title starts with a set prefix, such as `[RFC] Adopt PostgreSQL`. Every file it changes is part of it, usually one or more ADRs in English and French.
- Committee members **vote** 👍 For or 👎 Against on the merge request, and **comment** on the whole proposal, on one file, or on one paragraph.
- The **chair** accepts a proposal, which merges it, or rejects it, which closes it.
- The default branch holds the **accepted** decisions.

The site is a few static files: `index.html`, `adr.js` and the deploy-time settings in `config.json`. They read GitLab in the browser, so there's no backend or build step, and new proposals show up without redeploying. It uses [GC Design System](https://design-system.alpha.canada.ca/) components and is fully bilingual on one page: the header's English/Français link switches every label and the ADR text in place.

## Set up

1. **Create a GitLab project for the ADRs**, ideally private. Copy `template/adr/` into it to start with terms of reference (see [Terms of reference](#terms-of-reference)). GitLab's roles are the access control:

   | Role | Can |
   |---|---|
   | Reporter | read, vote and comment (the committee) |
   | Developer | also push proposal branches (authors) |
   | Maintainer | also merge (the chair) |

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
     "folder": "adr",
     "titlePrefix": "[RFC]",
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
   | `folder` | The folder on the default branch that holds accepted ADRs, subfolders included, for example `adr` or `tiger`. |
   | `titlePrefix` | Merge requests whose title starts with this are proposals, for example `[RFC]`. Empty: every open merge request is one. |
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

To propose one, create a branch, add both files, and open a merge request into the default branch whose title starts with the prefix in `config.json`, for example `[RFC] Adopt PostgreSQL`. GitLab's Web IDE does all three. One merge request can hold several decisions and supporting files, such as images; they're voted on together. Markdown files are shown on the site, and other files link to GitLab. To change an accepted decision, open a merge request that edits its files. Markdown files without a language suffix are shown as they are, in both languages.

## Terms of reference

The committee's terms of reference are ADR 0000, `0000-terms-of-reference-en.md` and `-fr.md` in the ADR folder. They cover purpose, membership, how to propose, voting period, quorum and the decision rule, how the chair decides, and when the terms are reviewed. Because they're an ADR, changing them goes through the same proposal and vote as any decision, and the home page links to them.

`template/adr/` has a starter version in both languages. Copy it into the ADR repository and replace everything in [brackets]. Have a fluent reader check the French.

## Using the site

- **Home (`#/`):** the title and subtitle from `config.json`, links to the terms of reference and the chair view, then proposals (each with its files, votes and your own vote), then accepted decisions (the `-en.md` and `-fr.md` files in the ADR folder) with the date and final tally.
- **A file (its path, for example `#/adr/0007-adopt-postgres-en.md`):**
  - The file, rendered by GitLab. The address names the language: switching language moves to the `-fr.md` file without reloading, and a link to a `-fr.md` file opens in French. If one language's file is missing, a notice says so and the other language is shown.
  - For a proposal: the other files in it, the vote buttons, and three places to comment. Each member gets one vote for the whole merge request, so voting For removes an Against and the other way round. Hovering over a vote shows who voted.
    - **On a paragraph:** each paragraph has a **Comment on this paragraph** button (in the right margin on wide screens, shown on hover). Threads appear under their paragraph.
    - **On this file:** threads about the file as a whole, plus line comments that can't be placed under a paragraph, such as those on a line that has since changed.
    - **On the whole proposal:** the merge request's general discussion.
  - For an accepted decision: the votes and comments from the merge request that accepted it, read-only.
- **Chair view (`#/chair`):** every open proposal with For and Against (with names), who hasn't voted yet (project members with Reporter access or higher), missing translations, and GitLab's merge status. People with merge rights get two buttons:
  - **Accept** merges the merge request, then posts the tally as a comment in GitLab. It's available once both language files exist and GitLab says the merge request can be merged. The merge is tied to the commit people voted on, so GitLab refuses it if new commits were pushed since.
  - **Reject** closes the merge request, then posts the tally.
- **Comments made at a meeting:** when the chair comments anywhere, an **On behalf of** list lets them record what a member said. The comment is posted under the chair's account and starts with *On behalf of / Au nom de* and the member's name, written as plain text so no notification is sent.

Votes are GitLab reactions, and comments are GitLab comments: paragraph comments are line comments on the merge request's changes, and file comments are GitLab file comments. So everything also shows in GitLab, and none of it is anonymous. The tally comments keep the decision record in GitLab even without this site.

## Limits

- **Sign-in:** the site asks for sign-in before showing anything, because gitlab.com only renders Markdown for signed-in users. The token uses the broad `api` scope, GitLab's only scope that allows writing. It's kept in `sessionStorage` for that browser tab and expires after 2 hours.
- **Sizes:** the site reads the first 100 open and 100 merged merge requests, ADR files, file changes in a merge request, members, threads and votes.
- **Competing proposals:** if two open merge requests change the same file, the site shows the first one.
- **Comments belong to one file:** comments on the English version of a decision don't show on the French page, and the other way round. Comments on the whole proposal show on every page.
- **Paragraph comments:** a comment is attached to the paragraph's first line. Comments on an accepted decision are placed by line as of the merge, so they can land on the wrong paragraph if the file was changed later without a proposal. Paragraph buttons rely on GitLab marking source lines in its rendered Markdown; without that, file comments still work. Comments on renamed files haven't been tested.
- **Images:** images in a proposal may not show until it's merged, because GitLab links them to the default branch.
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
