<template>
  <div class="login-container">
    <div class="login-box">
      <div class="left-side">
        <div class="title-box">
          <el-icon :size="40" color="#fff"><DocumentChecked /></el-icon>
          <h1>SmartDoc</h1>
        </div>
        <p class="slogan">智能票据归档 · 高效财务管理</p>
      </div>

      <div class="right-side">
        <h2>欢迎登录</h2>
        <el-form :model="loginForm" label-position="top" size="large">
          <el-form-item label="账号">
            <el-input v-model="loginForm.username" prefix-icon="User" placeholder="admin" />
          </el-form-item>

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

          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            立即登录
          </el-button>

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
 * Login.vue - 用户登录页面
 *
 * 功能概述:
 * 1. 提供用户名密码输入表单
 * 2. 调用后端登录接口验证身份
 * 3. 登录成功后存储 Token 并跳转到主页
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentChecked, User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// --- 路由和状态 ---
const router = useRouter() // 路由导航实例
const loading = ref(false) // 登录按钮加载状态

// 登录表单数据 (响应式对象)
const loginForm = reactive({ username: '', password: '' })

/**
 * 处理登录请求
 *
 * 流程:
 * 1. 表单验证 - 检查用户名密码是否填写
 * 2. 发送请求 - 调用后端登录 API
 * 3. 处理响应 - 存储 Token 并跳转
 */
const handleLogin = async () => {
  // 表单验证: 账号密码不能为空
  if (!loginForm.username || !loginForm.password) {
    return ElMessage.warning('请输入账号和密码')
  }

  loading.value = true
  try {
    // 发送登录请求到后端 API
    const res = await axios.post('http://localhost:8080/api/user/login', loginForm)

    if (res.data.code === 200) {
      // 登录成功
      ElMessage.success('登录成功')

      // 核心: 将 Token 和用户信息存入 LocalStorage
      // Token 用于后续请求的身份验证
      localStorage.setItem('token', res.data.token)
      // 用户信息用于界面显示
      localStorage.setItem('user', JSON.stringify(res.data.user))

      // 跳转到上传页面 (主页)
      router.push('/upload')
    } else {
      // 登录失败: 显示后端返回的错误信息
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (error) {
    // 网络错误或服务器异常
    console.error(error)
    ElMessage.error('服务器连接失败')
  } finally {
    // 无论成功失败，都关闭加载状态
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #001529 0%, #003a70 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 800px;
  height: 500px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
}

.left-side {
  flex: 1;
  background: linear-gradient(180deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.title-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.title-box h1 {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
}

.slogan {
  font-size: 16px;
  opacity: 0.8;
  letter-spacing: 2px;
}

.right-side {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.right-side h2 {
  margin-bottom: 30px;
  color: #333;
}

.login-btn {
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
}

/* 新增：底部链接样式 */
.link-area {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: center;
  gap: 5px;
}
</style>
