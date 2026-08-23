<template>
  <div ref="containerRef" class="select-box" :style="boxStyle" @mousedown.stop="startDrag">
    <div class="select-box__label">{{ label }}</div>
    <div
      v-for="handle in handles"
      :key="handle"
      class="select-box__handle"
      :class="`select-box__handle--${handle}`"
      @mousedown.stop="startResize(handle, $event)"
    />
  </div>
</template>

<script>
export default {
  name: 'SubtitleSelectBox',
  props: {
    modelValue: {
      type: Object,
      default: () => ({ x: 0.1, y: 0.65, w: 0.8, h: 0.2 })
    },
    label: { type: String, default: '请框选字幕区域（对所有视频有效）' },
    containerRef: { type: Object, default: null }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      dragging: false,
      resizing: null,
      startX: 0,
      startY: 0,
      startBox: null,
      handles: ['nw', 'ne', 'sw', 'se']
    }
  },
  computed: {
    boxStyle() {
      const { x, y, w, h } = this.modelValue
      return {
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`
      }
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  },
  methods: {
    getContainerRect() {
      return this.$el.parentElement?.getBoundingClientRect()
    },
    startDrag(e) {
      this.dragging = true
      this.startX = e.clientX
      this.startY = e.clientY
      this.startBox = { ...this.modelValue }
    },
    startResize(handle, e) {
      this.resizing = handle
      this.startX = e.clientX
      this.startY = e.clientY
      this.startBox = { ...this.modelValue }
    },
    onMouseMove(e) {
      if (!this.dragging && !this.resizing) return
      const rect = this.getContainerRect()
      if (!rect) return

      const dx = (e.clientX - this.startX) / rect.width
      const dy = (e.clientY - this.startY) / rect.height
      let { x, y, w, h } = { ...this.startBox }

      if (this.dragging) {
        x = Math.min(Math.max(0, x + dx), 1 - w)
        y = Math.min(Math.max(0, y + dy), 1 - h)
      } else if (this.resizing) {
        if (this.resizing.includes('e')) w = Math.max(0.1, Math.min(1 - x, w + dx))
        if (this.resizing.includes('s')) h = Math.max(0.08, Math.min(1 - y, h + dy))
        if (this.resizing.includes('w')) {
          const newW = Math.max(0.1, w - dx)
          x = Math.max(0, x + w - newW)
          w = newW
        }
        if (this.resizing.includes('n')) {
          const newH = Math.max(0.08, h - dy)
          y = Math.max(0, y + h - newH)
          h = newH
        }
      }

      this.$emit('update:modelValue', { x, y, w, h })
    },
    onMouseUp() {
      this.dragging = false
      this.resizing = null
    }
  }
}
</script>

<style scoped lang="scss">
.select-box {
  position: absolute;
  border: 2px solid #ff7a00;
  background: rgba(255, 122, 0, 0.15);
  cursor: move;
  box-sizing: border-box;

  &__label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 4px 8px;
    font-size: 12px;
    color: #ff7a00;
    white-space: nowrap;
    pointer-events: none;
    text-shadow: 0 0 4px #fff;
  }

  &__handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #ff7a00;
    border: 1px solid #fff;
    border-radius: 2px;

    &--nw { top: -5px; left: -5px; cursor: nw-resize; }
    &--ne { top: -5px; right: -5px; cursor: ne-resize; }
    &--sw { bottom: -5px; left: -5px; cursor: sw-resize; }
    &--se { bottom: -5px; right: -5px; cursor: se-resize; }
  }
}
</style>
