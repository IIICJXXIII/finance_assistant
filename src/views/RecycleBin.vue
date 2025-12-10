<template>
  <div class="recycle-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="header">
          <div class="left">
            <span>♻️ 回收站 (Recycle Bin)</span>
            <span class="sub-text">此处的数据已被软删除，您可以还原或彻底粉碎。</span>
          </div>
          <el-button
            type="danger"
            plain
            :icon="Delete"
            @click="handleClearAll"
            :disabled="list.length === 0"
          >
            一键清空
          </el-button>
        </div>
      </template>

      <el-table :data="list" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="date" label="原开票日期" width="120" />
        <el-table-column prop="merchantName" label="商户名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="text-decoration: line-through; color: #999">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="success"
              size="small"
              :icon="RefreshLeft"
              @click="handleRestore(scope.row.id)"
            >
              还原
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="DeleteFilled"
              @click="handleDestroy(scope.row.id)"
            >
              粉碎
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="回收站是空的，很干净！" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Delete, RefreshLeft, DeleteFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const list = ref([])
const loading = ref(false)

onMounted(() => fetchList())

const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/recycle/list')
    if (res.data.code === 200) {
      list.value = res.data.data
    }
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 还原
const handleRestore = async (id: number) => {
  try {
    await axios.post(`http://localhost:8080/api/recycle/restore/${id}`)
    ElMessage.success('已还原至归档列表')
    fetchList()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 单个粉碎
const handleDestroy = (id: number) => {
  ElMessageBox.confirm('彻底删除后无法找回，确定要粉碎这条记录吗？', '永久删除', {
    type: 'warning',
    confirmButtonText: '粉碎',
    confirmButtonClass: 'el-button--danger',
  }).then(async () => {
    await axios.delete(`http://localhost:8080/api/recycle/destroy/${id}`)
    ElMessage.success('已彻底删除')
    fetchList()
  })
}

// 一键清空
const handleClearAll = () => {
  ElMessageBox.confirm('这将清空回收站所有数据，操作不可逆！', '高危操作', {
    type: 'error',
    confirmButtonText: '确认清空',
  }).then(async () => {
    await axios.delete(`http://localhost:8080/api/recycle/clear-all`)
    ElMessage.success('回收站已清空')
    fetchList()
  })
}
</script>

<style scoped>
.recycle-container {
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header span {
  font-weight: bold;
  font-size: 16px;
  margin-right: 10px;
}
.sub-text {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
