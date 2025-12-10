<template>
  <div class="profile-container">
    <el-card shadow="never" class="profile-card">
      <template #header>
        <div class="card-header">
          <span>👤 个人中心</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="基本资料" name="basic">
          <div class="tab-content">
            <el-form :model="form" label-width="100px" style="max-width: 400px">
              <el-form-item label="用户名">
                <el-input v-model="form.username" disabled />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="角色">
                <el-tag>{{ form.role === 'admin' ? '管理员' : '普通用户' }}</el-tag>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleUpdate">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <div class="tab-content">
            <el-alert
              title="建议定期修改密码以保护账户安全"
              type="info"
              show-icon
              :closable="false"
              style="margin-bottom: 20px; max-width: 400px"
            />
            <el-form :model="pwdForm" label-width="100px" style="max-width: 400px">
              <el-form-item label="新密码">
                <el-input v-model="pwdForm.password" type="password" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="danger" @click="handleUpdatePwd">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据管理" name="data">
          <div class="tab-content">
            <div class="data-box">
              <div class="data-icon">
                <el-icon :size="48" color="#67C23A"><Document /></el-icon>
              </div>
              <div class="data-info">
                <h3>导出 Excel 报表</h3>
                <p>将您的所有发票归档记录导出为 .xlsx 文件，方便进行本地备份或进一步分析。</p>
                <el-button type="success" :loading="exportLoading" @click="handleExport">
                  立即导出
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * UserProfile.vue - 个人中心页面
 *
 * 功能概述:
 * 1. 基本资料: 查看和修改用户昵称
 * 2. 安全设置: 修改登录密码
 * 3. 数据管理: 导出归档记录为 Excel 文件
 *
 * 特色功能:
 * - Excel 导出: 后端生成 .xlsx 文件，前端触发下载
 */

import { ref, reactive, onMounted } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// ===== 响应式状态 =====
const activeTab = ref('basic') // 当前活动的 Tab 页签
const exportLoading = ref(false) // 导出按钮加载状态

// 用户基本资料表单
const form = reactive({
  id: 0,
  username: '', // 用户名 (不可修改)
  nickname: '', // 昵称 (可修改)
  role: '', // 角色 (admin/user)
})

// 修改密码表单
const pwdForm = reactive({ password: '' })

/**
 * 组件挂载时初始化
 * 从 LocalStorage 加载用户信息
 */
onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    // 将存储的用户信息填充到表单
    Object.assign(form, user)
  }
})

/**
 * 更新用户资料
 * 保存昵称等信息的修改
 */
const handleUpdate = async () => {
  try {
    const res = await axios.post('http://localhost:8080/api/user/update', form)
    if (res.data.code === 200) {
      ElMessage.success('保存成功')
      // 同步更新本地存储，保持数据一致
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

/**
 * 修改密码
 * 修改成功后强制重新登录
 */
const handleUpdatePwd = async () => {
  // 密码长度验证
  if (!pwdForm.password || pwdForm.password.length < 6) {
    return ElMessage.warning('密码长度至少6位')
  }
  try {
    const res = await axios.post('http://localhost:8080/api/user/update', {
      id: form.id,
      password: pwdForm.password,
    })
    if (res.data.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      // 清除本地存储并强制跳转到登录页
      localStorage.clear()
      window.location.href = '/login'
    }
  } catch (e) {
    ElMessage.error('修改失败')
  }
}

/**
 * 导出 Excel 报表
 *
 * 技术要点:
 * 1. responseType: 'blob' - 告诉 axios 返回的是二进制流
 * 2. URL.createObjectURL - 创建临时下载链接
 * 3. 通过创建隐藏的 <a> 标签触发浏览器下载
 */
const handleExport = async () => {
  exportLoading.value = true
  try {
    // 关键: 设置 responseType 为 'blob' 接收二进制数据
    const res = await axios.get('http://localhost:8080/api/doc/export', {
      responseType: 'blob',
    })

    // 创建 Blob URL 用于下载
    const url = window.URL.createObjectURL(new Blob([res.data]))

    // 创建临时 <a> 标签触发下载
    const link = document.createElement('a')
    link.href = url
    // 设置下载文件名 (包含日期)
    link.setAttribute('download', `SmartDoc_报表_${new Date().toISOString().slice(0, 10)}.xlsx`)

    // 添加到文档并触发点击
    document.body.appendChild(link)
    link.click()
    // 清理临时元素
    document.body.removeChild(link)

    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.profile-container {
  padding: 24px;
  height: 100%;
  box-sizing: border-box;
}
.profile-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.el-card__body) {
  flex: 1;
}
.card-header {
  font-weight: bold;
  font-size: 16px;
}

.profile-tabs {
  height: 100%;
}
.tab-content {
  padding: 20px 0;
}

.data-box {
  display: flex;
  align-items: center;
  background: #f0f9eb;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
  max-width: 600px;
}
.data-icon {
  margin-right: 20px;
}
.data-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}
.data-info p {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
}
</style>
