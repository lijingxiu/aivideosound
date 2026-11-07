import { API_BASE_URL } from '@/config'
import { Message } from 'element-ui'

class ApiError extends Error {
  constructor(message, code, status) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const error = new ApiError(
      data?.message || `请求失败 (${response.status})`,
      data?.code,
      response.status
    )
    Message.error(error.message)
    error.messageShown = true
    throw error
  }

  if (data?.code !== 200) {
    const error = new ApiError(
      data?.message || '请求失败',
      data?.code,
      response.status
    )
    Message.error(error.message)
    error.messageShown = true
    throw error
  }

  return data
}

export { request, ApiError }
