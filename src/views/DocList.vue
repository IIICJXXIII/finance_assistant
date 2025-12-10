<template>
  <div class="list-container">
    <div class="search-section">
      <el-card shadow="hover" :body-style="{ padding: '18px 20px 0 20px' }">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="商户名称">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索商户/项目..."
              prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-select
              v-model="searchForm.category"
              placeholder="全部类型"
              clearable
              @change="handleSearch"
              style="width: 140px"
            >
              <el-option label="餐饮美食" value="餐饮美食" />
              <el-option label="交通出行" value="交通出行" />
              <el-option label="办公耗材" value="办公耗材" />
              <el-option label="通讯网络" value="通讯网络" />
              <el-option label="电子设备" value="电子设备" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" icon="Search">查询</el-button>
            <el-button @click="resetSearch" icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="table-section">
      <el-card
        shadow="never"
        class="table-card-wrapper"
        :body-style="{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }"
      >
        <div class="table-toolbar">
          <div class="left-panel">
            <span class="title">🗂️ 归档记录</span>
            <el-tag type="info" size="small" effect="plain" style="margin-left: 8px">
              共 {{ total }} 条
            </el-tag>
          </div>
          <el-button type="primary" size="small" @click="$router.push('/upload')" icon="Plus">
            新增归档
          </el-button>
        </div>

        <div class="table-content">
          <el-table
            :data="pagedTableData"
            style="width: 100%; height: 100%"
            v-loading="loading"
            stripe
            highlight-current-row
          >
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="date" label="开票日期" width="110" sortable />
            <el-table-column
              prop="itemName"
              label="项目名称"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column
              prop="merchantName"
              label="商户名称"
              min-width="150"
              show-overflow-tooltip
            />

            <el-table-column prop="category" label="分类" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)" effect="light" size="small">
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="金额" width="130" sortable align="right">
              <template #default="{ row }">
                <div
                  style="display: flex; align-items: center; justify-content: flex-end; gap: 6px"
                >
                  <span
                    style="font-weight: bold; font-family: monospace; font-size: 14px"
                    :style="{ color: row.isAnomaly === 1 ? '#F56C6C' : '#303133' }"
                  >
                    ¥{{ Number(row.amount).toFixed(2) }}
                  </span>
                  <el-tooltip
                    v-if="row.isAnomaly === 1"
                    content="⚠️ 智能审计：该笔金额显著偏离您的历史消费习惯。"
                    placement="top"
                  >
                    <el-icon color="#F56C6C" class="shaking-icon" :size="16"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>

            <el-table-column
              prop="invoiceCode"
              label="发票号码"
              width="130"
              show-overflow-tooltip
              align="center"
            />

            <el-table-column label="操作" width="180" fixed="right" align="center">
              <template #default="scope">
                <el-button
                  size="small"
                  link
                  type="primary"
                  icon="View"
                  @click="viewDetail(scope.row)"
                >
                  详情
                </el-button>
                <el-button
                  size="small"
                  link
                  type="primary"
                  icon="Edit"
                  @click="handleEdit(scope.row)"
                >
                  修改
                </el-button>
                <el-button
                  size="small"
                  link
                  type="danger"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-footer">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="🧾 票据详情" width="450px" align-center>
      <div v-if="currentRow" class="detail-content">
        <el-alert
          v-if="currentRow.isAnomaly === 1"
          title="风险预警：金额异常"
          type="error"
          description="该发票金额远超同类目平均水平。"
          show-icon
          :closable="false"
          style="margin-bottom: 15px"
        />
        <div class="detail-item">
          <label>商户名称：</label><span>{{ currentRow.merchantName }}</span>
        </div>
        <div class="detail-item">
          <label>项目名称：</label><span>{{ currentRow.itemName || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>发票号码：</label><span>{{ currentRow.invoiceCode || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>开票日期：</label><span>{{ currentRow.date }}</span>
        </div>
        <div class="detail-item">
          <label>归档金额：</label
          ><span style="font-weight: bold">¥{{ Number(currentRow.amount).toFixed(2) }}</span>
        </div>
        <div class="detail-item">
          <label>智能分类：</label><el-tag>{{ currentRow.category }}</el-tag>
        </div>
        <div class="detail-item">
          <label>创建时间：</label
          ><span style="color: #999">{{ currentRow.createTime?.replace('T', ' ') }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="✏️ 修改归档信息" width="500px" align-center>
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="商户名称">
          <el-input v-model="editForm.merchantName" />
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="editForm.itemName" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" style="width: 100%">
            <el-option label="餐饮美食" value="餐饮美食" />
            <el-option label="交通出行" value="交通出行" />
            <el-option label="办公耗材" value="办公耗材" />
            <el-option label="通讯网络" value="通讯网络" />
            <el-option label="电子设备" value="电子设备" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input-number
                v-model="editForm.amount"
                :precision="2"
                :step="0.1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日期">
              <el-date-picker
                v-model="editForm.date"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="发票号码">
          <el-input v-model="editForm.invoiceCode" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * DocList.vue - 归档记录列表页面
 *
 * 功能概述:
 * 1. 展示所有已归档的票据记录
 * 2. 支持按关键词和分类搜索筛选
 * 3. 提供查看详情、修改、删除操作
 * 4. 支持分页浏览大量数据
 * 5. 显示 AI 异常检测预警标记
 */

import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Plus, Refresh, Warning, View, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// ===== 状态定义 =====
const loading = ref(false) // 加载状态
const allTableData = ref<any[]>([]) // 全部数据 (从后端获取)
const displayData = ref<any[]>([]) // 展示数据 (筛选后)
const dialogVisible = ref(false) // 详情弹窗显示状态
const currentRow = ref<any>(null) // 当前选中的行数据

// --- 修改功能相关状态 ---
const editDialogVisible = ref(false) // 修改弹窗显示状态
const editLoading = ref(false) // 修改提交加载状态

// 修改表单数据
const editForm = reactive({
  id: 0,
  merchantName: '',
  itemName: '',
  category: '',
  amount: 0,
  date: '',
  invoiceCode: '',
  // 保留其他不需要修改但需要回传的字段
  userId: 0,
  createTime: '',
})

// --- 分页状态 ---
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页条数

// 搜索表单数据
const searchForm = reactive({ keyword: '', category: '' })

// ===== 计算属性 =====

/** 总记录数 */
const total = computed(() => displayData.value.length)

/** 当前页显示的数据 (前端分页) */
const pagedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return displayData.value.slice(start, end)
})

// ===== 方法定义 =====

/**
 * 获取归档列表数据
 * 从后端 API 获取所有归档记录
 */
const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/doc/list')
    allTableData.value = res.data
    // 获取数据后触发搜索筛选
    handleSearch()
  } catch (error) {
    ElMessage.error('无法连接到数据库')
  } finally {
    loading.value = false
  }
}

/** 组件挂载时获取数据 */
onMounted(() => {
  fetchList()
})

/**
 * 搜索筛选
 * 根据关键词和分类过滤数据
 */
const handleSearch = () => {
  displayData.value = allTableData.value.filter((item) => {
    // 关键词匹配: 商户名称或项目名称包含搜索词
    const matchName =
      !searchForm.keyword ||
      (item.merchantName && item.merchantName.includes(searchForm.keyword)) ||
      (item.itemName && item.itemName.includes(searchForm.keyword))
    // 分类匹配
    const matchCat = !searchForm.category || item.category === searchForm.category
    return matchName && matchCat
  })
  // 搜索后重置到第一页
  currentPage.value = 1
}

/** 重置搜索条件 */
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  handleSearch()
}

