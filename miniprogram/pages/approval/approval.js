const { requireAuth, isAdmin } = require('../../utils/auth')
const { approvalApi, invoiceApi } = require('../../utils/api')
const { formatMoney, showConfirm } = require('../../utils/util')

Page({
  data: {
    currentTab: 'pending',
    list: [],
    allData: [],
    pendingCount: 0
  },

  onLoad() {
    if (!requireAuth()) return
    if (!isAdmin()) {
      wx.showToast({ title: '无权访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' })
    try {
      // 管理员获取待审核列表
      const res = await approvalApi.getPendingList()
      if (res.code === 200) {
        const pendingList = (res.data || []).map(item => ({
          ...item,
          amountStr: formatMoney(item.amount)
        }))
        
        // 同时获取已处理的列表 (从全部列表中筛选)
        const allRes = await invoiceApi.getList()
        let processedList = []
        if (allRes.code === 200) {
          processedList = (allRes.data || [])
            .filter(i => i.status === 2 || i.status === 3)
            .map(item => ({
              ...item,
              amountStr: formatMoney(item.amount)
            }))
        }
        
        const allData = [...pendingList, ...processedList]
        const pendingCount = pendingList.length
        
        this.setData({ allData, pendingCount })
        this.filterList()
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  filterList() {
    const { allData, currentTab } = this.data
    let list = []
    
    if (currentTab === 'pending') {
      list = allData.filter(i => i.status === 1)
    } else {
      list = allData.filter(i => i.status === 2 || i.status === 3)
    }
    
    this.setData({ list })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.filterList()
  },

  async handleApprove(e) {
    const item = e.currentTarget.dataset.item
    const confirmed = await showConfirm(`确定通过「${item.merchantName}」的审批申请？`)
    if (!confirmed) return

    try {
      await approvalApi.pass(item.id)
      wx.showToast({ title: '已通过', icon: 'success' })
      this.loadData()
    } catch (error) {
      console.error('审批失败:', error)
    }
  },

  async handleReject(e) {
    const item = e.currentTarget.dataset.item
    
    wx.showModal({
      title: '驳回原因',
      editable: true,
      placeholderText: '请输入驳回原因（选填）',
      success: async (res) => {
        if (res.confirm) {
          try {
            await approvalApi.reject(item.id, res.content || '')
            wx.showToast({ title: '已驳回', icon: 'success' })
            this.loadData()
          } catch (error) {
            console.error('驳回失败:', error)
          }
        }
      }
    })
  }
})
