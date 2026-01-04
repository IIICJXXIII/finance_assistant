const { requireAuth } = require('../../utils/auth')
const { showConfirm } = require('../../utils/util')

Page({
  data: {
    serverUrl: '',
    cacheSize: '0 KB'
  },

  onLoad() {
    if (!requireAuth()) return
    this.loadSettings()
    this.calculateCache()
  },

  loadSettings() {
    const app = getApp()
    this.setData({
      serverUrl: app.globalData.baseUrl
    })
  },

  calculateCache() {
    try {
      const info = wx.getStorageInfoSync()
      const size = info.currentSize || 0
      let sizeStr = size + ' KB'
      if (size > 1024) {
        sizeStr = (size / 1024).toFixed(2) + ' MB'
      }
      this.setData({ cacheSize: sizeStr })
    } catch (e) {
      console.error(e)
    }
  },

  onServerInput(e) {
    this.setData({ serverUrl: e.detail.value })
  },

  saveSettings() {
    const app = getApp()
    app.globalData.baseUrl = this.data.serverUrl
    wx.setStorageSync('serverUrl', this.data.serverUrl)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  changePassword() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  exportData() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  async clearCache() {
    const confirmed = await showConfirm('确定要清除本地缓存吗？')
    if (!confirmed) return

    try {
      // 保留登录信息
      const token = wx.getStorageSync('token')
      const user = wx.getStorageSync('user')
      
      wx.clearStorageSync()
      
      if (token) wx.setStorageSync('token', token)
      if (user) wx.setStorageSync('user', user)
      
      this.calculateCache()
      wx.showToast({ title: '已清除', icon: 'success' })
    } catch (e) {
      console.error(e)
    }
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          wx.showModal({
            title: '发现新版本',
            content: '新版本已准备好，是否重启应用？',
            success: (res) => {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            }
          })
        } else {
          wx.showToast({ title: '已是最新版本', icon: 'success' })
        }
      })
    } else {
      wx.showToast({ title: '已是最新版本', icon: 'success' })
    }
  }
})
