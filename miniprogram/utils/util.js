/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式化模板 (YYYY-MM-DD HH:mm:ss)
 * @returns {string}
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
const formatMoney = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) return '0.00'
  return Number(amount).toFixed(decimals)
}

/**
 * 格式化大数字 (如: 10000 -> 1万)
 * @param {number} num - 数字
 * @returns {string}
 */
const formatLargeNumber = (num) => {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return String(num)
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间 (ms)
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间 (ms)
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 获取审批状态文本
 * @param {number} status - 状态码
 * @returns {Object} { text, type }
 */
const getStatusInfo = (status) => {
  const statusMap = {
    0: { text: '草稿', type: 'info' },
    1: { text: '审核中', type: 'warning' },
    2: { text: '已通过', type: 'success' },
    3: { text: '已驳回', type: 'danger' }
  }
  return statusMap[status] || { text: '未知', type: 'info' }
}

/**
 * 获取分类图标
 * @param {string} category - 分类名称
 * @returns {string} 图标
 */
const getCategoryIcon = (category) => {
  const iconMap = {
    '餐饮美食': '🍽️',
    '交通出行': '🚗',
    '办公耗材': '📦',
    '通讯网络': '📱',
    '电子设备': '💻',
    '其他': '📋'
  }
  return iconMap[category] || '📋'
}

/**
 * 显示确认对话框
 * @param {string} content - 提示内容
 * @param {string} title - 标题
 * @returns {Promise<boolean>}
 */
const showConfirm = (content, title = '提示') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 复制到剪贴板
 * @param {string} data - 要复制的内容
 */
const copyToClipboard = (data) => {
  wx.setClipboardData({
    data,
    success: () => {
      wx.showToast({
        title: '已复制',
        icon: 'success'
      })
    }
  })
}

/**
 * 获取当前月份字符串
 * @returns {string} 格式: YYYY-MM
 */
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取上个月份字符串
 * @returns {string} 格式: YYYY-MM
 */
const getLastMonth = () => {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

module.exports = {
  formatDate,
  formatMoney,
  formatLargeNumber,
  debounce,
  throttle,
  getStatusInfo,
  getCategoryIcon,
  showConfirm,
  copyToClipboard,
  getCurrentMonth,
  getLastMonth
}
