<template>
  <div class="chat-layout">
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <el-button type="primary" class="new-chat-btn" @click="startNewChat" :icon="Plus">
          开启新对话
        </el-button>
      </div>
      <div class="session-list">
        <div
          v-for="sid in sessionList"
          :key="sid"
          class="session-item"
          :class="{ active: sid === currentSessionId }"
          @click="switchSession(sid)"
        >
          <el-icon><ChatDotSquare /></el-icon>
          <span class="session-title">{{ formatSessionName(sid) }}</span>
        </div>
      </div>
    </div>

    <div class="chat-main">
      <el-card class="chat-card" shadow="never">
        <template #header>
          <div class="chat-header">
            <div class="header-left">
              <span>🤖 智能财务顾问</span>
              <el-tag type="info" size="small" effect="plain" style="margin-left: 10px"
                >DeepSeek-V3</el-tag
              >
            </div>
            <div class="header-right">
              <span class="session-id-display">会话ID: {{ currentSessionId.slice(0, 8) }}...</span>
              <el-tag type="success" size="small" v-if="isConnected">● 在线</el-tag>
              <el-tag type="danger" size="small" v-else>● 离线</el-tag>
            </div>
          </div>
        </template>

        <div class="message-list" ref="msgListRef">
          <div v-if="messages.length === 0" class="empty-state">
            <el-icon :size="48" color="#e0e0e0"><ChatLineRound /></el-icon>
            <p>有什么关于财务的问题，尽管问我吧！</p>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-item"
            :class="{ 'user-msg': msg.role === 'user', 'ai-msg': msg.role === 'ai' }"
          >
            <div class="avatar" v-if="msg.role === 'ai'">🤖</div>
            <div class="bubble">{{ msg.content }}</div>
            <div class="avatar" v-if="msg.role === 'user'">👤</div>
          </div>

          <div v-if="isThinking" class="message-item ai-msg">
            <div class="avatar">🤖</div>
            <div class="bubble thinking"><span>.</span><span>.</span><span>.</span></div>
          </div>
        </div>

        <div class="input-area">
          <el-input
            v-model="inputContent"
            placeholder="请输入问题..."
            @keyup.enter="sendMsg"
            :disabled="isThinking"
          >
            <template #append>
              <el-button
                @click="sendMsg"
                :loading="isThinking"
                :disabled="!isConnected || !inputContent"
              >
                {{ isThinking ? '思考中' : '发送' }}
              </el-button>
            </template>
          </el-input>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ChatAssistant.vue - AI 财务顾问聊天页面
 *
 * 功能概述:
 * 1. 基于 WebSocket 实现实时双向通信
 * 2. 支持多会话管理 (新建/切换/历史记录)
 * 3. 集成 DeepSeek-V3 大语言模型回答财务问题
 *
 * 技术要点:
 * - WebSocket: 实现实时消息推送，无需轮询
 * - UUID: 生成唯一会话ID
 * - 历史记录: 从后端加载并持久化
 */

import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ChatDotSquare, ChatLineRound } from '@element-plus/icons-vue'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid' // UUID 生成库

// --- 类型定义 ---
/** 消息对象接口 */
interface Message {
  role: 'user' | 'ai' // 消息角色: 用户或 AI
  content: string // 消息内容
}

// ===== 响应式状态 =====
const isConnected = ref(false) // WebSocket 连接状态
const isThinking = ref(false) // AI 思考中状态
const inputContent = ref('') // 输入框内容
const messages = ref<Message[]>([]) // 当前会话的消息列表
const sessionList = ref<string[]>([]) // 所有会话 ID 列表
const currentSessionId = ref('') // 当前活动会话 ID
const msgListRef = ref<HTMLElement | null>(null) // 消息列表 DOM 引用 (用于滚动)

// WebSocket 实例
let socket: WebSocket | null = null

// ===== 生命周期 =====

/** 组件挂载时初始化 */
onMounted(async () => {
  // 获取历史会话列表
  await fetchSessions()

  // 根据是否有历史会话决定操作
  if (sessionList.value.length > 0) {
    // 有历史会话: 默认选中第一个
    switchSession(sessionList.value[0])
  } else {
    // 无历史会话: 创建新会话
    startNewChat()
  }

  // 初始化 WebSocket 连接
  initWebSocket()
})

/** 组件卸载时清理 */
onUnmounted(() => {
  // 关闭 WebSocket 连接，防止内存泄漏
  if (socket) socket.close()
})

