const { requireAuth } = require('../../utils/auth')
const { recycleApi } = require('../../utils/api')
const { formatMoney, showConfirm } = require('../../utils/util')

Page({
  data: {
    list: []
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
      const res = await recycleApi.getList()
      if (res.code === 200) {
        const list = (res.data || []).map(item => ({
          ...item,
          amountStr: formatMoney(item.amount)
        }))
        this.setData({ list })
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  async restoreItem(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showConfirm('确定要恢复这条记录吗？')
    if (!confirmed) return

    try {
      await recycleApi.restore(id)
      wx.showToast({ title: '已恢复', icon: 'success' })
      this.loadData()
    } catch (error) {
      console.error('恢复失败:', error)
    }
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await showConfirm('永久删除后无法恢复，确定删除吗？')
    if (!confirmed) return

    try {
      await recycleApi.destroy(id)
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  },

  async clearAll() {
    const confirmed = await showConfirm('确定要清空回收站吗？此操作不可恢复！')
    if (!confirmed) return

    try {
      await recycleApi.clearAll()
      wx.showToast({ title: '已清空', icon: 'success' })
      this.setData({ list: [] })
    } catch (error) {
      console.error('清空失败:', error)
    }
  }
})
