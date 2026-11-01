<template>
  <div class="dictionary">
    <div class="dict-toggle"><span>翻译词典</span>
      <el-switch v-model="enabled" active-color="#ff7a00" @change="onToggle"/>
      <button v-if="enabled" type="button" @click="open">设置</button>
    </div>
    <div v-if="visible" class="mask" @click.self="visible=false">
      <section class="dialog">
        <header>
          <span></span>
          <button class="close-button" type="button" aria-label="关闭翻译词典" @click="visible=false">×</button>
        </header>
        <div class="tools"><input v-model.trim="keyword" placeholder="输入关键词搜索" @keyup.enter="loadEntries">
          <button class="tool-button" type="button" @click="loadEntries">搜索</button>
          <button class="tool-button primary" type="button" @click="addVisible=true">添加</button>
          <label class="button tool-button">Excel导入<input type="file" accept=".xlsx" @change="importFile"></label><a
            class="template-link" href="/翻译字典模板.xlsx" download>模版下载</a></div>
        <table>
          <thead>
          <tr>
            <th><input v-model="allChecked" type="checkbox"></th>
            <th>源语言（{{ sourceName || '中文' }}）</th>
            <th>目标语言（{{ targetName || '英文' }}）</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in filtered" :key="item.id">
            <td><input v-model="selected" type="checkbox" :value="item.id"></td>
            <td>{{ item.source }}</td>
            <td>{{ item.target }}</td>
            <td>
              <button class="row-action" @click="edit(item)">编辑</button>
              <button class="row-action" @click="confirmRemove(item.id)">删除</button>
            </td>
          </tr>
          <tr v-if="loading || !filtered.length">
            <td colspan="4" class="empty">{{ loading ? '加载中…' : '暂无词条' }}</td>
          </tr>
          </tbody>
        </table>
        <footer>
          <button @click="confirmRemoveSelected">批量删除</button>
          <button class="primary" @click="apply">使用</button>
        </footer>
      </section>
    </div>
    <div v-if="addVisible" class="mask mask-top" @click.self="addVisible=false">
      <section class="add-dialog"><label>源语言（{{ sourceName || '中文' }}）：<input v-model="form.source"
                                                                                   placeholder="请输入内容"></label><label>目标语言（{{
          targetName || '英文'
        }}）：<input v-model="form.target" placeholder="请输入内容"></label>
        <footer>
          <button type="button" @click="cancelAdd">取消</button>
          <button class="primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
        </footer>
      </section>
    </div>
  </div>
</template>
<script>
import {addTranslationDictionary, deleteTranslationDictionary, fetchTranslationDictionaryList, updateTranslationDictionary} from '@/api/project'
import * as XLSX from 'xlsx'

