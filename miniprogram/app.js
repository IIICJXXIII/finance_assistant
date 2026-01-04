/**
 * SmartDoc 微信小程序入口文件
 * 
 * 功能概述:
 * 1. 全局状态管理
 * 2. 登录状态检查
 * 3. 全局配置
 */

App({
  /**
   * 小程序初始化时触发
   */
  onLaunch() {
    console.log('SmartDoc 小程序启动')
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 获取系统信息
    this.getSystemInfo()
  },

  /**
   * 检查用户登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')
    
    if (token && user) {
      this.globalData.isLoggedIn = true
      this.globalData.userInfo = user
      this.globalData.token = token
    } else {
      this.globalData.isLoggedIn = false
      // 未登录则跳转到登录页
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      this.globalData.statusBarHeight = systemInfo.statusBarHeight
      this.globalData.windowHeight = systemInfo.windowHeight
      this.globalData.windowWidth = systemInfo.windowWidth
    } catch (e) {
      console.error('获取系统信息失败:', e)
    }
  },

  /**
   * 全局数据
   */
  globalData: {
    // 用户相关
    isLoggedIn: false,
    userInfo: null,
    token: '',
    
    // 系统相关
    systemInfo: null,
    statusBarHeight: 0,
    windowHeight: 0,
    windowWidth: 0,
    
    // API 配置
    baseUrl: 'http://localhost:8080',  // 开发环境，正式环境请更换
    
    // 版本信息
    version: '1.0.0'
  }
})
