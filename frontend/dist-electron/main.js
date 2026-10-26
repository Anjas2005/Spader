import { BrowserWindow, Menu, app } from "electron";
// electron/main.ts
Menu.setApplicationMenu(null);
app.whenReady().then(() => {
	const win = new BrowserWindow({
		width: 1280,
		height: 850,
		title: "Spader",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
	else win.loadFile("dist/index.html");
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
