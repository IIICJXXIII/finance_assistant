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
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentChecked, User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const loginForm = reactive({ username: '', password: '' })

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    return ElMessage.warning('请输入账号和密码')
  }

  loading.value = true
  try {
    const res = await axios.post('http://localhost:8080/api/user/login', loginForm)
    if (res.data.code === 200) {
      ElMessage.success('登录成功')
      // 核心：把 Token 和用户信息存入 LocalStorage
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))

      // 跳转到首页
      router.push('/upload')
    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('服务器连接失败')
  } finally {
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
