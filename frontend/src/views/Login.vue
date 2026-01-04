<!--
  Login.vue
  用户登录页面组件

  本组件提供了一个用户登录界面，包括：
  - 左侧的品牌信息展示区，包含应用名称和标语。
  - 右侧的登录表单，用户可在此输入账号和密码。
  - 表单下方提供“立即登录”按钮和跳转到注册页面的链接。
-->
<template>
  <!-- 根容器，负责全屏背景和居中布局 -->
  <div class="login-container">
    <!-- 登录框主体，包含左右两个部分 -->
    <div class="login-box">
      <!-- 左侧品牌展示区 -->
      <div class="left-side">
        <!-- 标题和图标 -->
        <div class="title-box">
          <el-icon :size="40" color="#fff"><DocumentChecked /></el-icon>
          <h1>SmartDoc</h1>
        </div>
        <!-- 应用标语 -->
        <p class="slogan">智能票据归档 · 高效财务管理</p>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="right-side">
        <h2>欢迎登录</h2>
        <!-- Element Plus 表单组件 -->
        <el-form :model="loginForm" label-position="top" size="large">
          <!-- 账号输入框 -->
          <el-form-item label="账号">
            <el-input ref="usernameInputRef" v-model="loginForm.username" prefix-icon="User" placeholder="admin" />
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item label="密码">
            <el-input
              v-model="loginForm.password"
              prefix-icon="Lock"
              type="password"      
              placeholder="123456"
              show-password       
              @keyup.enter="handleLogin" 
            />
          </el-form-item>

          <!-- 登录按钮 -->
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            立即登录
          </el-button>

          <!-- 注册链接区域 -->
          <div class="link-area">
            <span>还没有账号？</span>
            <el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file Login.vue - 用户登录页面脚本
 * @description 该脚本负责处理用户登录的逻辑，包括表单数据绑定、API 请求发送、
 *              登录状态管理以及成功后的页面跳转。
 */

// --- 依赖导入 ---
import { reactive, ref, onMounted } from 'vue' // 导入 Vue 3 的响应式 API
import { useRouter } from 'vue-router' // 导入 Vue Router 的路由实例钩子
import { DocumentChecked, User, Lock } from '@element-plus/icons-vue' // 导入 Element Plus 图标
import { ElMessage } from 'element-plus' // 导入 Element Plus 的消息提示组件
import axios from 'axios' // 导入 Axios 用于 HTTP 请求

// --- 响应式状态定义 ---

const usernameInputRef = ref<any>(null)

onMounted(() => {
  usernameInputRef.value?.focus()
})

const router = useRouter() // 获取路由实例，用于页面跳转
const loading = ref(false) // 定义一个 ref 变量，控制登录按钮的加载状态，初始为 false

// 使用 reactive 创建一个响应式对象来存储登录表单的数据
const loginForm = reactive({
  username: '', // 用户名
  password: ''  // 密码
})

// --- 方法定义 ---

/**
 * @function handleLogin
 * @description 处理用户登录的核心函数。
 * @async
 * 
 * @steps
 * 1. **表单校验**: 检查用户名和密码是否已填写。
 * 2. **发起请求**: 设置加载状态，并向后端发送 POST 登录请求。
 * 3. **响应处理**:
 *    - **成功 (code === 200)**: 显示成功消息，将返回的 token 和用户信息存储到 localStorage，然后跳转到主页 ('/upload')。
 *    - **失败**: 显示后端返回的错误信息。
 * 4. **异常捕获**: 捕获网络或服务器错误，并显示通用错误消息。
 * 5. **结束加载**: 无论成功、失败还是异常，最终都会关闭加载状态。
 */
