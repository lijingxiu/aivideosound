<template>
  <div class="login-page">
    <!-- 窗口控制按钮 -->
    <div class="window-controls">
      <span class="window-controls__dot window-controls__dot--close" />
      <span class="window-controls__dot window-controls__dot--minimize" />
      <span class="window-controls__dot window-controls__dot--maximize" />
    </div>

    <button class="test-enter-btn" @click="enterHomeForTest">进入首页</button>

    <!-- 左侧插画 -->
    <div class="login-page__left">
      <LoginIllustration />
    </div>

    <!-- 右侧登录卡片 -->
    <div class="login-page__right">
      <div class="login-card">
        <!-- 右上角切换按钮 -->
        <button class="login-card__switch" :title="loginMode === 'wechat' ? '切换手机号登录' : '切换微信扫码登录'" @click="toggleMode">
          <svg v-if="loginMode === 'wechat'" viewBox="0 0 48 48" class="login-card__switch-icon">
            <rect x="8" y="4" width="24" height="40" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/>
            <circle cx="20" cy="38" r="2" fill="currentColor"/>
            <line x1="14" y1="12" x2="26" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="14" y1="18" x2="26" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 48 48" class="login-card__switch-icon">
            <rect x="4" y="4" width="16" height="16" rx="1" fill="currentColor"/>
            <rect x="22" y="4" width="16" height="16" rx="1" fill="currentColor"/>
            <rect x="4" y="22" width="16" height="16" rx="1" fill="currentColor"/>
            <rect x="26" y="26" width="6" height="6" fill="currentColor"/>
            <rect x="34" y="26" width="4" height="6" fill="currentColor"/>
            <rect x="26" y="34" width="4" height="4" fill="currentColor"/>
            <rect x="32" y="34" width="6" height="4" fill="currentColor"/>
          </svg>
        </button>

        <!-- 微信扫码登录 -->
        <div v-if="loginMode === 'wechat'" class="login-wechat">
          <div class="login-wechat__header">
            <h2 class="login-card__title">扫码登录</h2>
            <p class="login-card__subtitle">使用微信扫一扫登录</p>
          </div>

          <div class="login-wechat__qr">
            <div v-if="wechatLoading" class="login-wechat__status">
              <AppIcon name="refresh" :size="24" color="#ff7a00" spin />
              <span>二维码加载中...</span>
            </div>
            <div v-else-if="wechatConfigError" class="login-wechat__status login-wechat__status--error">
              <p>{{ wechatConfigError }}</p>
              <button class="btn-refresh" @click="initWechatLogin">重试</button>
            </div>
            <template v-else>
              <div id="wechat-login-container" class="login-wechat__wx-container" />
              <div v-if="wechatExpired" class="login-wechat__qr-mask">
                <p>二维码已过期</p>
                <button class="btn-refresh" @click="refreshWechatQr">刷新二维码</button>
              </div>
              <div v-else-if="wechatScanned" class="login-wechat__scanned-tip">
                扫码成功，请在手机上确认登录
              </div>
            </template>
          </div>

          <p v-if="errorMsg" class="login-error login-error--center">{{ errorMsg }}</p>

          <div class="login-card__footer-row">
            <label class="checkbox">
              <input v-model="autoLogin" type="checkbox" />
              <span class="checkbox__mark" />
              7天内自动登录
            </label>
            <a href="#" class="link">遇到问题了？</a>
          </div>
        </div>

        <!-- 手机号登录 -->
        <div v-else class="login-phone">
          <h2 class="login-card__title">Hi，开启千音译制</h2>
          <p class="login-card__subtitle">未注册的手机号验证通过后将自动注册</p>

          <div class="form-field">
            <div class="form-field__phone">
              <button class="form-field__area">+86 <AppIcon name="arrow-down" :size="10" /></button>
              <input
                v-model="phone"
                type="tel"
                maxlength="11"
                placeholder="请输入手机号"
                class="form-field__input"
              />
            </div>
          </div>

          <div class="form-field">
            <div class="form-field__code">
              <input
                v-model="code"
                type="text"
                maxlength="6"
                placeholder="请输入验证码"
                class="form-field__input"
                @keyup.enter="handlePhoneLogin"
              />
              <button
                class="btn-code"
                :disabled="countdown > 0 || !isPhoneValid"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>

          <button
            class="btn-login"
            :class="{ 'btn-login--active': canSubmitPhone }"
            :disabled="loading || !canSubmitPhone"
            @click="handlePhoneLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </button>

          <div class="login-card__footer-row">
            <label class="checkbox">
              <input v-model="autoLogin" type="checkbox" />
              <span class="checkbox__mark" />
              7天内自动登录
            </label>
            <a href="#" class="link">遇到问题了？</a>
          </div>

          <p class="login-agreement">
            登录即代表您同意
            <a href="#" class="link">用户协议</a>
            和
            <a href="#" class="link">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LoginIllustration from '@/components/login/LoginIllustration.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { createWechatSession, pollWechatLogin } from '@/api/auth'
