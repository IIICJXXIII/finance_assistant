/**
 * AI 财务助手页面逻辑
 * 使用 WebSocket 与后端 ChatServer 通信
 */
const { requireAuth } = require('../../utils/auth')
const { chatApi, userApi } = require('../../utils/api')

Page({
  /**
   * 页面数据
   */
  data: {
    messages: [],
    inputValue: '',
    thinking: false,
    scrollToView: '',
    messageId: 0,
    connected: false,
    sessionId: ''
  },

  // WebSocket 连接实例
  socketTask: null,

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    if (!requireAuth()) return
    
    // 生成会话 ID
    this.setData({
      sessionId: 'session_' + Date.now()
    })
    
    this.connectWebSocket()
    this.loadHistory()
  },

  /**
   * 生命周期函数 - 页面卸载
   */
  onUnload() {
    this.closeWebSocket()
  },

  /**
   * 连接 WebSocket
   */
  connectWebSocket() {
    const app = getApp()
    const token = wx.getStorageSync('token')
    
    if (!token) {
      console.error('未登录，无法连接 WebSocket')
      return
    }

    const wsUrl = chatApi.getWsUrl(app.globalData.baseUrl, token)
    console.log('连接 WebSocket:', wsUrl)

    this.socketTask = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket 连接请求已发送')
      }
    })

    this.socketTask.onOpen(() => {
      console.log('WebSocket 连接成功')
      this.setData({ connected: true })
    })

    this.socketTask.onMessage((res) => {
      console.log('收到消息:', res.data)
      this.handleWebSocketMessage(res.data)
    })

    this.socketTask.onError((err) => {
      console.error('WebSocket 错误:', err)
      this.setData({ connected: false })
    })

    this.socketTask.onClose(() => {
      console.log('WebSocket 已关闭')
      this.setData({ connected: false })
    })
  },

  /**
   * 关闭 WebSocket
   */
  closeWebSocket() {
    if (this.socketTask) {
      this.socketTask.close()
      this.socketTask = null
    }
  },

  /**
   * 处理 WebSocket 消息
   */
  handleWebSocketMessage(data) {
    const assistantMessage = {
      id: this.data.messageId + 1,
      role: 'assistant',
      content: data,
      time: this.formatTime()
    }

    this.setData({
      messages: [...this.data.messages, assistantMessage],
      messageId: this.data.messageId + 1,
      thinking: false
    })

    this.scrollToBottom()
  },

  /**
   * 加载聊天历史
   */
  async loadHistory() {
    try {
      // 获取会话列表
      const sessionsRes = await userApi.getChatSessions()
      if (sessionsRes.code === 200 && sessionsRes.data && sessionsRes.data.length > 0) {
        // 使用最近的会话
        const lastSessionId = sessionsRes.data[sessionsRes.data.length - 1]
        
        // 获取该会话的历史记录
        const historyRes = await userApi.getChatHistory(lastSessionId)
        if (historyRes.code === 200 && historyRes.data) {
          const messages = historyRes.data.map((item, index) => ({
            id: index + 1,
            role: item.role,
            content: item.content,
            time: this.formatTime(item.createTime)
          }))
          
          this.setData({ 
            messages,
            messageId: messages.length,
            sessionId: lastSessionId
          })
          
          this.scrollToBottom()
        }
      }
    } catch (error) {
      console.error('加载历史失败:', error)
    }
  },

  /**
   * 格式化时间
   */
  formatTime(dateStr) {
    if (!dateStr) {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }
    const date = new Date(dateStr)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  /**
   * 输入处理
   */
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  /**
   * 发送快速问题
   */
  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.q
    this.setData({ inputValue: question })
    this.sendMessage()
  },

  /**
   * 发送消息 - 通过 WebSocket
   */
  async sendMessage() {
    const { inputValue, thinking, messages, messageId, connected, sessionId } = this.data
    
    if (!inputValue.trim() || thinking) return

    // 检查连接状态
    if (!connected) {
      wx.showToast({ title: '连接已断开，正在重连...', icon: 'none' })
      this.connectWebSocket()
      return
    }

    const userMessage = {
      id: messageId + 1,
      role: 'user',
      content: inputValue.trim(),
      time: this.formatTime()
    }

    // 添加用户消息
    this.setData({
      messages: [...messages, userMessage],
      inputValue: '',
      thinking: true,
      messageId: messageId + 1
    })

    this.scrollToBottom()

    try {
      // 通过 WebSocket 发送消息
      // 消息格式: { sessionId, content }
      const msgData = JSON.stringify({
        sessionId: sessionId,
        content: userMessage.content
      })

      this.socketTask.send({
        data: msgData,
        success: () => {
          console.log('消息发送成功')
        },
        fail: (err) => {
          console.error('消息发送失败:', err)
          this.addErrorMessage('发送失败，请重试')
          this.setData({ thinking: false })
        }
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      this.addErrorMessage('网络异常，请检查网络后重试')
      this.setData({ thinking: false })
    }
  },

  /**
   * 添加错误消息
   */
  addErrorMessage(content) {
    const errorMessage = {
      id: this.data.messageId + 1,
      role: 'assistant',
      content,
      time: this.formatTime()
    }

    this.setData({
      messages: [...this.data.messages, errorMessage],
      messageId: this.data.messageId + 1
    })
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollToView: 'bottom'
      })
    }, 100)
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: 'SmartDoc AI 财务助手',
      path: '/pages/chat/chat'
    }
  }
})
