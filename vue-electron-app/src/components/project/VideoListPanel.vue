<template>
  <div class="video-list-panel">
    <AppTooltip :text="uploadTooltip" placement="bottom">
      <button class="video-list-panel__upload-btn" @click="$emit('upload')">上传视频</button>
    </AppTooltip>

    <p class="video-list-panel__note">注：项目设置对所有视频有效</p>

    <div class="video-list-panel__list">
      <div
        v-for="(video, index) in videos"
        :key="video.id"
        class="video-item"
        :class="{ 'video-item--active': video.id === activeId }"
        @click="$emit('select', video.id)"
      >
        <span class="video-item__index">{{ index + 1 }}</span>
        <button class="video-item__delete" aria-label="删除视频" title="删除视频"
                @click.stop="$emit('remove', video.id)">
          <span aria-hidden="true">×</span>
        </button>
        <div class="video-item__thumb">
          <img v-if="video.thumbnail" :src="video.thumbnail" alt="" />
          <span v-else class="video-item__thumb-placeholder">▶</span>
        </div>
        <p class="video-item__name" :title="video.name">{{ video.name }}</p>
        <p class="video-item__meta">{{ formatDuration(video.duration) }} | {{ formatFileSize(video.size) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import AppTooltip from '@/components/common/AppTooltip.vue'
import { formatDuration, formatFileSize } from '@/utils/videoValidator'
import { UPLOAD_TOOLTIP } from '@/constants/project'

export default {
  name: 'VideoListPanel',
  components: { AppTooltip },
  props: {
    videos: { type: Array, default: () => [] },
    activeId: { type: String, default: '' }
  },
  emits: ['upload', 'select', 'remove'],
  data() {
    return { uploadTooltip: UPLOAD_TOOLTIP }
  },
  methods: {
    formatDuration,
    formatFileSize
  }
}
</script>

<style scoped lang="scss">
.video-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  padding: 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;

  &__upload-btn {
    width: 100%;
    height: 36px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    font-size: 14px;
    color: #333;

    &:hover {
      border-color: #ff7a00;
      color: #ff7a00;
    }
  }

  &__note {
    margin: 10px 0 12px;
    font-size: 12px;
    color: #999;
  }

  &__list {
    flex: 1;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.video-item {
  position: relative;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover,
  &--active {
    border-color: #ff7a00;
    background: #fffaf5;
  }

  &__index {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 12px;
    color: #999;
  }

  &__delete {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: 1px solid #ffb3a7;
    border-radius: 50%;
    background: #fff1ef;
    color: #d4380d;
    font-size: 22px;
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    opacity: 1;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    span {
      display: block;
      width: 100%;
      line-height: 24px;
      transform: translateY(-1px);
    }
    &:hover {
      border-color: #d4380d;
      background: #d4380d;
      color: #fff;
    }

    &:focus-visible {
      outline: 2px solid #ff7a00;
      outline-offset: 2px;
    }
  }

  &__thumb {
    width: 100%;
    aspect-ratio: 16/9;
    background: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__thumb-placeholder {
    color: #ccc;
    font-size: 24px;
  }

  &__name {
    font-size: 12px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    margin-top: 4px;
    font-size: 11px;
    color: #999;
  }
}
</style>
