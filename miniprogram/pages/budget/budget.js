/**
 * 预算中心页面逻辑
 */
const { requireAuth } = require('../../utils/auth')
const { budgetApi, invoiceApi } = require('../../utils/api')
const { formatMoney, getCurrentMonth, getCategoryIcon } = require('../../utils/util')

Page({
  data: {
    currentBudget: {},
    usedAmount: '0.00',
    remainAmount: '0.00',
    usagePercent: 0,
    categoryBudgets: [],
    historyBudgets: [],
    showModal: false,
    editAmount: '',
    editCategory: ''
  },

  onLoad() {
    if (!requireAuth()) return
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const [budgetRes, invoiceRes] = await Promise.all([
        budgetApi.getList(),
        invoiceApi.getList()
      ])

      // 后端返回的预算列表已包含 usedAmount
      const budgets = budgetRes.data || []
      const invoices = invoiceRes.data || []
      const currentMonth = getCurrentMonth()

      // 当前月预算 (后端按分类存储，不是按月份)
      // 计算总预算和总使用量
      let totalBudget = 0
      let totalUsed = 0
      
      budgets.forEach(b => {
        totalBudget += b.limitAmount || 0
        totalUsed += b.usedAmount || 0
      })
      
      // 计算剩余和百分比
      const remainAmount = Math.max(0, totalBudget - totalUsed)
      const usagePercent = totalBudget > 0 ? Math.round(totalUsed / totalBudget * 100) : 0

      // 分类预算统计 (后端已返回 usedAmount)
      const categoryBudgets = budgets.map(b => ({
        id: b.id,
        category: b.category,
        icon: getCategoryIcon(b.category),
        limitAmount: formatMoney(b.limitAmount || 0),
        usedAmount: formatMoney(b.usedAmount || 0),
        percent: (b.limitAmount || 0) > 0 ? Math.round((b.usedAmount || 0) / (b.limitAmount || 0) * 100) : 0,
        isOver: (b.usedAmount || 0) > (b.limitAmount || 0)
      }))

      this.setData({
        currentBudget: { amount: totalBudget },
        usedAmount: formatMoney(totalUsed),
        remainAmount: formatMoney(remainAmount),
        usagePercent,
        categoryBudgets,
        historyBudgets: []  // 后端暂无历史预算接口
      })

    } catch (error) {
      console.error('加载预算失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  showEditModal() {
    this.setData({
      showModal: true,
      editAmount: this.data.currentBudget.amount ? String(this.data.currentBudget.amount) : ''
    })
  },

  hideModal() {
    this.setData({ showModal: false, editCategory: '', editAmount: '' })
  },

  onAmountInput(e) {
    this.setData({ editAmount: e.detail.value })
  },

  onCategoryInput(e) {
    this.setData({ editCategory: e.detail.value })
  },

  /**
   * 保存预算 - 后端按分类存储
   */
  async saveBudget() {
    const { editAmount, editCategory } = this.data
    const amount = parseFloat(editAmount)

    if (!editCategory) {
      return wx.showToast({ title: '请选择分类', icon: 'none' })
    }

    if (!editAmount || isNaN(amount) || amount <= 0) {
      return wx.showToast({ title: '请输入有效金额', icon: 'none' })
    }

    try {
      // 后端预算接口参数: { category, limitAmount }
      await budgetApi.save({
        category: editCategory,
        limitAmount: amount
      })

      wx.showToast({ title: '保存成功', icon: 'success' })
      this.hideModal()
      this.loadData()
    } catch (error) {
      console.error('保存预算失败:', error)
    }
  },

  /**
   * 添加分类预算
   */
  showAddCategory() {
    const categories = ['餐饮美食', '交通出行', '办公耗材', '通讯网络', '电子设备', '其他']
    
    wx.showActionSheet({
      itemList: categories,
      success: (res) => {
        this.setData({
          showModal: true,
          editCategory: categories[res.tapIndex],
          editAmount: ''
        })
      }
    })
  }
})
