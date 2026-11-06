<template>
  <AppLayout>
    <div class="task-page">
      <header class="task-head">
        <button class="back-button" aria-label="返回" @click="$router.back()">‹</button>
        <div class="project-heading">
          <span class="eyebrow">项目名称：</span>
          <h2>{{ projectName }}</h2>
          <span class="divider">/</span>
          <span class="eyebrow">译制任务名称</span>
        </div>
        <div class="project-tags">
          <span>智能翻译</span>
          <span>原声克隆</span>
          <span>去除背景音</span>
          <span>压制字幕</span>
        </div>
      </header>

      <section class="content-card">
        <div class="toolbar">
          <div class="toolbar-actions">
            <button :disabled="!selectedIds.length || exporting" @click="batchExport">批量导出</button>
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
              <th>导出状态</th>
              <th>源语言</th>
              <th>目标语言</th>
              <th>提取</th>
              <th>翻译</th>
              <th>状态</th>
              <th>有效期剩余</th>
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
                <span class="export-status" :class="exportStates[task.id]?.type">
                  {{ exportStates[task.id]?.label || '待导出' }}
                  <button v-if="exportStates[task.id]?.type === 'fail' && !exporting" class="retry-button" @click="retryExport(task.id)">重试</button>
                </span>
                <small v-if="exportStates[task.id]?.reason" class="export-reason">{{ exportStates[task.id].reason }}</small>
              </td>
              <td>{{ sourceLanguageName || '—' }}</td>
              <td>{{ targetLanguageName || '—' }}</td>
              <td>
                <span class="status-pill" :class="stateOf(transStates, task.extractState ?? task.subtitleState ?? task.asrState).type">
                  <i></i>{{ stateOf(transStates, task.extractState ?? task.subtitleState ?? task.asrState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(transStates, task.transState).type">
                  <i></i>{{ stateOf(transStates, task.transState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(overallStates, task.state).type">
                  <i></i>{{ stateOf(overallStates, task.state).label }}
                </span>
              </td>
              <td>{{ remainingDays() }}</td>
              <td class="actions">
                <button :disabled="exporting" @click="exportTask(task)">导出</button>
                <button @click="deleteTask(task)">删除</button>
              </td>
            </tr>
            </tbody>
            <tbody v-else-if="loading">
            <tr>
              <td colspan="10" class="empty-state"><span class="loader"></span>正在加载任务...</td>
            </tr>
            </tbody>
            <tbody v-else>
            <tr>
              <td colspan="10" class="empty-state">
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
          <div class="export-table">
            <div class="export-thead">
              <span>名称</span>
              <span>压制导出</span>
            </div>
            <div v-for="item in exportQueue" :key="item.id" class="export-row">
              <span class="export-name" :title="item.name">{{ item.name }}</span>
              <span class="export-value" :class="item.type">
                <span class="export-label">{{ item.label }}</span>
                <button v-if="item.type === 'fail'" class="retry-button" :disabled="exportRunning" @click="retryExport(item.id)">重试</button>
                <small v-if="item.reason" class="export-reason">{{ item.reason }}</small>
              </span>
            </div>
          </div>
          <p class="export-note">注：处理失败的视频将自动跳过导出</p>
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
import {fetchDubFastList, fetchProjectList, deleteDubFast} from '@/api/project'

export default {
  name: 'QuickVideoTranslateTasksView',
  components: {AppLayout},
  data() {
    return {
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
      exportStates: {},
      exportVisible: false,
      exportQueue: [],
      exportRunning: false,
      stopExportRequested: false,
      exporting: false,
      searchTimer: null,
      transStates: {
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
      this.loadProject()
      this.loadTasks()
    }
  },
  created() {
    this.loadProject()
    this.loadTasks()
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
  },
  methods: {
    stateOf(map, value) {
      return map[value] || {label: '未开始', type: 'pending'}
    },
    async loadProject() {
      const id = String(this.projectId || '')
      let cached = {}
      try {
        cached = JSON.parse(sessionStorage.getItem(`project-${id}`) || '{}')
      } catch (e) {
        cached = {}
      }
      const query = this.$route.query
      this.projectName = query.name || cached.name || ''
      this.sourceLanguageName = query.fromLangName || cached.sourceLanguageName || ''
      this.targetLanguageName = query.destLangName || cached.targetLanguageName || ''
      this.projectExpireTime = query.expireTime || cached.expireTime || ''

      try {
        const response = await fetchProjectList({pageOffset: 0, pageLimit: 50, name: ''})
        const list = response?.data?.data?.list || response?.data?.list || response?.list || []
        const project = list.find(item => String(item.id) === id)
        if (project) {
          const cache = {
            name: project.name || this.projectName,
            sourceLanguageName: project.fromLangName || project.langName || this.sourceLanguageName,
            targetLanguageName: project.destLangName || this.targetLanguageName,
            expireTime: project.expireTime || this.projectExpireTime
          }
          this.projectName = cache.name
          this.sourceLanguageName = cache.sourceLanguageName
          this.targetLanguageName = cache.targetLanguageName
          this.projectExpireTime = cache.expireTime
          sessionStorage.setItem(`project-${id}`, JSON.stringify(cache))
        }
      } catch (e) {
        // 列表接口失败时保留路由参数或缓存中的项目信息。
      }
      if (!this.projectName) this.projectName = id
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
      } catch (error) {
        this.tasks = []
        this.errorMessage = error.message || '任务列表加载失败'
      } finally {
        this.loading = false
      }
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
      if (this.exporting) return
      this.exporting = true
      this.exportRunning = true
      this.exportVisible = true
      this.stopExportRequested = false
      this.exportQueue = [{id: task.id, name: task.name || '未命名任务', label: '等待中', type: ''}]
      try {
        await this.runExport(task)
      } finally {
        this.exporting = false
        this.exportRunning = false
        this.exportQueue = this.exportQueue.map(item => item.label === '等待中' ? {...item, label: '失败', type: 'fail', reason: '已停止导出'} : item)
      }
    },
    async batchExport() {
      if (this.exporting || !this.selectedIds.length) return
      this.exporting = true
      this.exportRunning = true
      this.exportVisible = true
      this.stopExportRequested = false
      const selectedTasks = this.selectedIds.map(id => this.tasks.find(item => item.id === id)).filter(Boolean)
      this.exportQueue = selectedTasks.map(task => ({id: task.id, name: task.name || '未命名任务', label: '等待中', type: ''}))
      try {
        for (const task of selectedTasks) {
          if (this.stopExportRequested) break
          await this.runExport(task)
        }
      } finally {
        this.exporting = false
        this.exportRunning = false
        this.exportQueue = this.exportQueue.map(item => item.label === '等待中' ? {...item, label: '失败', type: 'fail', reason: '已停止导出'} : item)
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
      try {
        await this.runExport(task)
      } finally {
        this.exportRunning = false
      }
    },
    onStopExport() {
      if (this.exportRunning) {
        this.stopExportRequested = true
        this.notify('当前视频处理完成后将停止批量导出')
      } else {
        this.closeExportDialog()
      }
    },
    closeExportDialog() {
      if (!this.exportRunning) this.exportVisible = false
    },
    async openExportFolder() {
      const api = window.electronAPI
      if (!api?.openExportFolder) return this.notify('当前客户端不支持打开导出目录')
      try {
        await api.openExportFolder(this.projectId)
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
          projectId: this.projectId,
          materialName: task.name || String(task.id),
          videoUrl,
          audioUrl,
          subtitleUrl,
          fontsDir
        }, () => {
          downloading = false
          setState('压制中', 'running')
        })
        setState('完成', 'success')
      } catch (error) {
        setState('失败', 'fail', downloading ? '文件下载失败' : '视频压制失败')
        console.error('[导出] 导出失败:', error)
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
  gap: 8px;
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

.project-tags {
  display: flex;
  gap: 8px;
  margin-left: 12px;

  span {
    padding: 5px 10px;
    color: #667085;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
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

.export-status.running {
  color: $blue;
}

.export-status.success {
  color: #28a745;
}

.export-status.fail {
  color: #e5484d;
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
    color: $muted;
    font-size: 12px;
    cursor: pointer;

    &:first-child {
      color: $orange;
    }

    &:hover {
      color: $orange;
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
}

.export-note {
  margin: 16px 0 22px;
  color: #667085;
  font-size: 13px;
  text-align: center;
}

.export-actions {
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
  color: #e5484d;
  background: #fff;

  &:disabled {
    cursor: not-allowed;
    opacity: .5;
  }
}

.view-button {
  color: #344054;
  border-color: #d0d5dd !important;
  background: #fff;
}

@media (max-width: 1100px) {
  .project-tags {
    display: none;
  }

  .content-card {
    padding: 18px 14px;
  }

  .toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
