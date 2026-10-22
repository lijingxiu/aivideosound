<template>
  <AppLayout>
    <div class="detail-page">
      <header class="detail-head">
        <button class="back-button" aria-label="返回" @click="$router.back()">‹</button>
        <div class="project-heading">
          <span class="eyebrow">当前项目名称：</span>
          <h2>{{ project.name }}</h2>
        </div>
        <div class="project-tags">
          <span>语音识别</span>
          <span>角色识别</span>
          <span>字幕擦除</span>
        </div>
        <div class="validity"><small>项目有效期</small><strong>{{ project.validDays }}</strong></div>
      </header>

      <el-tabs v-model="tab" type="card" class="detail-tabs">
        <el-tab-pane label="素材管理" name="materials">
          <section class="content-card">
            <div class="section-title">
              <div>
                <h3>素材管理</h3>
                <p>管理项目中的原始视频、字幕及处理结果</p>
              </div>
              <span class="total-count">共 {{ filteredMaterials.length }} 个素材</span>
            </div>

            <input ref="materialPicker" type="file" multiple accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.flv,.ts" hidden
                   @change="handleMaterialInput">
            <div class="toolbar">
              <div class="toolbar-actions">
                <button class="primary-button" :disabled="uploading" @click="openMaterialPicker">＋ 上传素材</button>
                <button :disabled="!selectedItems.length" @click="notify('批量导出功能即将开放')">批量导出</button>
                <button :disabled="!selectedItems.length" @click="notify('批量删除功能即将开放')">批量删除</button>
                <button class="secondary-button" @click="notify('新增译制功能即将开放')">新增译制</button>
              </div>
              <div class="filters">
                <label class="search-box"><span>⌕</span><input v-model.trim="keyword" placeholder="搜索素材名称"
                                                               @keyup.enter="loadMaterials"></label>
                <select v-model="statusFilter" aria-label="状态筛选">
                  <option value="">全部状态</option>
                  <option value="0">进行中</option>
                  <option value="1">成功</option>
                  <option value="2">失败</option>
                </select>
                <select v-model="checkFilter" aria-label="校对筛选">
                  <option value="">全部校对</option>
                  <option value="0">未校对</option>
                  <option value="1">已校对</option>
                </select>
                <select v-model="orderType" aria-label="排序方式">
                  <option value="0">名称升序</option>
                  <option value="1">创建时间升序</option>
                  <option value="2">创建时间降序</option>
                </select>
                <button class="refresh-button" :disabled="loading" aria-label="刷新" @click="loadMaterials">↻</button>
              </div>
            </div>

            <div v-if="errorMessage" class="message error-message">{{ errorMessage }}
              <button @click="loadMaterials">重新加载</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                <tr>
                  <th class="check-cell"><input v-model="allSelected" type="checkbox" aria-label="全选"></th>
                  <th class="name-cell">素材名称</th>
                  <th>时长</th>
                  <th>人声 / 背景音</th>
                  <th>字幕识别</th>
                  <th>角色识别</th>
                  <th>字幕擦除</th>
                  <th>整体状态</th>
                  <th>校对状态</th>
                  <th class="action-cell">操作</th>
                </tr>
                </thead>
                <tbody v-if="!loading && filteredMaterials.length">
                <tr v-for="item in filteredMaterials" :key="item.id">
                  <td class="check-cell"><input v-model="selectedIds" :value="item.id" type="checkbox"
                                                :aria-label="`选择${item.name}`"></td>
                  <td class="name-cell"><span class="file-icon">MP4</span>
                    <div><strong>{{
                        item.name || '未命名素材'
                      }}</strong><small>{{ item.videoSize ? `${item.videoSize} MB` : '—' }}</small></div>
                  </td>
                  <td>{{ formatDuration(item.videoDuration) }}</td>
                  <td>
                    <StatusPill :value="item.separateState" :map="processingStates"></StatusPill>
                  </td>
                  <td>
                    <StatusPill :value="item.subtitleState" :map="processingStates"></StatusPill>
                  </td>
                  <td>
                    <StatusPill :value="item.roleState" :map="processingStates"></StatusPill>
                  </td>
                  <td>
                    <StatusPill :value="item.eraseState" :map="processingStates"></StatusPill>
                  </td>
                  <td>
                    <StatusPill :value="item.state" :map="overallStates"></StatusPill>
                  </td>
                  <td><span class="check-status" :class="{ checked: item.checkState === 1 }">{{
                      item.checkState === 1 ? '已校对' : '未校对'
                    }}</span></td>
                  <td class="actions">
                    <button
                      @click="$router.push({ name: 'video-edit', params: { projectId: $route.params.id, videoId: item.id } })">
                      编辑
                    </button>
                    <button @click="notify('导出功能即将开放')">导出</button>
                    <button aria-label="更多操作">•••</button>
                  </td>
                </tr>
                </tbody>
                <tbody v-else-if="loading">
                <tr>
                  <td colspan="10" class="empty-state"><span class="loader"></span>正在加载素材...</td>
                </tr>
                </tbody>
                <tbody v-else>
                <tr>
                  <td colspan="10" class="empty-state"><span
                    class="empty-icon">□</span><strong>{{ errorMessage ? '素材加载失败' : '暂无素材' }}</strong><small>{{
                      errorMessage ? '请稍后重试' : '上传视频后，素材会显示在这里'
                    }}</small></td>
                </tr>
                </tbody>
              </table>
            </div>
          </section>
        </el-tab-pane>
        <el-tab-pane label="译制管理" name="dub">
          <section class="empty-tab"><strong>暂无译制任务</strong><span>创建译制任务后，相关内容会显示在这里</span>
          </section>
        </el-tab-pane>
      </el-tabs>
    </div>
    <SubmitProgressModal :visible="uploading" :current-step="uploadStep" :step-status="uploadStatus"/>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import SubmitProgressModal from '@/components/project/SubmitProgressModal.vue'
