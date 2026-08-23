require('dotenv').config()

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 3001

const WECHAT_APP_ID = process.env.WECHAT_APP_ID || ''
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || ''
const WECHAT_REDIRECT_URI = process.env.WECHAT_REDIRECT_URI || `http://localhost:${PORT}/api/auth/wechat/callback`
const SESSION_TTL_MS = 5 * 60 * 1000

const sessions = new Map()

function isWechatConfigured() {
  return Boolean(WECHAT_APP_ID && WECHAT_APP_SECRET)
}

function createState() {
  return crypto.randomBytes(16).toString('hex')
}

function getSession(state) {
  const session = sessions.get(state)
  if (!session) return null
  if (Date.now() > session.expireAt) {
    sessions.delete(state)
    return null
  }
  return session
}

function cleanupSessions() {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (now > session.expireAt) sessions.delete(key)
  }
}

setInterval(cleanupSessions, 60 * 1000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, wechatConfigured: isWechatConfigured() })
})

app.post('/api/auth/wechat/session', (_req, res) => {
  if (!isWechatConfigured()) {
    return res.status(503).json({
      code: 'WECHAT_NOT_CONFIGURED',
      message: '请先在 server/.env 中配置 WECHAT_APP_ID 和 WECHAT_APP_SECRET'
    })
  }

  const state = createState()
  const expireAt = Date.now() + SESSION_TTL_MS

  sessions.set(state, {
    state,
    status: 'waiting',
    expireAt,
    user: null,
    token: null
  })

  res.json({
    state,
    appId: WECHAT_APP_ID,
    redirectUri: WECHAT_REDIRECT_URI,
    expireAt
  })
})

app.get('/api/auth/wechat/poll', (req, res) => {
  const { state } = req.query
  if (!state) {
    return res.status(400).json({ code: 'INVALID_STATE', message: '缺少 state 参数' })
  }

  const session = getSession(state)
  if (!session) {
    return res.json({ status: 'expired' })
  }

  if (session.status === 'success') {
    return res.json({
      status: 'success',
      data: {
        token: session.token,
        type: 'wechat',
        nickname: session.user?.nickname,
        avatar: session.user?.headimgurl,
        openid: session.user?.openid,
        points: session.user?.points ?? 0
      }
    })
  }

  if (session.status === 'error') {
    return res.json({ status: 'error', message: session.errorMessage || '微信登录失败' })
  }

  res.json({ status: session.status })
})

app.get('/api/auth/wechat/callback', async (req, res) => {
  const { code, state } = req.query

  if (!state || !code) {
    return res.status(400).send(renderCallbackPage('登录失败', '缺少必要参数'))
  }

  const session = getSession(state)
  if (!session) {
    return res.status(400).send(renderCallbackPage('登录失败', '二维码已过期，请刷新后重试'))
  }

  try {
    const tokenRes = await axios.get('https://api.weixin.qq.com/sns/oauth2/access_token', {
      params: {
        appid: WECHAT_APP_ID,
        secret: WECHAT_APP_SECRET,
        code,
        grant_type: 'authorization_code'
      }
    })

    const tokenData = tokenRes.data
    if (tokenData.errcode) {
      throw new Error(tokenData.errmsg || '获取 access_token 失败')
    }

    const userRes = await axios.get('https://api.weixin.qq.com/sns/userinfo', {
      params: {
        access_token: tokenData.access_token,
        openid: tokenData.openid,
        lang: 'zh_CN'
      }
    })

    const user = userRes.data
    if (user.errcode) {
      throw new Error(user.errmsg || '获取用户信息失败')
    }

    session.status = 'success'
    session.user = user
    session.token = crypto.randomBytes(24).toString('hex')

    res.send(renderCallbackPage('登录成功', '请返回应用，正在自动跳转…', true))
  } catch (error) {
    session.status = 'error'
    session.errorMessage = error.message
    res.status(500).send(renderCallbackPage('登录失败', error.message))
  }
})

function renderCallbackPage(title, message, success = false) {
  const color = success ? '#07c160' : '#ff4d4f'
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f7f7f7; }
    .card { background:#fff; padding:40px 48px; border-radius:12px; text-align:center; box-shadow:0 8px 24px rgba(0,0,0,.08); }
    h1 { color:${color}; font-size:22px; margin:0 0 12px; }
    p { color:#666; margin:0; font-size:14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}

app.listen(PORT, () => {
  console.log(`[auth-server] http://localhost:${PORT}`)
  console.log(`[auth-server] wechat configured: ${isWechatConfigured()}`)
  if (!isWechatConfigured()) {
    console.log('[auth-server] 请在 server/.env 配置微信开放平台应用信息')
  }
})
