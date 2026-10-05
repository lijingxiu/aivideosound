<template>
  <div class="new-project">
    <div class="page-head" @click="$router.back()">
      <button class="back" aria-label="返回" title="返回">‹</button>
      <h2>新增项目</h2>
    </div>
    <input ref="videoPicker" type="file" multiple accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.flv,.ts" hidden
           @change="handleVideoInput">
    <div class="workspace" :class="{ 'workspace--empty': !videos.length }">
      <VideoUploadArea v-if="!videos.length" @select="addVideos"/>
      <VideoListPanel v-else :videos="videos" :active-id="activeId" @upload="openVideoPicker"
                      @select="activeId = $event" @remove="removeVideo"/>
      <VideoPreview v-if="videos.length" :video="activeVideo"
                    :show-select-box="subtitleSource === 'ocr' || subtitleErase"
                    :select-label="subtitleErase ? '拖动调整擦除位置' : '请框选字幕区域（对所有视频有效）'"
                    :region="region" @update:region="region = $event"/>
      <section class="settings">
        <label>项目名称
          <el-input v-model.trim="projectName" maxlength="20" placeholder="请输入"
                    class="project-name-input"></el-input>
          <em>{{
              projectName.length
            }}/20</em></label>
        <label>源语言
          <el-select v-model="sourceLanguage" placeholder="请选择" class="language-select">
          <el-option v-for="l in languages" :key="l.code" :label="l.name" :value="l.code"></el-option>
          </el-select>
        </label>
        <div class="setting-block">
          <div>字幕来源</div>
          <el-tabs style="" v-model="subtitleSource" type="border-card" class="subtitle-tabs">
            <el-tab-pane v-for="s in subtitleSources" :key="s.value" :name="s.value">
              <span slot="label">
                <el-tooltip :content="s.tooltip" placement="top">
                  <span>{{ s.label }}<small v-if="s.tag">（{{ s.tag }}）</small></span>
                </el-tooltip>
              </span>
              <div v-if="subtitleSource === 'asr' || subtitleSource === 'ocr'">
                <div class="segment-setting-row">
                  <span>角色识别
                    <el-tooltip
                      content="智能识别对话角色，方便多角色译制配音。视频中存在多角色且需要译制配音时建议开启；仅字幕翻译不配音无需开启。"
                      placement="top">
                      <i class="setting-info">i</i>
                    </el-tooltip>
                  </span>
                  <el-tooltip content="20积分/分钟，译制配音项目建议开启，关闭后译制配音仅支持手动选择AI配音员。"
                              placement="top">
                    <el-switch v-model="roleRecognition" active-color="#ed6200" inactive-color="#d9d9d9"/>
                  </el-tooltip>
                </div>
                <p v-if="!roleRecognition" class="role-recognition-hint">
                  注：关闭角色识别，译制配音时仅支持手动选择AI配音员</p>
                <div class="segment-setting-row">
                  <span>人声背景音分离
                    <el-tooltip
                      content="智能分离视频中的人声和背景音，提升语音识别和角色识别的准确性。视频中存在背景音乐且需要语音识别或角色识别时建议开启；译制配音需要保留背景音时开启。"
                      placement="top">
                      <i class="setting-info">i</i>
                    </el-tooltip>
                  </span>
                  <el-tooltip
                    content="20积分/分钟，视频存在背景音或音效时建议开启，关闭后可能会影响语音识别和译制配音效果"
                    placement="top">
                    <el-switch v-model="vocalSeparation" active-color="#ed6200" inactive-color="#d9d9d9"/>
                  </el-tooltip>
                </div>
                <div class="segment-setting-row">
                  <span>字幕擦除</span>
                  <el-tooltip content="200积分/分钟，自动识别字幕内容并智能擦除，恢复原视频内容" placement="top">
                    <el-switch v-model="subtitleErase" active-color="#ed6200" inactive-color="#d9d9d9"/>
                  </el-tooltip>

                </div>
              </div>
              <div v-if="subtitleSource === 'upload'" class="subtitle-folder" @click="openSubtitlePicker">
                <input
                  ref="subtitleInput" type="file" webkitdirectory directory multiple hidden
                  @change="selectSubtitleFolder"><strong>请选择<span>字幕文件所在位置</span></strong>
                <p>{{ subtitleFolder || '系统会自动匹配与视频文件同名的srt字幕文件' }}</p></div>


            </el-tab-pane>
          </el-tabs>

        </div>

        <div class="estimate">积分消耗预估：<b>{{ totalPoints || '--' }}</b></div>
        <button class="submit" :disabled="!videos.length" @click="submit">提交</button>
      </section>
    </div>
    <SubmitProgressModal :visible="submitting" :current-step="step" :step-status="status"/>
  </div>