import {fetchOriginalList, fetchProjectList, getOriginalUploadPolicy, submitOriginal} from '@/api/project'
import {validateVideoFile, formatValidationMessage, getFileExt, getBaseName} from '@/utils/videoValidator'

const StatusPill = {
  props: ['value', 'map'],
  computed: {
    status() {
      return this.map[this.value] || {label: '未开始', type: 'pending'}
    }
  },
  render(h) {
    return h('span', {class: ['status-pill', this.status.type]}, [h('i'), this.status.label])
  }
}

export default {
  name: 'ProjectDetailView',
  components: {AppLayout, StatusPill, SubmitProgressModal},
  data() {
    return {
      tab: 'materials',
      keyword: '',
      statusFilter: '',
      checkFilter: '',
      orderType: '0',
      materials: [],
      selectedIds: [],
      loading: false,
      errorMessage: '',
      searchTimer: null,
      projectName: '',
      projectExpireTime: '',
      uploading: false,
      uploadStep: 0,
      uploadStatus: 'active',
      processingStates: {
        '-2': {label: '未启用', type: 'disabled'},
        '-1': {label: '未开始', type: 'pending'},
        0: {label: '进行中', type: 'running'},
        1: {label: '成功', type: 'success'},
        2: {label: '失败', type: 'fail'}
      },
      overallStates: {
        1: {label: '进行中', type: 'running'},
        2: {label: '成功', type: 'success'},
        3: {label: '失败', type: 'fail'}
      }
    }
  },
  computed: {
    project() {
      let validDays = '—';

      if (this.projectExpireTime) {

        let projectExpireTime11 = Number(this.projectExpireTime) ? new Date(Number(this.projectExpireTime)).getTime() : undefined;
        const diff = projectExpireTime11 - Date.now();
        validDays = Number.isNaN(diff) ? '—' : diff <= 0 ? '已过期' : `${Math.ceil(diff / 86400000)}天`;
      }
      return {name: this.projectName || this.$route.params.id || '未命名项目', validDays}
    },
    filteredMaterials() {
      return this.materials.filter(item => (!this.keyword || (item.name || '').toLowerCase().includes(this.keyword.toLowerCase())) && (this.statusFilter === '' || this.requestState(item.state) === this.statusFilter) && (this.checkFilter === '' || String(item.checkState) === this.checkFilter))
    },
    allSelected: {
      get() {
        return this.filteredMaterials.length > 0 && this.filteredMaterials.every(item => this.selectedIds.includes(item.id))
      },
      set(value) {
        this.selectedIds = value ? this.filteredMaterials.map(item => item.id) : []
      }
    },
    selectedItems() {
      return this.selectedIds.filter(id => this.materials.some(item => item.id === id))
    }
  },
  watch: {
    keyword() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.loadMaterials(), 300)
    },
    orderType() {
      this.loadMaterials()
    }, statusFilter() {
      this.loadMaterials()
    }, checkFilter() {
      this.loadMaterials()
    }, '$route.params.id': 'loadMaterials'
  },
  created() {
    this.loadProject();
    this.loadMaterials()
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
  },
  methods: {
    requestState(state) {
      return state === 1 ? '0' : state === 2 ? '1' : state === 3 ? '2' : ''
    },
    async loadProject() {
      const id = String(this.$route.params.id || '')
      const queryName = this.$route.query.name
      const queryExpire = this.$route.query.expireTime
      let cached = {}
      try {
        cached = JSON.parse(sessionStorage.getItem(`project-${id}`) || '{}')
      } catch (e) {
        cached = {}
      }
      this.projectName = queryName || cached.name || ''
      this.projectExpireTime = queryExpire || cached.expireTime || ''
      if (this.projectName && this.projectExpireTime) {
        sessionStorage.setItem(`project-${id}`, JSON.stringify({
          name: this.projectName,
          expireTime: this.projectExpireTime
        }))
        return
      }
      try {
        const response = await fetchProjectList({pageOffset: 0, pageLimit: 50, name: ''})
        const list = response?.data?.data?.list || response?.data?.list || response?.list || []
        const matched = list.find(item => String(item.id) === id) || {}
        const expire = matched.expireTime || matched.expire_time || matched.validDays || matched.valid_days || ''
        if (matched.name) this.projectName = matched.name
        if (expire) this.projectExpireTime = expire
        if (this.projectName || this.projectExpireTime) sessionStorage.setItem(`project-${id}`, JSON.stringify({
          name: this.projectName,
          expireTime: this.projectExpireTime
        }))
      } catch (e) { /* 刷新时无 query 则保持占位，素材列表不受影响 */
      }
    },
    async loadMaterials() {
      this.loading = true;
      this.errorMessage = ''
      try {
        const response = await fetchOriginalList({
          projectId: this.$route.params.id,
          name: this.keyword,
          state: this.statusFilter,
          checkState: this.checkFilter,
          orderType: this.orderType
        });
        this.materials = response?.data?.data?.list || response?.data?.list || response?.list || [];
        this.selectedIds = []
      } catch (error) {
        this.errorMessage = error.message || '素材列表加载失败'
      } finally {
        this.loading = false
      }
    },
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '—';
      const minutes = Math.floor(seconds / 60);
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
    },
    notify(message) {
      this.$message ? this.$message.info(message) : undefined
    },
    openMaterialPicker() {
      const picker = this.$refs.materialPicker
      if (!picker) return
      picker.value = ''
      picker.click()
    },
    handleMaterialInput(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (files.length) this.uploadMaterials(files)
    },
    readVideoDuration(objectUrl) {
      return new Promise(resolve => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = objectUrl
        video.onloadedmetadata = () => {
          resolve(Number.isFinite(video.duration) ? video.duration : 0)
          video.src = ''
        }
        video.onerror = () => resolve(0)
      })
    },
    async uploadFileWithPolicy(file, extension, filePath) {
      const api = window.electronAPI
      if (!api?.uploadOssFile) throw new Error('当前应用不支持 OSS 上传，请重新安装桌面客户端')
      const policyResponse = await getOriginalUploadPolicy(extension)
      const policy = policyResponse?.data || policyResponse
      const resolvedPath = filePath || api.getFilePath?.(file)
      if (!resolvedPath) throw new Error(`无法读取待上传文件：${file?.name || extension}`)
      const uploadResult = await api.uploadOssFile({
        host: policy.host,
        policy,
        filePath: resolvedPath,
        fileName: file?.name || extension
      })
      console.log('[OSS上传成功]', {
        fileName: file?.name || extension,
        fileKey: policy.fileKey,
        result: uploadResult
      })
      return policy.fileKey
    },
    async splitVideo(video) {
      const api = window.electronAPI
      if (!api?.splitVideoAudio || !api?.readTempFile) {
        throw new Error('当前应用不支持 FFmpeg 音视频拆分，请重新安装桌面客户端')
      }
      const sourcePath = api.getFilePath?.(video.file)
      if (!sourcePath) throw new Error(`无法读取视频文件：${video.name}`)
      const paths = await api.splitVideoAudio({
        sourcePath,
        id: video.id,
        extension: getFileExt(video.name)
      })
      const muteBytes = await api.readTempFile(paths.mutePath)
      const audioBytes = await api.readTempFile(paths.audioPath)
      const muteFile = new File([muteBytes], `video-mute.${getFileExt(video.name)}`, {type: video.file?.type || 'video/mp4'})
      const audioFile = new File([audioBytes], `${getBaseName(video.name)}.mp3`, {type: 'audio/mpeg'})
      return {paths, muteFile, audioFile}
    },
    async uploadVideo(video) {
      const media = await this.splitVideo(video)
      try {
        const videoKey = await this.uploadFileWithPolicy(media.muteFile, getFileExt(video.name), media.paths.mutePath)
        const audioKey = await this.uploadFileWithPolicy(media.audioFile, 'mp3', media.paths.audioPath)
        return {
          name: video.name,
          videoMuteUrl: videoKey,
          audioUrl: audioKey,
          videoDuration: Math.floor(Number(video.duration) || 0),
          videoSize: Math.floor((Number(video.size) || media.muteFile.size || 0) / (1024 * 1024)),
          srtUrl: ''
        }
      } finally {
        await window.electronAPI?.removeTempFiles?.([media.paths.mutePath, media.paths.audioPath])
      }
    },
    async uploadMaterials(files) {
      const valid = []
      for (const file of files) {
        const objectUrl = URL.createObjectURL(file)
        const duration = await this.readVideoDuration(objectUrl)
        URL.revokeObjectURL(objectUrl)
        const errors = validateVideoFile({name: file.name, size: file.size, duration})
        if (errors.length) {
          alert(formatValidationMessage(file.name, errors))
          continue
        }
        valid.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          duration,
          file
        })
      }
      if (!valid.length) return

      this.uploading = true
      this.uploadStatus = 'active'
      this.uploadStep = 1
      try {
        const originalList = []
        for (const video of valid) {
          originalList.push(await this.uploadVideo(video))
        }
        this.uploadStep = 2
        await submitOriginal({
          projectId: this.$route.params.id,
          originalListStr: JSON.stringify(originalList)
        })
        this.uploadStatus = 'done'
        await this.loadMaterials()
        setTimeout(() => {
          this.uploading = false
        }, 500)
      } catch (e) {
        this.uploading = false
        this.uploadStatus = 'active'
        alert(e.message || '上传素材失败，请稍后重试')
      }
    }
  }
}
</script>