// ===== 会话管理逻辑 =====

/** 获取会话列表 */
const fetchSessions = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/user/chat/sessions')
    if (res.data.code === 200) {
      sessionList.value = res.data.data
    }
  } catch (e) {
    console.error('获取会话列表失败', e)
  }
}

/**
 * 开启新对话
 * 生成新的会话 ID 并清空当前消息
 */
const startNewChat = () => {
  // 生成唯一 UUID 作为会话标识
  const newId = uuidv4()
  currentSessionId.value = newId
  messages.value = [] // 清空当前屏显示

  // 将新会话添加到列表顶部
  sessionList.value.unshift(newId)
}

/**
 * 切换会话
 * 加载指定会话的历史记录
 */
const switchSession = async (sessionId: string) => {
  currentSessionId.value = sessionId
  try {
    // 从后端加载该会话的历史消息
    const res = await axios.get(
      `http://localhost:8080/api/user/chat/history?sessionId=${sessionId}`,
    )
    if (res.data.code === 200) {
      messages.value = res.data.data
      scrollToBottom()
    }
  } catch (e) {
    ElMessage.error('加载历史记录失败')
  }
}

/**
 * 格式化会话名称
 * 截取 ID 前 8 位显示
 */
const formatSessionName = (id: string) => {
  return `会话 ${id.substring(0, 8)}...`
}

// ===== WebSocket 通信逻辑 =====

/**
 * 初始化 WebSocket 连接
 * 使用 Token 进行身份验证
 */
const initWebSocket = () => {
  const token = localStorage.getItem('token')
  if (!token) return // 未登录则不建立连接

  // 创建 WebSocket 连接，URL 中带上 Token 进行验证
  socket = new WebSocket(`ws://localhost:8080/ws/chat/${token}`)

  // 连接成功回调
  socket.onopen = () => {
    isConnected.value = true
  }

  // 接收消息回调 (AI 回复)
  socket.onmessage = (event) => {
    isThinking.value = false
    // 将 AI 回复添加到消息列表
    messages.value.push({ role: 'ai', content: event.data })
    scrollToBottom()
  }

  // 连接关闭回调
  socket.onclose = () => {
    isConnected.value = false
  }
}

/**
 * 发送消息
 * 将用户输入通过 WebSocket 发送到后端
 */
const sendMsg = () => {
  const text = inputContent.value.trim()
  if (!text) return

  // 检查 WebSocket 连接状态
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    ElMessage.error('连接断开')
    return
  }

  // 1. 界面立即显示用户消息
  messages.value.push({ role: 'user', content: text })
  scrollToBottom()

  // 2. 构建发送负载 (JSON 格式，包含会话 ID)
  const payload = JSON.stringify({
    content: text,
    sessionId: currentSessionId.value,
  })

  // 3. 设置思考状态并发送
  isThinking.value = true
  socket.send(payload)
  inputContent.value = '' // 清空输入框
}

/**
 * 滚动到底部
 * 用于新消息时自动滚动到最新内容
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (msgListRef.value) {
      msgListRef.value.scrollTop = msgListRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
/* 整体布局 */
.chat-layout {
  display: flex;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 左侧侧边栏 */
.chat-sidebar {
  width: 240px;
  background-color: #f7f8fa;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}
.new-chat-btn {
  width: 100%;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s;
  font-size: 14px;
}
.session-item:hover {
  background-color: #eef0f5;
}
.session-item.active {
  background-color: #e1f3d8;
  color: #67c23a;
  font-weight: bold;
}

/* 右侧聊天区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: none;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.session-id-display {
  font-size: 12px;
  color: #909399;
  margin-right: 10px;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 10px;
}

/* 气泡与头像 (复用之前样式) */
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
}
.user-msg {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.ai-msg {
  align-self: flex-start;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.ai-msg .avatar {
  background: #ecf5ff;
  color: #409eff;
}
.user-msg .avatar {
  background: #95d475;
  color: #fff;
}
.bubble {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.6;
  background: #f4f4f5;
  color: #333;
  max-width: 100%;
}
.user-msg .bubble {
  background: #95d475;
  color: #000;
}
.thinking {
  padding: 10px 20px;
  color: #999;
  letter-spacing: 2px;
}

.input-area {
  padding: 20px;
  border-top: 1px solid #eee;
}
</style>
