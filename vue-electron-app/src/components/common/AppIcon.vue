<template>
  <svg
    class="app-icon"
    :class="[`app-icon--${name}`, { 'app-icon--spin': spin }]"
    :style="{ width: size + 'px', height: size + 'px', color }"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path v-if="name === 'video'" fill="currentColor" d="M128 192h512v640H128V192zm576 128l256 192-256 192V320z"/>
    <path v-else-if="name === 'erase'" fill="currentColor" d="M832 128H192c-35.3 0-64 28.7-64 64v640c0 35.3 28.7 64 64 64h640c35.3 0 64-28.7 64-64V192c0-35.3-28.7-64-64-64zM384 704l128-128 96 96 160-192 128 128v128H384V704z"/>
    <path v-else-if="name === 'voice'" fill="currentColor" d="M512 128c-88.4 0-160 71.6-160 160v256c0 88.4 71.6 160 160 160s160-71.6 160-160V288c0-88.4-71.6-160-160-160zm0 640c-141.4 0-256-114.6-256-256h64c0 106 86 192 192 192s192-86 192-192h64c0 141.4-114.6 256-256 256z"/>
    <path v-else-if="name === 'dedup'" fill="currentColor" d="M256 192h512v128H256V192zm0 256h512v128H256V448zm0 256h320v128H256V704zM128 128h768v768H128V128z"/>
    <path v-else-if="name === 'lipsync'" fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 512c0 35.3-28.7 64-64 64H384c-35.3 0-64-28.7-64-64s28.7-64 64-64h256c35.3 0 64 28.7 64 64z"/>
    <path v-else-if="name === 'folder'" fill="currentColor" d="M128 256h320l64 64h384v448H128V256zm64 128v256h640V448H448l-64-64H192z"/>
    <path v-else-if="name === 'user'" fill="currentColor" d="M512 512a192 192 0 1 0 0-384 192 192 0 0 0 0 384zm0 64c-176.7 0-320 89.9-320 201.3V832h640v-54.7C832 665.9 688.7 576 512 576z"/>
    <path v-else-if="name === 'gift'" fill="currentColor" d="M832 384H704V256c0-70.7-57.3-128-128-128-40.5 0-76.5 18.9-100 48.4C452.5 146.9 416.5 128 376 128c-70.7 0-128 57.3-128 128v128H192c-35.3 0-64 28.7-64 64v128c0 35.3 28.7 64 64 64v256c0 35.3 28.7 64 64 64h512c35.3 0 64-28.7 64-64V640c35.3 0 64-28.7 64-64V448c0-35.3-28.7-64-64-64zM376 256c0-35.3 28.7-64 64-64s64 28.7 64 64v128H376V256zm192 0c0-35.3 28.7-64 64-64s64 28.7 64 64v128H568V256z"/>
    <path v-else-if="name === 'contact'" fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 576h64v64h-64v-64zm0-320h64v256h-64V320z"/>
    <path v-else-if="name === 'search'" fill="currentColor" d="M448 128c176.7 0 320 143.3 320 320s-143.3 320-320 320S128 624.7 128 448 271.3 128 448 128zm0 64C306.9 192 192 306.9 192 448s114.9 256 256 256 256-114.9 256-256S589.1 192 448 192zm192 384l128 128-45.3 45.3-128-128 45.3-45.3z"/>
    <path v-else-if="name === 'plus'" fill="currentColor" d="M480 192h64v288h288v64H544v288h-64V544H192v-64h288V192z"/>
    <path v-else-if="name === 'more'" fill="currentColor" d="M256 448a64 64 0 1 0 0-128 64 64 0 0 0 0 128zm256 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128zm256 0a64 64 0 1 0 0-128 64 64 0 0 0 0 128z"/>
    <path v-else-if="name === 'arrow-down'" fill="currentColor" d="M512 640l256-256H256l256 256z"/>
    <path v-else-if="name === 'arrow-right'" fill="currentColor" d="M384 256l256 256-256 256V256z"/>
    <path v-else-if="name === 'wechat'" fill="currentColor" d="M690.1 377.4c5.9 0 11.8.4 17.6 1.2C652.4 260.9 586.9 192 512 192c-88.4 0-160 71.6-160 160 0 52.9 25.9 99.9 66.2 129.1-5.7 1.1-11.5 1.7-17.4 1.7-88.4 0-160-71.6-160-160S310.4 160 398.8 160c74.9 0 140.4 68.9 195.7 185.4-5.8-.8-11.6-1.2-17.4-1.2-88.4 0-160 71.6-160 160s71.6 160 160 160c5.9 0 11.7-.4 17.4-1.2C539.2 747.1 473.7 816 398.8 816c-88.4 0-160-71.6-160-160 0-52.9 25.9-99.9 66.2-129.1 5.7-1.1 11.5-1.7 17.4-1.7 88.4 0 160 71.6 160 160 0 52.9-25.9 99.9-66.2 129.1 5.7 1.1 11.5 1.7 17.4 1.7 88.4 0 160-71.6 160-160 0-52.9-25.9-99.9-66.2-129.1 5.8.8 11.6 1.2 17.4 1.2z"/>
    <path v-else-if="name === 'phone'" fill="currentColor" d="M768 896H256c-35.3 0-64-28.7-64-64V192c0-35.3 28.7-64 64-64h512c35.3 0 64 28.7 64 64v640c0 35.3-28.7 64-64 64zM320 192v64h384V192H320zm0 128v512h384V320H320z"/>
    <path v-else-if="name === 'coin'" fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 704c-141.4 0-256-114.6-256-256h512c0 141.4-114.6 256-256 256zm0-384c70.7 0 128 57.3 128 128H384c0-70.7 57.3-128 128-128z"/>
    <path v-else-if="name === 'close'" fill="currentColor" d="M563.8 512l262.5-262.5c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L512 466.2 249.5 203.7c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L466.2 512 203.7 774.5c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L512 557.8l262.5 262.5c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L563.8 512z"/>
    <path v-else-if="name === 'refresh'" fill="currentColor" d="M512 128c-212.1 0-384 171.9-384 384h64c0-176.7 143.3-320 320-320 70.7 0 135.5 22.9 188.5 61.5L640 384h256V128l-73.4 73.4C758.5 146.7 639.8 128 512 128zm256 384c0 176.7-143.3 320-320 320-70.7 0-135.5-22.9-188.5-61.5L384 640H128v256l73.4-73.4C265.5 877.3 384.2 896 512 896c212.1 0 384-171.9 384-384h-64z"/>
  </svg>
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
    color: { type: String, default: 'currentColor' },
    spin: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  flex-shrink: 0;
}

.app-icon--spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
