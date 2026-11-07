export const SUPPORTED_VIDEO_EXT = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'ts']
export const SUPPORTED_CODECS = ['h264', 'h265', 'hevc', 'avc']
export const MAX_VIDEO_COUNT = 100
export const MAX_VIDEO_SIZE = 2 * 1024 * 1024 * 1024
export const MIN_VIDEO_DURATION = 10
export const MAX_VIDEO_DURATION = 60 * 60

export const SUBTITLE_SOURCES = [
  {
    value: 'asr',
    label: '语音识别',
    tag: '推荐',
    tooltip: '8积分/分钟，ASR语音内容识别，适合有声音的视频'
  },
  {
    value: 'ocr',
    label: '画面识别',
    tooltip: '80积分/分钟，OCR提取字幕，速度慢，适合仅有画面的视频'
  },
  {
    value: 'upload',
    label: '上传字幕',
    tooltip: '4积分/分钟，选择SRT字幕所在文件夹，自动匹配与视频文件同名的字幕文件'
  }
]

export const POINTS_PER_30S = {
  asr: 4,
  ocr: 40,
  upload: 2,
  roleRecognition: 10,
  vocalSeparation: 10,
  subtitleErase: 100
}

export const UPLOAD_TOOLTIP = '单次任务不能超过100个视频，单个视频限制：≤2G，≥10秒，≤60分钟'
