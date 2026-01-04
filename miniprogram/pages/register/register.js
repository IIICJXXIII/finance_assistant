/**
 * 注册页面逻辑
 */
const { register } = require('../../utils/auth')

Page({
  /**
   * 页面数据
   */
  data: {
    formData: {
      username: '',
      nickname: '',
      password: '',
      confirmPassword: ''
    },
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    statusBarHeight: 0,
    navHeight: 88
  },

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
      navHeight: (app.globalData.statusBarHeight || 20) + 44
    })
  },

  /**
   * 通用输入处理
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
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
   * 切换确认密码显示/隐藏
   */
  toggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    })
  },

  /**
   * 处理注册
   */
  async handleRegister() {
    const { formData } = this.data

    // 表单校验
    if (!formData.username.trim()) {
      return wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      })
    }

    if (formData.username.length < 3) {
      return wx.showToast({
        title: '用户名至少3个字符',
        icon: 'none'
      })
    }

    if (!formData.password.trim()) {
      return wx.showToast({
        title: '请输入密码',
        icon: 'none'
      })
    }

    if (formData.password.length < 6) {
      return wx.showToast({
        title: '密码至少6个字符',
        icon: 'none'
      })
    }

    if (formData.password !== formData.confirmPassword) {
      return wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      })
    }

    this.setData({ loading: true })

    try {
      await register({
        username: formData.username,
        nickname: formData.nickname || formData.username,
        password: formData.password
      })

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 注册成功，返回登录页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('注册失败:', error)
      wx.showToast({
        title: error.msg || '注册失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  }
})
