const { app, BrowserWindow, ipcMain, shell, dialog, Menu, MenuItem } = require('electron');
const { join, extname } = require('path');
const log = require('electron-log/main');
const logsDir = join(app.getPath('userData'), 'logs');
const logPath = join(logsDir, 'main.log');
log.transports.file.resolvePathFn = () => logPath;
log.transports.file.maxSize = 10 * 1024 * 1024;
log.initialize({ spyRendererConsole: true });
Object.assign(console, log.functions);
console.log('[启动] 诊断信息:', {
    version: app.getVersion(),
    packaged: app.isPackaged,
    platform: process.platform,
    arch: process.arch,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    logPath
});
const { existsSync, mkdirSync, readFileSync, writeFileSync, copyFile, unlink, rmSync, statSync, createReadStream, chmodSync } = require('fs');
const { spawn } = require('child_process');
const ffmpegStaticPath = require('ffmpeg-static');

// 打包/拷贝过程中 ffmpeg 的执行位可能丢失（表现为 spawn EACCES），启动时自愈一次。
function ensureExecutable(filePath) {
    try {
        if (!filePath || !existsSync(filePath)) return;
        if (statSync(filePath).mode & 0o111) return;
        chmodSync(filePath, 0o755);
        console.log('[FFmpeg] 已补上可执行权限:', filePath);
    } catch (error) {
        console.error('[FFmpeg] 补可执行权限失败:', { filePath, error });
    }
}

function resolveFfmpegPath() {
    if (!ffmpegStaticPath) throw new Error(`未找到 FFmpeg 可执行文件: ${process.platform}/${process.arch}`);
    const candidates = [
        String(ffmpegStaticPath).replace(/app\.asar([\\/])/, 'app.asar.unpacked$1'),
        ffmpegStaticPath
    ];
    const resolved = candidates.find(candidate => candidate && existsSync(candidate));
    if (!resolved) throw new Error(`未找到 FFmpeg 可执行文件: ${process.platform}/${process.arch}`);
    ensureExecutable(resolved);
    return resolved;
}

const ffmpegPath = resolveFfmpegPath();
console.log('[FFmpeg] 可执行文件路径:', ffmpegPath);
const https = require('https');
const http = require('http');
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

