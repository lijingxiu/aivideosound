<template>
  <div class="video-preview">
    <div ref="previewRef" class="video-preview__screen">
      <video
        v-if="video?.objectUrl"
        ref="videoRef"
        :src="video.objectUrl"
        class="video-preview__video"
        @loadedmetadata="onLoaded"
        @timeupdate="onTimeUpdate"
      />
      <div v-else class="video-preview__empty">暂无预览</div>

      <SubtitleSelectBox
        v-if="showSelectBox"
        v-model="localRegion"
        :label="selectLabel"
      />
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
    }
  },
  emits: ['update:region'],
  data() {
    return {
      playing: false,
      currentTime: 0,
      duration: 0
    }
  },
  computed: {
    localRegion: {
      get() { return this.region },
      set(val) { this.$emit('update:region', val) }
    },
    progressPercent() {
      if (!this.duration) return 0
      return (this.currentTime / this.duration) * 100
    }
  },
  watch: {
    video() {
      this.playing = false
      this.currentTime = 0
      this.duration = this.video?.duration || 0
    }
  },
  methods: {
    formatDuration,
    onLoaded() {
      this.duration = this.$refs.videoRef?.duration || this.video?.duration || 0
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
