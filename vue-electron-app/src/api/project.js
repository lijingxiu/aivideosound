import { request } from './request'

export function fetchUserPoints() {
  return request('/user/points')
}

export function submitProjectTask(payload) {
  return request('/project/submit', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
