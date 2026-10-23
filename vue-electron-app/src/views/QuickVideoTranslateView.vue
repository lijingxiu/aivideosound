<template>
  <AppLayout>
    <div class="quick-translate-page">
      <div class="toolbar">
        <div class="search-box">
          <AppIcon name="search" :size="16" color="#aaa" />
          <input v-model="searchKeyword" type="text" placeholder="输入项目名称搜索" />
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
            <tr v-for="project in filteredProjects" :key="project.name">
              <td><div class="project-name"><AppIcon name="folder" :size="18" color="#ff7a00" />{{ project.name }}</div></td>
              <td>{{ project.sourceLanguage }}</td>
              <td>{{ project.targetLanguage }}</td>
              <td>{{ project.materialCount }}</td>
              <td>{{ project.translation }}</td>
              <td>{{ project.voiceover }}</td>
              <td>{{ project.backgroundRemoval }}</td>
              <td>{{ project.subtitleErasure }}</td>
              <td>{{ project.remaining }}</td>
              <td>{{ project.remark || '-' }}</td>
              <td>{{ project.createdAt }}</td>
              <td><a class="action-enter" href="#" @click.prevent="notifyComingSoon">进入</a></td>
            </tr>
            <tr v-if="filteredProjects.length === 0">
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

export default {
  name: 'QuickVideoTranslateView',
  components: { AppLayout, AppIcon },
  data() {
    return {
      searchKeyword: '',
      projects: [],
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
        { key: 'remark', label: '备注' },
        { key: 'createdAt', label: '创建时间' },
        { key: 'actions', label: '操作' }
      ]
    }
  },
  computed: {
    filteredProjects() {
      const keyword = this.searchKeyword.trim().toLowerCase()
      if (!keyword) return this.projects
      return this.projects.filter(project => project.name.toLowerCase().includes(keyword))
    }
  },
  methods: {
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
