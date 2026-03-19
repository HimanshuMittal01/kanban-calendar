import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

// --- File-based storage ---
const userDataPath = app.getPath('userData')
const storagePath = join(userDataPath, 'store.json')

function ensureDir(): void {
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
}

// Synchronous read — used by renderer to hydrate store before first render
ipcMain.on('store:get-sync', (event) => {
  try {
    if (existsSync(storagePath)) {
      event.returnValue = readFileSync(storagePath, 'utf-8')
      return
    }
  } catch {
    // first launch or corrupt file
  }
  event.returnValue = null
})

// Async write — used on every state change
ipcMain.handle('store:set', (_event, data: string) => {
  ensureDir()
  writeFileSync(storagePath, data, 'utf-8')
})

// --- Window ---
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
