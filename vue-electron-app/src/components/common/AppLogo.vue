<template>
  <div class="app-logo" :class="{ 'app-logo--large': large }">
    <svg class="app-logo__mark" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF9A3C"/>
          <stop offset="100%" stop-color="#FF6B00"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#logoGrad)"/>
      <path d="M14 30V18h4l6 8 6-8h4v12h-3.5V23.5L24 30l-6.5-6.5V30H14z" fill="#fff" opacity="0.95"/>
      <circle cx="34" cy="16" r="3" fill="#fff" opacity="0.85"/>
      <path d="M10 34c2-2 5-3 8-3s6 1 8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
    </svg>
    <span v-if="showText" class="app-logo__text">千音译制</span>
  </div>
</template>

<script>
export default {
  name: 'AppLogo',
  props: {
    showText: { type: Boolean, default: true },
    large: { type: Boolean, default: false }
  }
}
</script>

<style scoped lang="scss">
.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;

  &__mark {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  &__text {
    font-size: 18px;
    font-weight: 600;
    color: #ff7a00;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  &--large {
    .app-logo__mark {
      width: 56px;
      height: 56px;
    }

    .app-logo__text {
      font-size: 28px;
    }
  }
}
</style>
