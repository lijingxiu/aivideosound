const { app, BrowserWindow, ipcMain } = require('electron');
const { join, extname } = require('path');
const { existsSync, mkdirSync, readFileSync, writeFileSync, copyFile, unlink, rmSync } = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { pathToFileURL } = require('url');

const cacheDir = () => join(app.getPath('userData'), 'video-cache');
const cacheIndex = () => join(cacheDir(), 'index.json');

function readCacheIndex() {
    try {
        const file = cacheIndex();
        return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
    } catch (error) {
        console.error('读取视频缓存索引失败', error);
        return [];
    }
}

function saveCacheIndex(items) {
    mkdirSync(cacheDir(), { recursive: true });
    writeFileSync(cacheIndex(), JSON.stringify(items, null, 2), 'utf8');
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
    }
}

app.whenReady().then(() => createWindow());
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('get-app-version', () => app.getVersion());

// 将上传的视频复制到应用专属目录，而不是只保存短暂的 blob URL。
ipcMain.handle('cache-video', async (_event, { id, name, size, duration, sourcePath, bytes, thumbnail }) => {
    const dir = cacheDir();
    mkdirSync(dir, { recursive: true });
    const safeName = `${id}-${String(name || 'video').replace(/[^\w.\-\u4e00-\u9fa5]/g, '_')}`;
    const target = join(dir, safeName);

    if (sourcePath) {
        await new Promise((resolve, reject) => copyFile(sourcePath, target, error => error ? reject(error) : resolve()));
    } else if (bytes) {
        writeFileSync(target, Buffer.from(bytes));
    } else {
        throw new Error('无法读取视频文件');
    }

    const item = { id, name, size, duration, path: target, thumbnail: thumbnail || '' };
    const items = readCacheIndex().filter(video => video.id !== id);
    items.push(item);
    saveCacheIndex(items);
    return { ...item, fileUrl: pathToFileURL(target).href };
});

ipcMain.handle('get-cached-videos', () => readCacheIndex()
    .filter(video => existsSync(video.path))
    .map(video => ({ ...video, fileUrl: pathToFileURL(video.path).href })));

ipcMain.handle('split-video-audio', async (_event, { sourcePath, id, extension }) => {
    if (!sourcePath || !existsSync(sourcePath)) throw new Error('找不到待处理的视频文件');
    const dir = join(app.getPath('temp'), 'qianyin-media', String(id));
    mkdirSync(dir, { recursive: true });
    const sourceExt = extension || extname(sourcePath) || '.mp4';
    const mutePath = join(dir, `video-mute${sourceExt.startsWith('.') ? sourceExt : `.${sourceExt}`}`);
    const audioPath = join(dir, 'audio.mp3');

    await new Promise((resolve, reject) => {
        const process = spawn(ffmpegPath, [
            '-y', '-i', sourcePath,
            '-map', '0:v:0', '-c:v', 'copy', '-an', mutePath,
            '-map', '0:a:0?', '-vn', '-acodec', 'libmp3lame', '-b:a', '192k', audioPath
        ]);
        let error = '';
        process.stderr.on('data', chunk => { error += chunk.toString(); });
        process.on('error', reject);
        process.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg 处理失败: ${error.slice(-500)}`)));
    });

    return { mutePath, audioPath };
});

ipcMain.handle('remove-cached-video', (_event, id) => {
    const items = readCacheIndex();
    const target = items.find(video => video.id === id);
    if (target?.path && existsSync(target.path)) {
        try { rmSync(target.path, { force: true }); } catch (error) { console.error('删除视频缓存文件失败', error); }
    }
    saveCacheIndex(items.filter(video => video.id !== id));
    return true;
});

ipcMain.handle('read-temp-file', (_event, filePath) => {
    if (!filePath || !existsSync(filePath)) throw new Error('找不到处理后的文件');
    return new Uint8Array(readFileSync(filePath));
});

ipcMain.handle('read-file-bytes', (_event, filePath) => {
    if (!filePath || !existsSync(filePath)) throw new Error('找不到缓存视频文件');
    return new Uint8Array(readFileSync(filePath));
});

ipcMain.handle('remove-temp-files', (_event, paths) => {
    (paths || []).forEach(filePath => {
        if (filePath && existsSync(filePath)) rmSync(filePath, { force: true });
    });
    return true;
});