const handleLogin = async () => {
  // 1. 表单基础校验
  if (!loginForm.username || !loginForm.password) {
    return ElMessage.warning('请输入账号和密码')
  }

  loading.value = true // 开始加载，禁用登录按钮
  try {
    // 2. 发送 POST 请求到后端登录接口
    const res = await axios.post('http://localhost:8080/api/user/login', loginForm)

    // 3. 根据后端返回的 code 判断登录结果
    if (res.data.code === 200) {
      ElMessage.success('登录成功')

      // 将 token 和用户信息存入浏览器的 localStorage，用于持久化登录状态和后续 API 请求验证
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))

      // 登录成功后跳转到文件上传页面
      router.push('/upload')
    } else {
      // 如果 code 不是 200，则认为登录失败，显示后端提供的错误消息
      ElMessage.error(res.data.msg || '登录失败，请检查账号或密码')
    }
  } catch (error) {
    // 4. 捕获请求过程中的错误（如网络问题、服务器崩溃等）
    console.error('登录请求失败:', error)
    ElMessage.error('服务器连接异常，请稍后再试')
  } finally {
    // 5. 无论请求结果如何，最终都将加载状态置为 false
    loading.value = false
  }
}
</script>

<!--
  Scoped CSS
  - `scoped` 属性确保这些样式只应用于当前组件，避免全局样式污染。
-->
<style scoped>
/* ========================================
   LOGIN CONTAINER - Animated Gradient
   ======================================== */

.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Animated background particles */
.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: particleFloat 20s linear infinite;
}

@keyframes particleFloat {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

/* ========================================
   LOGIN BOX - Glassmorphism Card
   ======================================== */

.login-box {
  width: 900px;
  height: 550px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl), 0 0 0 1px rgba(255, 255, 255, 0.3);
  display: flex;
  overflow: hidden;
  position: relative;
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.login-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--radius-2xl);
  padding: 2px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* ========================================
   LEFT SIDE - Brand Section
   ======================================== */

.left-side {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column; /* 垂直排列子元素 */
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  position: relative;
  overflow: hidden;
}

.left-side::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%);
  animation: rotate 30s linear infinite;
}

/* 标题容器 */
.title-box {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  position: relative;
  z-index: 1;
  animation: fadeInDown 0.6s ease-out 0.2s both;
}

.title-box :deep(.el-icon) {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: bounce 2s ease-in-out infinite;
}

/* 标题文字样式 */
.title-box h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

/* 标语文字样式 */
.slogan {
  font-size: var(--font-size-lg);
  opacity: 0.95;
  letter-spacing: 3px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

/* ========================================
   RIGHT SIDE - Form Section
   ======================================== */

.right-side {
  flex: 1;
  padding: var(--space-3xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--color-white);
  position: relative;
}

/* “欢迎登录”标题样式 */
.right-side h2 {
  margin-bottom: var(--space-xl);
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInRight 0.6s ease-out 0.3s both;
}

/* Form Styles */
:deep(.el-form) {
  animation: fadeInUp 0.6s ease-out 0.5s both;
}

:deep(.el-form-item) {
  margin-bottom: var(--space-lg);
}

:deep(.el-form-item__label) {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

/* Enhanced Input Styles */
:deep(.el-input__wrapper) {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: var(--shadow-md);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

:deep(.el-input__inner) {
  font-size: var(--font-size-base);
  padding: var(--space-sm) var(--space-md);
}

/* Enhanced Button */
.login-btn {
  width: 100%;
  margin-top: var(--space-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  border: none;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width var(--transition-slow), height var(--transition-slow);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.login-btn:hover::before {
  width: 400px;
  height: 400px;
}

.login-btn:active {
  transform: translateY(0);
}

/* Link Area */
.link-area {
  margin-top: var(--space-lg);
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xs);
}

:deep(.el-link) {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
}

:deep(.el-link:hover) {
  transform: translateX(2px);
}

/* ========================================
   ANIMATIONS
   ======================================== */

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */

@media (max-width: 900px) {
  .login-box {
    width: 90%;
    height: auto;
    flex-direction: column;
  }

  .left-side {
    padding: var(--space-2xl) var(--space-lg);
    min-height: 200px;
  }

  .right-side {
    padding: var(--space-2xl) var(--space-lg);
  }

  .title-box h1 {
    font-size: var(--font-size-2xl);
  }

  .slogan {
    font-size: var(--font-size-base);
  }
}
</style>