</template>
<script>
import AppTooltip from '@/components/common/AppTooltip.vue';
import VideoUploadArea from '@/components/project/VideoUploadArea.vue';
import VideoListPanel from '@/components/project/VideoListPanel.vue';
import VideoPreview from '@/components/project/VideoPreview.vue';
import SubmitProgressModal from '@/components/project/SubmitProgressModal.vue';
import {SUBTITLE_SOURCES, MAX_VIDEO_COUNT} from '@/constants/project';
import {validateVideoFile, naturalSort, getFileExt, getBaseName} from '@/utils/videoValidator';
import {calcTotalPoints} from '@/utils/pointsCalculator';
import {fetchProjectInfo, getOriginalUploadPolicy, uploadOriginalFile, submitProjectTask} from '@/api/project'

export default {
  components: {AppTooltip, VideoUploadArea, VideoListPanel, VideoPreview, SubmitProgressModal},
  data: () => ({
    projectName: '',
    sourceLanguage: '',
    subtitleSource: 'asr',
    roleRecognition: true,
    vocalSeparation: true,
    subtitleErase: false,
    videos: [],
    activeId: '',
    subtitleFolder: '',
    subtitleFiles: [],
    region: {x: .1, y: .65, w: .8, h: .2},
    submitting: false,
    step: 0,
    status: 'active',
    languages: [],
    subtitleSources: SUBTITLE_SOURCES,
    projectInfo: null
  }),
  created() {
    this.loadProjectInfo()
    this.restoreCachedVideos()
  },
  beforeDestroy() {
    this.videos.forEach(video => {
      if (video.objectUrl && video.objectUrl.startsWith('blob:')) URL.revokeObjectURL(video.objectUrl)
    })
  },
  computed: {
    activeVideo() {
      return this.videos.find(v => v.id === this.activeId) || this.videos[0]
    }, totalPoints() {
      return calcTotalPoints(this.videos, {
        subtitleSource: this.subtitleSource,
        roleRecognition: this.roleRecognition,
        vocalSeparation: this.vocalSeparation,
        subtitleErase: this.subtitleErase
      })
    }
  },
  methods: {
    openVideoPicker() {
      const picker = this.$refs.videoPicker
      if (!picker) return
      // 允许连续两次选择同一个文件时也触发 change。
      picker.value = ''
      picker.click()
    },
    handleVideoInput(event) {
      const files = Array.from(event.target.files || [])
      if (files.length) this.addVideos(files)
      event.target.value = ''
    },
    async loadProjectInfo() {
      try {
        const response = await fetchProjectInfo()
        this.projectInfo = response.data
        this.languages = response.data?.languageList || []
      } catch (error) {
        console.error('获取项目配置失败', error)
      }
    },
    async restoreCachedVideos() {
      const api = window.electronAPI
      if (!api?.getCachedVideos) return
      try {
        const cached = await api.getCachedVideos()
        this.videos = await Promise.all(cached.map(async video => ({
          ...video,
          objectUrl: await this.createCachedObjectUrl(video),
          file: null,
          thumbnail: video.thumbnail || ''
        })))
        this.videos = this.videos.sort(naturalSort)
        this.activeId = this.videos[0]?.id || ''
      } catch (error) {
        console.error('恢复视频缓存失败', error)
      }
    },
    async createCachedObjectUrl(video) {
      const api = window.electronAPI
      if (!api?.readFileBytes || !video.path) return video.fileUrl || ''
      const bytes = await api.readFileBytes(video.path)
      const ext = getFileExt(video.name)
      const mime = ext === 'webm' ? 'video/webm' : ext === 'mov' ? 'video/quicktime' : 'video/mp4'
      return URL.createObjectURL(new Blob([bytes], {type: mime}))
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
    createThumbnail(file, objectUrl) {
      return new Promise(resolve => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.muted = true
        video.src = objectUrl
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(1, video.duration || 0)
        }
        video.onseeked = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 320
          canvas.height = video.videoHeight || 180
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.75))
          video.src = ''
        }
        video.onerror = () => resolve('')
      })
    },
    async cacheVideo(video) {
      const api = window.electronAPI
      if (!api?.cacheVideo || !video.file) return
      try {
        const sourcePath = api.getFilePath?.(video.file)
        const cached = await api.cacheVideo({
          id: video.id,
          name: video.name,
          size: video.size,
          duration: video.duration,
          sourcePath,
          thumbnail: video.thumbnail
        })
        // 当前页面继续使用上传产生的 blob URL，避免 file:// 地址导致 video 无法加载。
        this.$set(video, 'cachedPath', cached.path)
      } catch (error) {
        console.error('缓存视频失败', error)
      }
    },
    async addVideos(files) {
      if (this.videos.length + files.length > MAX_VIDEO_COUNT) return alert('单次任务不能超过100个视频');
      const next = files.map((f, i) => {
        const e = validateVideoFile(f);
        if (e.length) {
          alert(`${f.name}${e.join('，')}，请检查修改`);
          return null
        }
        const objectUrl = URL.createObjectURL(f)
        return {
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          size: f.size,
          duration: f.duration || 0,
          objectUrl,
          thumbnail: '',
          file: f
        }
      }).filter(Boolean);
      this.videos = [...this.videos, ...next].sort(naturalSort);
      if (!this.activeId) this.activeId = this.videos[0]?.id || ''

      await Promise.all(next.map(async video => {
        if (!video.duration) {
          video.duration = await this.readVideoDuration(video.objectUrl)
        }
        video.thumbnail = await this.createThumbnail(video.file, video.objectUrl)
        await this.cacheVideo(video)
      }))
    },
    async uploadFileWithPolicy(file, extension) {
      const policy = await getOriginalUploadPolicy(extension)
      return uploadOriginalFile(file, policy)
    },
    async splitVideo(video) {
      const api = window.electronAPI
      if (!api?.splitVideoAudio || !api?.readTempFile) {
        throw new Error('当前应用不支持 FFmpeg 音视频拆分，请重新安装桌面客户端')
      }
      const sourcePath = video.file ? api.getFilePath?.(video.file) : video.path
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
      return { paths, muteFile, audioFile }
    },
    async getUploadFile(video) {
      if (video.file) return video.file
      const response = await fetch(video.objectUrl)
      const blob = await response.blob()
      return new File([blob], video.name, {type: blob.type || 'video/*'})
    },
    getApiToken() {
      return this.$store.state.user?.token || '91603f56-6f75-45fa-b8a8-ebf5e463f1f9'
    },
    async uploadVideo(video) {
      const media = await this.splitVideo(video)
      try {
        const videoKey = await this.uploadFileWithPolicy(media.muteFile, getFileExt(video.name))
        const audioKey = await this.uploadFileWithPolicy(media.audioFile, 'mp3')
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
    async uploadSubtitle(video) {
      const name = getBaseName(video.name).toLowerCase()
      const subtitle = this.subtitleFiles.find(file => getBaseName(file.name).toLowerCase() === name)
      if (!subtitle) return ''
      return this.uploadFileWithPolicy(subtitle, getFileExt(subtitle.name))
    },
    async removeVideo(id) {
      const video = this.videos.find(v => v.id === id)
      // 优先更新界面，缓存清理失败不会影响用户删除列表中的视频。
      this.videos = this.videos.filter(v => v.id !== id)
      this.activeId = this.videos[0]?.id || ''
      if (video?.objectUrl?.startsWith('blob:')) URL.revokeObjectURL(video.objectUrl)
      if (window.electronAPI?.removeCachedVideo) {
        try {
          await window.electronAPI.removeCachedVideo(id)
        } catch (error) {
          console.error('删除视频缓存失败', error)
        }
      }
    },
    openSubtitlePicker() {
      this.$refs.subtitleInput.click()
    },
    selectSubtitleFolder(e) {
      this.subtitleFiles = [...e.target.files];
      this.subtitleFolder = this.subtitleFiles[0]?.webkitRelativePath?.split('/')[0] || '已选择字幕文件夹'
    },
    async submit() {
      if (!this.projectName) return alert('请输入项目名称');
      if (!this.sourceLanguage) return alert('请选择源语言');
      if (this.subtitleSource === 'upload' && !this.subtitleFiles.length) return alert('请选择字幕文件所在位置');
      try {
        // const r = await fetchUserPoints();
        // const points = Number(r?.points ?? r?.data?.points ?? this.$store.state.user?.points ?? 0);
        // if (points < this.totalPoints) return alert('您的积分不足，无法提交此任务');
        const token = this.getApiToken()
        this.submitting = true;
        this.status = 'active';
        this.step = 0;
        const originalList = []
        this.step = 1
        for (const video of this.videos) {
          const item = await this.uploadVideo(video, token)
          if (this.subtitleSource === 'upload') item.srtUrl = await this.uploadSubtitle(video, token)
          originalList.push(item)
        }

        this.step = 2
        const region = this.region || {}
        await submitProjectTask({
          name: this.projectName,
          langCode: this.sourceLanguage,
          subtitleType: {asr: 1, ocr: 2, upload: 3}[this.subtitleSource],
          roleType: this.roleRecognition ? 1 : 0,
          separateType: this.vocalSeparation ? 1 : 0,
          eraseType: this.subtitleErase ? 1 : 0,
          originalListStr: JSON.stringify(originalList),
          ...(this.subtitleErase ? {
            eraseLocationStr: JSON.stringify({
              top_left_x: region.x,
              top_left_y: region.y,
              bottom_right_x: region.x + region.w,
              bottom_right_y: region.y + region.h
            })
          } : {})
        }, token)
        this.status = 'done';
        setTimeout(() => this.$router.push({name: 'home'}), 700)
      } catch (e) {
        this.submitting = false;
        this.status = 'active';
        alert(e.message || '提交失败，请稍后重试')
      }
    }
  }
}
</script>
<style scoped lang="scss">
.new-project {
  position: fixed;
  inset: 0;
  z-index: 10;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  padding: 10px 20px 20px 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: auto
}

