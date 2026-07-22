const { app, BrowserWindow } = require('electron');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    console.log(process.env.NODE_ENV)
    // 开发环境配置
    if (process.env.NODE_ENV === 'development') {

        mainWindow.loadURL('http://localhost:8080')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadURL('http://localhost:8080')
        mainWindow.webContents.openDevTools()
        // mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
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