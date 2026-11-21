# The Blue Book — logo

The logo is a single-colour blue book with a ribbon cut out of its bottom edge as negative space. Use these files for this web app and for any future Blue Book apps.

## Colours

| Use | Hex |
| --- | --- |
| Brand blue (mark) | `#34507e` |
| Ink (wordmark on light) | `#2b2a28` |
| Cream (light background) | `#efebe5` |

The mark is always one flat colour. Don't add a spine, gradient or outline. The ribbon is a cut-out: whatever is behind the logo shows through it.

## Wordmark

"The Blue Book" on one line, in a book serif (Crimson Pro), set to the right of the mark. The mark's height is about 1.2× the cap height of the wordmark.

## Files

| File | Use |
| --- | --- |
| `blue-book-mark.svg` | Master mark (blue), 3:4 |
| `blue-book-mark-white.svg` | Mark for dark or photo backgrounds |
| `blue-book-mark-ink.svg` | One-colour print / fax |
| `blue-book-mark-256.png`, `-1024.png` | Raster mark |
| `blue-book-icon.svg`, `blue-book-icon-{16,32,48,192,512,1024}.png` | Square icon, transparent (favicons, web) |
| `blue-book-app-icon.svg`, `blue-book-app-icon-{180,192,512,1024}.png` | Square icon on cream (iOS / Android / maskable / app stores) |

In the web app:

- `app/icon.svg`, `app/favicon.ico` and `app/apple-icon.png` are the browser and home-screen icons.
- `app/manifest.ts` is the install manifest.
- `components/Brand/BlueBookMark.tsx` is the React component used in the header and on the sign-in screen.
