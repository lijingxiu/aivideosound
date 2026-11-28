<template>
  <div class="app-root">
    <keep-alive include="QuickVideoTranslateTasksView">
      <router-view />
    </keep-alive>
    <button v-if="exportFloating" type="button" class="global-export-floating-ball" aria-label="查看导出进度" @click="showExportDialog">
      <span class="global-export-ball-text">{{ floatingText }}</span>
    </button>

    <div v-if="exportDialogVisible" class="export-mask" @click.self="closeGlobalExportDialog">
      <div class="export-dialog">
        <div class="export-dialog-head">
          <strong>导出进度</strong>
          <button type="button" class="export-close" aria-label="关闭" @click="closeGlobalExportDialog">×</button>
        </div>
        <div class="export-table">
          <div class="export-thead">
            <span>名称</span>
            <span>压制导出</span>
          </div>
          <div v-for="item in exportQueue" :key="item.id" class="export-row">
            <span class="export-name" :title="item.name">{{ item.name }}</span>
            <span class="export-value" :class="item.type">
              <span class="export-label">{{ item.label }}<i v-if="item.type === 'running'" class="export-spinner" aria-label="正在处理"></i></span>
              <small v-if="item.reason" class="export-reason">{{ item.reason }}</small>
            </span>
          </div>
        </div>
        <div class="export-actions">
          <button class="stop-button" type="button" @click="closeGlobalExportDialog">关闭</button>
          <button class="view-button" type="button" @click="openGlobalExportFolder">查看导出文件</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const EXPORT_STATE_KEY = 'qvt_export_floating_state'

export default {
  name: 'App',
  data() {
    return {exportFloating: false, exportRunning: false, exportQueue: [], projectId: '', dotCount: 1, dotTimer: null, exportDialogVisible: false}
  },
  computed: {
    exportDone() {
      if (!this.exportQueue.length) return false
      return this.exportQueue.every(item => item.type === 'success')
    },
    floatingText() {
      if (this.exportRunning) return '导出中' + '.'.repeat(this.dotCount)
      if (this.exportDone) return '导出完成'
      return '导出'
    },
    onTasksPage() {
      return this.$route.name === 'quick-video-translate-tasks' && Boolean(this.$route.params.id)
    }
  },
  mounted() {
    this.refreshExportState()
    window.addEventListener('qvt-export-state-change', this.refreshExportState)
    window.addEventListener('storage', this.refreshExportState)
    this.startDotTimer()
  },
  beforeDestroy() {
    window.removeEventListener('qvt-export-state-change', this.refreshExportState)
    window.removeEventListener('storage', this.refreshExportState)
    this.stopDotTimer()
  },
  methods: {
    startDotTimer() {
      this.stopDotTimer()
      this.dotCount = 1
      this.dotTimer = setInterval(() => {
        if (!this.exportRunning) return
        this.dotCount = this.dotCount % 4 + 1
      }, 500)
    },
    stopDotTimer() {
      if (this.dotTimer) {
        clearInterval(this.dotTimer)
        this.dotTimer = null
      }
    },
    refreshExportState() {
      try {
        const state = JSON.parse(localStorage.getItem(EXPORT_STATE_KEY) || '{}')
        this.exportFloating = state.floating === true
        this.exportRunning = Boolean(state.running)
        this.exportQueue = Array.isArray(state.queue) ? state.queue : []
        this.projectId = state.projectId || ''
        if (this.exportRunning) this.startDotTimer()
        else this.stopDotTimer()
      } catch (error) {
        this.exportFloating = false
      }
    },
    showExportDialog() {
      if (!this.projectId) return
      // 已在任务详情页时交由该页面自行弹窗；否则直接在当前页弹出导出结果，不进入详情
      if (!this.onTasksPage) {
        this.exportDialogVisible = true
      }
      window.setTimeout(() => window.dispatchEvent(new Event('qvt-export-show')), 100)
    },
    closeGlobalExportDialog() {
      this.exportDialogVisible = false
    },
    async openGlobalExportFolder() {
      this.exportDialogVisible = false
      const api = window.electronAPI
      if (!api?.openExportFolder) return this.$message.warning('当前客户端不支持打开导出目录')
      try {
        await api.openExportFolder(this.projectId || '')
      } catch (error) {
        this.$message.error(error.message || '打开导出目录失败')
      }
    }
  }
}
</script>

<style lang="scss">
.app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.global-export-floating-ball {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 99999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  padding: 4px;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: #fff;
  background: #ff7a00;
  box-shadow: 0 8px 24px rgba(255, 122, 0, .35);
  font-size: 11px;
  line-height: 1.1;
  text-align: center;
  cursor: pointer;
}

.global-export-ball-text {
  display: inline-block;
  line-height: 1.1;
  letter-spacing: .5px;
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

<style scoped lang="scss">
$orange: #ff7a00;

.export-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 24, 40, .45);
}

.export-dialog {
  width: 520px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 80px);
  padding: 26px 40px 22px;
  overflow-y: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(16, 24, 40, .18);
}

.export-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  color: #344054;
  font-size: 15px;

  .export-close {
    border: 0;
    background: transparent;
    color: #999;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;

    &:hover { color: $orange; }
  }
}

.export-table {
  border: 1px solid #e5e8ec;
  border-radius: 3px;
}

.export-thead,
.export-row {
  display: grid;
  grid-template-columns: 1fr 1fr;

  span {
    padding: 10px 12px;
    font-size: 13px;
    text-align: center;
  }
}

.export-thead {
  background: #fafbfc;
  color: #667085;

  span + span {
    border-left: 1px solid #e5e8ec;
  }
}

.export-row {
  border-top: 1px solid #e5e8ec;

  span + span {
    border-left: 1px solid #e5e8ec;
  }
}

.export-name {
  overflow: hidden;
  color: #344054;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-value {
  color: #98a2b3;

  &.running { color: #2f88ff; }
  &.success { color: #28a745; }
  &.fail { color: #e5484d; }
  &.skip { color: #98a2b3; }
}

.export-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 6px;
  vertical-align: -2px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.export-reason {
  display: block;
  margin-top: 3px;
  color: #98a2b3;
  font-size: 11px;
  white-space: normal;
}

.export-actions {
  margin-top: 25px;
  display: flex;
  justify-content: space-between;
  gap: 16px;

  button {
    flex: 1;
    height: 40px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
  }
}

.stop-button {
  border: 1px solid #667085;
  color: #667085;
  background: #fff;
}

.view-button {
  border: 1px solid $orange;
  color: #fff;
  background: $orange;

  &:hover { background: #d95800; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
