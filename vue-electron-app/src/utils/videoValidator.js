import {
  SUPPORTED_VIDEO_EXT,
  SUPPORTED_CODECS,
  MAX_VIDEO_SIZE,
  MIN_VIDEO_DURATION,
  MAX_VIDEO_DURATION
} from '@/constants/project'

export function getFileExt(name) {
  const fileName = typeof name === 'string' ? name : ''
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : ''
}

export function getBaseName(name) {
  const fileName = typeof name === 'string' ? name : ''
  const idx = fileName.lastIndexOf('.')
  return idx >= 0 ? fileName.slice(0, idx) : fileName
}

export function validateVideoFile(video) {
  const errors = []
  const ext = getFileExt(video.name)
  const duration = Number(video.duration)

  if (!SUPPORTED_VIDEO_EXT.includes(ext)) {
    errors.push('格式不支持')
  }
  if (video.size > MAX_VIDEO_SIZE) {
    errors.push('已超过1G')
  }
  if (duration > MAX_VIDEO_DURATION) {
    errors.push('已超过60分钟')
  }
  if (Number.isFinite(duration) && duration > 0 && duration <= MIN_VIDEO_DURATION) {
    errors.push('时长必须大于10秒')
  }
  if (video.codec && !SUPPORTED_CODECS.includes(video.codec.toLowerCase())) {
    errors.push('编码格式不支持')
  }

  return errors
}

export function formatValidationMessage(name, errors) {
  return `${name}${errors.join('，')}，请检查修改`
}

export function naturalSort(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
}

export function matchSubtitleFiles(videos, folderPath, subtitleFiles = []) {
  const missing = []
  const fileMap = new Map(
    subtitleFiles.map(file => [getBaseName(file.name).toLowerCase(), file])
  )

  videos.forEach(video => {
    const key = getBaseName(video.name).toLowerCase()
    if (!fileMap.has(key)) {
      missing.push(video.name)
    }
  })

  return missing
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00:00.0'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const whole = Math.floor(s)
  const decimal = Math.floor((s - whole) * 10)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${decimal}`
}

export function formatFileSize(bytes) {
  if (!bytes) return '0B'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}M`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`
}
