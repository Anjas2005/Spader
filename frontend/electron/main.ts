import { app, BrowserWindow, Menu } from 'electron'

// Don't give me a menu bar
Menu.setApplicationMenu(null)

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'Spader',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void win.loadFile('dist/index.html')
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})