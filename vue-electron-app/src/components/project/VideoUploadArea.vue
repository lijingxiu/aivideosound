<template>
  <div
    class="upload-area"
    :class="{ 'upload-area--dragover': isDragover }"
    @click="triggerSelect"
    @dragover.prevent="isDragover = true"
    @dragleave.prevent="isDragover = false"
    @drop.prevent="handleDrop"
  >
    <input ref="fileInput" type="file" multiple accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.flv,.ts" hidden @change="handleInput" />

    <div class="upload-area__icon">
      <svg viewBox="0 0 64 64" width="48" height="48">
        <rect x="8" y="16" width="40" height="32" rx="4" fill="none" stroke="#ccc" stroke-width="2"/>
        <path d="M24 32l8 8 16-16" fill="none" stroke="#ff7a00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M36 8v12M30 14h12" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>

    <p class="upload-area__title">请选择视频文件，或将其拖放到这里</p>
    <p class="upload-area__highlight">支持批量上传</p>
    <p class="upload-area__highlight">按文件名称智能排序</p>
    <p class="upload-area__limit">单次最多100个文件 | 单个视频 ≤4G | ≤120分钟</p>
  </div>
</template>

<script>
export default {
  name: 'VideoUploadArea',
  emits: ['select'],
  data() {
    return { isDragover: false }
  },
  methods: {
    triggerSelect() {
      this.$refs.fileInput.click()
    },
    handleInput(e) {
      this.emitFiles(e.target.files)
      e.target.value = ''
    },
    handleDrop(e) {
      this.isDragover = false
      this.emitFiles(e.dataTransfer.files)
    },
    emitFiles(fileList) {
      if (!fileList?.length) return
      this.$emit('select', Array.from(fileList))
    }
  }
}
</script>

<style scoped lang="scss">
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 420px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover,
  &--dragover {
    border-color: #ff7a00;
    background: #fffaf5;
  }

  &__icon {
    margin-bottom: 16px;
  }

  &__title {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  &__highlight {
    font-size: 13px;
    color: #ff7a00;
    line-height: 1.6;
  }

  &__limit {
    margin-top: 24px;
    font-size: 12px;
    color: #bbb;
  }
}
</style>