.page-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px
}

.page-head h2 {
  font-size: 18px;
  margin-top: 5px;
}

.back {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 36px;
  color: #666
}

.workspace {
  display: grid;
  grid-template-columns:250px minmax(360px, 1fr) 500px;
  gap: 16px;
  flex: 1;
  min-height: 0
}

.workspace--empty {
  grid-template-columns:minmax(0, 4fr) minmax(0, 3fr)
}

.settings {
  padding: 4px 2px
}

.settings > label {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
  margin-bottom: 20px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 400
}

.settings input, .settings select {
  height: 34px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 0 14px;
  font-size: 14px;
  flex: 1;
  min-width: 0
}

.settings > label > .language-select {
  grid-column: 2;
  width: 100%;
  height: 38px;
}

.settings > label > .project-name-input {
  grid-column: 2;
  width: 100%;
  height: 34px;
}

.project-name-input ::v-deep .el-input__inner {
  height: 34px;
  line-height: 34px;
  border-radius: 6px;
}

::v-deep .el-input__inner {
  height: 38px !important;
  line-height: 38px !important;
  border-radius: 6px;
}

::v-deep .el-input {
  height: 38px !important;
}

.settings em {
  font-style: normal;
  color: #999;
  font-size: 13px
}

.settings > label > input,
.settings > label > select {
  grid-column: 2
}

