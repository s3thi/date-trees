# Bugfix plan

Bugs to fix, in priority order. The vault root is an allowed date tree.

| # | Issue | Priority |
| - | ----- | -------- |
| 2 | Configured paths go stale on rename/delete | High |

---

## 2. Configured paths go stale on rename/delete

**Priority: High** — rename and delete are everyday vault operations; stored paths silently rot with no feedback.

### Fix
In `main.ts onload()`, register rename/delete handlers via `this.registerEvent(...)` (so they're cleaned up on unload) that update or prune `settings.trees`:

```ts
this.registerEvent(
  this.app.vault.on("rename", async (file, oldPath) => {
    let changed = false;
    for (const t of this.settings.trees) {
      if (t.folderPath === oldPath) { t.folderPath = file.path; changed = true; }
      if (t.templatePath === oldPath) { t.templatePath = file.path; changed = true; }
    }
    if (changed) await this.saveSettings();
  }),
);
this.registerEvent(
  this.app.vault.on("delete", async (file) => {
    const before = this.settings.trees.length;
    this.settings.trees = this.settings.trees.filter((t) => t.folderPath !== file.path);
    for (const t of this.settings.trees) {
      if (t.templatePath === file.path) t.templatePath = "";
    }
    if (this.settings.trees.length !== before /* or a template was cleared */) {
      await this.saveSettings();
    }
  }),
);
```

### Verify
- Mark a tree, rename its folder in the vault, reopen settings → the entry shows the new path.
- Delete a configured template → the entry's template reverts to `(none)`; delete a configured folder → the entry disappears.

### Files
- `src/main.ts`
