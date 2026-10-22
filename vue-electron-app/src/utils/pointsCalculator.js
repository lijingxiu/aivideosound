import { POINTS_PER_30S } from '@/constants/project'

export function durationToUnits(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 0
  // 每个视频最低按 30 秒计费；超过首个 30 秒后，只计算完整的 30 秒，
  // 不满下一个 30 秒的尾数忽略（例如 31 秒按 1 个单位，60 秒按 2 个单位）。
  return Math.max(1, Math.floor(durationSeconds / 30))
}

export function calcVideoPoints(video, settings) {
  const units = durationToUnits(video.duration)
  return calcPointsByUnits(units, settings)
}

function calcPointsByUnits(units, settings) {
  if (!units) return 0

  let points = 0
  const subtitleRate = POINTS_PER_30S[settings.subtitleSource] || 0
  points += units * subtitleRate

  if (settings.roleRecognition) {
    points += units * POINTS_PER_30S.roleRecognition
  }
  if (settings.vocalSeparation) {
    points += units * POINTS_PER_30S.vocalSeparation
  }
  if (settings.subtitleErase) {
    points += units * POINTS_PER_30S.subtitleErase
  }

  return points
}

export function calcTotalPoints(videos, settings) {
  // 每个视频独立计算计费单位，再累加，视频之间不合并时长。
  return videos.reduce((sum, video) => {
    return sum + calcVideoPoints(video, settings)
  }, 0)
}
