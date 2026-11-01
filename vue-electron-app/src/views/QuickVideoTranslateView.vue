<template>
  <AppLayout>
    <div class="quick-translate-page">
      <div class="toolbar">
        <div class="search-box">
          <AppIcon name="search" :size="16" color="#aaa" />
          <input v-model="searchKeyword" type="text" placeholder="输入项目名称搜索" @keyup.enter="loadProjects" />
          <button type="button" @click="loadProjects">搜索</button>
        </div>
        <button class="btn-add" type="button" @click="$router.push({ name: 'quick-video-translate-new' })">
          <AppIcon name="plus" :size="16" color="#fff" />
          新增项目
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projectRows" :key="project.id">
              <td><div class="project-name"><AppIcon name="folder" :size="18" color="#ff7a00" />{{ project.name }}</div></td>
              <td>{{ project.sourceLanguage }}</td>
              <td>{{ project.targetLanguage }}</td>
              <td>{{ project.materialCount }}</td>
              <td :title="project.translationDetail">{{ project.translation }}</td>
              <td :title="project.voiceoverDetail">{{ project.voiceover }}</td>
              <td>{{ project.backgroundRemoval }}</td>
              <td>{{ project.subtitleErasure }}</td>
              <td :title="project.expireTime">{{ project.remaining }}</td>
              <td><a class="action-enter" href="#" @click.prevent="notifyComingSoon">进入</a></td>
            </tr>
            <tr v-if="!projects.length">
              <td :colspan="columns.length" class="empty-row">暂无项目</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import {fetchProjectList} from '@/api/project'

export default {
  name: 'QuickVideoTranslateView',
  components: { AppLayout, AppIcon },
  data() {
    return {
      searchKeyword: '',
      projects: [],
      pageOffset: 0,
      pageLimit: 10,
      loading: false,
      columns: [
        { key: 'name', label: '项目名称' },
        { key: 'sourceLanguage', label: '源语言' },
        { key: 'targetLanguage', label: '目标语言' },
        { key: 'materialCount', label: '素材数量' },
        { key: 'translation', label: '翻译' },
        { key: 'voiceover', label: '配音' },
        { key: 'backgroundRemoval', label: '去除背景音' },
        { key: 'subtitleErasure', label: '字幕擦除' },
        { key: 'remaining', label: '有效期剩余' },
        { key: 'actions', label: '操作' }
      ]
    }
  },
  computed: {
    projectRows() {
      return this.projects.map(project => ({
        id: project.id,
        name: project.name,
        sourceLanguage: project.fromLangName || project.fromLangCode || '-',
        targetLanguage: project.destLangName || project.destLangCode || '-',
        materialCount: project.videoNum ?? 0,
        translation: this.formatTranslation(project),
        translationDetail: this.formatTranslationDetail(project),
        voiceover: this.formatDubType(project.dubType),
        voiceoverDetail: this.formatDubDetail(project),
        backgroundRemoval: this.formatRemoveBgAudio(project.removeBgAudio),
        subtitleErasure: project.eraseType === 1 ? '开启' : '关闭',
        remaining: this.formatRemaining(project.expireTime),
        expireTime: this.formatDateTime(project.expireTime)
      }))
    }
  },
  created() {
    this.loadProjects()
  },
  activated() {
    this.loadProjects()
  },
  methods: {
    async loadProjects() {
      this.loading = true
      try {
        const response = await fetchProjectList({
          name: this.searchKeyword.trim(),
          pageOffset: this.pageOffset,
          pageLimit: this.pageLimit
        })
        this.projects = response?.data?.data?.list || response?.data?.list || response?.list || []
      } catch (error) {
        this.$message.error(error.message || '获取项目列表失败')
      } finally {
        this.loading = false
      }
    },
    formatTranslation(project) {
      if (project.transType === 2) return '上传翻译字幕'
      const subtitleLabels = { 1: '语音识别', 2: '画面识别' }
      return subtitleLabels[project.subtitleType] ? `智能翻译 / ${subtitleLabels[project.subtitleType]}` : '智能翻译'
    },
    formatTranslationDetail(project) {
      if (project.transType === 2) return '上传翻译字幕'
      const subtitleLabels = { 1: '语音识别', 2: '画面识别', 3: '上传' }
      const lines = ['翻译方式：智能翻译']
      if (subtitleLabels[project.subtitleType]) lines.push(`字幕来源：${subtitleLabels[project.subtitleType]}`)
      lines.push(`翻译词典：${project.transDictType === 1 ? '开启' : '关闭'}`)
      return lines.join('\n')
    },
    formatDubType(dubType) {
      const labels = { 0: '关闭', 1: '原声克隆', 2: '智能配音', 3: '手动选择' }
      return labels[dubType] || '-'
    },
    formatDubDetail(project) {
      const lines = [`配音方式：${this.formatDubType(project.dubType)}`]
      if (project.dubType === 3 && project.dubSpeakerId) lines.push(`配音员ID：${project.dubSpeakerId}`)
      lines.push(`视频时长调整：${project.dubVideoAdjust === 1 ? '调整' : '不调整'}`)
      lines.push(`音频时间戳调整：${project.dubAudioAdjust === 1 ? '调整' : '不调整'}`)
      return lines.join('\n')
    },
    formatRemoveBgAudio(removeBgAudio) {
      const labels = { 0: '不去除', 1: '去除背景音', 2: '去除背景音及音效' }
      return labels[removeBgAudio] || '-'
    },
    normalizeTime(value) {
      if (!value) return 0
      if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
      const time = new Date(value).getTime()
      return Number.isNaN(time) ? 0 : time
    },
    formatRemaining(expireTime) {
      const time = this.normalizeTime(expireTime)
      if (!time) return '-'
      const diff = time - Date.now()
      if (diff <= 0) return '已过期'
      const days = Math.floor(diff / 86400000)
      if (days >= 1) return `${days}天`
      const hours = Math.ceil(diff / 3600000)
      return `${hours}小时`
    },
    formatDateTime(expireTime) {
      const time = this.normalizeTime(expireTime)
      if (!time) return '-'
      const date = new Date(time)
      const pad = value => String(value).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    },
    notifyComingSoon() {
      this.$message.info('新增项目功能后续开放')
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #ff7a00;
$border: #eee;

.quick-translate-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 280px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid $border;
  border-radius: 4px;

  &:focus-within { border-color: $primary; }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    font-size: 13px;
  }
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 20px;
  border-radius: 4px;
  color: #fff;
  background: $primary;
  font-size: 14px;
  cursor: pointer;

  &:hover { background: #ff8f26; }
}

.table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid $border;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;

  th, td {
    padding: 14px 12px;
    border-bottom: 1px solid #f0f0f0;
    text-align: center;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f5f5f7;
    color: #555;
    font-weight: 500;
  }

  td { color: #333; }
  tbody tr:hover { background: #fafafa; }
}

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3478d4;
}

.action-enter {
  color: $primary;
  text-decoration: underline;
}

.empty-row {
  height: 120px;
  color: #999 !important;
}
</style>
