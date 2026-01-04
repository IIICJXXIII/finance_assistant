/**
 * 登录页面逻辑
 */
const { login } = require('../../utils/auth')

Page({
  /**
   * 页面数据
   */
  data: {
    username: '',
    password: '',
    showPassword: false,
    loading: false,
    focusUsername: true
  },

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    if (token) {
      wx.switchTab({
        url: '/pages/stats/stats'
      })
    }
  },

  /**
   * 用户名输入
   */
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  /**
   * 切换密码显示/隐藏
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    const { username, password } = this.data

    // 表单校验
    if (!username.trim()) {
      return wx.showToast({
        title: '请输入账号',
        icon: 'none'
      })
    }

    if (!password.trim()) {
      return wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
    }

    this.setData({ loading: true })

    try {
      await login(username, password)
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 登录成功，跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/stats/stats'
        })
      }, 1500)

    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.msg || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 跳转到注册页
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  }
})
