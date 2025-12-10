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
            <span class="title">归档记录</span>
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
            <el-table-column prop="date" label="开票日期" width="120" sortable />
            <el-table-column
              prop="itemName"
              label="项目名称"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="merchantName"
              label="商户名称"
              min-width="160"
              show-overflow-tooltip
            />

            <el-table-column prop="category" label="分类" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="getCategoryType(row.category)" effect="light" size="small">
                  {{ row.category }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="amount" label="金额" width="120" sortable align="right">
              <template #default="{ row }">
                <span
                  style="font-weight: bold; color: #f56c6c; font-family: monospace; font-size: 14px"
                >
                  ¥{{ Number(row.amount).toFixed(2) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column
              prop="invoiceCode"
              label="发票号码"
              width="140"
              show-overflow-tooltip
              align="center"
            />

            <el-table-column label="操作" width="140" fixed="right" align="center">
              <template #default="scope">
                <el-button size="small" link type="primary" @click="viewDetail(scope.row)">
                  详情
                </el-button>
                <el-button size="small" link type="danger" @click="handleDelete(scope.row)">
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
        <div class="detail-item">
          <label>商户名称：</label>
          <span>{{ currentRow.merchantName }}</span>
        </div>
        <div class="detail-item">
          <label>项目名称：</label>
          <span>{{ currentRow.itemName || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>发票号码：</label>
          <span>{{ currentRow.invoiceCode || '-' }}</span>
        </div>
        <div class="detail-item">
          <label>开票日期：</label>
          <span>{{ currentRow.date }}</span>
        </div>
        <div class="detail-item">
          <label>归档金额：</label>
          <span style="color: #f56c6c; font-weight: bold; font-size: 18px"
            >¥{{ Number(currentRow.amount).toFixed(2) }}</span
          >
        </div>
        <div class="detail-item">
          <label>智能分类：</label>
          <el-tag>{{ currentRow.category }}</el-tag>
        </div>
        <div class="detail-item">
          <label>创建时间：</label>
          <span style="font-size: 12px; color: #999">{{
            currentRow.createTime?.replace('T', ' ') || '刚刚'
          }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

// --- 状态定义 ---
const loading = ref(false)
const allTableData = ref<any[]>([]) // 数据库所有数据
const displayData = ref<any[]>([]) // 经过搜索过滤后的数据
const dialogVisible = ref(false)
const currentRow = ref<any>(null)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: '',
  category: '',
})

// --- 计算属性：核心分页逻辑 ---
// 1. 获取过滤后的总条数
const total = computed(() => displayData.value.length)

// 2. 切片获取当前页数据
const pagedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return displayData.value.slice(start, end)
})

// --- 方法 ---

const fetchList = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/doc/list')
    allTableData.value = res.data
    // 初始化展示数据
    handleSearch()
  } catch (error) {
    console.error(error)
    ElMessage.error('无法连接到数据库')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchList()
})

// 前端搜索逻辑
const handleSearch = () => {
  // 1. 过滤
  displayData.value = allTableData.value.filter((item) => {
    const matchName =
      !searchForm.keyword ||
      (item.merchantName && item.merchantName.includes(searchForm.keyword)) ||
      (item.itemName && item.itemName.includes(searchForm.keyword))
    const matchCat = !searchForm.category || item.category === searchForm.category
    return matchName && matchCat
  })
  // 2. 搜索后重置到第一页，防止页码溢出
  currentPage.value = 1
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  handleSearch()
}

// 分页事件处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 改变每页条数时重置到第一页
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除【${row.merchantName}】的记录吗？`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await axios.delete(`http://localhost:8080/api/doc/delete/${row.id}`)
      ElMessage.success('删除成功')
      fetchList() // 重新获取数据
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const getCategoryType = (cat: string) => {
  if (cat?.includes('餐饮')) return 'warning'
  if (cat?.includes('交通')) return 'success'
  if (cat?.includes('办公')) return 'info'
  if (cat?.includes('通讯') || cat?.includes('电子')) return 'primary'
  return ''
}

const viewDetail = (row: any) => {
  currentRow.value = row
  dialogVisible.value = true
}
</script>

<style scoped>
/* 1. 外层容器：Flex 纵向布局，占满父容器 (RouterViewBox) */
.list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 2. 搜索区：高度自然撑开 */
.search-section .el-card {
  border-radius: 8px;
  border: none;
}

/* 3. 表格区：占据剩余高度 (Flex 1) */
.table-section {
  flex: 1;
  min-height: 0; /* 关键：防止 Flex 子项内容溢出 */
  display: flex;
  flex-direction: column;
}

.table-card-wrapper {
  height: 100%; /* 卡片本身撑满 */
  border-radius: 8px;
  border: none;
  display: flex;
  flex-direction: column;
}

/* 工具栏 */
.table-toolbar {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 固定高度 */
}
.title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

/* 表格内容容器：核心 */
.table-content {
  flex: 1; /* 占据卡片中间的所有空间 */
  overflow: hidden; /* 让 el-table 处理滚动 */
  padding: 0 16px; /* 给一点左右间距 */
}

/* 分页栏：固定在底部 */
.pagination-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  background-color: #fff;
}

/* 详情样式 */
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
</style>
