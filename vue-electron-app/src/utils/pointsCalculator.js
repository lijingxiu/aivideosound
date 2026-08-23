import { POINTS_PER_30S } from '@/constants/project'

export function durationToUnits(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 0
  return Math.ceil(durationSeconds / 30)
}

export function calcVideoPoints(video, settings) {
  const units = durationToUnits(video.duration)
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
  return videos.reduce((sum, video) => sum + calcVideoPoints(video, settings), 0)
}
