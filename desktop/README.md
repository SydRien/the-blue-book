# The Blue Book for Mac

A native macOS app around the live web app (https://thebluebook0.netlify.app). It always runs the latest deployed version and uses the same cloud-synced documents as the website.

## Download

Get the latest `.dmg` from the repo's **Releases** page. Open it and drag **The Blue Book** into Applications.

The app isn't signed with an Apple Developer ID yet, so the first time you open it macOS will block it. To open it:

1. Open **Applications**, right-click **The Blue Book** and choose **Open**, then click **Open** again.
2. If there's no Open button (macOS 15 and later), go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway** next to The Blue Book.

You only have to do this once.

## Building a new version

Builds run on GitHub's Mac servers (`.github/workflows/desktop-mac.yml`):

- **New release:** bump `version` in `desktop/package.json`, commit, then push a tag such as `desktop-v1.0.1`. The workflow builds a universal (Apple silicon + Intel) `.dmg` and `.zip` and attaches them to a GitHub release.
- **Test build:** run the workflow by hand from the Actions tab. The files appear as a downloadable artifact.

Website changes don't need a new desktop build, because the app loads the live site.

## Local development (on a Mac)

```sh
cd desktop
npm install
npm start          # run the app
npm run dist:mac   # build the .dmg into desktop/dist
```

Set `BLUE_BOOK_URL=http://localhost:3000 npm start` to point the app at a local dev server.
