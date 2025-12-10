<template>
  <div class="login-container">
    <div class="login-box">
      <div class="left-side">
        <div class="title-box">
          <el-icon :size="40" color="#fff"><DocumentChecked /></el-icon>
          <h1>SmartDoc</h1>
        </div>
        <p class="slogan">加入我们 · 开启智能财务之旅</p>
      </div>

      <div class="right-side">
        <h2>创建账号</h2>
        <el-form
          :model="registerForm"
          :rules="rules"
          ref="formRef"
          label-position="top"
          size="large"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              prefix-icon="User"
              placeholder="请输入用户名 (唯一)"
            />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="registerForm.nickname"
              prefix-icon="Postcard"
              placeholder="例如：财务小李"
            />
          </el-form-item>

          <el-form-item label="设置密码" prop="password">
            <el-input
              v-model="registerForm.password"
              prefix-icon="Lock"
              type="password"
              placeholder="6位以上字符"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              prefix-icon="Key"
              type="password"
              placeholder="请再次输入密码"
              show-password
            />
          </el-form-item>

          <el-button type="success" class="submit-btn" :loading="loading" @click="handleRegister">
            立即注册
          </el-button>

          <div class="link-area">
            <span>已有账号？</span>
            <el-link type="primary" @click="$router.push('/login')">去登录</el-link>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Register.vue - 用户注册页面
 *
 * 功能概述:
 * 1. 提供用户注册表单 (用户名、昵称、密码)
 * 2. 实现表单验证 (必填、密码长度、确认密码一致性)
 * 3. 调用后端注册接口创建新用户
 */

import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentChecked, User, Lock, Key, Postcard } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import axios from 'axios'

// --- 路由和状态 ---
const router = useRouter() // 路由导航实例
const loading = ref(false) // 提交加载状态
const formRef = ref<FormInstance>() // 表单引用 (用于触发验证)

// 注册表单数据
const registerForm = reactive({
  username: '', // 用户名 (登录账号，唯一)
  nickname: '', // 昵称 (显示名称)
  password: '', // 密码
  confirmPassword: '', // 确认密码
})

/**
 * 表单验证规则
 * Element Plus 表单组件的验证配置
 */
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      // 自定义验证器: 检查两次密码是否一致
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/**
 * 处理注册请求
 *
 * 流程:
 * 1. 触发表单验证
 * 2. 发送注册请求到后端
 * 3. 注册成功后跳转到登录页
 */
const handleRegister = async () => {
  if (!formRef.value) return

  // 1. 触发表单验证
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 2. 构建请求数据 (不需要传 confirmPassword 给后端)
        const { confirmPassword, ...postData } = registerForm
        const res = await axios.post('http://localhost:8080/api/user/register', postData)

        if (res.data.code === 200) {
          ElMessage.success('注册成功，请登录')
          // 跳转到登录页
          router.push('/login')
        } else {
          // 显示后端返回的错误信息 (如用户名已存在)
          ElMessage.error(res.data.msg || '注册失败')
        }
      } catch (error) {
        ElMessage.error('服务器连接失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* 复用 Login.vue 的样式，保持一致性 */
.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #001529 0%, #003a70 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  width: 900px; /* 稍微宽一点 */
  height: 600px; /* 稍微高一点，因为表单长 */
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
}
.left-side {
  flex: 4;
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
  flex: 5;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.right-side h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}
.submit-btn {
  width: 100%;
  margin-top: 10px;
  font-weight: bold;
  height: 44px;
}

.link-area {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}
</style>
