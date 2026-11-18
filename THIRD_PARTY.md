# Third-party software

This repository contains no third-party code. The site loads these at runtime from `cdn.design-system.alpha.canada.ca`:

| Component | Version | License | Use |
|---|---|---|---|
| [GC Design System components](https://github.com/cds-snc/gcds-components) (`@cdssnc/gcds-components`) | 0.47.0 | [MIT](https://github.com/cds-snc/gcds-components/blob/main/LICENSE) | Page header, footer and interface |
| Lato, from [GC Design System fonts](https://github.com/cds-snc/gcds-fonts) (`@cdssnc/gcds-fonts`) | 0.2.2 | SIL Open Font License 1.1, © Łukasz Dziedzic | Headings |
| Noto Sans, from GC Design System fonts | 0.2.2 | SIL Open Font License 1.1, © Google Inc. | Body text |
| GCDS icons, from GC Design System fonts | 0.2.2 | SIL Open Font License 1.1, © His Majesty in Right of Canada | Icons, loaded by the components' stylesheet |

The Canada wordmark in the footer is drawn by the GC Design System components. The department signature in the header, for example Statistics Canada's, isn't included. It's official Federal Identity Program artwork that the deploying department supplies, and it isn't covered by this repository's MIT license.

The site also needs a GitLab instance, which visitors' browsers call through its API. It isn't distributed with this repository.
