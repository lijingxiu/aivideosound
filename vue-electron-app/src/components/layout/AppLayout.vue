<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar__header">
        <AppLogo />
      </div>

      <nav class="sidebar__nav">
        <div class="nav-group">
          <button class="nav-group__title" @click="toggleGroup('scenarios')">
            <span>应用场景</span>
            <AppIcon
              name="arrow-down"
              :size="12"
              :class="{ 'nav-group__arrow--collapsed': !expanded.scenarios }"
              class="nav-group__arrow"
            />
          </button>
          <ul v-show="expanded.scenarios" class="nav-group__list">
            <li
              v-for="item in scenarioMenus"
              :key="item.key"
              class="nav-item"
              :class="{ 'nav-item--active': activeMenu === item.key }"
              @click="activeMenu = item.key"
            >
              <AppIcon :name="item.icon" :size="16" />
              {{ item.label }}
            </li>
          </ul>
        </div>

        <div class="nav-group">
          <button class="nav-group__title" @click="toggleGroup('tools')">
            <span>应用工具</span>
            <AppIcon
              name="arrow-down"
              :size="12"
              :class="{ 'nav-group__arrow--collapsed': !expanded.tools }"
              class="nav-group__arrow"
            />
          </button>
          <ul v-show="expanded.tools" class="nav-group__list">
            <li
              v-for="item in toolMenus"
              :key="item.key"
              class="nav-item"
              @click="activeMenu = item.key"
            >
              <AppIcon :name="item.icon" :size="16" />
              {{ item.label }}
            </li>
          </ul>
        </div>
      </nav>

      <div class="sidebar__footer">
        <a v-for="item in footerLinks" :key="item.key" href="#" class="footer-link">
          <AppIcon :name="item.icon" :size="16" />
          {{ item.label }}
        </a>
      </div>
    </aside>

    <div class="main-area">
      <header class="top-header">
        <div class="top-header__left">
          <h1 class="top-header__title">{{ pageTitle }}</h1>
          <p class="top-header__subtitle">视频翻译 / 配音 / 压制 一站式解决方案</p>
        </div>
        <div class="top-header__right">
          <button class="btn-outline">使用教程</button>
          <div class="points-badge">
            <AppIcon name="coin" :size="16" color="#ff7a00" />
            积分 {{ userPoints }}
          </div>
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import AppLogo from '@/components/common/AppLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'

export default {
  name: 'AppLayout',
  components: { AppLogo, AppIcon },
  data() {
    return {
      activeMenu: 'video-translate',
      expanded: { scenarios: true, tools: true },
      scenarioMenus: [
        { key: 'video-translate', label: '视频译制', icon: 'video' }
      ],
      toolMenus: [
        { key: 'subtitle-erase', label: '字幕与水印擦除', icon: 'erase' },
        { key: 'voice-separate', label: '人声分离', icon: 'voice' },
        { key: 'video-dedup', label: '视频去重', icon: 'dedup' },
        { key: 'lip-sync', label: '视频对口型', icon: 'lipsync' }
      ],
      footerLinks: [
        { key: 'profile', label: '个人中心', icon: 'user' },
        { key: 'promote', label: '推广赚钱', icon: 'gift' },
        { key: 'contact', label: '联系我们', icon: 'contact' }
      ]
    }
  },
  computed: {
    pageTitle() {
      const all = [...this.scenarioMenus, ...this.toolMenus]
      return all.find(m => m.key === this.activeMenu)?.label || '视频译制'
    },
    userPoints() {
      return this.$store.state.user?.points ?? 0
    }
  },
  methods: {
    toggleGroup(key) {
      this.expanded[key] = !this.expanded[key]
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #ff7a00;
$sidebar-bg: #fafafa;
$border: #eee;

.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: $sidebar-bg;
  border-right: 1px solid $border;

  &__header {
    padding: 20px 16px;
    border-bottom: 1px solid $border;
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid $border;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.nav-group {
  margin-bottom: 4px;

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 16px;
    font-size: 13px;
    color: #999;
    cursor: pointer;

    &:hover {
      color: #666;
    }
  }

  &__arrow {
    transition: transform 0.2s;

    &--collapsed {
      transform: rotate(-90deg);
    }
  }

  &__list {
    padding: 0 8px;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f0f0f0;
  }

  &--active {
    background: #fff3e6;
    color: $primary;
    font-weight: 500;
  }
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  font-size: 13px;
  color: #666;
  border-radius: 4px;

  &:hover {
    color: $primary;
    background: #f5f5f5;
  }
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #333;
  }

  &__subtitle {
    font-size: 13px;
    color: #999;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.btn-outline {
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  background: #fff;

  &:hover {
    border-color: $primary;
    color: $primary;
  }
}

.points-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #ffe0c2;
  border-radius: 4px;
  font-size: 13px;
  color: $primary;
  background: #fff8f0;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 24px 32px;
}
</style>
