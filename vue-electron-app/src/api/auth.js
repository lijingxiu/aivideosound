import { request } from './request'

export function createWechatSession() {
  return request('/auth/wechat/session', { method: 'POST' })
}

export function pollWechatLogin(state) {
  return request(`/auth/wechat/poll?state=${encodeURIComponent(state)}`)
}
