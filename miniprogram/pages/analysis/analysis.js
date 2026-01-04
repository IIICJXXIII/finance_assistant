const { requireAuth } = require('../../utils/auth')
const { statsApi, invoiceApi } = require('../../utils/api')
const { formatMoney } = require('../../utils/util')

Page({
  data: {
    analyzing: false,
    analyzed: false,
    clusterCount: 0,
    dataCount: 0,
    mainPattern: '-',
    clusters: [],
    suggestions: [],
    aiAnalysis: ''  // AI 分析报告
  },

  onLoad() {
    if (!requireAuth()) return
  },

  async startAnalysis() {
    this.setData({ analyzing: true })

    try {
      // 优先使用后端 K-Means 聚类接口
      const [clusterRes, analysisRes] = await Promise.all([
        statsApi.getClustering(),
        statsApi.getClusteringAnalysis().catch(() => null)  // AI 分析可选
      ])

      if (clusterRes.code === 200 && clusterRes.data) {
        // 使用后端返回的聚类结果
        const result = this.processBackendClustering(clusterRes.data)
        
        this.setData({
          analyzed: true,
          ...result,
          aiAnalysis: analysisRes?.data || ''
        })
      } else {
        // 后端失败时使用本地模拟
        await this.localAnalysis()
      }
    } catch (error) {
      console.error('后端分析接口失败，使用本地分析:', error)
      await this.localAnalysis()
    } finally {
      this.setData({ analyzing: false })
    }
  },

  /**
   * 处理后端返回的聚类结果
   */
  processBackendClustering(data) {
    const { clusters = [], k, totalPoints } = data
    const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
    
    const processedClusters = clusters.map((c, idx) => ({
      id: idx,
      name: c.label || `聚类 ${idx + 1}`,
      color: colors[idx % colors.length],
      count: c.count || 0,
      avgAmount: formatMoney(c.avgAmount || 0),
      percent: totalPoints > 0 ? Math.round((c.count || 0) / totalPoints * 100) : 0,
      description: c.description || this.getDescription(c.avgAmount || 0)
    }))

    // 找出主要模式
    const mainCluster = processedClusters.reduce((a, b) => 
      (a.count || 0) > (b.count || 0) ? a : b, 
      { name: '-', count: 0 }
    )

    return {
      clusterCount: k || processedClusters.length,
      dataCount: totalPoints || 0,
      mainPattern: mainCluster.name,
      clusters: processedClusters,
      suggestions: this.generateSuggestions(processedClusters)
    }
  },

  /**
   * 本地分析（备用）
   */
  async localAnalysis() {
    const res = await invoiceApi.getList()
    if (res.code === 200) {
      const data = res.data || []
      
      if (data.length < 5) {
        wx.showToast({ title: '数据量不足，至少需要5条记录', icon: 'none' })
        return
      }

      const result = this.performLocalKMeans(data)
      
      this.setData({
        analyzed: true,
        ...result
      })
    }
  },

  /**
   * 本地 K-Means 模拟
   */
  performLocalKMeans(data) {
    // 简化的聚类模拟
    const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
    const patterns = ['日常消费', '大额支出', '高频小额', '周期性支出']
    
    // 按金额分组
    const low = data.filter(i => i.amount < 100)
    const mid = data.filter(i => i.amount >= 100 && i.amount < 500)
    const high = data.filter(i => i.amount >= 500)
    
    const groups = [
      { name: '小额消费', items: low, color: colors[0] },
      { name: '中等消费', items: mid, color: colors[1] },
      { name: '大额消费', items: high, color: colors[2] }
    ].filter(g => g.items.length > 0)

    const clusters = groups.map((g, idx) => {
      const total = g.items.reduce((sum, i) => sum + (i.amount || 0), 0)
      const avg = g.items.length > 0 ? total / g.items.length : 0
      
      return {
        id: idx,
        name: g.name,
        color: g.color,
        count: g.items.length,
        avgAmount: formatMoney(avg),
        percent: Math.round(g.items.length / data.length * 100),
        description: this.getDescription(avg)
      }
    })

    // 找出主要模式
    const mainCluster = clusters.reduce((a, b) => a.count > b.count ? a : b)
    
    // 生成建议
    const suggestions = this.generateSuggestions(clusters)

    return {
      clusterCount: clusters.length,
      dataCount: data.length,
      mainPattern: mainCluster.name,
      clusters,
      suggestions
    }
  },

  getDescription(avgAmount) {
    if (avgAmount < 100) {
      return `平均单笔不超过100元，可能是日常餐饮、交通等支出`
    } else if (avgAmount < 500) {
      return `平均单笔100-500元，可能是办公用品、购物等支出`
    } else {
      return `平均单笔超过500元，可能是设备采购、大额服务等支出`
    }
  },

  generateSuggestions(clusters) {
    const suggestions = []
    
    const highCluster = clusters.find(c => c.name === '大额消费')
    if (highCluster && highCluster.percent > 30) {
      suggestions.push('大额支出占比较高，建议制定预算控制策略')
    }
    
    const lowCluster = clusters.find(c => c.name === '小额消费')
    if (lowCluster && lowCluster.count > 20) {
      suggestions.push('小额消费次数较多，可考虑合并采购减少频次')
    }
    
    suggestions.push('建议定期回顾消费数据，优化支出结构')
    suggestions.push('可将高频消费类目纳入月度预算管理')
    
    return suggestions
  }
})
