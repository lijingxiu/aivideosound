<template>
  <div v-if="visible" class="submit-modal">
    <div class="submit-modal__mask" />
    <div class="submit-modal__card">
      <div v-for="(step, index) in steps" :key="step.key" class="submit-step">
        <div class="submit-step__indicator">
          <span v-if="step.status === 'done'" class="submit-step__icon submit-step__icon--done">✓</span>
          <span v-else-if="step.status === 'active'" class="submit-step__icon submit-step__icon--active">
            <AppIcon name="refresh" :size="16" color="#ff7a00" spin />
          </span>
          <span v-else class="submit-step__icon">{{ index + 1 }}</span>
          <div v-if="index < steps.length - 1" class="submit-step__line" :class="{ 'submit-step__line--done': step.status === 'done' }" />
        </div>
        <div class="submit-step__content">
          <p class="submit-step__text">{{ step.text }}</p>
          <p v-if="step.doneText && step.status === 'done'" class="submit-step__done">{{ step.doneText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'SubmitProgressModal',
  components: { AppIcon },
  props: {
    visible: { type: Boolean, default: false },
    currentStep: { type: Number, default: 0 },
    stepStatus: { type: String, default: 'active' }
  },
  computed: {
    steps() {
      const defs = [
        { key: 'process', text: '正在处理视频，请稍后....', doneText: '视频处理完成' },
        { key: 'upload', text: '正在上传数据，请稍后....', doneText: '数据上传完成' },
        { key: 'submit', text: '正在提交任务，请稍后....', doneText: '任务提交成功' }
      ]

      return defs.map((item, index) => {
        let status = 'pending'
        if (index < this.currentStep) status = 'done'
        else if (index === this.currentStep) status = this.stepStatus
        return { ...item, status }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.submit-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
  }

  &__card {
    position: relative;
    width: 420px;
    padding: 32px 36px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
}

.submit-step {
  display: flex;
  gap: 16px;
  min-height: 56px;

  &__indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 24px;
  }

  &__icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f0f0f0;
    color: #999;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--active {
      background: #fff3e6;
    }

    &--done {
      background: #ff7a00;
      color: #fff;
    }
  }

  &__line {
    flex: 1;
    width: 2px;
    min-height: 24px;
    background: #eee;
    margin: 4px 0;

    &--done {
      background: #ff7a00;
    }
  }

  &__text {
    font-size: 14px;
    color: #333;
    line-height: 24px;
  }

  &__done {
    font-size: 12px;
    color: #52c41a;
    margin-top: 2px;
  }
}
</style>
