<template>
  <div class="dictionary">
    <div class="dict-toggle"><span>翻译词典</span><el-switch v-model="enabled" active-color="#ff7a00" @change="onToggle"/><button v-if="enabled" type="button" @click="open">设置</button></div>
    <div v-if="visible" class="mask" @click.self="visible=false"><section class="dialog">
      <header>翻译词典 <button @click="visible=false">×</button></header>
      <div class="tools"><button @click="removeSelected">批量删除</button><input v-model.trim="keyword" placeholder="输入关键词搜索"><button class="primary" @click="addVisible=true">添加</button><label class="button">导入<input type="file" accept=".xlsx,.xls" @change="importFile"></label><a class="button" href="/翻译字典模板.xlsx" download>模版下载</a></div>
      <table><thead><tr><th><input v-model="allChecked" type="checkbox"></th><th>源语言（{{ sourceName || '中文' }}）</th><th>目标语言（{{ targetName || '英文' }}）</th><th>创建时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in filtered" :key="item.id"><td><input v-model="selected" type="checkbox" :value="item.id"></td><td>{{ item.source }}</td><td>{{ item.target }}</td><td>{{ item.created }}</td><td><button @click="edit(item)">编辑</button><button @click="remove(item.id)">删除</button></td></tr><tr v-if="!filtered.length"><td colspan="5" class="empty">暂无词条</td></tr></tbody></table>
      <footer><button @click="removeSelected">批量删除</button><button class="primary" @click="apply">使用</button></footer>
    </section></div>
    <div v-if="addVisible" class="mask mask-top" @click.self="addVisible=false"><section class="add-dialog"><label>源语言：<input v-model="form.source" placeholder="请输入内容"></label><label>目标语言：<input v-model="form.target" placeholder="请输入内容"></label><footer><button class="primary" @click="save">保存</button></footer></section></div>
  </div>
</template>
<script>
export default {
  name: 'TranslationDictionary',
  props: { sourceLanguage: { type: String, default: '' }, targetLanguage: { type: String, default: '' }, languages: { type: Array, default: () => [] } },
  data: () => ({ enabled: false, visible: false, addVisible: false, keyword: '', entries: [], selected: [], editingId: '', form: { source: '', target: '' } }),
  computed: {
    sourceName() { return this.languages.find(item => item.code === this.sourceLanguage)?.name || '' },
    targetName() { return this.languages.find(item => item.code === this.targetLanguage)?.name || '' },
    filtered() { const key = this.keyword.toLowerCase(); return this.entries.filter(item => !key || `${item.source} ${item.target}`.toLowerCase().includes(key)) },
    allChecked: { get() { return this.filtered.length > 0 && this.filtered.every(item => this.selected.includes(item.id)) }, set(value) { this.selected = value ? [...new Set([...this.selected, ...this.filtered.map(item => item.id)])] : this.selected.filter(id => !this.filtered.some(item => item.id === id)) } }
  },
  watch: { sourceLanguage() { this.clearSelection() }, targetLanguage() { this.clearSelection() } },
  methods: {
    clearSelection() { this.entries = this.entries.filter(item => !this.selected.includes(item.id)); this.selected = []; this.enabled = false },
    onToggle(value) { if (value) this.open() },
    open() { if (!this.sourceLanguage || !this.targetLanguage) { this.enabled = false; this.$message?.warning('请先选择源语言和目标语言'); return } this.visible = true },
    remove(id) { this.entries = this.entries.filter(item => item.id !== id); this.selected = this.selected.filter(itemId => itemId !== id) },
    removeSelected() { this.entries = this.entries.filter(item => !this.selected.includes(item.id)); this.selected = [] },
    edit(item) { this.editingId = item.id; this.form = { source: item.source, target: item.target }; this.addVisible = true },
    save() { if (!this.form.source.trim() || !this.form.target.trim()) return this.$message?.warning('请输入源语言和目标语言内容'); if (this.editingId) { const item = this.entries.find(row => row.id === this.editingId); if (item) Object.assign(item, this.form) } else this.entries.push({ id: `${Date.now()}-${Math.random()}`, ...this.form, created: new Date().toLocaleString() }); this.form = { source: '', target: '' }; this.editingId = ''; this.addVisible = false },
    importFile(event) { const file = event.target.files?.[0]; if (file) this.$message?.info(`已选择 ${file.name}，Excel解析及导入接口待接入`); event.target.value = '' },
    apply() { this.$emit('change', { enabled: this.enabled, entries: this.entries.filter(item => this.selected.includes(item.id)) }); this.visible = false }
  }
}
</script>
<style scoped lang="scss">
.dictionary {font-size:13px;color:#333}.dict-toggle{display:flex;align-items:center;gap:12px;min-height:36px}.dict-toggle button,.tools button,.tools .button,footer button{border:1px solid #e4e7ed;border-radius:4px;background:white;padding:7px 14px;cursor:pointer;color:#555}.dict-toggle button{padding:5px 12px;color:#e65d00}.mask{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;background:#0008}.mask-top{z-index:3001}.dialog,.add-dialog{width:min(760px,calc(100vw - 32px));background:white;padding:20px;border-radius:6px;box-shadow:0 8px 28px #0002}.dialog header{display:flex;justify-content:space-between;font-weight:600;margin-bottom:18px}.dialog header button{border:0;background:none;font-size:22px;color:#999;cursor:pointer}.tools{display:flex;align-items:center;gap:8px;margin-bottom:12px}.tools input:not([type=file]){height:32px;border:1px solid #e5e5e5;border-radius:4px;padding:0 10px;flex:1;min-width:80px}.tools .button{font-size:13px;text-decoration:none}.tools label input{display:none}.primary{color:white!important;background:#ed6200!important;border-color:#ed6200!important}.dialog table{width:100%;border-collapse:collapse;font-size:12px}.dialog th,.dialog td{height:35px;border:1px solid #e5e5e5;text-align:center;padding:5px}.dialog th{background:#f7f7f7;font-weight:500}.dialog input[type=checkbox]{accent-color:#ed6200}.dialog td button{color:#e65d00;border:0;background:none;cursor:pointer}.empty{height:80px;color:#999}.dialog footer,.add-dialog footer{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.add-dialog{width:min(440px,calc(100vw - 32px));padding:26px 30px}.add-dialog label{display:grid;grid-template-columns:110px 1fr;align-items:center;margin-bottom:22px;font-size:15px}.add-dialog input{height:38px;padding:0 12px;border:1px solid #e5e5e5;border-radius:5px}.add-dialog footer{justify-content:center}
</style>
