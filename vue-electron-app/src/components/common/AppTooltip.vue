<template>
  <span class="tooltip-wrap" @mouseenter="show = true" @mouseleave="show = false">
    <slot />
    <span v-if="show && text" class="tooltip-wrap__popup" :class="[`tooltip-wrap__popup--${placement}`]">
      {{ text }}
    </span>
  </span>
</template>

<script>
export default {
  name: 'AppTooltip',
  props: {
    text: { type: String, default: '' },
    placement: { type: String, default: 'top' }
  },
  data() {
    return { show: false }
  }
}
</script>

<style scoped lang="scss">
.tooltip-wrap {
  position: relative;
  display: inline-flex;

  &__popup {
    position: absolute;
    z-index: 100;
    min-width: 180px;
    max-width: 280px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.82);
    color: #fff;
    font-size: 12px;
    line-height: 1.5;
    white-space: normal;
    pointer-events: none;

    &--top {
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    }

    &--bottom {
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
    }
  }
}
</style>
