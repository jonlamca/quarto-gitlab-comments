# gitlab-adr

A small website where a committee proposes, discusses, votes on and records Architecture Decision Records (ADRs). Everything is stored in one GitLab repository:

- A **proposal** is a merge request that adds an ADR's English and French Markdown files on a branch.
- Committee members **vote** 👍 For or 👎 Against on the merge request and **comment** on it.
- The **chair** accepts a proposal, which merges it, or rejects it, which closes it.
- The default branch holds the **accepted** decisions.

The site is two static files, `index.html` and `adr.js`. They read GitLab in the browser, so there's no backend or build step, and new proposals show up without redeploying. It uses [GC Design System](https://design-system.alpha.canada.ca/) components and is fully bilingual on one page: the header's English/Français link switches every label and the ADR text in place.

## Set up

1. **Create a GitLab project for the ADRs**, ideally private. GitLab's roles are the access control:

   | Role | Can |
   |---|---|
   | Reporter | read, vote and comment (the committee) |
   | Developer | also push proposal branches (authors) |
   | Maintainer | also merge (the chair) |

2. **Register an OAuth application** under **User or Group settings → Applications**:
   - Turn **Confidential** off.
   - Choose the scope `api`.
   - Set the redirect URI to the exact URL people will open the site at, for example `https://adr.example.ca/`. For local testing, also add `http://localhost:8000/`.

3. **Edit the settings** on `<div id="adr">` in `index.html`:

   ```html
   <div id="adr"
     data-gitlab="https://gitlab.com"
     data-project="your-group/adr"
     data-client-id="YOUR_APPLICATION_ID"
     data-folder="adr"></div>
   ```

   - `data-gitlab`: your GitLab instance.
   - `data-project`: the ADR project's full path.
   - `data-client-id`: the application ID from step 2.
   - `data-folder`: the folder that holds the ADR files.

4. **Deploy** `index.html` and `adr.js` to any static host over HTTPS, such as GitLab Pages or object storage.

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

To propose one, create a branch, add both files, and open a merge request into the default branch. GitLab's Web IDE does all three. Any open merge request that changes a `*-en.md` or `*-fr.md` file in the ADR folder appears as a proposal. To change an accepted decision, open a merge request that edits its files.

## Using the site

- **All decisions (`#/`):** proposed decisions with their votes and your own vote, then accepted decisions with the date and final tally.
- **A decision (`#/adr/0007-adopt-postgres`):**
  - The ADR, rendered by GitLab in the current language. If one language's file is missing, a notice says so and the other language is shown.
  - For a proposal: the vote buttons and the merge request's discussion. Each member gets one vote, so voting For removes an Against and the other way round. Hovering over a vote shows who voted.
  - For an accepted decision: the votes and discussion, read-only.
- **Chair view (`#/chair`):** every open proposal with For and Against (with names), who hasn't voted yet (project members with Reporter access or higher), missing translations, and GitLab's merge status. People with merge rights get two buttons:
  - **Accept** merges the merge request, then posts the tally as a comment in GitLab. It's available once both language files exist and GitLab says the merge request can be merged. The merge is tied to the commit people voted on, so GitLab refuses it if new commits were pushed since.
  - **Reject** closes the merge request, then posts the tally.
- **Comments made at a meeting:** when the chair comments, an **On behalf of** list lets them record what a member said. The comment is posted under the chair's account and starts with *On behalf of / Au nom de* and the member's name, written as plain text so no notification is sent.

Votes are GitLab reactions and comments are GitLab comments, so everything also shows in GitLab, and none of it is anonymous. The tally comments keep the decision record in GitLab even without this site.

## Limits

- **Sign-in:** the site asks for sign-in before showing anything, because gitlab.com only renders Markdown for signed-in users. The token uses the broad `api` scope, GitLab's only scope that allows writing. It's kept in `sessionStorage` for that browser tab and expires after 2 hours.
- **Sizes:** the site reads the first 100 open and 100 merged merge requests, ADR files, members, threads and votes.
- **Competing proposals:** if two open merge requests change the same ADR, the site shows the first one.
- **Images:** images in a proposal may not show until it's merged, because GitLab links them to the default branch.
- **Translation review:** the French interface text uses Canadian typography. Have a fluent speaker review it.
- **Tested against:** the current gitlab.com API. The minimum self-managed GitLab version hasn't been checked.

## Try it locally

Set `data-client-id` and `data-project`, register `http://localhost:8000/` as a redirect URI, then run:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/.

## License

MIT. See [LICENSE](LICENSE). Third-party components are listed in [THIRD_PARTY.md](THIRD_PARTY.md).
