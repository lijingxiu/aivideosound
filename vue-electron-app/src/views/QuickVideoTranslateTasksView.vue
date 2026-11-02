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
            <button :disabled="!selectedIds.length" @click="notify('批量导出功能即将开放')">批量导出</button>
            <button :disabled="!selectedIds.length" @click="notify('批量删除功能即将开放')">批量删除</button>
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
            <select v-model="orderType" aria-label="排序方式">
              <option value="">按名称升序</option>
              <option value="1">创建时间升序</option>
              <option value="2">创建时间降序</option>
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
              <th>时长</th>
              <th>翻译</th>
              <th>擦除</th>
              <th>压制</th>
              <th>状态</th>
              <th>消耗积分</th>
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
              <td>{{ formatDuration(task.videoDuration) }}</td>
              <td>
                <span class="status-pill" :class="stateOf(transStates, task.transState).type">
                  <i></i>{{ stateOf(transStates, task.transState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(eraseStates, task.eraseState).type">
                  <i></i>{{ stateOf(eraseStates, task.eraseState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(burnStates, task.burnState).type">
                  <i></i>{{ stateOf(burnStates, task.burnState).label }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="stateOf(overallStates, task.state).type">
                  <i></i>{{ stateOf(overallStates, task.state).label }}
                </span>
              </td>
              <td>{{ task.usedPoint ?? '—' }}</td>
              <td class="actions">
                <button @click="notify('查看功能即将开放')">查看</button>
                <button
                  v-if="task.state === 2"
                  @click="notify(task.error || '任务执行失败')">原因
                </button>
                <button aria-label="更多操作" @click="notify('更多操作即将开放')">•••</button>
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
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import {fetchDubFastList, fetchProjectList} from '@/api/project'

export default {
  name: 'QuickVideoTranslateTasksView',
  components: {AppLayout},
  data() {
    return {
      projectName: '',
      keyword: '',
      statusFilter: '',
      orderType: '',
      tasks: [],
      selectedIds: [],
      loading: false,
      errorMessage: '',
      searchTimer: null,
      transStates: {
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      },
      eraseStates: {
        '-2': {label: '不擦除', type: 'disabled'},
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
    orderType() {
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
      const queryName = this.$route.query.name
      let cached = {}
      try {
        cached = JSON.parse(sessionStorage.getItem(`project-${id}`) || '{}')
      } catch (e) {
        cached = {}
      }
      this.projectName = queryName || cached.name || ''
      if (this.projectName) return
      try {
        const response = await fetchProjectList({pageOffset: 0, pageLimit: 50, name: ''})
        const list = response?.data?.data?.list || response?.data?.list || response?.list || []
        const matched = list.find(item => String(item.id) === id)
        if (matched?.name) this.projectName = matched.name
      } catch (e) {
        // 名称仅用于展示，获取失败时保留占位，不影响任务列表。
      }
    },
    async loadTasks() {
      if (!this.projectId) return
      this.loading = true
      this.errorMessage = ''
      try {
        const response = await fetchDubFastList({
          projectId: this.projectId,
          name: this.keyword,
          state: this.statusFilter,
          orderType: this.orderType
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
