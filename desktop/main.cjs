// The Blue Book — macOS desktop app.
// A native window around the live web app, so it always has the latest version
// and the same cloud-synced documents as the website.

const { app, BrowserWindow, Menu, shell, session } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const APP_URL = process.env.BLUE_BOOK_URL || "https://thebluebook0.netlify.app";
const APP_ORIGIN = new URL(APP_URL).origin;
const STATE_FILE = path.join(app.getPath("userData"), "window-state.json");

let mainWindow = null;

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { width: 1440, height: 900 };
  }
}

function saveWindowState(win) {
  try {
    const bounds = win.getNormalBounds();
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify({ ...bounds, isMaximized: win.isMaximized() }),
    );
  } catch {
    // Not critical: the window just opens at the default size next time.
  }
}

function isAppUrl(url) {
  try {
    const { origin, hostname } = new URL(url);
    // Keep the app and its Supabase sign-in inside the window.
    return origin === APP_ORIGIN || hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function showOffline(win) {
  win.loadFile(path.join(__dirname, "offline.html"), {
    query: { url: APP_URL },
  });
}

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    title: "The Blue Book",
    backgroundColor: "#111111",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  if (state.isMaximized) mainWindow.maximize();

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", () => saveWindowState(mainWindow));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Links to other sites open in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file:")) return;
    if (!isAppUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // No connection: show a friendly retry page instead of a blank window.
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _desc, validatedURL, isMainFrame) => {
      if (isMainFrame && errorCode !== -3 && !validatedURL.startsWith("file:")) {
        showOffline(mainWindow);
      }
    },
  );

  mainWindow.loadURL(APP_URL);
}

function buildMenu() {
  const template = [
    { role: "appMenu" },
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.loadURL(APP_URL),
        },
        {
          label: "Open in Browser",
          click: () => shell.openExternal(APP_URL),
        },
        { type: "separator" },
        { role: "close" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "toggleDevTools" },
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Only one copy of the app at a time.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Deny camera, location and other permission prompts the app never needs,
    // but allow clipboard access for copy and paste.
    session.defaultSession.setPermissionRequestHandler(
      (_wc, permission, callback) => {
        callback(permission === "clipboard-sanitized-write" || permission === "clipboard-read");
      },
    );

    buildMenu();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
