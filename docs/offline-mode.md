# Offline mode

The Blue Book works with no internet connection, in the browser and in the Mac app. This builds on the existing local-first storage rather than replacing it.

## How it works

**1. The app itself is saved on the device** (`public/sw.js`, registered by `components/Offline/ServiceWorkerRegistrar.tsx`)

- A service worker keeps a copy of the page, JavaScript, CSS, fonts, icons and the PDF export library.
- Pages load network-first, so a new deploy shows up as soon as you're online. When you're offline, or the network takes longer than 4 seconds, the saved copy is used.
- `/api/*` (Jon) and Supabase are never cached.
- The Mac app gets this automatically, because it loads the same site. It has to be opened online once after this update.

**2. Writing is saved on the device first** (existing `LocalBlueBookRepository`)

- Every read and write uses the local copy.

**3. Changes are queued and synced** (`lib/storage/syncQueue.ts`, `lib/storage/offlineFirstRepository.ts`)

- Every write is recorded in a persistent outbox in localStorage. Ops are merged, so ten offline saves of one script upload once.
- The queue is drained when the app starts, when the connection comes back, when the tab becomes visible, and every 30 seconds while anything is pending.
- Content isn't stored in the queue. The latest local version is read when each op is sent.
- Network and auth failures stop the drain and retry later. A real server rejection is retried 6 times, then parked in `failed` so it can't block everything behind it.

**4. The whole library is downloaded while online**

- Opening the app pulls every project and document, so everything is available offline. Notion downloads selected pages; this app is single-user and text-only, so it downloads everything.
- Changes from other devices are pulled in. If the open script changed elsewhere and has no local edits, the editor reloads it.
- Something deleted on another device is removed locally, but only if this device has already seen it in the cloud and has no unsynced edits to it. Local data that was never uploaded is uploaded, never deleted.

**5. Conflicts never lose writing**

- For each document, the device remembers the cloud `updated_at` from its last sync (`docBase`).
- When sending a queued save, if the cloud copy is newer than that, someone edited it elsewhere. The cloud version stays in place, and this device's version is saved as a new document named "… (offline copy <date>)". A notice is shown.
- Notion merges conflicting edits at the text level with CRDTs. A copy is simpler, safe for a single writer, and can be upgraded later (see below).

**6. Signing in offline**

- If the saved session can't be refreshed because the device is offline, `AuthGate` still lets a previously signed-in user in to work locally. The queue syncs once they're back online and signed in.

**Jon** (the AI companion) needs the internet and says so when offline.

## Research: how Notion does it

From Notion's engineering posts ("How we made Notion available offline" and "How we sped up Notion in the browser with WASM SQLite"):

- Notion caches records in SQLite on desktop and mobile, and in the browser through WASM SQLite with OPFS. For offline mode, that cache became a guaranteed store.
- It tracks which pages are offline with `offline_page` and `offline_action` tables. Each action records a reason (toggled, favorite, recent, inherited), and a page leaves the offline set only when its last reason goes away.
- It never shows a page offline unless every record it needs is downloaded.
- Pages kept offline are moved to a CRDT data model for conflict resolution.
- To stay fresh, clients subscribe to per-page update channels instead of polling. On reconnect they compare `lastDownloadedTimestamp` with the server's `lastUpdatedTime`.

What this app borrows:

| Notion idea | How it shows up here |
| --- | --- |
| Local store as source of truth | `LocalBlueBookRepository` |
| Never show half a document | Whole documents are cached atomically |
| Timestamp comparison on reconnect | `docBase` against the cloud `updated_at` |
| Safe conflict resolution | Offline copy instead of overwrite |

## Possible next steps

- **Storage:** move local storage from localStorage (about 5 MB) to IndexedDB or WASM SQLite if the library grows large.
- **Conflicts:** CRDT text merging (for example, Yjs with TipTap's collaboration extension) instead of offline copies.
- **Freshness:** Supabase Realtime subscriptions to pull changes instantly instead of on open and focus.
