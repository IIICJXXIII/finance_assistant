<template>
  <div class="graph-container">
    <el-card shadow="never" class="graph-card">
      <template #header>
        <div class="header">
          <span>🕸️ 消费知识图谱 (Knowledge Graph)</span>
          <el-tag type="info" effect="plain">Force Directed Layout</el-tag>
        </div>
      </template>

      <div v-loading="loading" class="chart-wrapper">
        <div ref="chartRef" class="chart-box"></div>
      </div>

      <div class="tips">
        <p>💡 提示：节点大小代表消费金额，拖拽节点可以重排布局。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const chartRef = ref(null)
const loading = ref(false)
let myChart: any = null

onMounted(() => {
  fetchData()
  window.addEventListener('resize', () => myChart?.resize())
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/stats/graph')
    if (res.data.code === 200) {
      renderGraph(res.data.data)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const renderGraph = (data: any) => {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)

  const option = {
    title: { text: '', top: 'bottom', left: 'right' },
    tooltip: {
      formatter: '{b}', // 鼠标悬停显示节点名称
    },
    legend: {
      data: ['用户', '消费分类', '商户'],
      top: 20,
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        name: '消费图谱',
        type: 'graph',
        layout: 'force', // 力导向布局
        data: data.nodes,
        links: data.links,
        categories: [
          { name: '用户', itemStyle: { color: '#ee6666' } },
          { name: '消费分类', itemStyle: { color: '#5470c6' } },
          { name: '商户', itemStyle: { color: '#91cc75' } },
        ],
        roam: true, // 允许缩放和平移
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3,
        },
        force: {
          repulsion: 300, // 节点排斥力
          edgeLength: 120, // 连线长度
          gravity: 0.1,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 10 },
        },
      },
    ],
  }

  myChart.setOption(option)
}
</script>

<style scoped>
.graph-container {
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}
.graph-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  background: radial-gradient(circle, #fcfcfc 0%, #f1f3f5 100%); /* 增加一点科技感背景 */
}

.chart-box {
  width: 100%;
  height: 100%;
}

.tips {
  padding: 10px 20px;
  font-size: 12px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