// --- 分页事件处理 ---

/** 每页条数变化 */
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

/** 当前页变化 */
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// --- 操作方法 ---

/** 查看详情 */
const viewDetail = (row: any) => {
  currentRow.value = row
  dialogVisible.value = true
}

/**
 * 点击修改按钮
 * 将当前行数据复制到编辑表单
 */
const handleEdit = (row: any) => {
  // 使用 Object.assign 浅拷贝，防止修改表单时直接影响表格显示
  Object.assign(editForm, row)
  editDialogVisible.value = true
}

/**
 * 提交修改
 * 调用后端保存接口 (JPA 的 save 方法: 有ID就是更新，无ID就是新增)
 */
const submitEdit = async () => {
  editLoading.value = true
  try {
    const res = await axios.post('http://localhost:8080/api/doc/save', editForm)
    if (res.data === 'success') {
      ElMessage.success('修改成功')
      editDialogVisible.value = false
      fetchList() // 刷新列表
    } else {
      ElMessage.error('修改失败：' + res.data)
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    editLoading.value = false
  }
}

/**
 * 删除记录
 * 弹出确认框后调用删除接口
 */
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除【${row.merchantName}】的记录吗？`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await axios.delete(`http://localhost:8080/api/doc/delete/${row.id}`)
      ElMessage.success('删除成功')
      fetchList() // 刷新列表
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

/**
 * 获取分类标签样式
 * 根据分类名称返回对应的 Element Plus Tag 类型
 */
const getCategoryType = (cat: string) => {
  if (cat?.includes('餐饮')) return 'warning'
  if (cat?.includes('交通')) return 'success'
  if (cat?.includes('办公')) return 'info'
  if (cat?.includes('通讯') || cat?.includes('电子')) return 'primary'
  return ''
}
</script>

<style scoped>
.list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.search-section .el-card {
  border-radius: 8px;
  border: none;
}
.table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.table-card-wrapper {
  height: 100%;
  border-radius: 8px;
  border: none;
  display: flex;
  flex-direction: column;
}
.table-toolbar {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}
.table-content {
  flex: 1;
  overflow: hidden;
  padding: 0 16px;
}
.pagination-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  background-color: #fff;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  align-items: baseline;
  border-bottom: 1px dashed #f2f2f2;
  padding-bottom: 8px;
}
.detail-item label {
  width: 90px;
  text-align: right;
  color: #909399;
  font-weight: 500;
  margin-right: 12px;
}
.detail-item span {
  color: #303133;
  font-size: 15px;
  flex: 1;
}

.shaking-icon {
  animation: shake 2s infinite;
  cursor: help;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}
</style>
