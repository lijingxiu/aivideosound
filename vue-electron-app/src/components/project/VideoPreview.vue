<template>
  <div class="video-preview">
    <div ref="previewRef" class="video-preview__screen">
      <video
        v-if="video?.objectUrl"
        ref="videoRef"
        :src="video.objectUrl"
        class="video-preview__video"
        @loadedmetadata="onLoaded"
        @loadeddata="updateVideoRect"
        @timeupdate="onTimeUpdate"
      />
      <div v-else class="video-preview__empty">暂无预览</div>

      <div v-if="showSelectBox && videoRect" class="video-preview__overlay" :style="overlayStyle">
        <SubtitleSelectBox
          :value="localRegion"
          :label="selectLabel"
          @input="localRegion = $event"
        />
      </div>
      <div v-if="subtitlePreview && videoRect" class="video-preview__subtitle-layer" :style="subtitleLayerStyle">
        <span class="video-preview__subtitle" :style="subtitleTextStyle">{{ subtitlePreview.text }}</span>
      </div>
    </div>

    <div class="video-preview__controls">
      <button class="video-preview__play" @click="togglePlay">
        {{ playing ? '⏸' : '▶' }}
      </button>
      <div class="video-preview__progress" @click="seek">
        <div class="video-preview__progress-bar" :style="{ width: progressPercent + '%' }" />
      </div>
      <span class="video-preview__time">
        {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
      </span>
    </div>
  </div>
</template>

<script>
import SubtitleSelectBox from './SubtitleSelectBox.vue'
import { formatDuration } from '@/utils/videoValidator'

export default {
  name: 'VideoPreview',
  components: { SubtitleSelectBox },
  props: {
    video: { type: Object, default: null },
    showSelectBox: { type: Boolean, default: false },
    selectLabel: { type: String, default: '' },
    region: {
      type: Object,
      default: () => ({ x: 0.1, y: 0.65, w: 0.8, h: 0.2 })
    },
    subtitlePreview: { type: Object, default: null }
  },
  emits: ['update:region'],
  data() {
    return {
      playing: false,
      currentTime: 0,
      duration: 0,
      videoRect: null
    }
  },
  computed: {
    localRegion: {
      get() { return this.region },
      set(val) { this.$emit('update:region', val) }
    },
    overlayStyle() {
      if (!this.videoRect) return {}
      const { left, top, width, height } = this.videoRect
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      }
    },
    progressPercent() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    },
    subtitleLayerStyle() {
      if (!this.videoRect) return {}
      return {
        left: `${this.videoRect.left}px`,
        top: `${this.videoRect.top}px`,
        width: `${this.videoRect.width}px`,
        height: `${this.videoRect.height}px`
      }
    },
    subtitleTextStyle() {
      const settings = this.subtitlePreview || {}
      const scale = this.videoRect?.width ? this.videoRect.width / 1080 : 1
      const fontSize = (Number(settings.size) || 32) * scale
      const style = {
        fontFamily: settings.font || 'sans-serif',
        fontSize: `${fontSize}px`,
        color: settings.color || '#fff',
        fontWeight: settings.bold ? 'bold' : 'normal'
      }
      if (settings.background === 'outline') {
        const width = Math.max(1, (Number(settings.strokeWidth) || 1) * scale)
        const color = settings.strokeColor || '#000'
        style.textShadow = Array.from({ length: 16 }, (_, index) => {
          const angle = (Math.PI * 2 * index) / 16
          return `${Math.cos(angle) * width}px ${Math.sin(angle) * width}px 0 ${color}`
        }).join(', ')
      } else if (settings.background === 'background') {
        style.backgroundColor = settings.bgColor
        style.padding = `${4 * scale}px ${8 * scale}px`
      }
      // position 表示字幕底部距画面底部的百分比距离。
      const position = Math.min(Math.max(Number(settings.position) || 0, 0), 100)
      const offset = (this.videoRect?.height || 0) * (position / 100)
      style.marginBottom = `${Math.min(offset, Math.max(0, (this.videoRect?.height || 0) - fontSize * 1.5))}px`
      return style
    }
  },
  watch: {
    video() {
      this.playing = false
      this.currentTime = 0
      this.duration = this.video?.duration || 0
      this.videoRect = null
      this.$nextTick(this.updateVideoRect)
    }
  },
  mounted() {
    window.addEventListener('resize', this.updateVideoRect)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateVideoRect)
  },
  methods: {
    formatDuration,
    onLoaded() {
      this.duration = this.$refs.videoRef?.duration || this.video?.duration || 0
      this.updateVideoRect()
    },
    updateVideoRect() {
      const video = this.$refs.videoRef
      const screen = this.$refs.previewRef
      if (!video || !screen || !video.videoWidth || !video.videoHeight) {
        this.videoRect = null
        return
      }
      const screenRect = screen.getBoundingClientRect()
      const videoRect = video.getBoundingClientRect()
      // 视频在容器内以等比缩放居中显示，用实际渲染尺寸作为选择框的边界。
      this.videoRect = {
        left: videoRect.left - screenRect.left,
        top: videoRect.top - screenRect.top,
        width: videoRect.width,
        height: videoRect.height
      }
    },
    onTimeUpdate() {
      this.currentTime = this.$refs.videoRef?.currentTime || 0
    },
    togglePlay() {
      const el = this.$refs.videoRef
      if (!el) return
      if (el.paused) {
        el.play()
        this.playing = true
      } else {
        el.pause()
        this.playing = false
      }
    },
    seek(e) {
      const el = this.$refs.videoRef
      if (!el || !this.duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      el.currentTime = ratio * this.duration
    }
  }
}
</script>

<style scoped lang="scss">
.video-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;

  &__screen {
    position: relative;
    flex: 1;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 360px;
  }

  &__video {
    max-width: 100%;
    max-height: 100%;
    display: block;
  }

  &__overlay {
    position: absolute;
    overflow: hidden;
  }

  &__subtitle-layer {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    pointer-events: none;
  }

  &__subtitle {
    max-width: 90%;
    padding: 2px 4px;
    line-height: 1.3;
    text-align: center;
    white-space: nowrap;
    align-self: flex-end;
  }

  &__empty {
    color: #666;
    font-size: 14px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-top: 1px solid #eee;
    background: #fafafa;
  }

  &__play {
    width: 28px;
    height: 28px;
    font-size: 12px;
    color: #ff7a00;
  }

  &__progress {
    flex: 1;
    height: 4px;
    background: #e8e8e8;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
  }

  &__progress-bar {
    height: 100%;
    background: #ff7a00;
    border-radius: 2px;
  }

  &__time {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }
}
</style>
