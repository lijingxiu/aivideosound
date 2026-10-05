import { request } from './request'

const TEMP_PROJECT_TOKEN = '91603f56-6f75-45fa-b8a8-ebf5e463f1f9'

export function fetchProjectInfo() {
  return request(`/DubProject/GetInfo?token=${encodeURIComponent(TEMP_PROJECT_TOKEN)}`)
}

export function getOriginalUploadPolicy(fileFormat) {
  return request(`/Oss/GetPolicyForOriginal?fileFormat=${encodeURIComponent(fileFormat)}`)
}

export async function uploadOriginalFile(file, policy) {
  const data = policy?.data || policy
  const form = new FormData()
  form.append('key', data.fileKey)
  form.append('policy', data.policy)
  form.append('x-oss-signature', data.signature)
  form.append('x-oss-date', data.xOssDate)
  form.append('x-oss-credential', data.xOssCredential)
  form.append('x-oss-signature-version', data.xOssSignatureVersion)
  if (data.securityToken) form.append('x-oss-security-token', data.securityToken)
  form.append('success_action_status', '200')
  form.append('file', file)

  const response = await fetch(data.host, { method: 'POST', body: form })
  if (!response.ok) throw new Error(`上传 ${file.name} 失败 (${response.status})`)
  return data.fileKey
}

export function submitProjectTask(payload, token) {
  return request(`/DubProject/Submit?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
