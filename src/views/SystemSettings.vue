<template>
  <div class="settings-container">
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-header">
          <span>🛡️ 数据灾备与安全</span>
        </div>
      </template>

      <div class="backup-area">
        <div class="action-box">
          <div class="icon-wrapper bg-blue">
            <el-icon :size="24" color="#409EFF"><Download /></el-icon>
          </div>
          <div class="text">
            <h4>数据备份</h4>
            <p>将您的发票、预算、聊天记录打包为 JSON 文件下载到本地。</p>
          </div>
          <el-button type="primary" @click="handleBackup">立即备份</el-button>
        </div>

        <div class="divider"></div>

        <div class="action-box">
          <div class="icon-wrapper bg-green">
            <el-icon :size="24" color="#67C23A"><Upload /></el-icon>
          </div>
          <div class="text">
            <h4>数据恢复</h4>
            <p>上传之前的备份文件，系统将合并恢复您的数据。</p>
          </div>
          <el-upload
            action="#"
            :show-file-list="false"
            :http-request="handleRestore"
            accept=".json"
          >
            <el-button type="success" :loading="restoreLoading">上传恢复</el-button>
          </el-upload>
        </div>
      </div>
    </el-card>

    <el-card
      shadow="never"
      class="section-card"
      style="margin-top: 20px; flex: 1; display: flex; flex-direction: column"
    >
      <template #header>
        <div class="card-header">
          <span>📜 操作审计日志 (Audit Log)</span>
          <el-button type="text" @click="fetchLogs" icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="logs" style="width: 100%; flex: 1" height="100%" stripe>
        <el-table-column prop="createTime" label="时间" width="180">
          <template #default="{ row }">
            {{ row.createTime?.replace('T', ' ') }}
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getOpType(row.operation)">{{ row.operation }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, Upload, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const logs = ref([])
const restoreLoading = ref(false)

onMounted(() => {
  fetchLogs()
})

const fetchLogs = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/system/logs')
    if (res.data.code === 200) {
      logs.value = res.data.data
    }
  } catch (e) {}
}

// 备份
const handleBackup = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/system/backup', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `SmartDoc_Backup_${new Date().getTime()}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('备份已下载')
    fetchLogs() // 刷新日志
  } catch (e) {
    ElMessage.error('备份失败')
  }
}

// 恢复
const handleRestore = async (options: any) => {
  ElMessageBox.confirm('恢复操作将把备份文件中的数据追加到当前账户，确定继续吗？', '风险提示', {
    confirmButtonText: '确定恢复',
    type: 'warning',
  })
    .then(async () => {
      restoreLoading.value = true
      const formData = new FormData()
      formData.append('file', options.file)

      try {
        const res = await axios.post('http://localhost:8080/api/system/restore', formData)
        if (res.data.code === 200) {
          ElMessage.success('数据恢复成功！')
          fetchLogs()
        } else {
          ElMessage.error(res.data.msg)
        }
      } catch (e) {
        ElMessage.error('上传失败')
      } finally {
        restoreLoading.value = false
      }
    })
    .catch(() => {})
}

const getOpType = (op: string) => {
  if (op.includes('删除')) return 'danger'
  if (op.includes('恢复') || op.includes('备份')) return 'warning'
  return 'info'
}
</script>

<style scoped>
.settings-container {
  padding: 24px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.card-header {
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 强制让 table 自适应填满剩余空间 */
:deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.backup-area {
  display: flex;
  align-items: center;
  padding: 10px 0;
}
.action-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 20px;
}
.divider {
  width: 1px;
  height: 60px;
  background: #eee;
  margin: 0 20px;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-blue {
  background: #ecf5ff;
}
.bg-green {
  background: #f0f9eb;
}

.text h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}
.text p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
</style>
