/**
 * 数据报表页面逻辑
 */
const { requireAuth } = require('../../utils/auth')
const { statsApi, budgetApi, invoiceApi } = require('../../utils/api')
const { formatMoney, getCurrentMonth, getLastMonth } = require('../../utils/util')

// 分类颜色配置
const categoryColors = {
  '餐饮美食': '#409EFF',
  '交通出行': '#67C23A',
  '办公耗材': '#E6A23C',
  '通讯网络': '#F56C6C',
  '电子设备': '#909399'
}

// 分类图标配置
const categoryIcons = {
  '餐饮美食': '🍽️',
  '交通出行': '🚗',
  '办公耗材': '📦',
  '通讯网络': '📱',
  '电子设备': '💻'
}

Page({
  /**
   * 页面数据
   */
  data: {
    // 统计数据
    totalAmount: '0.00',
    totalCount: 0,
    monthAmount: '0.00',
    monthBudget: '0.00',
    monthRate: 0,
    topCategory: '-',
    topPercent: '0',
    
    // 预算状态
    budgetStatus: {
      text: '正常',
      type: 'tag-success'
    },
    
    // 图表数据
    categoryData: [],
    trendData: [],
    
    // 原始数据
    allData: []
  },

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    if (!requireAuth()) return
  },

  /**
   * 生命周期函数 - 页面显示
   */
  onShow() {
    this.loadData()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载数据
   */
  async loadData() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      // 并行请求数据
      const [listRes, budgetRes, trendRes] = await Promise.all([
        invoiceApi.getList(),
        budgetApi.getList(),
        statsApi.getTrend()
      ])

      const allData = listRes.data || []
      this.setData({ allData })

      // 计算统计数据
      this.calculateStats(allData)
      
      // 计算预算状态
      this.calculateBudgetStatus(budgetRes.data || [])
      
      // 计算分类数据
      this.calculateCategoryData(allData)
      
      // 使用后端返回的趋势数据（含线性回归预测）
      if (trendRes.code === 200 && trendRes.data) {
        this.processTrendData(trendRes.data)
      } else {
        // 后端接口失败时，使用本地计算
        this.calculateTrendData(allData)
      }

    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 计算统计数据
   */
  calculateStats(data) {
    const currentMonth = getCurrentMonth()
    const lastMonth = getLastMonth()

    // 总金额和数量
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0)
    const totalCount = data.length

    // 本月金额
    const monthData = data.filter(item => item.date && item.date.startsWith(currentMonth))
    const monthAmount = monthData.reduce((sum, item) => sum + (item.amount || 0), 0)

    // 上月金额
    const lastMonthData = data.filter(item => item.date && item.date.startsWith(lastMonth))
    const lastMonthAmount = lastMonthData.reduce((sum, item) => sum + (item.amount || 0), 0)

    // 环比率
    let monthRate = 0
    if (lastMonthAmount > 0) {
      monthRate = ((monthAmount - lastMonthAmount) / lastMonthAmount * 100).toFixed(1)
    } else if (monthAmount > 0) {
      monthRate = 100
    }

    this.setData({
      totalAmount: formatMoney(totalAmount),
      totalCount,
      monthAmount: formatMoney(monthAmount),
      monthRate: parseFloat(monthRate)
    })
  },

  /**
   * 计算预算状态
   */
  calculateBudgetStatus(budgets) {
    const currentMonth = getCurrentMonth()
    const currentBudget = budgets.find(b => b.month === currentMonth)
    
    if (currentBudget) {
      const monthAmount = parseFloat(this.data.monthAmount.replace(/,/g, ''))
      const budgetLimit = currentBudget.amount || 0
      const percent = budgetLimit > 0 ? (monthAmount / budgetLimit * 100) : 0

      let status = { text: '正常', type: 'tag-success' }
      if (percent >= 100) {
        status = { text: '超支', type: 'tag-danger' }
      } else if (percent >= 80) {
        status = { text: '预警', type: 'tag-warning' }
      }

      this.setData({
        monthBudget: formatMoney(budgetLimit),
        budgetStatus: status
      })
    }
  },

  /**
   * 计算分类数据
   */
  calculateCategoryData(data) {
    // 按分类统计
    const categoryMap = {}
    let total = 0

    data.forEach(item => {
      const category = item.category || '其他'
      categoryMap[category] = (categoryMap[category] || 0) + (item.amount || 0)
      total += item.amount || 0
    })

    // 转换为数组并排序
    const categoryData = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? Math.round(amount / total * 100) : 0,
        color: categoryColors[name] || '#909399',
        icon: categoryIcons[name] || '📋'
      }))
      .sort((a, b) => b.amount - a.amount)

    // 最高频分类
    if (categoryData.length > 0) {
      this.setData({
        topCategory: categoryData[0].name,
        topPercent: categoryData[0].percent
      })
    }

    this.setData({ categoryData })
  },

  /**
   * 处理后端返回的趋势数据（含线性回归预测）
   */
  processTrendData(trendData) {
    const { months = [], amounts = [], prediction, nextMonthLabel } = trendData
    
    if (months.length === 0) {
      this.setData({ trendData: [] })
      return
    }

    // 找出最大值用于计算高度
    const maxValue = Math.max(...amounts, prediction || 0, 1)

    // 转换为展示数据
    const data = months.map((month, index) => ({
      month,
      monthLabel: month.substring(5),
      amount: amounts[index] || 0,
      height: Math.round((amounts[index] || 0) / maxValue * 80) + 10,
      isPrediction: false
    }))

    // 添加预测数据
    if (prediction && nextMonthLabel) {
      data.push({
        month: nextMonthLabel.replace(' (预测)', ''),
        monthLabel: nextMonthLabel.replace(' (预测)', '').substring(5) + '预测',
        amount: Math.round(prediction),
        height: Math.round(prediction / maxValue * 80) + 10,
        isPrediction: true
      })
    }

    this.setData({ trendData: data })
  },

  /**
   * 计算趋势数据（备用方法，后端接口失败时使用）
   */
  calculateTrendData(data) {
    // 按月统计最近6个月
    const monthMap = {}
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = 0
    }

    data.forEach(item => {
      if (item.date) {
        const month = item.date.substring(0, 7)
        if (monthMap.hasOwnProperty(month)) {
          monthMap[month] += item.amount || 0
        }
      }
    })

    // 找出最大值用于计算高度
    const values = Object.values(monthMap)
    const maxValue = Math.max(...values, 1)

    // 转换为趋势数据
    const trendData = Object.entries(monthMap).map(([month, amount]) => ({
      month,
      monthLabel: month.substring(5),
      amount,
      height: Math.round(amount / maxValue * 80) + 10,
      isPrediction: false
    }))

    // 添加预测数据（简单线性预测）
    if (values.length >= 2) {
      const lastTwo = values.slice(-2)
      const predictAmount = Math.max(0, lastTwo[1] + (lastTwo[1] - lastTwo[0]))
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
      
      trendData.push({
        month: nextMonthKey,
        monthLabel: nextMonthKey.substring(5),
        amount: predictAmount,
        height: Math.round(predictAmount / maxValue * 80) + 10,
        isPrediction: true
      })
    }

    this.setData({ trendData })
  },

  /**
   * 跳转到上传页
   */
  goToUpload() {
    wx.switchTab({
      url: '/pages/upload/upload'
    })
  },

  /**
   * 跳转到记录页
   */
  goToList() {
    wx.switchTab({
      url: '/pages/list/list'
    })
  },

  /**
   * 跳转到预算页
   */
  goToBudget() {
    wx.navigateTo({
      url: '/pages/budget/budget'
    })
  },

  /**
   * 跳转到分析页
   */
  goToAnalysis() {
    wx.navigateTo({
      url: '/pages/analysis/analysis'
    })
  }
})