export default {
  name: 'TranslationDictionary',
  props: {
    sourceLanguage: {type: String, default: ''},
    targetLanguage: {type: String, default: ''},
    languages: {type: Array, default: () => []},
    sharedState: {type: Object, required: true}
  },
  data: () => ({
    visible: false,
    addVisible: false,
    saving: false,
    loading: false,
    keyword: '',
    editingId: '',
    originalForm: {source: '', target: ''},
    form: {source: '', target: ''}
  }),
  computed: {
    enabled: {
      get() {
        return this.sharedState.enabled
      },
      set(value) {
        this.$set(this.sharedState, 'enabled', value)
      }
    },
    entries: {
      get() {
        return this.sharedState.entries
      },
      set(value) {
        this.$set(this.sharedState, 'entries', value)
      }
    },
    selected: {
      get() {
        return this.sharedState.selected
      },
      set(value) {
        this.$set(this.sharedState, 'selected', value)
      }
    },
    sourceName() {
      return this.languages.find(item => item.code === this.sourceLanguage)?.name || ''
    },
    targetName() {
      return this.languages.find(item => item.code === this.targetLanguage)?.name || ''
    },
    filtered() {
      return this.entries
    },
    allChecked: {
      get() {
        return this.filtered.length > 0 && this.filtered.every(item => this.selected.includes(item.id))
      }, set(value) {
        this.selected = value ? [...new Set([...this.selected, ...this.filtered.map(item => item.id)])] : this.selected.filter(id => !this.filtered.some(item => item.id === id))
      }
    }
  },
  watch: {
    sourceLanguage() {
      this.clearSelection();
      if (this.visible) this.loadEntries()
    },
    targetLanguage() {
      this.clearSelection();
      if (this.visible) this.loadEntries()
    }
  },
  methods: {
    clearSelection() {
      this.selected = [];
      this.enabled = false
    },
    onToggle(value) {
      if (value && (!this.sourceLanguage || !this.targetLanguage)) {
        this.enabled = false
        this.$message?.warning('请先选择源语言和目标语言')
      }
    },
    open() {
      if (!this.sourceLanguage || !this.targetLanguage) {
        this.enabled = false;
        this.$message?.warning('请先选择源语言和目标语言');
        return
      }
      this.visible = true
      this.loadEntries()
    },
    async loadEntries() {
      if (!this.sourceLanguage || !this.targetLanguage) return
      this.loading = true
      try {
        const response = await fetchTranslationDictionaryList({
          fromLangCode: this.sourceLanguage,
          destLangCode: this.targetLanguage,
          keyword: this.keyword
        })
        const list = response?.data?.list || response?.list || []
        this.entries = list.map(item => ({
          id: item.id,
          source: item.fromTerm || '',
          target: item.destTerm || '',
          created: item.created || ''
        }))
        this.selected = []
      } catch (error) {
        this.$message?.error(error.message || '获取词典列表失败')
      } finally {
        this.loading = false
      }
    },
    confirmRemove(id) {
      this.$confirm('确定要删除这条词条吗？', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => this.remove(id)).catch(() => {})
    },
    async remove(id) {
      try {
        await deleteTranslationDictionary(String(id))
        this.entries = this.entries.filter(item => item.id !== id)
        this.selected = this.selected.filter(itemId => itemId !== id)
      } catch (error) {
        this.$message?.error(error.message || '删除词条失败')
      }
    },
    confirmRemoveSelected() {
      if (!this.selected.length) return this.$message?.warning('请先选择要删除的词条')
      this.$confirm(`确定要删除选中的 ${this.selected.length} 条词条吗？`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => this.removeSelected()).catch(() => {})
    },
    async removeSelected() {
      if (!this.selected.length) return this.$message?.warning('请先选择要删除的词条')
      try {
        await deleteTranslationDictionary(this.selected.join(','))
        this.entries = this.entries.filter(item => !this.selected.includes(item.id))
        this.selected = []
      } catch (error) {
        this.$message?.error(error.message || '批量删除词条失败')
      }
    },
    edit(item) {
      this.editingId = item.id;
      this.originalForm = {source: item.source, target: item.target};
      this.form = {...this.originalForm};
      this.addVisible = true
    },
    cancelAdd() {
      this.addVisible = false;
      this.editingId = '';
      this.originalForm = {source: '', target: ''};
      this.form = {source: '', target: ''}
    },
    async save() {
      const source = this.form.source.trim()
      const target = this.form.target.trim()
      if (!source || !target) return this.$message?.warning('请输入源语言和目标语言内容')
      if (this.editingId && source === this.originalForm.source && target === this.originalForm.target) {
        this.cancelAdd()
        return
      }
      if (!this.sourceLanguage || !this.targetLanguage) return this.$message?.warning('请先选择源语言和目标语言')
      this.saving = true
      try {
        if (this.editingId) {
          const payload = {id: this.editingId}
          if (source !== this.originalForm.source) payload.fromTerm = source
          if (target !== this.originalForm.target) payload.destTerm = target
          await updateTranslationDictionary(payload)
        } else {
          await addTranslationDictionary({
            fromLangCode: this.sourceLanguage,
            destLangCode: this.targetLanguage,
            termListStr: JSON.stringify([{fromTerm: source, destTerm: target}])
          })
        }
        await this.loadEntries()
        this.form = {source: '', target: ''}
        this.editingId = ''
        this.addVisible = false
      } catch (error) {
        this.$message?.error(error.message || '词条保存失败')
      } finally {
        this.saving = false
      }
    },
    async importFile(event) {
      const input = event.target
      const file = input.files?.[0]
      if (!file) return
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        this.$message?.warning('仅支持导入 .xlsx 文件')
        input.value = ''
        return
      }
      if (!this.sourceLanguage || !this.targetLanguage) {
        this.$message?.warning('请先选择源语言和目标语言')
        input.value = ''
        return
      }
      this.saving = true
      try {
        const workbook = XLSX.read(await file.arrayBuffer(), {type: 'array'})
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('Excel文件中没有工作表')
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1, raw: false, defval: ''})
        const terms = rows.slice(1)
          .map(row => ({fromTerm: String(row[0] ?? '').trim(), destTerm: String(row[1] ?? '').trim()}))
          .filter(item => item.fromTerm && item.destTerm)
        if (!terms.length) {
          this.$message?.warning('没有可导入的词条，请检查表格前两列数据')
          return
        }
        await addTranslationDictionary({
          fromLangCode: this.sourceLanguage,
          destLangCode: this.targetLanguage,
          termListStr: JSON.stringify(terms)
        })
        await this.loadEntries()
        this.$message?.success(`成功导入 ${terms.length} 条词条`)
      } catch (error) {
        this.$message?.error(error.message || 'Excel导入失败')
      } finally {
        this.saving = false
        input.value = ''
      }
    },
    apply() {
      this.$emit('change', {
        enabled: this.enabled,
        entries: this.entries.filter(item => this.selected.includes(item.id))
      });
      this.visible = false
    }
  }
}
</script>
<style scoped lang="scss">
.dictionary {
  font-size: 13px;
  color: #333
}

