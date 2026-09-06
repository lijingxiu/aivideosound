import { request } from './request'

const TEMP_PROJECT_TOKEN = '23bf7149-b124-4f00-b9fd-6878b9ac9833'

export function fetchProjectInfo() {
  return request(`/DubProject/GetInfo?token=${encodeURIComponent(TEMP_PROJECT_TOKEN)}`)
}

export function fetchUserPoints() {
  return request('/user/points')
}

export function submitProjectTask(payload) {
  return request('/project/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
