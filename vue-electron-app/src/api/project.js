import { request } from './request'

const TEMP_PROJECT_TOKEN = '91603f56-6f75-45fa-b8a8-ebf5e463f1f9'

export function getProjectToken() {
  return TEMP_PROJECT_TOKEN
}

export function fetchProjectInfo() {
  return request(`/DubProject/GetInfo?token=${encodeURIComponent(getProjectToken())}`)
}

export function fetchProjectList({ pageOffset = 0, pageLimit = 10, name = '' } = {}) {
  const params = new URLSearchParams({
    token: getProjectToken(),
    pageOffset: String(pageOffset),
    pageLimit: String(pageLimit),
    name
  })
  return request(`/DubProject/GetList?${params.toString()}`)
}

export function fetchOriginalList({ projectId, name = '', state = '', checkState = '', orderType = 0 } = {}) {
  const params = new URLSearchParams({
    token: getProjectToken(),
    projectId: String(projectId),
    name,
    state: String(state),
    checkState: String(checkState),
    orderType: String(orderType)
  })
  return request(`/DubOriginal/GetListByProjectId?${params.toString()}`)
}

export function submitOriginal({ projectId, originalListStr }) {
  return request(`/DubOriginal/DubOriginal?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ projectId, originalListStr })
  })
}

export function getOriginalUploadPolicy(fileFormat) {
  return request(`/Oss/GetPolicyForOriginal?fileFormat=${encodeURIComponent(fileFormat)}&token=${encodeURIComponent(getProjectToken())}`)
}

export function submitProjectTask(payload) {
  return request(`/DubProject/Submit?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function deleteProject(id) {
  return request(`/DubProject/Delete?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ id })
  })
}