import { renderWxLogin, clearWxLoginContainer } from '@/utils/wechatLogin'

const WECHAT_CONTAINER_ID = 'wechat-login-container'
const POLL_INTERVAL_MS = 2000

export default {
  name: 'LoginView',
  components: { LoginIllustration, AppIcon },
  data() {
    return {
      loginMode: 'wechat',
      phone: '',
      code: '',
      countdown: 0,
      loading: false,
      errorMsg: '',
      wechatExpired: false,
      wechatLoading: false,
      wechatConfigError: '',
      wechatState: '',
      wechatScanned: false,
      autoLogin: true,
      countdownTimer: null,
      wechatPollTimer: null,
      wechatExpireTimer: null
    }
  },
  computed: {
    isPhoneValid() {
      return /^1[3-9]\d{9}$/.test(this.phone)
    },
    canSubmitPhone() {
      return this.isPhoneValid && /^\d{4,6}$/.test(this.code)
    }
  },
  watch: {
    loginMode(mode) {
      if (mode === 'wechat') {
        this.initWechatLogin()
      } else {
        this.stopWechatLogin()
      }
    }
  },
  mounted() {
    if (this.loginMode === 'wechat') {
      this.initWechatLogin()
    }
  },
  beforeUnmount() {
    this.stopWechatLogin()
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  },
  methods: {
    toggleMode() {
      this.loginMode = this.loginMode === 'wechat' ? 'phone' : 'wechat'
      this.errorMsg = ''
    },
    stopWechatLogin() {
      if (this.wechatPollTimer) {
        clearInterval(this.wechatPollTimer)
        this.wechatPollTimer = null
      }
      if (this.wechatExpireTimer) {
        clearTimeout(this.wechatExpireTimer)
        this.wechatExpireTimer = null
      }
      clearWxLoginContainer(WECHAT_CONTAINER_ID)
    },
    async initWechatLogin() {
      this.stopWechatLogin()
      this.wechatExpired = false
      this.wechatScanned = false
      this.wechatConfigError = ''
      this.errorMsg = ''
      this.wechatLoading = true

      try {
        const session = await createWechatSession()
        this.wechatState = session.state

        await this.$nextTick()
        await renderWxLogin({
          containerId: WECHAT_CONTAINER_ID,
          appId: session.appId,
          redirectUri: session.redirectUri,
          state: session.state
        })

        this.startWechatPoll(session.state)
        this.wechatExpireTimer = setTimeout(() => {
          this.wechatExpired = true
          this.stopWechatPoll()
        }, Math.max(session.expireAt - Date.now(), 0))
      } catch (error) {
        this.wechatConfigError = error.message || '微信登录初始化失败，请检查后端配置'
      } finally {
        this.wechatLoading = false
      }
    },
    startWechatPoll(state) {
      this.stopWechatPoll()
      this.wechatPollTimer = setInterval(() => {
        this.checkWechatStatus(state)
      }, POLL_INTERVAL_MS)
      this.checkWechatStatus(state)
    },
    stopWechatPoll() {
      if (this.wechatPollTimer) {
        clearInterval(this.wechatPollTimer)
        this.wechatPollTimer = null
      }
    },
    async checkWechatStatus(state) {
      try {
        const result = await pollWechatLogin(state)

        if (result.status === 'success') {
          this.stopWechatLogin()
          await this.doLogin({
            ...result.data,
            autoLogin: this.autoLogin
          })
          return
        }

        if (result.status === 'expired') {
          this.wechatExpired = true
          this.stopWechatPoll()
          return
        }

        if (result.status === 'error') {
          this.errorMsg = result.message || '微信登录失败'
          this.stopWechatPoll()
          return
        }

        if (result.status === 'scanned') {
          this.wechatScanned = true
        }
      } catch (error) {
        this.errorMsg = error.message || '登录状态查询失败'
      }
    },
    refreshWechatQr() {
      this.initWechatLogin()
    },
    enterHomeForTest() {
      this.$store.dispatch('login', {
        type: 'test',
        nickname: '测试用户',
        token: 'test-token-' + Date.now(),
        points: 322,
        autoLogin: false
      })
      this.$router.replace('/')
    },
    sendCode() {
      if (!this.isPhoneValid) {
        this.errorMsg = '请输入正确的手机号'
        return
      }
      this.errorMsg = ''
      this.countdown = 60
      this.countdownTimer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer)
          this.countdownTimer = null
        }
      }, 1000)
    },
    async handlePhoneLogin() {
      if (!this.canSubmitPhone) {
        this.errorMsg = '请填写正确的手机号和验证码'
        return
      }
      this.loading = true
      this.errorMsg = ''
      await this.doLogin({
        type: 'phone',
        phone: this.phone,
        nickname: `用户${this.phone.slice(-4)}`,
        token: 'mock-token-' + Date.now(),
        points: 322,
        autoLogin: this.autoLogin
      })
    },
    async doLogin(userInfo) {
      try {
        this.$store.dispatch('login', userInfo)
        this.$router.replace('/')
      } catch {
        this.errorMsg = '登录失败，请重试'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #ff7a00;
$primary-light: #ff9a3c;
$card-radius: 16px;

.login-page {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #ffe8cc 0%, #ffb366 35%, #ff8c33 65%, #ff6b1a 100%);
  overflow: hidden;

  &__left {
    flex: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  &__right {
    flex: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 48px 40px 24px;
    min-width: 380px;
  }
}

.window-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &--close { background: #ff5f57; }
    &--minimize { background: #febc2e; }
    &--maximize { background: #28c840; }
  }
}

.test-enter-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: #ff7a00;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 122, 0, 0.35);
  box-shadow: 0 2px 8px rgba(150, 60, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    background: #fff;
    border-color: #ff7a00;
    box-shadow: 0 2px 12px rgba(150, 60, 0, 0.15);
  }
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: $card-radius;
  padding: 40px 40px 36px;
  box-shadow: 0 8px 40px rgba(150, 60, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);

  &__switch {
    position: absolute;
    top: 0;
    right: 0;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 10px 12px 0 0;
    color: $primary;
    background: linear-gradient(225deg, #fff5eb 0%, #fff 50%);
    border-radius: 0 $card-radius 0 24px;
    transition: color 0.2s, background 0.2s;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 0 64px 64px;
      border-color: transparent transparent #fff transparent;
    }

    &:hover {
      color: $primary-light;
    }
  }

  &__switch-icon {
    position: relative;
    z-index: 1;
    width: 28px;
    height: 28px;
  }

  &__title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.4;
  }

  &__subtitle {
    margin-top: 8px;
    font-size: 13px;
    color: #999;
    line-height: 1.5;
  }

  &__footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
  }
}

.login-wechat {
  margin-top: 4px;

  &__header {
    margin-bottom: 16px;

    .login-card__subtitle {
      margin-top: 4px;
    }
  }

  &__qr {
    position: relative;
    margin: 0 auto;
    width: 220px;
    height: 220px;
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  &__wx-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(iframe) {
      width: 220px !important;
      height: 220px !important;
      border: none;
    }
  }

  &__status {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    color: #999;
    padding: 16px;
    text-align: center;

    &--error p {
      color: #666;
      line-height: 1.6;
    }
  }

  &__qr-mask {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.94);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    color: #666;
    z-index: 2;
  }

  &__scanned-tip {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background: rgba(7, 193, 96, 0.1);
    color: #07c160;
    font-size: 12px;
    text-align: center;
    z-index: 1;
  }
}