.dict-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px
}

.dict-toggle button, .tools button, .tools .button, footer button {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
  padding: 7px 14px;
  cursor: pointer;
  color: #555
}

.dict-toggle button {
  padding: 5px 12px;
  color: #e65d00
}

.mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0008
}

.mask-top {
  z-index: 3001
}

.dialog, .add-dialog {
  width: min(760px, calc(100vw - 32px));
  background: white;
  padding: 10px 20px 20px 20px;
  border-radius: 6px;
  box-shadow: 0 8px 28px #0002
}

.dialog header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 18px
}

.dialog header .close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  color: #999;
  cursor: pointer
}

.dialog header .close-button:hover {
  background: #f5f5f5;
  color: #333
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px
}

.tools input:not([type=file]) {
  box-sizing: border-box;
  height: 32px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 0 10px;
  flex: 1;
  min-width: 80px
}

.tools .tool-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  line-height: 1;
}

.tools .button {
  text-decoration: none
}

.tools .template-link {
  color: #ed6200;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap
}

.tools label input {
  display: none
}

.primary {
  color: white !important;
  background: #ed6200 !important;
  border-color: #ed6200 !important
}

.dialog table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px
}

.dialog th, .dialog td {
  height: 35px;
  border: 1px solid #e5e5e5;
  text-align: center;
  padding: 5px
}

.dialog th {
  background: #f7f7f7;
  font-weight: 500
}

.dialog input[type=checkbox] {
  accent-color: #ed6200
}

.dialog td button {
  color: #e65d00;
  border: 0;
  background: none;
  cursor: pointer
}

.dialog td .row-action + .row-action {
  margin-left: 32px
}

.empty {
  height: 80px;
  color: #999
}

.dialog footer, .add-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px
}

.add-dialog {
  width: min(520px, calc(100vw - 32px));
  padding: 26px 30px
}

.add-dialog label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  font-size: 15px;
  white-space: nowrap
}

.add-dialog input {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e5e5e5;
  border-radius: 5px
}

.add-dialog footer {
  justify-content: flex-end;
  gap: 24px
}
</style>
