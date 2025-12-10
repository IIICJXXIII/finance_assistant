<template>
  <div class="approval-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="header">
          <div class="left">
            <span>⚖️ 审批工作台 (Approval Workbench)</span>
            <el-tag
              type="danger"
              effect="dark"
              round
              style="margin-left: 10px"
              v-if="list.length > 0"
            >
              {{ list.length }} 待处理
            </el-tag>
          </div>
          <el-button @click="fetchPending" icon="Refresh">刷新列表</el-button>
        </div>
      </template>

      <el-empty v-if="list.length === 0" description="暂无待审核申请，去喝杯咖啡吧 ☕️" />

      <div v-else class="task-grid">
        <el-card v-for="item in list" :key="item.id" shadow="hover" class="task-card">
          <div class="card-top">
            <div class="user-badge">申请人 ID: {{ item.userId }}</div>
            <div class="date">{{ item.date }}</div>
          </div>

          <div class="card-body">
            <div class="amount">¥{{ item.amount.toFixed(2) }}</div>
            <div class="merchant">{{ item.merchantName }}</div>
            <div class="item-name">{{ item.itemName }}</div>
            <el-tag size="small" class="category-tag">{{ item.category }}</el-tag>

            <div v-if="item.isAnomaly === 1" class="anomaly-alert">
              <el-icon><Warning /></el-icon> 系统风控预警：金额异常
            </div>
          </div>

          <div class="card-footer">
            <el-button type="success" plain @click="handlePass(item.id)">通过</el-button>
            <el-button type="danger" plain @click="openReject(item)">驳回</el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="rejectVisible" title="填写驳回原因" width="400px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        placeholder="例如：发票模糊、不符合报销规定..."
        :rows="3"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const list = ref<any[]>([])
const rejectVisible = ref(false)
const rejectReason = ref('')
const currentItem = ref<any>(null)

onMounted(() => fetchPending())

const fetchPending = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/audit/pending-list')
    if (res.data.code === 200) {
      list.value = res.data.data
    } else if (res.data.code === 403) {
      ElMessage.warning('您不是管理员，无法查看审批台')
    }
  } catch (e) {
    console.error(e)
  }
}

const handlePass = async (id: number) => {
  try {
    const res = await axios.post(`http://localhost:8080/api/audit/pass/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('已批准')
      fetchPending() // 刷新列表
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const openReject = (item: any) => {
  currentItem.value = item
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value) return ElMessage.warning('请填写原因')
  try {
    const res = await axios.post(`http://localhost:8080/api/audit/reject/${currentItem.value.id}`, {
      reason: rejectReason.value,
    })
    if (res.data.code === 200) {
      ElMessage.success('已驳回')
      rejectVisible.value = false
      fetchPending()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.approval-container {
  padding: 24px;
  height: 100%;
  box-sizing: border-box;
}
.main-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header .left {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.task-card {
  border: none;
  border-radius: 8px;
  transition: transform 0.2s;
}
.task-card:hover {
  transform: translateY(-3px);
}

.card-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}
.user-badge {
  background: #e9e9eb;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-body {
  text-align: center;
  margin-bottom: 15px;
}
.amount {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}
.merchant {
  font-weight: 500;
  font-size: 15px;
}
.item-name {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}
.category-tag {
  margin-bottom: 8px;
}

.anomaly-alert {
  background: #fef0f0;
  color: #f56c6c;
  font-size: 12px;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.card-footer {
  display: flex;
  gap: 10px;
}
.card-footer .el-button {
  flex: 1;
}
</style>
