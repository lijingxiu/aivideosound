<template>
  <div class="app-root">
    <keep-alive include="QuickVideoTranslateTasksView">
      <router-view />
    </keep-alive>
    <button v-if="exportFloating" type="button" class="global-export-floating-ball" aria-label="查看导出进度" @click="showExportDialog">
      <i v-if="exportRunning" class="global-export-spinner"></i>
      <span v-else>导出</span>
    </button>
  </div>
</template>

<script>
const EXPORT_STATE_KEY = 'qvt_export_floating_state'

export default {
  name: 'App',
  data() {
    return {exportFloating: false, exportRunning: false, projectId: ''}
  },
  mounted() {
    this.refreshExportState()
    window.addEventListener('qvt-export-state-change', this.refreshExportState)
    window.addEventListener('storage', this.refreshExportState)
  },
  beforeDestroy() {
    window.removeEventListener('qvt-export-state-change', this.refreshExportState)
    window.removeEventListener('storage', this.refreshExportState)
  },
  methods: {
    refreshExportState() {
      try {
        const state = JSON.parse(localStorage.getItem(EXPORT_STATE_KEY) || '{}')
        this.exportFloating = state.floating === true
        this.exportRunning = Boolean(state.running)
        this.projectId = state.projectId || ''
      } catch (error) {
        this.exportFloating = false
      }
    },
    showExportDialog() {
      if (!this.projectId) return
      const onTasksPage = this.$route.name === 'quick-video-translate-tasks'
        && String(this.$route.params.id) === String(this.projectId)
      if (!onTasksPage) {
        this.$router.push({name: 'quick-video-translate-tasks', params: {id: this.projectId}}).catch(() => {})
      }
      window.setTimeout(() => window.dispatchEvent(new Event('qvt-export-show')), 100)
    }
  }
}
</script>

<style lang="scss">
.app-root {
  min-height: 100vh;
}

.global-export-floating-ball {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 99999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: #ff7a00;
  box-shadow: 0 8px 24px rgba(255, 122, 0, .35);
  font-size: 12px;
  cursor: pointer;
}

.global-export-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, .4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: global-export-spin .8s linear infinite;
}

@keyframes global-export-spin {
  to { transform: rotate(360deg); }
}
</style>

<style lang="scss">
@import '@/assets/styles/global.scss';
</style>
