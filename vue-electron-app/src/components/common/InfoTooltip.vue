<template>
  <AppTooltip :text="text" :placement="placement">
    <span class="info-icon">ⓘ</span>
  </AppTooltip>
</template>

<script>
import AppTooltip from './AppTooltip.vue'

export default {
  name: 'InfoTooltip',
  components: { AppTooltip },
  props: {
    text: { type: String, required: true },
    placement: { type: String, default: 'top' }
  }
}
</script>

<style scoped>
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 11px;
  color: #999;
  cursor: help;
  user-select: none;
}
</style>
