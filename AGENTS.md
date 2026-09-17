# Date Trees — agent guide

Obsidian community plugin: TypeScript in `src/` bundled by esbuild to `main.js` at the repo root.

## Commands

- `pnpm install` — install deps (pnpm required).
- `pnpm run dev` — esbuild watch.
- `pnpm run build` — typecheck (`tsc -noEmit`) then production bundle.
- `pnpm run lint` — ESLint with `eslint-plugin-obsidianmd`.

Run `pnpm run lint` and `pnpm run build` only when code changes; skip them for documentation-only edits. No test suite; verify code changes manually (below).

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

Run the Obsidian CLI with a TTY (`tty: true` in `exec_command`). Without it,
commands can exit successfully without running or returning results. Target this
vault with `vault="Date trees"`.

## Security & privacy

Local/offline by default. No hidden telemetry, no remote code. Only read/write inside the vault, only what the feature needs. Document any network call and require explicit opt-in.

## Writing

Omit needless words in READMEs, plan files, code comments, commit messages, and UI copy. Plan files contain only what's needed to execute: a one-line motivation plus the steps. No conversation history, dropped alternatives, or speculative future work.

## Narrative comments

Write functions so they read like a story. Use comments above logical
steps to explain what happens, in execution order.

- Make comments easy to read. Use familiar words, short sentences, and
  natural phrasing. Explain one idea at a time.
- Prefer a few simple sentences over one dense sentence. The purpose is
  to make the code easier to follow, not to pack the same information
  into prose.
- Describe what each step does, including straightforward behavior when
  it helps the reader follow the story. Comments need not explain only why.
- Cover meaningful branches, early returns, and side effects.
- Use project terms rather than translating syntax into English.
- Add enough detail that a reader can follow the function's flow by
  reading its comments alone. Group related operations under one comment.
- Keep the narration accurate as the code changes.

Prefer:
“If the user cancelled the picker, stop here. Nothing has changed yet.”

Avoid:
“Abort execution upon cancellation to preserve the existing configuration.”

## Doc comments

- Add doc comments to new declarations unless their purpose and behavior are obvious from the code.
- Keep doc comments in sync with the code they document. Update them whenever relevant code changes.
- Use `/** ... */` immediately above declarations. Prefer multiline blocks with ` *` prefixes. Wrap near 80 columns.
- Start with what the code does: “Creates…”, “Ensures…”, “Finds…”. Use short noun phrases for types and fields.
- Usually write one or two sentences, in sentence case with periods. Use plain language and familiar project terms.
- Mention relevant side effects, fallbacks, no-op behavior, and special values.
- Put identifiers, tokens, and format strings in backticks.
- Add a separate paragraph only when a constraint or design choice needs explanation. Use a small example when it clarifies behavior.

## Releasing

Use pnpm to bump versions and Git to commit and tag the release. Check `git status --short` before switching to `main`; proceed only with a clean working tree. Replace every `1.1.0` below with the release version, without a leading `v`.

```sh
git switch main
pnpm version 1.1.0 --no-git-tag-version
pnpm run lint
pnpm run build
git diff
```

The flag prevents an automatic commit and tag so you can review and build first. The version script updates `manifest.json` and adds the release to `versions.json` if absent. Review the diff: `package.json` and `manifest.json` must match the release version, and `versions.json` must map it to `manifest.json`'s `minAppVersion`. Complete manual verification before committing.

Stage and review the version files:

```sh
git add package.json manifest.json versions.json
git diff --cached
```

Confirm the staged diff contains only the reviewed version changes, then commit, tag, and push:

```sh
git commit -m "Release 1.1.0"
git tag -a 1.1.0 -m "Release 1.1.0"
git push origin main
git push origin tag 1.1.0
```

After every release, remind the developer to run this command from the repository root:

```sh
pnpm release:draft
```

The command reads the version from `package.json`, verifies that the tag exists on GitHub, and attaches `main.js`, `manifest.json`, and `styles.css` to a draft with autogenerated notes. The developer creates the draft locally, then edits the notes and publishes the release in the browser.

## References

- API docs: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