.login-phone {
  margin-top: 28px;
}

.form-field {
  margin-bottom: 16px;

  &__phone,
  &__code {
    display: flex;
    align-items: center;
    height: 48px;
    border-bottom: 1px solid #eee;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: $primary;
    }
  }

  &__area {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 12px;
    font-size: 15px;
    color: #333;
    white-space: nowrap;
    border-right: 1px solid #eee;
    margin-right: 12px;
    height: 24px;
  }

  &__input {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    font-size: 15px;
    color: #333;

    &::placeholder {
      color: #ccc;
    }
  }

  &__code {
    .form-field__input {
      flex: 1;
    }
  }
}

.btn-code {
  flex-shrink: 0;
  font-size: 14px;
  color: $primary;
  white-space: nowrap;
  padding-left: 12px;

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    color: $primary-light;
  }
}

.btn-login {
  width: 100%;
  height: 44px;
  margin-top: 8px;
  border-radius: 6px;
  font-size: 15px;
  color: #fff;
  background: #ffd4a8;
  transition: background 0.2s;

  &--active {
    background: $primary;

    &:hover:not(:disabled) {
      background: $primary-light;
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.btn-refresh {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  color: #fff;
  background: $primary;

  &:hover {
    background: $primary-light;
  }
}

.login-error {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 8px;

  &--center {
    text-align: center;
    margin-top: 12px;
  }
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  &__mark {
    width: 16px;
    height: 16px;
    border: 1px solid #ddd;
    border-radius: 3px;
    position: relative;
    transition: all 0.15s;
  }

  input:checked + &__mark {
    background: $primary;
    border-color: $primary;

    &::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 5px;
      height: 9px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}

.link {
  font-size: 13px;
  color: $primary;

  &:hover {
    text-decoration: underline;
  }
}

.login-agreement {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: #999;
  line-height: 1.8;
}
</style>
