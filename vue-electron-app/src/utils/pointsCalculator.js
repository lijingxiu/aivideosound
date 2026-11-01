export function durationToUnits(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 0
  return Math.max(1, Math.floor(durationSeconds / 30))
}

export function calcVideoPoints(video, settings) {
  const units = durationToUnits(video.duration)
  if (!units) return 0

  const config = settings.pointConfig || {}
  const rate = value => Number(value) || 0
  const translationRate = settings.subtitleSource === 'upload'
    ? rate(config.transSrt)
    : rate(config.transAI)
  let points = units * (translationRate + rate(config.videoBurn))

  if (settings.subtitleSource === 'asr') points += units * rate(config.subtitleAsr)
  if (settings.subtitleSource === 'ocr') points += units * rate(config.subtitleOcr)
  if (settings.dubbingEnabled) {
    points += units * rate(settings.dubbingTab === 'clone' ? config.dubClone : config.dubSelect)
  }
  if (settings.subtitleErase) points += units * rate(config.videoErasePro)
  if (settings.backgroundAudio !== 'keep') points += units * rate(config.removeBgAudio)

  return points
}

export function calcTotalPoints(videos, settings) {
  return videos.reduce((sum, video) => sum + calcVideoPoints(video, settings), 0)
}