<style scoped lang="scss">
$orange: #ff7a00;
$blue: #2e92ff;
$border: #e9edf2;
$muted: #8993a1;
.detail-page {
  min-height: 100%;
  margin: -12px -16px;
  display: flex;
  flex-direction: column;
  color: #202733;
}

.detail-head {
  padding: 8px 0px;
  display: flex;
  align-items: center;
  gap: 8px;
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

  &:hover {
    background: #f4f6f8;
  }
}

.project-heading {
  min-width: 0;
  display: flex;
  align-items: baseline;
  white-space: nowrap;

  .eyebrow {
    color: $muted;
    font-size: 14px;
  }

  h2 {
    margin: 0;
    color: $muted;
    font-size: 14px;
    font-weight: 400;
    white-space: nowrap;
  }
}

.project-tags {
  display: flex;
  gap: 8px;

  span {
    padding: 5px 10px;
    color: #667085;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
  }
}

.validity {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 10px;
  background: #fff7ed;
  border-radius: 6px;
  color: $orange;

  small {
    color: #b66a25;
    font-size: 12px;
  }

  strong {
    font-size: 14px;
  }
}

.detail-tabs {
  margin-top: 12px;

  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: 0;
  }

  :deep(.el-tabs__nav) {
    gap: 8px;
    border: 0;
  }

  :deep(.el-tabs__item) {
    height: 36px;
    line-height: 36px;
    padding: 0 20px !important;
    color: $muted;
    font-size: 14px;
    background: #f5f7fa;
    border: 1px solid $border !important;
    border-radius: 8px 8px 0 0;
    transition: all .2s;

    &:hover {
      color: $orange;
    }

    &.is-active {
      color: $orange;
      font-weight: 600;
      background: #fff8f0;
      border-color: #ffc58e !important;
      box-shadow: inset 0 2px 0 $orange;
    }
  }

  :deep(.el-tabs__content) {
    background: #fff;
  }
}

