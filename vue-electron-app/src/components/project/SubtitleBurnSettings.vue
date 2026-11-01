<template>
  <div class="burn">
    <div class="controls"><label class="font-select">字体
      <el-select v-model="settings.font" size="mini">
        <el-option label="微软雅黑" value="微软雅黑"/>
        <el-option label="思源黑体" value="思源黑体"/>
      </el-select>
    </label><label class="size-select">字号
      <el-select v-model="settings.size" size="mini">
        <el-option v-for="size in [24,32,48,64,85]" :key="size" :label="String(size)" :value="size"/>
      </el-select>
    </label><label class="color-select">字体颜色<input v-model="settings.color" type="color"></label>
      <el-checkbox v-model="settings.bold">粗体</el-checkbox>
    </div>
    <div class="controls">
      <div class="background-control"><span>字幕背景</span>
        <el-radio-group v-model="settings.background">
          <el-radio label="outline">边框</el-radio>
          <el-radio label="background">背景</el-radio>
          <el-radio label="none">关闭</el-radio>
        </el-radio-group>
      </div>
      <label>位置<input v-model.number="settings.position" type="range" min="0"
                        max="100"></label><span>{{ settings.position }}</span></div>
  </div>
</template>
<script>
export default {
  name: 'SubtitleBurnSettings',
  data: () => ({
    settings: {
      font: '微软雅黑',
      size: 32,
      color: '#ed6200',
      bold: false,
      background: 'outline',
      position: 75
    }
  })
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
