<template>
  <AppLayout>
    <div class="task-page">
      <header class="task-head">
        <button class="back-button" aria-label="返回" @click="$router.back()">‹</button>
        <div class="project-heading">
          <span class="eyebrow">当前项目名称</span>
          <h2>{{ projectName }}</h2>
        </div>
        <div class="language-pair">
          <strong>{{ sourceLanguageName || '—' }}</strong>
          <span class="language-arrow">→</span>
          <strong>{{ targetLanguageName || '—' }}</strong>
        </div>
        <div class="project-statuses">
          <span v-for="status in enabledStatuses" :key="status" class="project-status">{{ status }}</span>
        </div>
        <div class="validity"><span>有效期剩余</span><strong>{{ remainingDays() }}</strong></div>
      </header>

      <section class="content-card">
        <div class="toolbar">
          <div class="toolbar-actions">
            <button :disabled="!selectedIds.length" @click="batchExport">批量导出</button>
            <button :disabled="!selectedIds.length" @click="batchDelete">批量删除</button>
          </div>
          <div class="filters">
            <label class="search-box">
              <span>⌕</span>
              <input v-model.trim="keyword" placeholder="输入名称查找" @keyup.enter="loadTasks">
            </label>
            <select v-model="statusFilter" aria-label="状态筛选">
              <option value="">全部状态</option>
              <option value="0">进行中</option>
              <option value="1">成功</option>
              <option value="2">失败</option>
            </select>
            <button class="refresh-button" :disabled="loading" aria-label="刷新" @click="loadTasks">↻</button>
          </div>
        </div>

        <div v-if="errorMessage" class="message error-message">
          {{ errorMessage }}
          <button @click="loadTasks">重新加载</button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
            <tr>
              <th class="check-cell">
                <input v-model="allSelected" type="checkbox" aria-label="全选">
              </th>
              <th class="name-cell">名称</th>
              <th>字幕擦除</th>
              <th>翻译</th>
              <th>配音/压制</th>
              <th>状态</th>
              <th>是否导出</th>
              <th>更新时间</th>
              <th class="action-cell">操作</th>
            </tr>
            </thead>
            <tbody v-if="!loading && tasks.length">
            <tr v-for="task in tasks" :key="task.id">
              <td class="check-cell">
                <input v-model="selectedIds" :value="task.id" type="checkbox" :aria-label="`选择${task.name}`">
              </td>
              <td class="name-cell">
                <span class="thumb">
                  <img v-if="task.thumbUrl" :src="task.thumbUrl" :alt="task.name">
                  <i v-else class="thumb-empty">MP4</i>
                </span>
                <div>
                  <strong :title="task.name">{{ task.name || '未命名任务' }}</strong>
                  <small>{{ task.videoSize ? `${task.videoSize} MB` : '—' }}</small>
                </div>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(eraseStates, task.eraseState).type">
                  <i v-if="String(task.eraseState) !== '-2'"></i>{{ stateOf(eraseStates, task.eraseState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(transStates, task.transState).type">
                  <i></i>{{ stateOf(transStates, task.transState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(burnStates, task.burnState).type">
                  <i></i>{{ stateOf(burnStates, task.burnState).label }}
                </span>
              </td>
              <td>
                <span class="overall-status">
                  <el-tooltip v-if="isTaskFailed(task) && taskError(task)" :content="taskError(task)" placement="top">
                    <span class="status-pill" :class="stateOf(overallStates, task.state).type">
                      <i></i>{{ stateOf(overallStates, task.state).label }}
                    </span>
                  </el-tooltip>
                  <span v-else class="status-pill" :class="stateOf(overallStates, task.state).type">
                    <i></i>{{ stateOf(overallStates, task.state).label }}
                  </span>
                  <button v-if="isTaskFailed(task)" class="retry-button task-retry-button"
                          :disabled="isRetrying(task.id)" @click="retryTask(task)">{{ isRetrying(task.id) ? '提交中' : '重试' }}</button>
                </span>
              </td>
              <td>
                <span class="export-status" :class="exportStates[task.id]?.type">
                  {{ exportStates[task.id]?.label || '待导出' }}
                  <i v-if="exportStates[task.id]?.type === 'running'" class="export-spinner" aria-label="正在处理"></i>
                  <button v-if="exportStates[task.id]?.type === 'fail' && !exporting" class="retry-button" @click="retryExport(task.id)">重试</button>
                </span>
                <small v-if="exportStates[task.id]?.reason" class="export-reason">{{ exportStates[task.id].reason }}</small>
              </td>
              <td>{{ formatCreateTime(task.updateTime || task.update_time || task.modifyTime || task.modifiedTime || task.createTime) }}</td>
              <td class="actions">
                <button :disabled="!isTaskSucceeded(task)" @click="exportTask(task)">导出</button>
                <button @click="deleteTask(task)">删除</button>
              </td>
            </tr>
            </tbody>
            <tbody v-else-if="loading">
            <tr>
              <td colspan="9" class="empty-state"><span class="loader"></span>正在加载任务...</td>
            </tr>
            </tbody>
            <tbody v-else>
            <tr>
              <td colspan="9" class="empty-state">
                <span class="empty-icon">□</span>
                <strong>{{ errorMessage ? '任务加载失败' : '暂无译制任务' }}</strong>
                <small>{{ errorMessage ? '请稍后重试' : '创建译制任务后，相关内容会显示在这里' }}</small>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="exportVisible" class="export-mask" @click.self="closeExportDialog">
        <div class="export-dialog">
          <div class="export-dialog-head">
            <strong>导出进度</strong>
            <button type="button" class="float-button" @click="floatExportDialog">悬浮</button>
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
                <button v-if="item.type === 'fail'" class="retry-button" :disabled="exportRunning" @click="retryExport(item.id)">重试</button>
                <small v-if="item.reason" class="export-reason">{{ item.reason }}</small>
              </span>
            </div>
          </div>
          <div class="export-actions">
            <button class="stop-button" @click="onStopExport">
              {{ exportRunning ? '停止导出' : '关闭' }}
            </button>
            <button class="view-button" @click="openExportFolder">查看导出文件</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import {fetchDubFastList, deleteDubFast, retryDubFast} from '@/api/project'

export default {
  name: 'QuickVideoTranslateTasksView',
  components: {AppLayout},
  data() {
    return {
      projectInfo: null,
      projectName: '',
      sourceLanguageName: '',
      targetLanguageName: '',
      projectExpireTime: '',
      keyword: '',
      statusFilter: '',
      tasks: [],
      selectedIds: [],
      loading: false,
      errorMessage: '',
      retryingIds: {},
      exportStates: {},
      exportVisible: false,
      exportFloating: false,
      exportQueue: [],
      exportRunning: false,
      stopExportRequested: false,
      exporting: false,
      exportProjectId: '',
      searchTimer: null,
      transStates: {
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      },
      burnStates: {
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      },
      eraseStates: {
        '-2': {label: '——', type: 'disabled'},
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      },
      overallStates: {
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      }
    }
  },
  computed: {
    projectId() {
      return this.$route.params.id
    },
    hasFailedExport() {
      return this.exportQueue.some(item => item.type === 'fail')
    },
    enabledStatuses() {
      const info = this.projectInfo || {}
      const enabled = value => value === true || Number(value) > 0 || value === 'true'
      const transLabels = {1: '智能翻译', 2: '上传字幕'}
      const dubLabels = {1: '原声克隆', 2: '智能配音', 3: '手动选择'}
      const bgLabels = {1: '仅去除背景音', 2: '去除背景音及音效'}
      const statuses = [transLabels[info.transType] || '翻译']
      if (enabled(info.dubType)) statuses.push(dubLabels[info.dubType] || '配音')
      if (enabled(info.removeBgAudio)) statuses.push(bgLabels[info.removeBgAudio] || '去除背景音')
      if (enabled(info.eraseType)) statuses.push('字幕擦除')
      if (enabled(info.burnSubtitleType)) statuses.push('字幕压制')
      return statuses
    },
    allSelected: {
      get() {
        return this.tasks.length > 0 && this.tasks.every(task => this.selectedIds.includes(task.id))
      },
      set(value) {
        this.selectedIds = value ? this.tasks.map(task => task.id) : []
      }
    }
  },
  watch: {
    keyword() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.loadTasks(), 300)
    },
    statusFilter() {
      this.loadTasks()
    },
    projectId() {
      this.setProjectInfo()
      this.loadTasks()
    }
  },
  created() {
    this.setProjectInfo()
    this.loadTasks()
    window.addEventListener('storage', this.onStorageExportEvent)
    window.addEventListener('qvt-export-show', this.showExportDialog)
    this.loadPersistedExportState()
  },
  activated() {
    window.removeEventListener('qvt-export-show', this.showExportDialog)
    window.addEventListener('qvt-export-show', this.showExportDialog)
    this.setProjectInfo()
    this.loadTasks()
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
    window.removeEventListener('storage', this.onStorageExportEvent)
    window.removeEventListener('qvt-export-show', this.showExportDialog)
  },
  methods: {
    formatCreateTime(value) {
      const timestamp = Number(value)
      if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
      const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
      if (Number.isNaN(date.getTime())) return '—'
      const pad = number => String(number).padStart(2, '0')
      return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    },
    stateOf(map, value) {
      return map[value] || {label: '未开始', type: 'pending'}
    },
    isTaskSucceeded(task) {
      return String(task?.state) === '1'
    },
    isTaskFailed(task) {
      return String(task?.state) === '2'
    },
    taskError(task) {
      const value = task?.error
      if (!value) return ''
      if (typeof value === 'string') return value
      if (typeof value === 'object') return value.message || value.error || JSON.stringify(value)
      return String(value)
    },
    isRetrying(taskId) {
      return Boolean(this.retryingIds[taskId])
    },
    async retryTask(task) {
      if (!this.isTaskFailed(task) || this.isRetrying(task.id)) return
      try {
        await this.$confirm('确定要重试当前任务吗？', '提示', {type: 'warning'})
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') this.notify(error.message || '操作失败')
        return
      }
      this.$set(this.retryingIds, task.id, true)
      try {
        await retryDubFast(task.id)
        await this.loadTasks()
      } catch (error) {
        const message = error?.error || error?.message || '重试提交失败，请稍后重试'
        this.$alert(message, '重试失败', {type: 'error'})
      } finally {
        this.$delete(this.retryingIds, task.id)
      }
    },
    setProjectInfo() {
      const queryProjectInfo = this.$route.query.projectInfo
      try {
        this.projectInfo = JSON.parse(queryProjectInfo || '{}')
      } catch (e) {
        this.projectInfo = {}
      }
      const info = this.projectInfo || {}
      this.projectName = info.name || this.projectId || ''
      this.sourceLanguageName = info.fromLangName || info.sourceLanguage || info.sourceLangName || info.fromLangCode || ''
      this.targetLanguageName = info.destLangName || info.targetLanguage || info.targetLangName || info.destLangCode || ''
      this.projectExpireTime = info.expireTime || info.expire_time || ''
    },
    async loadTasks() {
      if (!this.projectId) return
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await fetchDubFastList({
          projectId: this.projectId,
          name: this.keyword,
          state: this.statusFilter
        })
        this.tasks = response?.data?.data?.list || response?.data?.list || response?.list || []
        this.selectedIds = []
        await this.loadExportStates()
      } catch (error) {
        this.tasks = []
        this.errorMessage = error.message || '任务列表加载失败'
      } finally {
        this.loading = false
      }
    },
    async loadExportStates() {
      const api = window.electronAPI
      if (!api?.checkExportedVideo) return
      await Promise.all(this.tasks.map(async task => {
        try {
          const result = await api.checkExportedVideo({
            taskId: task.id,
            projectId: this.projectId,
            materialName: task.name || String(task.id)
          })
          this.$set(this.exportStates, task.id, result?.exists
            ? {label: '完成', type: 'success', reason: ''}
            : {label: '待导出', type: '', reason: ''})
        } catch (error) {
          this.$set(this.exportStates, task.id, {label: '待导出', type: '', reason: ''})
        }
      }))
    },
    remainingDays() {
      const expiry = this.projectExpireTime
      if (!expiry) return '—'
      const timestamp = Number(expiry) ? (Number(expiry) < 1e12 ? Number(expiry) * 1000 : Number(expiry)) : new Date(expiry).getTime()
      if (!Number.isFinite(timestamp)) return '—'
      const diff = timestamp - Date.now()
      if (diff <= 0) return '已过期'
      const days = Math.floor(diff / 86400000)
      return days >= 1 ? `${days}天` : `${Math.ceil(diff / 3600000)}小时`
    },
    async exportTask(task) {
      if (this.exporting) {
        this.$message.warning('有文件正在导出中')
        return
      }
      this.exporting = true
      this.exportProjectId = this.projectId
      this.exportRunning = true
      this.exportVisible = true
      this.exportFloating = false
      this.stopExportRequested = false
      this.exportQueue = [{id: task.id, name: task.name || '未命名任务', label: '等待中', type: ''}]
      this.persistExportState()
      try {
        await this.runExport(task)
      } finally {
        this.exporting = false
        this.exportRunning = false
        this.exportQueue = this.exportQueue.map(item => {
          if (item.label !== '等待中') return item
          const t = this.tasks.find(x => String(x.id) === String(item.id))
          return String(t?.state) === '1'
            ? {...item, label: '失败', type: 'fail', reason: '已停止导出'}
            : {...item, label: '跳过', type: 'skip', reason: '任务未成功，已跳过导出'}
        })
        this.persistExportState()
      }
    },
    async batchExport() {
      if (this.exporting) {
        this.$message.warning('有文件正在导出中')
        return
      }
      if (!this.selectedIds.length) return
      const selectedTasks = this.selectedIds.map(id => this.tasks.find(item => item.id === id)).filter(Boolean)
      if (selectedTasks.some(task => !this.isTaskSucceeded(task))) {
        this.$message.warning('仅状态为成功的任务可以导出，请检查。')
        return
      }
      this.exporting = true
      this.exportProjectId = this.projectId
      this.exportRunning = true
      this.exportVisible = true
      this.stopExportRequested = false
      this.exportQueue = selectedTasks.map(task => ({id: task.id, name: task.name || '未命名任务', label: '等待中', type: ''}))
      this.persistExportState()
      try {
        for (const task of selectedTasks) {
          if (this.stopExportRequested) break
          await this.runExport(task)
        }
      } finally {
        this.exporting = false
        this.exportRunning = false
        this.exportQueue = this.exportQueue.map(item => {
          if (item.label !== '等待中') return item
          return {...item, label: '失败', type: 'fail', reason: '已停止导出'}
        })
        this.persistExportState()
      }
    },
    updateExportQueue(task, label, type, reason = '') {
      const row = this.exportQueue.find(item => String(item.id) === String(task.id))
      if (row) {
        this.$set(row, 'label', label)
        this.$set(row, 'type', type)
        this.$set(row, 'reason', reason)
      }
    },
    async retryExport(taskId) {
      if (this.exportRunning) return
      const task = this.tasks.find(item => String(item.id) === String(taskId))
      if (!task) return
      this.exportRunning = true
      this.stopExportRequested = false
      this.exportVisible = true
      this.persistExportState()
      try {
        await this.runExport(task)
      } finally {
        this.exportRunning = false
        this.persistExportState()
      }
    },
    floatExportDialog() {
      this.exportVisible = false
      this.exportFloating = true
      this.persistExportState()
    },
    showExportDialog() {
      this.exportFloating = false
      this.exportVisible = true
      this.persistExportState()
    },
    loadPersistedExportState() {
      try {
        const raw = localStorage.getItem('qvt_export_floating_state')
        if (raw) {
          const state = JSON.parse(raw)
          if (state && state.visible === true) {
            this.exportVisible = true
            this.exportQueue = Array.isArray(state.queue) ? state.queue : []
            this.exportRunning = Boolean(state.running)
            this.exporting = Boolean(state.running)
            this.exportProjectId = state.projectId || ''
          }
        }
      } catch (error) {
        console.error('恢复导出悬浮状态失败', error)
      }
    },
    persistExportState() {
      try {
        localStorage.setItem('qvt_export_floating_state', JSON.stringify({
          visible: this.exportVisible,
          floating: this.exportFloating,
          running: this.exportRunning,
          queue: this.exportQueue,
          projectId: this.exportProjectId || this.projectId
        }))
        window.dispatchEvent(new Event('qvt-export-state-change'))
      } catch (error) {
        console.error('持久化导出悬浮状态失败', error)
      }
    },
    onStorageExportEvent(event) {
      if (event.key === 'qvt_export_floating_state') {
        this.loadPersistedExportState()
      }
    },
    onStopExport() {
      if (this.exportRunning) {
        this.stopExportRequested = true
        this.notify('当前视频处理完成后将停止批量导出')
        this.persistExportState()
      } else {
        this.closeExportDialog()
      }
    },
    closeExportDialog() {
      if (!this.exportRunning) {
        this.exportVisible = false
        this.persistExportState()
      }
    },
    async openExportFolder() {
      this.exportVisible = false
      this.persistExportState()
      const api = window.electronAPI
      if (!api?.openExportFolder) return this.notify('当前客户端不支持打开导出目录')
      try {
        await api.openExportFolder(this.exportProjectId || this.projectId)
      } catch (error) {
        this.notify(error.message || '打开导出目录失败')
      }
    },
    async resolveFontsDir(task) {
      if (task.fontsDir) return task.fontsDir
      try {
        return (await window.electronAPI?.getFontsDir?.()) || ''
      } catch (error) {
        return ''
      }
    },
    async runExport(task) {
      const setState = (label, type, reason = '') => {
        this.$set(this.exportStates, task.id, {label, type, reason})
        this.updateExportQueue(task, label, type, reason)
      }
      // 状态不是“成功”的任务无法导出，直接跳过（不视为失败，也不提供重试）
      if (!this.isTaskSucceeded(task)) {
        setState('跳过', 'skip', '任务未成功，已跳过导出')
        return
      }
      const subtitleUrl = task.burnAssUrl
      const audioUrl = task.burnAudioUrl
      const videoUrl = task.burnMuteVideoUrl
      if (!subtitleUrl || !audioUrl || !videoUrl) {
        setState('失败', 'fail', '导出素材缺失')
        return
      }
      const api = window.electronAPI
      if (!api?.exportBurnVideo) {
        setState('失败', 'fail', '当前客户端不支持压制导出')
        return
      }
      const fontsDir = await this.resolveFontsDir(task)
      let downloading = true
      setState('文件下载中', 'running')
      try {
        await api.exportBurnVideo({
          taskId: task.id,
          projectId: this.exportProjectId || this.projectId,
          materialName: task.name || String(task.id),
          videoUrl,
          audioUrl,
          subtitleUrl,
          fontsDir
        }, () => {
          downloading = false
          setState('压制中', 'running')
          this.persistExportState()
        })
        setState('完成', 'success')
        this.persistExportState()
      } catch (error) {
        setState('失败', 'fail', downloading ? '文件下载失败' : '视频压制失败')
        console.error('[导出] 导出失败:', error)
        this.persistExportState()
      }
    },
    async deleteTask(task) {
      await this.deleteTasks([task.id], '确定删除该译制任务吗？')
    },
    async batchDelete() {
      if (!this.selectedIds.length) return
      await this.deleteTasks([...this.selectedIds], `确定删除选中的 ${this.selectedIds.length} 个译制任务吗？`)
    },
    async deleteTasks(ids, message) {
      try {
        await this.$confirm(message, '提示', {type: 'warning'})
        await deleteDubFast(ids)
        const deletedIds = new Set(ids)
        this.tasks = this.tasks.filter(item => !deletedIds.has(item.id))
        this.selectedIds = this.selectedIds.filter(id => !deletedIds.has(id))
        this.notify('删除成功')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') this.notify(error.message || '删除失败')
      }
    },
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '—'
      const minutes = Math.floor(seconds / 60)
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
    },
    notify(message) {
      this.$message ? this.$message.info(message) : undefined
    }
  }
}
</script>

<style scoped lang="scss">
$orange: #ff7a00;
$blue: #2e92ff;
$border: #e9edf2;
$muted: #8993a1;

.task-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  margin: -12px -16px;
  color: #202733;
}

.task-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 0;
  border-bottom: 1px solid $border;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding-bottom: 4px;
  color: #667085;
  font-size: 32px;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background: #f4f6f8;
  }
}

