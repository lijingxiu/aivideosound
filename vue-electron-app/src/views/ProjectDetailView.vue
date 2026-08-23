<template>
  <AppLayout>
    <div class="detail-page">
      <div class="detail-head">
        <button class="back" @click="$router.back()">‹</button>
        <strong>当前项目名称{{ project.name }}</strong>
        <span>语音识别</span><span>角色识别</span><span>字幕擦除</span>
        <b>有效期剩余{{ project.validDays }}天</b>
      </div>
      <div class="tabs"><button :class="{active: tab === 'materials'}" @click="tab = 'materials'">素材管理</button><button :class="{active: tab === 'dub'}" @click="tab = 'dub'">译制管理</button></div>
      <section v-if="tab === 'materials'" class="content-card">
        <div class="toolbar">
          <button class="orange-outline">上传素材</button><button>批量导出</button><button>批量删除</button><button class="orange-outline">新增译制</button>
          <input v-model="keyword" placeholder="输入名称查找"><select v-model="statusFilter"><option value="">全部状态</option><option>进行中</option><option>成功</option><option>失败</option></select><select><option>全部校对</option></select><select><option>按名称升序</option></select><button>刷新</button>
        </div>
        <table><thead><tr><th><input type="checkbox"></th><th>名称</th><th>时长</th><th>人声背景音分离</th><th>字幕识别</th><th>角色识别</th><th>字幕擦除</th><th>状态</th><th>校对</th><th>创建时间</th><th>更新时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredMaterials" :key="item.id"><td><input type="checkbox"></td><td>{{ item.name }}</td><td>{{ item.duration }}</td><td :class="item.vocal==='成功'?'success':''">{{ item.vocal }}</td><td :class="item.subtitle==='成功'?'success':item.subtitle==='失败'?'fail':''">{{ item.subtitle }}</td><td>{{ item.role }}</td><td :class="item.erase==='成功'?'success':''">{{ item.erase }}</td><td :class="item.status==='成功'?'success':item.status==='失败'?'fail':''">{{ item.status }}</td><td :class="item.checked?'success':''">{{ item.checked ? '已校对' : '未校对' }}</td><td>{{ item.created }}</td><td>{{ item.updated }}</td><td class="actions"><button @click="$router.push({name:'video-edit',params:{projectId:$route.params.id,videoId:item.id}})">编辑</button>&nbsp; 导出&nbsp; •••</td></tr></tbody></table>
      </section>
      <section v-else class="empty-tab">暂无译制任务</section>
    </div>
  </AppLayout>
</template>
<script>
import AppLayout from '@/components/layout/AppLayout.vue'
const MATERIALS = [
  { id: 1, name: 'xxx.mp4', duration: "4'23''", vocal: '—', subtitle: '进行中', role: '—', erase: '—', status: '进行中', checked: false },
  { id: 2, name: 'xxx.mp4', duration: "25'22''", vocal: '—', subtitle: '成功', role: '—', erase: '成功', status: '成功', checked: true },
  { id: 3, name: 'xxx.mp4', duration: "89'23''", vocal: '成功', subtitle: '失败', role: '未开始', erase: '未开始', status: '失败', checked: false },
  { id: 4, name: 'xxx.mp4', duration: "39''", vocal: '成功', subtitle: '成功', role: '失败', erase: '未开始', status: '终止', checked: false }
].map(item => ({ ...item, created: '2026-10-32 12:22', updated: '2026-10-32 12:22' }))
export default { name: 'ProjectDetailView', components: { AppLayout }, data: () => ({ tab: 'materials', keyword: '', statusFilter: '', materials: MATERIALS }), computed: { project() { return { name: this.$route.params.id || 'XXXXXX', validDays: 2 } }, filteredMaterials() { return this.materials.filter(item => (!this.keyword || item.name.includes(this.keyword)) && (!this.statusFilter || item.status === this.statusFilter)) } } }
</script>
<style scoped lang="scss">.detail-page{height:100%;display:flex;flex-direction:column}.detail-head{height:58px;display:flex;align-items:center;gap:10px;font-size:16px}.detail-head .back{font-size:36px;color:#888;margin-right:20px}.detail-head span{color:#aaa}.detail-head b{margin-left:auto;padding:13px 38px;background:#fafafa;color:#ff7a00;font-weight:400}.tabs{display:flex;width:560px;background:#fafafa}.tabs button{width:280px;height:56px;color:#999;font-size:16px}.tabs button.active{background:#fff;border-radius:8px;box-shadow:0 2px 8px #ddd;color:#333}.content-card{margin-top:10px;border:3px solid #2e92ff;padding:28px 16px 52px;overflow:auto}.toolbar{display:flex;align-items:center;gap:18px;margin-bottom:18px}.toolbar button,.toolbar select,.toolbar input{height:42px;border:1px solid #ddd;background:#fff;padding:0 18px;font-size:14px;white-space:nowrap}.toolbar input{width:190px}.toolbar .orange-outline{border-color:#ff6b00;color:#ed6200}.toolbar select{width:145px}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{border:1px solid #ddd;padding:14px 12px;text-align:center;font-size:14px}th{background:#dcdfe3;font-weight:500}td:first-child,th:first-child{width:32px}.success{color:#35bd2b}.fail{color:#ff4d4f}.actions{color:#999}.empty-tab{margin-top:10px;flex:1;border:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999}@media(max-width:1200px){.toolbar{flex-wrap:wrap}.content-card{padding:18px 10px}.detail-head b{padding:10px}}</style>
