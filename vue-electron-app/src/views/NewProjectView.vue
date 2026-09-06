<template>
  <div class="new-project">
    <div class="page-head" @click="$router.back()">
      <button class="back" aria-label="返回" title="返回">‹</button>
      <h2>新增项目</h2>
    </div>
    <input ref="videoPicker" type="file" multiple accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.flv,.ts" hidden
           @change="addVideos([...$event.target.files])">
    <div class="workspace" :class="{ 'workspace--empty': !videos.length }">
      <VideoUploadArea v-if="!videos.length" @select="addVideos"/>
      <VideoListPanel v-else :videos="videos" :active-id="activeId" @upload="openVideoPicker"
                      @select="activeId = $event" @remove="removeVideo"/>
      <VideoPreview v-if="videos.length" :video="activeVideo"
                    :show-select-box="subtitleSource === 'ocr' || subtitleErase" v-model:region="region"/>
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
          <el-tabs v-model="subtitleSource" type="border-card" class="subtitle-tabs">
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
import {validateVideoFile, naturalSort} from '@/utils/videoValidator';
import {calcTotalPoints} from '@/utils/pointsCalculator';
import {fetchProjectInfo, fetchUserPoints, submitProjectTask} from '@/api/project'

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
    async loadProjectInfo() {
      try {
        const response = await fetchProjectInfo()
        this.projectInfo = response.data
        this.languages = response.data?.languageList || []
      } catch (error) {
        console.error('获取项目配置失败', error)
      }
    },
    openVideoPicker() {
      this.$refs.videoPicker?.click()
    },
    addVideos(files) {
      if (this.videos.length + files.length > MAX_VIDEO_COUNT) return alert('单次任务不能超过100个视频');
      const next = files.map((f, i) => {
        const e = validateVideoFile(f);
        if (e.length) {
          alert(`${f.name}${e.join('，')}，请检查修改`);
          return null
        }
        return {
          id: `${Date.now()}-${i}`,
          name: f.name,
          size: f.size,
          duration: f.duration || 0,
          objectUrl: URL.createObjectURL(f),
          file: f
        }
      }).filter(Boolean);
      this.videos = [...this.videos, ...next].sort(naturalSort);
      if (!this.activeId) this.activeId = this.videos[0]?.id || ''
    }, removeVideo(id) {
      this.videos = this.videos.filter(v => v.id !== id);
      this.activeId = this.videos[0]?.id || ''
    }, openSubtitlePicker() {
      this.$refs.subtitleInput.click()
    }, selectSubtitleFolder(e) {
      this.subtitleFiles = [...e.target.files];
      this.subtitleFolder = this.subtitleFiles[0]?.webkitRelativePath?.split('/')[0] || '已选择字幕文件夹'
    }, async submit() {
      if (!this.projectName) return alert('请输入项目名称');
      if (!this.sourceLanguage) return alert('请选择源语言');
      if (this.subtitleSource === 'upload' && !this.subtitleFiles.length) return alert('请选择字幕文件所在位置');
      try {
        const r = await fetchUserPoints();
        const points = Number(r?.points ?? r?.data?.points ?? this.$store.state.user?.points ?? 0);
        if (points < this.totalPoints) return alert('您的积分不足，无法提交此任务');
        this.submitting = true;
        this.step = 0;
        await new Promise(r => setTimeout(r, 500));
        this.step = 1;
        await new Promise(r => setTimeout(r, 500));
        this.step = 2;
        await submitProjectTask({
          projectName: this.projectName,
          sourceLanguage: this.sourceLanguage,
          subtitleSource: this.subtitleSource,
          videos: this.videos.map(v => ({name: v.name, duration: v.duration})),
          roleRecognition: this.roleRecognition,
          vocalSeparation: this.vocalSeparation,
          subtitleErase: this.subtitleErase,
          region: this.region
        });
        this.status = 'done';
        setTimeout(() => this.$router.push({name: 'home'}), 700)
      } catch (e) {
        this.submitting = false;
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
}</style>
