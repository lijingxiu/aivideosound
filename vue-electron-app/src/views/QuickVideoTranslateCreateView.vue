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
        <label class="project-name-row">项目名称
          <el-input v-model.trim="projectName" maxlength="20" placeholder="请输入"
                    class="project-name-input"></el-input>
          <em>{{ projectName.length }}/20</em></label>
        <div class="language-row">
          <label>源语言
            <el-select v-model="sourceLanguage" placeholder="请选择" class="language-select">
              <el-option v-for="l in languages" :key="l.code" :label="l.name" :value="l.code"/>
            </el-select>
          </label>
          <label>目标语言
            <el-select v-model="targetLanguage" placeholder="请选择" class="language-select">
              <el-option v-for="l in languages" :key="l.code" :label="l.name" :value="l.code"/>
            </el-select>
          </label>
        </div>
        <div class="setting-block">
          <div>翻译设置</div>
          <el-tabs v-model="subtitleSource" type="border-card" class="subtitle-tabs">
            <el-tab-pane v-for="s in subtitleSources" :key="s.value" :name="s.value">
              <span slot="label">
                <el-tooltip :content="s.tooltip" placement="top">
                  <span>{{ s.label }}<small v-if="s.tag">（{{ s.tag }}）</small></span>
                </el-tooltip>
              </span>
              <div class="segment-settings">
                <TranslationDictionary :source-language="sourceLanguage" :target-language="targetLanguage" :languages="languages"/>
              </div>
              <div v-if="subtitleSource === 'upload'" class="subtitle-upload-panel">
                <div class="subtitle-folder" @click="openSubtitlePicker">
                  <input
                    ref="subtitleInput" type="file" multiple hidden accept=".srt"
                    @change="selectSubtitleFolder"><strong>请选择<span>字幕文件</span>（可多选，仅支持 srt）</strong>
                  <p>{{ subtitleFolder || '系统会自动匹配与视频文件同名的srt字幕文件' }}</p>
                </div>
                <div v-if="subtitleFiles.length" class="subtitle-selection">
                  <div class="subtitle-selection__head">
                    <span>已选择字幕（{{ subtitleFiles.length }}）</span>
                    <button type="button" class="text-button" @click="showSubtitleMatches">查看匹配列表</button>
                  </div>
                  <div class="subtitle-file-list">
                    <button v-for="file in subtitleFiles" :key="file.name + file.size" type="button"
                            class="subtitle-file" :class="{ 'subtitle-file--active': selectedSubtitleName === file.name }"
                            @click="previewSubtitle(file)">
                      <span class="subtitle-file__name">{{ file.name }}</span>
                      <span class="subtitle-file__action">查看</span>
                    </button>
                  </div>
                </div>
              </div>


            </el-tab-pane>
          </el-tabs>
        </div>
        <div class="setting-block dubbing-block">
          <div class="dubbing-title">配音设置 <el-switch v-model="dubbingEnabled" active-color="#ed6200" inactive-color="#d9d9d9"/></div>
          <el-tabs v-model="dubbingTab" type="border-card" class="subtitle-tabs">
            <el-tab-pane label="原声克隆" name="clone">
              <div class="segment-setting-row"><span>视频时长动态调整 <el-tooltip content="开启后，将适当延长视频时长，以达到最佳配音效果" placement="top"><i class="setting-info">i</i></el-tooltip></span><el-switch v-model="durationAdjust" active-color="#ed6200"/></div>
              <div class="segment-setting-row"><span>译文字幕时间戳动态调整 <el-tooltip content="开启后，将适当调整译文字幕时间戳信息，均衡配音语速，以达到最佳配音效果" placement="top"><i class="setting-info">i</i></el-tooltip></span><el-switch v-model="timestampAdjust" active-color="#ed6200"/></div>
              <div class="segment-setting-row"><span>去除背景音 <el-tooltip content="生成翻译视频时是否要去除源视频中的音效和背景音乐" placement="top"><i class="setting-info">i</i></el-tooltip></span><el-radio-group v-model="backgroundAudio"><el-radio label="keep">不去除</el-radio><el-radio label="music">仅去除背景音</el-radio><el-radio label="all">去除背景音及音效</el-radio></el-radio-group></div>
              <div class="segment-setting-row"><span>源字幕擦除</span><el-switch v-model="subtitleErase" active-color="#ed6200"/></div>
              <div class="segment-setting-row"><span>新字幕压制</span><el-switch v-model="burnSubtitle" active-color="#ed6200"/></div>
              <SubtitleBurnSettings v-if="burnSubtitle"/>
            </el-tab-pane>
            <el-tab-pane label="AI音色库" name="library"><AiVoiceLibrary/></el-tab-pane>
          </el-tabs>
        </div>
        <div class="estimate">积分消耗预估：<b>{{ totalPoints || '--' }}</b></div>
        <button class="submit" :disabled="!videos.length" @click="submit">提交</button>
      </section>
    </div>
    <SubmitProgressModal :visible="submitting" :current-step="step" :step-status="status"/>
    <div v-if="subtitleMatchVisible" class="custom-modal-mask" @click.self="subtitleMatchVisible = false">
      <div class="custom-modal">
        <div class="custom-modal-head">
          <span>字幕匹配列表</span>
          <button type="button" class="custom-modal-close" @click="subtitleMatchVisible = false">✕</button>
        </div>
        <div class="custom-modal-body">
          <div class="match-summary">已按照“字幕文件名与视频文件名（不含扩展名）相同”的规则进行匹配</div>
          <div class="match-list">
            <div v-for="item in subtitleMatchList" :key="item.video.id" class="match-row">
              <span class="match-video" :title="item.video.name">{{ item.video.name }}</span>
              <span v-if="item.subtitle" class="match-subtitle" :title="item.subtitle.name">{{ item.subtitle.name }}</span>
              <span v-else class="match-missing">未找到同名字幕</span>
              <button v-if="item.subtitle" type="button" class="text-button" @click="previewSubtitle(item.subtitle)">查看</button>
            </div>
            <div v-if="!subtitleMatchList.length" class="empty-match">请先上传视频</div>
          </div>
        </div>
        <div class="custom-modal-foot">
          <span class="match-count">已匹配 {{ matchedSubtitleCount }}/{{ videos.length }} 个视频</span>
          <el-button @click="subtitleMatchVisible = false">关闭</el-button>
        </div>
      </div>
    </div>
    <div v-if="subtitlePreviewVisible" class="custom-modal-mask custom-modal-mask--inner" @click.self="subtitlePreviewVisible = false">
      <div class="custom-modal">
        <div class="custom-modal-head">
          <span>{{ selectedSubtitleName || '字幕预览' }}</span>
          <button type="button" class="custom-modal-close" @click="subtitlePreviewVisible = false">✕</button>
        </div>
        <div class="custom-modal-body">
          <pre class="subtitle-preview">{{ selectedSubtitleContent || '暂无字幕内容' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import AppTooltip from '@/components/common/AppTooltip.vue';
import VideoUploadArea from '@/components/project/VideoUploadArea.vue';
import VideoListPanel from '@/components/project/VideoListPanel.vue';
import VideoPreview from '@/components/project/VideoPreview.vue';
import SubmitProgressModal from '@/components/project/SubmitProgressModal.vue';
import TranslationDictionary from '@/components/project/TranslationDictionary.vue';
import SubtitleBurnSettings from '@/components/project/SubtitleBurnSettings.vue';
import AiVoiceLibrary from '@/components/project/AiVoiceLibrary.vue';
import {SUBTITLE_SOURCES, MAX_VIDEO_COUNT} from '@/constants/project';
import {validateVideoFile, naturalSort, getFileExt, getBaseName} from '@/utils/videoValidator';
import {calcTotalPoints} from '@/utils/pointsCalculator';
import {fetchProjectInfo, getOriginalUploadPolicy, submitProjectTask} from '@/api/project'

export default {
  components: {AppTooltip, VideoUploadArea, VideoListPanel, VideoPreview, SubmitProgressModal, TranslationDictionary, SubtitleBurnSettings, AiVoiceLibrary},
  data: () => ({
    projectName: '',
    sourceLanguage: '',
    targetLanguage: '',
    subtitleSource: 'asr',
    dubbingEnabled: true,
    dubbingTab: 'clone',
    durationAdjust: false,
    timestampAdjust: true,
    backgroundAudio: 'keep',
    burnSubtitle: true,
    roleRecognition: true,
    vocalSeparation: true,
    subtitleErase: false,
    videos: [],
    activeId: '',
    subtitleFolder: '',
    subtitleFiles: [],
    selectedSubtitleName: '',
    selectedSubtitleContent: '',
    subtitleMatchVisible: false,
    subtitlePreviewVisible: false,
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
    },
    subtitleMatchList() {
      return this.videos.map(video => ({
        video,
        subtitle: this.subtitleFiles.find(file => getBaseName(file.name).toLowerCase() === getBaseName(video.name).toLowerCase())
      }))
    },
    matchedSubtitleCount() {
      return this.subtitleMatchList.filter(item => item.subtitle).length
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
    async uploadSubtitle(video) {
      const name = getBaseName(video.name).toLowerCase()
      const subtitle = this.subtitleFiles.find(file => getBaseName(file.name).toLowerCase() === name)
      if (!subtitle) return ''
      return this.uploadFileWithPolicy(subtitle, getFileExt(subtitle.name), window.electronAPI?.getFilePath?.(subtitle))
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
      const subtitleInput = this.$refs.subtitleInput
      const picker = Array.isArray(subtitleInput) ? subtitleInput[0] : subtitleInput
      if (picker && typeof picker.click === 'function') {
        picker.click()
      }
    },
    selectSubtitleFolder(e) {
      const picked = [...(e.target.files || [])]
      const ignored = picked.filter(file => !/\.srt$/i.test(file.name)).length
      const srtFiles = picked.filter(file => /\.srt$/i.test(file.name));
      const merged = [...this.subtitleFiles, ...srtFiles].filter((file, index, arr) => arr.findIndex(f => f.name === file.name && f.size === file.size) === index)
      this.subtitleFiles = merged;
      this.subtitleFolder = merged.length ? `已选择 ${merged.length} 个 srt 字幕文件` : ''
      this.selectedSubtitleName = ''
      this.selectedSubtitleContent = ''
      e.target.value = ''
      if (!this.subtitleFiles.length) return alert('所选文件夹中没有 srt 字幕文件，请重新选择')
      if (ignored) alert(`已自动过滤 ${ignored} 个非 srt 文件，仅保留 srt 字幕`)
    },
    showSubtitleMatches() {
      this.subtitleMatchVisible = true
    },
    previewSubtitle(file) {
      this.selectedSubtitleName = file.name
      this.subtitlePreviewVisible = true
      this.selectedSubtitleContent = '正在读取字幕…'
      const reader = new FileReader()
      reader.onload = event => {
        this.selectedSubtitleContent = String(event.target.result || '')
      }
      reader.onerror = () => {
        this.selectedSubtitleContent = '字幕读取失败，请重试'
      }
      reader.readAsText(file)
    },
    async submit() {
      if (!this.projectName) return alert('请输入项目名称');
      if (!this.sourceLanguage) return alert('请选择源语言');
      if (!this.targetLanguage) return alert('请选择目标语言');
      if (this.subtitleSource === 'upload' && !this.subtitleFiles.length) return alert('请选择字幕文件所在位置');
      try {
        // const r = await fetchUserPoints();
        // const points = Number(r?.points ?? r?.data?.points ?? this.$store.state.user?.points ?? 0);
        // if (points < this.totalPoints) return alert('您的积分不足，无法提交此任务');
        this.submitting = true;
        this.status = 'active';
        this.step = 0;
        const originalList = []
        this.step = 1
        for (const video of this.videos) {
          const item = await this.uploadVideo(video)
          if (this.subtitleSource === 'upload') item.srtUrl = await this.uploadSubtitle(video)
          originalList.push(item)
        }

        this.step = 2
        const region = this.region || {}
        await submitProjectTask({
          name: this.projectName,
          langCode: this.sourceLanguage,
          targetLangCode: this.targetLanguage,
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
        })
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
  overflow: hidden
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
  min-height: 0;
  overflow: hidden;
}

.workspace--empty {
  grid-template-columns:minmax(0, 4fr) minmax(0, 3fr)
}

.settings {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 8px 16px 2px;
}

.project-name-row {
  grid-template-columns: 80px minmax(0, 1fr) auto !important;
  column-gap: 6px !important;
}

.project-name-row .project-name-input {
  max-width: 500px;
}

.language-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.language-row label {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  column-gap: 6px;
  min-width: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

.language-row .language-select {
  width: 130px;
  max-width: 100%;
  min-width: 0;
  height: 34px;
}

.language-row ::v-deep .el-input__suffix {
  display: flex;
  align-items: center;
  height: 100%;
}

.language-row ::v-deep .el-input__suffix-inner {
  display: flex;
  align-items: center;
  height: 100%;
}

.language-row ::v-deep .el-select .el-input__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  line-height: normal;
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
  height: 34px !important;
  line-height: 34px !important;
  border-radius: 6px;
}

::v-deep .el-input {
  height: 34px !important;
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

.segment-settings {
  margin-bottom: 8px;
  padding: 2px 4px 4px;
  border-bottom: 1px solid #f0f0f0;
}

.subtitle-upload-panel {
  margin-top: 12px;
}

.subtitle-selection {
  margin-top: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.subtitle-selection__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fafafa;
  color: #555;
  font-size: 13px;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2878ff;
  font-size: 13px;
  cursor: pointer;
}

.subtitle-file-list {
  max-height: 130px;
  overflow-y: auto;
}

.subtitle-file {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border: 0;
  border-top: 1px solid #f3f3f3;
  background: #fff;
  color: #333;
  text-align: left;
  cursor: pointer;
}

.subtitle-file:hover,
.subtitle-file--active {
  background: #fff7f0;
}

.subtitle-file__name,
.match-video,
.match-subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle-file__name {
  max-width: 82%;
}

.subtitle-file__action {
  color: #2878ff;
  font-size: 12px;
}

.match-summary {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  background: #fff7f0;
  color: #8b5a32;
  font-size: 13px;
}

.match-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
}

.match-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr auto;
  gap: 12px;
  align-items: center;
  min-height: 42px;
  padding: 0 12px;
  border-bottom: 1px solid #f2f2f2;
  font-size: 13px;
}

.match-row:last-child {
  border-bottom: 0;
}

.match-subtitle {
  color: #666;
}

.match-missing {
  color: #f56c6c;
}

.match-count {
  float: left;
  color: #888;
  font-size: 13px;
  line-height: 32px;
}

.empty-match {
  padding: 30px;
  color: #999;
  text-align: center;
}

.subtitle-preview {
  max-height: 460px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: 4px;
  background: #f7f7f7;
  color: #333;
  font: 13px/1.7 Consolas, Monaco, monospace;
  white-space: pre-wrap;
  word-break: break-word;
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

.dubbing-block {
  margin-top: 18px;
}

.dubbing-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #333;
  font-size: 14px;
}

.dubbing-block .segment-setting-row {
  min-height: 38px;
  font-size: 13px;
}

.dubbing-block .segment-setting-row > span:first-child {
  white-space: nowrap;
}

.dubbing-block ::v-deep .el-radio {
  margin-right: 8px;
}

.dubbing-block ::v-deep .el-radio__label {
  padding-left: 4px;
  font-size: 12px;
}

.settings ::v-deep .el-radio__input.is-checked .el-radio__inner,
.settings ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  border-color: #ed6200;
  background: #ed6200;
}

.settings ::v-deep .el-radio__input.is-checked + .el-radio__label,
.settings ::v-deep .el-checkbox__input.is-checked + .el-checkbox__label {
  color: #ed6200;
}

.settings ::v-deep .el-tabs__item.is-active,
.settings ::v-deep .el-tabs__item:hover {
  color: #ed6200;
}

.settings ::v-deep .el-tabs__active-bar {
  background-color: #ed6200;
}

::v-deep .subtitle-match-dialog,
::v-deep .subtitle-preview-dialog {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

::v-deep .v-modal {
  background: rgba(0, 0, 0, .5);
}
</style>
<style lang="scss">
.subtitle-match-dialog,
.subtitle-preview-dialog {
  background: #fff !important;
  border-radius: 8px;
  overflow: hidden;
}
.subtitle-match-dialog .el-dialog__body,
.subtitle-preview-dialog .el-dialog__body {
  background: #fff;
}
.custom-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .5);
}
.custom-modal-mask--inner {
  z-index: 10000;
}
.custom-modal {
  width: 620px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, .25);
}
.custom-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}
.custom-modal-close {
  border: 0;
  background: transparent;
  font-size: 16px;
  color: #999;
  cursor: pointer;
}
.custom-modal-body {
  padding: 0 20px 10px;
  overflow-y: auto;
}
.custom-modal-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 18px;
}
.custom-modal-foot .match-count {
  margin-right: auto;
  float: none;
  line-height: 1.5;
}
</style>
