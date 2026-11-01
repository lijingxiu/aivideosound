<template>
  <div>
    <button type="button" class="voice-trigger" @click="openLibrary">
      <span v-if="selectedSpeaker">已选音色：{{ selectedSpeaker.name }}</span>
      <span v-else>选择音色库</span>
      <span aria-hidden="true">›</span>
    </button>
    <div v-if="visible" class="voice-mask" @click.self="close">
      <section class="voice-dialog" role="dialog" aria-modal="true" aria-label="选择音色库">
        <header class="dialog-head"><strong>选择音色库</strong><button type="button" aria-label="关闭" @click="close">×</button></header>
        <div class="dialog-content">
          <nav class="voice-tabs"><button :class="{active: tab === 'all'}" @click="changeTab('all')">系统音色</button><button :class="{active: tab === 'fav'}" @click="changeTab('fav')">收藏音色</button></nav>
          <div class="filter-head"><span>已为您筛选支持「{{ languageName || languageId || '目标语言' }}」的AI音色</span><label><input v-model="withMulti" type="checkbox" @change="loadList">叠加显示支持多语种的音色 <i title="仅显示支持多语种的音色">i</i></label></div>
          <div class="filters"><input v-model="keyword" placeholder="输入关键词搜索" @input="searchDebounced"><select v-model="gender" @change="loadList"><option value="">全部性别</option><option value="1">男</option><option value="2">女</option></select><select v-model="age" @change="loadList"><option value="">全部年龄</option><option value="1">少年</option><option value="2">青年</option><option value="3">中年</option><option value="4">老年</option></select></div>
          <div class="speaker-list" @scroll="handleScroll">
            <article v-for="speaker in speakers" :key="speaker.id" class="speaker-card">
              <button class="avatar" type="button" :aria-label="`试听${speaker.name}`" @click="toggleAudio(speaker)"><img v-if="speaker.headUrl" :src="speaker.headUrl" :alt="speaker.name"><span v-else>♫</span><i>{{ playingId === speaker.id ? 'Ⅱ' : '▶' }}</i></button>
              <div class="speaker-info"><div class="speaker-title">{{ speaker.name }} <span v-if="speaker.language" class="tag language">{{ speaker.language }}</span><span v-if="speaker.isMulti" class="tag multi">多语种</span></div><p>{{ speaker.descr || '暂无描述' }}</p></div>
              <span class="tag demographic">{{ speaker.gender === 1 ? '男' : speaker.gender === 2 ? '女' : '—' }}</span><span class="tag demographic">{{ ageLabel(speaker.age) }}</span>
              <button class="favorite" :class="{favorited: speaker.isFavorite}" :aria-label="speaker.isFavorite ? '取消收藏' : '收藏'" @click="toggleFavorite(speaker)">{{ speaker.isFavorite ? '★' : '☆' }}</button>
              <button class="use-button" :class="{'is-selected': selectedSpeaker && selectedSpeaker.id === speaker.id}" @click="selectSpeaker(speaker)">{{ selectedSpeaker && selectedSpeaker.id === speaker.id ? '使用中' : '使用' }}</button>
            </article>
            <div v-if="loading" class="list-state">加载中…</div><div v-else-if="!speakers.length" class="list-state">暂无符合条件的音色</div>
          </div>
        </div>
      </section>
    </div>
    <audio ref="audio" @ended="playingId = null" @pause="playingId = null"></audio>
  </div>
</template>
<script>
import { request } from '@/api/request'
import { getProjectToken } from '@/api/project'

export default {
  name: 'AiVoiceLibrary',
  props: { languageId: { type: [String, Number], default: '' }, languageName: { type: String, default: '' }, value: { type: Object, default: null } },
  data: () => ({ visible: false, tab: 'all', speakers: [], selectedSpeaker: null, keyword: '', gender: '', age: '', withMulti: false, loading: false, playingId: null, searchTimer: null, requestId: 0 }),
  watch: {
    value: { immediate: true, handler(value) { this.selectedSpeaker = value || null } },
    languageId() { this.speakers = []; this.selectedSpeaker = null; this.$emit('input', null); if (this.visible) this.loadList() }
  },
  beforeDestroy() { clearTimeout(this.searchTimer); this.$refs.audio?.pause() },
  methods: {
    openLibrary() {
      if (!this.languageId) {
        this.$message?.warning('请先选择目标语言')
        return
      }
      this.visible = true
      this.speakers = []
      this.loadList()
    },
    close() { this.visible = false; this.$refs.audio?.pause() },
    changeTab(tab) { if (this.tab !== tab) { this.tab = tab; this.speakers = []; this.loadList() } },
    searchDebounced() { clearTimeout(this.searchTimer); this.searchTimer = setTimeout(() => { this.speakers = []; this.loadList() }, 300) },
    async loadList() {
      if (!this.languageId) { this.speakers = []; return }
      const requestId = ++this.requestId
      this.loading = true
      const params = new URLSearchParams({ token: getProjectToken(), langId: String(this.languageId), withMulti: this.withMulti ? '1' : '0', gender: this.gender, age: this.age, keyword: this.keyword })
      try {
        const response = await request(`/Speaker${this.tab === 'fav' ? 'Fav' : ''}/GetList?${params.toString()}`)
        if (requestId !== this.requestId) return
        this.speakers = (response?.data?.list || response?.list || []).map(item => ({ ...item, isFavorite: this.tab === 'fav' || !!item.isFavorite }))
      } catch (error) { if (requestId === this.requestId) { this.speakers = []; this.$message?.error(error.message || '获取音色列表失败') } }
      finally { if (requestId === this.requestId) this.loading = false }
    },
    async toggleFavorite(speaker) {
      try {
        const params = `?token=${encodeURIComponent(getProjectToken())}`
        if (speaker.isFavorite) await request(`/SpeakerFav/Delete${params}`, { method: 'POST', body: JSON.stringify({ id: speaker.favId || speaker.favoriteId || speaker.id }) })
        else await request(`/SpeakerFav/Add${params}`, { method: 'POST', body: JSON.stringify({ speakerId: speaker.id }) })
        if (this.tab === 'fav' && speaker.isFavorite) this.speakers = this.speakers.filter(item => item.id !== speaker.id)
        else this.$set(speaker, 'isFavorite', !speaker.isFavorite)
      } catch (error) { this.$message?.error(error.message || '收藏操作失败') }
    },
    toggleAudio(speaker) {
      const audio = this.$refs.audio
      if (!speaker.auditionUrl) return this.$message?.warning('该音色暂无试听')
      if (this.playingId === speaker.id) { audio.pause(); this.playingId = null; return }
      audio.src = speaker.auditionUrl; audio.play().then(() => { this.playingId = speaker.id }).catch(() => this.$message?.warning('试听播放失败'))
    },
    selectSpeaker(speaker) { this.selectedSpeaker = speaker; this.$emit('input', speaker); this.$emit('select', speaker) },
    ageLabel(age) { return ({ 1: '少年', 2: '青年', 3: '中年', 4: '老年' })[age] || '—' },
    handleScroll(event) { const el = event.target; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40 && !this.loading && this.speakers.length) this.loadList() }
  }
}
</script>
<style scoped lang="scss">
.voice-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #e4e4e4;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #ed6200;
    color: #ed6200;
  }
}