.settings > label > em {
  grid-column: 3
}

.setting-block > div:first-child {
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
  font-weight: 400
}

.segment-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  font-size: 14px;
  color: #222;
}

.setting-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  border: 1px solid #999;
  border-radius: 50%;
  color: #888;
  font-size: 11px;
  font-style: normal;
}

.role-recognition-hint {
  margin: -2px 0 8px;
  color: #999;
  font-size: 14px;
  line-height: 1.6;
}

.tabs {
  display: flex;
  background: #fafafa
}

.tabs button {
  flex: 1;
  height: 48px;
  color: #888
}

.tabs button.active {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #ddd;
  color: #333
}

.tabs small {
  font-size: 12px
}

.subtitle-folder {
  border: 1px solid #bbb;
  padding: 14px;
  text-align: center;
  margin-top: 4px;
  cursor: pointer
}

.subtitle-folder span {
  color: #2878ff
}

.subtitle-folder p {
  color: #999;
  font-size: 12px
}

.estimate {
  text-align: center;
  margin-top: 30px
}

.estimate b {
  color: #ff7a00;
  margin-left: 8px
}

.submit {
  width: 100%;
  height: 48px;
  background: #ed6200;
  color: #fff;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 18px
}

.submit:disabled {
  opacity: .45
}

@media(max-width: 1100px) {
  .workspace {
    grid-template-columns:210px 1fr
  }
  .workspace--empty {
    grid-template-columns:210px 1fr
  }
  .settings {
    grid-column: 1/-1
  }
}

@media(max-width: 800px) {
  .workspace, .workspace--empty {
    grid-template-columns:1fr
  }
  .settings {
    grid-column: auto
  }
}
.subtitle-tabs {
  overflow: hidden;
}
</style>
