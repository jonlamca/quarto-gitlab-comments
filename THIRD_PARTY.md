# Third-party software

This repository contains no third-party code. Pages built with the extension load these components at runtime:

| Component | Version | License | Use |
|---|---|---|---|
| [GC Design System components](https://github.com/cds-snc/gcds-components) (`@cdssnc/gcds-components`) | 0.47.0 | [MIT](https://github.com/cds-snc/gcds-components/blob/main/LICENSE) | Comment interface, loaded from `cdn.design-system.alpha.canada.ca` |
| [GC Design System fonts](https://github.com/cds-snc/gcds-fonts) (`@cdssnc/gcds-fonts`) | 0.2.2 | MIT | Icon font, loaded by the components' stylesheet |

The extension also needs these, which are not distributed with it:

- [Quarto](https://github.com/quarto-dev/quarto-cli) 1.4 or later (MIT) and the Pandoc it ships with (GPL-2.0-or-later), to build sites.
- A GitLab instance, 16.1 or later, which visitors' browsers call through its API.
