<template>
  <div class="burn">
    <div class="controls"><label class="font-select">字体
      <el-select v-model="settings.font" size="mini" @change="resetFontSize">
        <el-option v-for="font in fontList" :key="font.key" :label="font.name" :value="font.key"/>
      </el-select>
    </label><label class="size-select">字号
      <el-select v-model="settings.size" size="mini">
        <el-option v-for="size in fontSizes" :key="size" :label="String(size)" :value="size"/>
      </el-select>
    </label><label class="color-select">字体颜色<input v-model="settings.color" type="color"></label>
      <el-checkbox v-model="settings.bold">粗体</el-checkbox>
    </div>
    <div class="controls style-controls">
      <div class="background-control"><span>字幕背景</span>
        <el-radio-group v-model="settings.background">
          <el-radio label="outline">边框</el-radio>
          <el-radio label="background">背景</el-radio>
          <el-radio label="none">关闭</el-radio>
        </el-radio-group>
      </div>
      <label v-if="settings.background === 'outline'" class="style-color">边框颜色<input v-model="settings.strokeColor" type="color"></label>
      <label v-else-if="settings.background === 'background'" class="style-color">背景颜色<input v-model="settings.bgColor" type="color"></label>
      <label v-if="settings.background === 'outline'" class="stroke-width">宽度
        <el-select v-model="settings.strokeWidth" size="mini">
          <el-option v-for="width in strokeWidths" :key="width" :label="String(width)" :value="width"/>
        </el-select>
      </label>
    </div>
    <div class="controls position-control">
      <label>垂直位置<input v-model.number="settings.position" type="range" min="0" max="100"></label>
      <span>{{ settings.position }}</span>
    </div>
  </div>
</template>
<script>
export default {
  name: 'SubtitleBurnSettings',
  props: {
    fontList: {type: Array, default: () => []}
  },
  data: () => ({
    settings: {
      font: '',
      size: 32,
      color: '#ed6200',
      bold: false,
      background: 'outline',
      strokeColor: '#ed6200',
      strokeWidth: 1,
      bgColor: '#ed6200',
      position: 24
    }
  }),
  computed: {
    fontSizes() {
      return Array.from({length: 23}, (_, index) => 12 + index * 4)
    },
    strokeWidths() {
      return Array.from({length: 10}, (_, index) => index + 1)
    }
  },
  watch: {
    fontList: {
      immediate: true,
      handler(fontList) {
        if (!fontList.length) return
        this.settings.font = fontList[0].key
        this.settings.size = fontList[0].size
      }
    }
  },
  methods: {
    resetFontSize(fontKey) {
      const font = this.fontList.find(item => item.key === fontKey)
      if (font) this.settings.size = font.size
    }
  }
}
</script>
<style scoped lang="scss">
.burn {
  border: 1px solid #ddd;
  padding: 10px 8px;
  font-size: 12px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 36px;
}

.controls:first-child {
  justify-content: flex-start;
  gap: 10px;
}

.controls + .controls {
  margin-top: 14px;
}

.style-controls {
  flex-wrap: wrap;
}

.style-color {
  gap: 8px !important;
}

.stroke-width ::v-deep .el-select {
  width: 64px;
}

.position-control {
  justify-content: flex-start;
  gap: 12px;
}

.position-control label {
  flex: 1;
}

.position-control input[type=range] {
  flex: 1;
  width: auto;
}

.position-control > span {
  min-width: 24px;
  text-align: right;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.controls .font-select ::v-deep .el-select {
  width: 100px;
}

.controls .size-select ::v-deep .el-select {
  width: 64px;
}

.controls .color-select {
  gap: 4px;
}

.controls > ::v-deep .el-checkbox {
  margin-left: 10px;
}

.controls .font-select ::v-deep .el-select,
.controls .size-select ::v-deep .el-select {
  flex-shrink: 0;
}

.controls .font-select ::v-deep .el-input__inner,
.controls .size-select ::v-deep .el-input__inner {
  box-sizing: border-box;
  height: 22px;
  line-height: 22px;
  padding-right: 24px;
}

.controls .font-select ::v-deep .el-input__inner {
  color: #ed6200;
}

.controls .font-select ::v-deep .el-input__suffix,
.controls .size-select ::v-deep .el-input__suffix,
.controls .font-select ::v-deep .el-input__suffix-inner,
.controls .size-select ::v-deep .el-input__suffix-inner {
  display: flex;
  align-items: center;
  height: 100%;
}

.controls .font-select ::v-deep .el-input__icon,
.controls .size-select ::v-deep .el-input__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  line-height: normal;
}

.controls > ::v-deep .el-checkbox {
  display: flex;
  align-items: center;
  gap: 2px;
}

.controls > ::v-deep .el-checkbox__label {
  padding-left: 2px;
}

.background-control {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.background-control ::v-deep .el-radio-group {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.controls input[type=color] {
  width: 32px;
  height: 28px;
  border: 0;
  padding: 0;
}

.controls input[type=range] {
  width: 100px;
  accent-color: #ed6200;
  background-color: #ccc;
}

.controls ::v-deep .el-radio {
  margin-right: 8px;
}

.controls ::v-deep .el-radio__input.is-checked .el-radio__inner,
.controls ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
  border-color: #ed6200;
  background: #ed6200;
}

.controls ::v-deep .el-radio__input.is-checked + .el-radio__label,
.controls ::v-deep .el-checkbox__input.is-checked + .el-checkbox__label {
  color: #ed6200;
}
</style>
