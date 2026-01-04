/**
 * 个人中心页面逻辑
 */
const { requireAuth, getCurrentUser, logout } = require('../../utils/auth')
const { invoiceApi } = require('../../utils/api')
const { formatMoney, getCurrentMonth } = require('../../utils/util')

Page({
  /**
   * 页面数据
   */
  data: {
    userInfo: {},
    stats: {
      totalCount: 0,
      totalAmount: '0.00',
      monthCount: 0
    }
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
    this.loadUserInfo()
    this.loadStats()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = getCurrentUser() || {}
    this.setData({ userInfo })
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const res = await invoiceApi.getList()
      
      if (res.code === 200) {
        const data = res.data || []
        const currentMonth = getCurrentMonth()
        
        const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0)
        const monthData = data.filter(item => item.date && item.date.startsWith(currentMonth))
        
        this.setData({
          stats: {
            totalCount: data.length,
            totalAmount: formatMoney(totalAmount),
            monthCount: monthData.length
          }
        })
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  },

  /**
   * 跳转到预算管理
   */
  goToBudget() {
    wx.navigateTo({
      url: '/pages/budget/budget'
    })
  },

  /**
   * 跳转到财务日历
   */
  goToCalendar() {
    wx.navigateTo({
      url: '/pages/calendar/calendar'
    })
  },

  /**
   * 跳转到回收站
   */
  goToRecycle() {
    wx.navigateTo({
      url: '/pages/recycle/recycle'
    })
  },

  /**
   * 跳转到审批工作台
   */
  goToApproval() {
    wx.navigateTo({
      url: '/pages/approval/approval'
    })
  },

  /**
   * 跳转到系统设置
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  /**
   * 跳转到 AI 分析
   */
  goToAnalysis() {
    wx.navigateTo({
      url: '/pages/analysis/analysis'
    })
  },

  /**
   * 显示关于
   */
  showAbout() {
    wx.showModal({
      title: '关于 SmartDoc',
      content: 'SmartDoc 智能票据归档系统\n\n版本: v1.0.0\n\n功能: 票据OCR识别、智能分类、预算管理、AI财务分析',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
        }
      }
    })
  }
})
