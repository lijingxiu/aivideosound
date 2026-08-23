const WX_LOGIN_SCRIPT = 'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js'

let loadingPromise = null

export function loadWxLoginScript() {
  if (window.WxLogin) {
    return Promise.resolve()
  }

  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WX_LOGIN_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('微信登录脚本加载失败')))
      return
    }

    const script = document.createElement('script')
    script.src = WX_LOGIN_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('微信登录脚本加载失败'))
    document.body.appendChild(script)
  })

  return loadingPromise
}

export async function renderWxLogin({ containerId, appId, redirectUri, state }) {
  await loadWxLoginScript()

  const container = document.getElementById(containerId)
  if (!container) {
    throw new Error('微信登录容器不存在')
  }

  container.innerHTML = ''

  // eslint-disable-next-line no-new
  new window.WxLogin({
    self_redirect: true,
    id: containerId,
    appid: appId,
    scope: 'snsapi_login',
    redirect_uri: encodeURIComponent(redirectUri),
    state,
    style: 'black',
    href: ''
  })
}

export function clearWxLoginContainer(containerId) {
  const container = document.getElementById(containerId)
  if (container) {
    container.innerHTML = ''
  }
}
