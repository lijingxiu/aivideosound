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
              <td>
                <div class="project-name" role="link" tabindex="0" @click="enterProject(project)" @keyup.enter="enterProject(project)">
                  <AppIcon name="folder" :size="18" color="#ff7a00" />{{ project.name }}
                </div>
              </td>
              <td>{{ project.sourceLanguage }}</td>
              <td>{{ project.targetLanguage }}</td>
              <td>{{ project.materialCount }}</td>
              <td :title="project.translationDetail">{{ project.translation }}</td>
              <td>{{ project.subtitleErasure }}</td>
              <td :title="project.expireTime">{{ project.remaining }}</td>
              <td :title="project.remark">{{ project.remark || '-' }}</td>
              <td>
                <div class="row-actions">
                  <a class="action-enter" href="#" @click.prevent="enterProject(project)">进入</a>
                  <div class="more-menu-wrap">
                    <button type="button" class="action-more" aria-label="更多操作"
                            :aria-expanded="activeProjectMenu === project.id"
                            @click.stop="toggleProjectMenu(project.id)">···</button>
                    <div v-if="activeProjectMenu === project.id" class="more-menu" @click.stop>
                      <button type="button" @click="openEditProject(project)">重命名</button>
                      <button type="button" @click="confirmDeleteProject(project)">删除</button>
                      <button type="button" @click="openRemarkProject(project)">备注</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="!projects.length">
              <td :colspan="columns.length" class="empty-row">暂无项目</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="editProjectVisible" class="edit-modal-mask" @click.self="closeEditProject">
      <div class="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
        <div class="edit-modal__head">
          <span id="edit-project-title">{{ projectEditType === 'name' ? '修改项目' : '修改备注' }}</span>
          <button type="button" class="edit-modal__close" aria-label="关闭" @click="closeEditProject">×</button>
        </div>
        <div class="edit-modal__body">
          <label for="edit-project-value">{{ projectEditType === 'name' ? '项目名称' : '项目备注' }}</label>
          <input id="edit-project-value" v-model.trim="projectEditValue" type="text" :maxlength="projectEditType === 'name' ? 20 : 200" autofocus />
        </div>
        <div class="edit-modal__foot">
          <button type="button" class="edit-modal__cancel" @click="closeEditProject">取消</button>
          <button type="button" class="edit-modal__confirm" :disabled="updatingProject" @click="updateProjectInfo">确定</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import {deleteFastProject, fetchProjectList, updateFastProjectInfo} from '@/api/project'

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
      activeProjectMenu: null,
      editProjectVisible: false,
      projectEditType: 'name',
      projectEditValue: '',
      editingProject: null,
      updatingProject: false,
      columns: [
        { key: 'name', label: '项目名称' },
        { key: 'sourceLanguage', label: '源语言' },
        { key: 'targetLanguage', label: '目标语言' },
        { key: 'materialCount', label: '素材数量' },
        { key: 'translation', label: '字幕来源' },
        { key: 'subtitleErasure', label: '字幕擦除' },
        { key: 'remaining', label: '有效期剩余' },
        { key: 'remark', label: '备注' },
        { key: 'actions', label: '操作' }
      ]
    }
  },
  computed: {
    projectRows() {
      return this.projects.map(project => ({
        id: project.id,
        name: project.name,
        remark: project.remark || '',
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
        if (!error.messageShown) this.$message.error(error.message || '获取项目列表失败')
      } finally {
        this.loading = false
      }
    },
    formatTranslation(project) {
      if (project.transType === 2) return '上传字幕'
      const subtitleLabels = { 1: '语音识别', 2: '画面识别' }
      return subtitleLabels[project.subtitleType] || '语音识别'
    },
    formatTranslationDetail(project) {
      if (project.transType === 2) return '上传字幕'
      const subtitleLabels = { 1: '语音识别', 2: '画面识别' }
      return subtitleLabels[project.subtitleType] || '语音识别'
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
    },
    toggleProjectMenu(projectId) {
      this.activeProjectMenu = this.activeProjectMenu === projectId ? null : projectId
    },
    closeProjectMenu() {
      this.activeProjectMenu = null
    },
    openEditProject(project) {
      this.openProjectEditor(project, 'name', project.name)
    },
    openRemarkProject(project) {
      this.openProjectEditor(project, 'remark', project.remark || '')
    },
    openProjectEditor(project, type, value) {
      this.closeProjectMenu()
      this.editingProject = project
      this.projectEditType = type
      this.projectEditValue = value
      this.editProjectVisible = true
    },
    closeEditProject(force = false) {
      if (this.updatingProject && !force) return
      this.editProjectVisible = false
      this.projectEditValue = ''
      this.editingProject = null
    },
    async updateProjectInfo() {
      const value = this.projectEditValue.trim()
      if (this.projectEditType === 'name' && !value) {
        this.$message.warning('请输入项目名称')
        return
      }
      if (!this.editingProject) return
      this.updatingProject = true
      try {
        const payload = { id: this.editingProject.id, [this.projectEditType]: value }
        await updateFastProjectInfo(payload)
        this.$message.success(this.projectEditType === 'name' ? '项目名称修改成功' : '项目备注修改成功')
        this.closeEditProject(true)
        await this.loadProjects()
      } catch (error) {
        if (!error.messageShown) this.$message.error(error.message || '项目信息修改失败')
      } finally {
        this.updatingProject = false
      }
    },
    async confirmDeleteProject(project) {
      this.closeProjectMenu()
      try {
        await this.$confirm(`确定要删除项目“${project.name}”吗？删除后不可恢复。`, '删除确认', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteFastProject(project.id)
        this.$message.success('项目删除成功')
        await this.loadProjects()
      } catch (error) {
        if (error === 'cancel' || error === 'close') return
        if (!error.messageShown) this.$message.error(error.message || '项目删除失败')
      }
    },
    enterProject(project) {
      this.$router.push({
        name: 'quick-video-translate-tasks',
        params: { id: project.id },
        query: {
          name: project.name,
          fromLangName: project.sourceLanguage,
          destLangName: project.targetLanguage,
          expireTime: project.expireTime
        }
      })
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
  cursor: pointer;

  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid $primary; outline-offset: 2px; }
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.action-enter {
  color: $primary;
  text-decoration: underline;
}

.more-menu-wrap {
  position: relative;
}

.action-more {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: $primary;
  font-size: 20px;
  font-weight: 700;
  line-height: 20px;
  cursor: pointer;

  &:hover { background: #fff3e8; }
}

.more-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 5;
  min-width: 88px;
  padding: 4px 0;
  border: 1px solid $border;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .12);

  button {
    display: block;
    width: 100%;
    padding: 8px 14px;
    border: 0;
    background: transparent;
    color: #333;
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover { background: #fff3e8; color: $primary; }
  }
}

.empty-row {
  height: 120px;
  color: #999 !important;
}

.edit-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .35);
}

.edit-modal {
  width: 420px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, .2);
}

.edit-modal__head,
.edit-modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.edit-modal__head {
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.edit-modal__close {
  border: 0;
  background: transparent;
  color: #999;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;

  &:hover { color: $primary; }
}

.edit-modal__body {
  padding: 22px 20px 10px;

  label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-size: 13px;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    outline: 0;
    font-size: 14px;

    &:focus { border-color: $primary; }
  }
}

.edit-modal__foot {
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;

  button {
    min-width: 68px;
    height: 32px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
  }
}

.edit-modal__cancel {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
}

.edit-modal__confirm {
  border: 1px solid $primary;
  background: $primary;
  color: #fff;
}
</style>