.content-card {
  flex: 1;
  min-height: 0;
  margin-top: 0;
  padding: 20px;
  border: 1px solid $border;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
  box-shadow: 0 5px 20px rgba(29, 46, 68, .04);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0 0 5px;
    font-size: 18px;
  }

  p {
    margin: 0;
    color: $muted;
    font-size: 13px;
  }

  .total-count {
    color: $muted;
    font-size: 13px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 14px 0 15px;
  flex-wrap: wrap;
}

.toolbar-actions, .filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar button, .toolbar select {
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

.primary-button {
  border-color: $orange !important;
  color: #fff !important;
  background: $orange !important;

  &:hover {
    background: #f06d00 !important;
  }
}

.secondary-button {
  color: $orange !important;
  border-color: #ffc58e !important;
  background: #fff8f0 !important;
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
    //transform: translateY(-1px);
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
  min-width: 1080px;
  border-collapse: collapse;
  white-space: nowrap;
}

th, td {
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
  min-width: 190px;
  text-align: left;
}

.name-cell > div {
  display: inline-flex;
  flex-direction: column;
  vertical-align: middle;
  gap: 3px;
}

.name-cell strong {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.name-cell small {
  color: $muted;
  font-size: 11px;
}

.file-icon {
  display: inline-block;
  margin-right: 8px;
  padding: 3px 4px;
  color: #2e92ff;
  background: #edf6ff;
  border-radius: 3px;
  font-size: 9px;
  vertical-align: middle;
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

  &.running {
    color: #2e92ff;

    i {
      background: #2e92ff;
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

.check-status {
  color: #98a2b3;

  &.checked {
    color: #28a745;
  }
}

.actions {
  button {
    margin: 0 3px;
    color: $muted;
    font-size: 12px;

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

  strong, small {
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
  }
}

.empty-tab {
  flex: 1;
  min-height: 300px;
  margin-top: 0;
  border: 1px solid $border;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $muted;
  gap: 8px;

  strong {
    color: #667085;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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
