# GitLab committee tools

Two tools that let people discuss and vote on content in GitLab, built with the [GC Design System](https://design-system.alpha.canada.ca/) and bilingual in English and French. Both run in the browser: visitors sign in with GitLab, and everything is stored in a GitLab project, so there's no backend.

| Folder | What it is |
|---|---|
| [`gitlab-comments/`](gitlab-comments/) | A Quarto extension that adds comments and 👍/👎 votes to the bottom of each page. Install it with `quarto add jonlamca/quarto-gitlab-comments/gitlab-comments`. |
| [`gitlab-adr/`](gitlab-adr/) | A standalone static site where a committee proposes, votes on and records Architecture Decision Records as GitLab merge requests. |

Each folder stands on its own, with its own README and third-party notices. They don't share code, because the extension is copied into other people's projects without the rest of this repository.

## License

MIT. See [LICENSE](LICENSE).
