export const SUPPORTED_VIDEO_EXT = ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv', 'ts']
export const SUPPORTED_CODECS = ['h264', 'h265', 'hevc', 'avc']
export const MAX_VIDEO_COUNT = 100
export const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024
export const MIN_VIDEO_DURATION = 10
export const MAX_VIDEO_DURATION = 120 * 60

export const SOURCE_LANGUAGES = [
  { label: '中文', value: 'zh' },
  { label: '英语', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
  { label: '德语', value: 'de' },
  { label: '西班牙语', value: 'es' },
  { label: '俄语', value: 'ru' },
  { label: '阿拉伯语', value: 'ar' },
  { label: '葡萄牙语', value: 'pt' }
]

export const SUBTITLE_SOURCES = [
  {
    value: 'asr',
    label: '语音识别',
    tag: '推荐',
    tooltip: '10积分/分钟，ASR语音内容识别，适合有声音的视频'
  },
  {
    value: 'ocr',
    label: '画面识别',
    tooltip: '80积分/分钟，OCR提取字幕，速度慢，适合仅有画面的视频'
  },
  {
    value: 'upload',
    label: '上传字幕',
    tooltip: '2积分/分钟，上传SRT字幕，自动为视频匹配字幕'
  }
]

export const POINTS_PER_30S = {
  asr: 5,
  ocr: 40,
  upload: 1,
  roleRecognition: 10,
  vocalSeparation: 10,
  subtitleErase: 100
}

export const UPLOAD_TOOLTIP = '单次任务不能超过100个视频，单个视频限制：≤4G，≥10秒，≤2小时'
