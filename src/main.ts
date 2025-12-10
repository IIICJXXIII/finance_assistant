// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import axios from 'axios'
// --- 2. Axios 请求拦截器 ---
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    // 每次请求都在 Header 里带上 Authorization
    config.headers.Authorization = token
  }
  return config
})

// --- 3. Axios 响应拦截器 (Token 过期处理) ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果后端返回 401，说明 Token 失效，强制登出
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