.voice-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, .45);
}

.voice-dialog {
  display: flex;
  flex-direction: column;
  width: min(940px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
  overflow: hidden;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  font-size: 15px;

  button {
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: #999;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      color: #666;
    }
  }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 20px 18px;
}

.voice-tabs {
  display: flex;
  width: max-content;
  margin-bottom: 12px;
  padding: 3px;
  background: #f5f5f5;
  border-radius: 6px;

  button {
    padding: 5px 18px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #888;
    font-size: 13px;
    cursor: pointer;
    transition: all .15s;

    &.active {
      background: #fff;
      color: #ed6200;
      box-shadow: 0 1px 4px rgba(0, 0, 0, .1);
    }
  }
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #ed6200;
  font-size: 13px;

  label {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #666;
    font-size: 12px;
    cursor: pointer;
  }

  input[type='checkbox'] {
    width: 13px;
    height: 13px;
    margin: 0;
    accent-color: #ed6200;
    cursor: pointer;
  }

  i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: 1px solid #bbb;
    border-radius: 50%;
    color: #999;
    font-size: 10px;
    font-style: normal;
    cursor: help;
  }
}

.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;

  input,
  select {
    box-sizing: border-box;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #e4e4e4;
    border-radius: 4px;
    outline: none;
    background: #fff;
    color: #555;
    font: inherit;
    font-size: 13px;
    transition: border-color .15s;

    &:focus {
      border-color: #ed6200;
    }

    &::placeholder {
      color: #b5b5b5;
    }
  }

  select {
    padding-right: 6px;
    cursor: pointer;
  }
}

.speaker-list {
  min-height: 0;
  max-height: min(56vh, 520px);
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.speaker-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 10px 12px;
  border-bottom: 1px solid #f2f2f2;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: #fafafa;
  }
}

.avatar {
  position: relative;
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: #f0f0f0;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  > span {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: #c4c4c4;
    font-size: 24px;
  }

  i {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 14px;
    font-style: normal;
    text-shadow: 0 1px 3px rgba(0, 0, 0, .45);
    background: rgba(0, 0, 0, .12);
    transition: background .15s;
  }

  &:hover i {
    background: rgba(0, 0, 0, .3);
  }
}

.speaker-info {
  flex: 1;
  min-width: 0;
}

.speaker-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  color: #222;
  font-size: 14px;
  font-weight: 500;
}

.speaker-info p {
  margin: 5px 0 0;
  overflow: hidden;
  color: #999;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 2px;
  background: #f2f3f5;
  color: #666;
  font-size: 12px;
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
}

.language {
  min-width: 72px;
}

.multi {
  background: #ed6200;
  color: #fff;
}

.demographic {
  min-width: 22px;
  padding: 3px 8px;
}

.favorite {
  width: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #bbb;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: color .15s;

  &:hover {
    color: #ed6200;
  }

  &.favorited {
    color: #ed6200;
  }
}

.use-button {
  min-width: 62px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    border-color: #ed6200;
    color: #ed6200;
  }

  &.is-selected {
    border-color: #ed6200;
    color: #ed6200;
    background: #fff7f0;
  }
}

.list-state {
  padding: 28px;
  color: #999;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 680px) {
  .dialog-content {
    padding: 10px;
  }

  .filter-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filters {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .speaker-card {
    gap: 8px;
    flex-wrap: wrap;
  }

  .avatar {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
  }

  .speaker-info {
    min-width: calc(100% - 60px);
  }

  .speaker-card > .demographic {
    display: none;
  }
}
</style>