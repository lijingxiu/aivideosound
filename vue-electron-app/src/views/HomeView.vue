<template>
  <AppLayout>
    <div class="project-page">
      <div class="toolbar">
        <div class="search-box">
          <AppIcon name="search" :size="16" color="#ccc" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="输入名称查找"
            class="search-box__input"
          />
        </div>
        <button class="btn-add" @click="$router.push({ name: 'new-project' })">
          <AppIcon name="plus" :size="16" color="#fff" />
          新增项目
        </button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in filteredProjects" :key="project.id">
              <td>
                <div class="project-name">
                  <AppIcon name="folder" :size="18" color="#ff7a00" />
                  <a href="#" class="project-name__link">{{ project.name }}</a>
                </div>
              </td>
              <td>{{ project.sourceLang }}</td>
              <td>{{ project.materialCount }}</td>
              <td>
                <span class="status-tag" :class="project.vocalSeparation ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.vocalSeparation ? '开启' : '关闭' }}
                </span>
              </td>
              <td>{{ project.subtitleSource }}</td>
              <td>
                <span class="status-tag" :class="project.characterRecognition ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.characterRecognition ? '开启' : '关闭' }}
                </span>
              </td>
              <td>
                <span class="status-tag" :class="project.subtitleErase ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.subtitleErase ? '开启' : '关闭' }}
                </span>
              </td>
              <td>{{ project.validDays }}天</td>
              <td class="cell-remark">{{ project.remark || '-' }}</td>
              <td class="cell-time">{{ project.createdAt }}</td>
              <td>
                <div class="cell-actions">
                  <a href="#" class="action-enter" @click.prevent="$router.push({ name: 'project-detail', params: { id: project.id } })">进入</a>
                  <button class="action-more">
                    <AppIcon name="more" :size="16" color="#999" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProjects.length === 0">
              <td :colspan="columns.length" class="empty-row">暂无匹配项目</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button class="pagination__btn" :disabled="currentPage <= 1" @click="currentPage--">-</button>
        <span class="pagination__current">{{ currentPage }}</span>
        <button class="pagination__btn" :disabled="currentPage >= totalPages" @click="currentPage++">+</button>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const MOCK_PROJECTS = [
  {
    id: 1,
    name: '古装',
    sourceLang: '中文',
    materialCount: 12,
    vocalSeparation: true,
    subtitleSource: '语音识别',
    characterRecognition: true,
    subtitleErase: false,
    validDays: 27,
    remark: '',
    createdAt: '2026-10-32 12:22'
  },
  {
    id: 2,
    name: 'XXXX',
    sourceLang: 'English',
    materialCount: 5,
    vocalSeparation: false,
    subtitleSource: '画面识别',
    characterRecognition: false,
    subtitleErase: true,
    validDays: 15,
    remark: '测试项目',
    createdAt: '2026-10-28 09:15'
  },
  {
    id: 3,
    name: '纪录片系列',
    sourceLang: '中文',
    materialCount: 28,
    vocalSeparation: true,
    subtitleSource: '上传字幕',
    characterRecognition: true,
    subtitleErase: true,
    validDays: 45,
    remark: '多语言版本',
    createdAt: '2026-10-20 16:40'
  }
]

export default {
  name: 'HomeView',
  components: { AppLayout, AppIcon },
  data() {
    return {
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      columns: [
        { key: 'name', label: '项目名称', width: '140px' },
        { key: 'sourceLang', label: '源语言', width: '80px' },
        { key: 'materialCount', label: '素材数量', width: '80px' },
        { key: 'vocalSeparation', label: '人声背景音分离', width: '120px' },
        { key: 'subtitleSource', label: '字幕来源', width: '100px' },
        { key: 'characterRecognition', label: '角色识别', width: '80px' },
        { key: 'subtitleErase', label: '字幕擦除', width: '80px' },
        { key: 'validDays', label: '有效期剩余', width: '90px' },
        { key: 'remark', label: '备注', width: '100px' },
        { key: 'createdAt', label: '创建时间', width: '140px' },
        { key: 'actions', label: '操作', width: '90px' }
      ],
      projects: MOCK_PROJECTS
    }
  },
  computed: {
    filteredProjects() {
      const kw = this.searchKeyword.trim().toLowerCase()
      const list = kw
        ? this.projects.filter(p => p.name.toLowerCase().includes(kw))
        : this.projects
      const start = (this.currentPage - 1) * this.pageSize
      return list.slice(start, start + this.pageSize)
    },
    totalPages() {
      const kw = this.searchKeyword.trim().toLowerCase()
      const total = kw
        ? this.projects.filter(p => p.name.toLowerCase().includes(kw)).length
        : this.projects.length
      return Math.max(1, Math.ceil(total / this.pageSize))
    }
  },
  watch: {
    searchKeyword() {
      this.currentPage = 1
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #ff7a00;
$border: #eee;

.project-page {
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
  background: #fff;

  &:focus-within {
    border-color: $primary;
  }

  &__input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;

    &::placeholder {
      color: #ccc;
    }
  }
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 20px;
  background: $primary;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background: #ff8f26;
  }
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

  thead {
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 1;

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 500;
      color: #666;
      border-bottom: 1px solid $border;
    }
  }

  tbody {
    tr {
      transition: background 0.15s;

      &:hover {
        background: #fafafa;
      }
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f5f5f5;
      color: #333;
    }
  }
}

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;

  &__link {
    color: $primary;

    &:hover {
      text-decoration: underline;
    }
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;

  &--on {
    color: #52c41a;
    background: #f6ffed;
  }

  &--off {
    color: #999;
    background: #f5f5f5;
  }
}

.cell-remark {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-time {
  color: #666;
  font-size: 12px;
}

.cell-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-enter {
  color: $primary;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
}

.action-more {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background: #f0f0f0;
  }
}

.empty-row {
  text-align: center;
  color: #999;
  padding: 40px !important;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 4px;

  &__btn {
    width: 32px;
    height: 32px;
    border: 1px solid $border;
    border-radius: 4px;
    font-size: 16px;
    color: #666;
    background: #fff;

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__current {
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $primary;
    border-radius: 4px;
    color: $primary;
    font-size: 13px;
  }
}
</style>
