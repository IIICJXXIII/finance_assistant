<template>
  <div class="calendar-container">
    <el-card shadow="never" class="calendar-card">
      <template #header>
        <div class="header">
          <span>📅 财务日历</span>
          <div class="legend">
            <span class="dot normal"></span> 正常 <span class="dot anomaly"></span> 异常预警
          </div>
        </div>
      </template>

      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div
            class="custom-cell"
            :class="{ 'has-data': getDayData(data.day).count > 0 }"
            @click.stop="handleDateClick(data.day)"
          >
            <div class="date-num">
              {{ data.day.split('-').slice(2).join('') }}
              <span v-if="getDayData(data.day).hasAnomaly" class="anomaly-mark">●</span>
            </div>

            <div v-if="getDayData(data.day).count > 0" class="date-content">
              <div class="amount">¥{{ getDayData(data.day).total.toFixed(0) }}</div>
              <div class="count">{{ getDayData(data.day).count }}笔</div>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="400px">
      <div v-if="selectedDayList.length === 0" class="empty-drawer">
        <el-empty description="当天无消费记录" />
      </div>

      <div v-else class="drawer-list">
        <el-card
          v-for="item in selectedDayList"
          :key="item.id"
          class="mini-card"
          shadow="hover"
          :class="{ 'card-anomaly': item.isAnomaly === 1 }"
        >
          <div class="mini-header">
            <span class="merchant">{{ item.merchantName }}</span>
            <span class="money">¥{{ item.amount }}</span>
          </div>
          <div class="mini-body">
            <el-tag size="small" effect="plain">{{ item.category }}</el-tag>
            <span class="item-name">{{ item.itemName }}</span>
          </div>
          <div v-if="item.isAnomaly === 1" class="anomaly-tip">⚠️ 异常大额消费</div>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * FinanceCalendar.vue - 财务日历页面
 *
 * 功能概述:
 * 1. 日历视图展示每日消费概况
 * 2. 点击日期查看当日消费明细
 * 3. 异常消费标记预警
 *
 * 核心算法:
 * - 数据映射: 将列表数据转换为日期索引的 Map 结构
 * - 前端数据清洗: 在 computed 中实现数据聚合
 */

import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// ===== 响应式状态 =====
const currentDate = ref(new Date()) // 日历当前日期
const allData = ref<any[]>([]) // 全部归档数据
const drawerVisible = ref(false) // 抽屉显示状态
const selectedDay = ref('') // 选中的日期

// ===== 初始化 =====
onMounted(async () => {
  try {
    // 复用列表接口获取全量数据
    const res = await axios.get('http://localhost:8080/api/doc/list')
    // 兼容两种返回格式: 直接返回 List 或 Result 包装
    if (res.data.code === 200 || Array.isArray(res.data)) {
      allData.value = Array.isArray(res.data) ? res.data : res.data.data
    }
  } catch (e) {
    console.error(e)
  }
})

/**
 * 核心算法: 数据映射 Map
 *
 * 将 List 数据转换为以日期为键的 Map 结构
 * 结构: Map<"日期字符串", { total: 总金额, count: 笔数, hasAnomaly: 是否有异常, list: 详细列表 }>
 *
 * 这是一个典型的前端数据清洗过程
 */
const calendarMap = computed(() => {
  const map: Record<string, any> = {}

  allData.value.forEach((item) => {
    const day = item.date // 假设日期格式是 "YYYY-MM-DD"

    // 初始化日期条目
    if (!map[day]) {
      map[day] = { total: 0, count: 0, hasAnomaly: false, list: [] }
    }

    // 累加统计数据
    map[day].total += item.amount
    map[day].count += 1
    // 检查是否有异常记录
    if (item.isAnomaly === 1) map[day].hasAnomaly = true
    // 保存详细数据用于抽屉显示
    map[day].list.push(item)
  })

  return map
})

/**
 * 获取某天的数据概览
 * @param day - 日期字符串 (YYYY-MM-DD)
 * @returns 该日期的统计数据
 */
const getDayData = (day: string) => {
  return calendarMap.value[day] || { total: 0, count: 0, hasAnomaly: false }
}

// ===== 交互逻辑 =====

/** 点击日期打开抽屉 */
const handleDateClick = (day: string) => {
  selectedDay.value = day
  drawerVisible.value = true
}

/** 抽屉标题 */
const drawerTitle = computed(() => `📅 ${selectedDay.value} 消费明细`)

/** 选中日期的消费列表 */
const selectedDayList = computed(() => {
  const dayData = calendarMap.value[selectedDay.value]
  return dayData ? dayData.list : []
})
</script>

<style scoped>
.calendar-container {
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止双重滚动 */
}

.calendar-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

/* 强制让日历组件适应高度 */
:deep(.el-card__body) {
  flex: 1;
  overflow: auto;
  padding: 0;
}
:deep(.el-calendar) {
  --el-calendar-cell-width: 100%;
}
:deep(.el-calendar-table .el-calendar-day) {
  height: 100px; /* 格子高度 */
  padding: 5px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  padding: 0 10px;
}
.legend {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 10px;
  align-items: center;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.normal {
  background: #409eff;
}
.dot.anomaly {
  background: #f56c6c;
}

/* 日历格子样式 */
.custom-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 4px;
  transition: all 0.2s;
}
.custom-cell.has-data:hover {
  background-color: #ecf5ff;
  cursor: pointer;
}

.date-num {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
}
.anomaly-mark {
  color: #f56c6c;
  font-size: 12px;
}

.date-content {
  text-align: right;
}
.amount {
  color: #409eff;
  font-weight: bold;
  font-size: 13px;
}
.count {
  color: #909399;
  font-size: 12px;
}

/* 抽屉内列表样式 */
.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
}
.mini-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.card-anomaly {
  border: 1px solid #fde2e2;
  background: #fef0f0;
}

.mini-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}
.mini-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}
.item-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anomaly-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
  font-weight: bold;
}
</style>
