/**
 * HTTP 请求封装工具
 * 
 * 功能概述:
 * 1. 统一的 API 请求方法
 * 2. 自动添加 Token 认证
 * 3. 统一的错误处理
 * 4. 请求/响应拦截
 */

const app = getApp()

/**
 * 获取基础URL
 */
const getBaseUrl = () => {
  return app.globalData.baseUrl
}

/**
 * 获取请求头
 * 注意: 后端直接使用 token 作为 Authorization，不需要 Bearer 前缀
 */
const getHeaders = () => {
  const token = wx.getStorageSync('token') || ''
  return {
    'Content-Type': 'application/json',
    'Authorization': token
  }
}

/**
 * 统一请求方法
 * @param {Object} options - 请求配置
 * @param {string} options.url - 请求路径 (不含 baseUrl)
 * @param {string} options.method - 请求方法 (GET/POST/PUT/DELETE)
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.showLoading - 是否显示加载提示
 * @param {string} options.loadingText - 加载提示文字
 */
const request = (options) => {
  const {
    url,
    method = 'GET',
    data = {},
    showLoading = false,
    loadingText = '加载中...'
  } = options

  return new Promise((resolve, reject) => {
    // 显示加载提示
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      })
    }

    wx.request({
      url: `${getBaseUrl()}${url}`,
      method: method,
      data: data,
      header: getHeaders(),
      timeout: 30000, // 30秒超时
      success: (res) => {
        if (showLoading) {
          wx.hideLoading()
        }

        // HTTP 状态码判断
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const resData = res.data
          
          // 后端返回格式兼容处理
          // 1. 标准格式: {code, data, msg}
          if (typeof resData === 'object' && resData !== null && resData.code !== undefined) {
            if (resData.code === 200) {
              resolve(resData)
            } else if (resData.code === 401) {
              handleUnauthorized()
              reject(resData)
            } else {
              wx.showToast({ title: resData.msg || '请求失败', icon: 'none' })
              reject(resData)
            }
          }
          // 2. 直接返回数组 (如 /api/doc/list)
          else if (Array.isArray(resData)) {
            resolve({ code: 200, data: resData })
          }
          // 3. 返回字符串 (如 'success')
          else if (typeof resData === 'string') {
            if (resData === 'success') {
              resolve({ code: 200, msg: resData })
            } else if (resData.startsWith('error')) {
              reject({ code: 400, msg: resData })
            } else {
              resolve({ code: 200, data: resData })
            }
          }
          // 4. 其他对象格式 (如 InvoiceData)
          else if (typeof resData === 'object' && resData !== null) {
            resolve({ code: 200, data: resData })
          }
          // 5. null 或其他
          else {
            resolve({ code: 200, data: resData })
          }
        } else if (res.statusCode === 401) {
          handleUnauthorized()
          reject({ code: 401, msg: '未授权' })
        } else {
          wx.showToast({ title: `请求错误 (${res.statusCode})`, icon: 'none' })
          reject({ code: res.statusCode, msg: '请求失败' })
        }
      },
      fail: (err) => {
        if (showLoading) {
          wx.hideLoading()
        }
        wx.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 处理未授权情况
 */
const handleUnauthorized = () => {
  // 清除本地存储的登录信息
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')
  
  // 更新全局状态
  app.globalData.isLoggedIn = false
  app.globalData.userInfo = null
  app.globalData.token = ''

  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })

  // 延迟跳转到登录页
  setTimeout(() => {
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }, 1500)
}

/**
 * GET 请求
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

/**
 * 文件上传
 * @param {string} url - 上传地址
 * @param {string} filePath - 本地文件路径
 * @param {string} name - 文件对应的 key
 * @param {Object} formData - 其他表单数据
 */
const uploadFile = (url, filePath, name = 'file', formData = {}) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '上传中...',
      mask: true
    })

    const token = wx.getStorageSync('token') || ''

    wx.uploadFile({
      url: `${getBaseUrl()}${url}`,
      filePath: filePath,
      name: name,
      formData: formData,
      header: {
        'Authorization': token
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            // 后端 OCR 接口直接返回 InvoiceData 对象
            if (data && typeof data === 'object') {
              resolve({ code: 200, data: data })
            } else {
              resolve({ code: 200, data: data })
            }
          } catch (e) {
            // 返回非 JSON 格式
            if (res.data === 'success') {
              resolve({ code: 200, msg: 'success' })
            } else {
              resolve({ code: 200, data: res.data })
            }
          }
        } else {
          wx.showToast({ title: '上传失败', icon: 'none' })
          reject({ code: res.statusCode, msg: '上传失败' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败，请检查网络',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  getBaseUrl
}
