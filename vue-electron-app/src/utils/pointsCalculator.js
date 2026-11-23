export function durationToUnits(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 0
  return Math.ceil(durationSeconds / 30)
}

export function calcVideoPointDetails(video, settings) {
  const units = durationToUnits(video.duration)
  if (!units) return []

  const config = settings.pointConfig || {}
  const rate = value => Number(value) || 0
  const details = []
  const add = (label, value) => {
    const points = units * rate(value)
    if (points > 0) details.push({label, points})
  }

  if (settings.subtitleSource === 'upload') add('上传字幕翻译', config.transSrt)
  else add('智能翻译', config.transAI)
  if (settings.subtitleSource === 'asr') add('语音识别', config.subtitleAsr)
  if (settings.subtitleSource === 'ocr') add('画面识别', config.subtitleOcr)
  if (settings.dubbingEnabled) {
    if (settings.dubbingTab === 'clone') add('原声克隆配音', config.dubClone)
    else if (settings.dubbingTab === 'match') add('智能配音', config.dubMatch)
    else add('手动选择配音', config.dubSelect)
  }
  if (settings.subtitleErase) add('字幕擦除', config.videoErasePro)
  if (settings.backgroundAudio !== 'keep') add('去除背景音', config.removeBgAudio)
  add('视频压制（基础必须项）', config.videoBurn)
  return details
}

export function calcVideoPoints(video, settings) {
  return calcVideoPointDetails(video, settings)
    .reduce((sum, item) => sum + item.points, 0)
}

export function calcTotalPoints(videos, settings) {
  return videos.reduce((sum, video) => sum + calcVideoPoints(video, settings), 0)
}
