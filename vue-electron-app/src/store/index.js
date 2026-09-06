import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const AUTH_KEY = 'qianyin_auth'

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default new Vuex.Store({
  state: {
    user: loadAuth()
  },
  getters: {
    isLoggedIn: state => !!state.user?.token
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_KEY)
      }
    }
  },
  actions: {
    login({ commit }, user) {
      commit('SET_USER', user)
    },
    logout({ commit }) {
      commit('SET_USER', null)
    }
  }
})
