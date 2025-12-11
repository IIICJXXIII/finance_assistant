<template>
  <div class="analysis-container">
    <div class="content-wrapper">
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="header">
            <div class="title-box">
              <span>📊 消费行为聚类分布</span>
              <el-tag type="info" effect="plain" size="small">K-Means 算法</el-tag>
            </div>
          </div>
        </template>
        <div ref="chartRef" class="chart-box"></div>
        <div class="chart-legend">
          <div class="legend-item"><span class="dot c0"></span>群体A</div>
          <div class="legend-item"><span class="dot c1"></span>群体B</div>
          <div class="legend-item"><span class="dot c2"></span>群体C</div>
          <div class="legend-item"><span class="dot center"></span>聚类中心(质心)</div>
        </div>
      </el-card>

      <el-card shadow="hover" class="ai-card">
        <template #header>
          <div class="header">
            <div class="title-box">
              <span>🤖 AI 深度解读</span>
              <el-tag type="success" effect="dark">DeepSeek-V3</el-tag>
            </div>
            <el-button type="primary" link :loading="analyzing" @click="fetchAnalysis">
              {{ analyzing ? '分析中...' : '重新分析' }}
            </el-button>
          </div>
        </template>

        <div class="ai-content" v-loading="analyzing">
          <div v-if="!analysisText" class="empty-ai">
            <el-empty description="点击“开始分析”获取消费画像" :image-size="80" />
            <el-button type="primary" round @click="fetchAnalysis">✨ 开始 AI 智能分析</el-button>
          </div>

          <div v-else class="markdown-body">
            <div v-for="(line, index) in analysisLines" :key="index" class="text-line">
              <strong v-if="isTitle(line)">{{ line.replace(/#|\*/g, '') }}</strong>
              <span v-else>{{ line.replace(/\*/g, '') }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const chartRef = ref(null)
const analyzing = ref(false)
const analysisText = ref('')
let myChart: any = null

// 计算属性：简单的 Markdown 解析，把文本按行分割
const analysisLines = computed(() => {
  return analysisText.value.split('\n').filter((line) => line.trim() !== '')
})

const isTitle = (line: string) => {
  return line.startsWith('#') || line.includes('：') || line.length < 20
}

onMounted(async () => {
  await fetchChartData()
  // 自动触发一次分析 (可选，觉得慢可以去掉这行，让用户手动点)
  fetchAnalysis()
})

const fetchChartData = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/stats/clustering')
    if (res.data.code === 200) {
      renderChart(res.data.data)
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchAnalysis = async () => {
  analyzing.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/stats/analyze-clustering')
    if (res.data.code === 200) {
      analysisText.value = res.data.data
    }
  } catch (e) {
    ElMessage.error('AI 服务繁忙，请稍后再试')
  } finally {
    analyzing.value = false
  }
}

const renderChart = (data: any) => {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)

  const seriesData = [[], [], []]
  data.points.forEach((p: any) => {
    if (seriesData[p.clusterIndex]) seriesData[p.clusterIndex].push([p.x, p.y])
  })

  const option = {
    grid: { top: 30, right: 30, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      formatter: (param: any) => {
        if (param.seriesType === 'effectScatter') {
          return `<strong>📍 聚类中心 (典型行为)</strong><br/>日期：每月 ${param.data[0].toFixed(0)} 号左右<br/>金额：约 ¥${param.data[1].toFixed(0)}`
        }
        return `📅 日期：${param.data[0]} 号<br/>💰 金额：¥${param.data[1]}`
      },
    },
    xAxis: {
      name: '日期',
      min: 1,
      max: 31,
      splitLine: { show: false },
      nameTextStyle: { color: '#999' },
    },
    yAxis: {
      name: '金额',
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
      nameTextStyle: { color: '#999' },
    },
    series: [
      {
        name: '群体 A',
        type: 'scatter',
        symbolSize: 8,
        data: seriesData[0],
        itemStyle: { color: '#5470c6', opacity: 0.6 },
      },
      {
        name: '群体 B',
        type: 'scatter',
        symbolSize: 8,
        data: seriesData[1],
        itemStyle: { color: '#91cc75', opacity: 0.6 },
      },
      {
        name: '群体 C',
        type: 'scatter',
        symbolSize: 8,
        data: seriesData[2],
        itemStyle: { color: '#fac858', opacity: 0.6 },
      },
      // 聚类中心 (特效点)
      {
        type: 'effectScatter',
        symbolSize: 20,
        data: data.centroids.map((p: any) => [p.x, p.y]),
        itemStyle: { color: '#ff4d4f', shadowBlur: 10, shadowColor: 'rgba(255, 0, 0, 0.5)' },
        rippleEffect: { brushType: 'stroke', scale: 3 },
      },
    ],
  }
  myChart.setOption(option)
  window.addEventListener('resize', () => myChart?.resize())
}
</script>

<style scoped>
.analysis-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}
.content-wrapper {
  display: flex;
  gap: 20px;
  height: 100%;
}

/* 左侧图表 */
.chart-card {
  flex: 2;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}
.chart-box {
  width: 100%;
  height: 500px;
} /* 固定高度 */

/* 右侧 AI */
.ai-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: linear-gradient(180deg, #fff 0%, #fcfcfc 100%);
}
.ai-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-box {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 16px;
}

.chart-legend {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  justify-content: center;
  font-size: 12px;
  color: #666;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}
.c0 {
  background: #5470c6;
}
.c1 {
  background: #91cc75;
}
.c2 {
  background: #fac858;
}
.center {
  background: #ff4d4f;
  box-shadow: 0 0 4px #ff4d4f;
}

.empty-ai {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.text-line {
  margin-bottom: 8px;
}
strong {
  color: #303133;
  font-size: 15px;
}

@media (max-width: 1000px) {
  .content-wrapper {
    flex-direction: column;
  }
  .chart-box {
    height: 350px;
  }
}
</style>
