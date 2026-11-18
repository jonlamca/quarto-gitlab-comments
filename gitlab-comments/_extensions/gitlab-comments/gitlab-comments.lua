-- Appends the GitLab comments module to the bottom of each HTML page.
-- Config comes from the `gitlab-comments` metadata map and is passed to the JS as data-* attributes.
function Pandoc(doc)
  local cfg = doc.meta["gitlab-comments"]
  if type(cfg) ~= "table" or not quarto.doc.is_format("html:js") then return end

  local attrs = {}
  for k, v in pairs(cfg) do
    attrs["data-" .. k] = type(v) == "boolean" and tostring(v) or pandoc.utils.stringify(v)
  end
  -- Source path is the stable page key (deploy URLs vary: /, /index.html, subpaths).
  -- A page can set `page:` to share another page's discussion, e.g. fr/install.qmd -> install.qmd.
  local dir = quarto.project.directory
  attrs["data-page"] = attrs["data-page"] or (dir and pandoc.path.make_relative(quarto.doc.input_file, dir)
    or pandoc.path.filename(quarto.doc.input_file))

  quarto.doc.add_html_dependency({ name = "gitlab-comments", version = "0.1.0", scripts = { "gitlab-comments.js" } })
  -- GC Design System, pinned as GCDS recommends; bump the version to upgrade.
  -- A site that already loads this exact URL gets it once (browsers load a module URL once).
  local gcds = "https://cdn.design-system.alpha.canada.ca/@cdssnc/gcds-components@0.47.0/dist/gcds/gcds"
  quarto.doc.include_text("in-header", ('<link rel="stylesheet" href="%s.css">\n<script type="module" src="%s.esm.js"></script>'):format(gcds, gcds))
  doc.blocks:insert(pandoc.Div({}, pandoc.Attr("gitlab-comments", {}, attrs)))
  return doc
end
