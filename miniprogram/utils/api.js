/**
 * API 接口统一管理 - 适配后端 Spring Boot API
 * 
 * 后端接口文档:
 * - UserController: /api/user/*
 * - DocController: /api/doc/*
 * - AuditController: /api/audit/*
 * - StatsController: /api/stats/*
 * - BudgetController: /api/budget/*
 * - RecycleBinController: /api/recycle/*
 * - SystemController: /api/system/*
 * - ChatServer: WebSocket /ws/chat/{token}
 */

const { get, post, put, del, uploadFile } = require('./request')

// ===== 用户相关 API =====
const userApi = {
  // 登录 - POST /api/user/login
  login: (data) => post('/api/user/login', data),
  // 注册 - POST /api/user/register
  register: (data) => post('/api/user/register', data),
  // 更新用户信息 - POST /api/user/update
  updateInfo: (data) => post('/api/user/update', data),
  // 登出 - POST /api/user/logout
  logout: () => post('/api/user/logout'),
  // 获取对话会话列表 - GET /api/user/chat/sessions
  getChatSessions: () => get('/api/user/chat/sessions'),
  // 获取会话历史 - GET /api/user/chat/history?sessionId=xxx
  getChatHistory: (sessionId) => get('/api/user/chat/history', { sessionId })
}

// ===== 票据/发票相关 API =====
const invoiceApi = {
  // 获取列表 - GET /api/doc/list (返回数组)
  getList: () => get('/api/doc/list'),
  // OCR 识别上传 - POST /api/doc/upload (返回 InvoiceData 对象)
  ocrUpload: (filePath) => uploadFile('/api/doc/upload', filePath, 'file'),
  // 保存票据 - POST /api/doc/save (返回 'success' 字符串)
  save: (data) => post('/api/doc/save', data),
  // 删除票据 - DELETE /api/doc/delete/{id} (软删除)
  delete: (id) => del(`/api/doc/delete/${id}`),
  // 导出 Excel - GET /api/doc/export (下载文件)
  exportUrl: '/api/doc/export'
}

// ===== 审批相关 API =====
const approvalApi = {
  // 用户提交审核 - POST /api/audit/submit/{id}
  submit: (id) => post(`/api/audit/submit/${id}`),
  // 获取待审核列表 (管理员) - GET /api/audit/pending-list
  getPendingList: () => get('/api/audit/pending-list'),
  // 审核通过 (管理员) - POST /api/audit/pass/{id}
  pass: (id) => post(`/api/audit/pass/${id}`),
  // 驳回 (管理员) - POST /api/audit/reject/{id}
  reject: (id, reason) => post(`/api/audit/reject/${id}`, { reason })
}

// ===== 统计相关 API =====
const statsApi = {
  // 获取趋势预测数据 - GET /api/stats/trend
  // 返回: { months, amounts, prediction, nextMonthLabel }
  getTrend: () => get('/api/stats/trend'),
  // 获取知识图谱 - GET /api/stats/graph
  // 返回: { nodes, links }
  getGraph: () => get('/api/stats/graph'),
  // 获取 K-Means 聚类结果 - GET /api/stats/clustering
  getClustering: () => get('/api/stats/clustering'),
  // AI 聚类分析报告 - GET /api/stats/analyze-clustering
  getClusteringAnalysis: () => get('/api/stats/analyze-clustering')
}

// ===== 预算相关 API =====
const budgetApi = {
  // 获取预算列表 - GET /api/budget/list
  // 返回带 usedAmount 的预算列表
  getList: () => get('/api/budget/list'),
  // 保存/更新预算 - POST /api/budget/save
  // 同分类会自动更新，不同则新增
  save: (data) => post('/api/budget/save', data),
  // 删除预算 - DELETE /api/budget/delete/{id}
  delete: (id) => del(`/api/budget/delete/${id}`)
}

// ===== 回收站相关 API =====
const recycleApi = {
  // 获取回收站列表 - GET /api/recycle/list
  getList: () => get('/api/recycle/list'),
  // 恢复票据 - POST /api/recycle/restore/{id}
  restore: (id) => post(`/api/recycle/restore/${id}`),
  // 彻底删除 - DELETE /api/recycle/destroy/{id}
  destroy: (id) => del(`/api/recycle/destroy/${id}`),
  // 清空回收站 - DELETE /api/recycle/clear-all
  clearAll: () => del('/api/recycle/clear-all')
}

// ===== AI 聊天相关 =====
// 注意: 后端使用 WebSocket，路径为 ws://host:port/ws/chat/{token}
const chatApi = {
  // WebSocket 连接地址生成
  getWsUrl: (baseUrl, token) => {
    const wsBase = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    return `${wsBase}/ws/chat/${token}`
  }
}

// ===== 系统设置相关 API =====
const systemApi = {
  // 获取操作日志 - GET /api/system/logs
  getLogs: () => get('/api/system/logs'),
  // 数据备份下载 - GET /api/system/backup (下载 JSON 文件)
  backupUrl: '/api/system/backup',
  // 数据恢复 - POST /api/system/restore (上传 JSON 文件)
  restore: (filePath) => uploadFile('/api/system/restore', filePath, 'file')
}

module.exports = {
  userApi,
  invoiceApi,
  approvalApi,
  statsApi,
  budgetApi,
  recycleApi,
  chatApi,
  systemApi
}
