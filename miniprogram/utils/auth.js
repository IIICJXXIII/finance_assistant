/**
 * 认证相关工具 - 适配后端 Spring Boot API
 * 
 * 后端登录接口返回格式:
 * {
 *   "code": 200,
 *   "msg": "登录成功",
 *   "token": "uuid-token",
 *   "user": { id, username, nickname, role, ... }
 * }
 */

const app = getApp()
const { post } = require('./request')

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码 (后端直接比对明文，生产环境建议加密)
 */
const login = async (username, password) => {
  try {
    const res = await post('/api/user/login', {
      username,
      password
    }, {
      showLoading: true,
      loadingText: '登录中...'
    })

    if (res.code === 200) {
      // 后端返回的 token 直接存储（不需要 Bearer 前缀）
      const token = res.token
      const user = res.user

      // 存储 Token 和用户信息
      wx.setStorageSync('token', token)
      wx.setStorageSync('user', user)

      // 更新全局状态
      app.globalData.isLoggedIn = true
      app.globalData.token = token
      app.globalData.userInfo = user

      return res
    } else {
      throw new Error(res.msg || '登录失败')
    }
  } catch (error) {
    throw error
  }
}

/**
 * 用户注册
 * 后端注册接口返回: { code: 200, msg: "注册成功，请登录" }
 */
const register = async (userInfo) => {
  try {
    const res = await post('/api/user/register', userInfo, {
      showLoading: true,
      loadingText: '注册中...'
    })

    return res
  } catch (error) {
    throw error
  }
}

/**
 * 用户登出
 * 后端登出接口: POST /api/user/logout
 */
const logout = async () => {
  try {
    // 调用后端登出接口
    await post('/api/user/logout')
  } catch (e) {
    console.error('登出接口调用失败:', e)
  }

  // 清除本地存储
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')

  // 更新全局状态
  app.globalData.isLoggedIn = false
  app.globalData.token = ''
  app.globalData.userInfo = null

  // 跳转到登录页
  wx.reLaunch({
    url: '/pages/login/login'
  })
}

/**
 * 检查登录状态
 * @returns {boolean}
 */
const isLoggedIn = () => {
  const token = wx.getStorageSync('token')
  return !!token
}

/**
 * 获取当前用户信息
 * @returns {Object|null}
 */
const getCurrentUser = () => {
  return wx.getStorageSync('user') || null
}

/**
 * 获取 Token
 * @returns {string}
 */
const getToken = () => {
  return wx.getStorageSync('token') || ''
}

/**
 * 检查是否为管理员
 * @returns {boolean}
 */
const isAdmin = () => {
  const user = getCurrentUser()
  return user && user.role === 'admin'
}

/**
 * 需要登录的页面守卫
 * 在页面 onLoad 中调用
 */
const requireAuth = () => {
  if (!isLoggedIn()) {
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    })
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }, 1500)
    return false
  }
  return true
}

module.exports = {
  login,
  register,
  logout,
  isLoggedIn,
  getCurrentUser,
  getToken,
  isAdmin,
  requireAuth
}