function uploadFileToOss({ host, policy, filePath, fileName }) {
    return new Promise((resolve, reject) => {
        if (!filePath || !existsSync(filePath)) return reject(new Error('找不到待上传文件'));
        const target = new URL(host);
        const boundary = `----QianyinBoundary${Date.now().toString(16)}`;
        const fields = {
            key: policy.fileKey,
            policy: policy.policy,
            'x-oss-signature': policy.signature,
            'x-oss-date': policy.xOssDate,
            'x-oss-credential': policy.xOssCredential,
            'x-oss-signature-version': policy.xOssSignatureVersion,
            'success_action_status': '200'
        };
        if (policy.securityToken) fields['x-oss-security-token'] = policy.securityToken;
        const prefix = Object.entries(fields).map(([key, value]) =>
            `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        ).join('');
        const fileStat = statSync(filePath);
        const filePart = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${String(fileName || 'file').replace(/["\\]/g, '_')}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
        const suffix = `\r\n--${boundary}--\r\n`;
        const prefixBuffer = Buffer.from(prefix);
        const filePartBuffer = Buffer.from(filePart);
        const suffixBuffer = Buffer.from(suffix);
        const transport = target.protocol === 'http:' ? http : https;
        const req = transport.request({
            method: 'POST',
            hostname: target.hostname,
            port: target.port || (target.protocol === 'http:' ? 80 : 443),
            path: `${target.pathname}${target.search}`,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': prefixBuffer.length + filePartBuffer.length + fileStat.size + suffixBuffer.length
            }
        }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { body += chunk; });
            response.on('end', () => {
                const result = {
                    status: response.statusCode,
                    headers: response.headers,
                    body
                };
                if (response.statusCode >= 200 && response.statusCode < 300) resolve(result);
                else reject(new Error(`OSS 上传失败 (${response.statusCode}): ${body.slice(0, 300)}`));
            });
        });
        req.on('error', reject);
        req.write(prefixBuffer);
        req.write(filePartBuffer);
        const stream = createReadStream(filePath);
        stream.on('error', error => req.destroy(error));
        stream.on('end', () => req.end(suffixBuffer));
        stream.pipe(req, { end: false });
    });
}

ipcMain.handle('upload-oss-file', (_event, payload) => uploadFileToOss(payload));

function downloadExportFile(url, target) {
    return new Promise((resolve, reject) => {
        const transport = String(url).startsWith('http:') ? http : https;
        transport.get(url, response => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
                response.resume();
                return resolve(downloadExportFile(response.headers.location, target));
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                response.resume();
                return reject(new Error(`文件下载失败 (${response.statusCode})`));
            }
            const output = require('fs').createWriteStream(target);
            response.pipe(output);
            output.on('finish', () => output.close(resolve));
            output.on('error', reject);
        }).on('error', reject);
    });
}

function resolveFontsDir(fontsDir) {
    const candidates = [
        fontsDir,
        join(app.getAppPath(), 'public', 'fonts'),
        join(process.cwd(), 'public', 'fonts'),
        join(__dirname, '../../public/fonts'),
        join(process.resourcesPath || '', 'app.asar.unpacked/public/fonts'),
        join(process.resourcesPath || '', 'public/fonts')
    ].filter(Boolean);
    const resolved = candidates.find(candidate => existsSync(candidate) && require('fs').readdirSync(candidate).some(name => /\.(ttf|otf|ttc)$/i.test(name))) || '';
    console.log('[导出] 字体目录候选:', candidates);
    console.log('[导出] 使用字体目录:', resolved || '未找到');
    return resolved;
}

ipcMain.handle('get-fonts-dir', () => resolveFontsDir(''));
function getExportOutputPath(projectId, materialName, taskId) {
    const projectDir = join(app.getPath('userData'), String(projectId));
    const exportDir = join(projectDir, 'export');
    const id = String(taskId).replace(/[^\w.-]/g, '_');
    const safeMaterialName = String(materialName || id).replace(/[\\/:*?"<>|]/g, '_').replace(/\.[^.]+$/, '') || id;
    const outputPath = join(exportDir, `${safeMaterialName}-export.mp4`);
    console.log('[导出] 输出路径:', outputPath);
    return outputPath;
}

ipcMain.handle('open-export-folder', (_event, projectId) => {
    const dir = join(app.getPath('userData'), String(projectId), 'export');
    mkdirSync(dir, { recursive: true });
    return shell.openPath(dir);
});

ipcMain.handle('check-exported-video', (_event, { taskId, projectId, materialName }) => {
    const outputPath = getExportOutputPath(projectId, materialName, taskId);
    return { exists: existsSync(outputPath), path: outputPath };
});

ipcMain.handle('export-burn-video', async (event, payload) => {
    try {
        return await exportBurnVideo(event, payload);
    } catch (error) {
        console.error('[导出] 任务失败:', { taskId: payload.taskId, materialName: payload.materialName, error });
        const owner = BrowserWindow.fromWebContents(event.sender);
        const options = {
            type: 'error',
            title: '视频导出失败',
            message: `视频导出失败：${payload.materialName || payload.taskId}`,
            detail: `${error.message || String(error)}\n\n日志文件：${logPath}`,
            buttons: ['关闭', '打开日志文件夹'],
            defaultId: 0,
            cancelId: 0,
            noLink: true
        };
        try {
            const result = owner && !owner.isDestroyed()
                ? await dialog.showMessageBox(owner, options)
                : await dialog.showMessageBox(options);
            if (result.response === 1) {
                mkdirSync(logsDir, { recursive: true });
                const openError = await shell.openPath(logsDir);
                if (openError) console.error('[日志] 打开目录失败:', openError);
            }
        } catch (dialogError) {
            console.error('[导出] 显示错误弹窗失败:', dialogError);
        }
        throw error;
    }
});

async function exportBurnVideo(event, { taskId, projectId, materialName, videoUrl, audioUrl, subtitleUrl, fontsDir }) {
    const projectDir = join(app.getPath('userData'), String(projectId));
    const dir = join(projectDir, 'downloadfiles');
    const exportDir = join(projectDir, 'export');
    mkdirSync(dir, { recursive: true });
    mkdirSync(exportDir, { recursive: true });
    const id = String(taskId).replace(/[^\w.-]/g, '_');
    const extFromUrl = (value, fallback) => {
        try {
            const pathname = new URL(value).pathname;
            const ext = extname(pathname);
            return ext && ext.length <= 6 ? ext : fallback;
        } catch (error) {
            return fallback;
        }
    };
    const videoPath = join(dir, `${id}${extFromUrl(videoUrl, '.mp4')}`);
    const audioPath = join(dir, `${id}${extFromUrl(audioUrl, '.mp3')}`);
    const subtitlePath = join(dir, `${id}${extFromUrl(subtitleUrl, '.ass')}`);
    const outputPath = getExportOutputPath(projectId, materialName, taskId);
    if (existsSync(outputPath)) {
        console.log('[导出] 已存在导出视频，直接标记成功:', outputPath);
        return { path: outputPath, alreadyExported: true };
    }
    if (!videoUrl || !audioUrl || !subtitleUrl) throw new Error('缺少 burnAssUrl、burnAudioUrl 或 burnMuteVideoUrl');
    console.log('[导出] 下载目录:', dir);
    console.log('[导出] 视频下载路径:', videoPath);
    console.log('[导出] 音频下载路径:', audioPath);
    console.log('[导出] 字幕下载路径:', subtitlePath);
    const downloads = [
        { url: videoUrl, target: videoPath, name: '视频' },
        { url: audioUrl, target: audioPath, name: '音频' },
        { url: subtitleUrl, target: subtitlePath, name: '字幕' }
    ].filter(item => {
        if (existsSync(item.target)) {
            console.log(`[导出] ${item.name}已存在，跳过下载:`, item.target);
            return false;
        }
        return true;
    });
    if (downloads.length) {
        try {
            await Promise.all(downloads.map(item => downloadExportFile(item.url, item.target)));
            console.log('[导出] 文件下载完成:', { videoPath, audioPath, subtitlePath });
        } catch (error) {
            console.error('[导出] 文件下载失败:', error && error.message);
            throw new Error('文件下载失败');
        }
    } else {
        console.log('[导出] 所有素材均已存在，直接开始压制');
    }
    event.sender.send('export-download-complete', taskId);
    const escapeFilterPath = value => String(value)
        .replace(/\\/g, '/')
        .replace(/:/g, '\\\\:')
        .replace(/ /g, '\\\\ ')
        .replace(/'/g, "\\\\'");
    const escapedSubtitle = escapeFilterPath(subtitlePath);
    const resolvedFontsDir = resolveFontsDir(fontsDir);
    const escapedFontsDir = resolvedFontsDir ? escapeFilterPath(resolvedFontsDir) : '';
    const filter = `[0:v]noise=alls=2:allf=t,eq=brightness=0.003:contrast=1.002,scale=iw+4:ih+4,crop=iw-4:ih-4:2:2,subtitles=filename=${escapedSubtitle}${escapedFontsDir ? `:fontsdir=${escapedFontsDir}` : ''}[vout]`;
    const args = ['-hide_banner', '-v', 'info', '-stats', '-y', '-i', videoPath, '-i', audioPath, '-filter_complex', filter, '-map', '[vout]', '-c:v', 'libx264', '-crf', '22', '-preset', 'faster', '-map', '1:a', '-c:a', 'copy', '-map_metadata', '-1', outputPath];
    console.log('[导出] 开始压制:', { taskId, command: ffmpegPath, args, outputPath });
    await new Promise((resolve, reject) => {
        const child = spawn(ffmpegPath, args);
        let stderr = '';
        child.stderr.on('data', chunk => { stderr += chunk.toString(); });
        child.on('error', error => {
            console.error('[导出] FFmpeg 启动失败:', error);
            reject(error);
        });
        child.on('close', code => {
            if (code === 0) {
                console.log('[导出] FFmpeg 压制完成:', outputPath);
                resolve();
            } else {
                console.error('[导出] FFmpeg 压制失败:', {
                    exitCode: code,
                    command: ffmpegPath,
                    args,
                    stderr
                });
                reject(new Error(`压制失败 (退出码 ${code})\n${stderr || 'FFmpeg 未返回错误详情'}`));
            }
        });
    });
    return { path: outputPath };
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
        console.error('[窗口] 预加载脚本失败:', { preloadPath, error });
    });
    mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
        console.error('[窗口] 页面加载失败:', { code, description, url });
    });
    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error('[窗口] 渲染进程退出:', details);
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:8080');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();
    const menu = Menu.getApplicationMenu() || new Menu();
    menu.append(new MenuItem({
        label: '诊断',
        submenu: [
            {
                label: '打开日志文件夹',
                accelerator: 'CmdOrCtrl+Alt+L',
                click: async () => {
                    mkdirSync(logsDir, { recursive: true });
                    const error = await shell.openPath(logsDir);
                    if (error) console.error('[日志] 打开目录失败:', error);
                }
            },
            { label: '开发者工具', accelerator: 'CmdOrCtrl+Alt+I', role: 'toggleDevTools' }
        ]
    }));
    Menu.setApplicationMenu(menu);
});
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

ipcMain.handle('write-temp-file', (_event, { fileName, bytes }) => {
    const dir = join(app.getPath('temp'), 'qianyin-media', 'thumbnails');
    mkdirSync(dir, { recursive: true });
    const safeName = String(fileName || 'thumbnail.jpg').replace(/[^\\w.\\-]/g, '_');
    const filePath = join(dir, `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`);
    writeFileSync(filePath, Buffer.from(bytes));
    return filePath;
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