.project-heading {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  white-space: nowrap;

  .eyebrow {
    color: $muted;
    font-size: 14px;
  }

  .divider {
    color: #d0d5dd;
    font-size: 14px;
  }

  h2 {
    margin: 0;
    color: #344054;
    font-size: 14px;
    font-weight: 500;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.language-pair {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 13px;

  strong {
    color: #667085;
    font-weight: 500;
  }

  .language-arrow {
    color: #98a2b3;
  }
}

.project-statuses {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  .project-status {
    padding: 4px 8px;
    color: #667085;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
  }
}

.validity {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 7px 14px;
  color: $orange;
  background: #fff8f0;
  white-space: nowrap;

  span {
    font-size: 12px;
  }

  strong {
    font-size: 13px;
  }
}

.content-card {
  flex: 1;
  min-height: 0;
  margin-top: 14px;
  padding: 18px 20px;
  border: 1px solid $border;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(29, 46, 68, .04);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.toolbar-actions,
.filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar button,
.toolbar select {
  height: 32px;
  padding: 0 13px;
  border: 1px solid #dfe4ea;
  border-radius: 5px;
  color: #4c5665;
  background: #fff;
  font-size: 13px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: $orange;
    color: $orange;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: .45;
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 200px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dfe4ea;
  border-radius: 5px;
  color: $muted;

  span {
    display: inline-flex;
    align-items: center;
    font-size: 25px;
    line-height: 1;
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    color: #333;
    font-size: 13px;
  }
}

.filters select {
  min-width: 110px;
  padding-right: 30px;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%2390939f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}

.refresh-button {
  width: 32px;
  padding: 0 !important;
  font-size: 18px !important;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid $border;
  border-radius: 7px;
}

table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  white-space: nowrap;
}

th,
td {
  padding: 13px 12px;
  border-bottom: 1px solid $border;
  text-align: center;
  font-size: 13px;
}

th {
  color: #667085;
  background: #f7f9fb;
  font-weight: 500;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #fcfdff;
}

.check-cell {
  width: 34px;
  padding-right: 4px;
  padding-left: 4px;
}

input[type='checkbox'] {
  accent-color: $orange;
}

.name-cell {
  min-width: 220px;
  text-align: left;
}

.name-cell > div {
  display: inline-flex;
  flex-direction: column;
  vertical-align: middle;
  gap: 3px;
}

.name-cell strong {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.name-cell small {
  color: $muted;
  font-size: 11px;
}

.thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 32px;
  margin-right: 10px;
  overflow: hidden;
  border-radius: 4px;
  background: #f2f4f7;
  vertical-align: middle;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-empty {
    color: #98a2b3;
    font-size: 9px;
    font-style: normal;
  }
}

.export-status {
  display: block;
  color: #667085;
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

.export-status.running {
  color: $blue;
}

.export-status.success {
  color: #28a745;
}

.export-status.fail {
  color: #e5484d;
}

.export-status.skip {
  color: #98a2b3;
}

.export-reason {
  display: block;
  margin-top: 3px;
  color: #98a2b3;
  font-size: 11px;
  white-space: normal;
}

.retry-button {
  margin-left: 6px;
  color: $orange;
  font-size: 12px;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: .45;
  }
}

.overall-status {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.task-retry-button {
  padding: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;

  i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #b8c0ca;
  }

  &.pending {
    color: #98a2b3;
  }

  &.running {
    color: $blue;

    i {
      background: $blue;
    }
  }

  &.success {
    color: #28a745;

    i {
      background: #28a745;
    }
  }

  &.fail {
    color: #e5484d;

    i {
      background: #e5484d;
    }
  }

  &.disabled {
    color: #98a2b3;
  }
}

.actions {
  button {
    margin: 0 3px;
    color: #1f2733;
    font-size: 12px;
    cursor: pointer;

    &:first-child {
      color: $orange;
    }

    &:hover {
      color: $orange;
    }

    &:disabled {
      color: #c0c6cf;
      cursor: not-allowed;
    }
  }
}

.empty-state {
  height: 210px;
  color: $muted;

  .empty-icon {
    display: block;
    margin-bottom: 10px;
    color: #cbd3dc;
    font-size: 34px;
  }

  strong,
  small {
    display: block;
  }

  strong {
    margin-bottom: 6px;
    color: #667085;
    font-size: 14px;
  }

  small {
    font-size: 12px;
  }
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-bottom: 10px;
  border: 2px solid #e5eaf0;
  border-top-color: $orange;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 5px;
  font-size: 13px;
}

.error-message {
  color: #b42318;
  background: #fff1f0;

  button {
    margin-left: 10px;
    color: #b42318;
    text-decoration: underline;
    cursor: pointer;
  }
}


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
}

.float-button {
  padding: 5px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  color: #667085;
  background: #fff;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: $orange;
    color: $orange;
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

  &.running {
    color: $blue;
  }

  &.success {
    color: #28a745;
  }

  &.fail {
    color: #e5484d;
  }

  &.skip {
    color: #98a2b3;
  }
}

.export-actions {
  margin-top: 25px;
  display: flex;
  justify-content: space-between;
  gap: 16px;

  button {
    flex: 1;
    height: 40px;
    border: 1px solid #e5484d;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
  }
}

.stop-button {
  color: #667085;
  border-color: #667085 !important;
  background: #fff;

  &:disabled {
    cursor: not-allowed;
    opacity: .5;
  }
}

.view-button {
  color: #fff;
  border-color: $orange !important;
  background: $orange;

  &:hover {
    background: #d95800;
    border-color: #d95800 !important;
  }
}

@media (max-width: 1100px) {
  .content-card {
    padding: 18px 14px;
  }

  .toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
