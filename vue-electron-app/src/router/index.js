import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/new',
    name: 'new-project',
    component: () => import('../views/NewProjectView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:id',
    name: 'project-detail',
    component: () => import('../views/ProjectDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/project/:projectId/video/:videoId/edit',
    name: 'video-edit',
    component: () => import('../views/VideoEditView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = store.getters.isLoggedIn

  if (to.meta.requiresAuth && !loggedIn) {
    next({ name: 'login' })
  } else if (to.meta.guest && loggedIn) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
