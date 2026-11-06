import { request } from './request'

const TEMP_PROJECT_TOKEN = '91603f56-6f75-45fa-b8a8-ebf5e463f1f9'

export function getProjectToken() {
  return TEMP_PROJECT_TOKEN
}

export function fetchProjectInfo() {
  return request(`/DubFastProject/GetInfo?token=${encodeURIComponent(getProjectToken())}`)
}

export function fetchProjectList({ pageOffset = 0, pageLimit = 10, name = '' } = {}) {
  const params = new URLSearchParams({
    token: getProjectToken(),
    pageOffset: String(pageOffset),
    pageLimit: String(pageLimit)
  })
  if (name) params.set('name', name)
  return request(`/DubFastProject/GetList?${params.toString()}`)
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
  return request(`/DubFastProject/Submit?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function fetchTranslationDictionaryList({ fromLangCode, destLangCode, keyword = '' }) {
  const params = new URLSearchParams({
    token: getProjectToken(),
    fromLangCode,
    destLangCode,
    keyword
  })
  return request(`/DubLocalizeTransDict/GetList?${params.toString()}`)
}

export function addTranslationDictionary({ fromLangCode, destLangCode, termListStr }) {
  return request(`/DubLocalizeTransDict/Add?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ fromLangCode, destLangCode, termListStr })
  })
}

export function updateTranslationDictionary(payload) {
  return request(`/DubLocalizeTransDict/Update?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function deleteTranslationDictionary(ids) {
  return request(`/DubLocalizeTransDict/Delete?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ids})
  })
}

export function fetchDubFastList({ projectId, name = '', state = '', orderType = '' } = {}) {
  const params = new URLSearchParams({
    token: getProjectToken(),
    projectId: String(projectId)
  })
  if (name) params.set('name', name)
  if (state !== '') params.set('state', String(state))
  if (orderType !== '') params.set('orderType', String(orderType))
  return request(`/DubFast/GetListByProjectId?${params.toString()}`)
}

export function deleteDubFast(ids) {
  const idStr = Array.isArray(ids) ? ids.join(',') : String(ids)
  return request(`/DubFast/Delete?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ ids: idStr })
  })
}

export function deleteProject(id) {  return request(`/DubProject/Delete?token=${encodeURIComponent(getProjectToken())}`, {
    method: 'POST',
    body: JSON.stringify({ id })
  })
}
