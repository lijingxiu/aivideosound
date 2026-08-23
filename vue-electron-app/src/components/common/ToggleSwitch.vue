<template>
  <label class="toggle-switch" :class="{ 'toggle-switch--on': modelValue }">
    <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
    <span class="toggle-switch__track">
      <span class="toggle-switch__thumb" />
    </span>
  </label>
</template>

<script>
export default {
  name: 'ToggleSwitch',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped lang="scss">
.toggle-switch {
  display: inline-flex;
  cursor: pointer;

  input {
    display: none;
  }

  &__track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: #d9d9d9;
    position: relative;
    transition: background 0.2s;
  }

  &__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  }

  &--on &__track {
    background: #1677ff;
  }

  &--on &__thumb {
    transform: translateX(18px);
  }
}
</style>
