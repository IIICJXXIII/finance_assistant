/**
 * SmartDoc 前端应用入口文件
 *
 * 功能概述:
 * 1. 创建 Vue 应用实例
 * 2. 配置全局插件 (Pinia状态管理、Vue Router路由、Element Plus UI库)
 * 3. 配置 Axios 拦截器实现统一的请求/响应处理
 */

// import './assets/main.css'

// --- Vue 核心依赖导入 ---
import { createApp } from 'vue' // Vue 3 应用创建函数
import { createPinia } from 'pinia' // Pinia 状态管理库
import ElementPlus from 'element-plus' // Element Plus UI 组件库
import 'element-plus/dist/index.css' // Element Plus 样式文件

// --- 应用组件和配置导入 ---
import App from './App.vue' // 根组件
import router from './router' // 路由配置
import axios from 'axios' // HTTP 请求库

/**
 * Axios 请求拦截器
 *
 * 作用: 在每个 HTTP 请求发出前，自动在请求头中添加 Token
 * 这样后端可以识别用户身份，实现接口鉴权
 */
axios.interceptors.request.use((config) => {
  // 从本地存储获取登录时保存的 Token
  const token = localStorage.getItem('token')
  if (token) {
    // 将 Token 添加到请求头的 Authorization 字段
    // 后端通过此字段验证用户身份
    config.headers.Authorization = token
  }
  return config
})

/**
 * Axios 响应拦截器
 *
 * 作用: 统一处理 HTTP 响应，特别是处理 Token 过期的情况
 * 当后端返回 401 状态码时，说明 Token 已失效，需要重新登录
 */
axios.interceptors.response.use(
  // 响应成功时直接返回
  (response) => response,
  // 响应错误时的处理逻辑
  (error) => {
    if (error.response && error.response.status === 401) {
      // 401 Unauthorized: Token 失效或未登录
      // 清除本地存储的 Token
      localStorage.removeItem('token')
      // 强制跳转到登录页面
      window.location.href = '/login'
    }
    // 将错误继续向上抛出，让业务代码可以捕获处理
    return Promise.reject(error)
  },
)

// --- 创建并配置 Vue 应用实例 ---
const app = createApp(App)

// 注册 Pinia 状态管理插件 (用于跨组件共享状态)
app.use(createPinia())
// 注册 Vue Router 路由插件 (用于页面导航)
app.use(router)
// 注册 Element Plus UI 组件库 (提供丰富的 UI 组件)
app.use(ElementPlus)

// 将应用挂载到 index.html 中 id="app" 的 DOM 元素上
app.mount('#app')
