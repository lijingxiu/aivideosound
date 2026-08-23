const { app, BrowserWindow, ipcMain} = require('electron');
const {join} = require("path");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    console.log(process.env.NODE_ENV)
    // 开发环境配置
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:8080')
        // mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
    }
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion()
})