<template>
  <div class="dashboard-container">
    <div class="stats-cards">
      <el-card shadow="hover" class="card-item">
        <div class="card-content">
          <div class="meta">
            <span class="label">累计归档金额</span>
            <el-tag type="success" size="small">+12% 同比</el-tag>
          </div>
          <div class="value">¥{{ totalAmount.toFixed(2) }}</div>
          <div class="footer">共计 {{ totalCount }} 张票据</div>
        </div>
        <div class="icon-bg success">
          <el-icon><Money /></el-icon>
        </div>
      </el-card>

      <el-card shadow="hover" class="card-item">
        <div class="card-content">
          <div class="meta">
            <span class="label">本月支出</span>
            <el-tag type="warning" size="small">预算内</el-tag>
          </div>
          <div class="value">¥{{ currentMonthAmount.toFixed(2) }}</div>
          <div class="footer">最近更新: {{ lastUpdate }}</div>
        </div>
        <div class="icon-bg warning">
          <el-icon><Wallet /></el-icon>
        </div>
      </el-card>

      <el-card shadow="hover" class="card-item">
        <div class="card-content">
          <div class="meta">
            <span class="label">最高频分类</span>
          </div>
          <div class="value">{{ topCategory }}</div>
          <div class="footer">占比 {{ topCategoryPercent }}%</div>
        </div>
        <div class="icon-bg primary">
          <el-icon><PieChart /></el-icon>
        </div>
      </el-card>
    </div>

    <div class="charts-row">
      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>📊 费用类型分布</span>
          </div>
        </template>
        <div ref="pieChartRef" class="chart-box"></div>
      </el-card>

      <el-card shadow="never" class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>📈 近期报销趋势</span>
          </div>
        </template>
        <div ref="lineChartRef" class="chart-box"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { Money, Wallet, PieChart } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'

// --- 状态定义 ---
const allData = ref<any[]>([])
const pieChartRef = ref(null)
const lineChartRef = ref(null)

// --- 计算属性 (数据统计) ---
const totalAmount = computed(() => allData.value.reduce((sum, item) => sum + item.amount, 0))
const totalCount = computed(() => allData.value.length)
const currentMonthAmount = computed(() => {
  const nowStr = new Date().toISOString().slice(0, 7) // "2025-12"
  return allData.value
    .filter((item) => item.date.startsWith(nowStr))
    .reduce((sum, item) => sum + item.amount, 0)
})
const lastUpdate = computed(() => {
  if (allData.value.length === 0) return '-'
  return allData.value[0].createTime?.replace('T', ' ').slice(0, 16) || '刚刚'
})

const topCategory = ref('-')
const topCategoryPercent = ref('0')

// --- 核心逻辑 ---
onMounted(async () => {
  await fetchData()
  initCharts()
  window.addEventListener('resize', handleResize)
})

const fetchData = async () => {
  try {
    // 复用列表接口，前端计算统计
    const res = await axios.get('http://localhost:8080/api/doc/list')
    allData.value = res.data
    calculateTopCategory()
  } catch (error) {
    console.error('获取数据失败')
  }
}

const calculateTopCategory = () => {
  if (allData.value.length === 0) return
  const map: Record<string, number> = {}
  allData.value.forEach((item) => {
    map[item.category] = (map[item.category] || 0) + 1
  })
  let max = 0
  let name = ''
  for (const key in map) {
    if (map[key] > max) {
      max = map[key]
      name = key
    }
  }
  topCategory.value = name
  topCategoryPercent.value = ((max / totalCount.value) * 100).toFixed(1)
}

// --- ECharts 图表渲染 ---
let pieChart: any = null
let lineChart: any = null

const initCharts = () => {
  nextTick(() => {
    if (pieChartRef.value && lineChartRef.value) {
      renderPieChart()
      renderLineChart()
    }
  })
}

const renderPieChart = () => {
  pieChart = echarts.init(pieChartRef.value)

  // 1. 数据聚合
  const map: Record<string, number> = {}
  allData.value.forEach((item) => {
    map[item.category] = (map[item.category] || 0) + item.amount
  })
  const data = Object.keys(map).map((key) => ({ value: map[key], name: key }))

  // 2. 配置
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: '0%', left: 'center' },
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
    series: [
      {
        name: '费用分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: data,
      },
    ],
  })
}

const renderLineChart = () => {
  lineChart = echarts.init(lineChartRef.value)

  // 1. 按日期聚合
  const dateMap: Record<string, number> = {}
  allData.value.forEach((item) => {
    // 假设 date 格式为 "2025-12-09"
    dateMap[item.date] = (dateMap[item.date] || 0) + item.amount
  })
  // 排序日期
  const sortedDates = Object.keys(dateMap).sort().slice(-7) // 取最近7天
  const values = sortedDates.map((date) => dateMap[date])

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: sortedDates },
    yAxis: { type: 'value' },
    series: [
      {
        name: '报销金额',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 3, color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.5)' },
            { offset: 1, color: 'rgba(64,158,255,0.01)' },
          ]),
        },
        data: values,
      },
    ],
  })
}

const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
}
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
}

/* 顶部卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.card-item {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}
.card-content {
  z-index: 2;
  position: relative;
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.label {
  color: #909399;
  font-size: 14px;
}
.value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 12px;
  font-family: monospace;
}
.footer {
  font-size: 12px;
  color: #c0c4cc;
}

/* 图标背景装饰 */
.icon-bg {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 100px;
  opacity: 0.1;
  transform: rotate(-15deg);
}
.icon-bg.success {
  color: #67c23a;
}
.icon-bg.warning {
  color: #e6a23c;
}
.icon-bg.primary {
  color: #409eff;
}

/* 图表区 */
.charts-row {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 400px;
}
.chart-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}
.chart-header {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}
.chart-box {
  width: 100%;
  height: 350px; /* 固定高度 */
  margin-top: 10px;
}

@media (max-width: 1000px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
  .charts-row {
    flex-direction: column;
  }
}
</style>
