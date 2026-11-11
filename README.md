# gitlab-comments

A Quarto filter extension that adds comments and 👍/👎 votes to the bottom of each HTML page. Everything is stored in a GitLab project, one issue per page, with each comment as a note on that issue. Visitors sign in with GitLab through OAuth PKCE in the browser, so there is no backend.

It's a filter, not a format, so it works alongside your other extensions.

The interface is built from [GC Design System](https://design-system.alpha.canada.ca/) components (version 0.47.0, pinned), loaded from the GCDS CDN. They bring their own styles, so the module looks the same on any Quarto theme. GCDS expects the Lato and Noto Sans fonts. If your site doesn't load them, the components fall back to the system sans-serif.

It needs GitLab 16.1 or later, which every gitlab.com project already runs. 16.1 is the first release whose GraphQL API returns reactions on comments; everything else the extension uses is older.

## Setup

1. Install the extension:

   ```bash
   quarto add jonlamca/quarto-gitlab-comments
   ```

   You can also copy `_extensions/gitlab-comments` into your project.

2. In GitLab, go to **User/Group settings → Applications** and add an application:
   - Turn **Confidential** off.
   - Choose scope `api`.
   - Set the redirect URI to your site root, for example `https://docs.example.com/` and `http://localhost:4200/`.

3. Add this to `_quarto.yml`:

   ```yaml
   filters: [gitlab-comments]
   gitlab-comments:
     project: group/feedback      # target repository (required)
     client-id: <application id>  # required
     origin: docs                 # where comments come from; default: site hostname
     gitlab: https://gitlab.com   # instance URL (default)
     votes: both                  # both | page | comments | none
     vote-label: Was this helpful?  # e.g. "Support this idea?" for idea voting
     sign-in-label: Sign in with GitLab  # e.g. "Authorize GitLab to comment"
     redirect-uri: https://…/     # default: site root; that page must load the module
   ```

### Per-page settings

Settings in a page's front matter merge over the project config:

```yaml
gitlab-comments:
  issue: 42                       # pin an existing issue
  vote-label: Support this idea?
```

To turn the module off on one page, set `gitlab-comments: false`.

### English and French

The interface text is in English or French, following the page's `lang:` setting (`lang: fr`). Dates follow it too. Any other language falls back to English. `vote-label` and `sign-in-label` still override the defaults. The French strings use Canadian typography, with no space before `?`, so have a fluent speaker review them.

By default, each language version of a page gets its own discussion. To share one, point the translated page at the original's source path:

```yaml
# fr/install.qmd
lang: fr
gitlab-comments:
  page: install.qmd
```

Comments are shown as written and never machine-translated. In GitLab, each comment's footer URL shows which language version it came from.

## How it works

- **Finding the issue:** a page's issue is titled `[<origin>] <source path>`, for example `[docs] guide/install.qmd`. The first comment or vote on a page creates that issue, labelled with the origin.
- **Origin on comments:** in GitLab, each comment ends with `— via <origin>: <page url>`. The site hides that line, since it would be the same on every comment.
- **Threads:** comments are GitLab threads. **Reply** posts into the thread, and replies made in GitLab show indented under their comment.
- **Locked discussions:** when an issue is locked in GitLab, the page shows a "Discussion locked" notice. Comments stay readable. For anyone GitLab won't let post, the comment box and Reply are hidden and votes are disabled; signed-out visitors still get the Sign in button. Project members can still comment and vote, as in GitLab.
- **Votes:** these are GitLab award emoji (thumbsup and thumbsdown) on the issue and on each note. Hovering over a vote button shows who voted, as in GitLab: the first 10 names, then +N. Votes are never anonymous, since anyone who can see the issue in GitLab can see who voted.
- **Comment text:** comments are shown as plain text, with no Markdown rendering.

## Limits

- **Token scope and storage:** `api` is GitLab's only scope that allows writing, and it is broad. The token is kept in `sessionStorage`, per tab, and expires after 2 hours, after which the visitor signs in again.
- **Who can comment:** commenters need Guest access or higher on a private project. For broad feedback, such as on policy, use an internal or public project.
- **Labels:** GitLab drops labels that Guests set, which is why the origin is also in the issue title.

## Try it

```bash
quarto render && grep -q 'data-origin="docs"' _site/index.html && echo ok
```

For a live run, set `project` and `client-id` in `_quarto.yml`, then run:

```bash
quarto preview
```

## License

MIT. See [LICENSE](LICENSE). Third-party components are listed in [THIRD_PARTY.md](THIRD_PARTY.md).
