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
              <td>{{ project.langName || '-' }}</td>
              <td>{{ project.videoNum ?? 0 }}</td>
              <td>
                <span class="status-tag" :class="project.separateType === 1 ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.separateType === 1 ? '开启' : '关闭' }}
                </span>
              </td>
              <td>{{ subtitleSourceName(project.subtitleType) }}</td>
              <td>
                <span class="status-tag" :class="project.roleType === 1 ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.roleType === 1 ? '开启' : '关闭' }}
                </span>
              </td>
              <td>
                <span class="status-tag" :class="project.eraseType === 1 ? 'status-tag--on' : 'status-tag--off'">
                  {{ project.eraseType === 1 ? '开启' : '关闭' }}
                </span>
              </td>
              <td>{{ formatRemainDays(project.expireTime) }}</td>
              <td>
                <div class="cell-actions">
                  <a href="#" class="action-enter" @click.prevent="$router.push({ name: 'project-detail', params: { id: project.id }, query: { name: project.name, expireTime: project.expireTime } })">进入</a>
                  <div class="more-wrap">
                    <button class="action-more" @click.stop="toggleMenu(project.id)">
                      <AppIcon name="more" :size="16" color="#999" />
                    </button>
                    <div v-show="openMenuId === project.id" class="more-popover" @click.stop>
                      <button class="more-popover__item" @click="handleEdit(project)">编辑</button>
                      <button class="more-popover__item more-popover__item--danger" @click="handleDelete(project)">删除</button>
                    </div>
                  </div>
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
        <button class="pagination__btn" :disabled="!hasNextPage || loading" @click="currentPage++">+</button>
      </div>
    </div>
  </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { fetchProjectList, deleteProject } from '@/api/project'

const SUBTITLE_SOURCE_NAMES = {
  1: '语音识别',
  2: '画面识别',
  3: '上传字幕'
}

export default {
  name: 'HomeView',
  components: { AppLayout, AppIcon },
  data() {
    return {
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      projects: [],
      hasNextPage: false,
      loading: false,
      searchTimer: null,
      openMenuId: null,
      columns: [
        { key: 'name', label: '项目名称', width: '140px' },
        { key: 'langName', label: '源语言', width: '80px' },
        { key: 'videoNum', label: '素材数量', width: '80px' },
        { key: 'separateType', label: '人声背景音分离', width: '120px' },
        { key: 'subtitleType', label: '字幕来源', width: '100px' },
        { key: 'roleType', label: '角色识别', width: '80px' },
        { key: 'eraseType', label: '字幕擦除', width: '80px' },
        { key: 'validDays', label: '有效期剩余', width: '140px' },
        { key: 'actions', label: '操作', width: '90px' }
      ]
    }
  },
  computed: {
    filteredProjects() {
      return this.projects
    }
  },
  created() {
    this.loadProjects()
  },
  mounted() {
    document.addEventListener('click', this.closeMenu)
  },
  beforeDestroy() {
    clearTimeout(this.searchTimer)
    document.removeEventListener('click', this.closeMenu)
  },
  methods: {
    toggleMenu(id) {
      this.openMenuId = this.openMenuId === id ? null : id
    },
    closeMenu() {
      this.openMenuId = null
    },
    handleEdit(project) {
      this.openMenuId = null
      this.$router.push({ name: 'new-project', query: { id: project.id } })
    },
    handleDelete(project) {
      this.openMenuId = null
      this.$confirm(`确定删除项目「${project.name}」吗？删除后不可恢复。`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        await deleteProject(project.id)
        this.$message.success('删除成功')
        if (this.projects.length === 1 && this.currentPage > 1) {
          this.currentPage--
        } else {
          this.projects = this.projects.filter(p => p.id !== project.id)
          this.loadProjects()
        }
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        console.error('删除项目失败', err)
        this.$message.error('删除失败，请稍后重试')
      })
    },
    async loadProjects() {
      this.loading = true
      try {
        const response = await fetchProjectList({
          pageOffset: this.currentPage - 1,
          pageLimit: this.pageSize,
          name: this.searchKeyword.trim()
        })
        const list = response?.data?.data?.list || response?.data?.list || response?.list || []
        this.projects = list
        const recordCount = response?.data?.page?.recordCount ?? response?.page?.recordCount
        if (typeof recordCount === 'number') {
          this.hasNextPage = this.currentPage * this.pageSize < recordCount
        } else {
          this.hasNextPage = list.length === this.pageSize
        }
      } catch (error) {
        this.projects = []
        this.hasNextPage = false
        console.error('获取项目列表失败', error)
      } finally {
        this.loading = false
      }
    },
    subtitleSourceName(type) {
      return SUBTITLE_SOURCE_NAMES[type] || '-'
    },
    formatRemainDays(value) {
      if (!value) return '-'
      const expire = new Date(value)
      if (Number.isNaN(expire.getTime())) return '-'
      const diffDays = Math.ceil((expire.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      if (diffDays < 0) return '已过期'
      if (diffDays === 0) return '今天到期'
      return `剩余 ${diffDays} 天`
    }
  },
  watch: {
    currentPage() {
      this.loadProjects()
    },
    searchKeyword() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        if (this.currentPage === 1) {
          this.loadProjects()
        } else {
          this.currentPage = 1
        }
      }, 300)
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

.cell-time {
  color: #666;
  font-size: 12px;
}

.cell-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: visible;
}

.more-wrap {
  position: relative;
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

.more-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 96px;
  padding: 4px;
  background: #fff;
  border: 1px solid $border;
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);

  &__item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    font-size: 13px;
    color: #333;
    border-radius: 4px;

    &:hover {
      background: #f5f5f5;
    }

    &--danger {
      color: #ff4d4f;

      &:hover {
        background: #fff1f0;
      }
    }
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
