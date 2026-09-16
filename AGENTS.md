# Date Trees — agent guide

Obsidian community plugin: TypeScript in `src/` bundled by esbuild to `main.js` at the repo root.

## Commands

- `pnpm install` — install deps (pnpm required).
- `pnpm run dev` — esbuild watch.
- `pnpm run build` — typecheck (`tsc -noEmit`) then production bundle.
- `pnpm run lint` — ESLint with `eslint-plugin-obsidianmd`.

Run `pnpm run lint` and `pnpm run build` after changes. No test suite; verify manually (below).

## Layout

```
src/
  main.ts        # plugin lifecycle only (onload/onunload)
  types.ts       # settings types + DEFAULT_SETTINGS
  core/          # domain logic: paths, templates, events, validation, settings
  ui/            # registration: commands, context menus, settings tab, pickers
  commands/      # individual command implementations
```

Keep `main.ts` minimal; delegate feature logic to `core/` and `ui/`. Split files past ~200–300 lines.

## Conventions

- TypeScript `strict` plus `noUncheckedIndexedAccess`; prefer `async/await`.
- Bundle everything into `main.js`; no unbundled runtime deps; prefer browser-compatible packages (mobile-friendly, `isDesktopOnly: false`).
- Register all DOM/app/interval listeners with `this.register*` so unload is clean and idempotent.
- Keep startup light; batch disk access, avoid scanning the whole vault, debounce file-system reactions.
- User-facing strings: sentence case, short, action-oriented, no jargon.

## Manifest & release

- `manifest.json` fields: `id`, `name`, `version` (SemVer), `minAppVersion`, `description`, `isDesktopOnly` (+ optional author fields). Never change `id` after release.
- Release tag must exactly equal `manifest.json`'s `version` (no leading `v`); attach `main.js`, `manifest.json`, `styles.css`.
- Update `versions.json` alongside version bumps.
- Never commit build artifacts (`main.js`, `node_modules/`, maps).

## Manual testing

Copy `main.js`, `manifest.json`, and `styles.css` to `<Vault>/.obsidian/plugins/date-trees/`, then reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Security & privacy

Local/offline by default. No hidden telemetry, no remote code. Only read/write inside the vault, only what the feature needs. Document any network call and require explicit opt-in.

## Writing

Omit needless words in READMEs, plan files, code comments, commit messages, and UI copy. Plan files contain only what's needed to execute: a one-line motivation plus the steps. No conversation history, dropped alternatives, or speculative future work.

## Doc comments

- All new code must have doc comments unless it is trivially simple or extremely short.
- Keep doc comments in sync with the code they document. Update them whenever relevant code changes.
- Use `/** ... */` immediately above declarations. Prefer multiline blocks with ` *` prefixes. Wrap near 80 columns.
- Start with what the code does: “Creates…”, “Ensures…”, “Finds…”. Use short noun phrases for types and fields.
- Usually write one or two sentences, in sentence case with periods. Use plain language and familiar project terms.
- Mention relevant side effects, fallbacks, no-op behavior, and special values.
- Put identifiers, tokens, and format strings in backticks.
- Add a separate paragraph only when a constraint or design choice needs explanation. Use a small example when it clarifies behavior.

## References

- API docs: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
