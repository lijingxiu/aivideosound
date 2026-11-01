<!--created by lq 2026/7/22-->
const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    getFilePath: (file) => webUtils.getPathForFile(file),
    cacheVideo: (data) => ipcRenderer.invoke('cache-video', data),
    getCachedVideos: () => ipcRenderer.invoke('get-cached-videos'),
    removeCachedVideo: (id) => ipcRenderer.invoke('remove-cached-video', id),
    splitVideoAudio: (data) => ipcRenderer.invoke('split-video-audio', data),
    readTempFile: (filePath) => ipcRenderer.invoke('read-temp-file', filePath),
    writeTempFile: (data) => ipcRenderer.invoke('write-temp-file', data),
    readFileBytes: (filePath) => ipcRenderer.invoke('read-file-bytes', filePath),
    removeTempFiles: (paths) => ipcRenderer.invoke('remove-temp-files', paths),
    uploadOssFile: (data) => ipcRenderer.invoke('upload-oss-file', data)
})