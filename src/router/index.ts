/**
 * SmartDoc 路由配置文件
 *
 * 功能概述:
 * 1. 定义应用的所有路由规则
 * 2. 配置路由守卫，实现登录鉴权
 * 3. 使用路由懒加载优化首屏性能
 */

import { createRouter, createWebHistory } from 'vue-router'

// --- 页面组件导入 ---
// SmartUploader 为首屏核心页面，采用静态导入以确保快速加载
import SmartUploader from '../views/SmartUploader.vue'

// 其他页面采用动态导入 (懒加载)，只有在访问时才加载，优化初始加载速度
const DocList = () => import('../views/DocList.vue') // 归档记录列表页
const StatsDashboard = () => import('../views/StatsDashboard.vue') // 数据报表页
const Login = () => import('../views/Login.vue') // 登录页
const Register = () => import('../views/Register.vue') // 注册页
const ChatAssistant = () => import('../views/ChatAssistant.vue') // AI 财务顾问页
const BudgetCenter = () => import('../views/BudgetCenter.vue') // 预算控制中心页
const UserProfile = () => import('../views/UserProfile.vue') // 个人中心页
const CalendarView = () => import('../views/FinanceCalendar.vue') // 财务日历页
const SystemSettings = () => import('../views/SystemSettings.vue')

/**
 * 创建路由实例
 *
 * createWebHistory: 使用 HTML5 History 模式，URL 更美观 (无 # 号)
 * import.meta.env.BASE_URL: Vite 提供的基础路径
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 基础路由配置 ---
    { path: '/', redirect: '/upload' }, // 根路径重定向到上传页
    { path: '/login', name: 'login', component: Login }, // 登录路由
    { path: '/register', name: 'register', component: Register }, // 注册路由

    // --- 业务功能路由 (需登录后访问) ---
    { path: '/upload', name: 'upload', component: SmartUploader }, // 智能归档页
    { path: '/list', name: 'list', component: DocList }, // 归档记录页
    { path: '/stats', name: 'stats', component: StatsDashboard }, // 数据报表页
    { path: '/chat', name: 'chat', component: ChatAssistant }, // AI 对话页
    { path: '/budget', name: 'budget', component: BudgetCenter }, // 预算管理页
    { path: '/profile', name: 'profile', component: UserProfile }, // 个人中心页
    { path: '/calendar', name: 'calendar', component: CalendarView }, // 财务日历页
    { path: '/settings', name: 'settings', component: SystemSettings },
  ],
})

/**
 * 路由白名单
 *
 * 这些路径不需要登录即可访问
 */
const whiteList = ['/login', '/register']

/**
 * 全局前置守卫 (路由鉴权)
 *
 * 在每次路由跳转前执行，检查用户是否有权访问目标页面
 *
 * @param to - 即将要进入的目标路由
 * @param from - 当前导航正要离开的路由
 * @param next - 放行函数，必须调用才能继续导航
 */
router.beforeEach((to, from, next) => {
  // 从本地存储获取用户 Token
  const token = localStorage.getItem('token')

  // 情况 1: 目标路由在白名单中 (如登录、注册页)，无条件放行
  if (whiteList.includes(to.path)) {
    next()
  }
  // 情况 2: 目标路由需要鉴权，但用户未登录 (无 Token)
  else if (!token) {
    // 强制跳转到登录页
    next('/login')
  }
  // 情况 3: 用户已登录，放行访问
  else {
    next()
  }
})

export default router
