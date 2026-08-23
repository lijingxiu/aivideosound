<template>
  <div class="login-illustration">
    <svg class="login-illustration__svg" viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="glassGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0.15)"/>
        </linearGradient>
        <linearGradient id="glassGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,200,120,0.6)"/>
          <stop offset="50%" stop-color="rgba(255,140,60,0.35)"/>
          <stop offset="100%" stop-color="rgba(255,100,30,0.2)"/>
        </linearGradient>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#ffe0b2" stop-opacity="0.7"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="rgba(180,80,0,0.25)"/>
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- 浮动装饰卡片 -->
      <g class="float-card float-card--1" filter="url(#softShadow)">
        <rect x="60" y="80" width="90" height="60" rx="12" fill="url(#glassGrad1)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <rect x="72" y="94" width="40" height="6" rx="3" fill="rgba(255,255,255,0.7)"/>
        <rect x="72" y="108" width="66" height="4" rx="2" fill="rgba(255,255,255,0.4)"/>
        <rect x="72" y="118" width="50" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
      </g>

      <g class="float-card float-card--2" filter="url(#softShadow)">
        <rect x="420" y="60" width="80" height="80" rx="40" fill="url(#glassGrad1)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <circle cx="460" cy="88" r="14" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2.5"/>
        <polygon points="455,82 455,94 466,88" fill="rgba(255,255,255,0.85)"/>
        <rect x="442" y="112" width="36" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
      </g>

      <g class="float-card float-card--3" filter="url(#softShadow)">
        <rect x="480" y="280" width="70" height="70" rx="14" fill="url(#glassGrad1)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <text x="515" y="318" text-anchor="middle" font-size="22" fill="rgba(255,255,255,0.9)" font-weight="bold">A</text>
        <text x="515" y="340" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)">文</text>
      </g>

      <g class="float-card float-card--4" filter="url(#softShadow)">
        <rect x="50" y="320" width="76" height="76" rx="14" fill="url(#glassGrad1)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
        <path d="M78 348 Q88 332 98 348 Q88 364 78 348" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"/>
        <line x1="72" y1="360" x2="104" y2="360" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round"/>
        <line x1="76" y1="370" x2="100" y2="370" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/>
      </g>

      <!-- 音波装饰 -->
      <g class="sound-waves" opacity="0.7">
        <path d="M130 220 Q140 200 150 220 Q160 240 170 220" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M430 200 Q440 175 450 200 Q460 225 470 200" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M100 400 Q110 385 120 400 Q130 415 140 400" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-linecap="round"/>
      </g>

      <!-- 主体：千 + 播放 + 音波 -->
      <g class="main-logo" filter="url(#softShadow)">
        <ellipse cx="300" cy="290" rx="130" ry="20" fill="rgba(180,80,0,0.15)"/>

        <rect x="170" y="120" width="260" height="200" rx="28" fill="url(#glassGrad2)" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>

        <!-- 千字造型 -->
        <text x="300" y="210" text-anchor="middle" font-size="88" font-weight="700" fill="rgba(255,255,255,0.92)" font-family="PingFang SC, Microsoft YaHei, sans-serif">千</text>

        <!-- 底部微笑弧线 -->
        <path d="M240 248 Q300 278 360 248" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3" stroke-linecap="round"/>

        <!-- 音波条 -->
        <g transform="translate(300, 268)">
          <rect x="-48" y="-8" width="6" height="16" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--1"/>
          <rect x="-34" y="-14" width="6" height="28" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--2"/>
          <rect x="-20" y="-6" width="6" height="12" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--3"/>
          <rect x="-6" y="-18" width="6" height="36" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--4"/>
          <rect x="8" y="-10" width="6" height="20" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--5"/>
          <rect x="22" y="-16" width="6" height="32" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--6"/>
          <rect x="36" y="-8" width="6" height="16" rx="3" fill="url(#waveGrad)" class="wave-bar wave-bar--7"/>
        </g>
      </g>

      <!-- 胶片条装饰 -->
      <g class="film-strip" opacity="0.6">
        <rect x="200" y="60" width="200" height="28" rx="6" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <circle cx="218" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="242" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="266" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="290" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="314" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="338" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="362" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
        <circle cx="386" cy="74" r="5" fill="rgba(255,255,255,0.25)"/>
      </g>
    </svg>

    <div class="login-illustration__brand">
      <h1>千音译制</h1>
      <p>视频翻译 · 配音 · 音译 一站式解决方案</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginIllustration'
}
</script>

<style scoped lang="scss">
.login-illustration {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40px;

  &__svg {
    width: 100%;
    max-width: 560px;
    height: auto;
  }

  &__brand {
    margin-top: 24px;
    text-align: center;
    color: rgba(255, 255, 255, 0.95);

    h1 {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      text-shadow: 0 2px 12px rgba(150, 60, 0, 0.2);
    }

    p {
      margin-top: 10px;
      font-size: 15px;
      opacity: 0.85;
      letter-spacing: 1px;
    }
  }
}

.float-card--1 { animation: float 6s ease-in-out infinite; }
.float-card--2 { animation: float 5s ease-in-out 0.5s infinite; }
.float-card--3 { animation: float 7s ease-in-out 1s infinite; }
.float-card--4 { animation: float 5.5s ease-in-out 1.5s infinite; }

.wave-bar--1 { animation: wave 1.2s ease-in-out infinite; }
.wave-bar--2 { animation: wave 1.2s ease-in-out 0.1s infinite; }
.wave-bar--3 { animation: wave 1.2s ease-in-out 0.2s infinite; }
.wave-bar--4 { animation: wave 1.2s ease-in-out 0.3s infinite; }
.wave-bar--5 { animation: wave 1.2s ease-in-out 0.4s infinite; }
.wave-bar--6 { animation: wave 1.2s ease-in-out 0.5s infinite; }
.wave-bar--7 { animation: wave 1.2s ease-in-out 0.6s infinite; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.5); }
}
</style>
