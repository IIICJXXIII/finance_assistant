<template>
  <div class="smart-container">
    <div class="workspace">
      <div class="preview-panel">
        <div class="preview-card">
          <div class="panel-header">
            <div class="title-group">
              <el-icon :size="18"><Document /></el-icon>
              <span class="title-text">票据原件预览</span>
            </div>
            <el-tag v-if="fileType" size="small" effect="plain">
              {{ fileType === 'pdf' ? 'PDF 文档' : '图片文件' }}
            </el-tag>
          </div>

          <div class="upload-box">
            <el-upload
              class="upload-demo"
              drag
              action="#"
              :http-request="customUpload"
              :show-file-list="false"
              :before-upload="beforeUpload"
            >
              <div v-if="fileUrl" class="preview-content">
                <img
                  v-if="fileType === 'image'"
                  :src="fileUrl"
                  class="uploaded-img"
                  alt="preview"
                />

                <embed
                  v-else-if="fileType === 'pdf'"
                  :src="fileUrl"
                  type="application/pdf"
                  class="uploaded-pdf"
                />

                <div class="reupload-mask">
                  <el-icon><Refresh /></el-icon>
                  <span>点击更换文件</span>
                </div>
              </div>

              <div v-else class="upload-placeholder">
                <div class="icon-bg">
                  <el-icon :size="32"><UploadFilled /></el-icon>
                </div>
                <div class="upload-text">拖拽 PDF / 图片 到此处 <br />或 <em>点击上传</em></div>
                <p class="sub-text">支持 JPG, PNG, PDF (Max 10MB)</p>
              </div>
            </el-upload>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <el-card class="box-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="header-title">AI 识别结果</span>
                <p class="card-subtitle">请人工校对后归档</p>
              </div>
              <div class="header-right">
                <el-tag type="warning" effect="dark" round v-if="loading">
                  <el-icon class="is-loading"><Loading /></el-icon> 分析中...
                </el-tag>
                <el-tag type="success" effect="dark" round v-else-if="fileUrl">
                  <el-icon><CircleCheck /></el-icon> 识别完成
                </el-tag>
              </div>
            </div>
          </template>

          <div class="form-scroll-area">
            <el-alert
              v-if="!loading && fileUrl"
              class="form-alert"
              title="AI 已自动提取关键信息，请核对。"
              type="success"
              :closable="false"
              show-icon
            />

            <el-form :model="formData" label-width="100px" label-position="top" size="large">
              <el-form-item label="商户名称 (Merchant)">
                <el-input
                  v-model="formData.merchantName"
                  prefix-icon="Shop"
                  placeholder="例如：农夫山泉 / 京东商城"
                />
              </el-form-item>

              <el-form-item label="项目名称 (Item Name)">
                <el-input
                  v-model="formData.itemName"
                  prefix-icon="Goods"
                  placeholder="例如：*饮料*农夫山泉天然水"
                />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="开票日期">
                    <el-date-picker
                      v-model="formData.date"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="选择日期"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="金额 (Amount)">
                    <el-input-number
                      v-model="formData.amount"
                      :precision="2"
                      :step="0.1"
                      :min="0"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="发票号码 (No.)">
                    <el-input
                      v-model="formData.invoiceCode"
                      prefix-icon="Ticket"
                      placeholder="20位数字"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="智能分类">
                    <el-select v-model="formData.category" placeholder="请选择" style="width: 100%">
                      <el-option label="餐饮美食" value="餐饮美食" />
                      <el-option label="交通出行" value="交通出行" />
                      <el-option label="办公耗材" value="办公耗材" />
                      <el-option label="通讯网络" value="通讯网络" />
                      <el-option label="电子设备" value="电子设备" />
                      <el-option label="其他" value="其他" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="form-footer">
            <el-button @click="resetForm" icon="RefreshLeft" :disabled="loading">重置</el-button>
            <el-button type="primary" @click="saveDoc" :loading="loading" icon="FolderChecked">
              确认并归档
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled,
  Document,
  Refresh,
  Shop,
  Ticket,
  Goods,
  Loading,
  CircleCheck,
  FolderChecked,
  RefreshLeft,
} from '@element-plus/icons-vue'
import axios from 'axios'

// --- 类型定义 ---
type FormState = {
  merchantName: string
  itemName: string
  date: string
  amount: number
  invoiceCode: string
  category: string
}

// --- 响应式状态 ---
const fileUrl = ref('')
const fileType = ref<'image' | 'pdf' | ''>('')
const loading = ref(false)

const formData = reactive<FormState>({
  merchantName: '',
  itemName: '',
  date: '',
  amount: 0,
  invoiceCode: '',
  category: '',
})

// ===== 方法定义 =====

/**
 * 上传前校验
 *
 * 检查文件类型是否为支持的格式 (PDF 或图片)
 * @param rawFile - 原始文件对象
 * @returns true 允许上传, false 拒绝上传
 */
const beforeUpload = (rawFile: File) => {
  const isPDF = rawFile.type === 'application/pdf'
  const isImage = rawFile.type.startsWith('image/')

  if (!isPDF && !isImage) {
    ElMessage.error('仅支持 PDF 或 图片格式！')
    return false
  }
  return true
}

/**
 * 自定义上传逻辑 (核心方法)
 *
 * 流程:
 * 1. 创建本地预览 URL
 * 2. 将文件上传到后端 AI OCR 接口
 * 3. 将 AI 识别结果填充到表单
 *
 * @param options - Element Plus Upload 组件传入的配置对象
 */
const customUpload = async (options: any) => {
  const file = options.file

  // 创建本地预览 URL (Blob URL)
  fileUrl.value = URL.createObjectURL(file)

  // 设置文件类型用于渲染不同的预览组件
  if (file.type === 'application/pdf') {
    fileType.value = 'pdf'
  } else {
    fileType.value = 'image'
  }

  loading.value = true

  // 构建 FormData 用于文件上传
  const data = new FormData()
  data.append('file', file)

  try {
    // 调用后端 AI OCR 识别接口
    const res = await axios.post('http://localhost:8080/api/doc/upload', data)
    const aiResult = res.data

    // 将 AI 识别结果填充到表单
    formData.merchantName = aiResult.merchantName || ''
    formData.itemName = aiResult.itemName || ''
    formData.date = aiResult.date || ''
    formData.amount = aiResult.amount ? Number(aiResult.amount) : 0
    formData.invoiceCode = aiResult.invoiceCode || ''
    formData.category = aiResult.category || ''

    ElMessage.success('识别成功，请核对右侧信息')
  } catch (error) {
    console.error(error)
    ElMessage.error('识别服务连接失败，请检查后端是否启动')
  } finally {
    loading.value = false
  }
}

/**
 * 重置表单
 * 清空所有表单数据和预览状态
 */
const resetForm = () => {
  fileUrl.value = ''
  fileType.value = ''
  formData.merchantName = ''
  formData.itemName = ''
  formData.date = ''
  formData.amount = 0
  formData.invoiceCode = ''
  formData.category = ''
}

/**
 * 保存归档
 *
 * 将表单数据提交到后端保存到数据库
 */
const saveDoc = async () => {
  // 表单验证
  if (!formData.merchantName || formData.amount <= 0) {
    ElMessage.warning('请确保商户名称和金额有效')
    return
  }

  loading.value = true
  try {
    // 调用保存接口
    await axios.post('http://localhost:8080/api/doc/save', formData)
    ElMessage.success('归档成功！已保存至数据库')
    // 保存成功后重置表单，方便继续上传
    resetForm()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败，请检查数据库连接')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 1. 全屏容器 */
.smart-container {
  height: 100%; /* 配合 App.vue 的 layout 占满剩余空间 */
  padding: 0; /* 去掉多余 padding，让它贴边显示更像专业软件 */
  display: flex;
  flex-direction: column;
}

/* 2. 工作区：左右布局 */
.workspace {
  flex: 1; /* 自动撑满高度 */
  display: flex;
  gap: 20px;
  min-height: 0; /* 防止内容溢出 */
  padding-bottom: 20px; /* 底部留白 */
}

/* 左侧面板 */
.preview-panel {
  flex: 4;
  min-width: 400px;
  display: flex;
  flex-direction: column;
}
/* 右侧面板 */
.form-panel {
  flex: 3;
  min-width: 350px;
  display: flex;
  flex-direction: column;
}

/* 3. 预览卡片样式优化 */
.preview-card {
  background: #fff;
  border-radius: 12px;
  height: 100%; /* 撑满左侧面板 */
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fcfcfc;
}
.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}
.title-text {
  font-weight: 600;
  font-size: 16px;
}

.upload-box {
  flex: 1; /* 占据剩余空间 */
  padding: 20px;
  background: #f5f7fa;
  overflow: hidden;
}

/* Upload 组件撑满 */
.upload-demo {
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.el-upload),
:deep(.el-upload-dragger) {
  height: 100%;
  width: 100%;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}
:deep(.el-upload-dragger) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  transition: all 0.3s;
}
:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: #f0f9eb;
}

/* 预览内容 */
.preview-content {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #52565e;
}
.uploaded-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.uploaded-pdf {
  width: 100%;
  height: 100%;
  display: block;
}
.reupload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}
.preview-content:hover .reupload-mask {
  opacity: 1;
}

/* 占位符美化 */
.upload-placeholder {
  text-align: center;
  color: #606266;
}
.icon-bg {
  width: 64px;
  height: 64px;
  background: #ecf5ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #409eff;
}
.upload-text {
  font-size: 16px;
  margin-bottom: 8px;
}
.sub-text {
  font-size: 13px;
  color: #909399;
}

/* 4. 表单面板样式优化 */
.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}
/* 强制让 el-card__body 填满并允许 Flex 布局 */
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.card-subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 表单滚动区域 */
.form-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.form-alert {
  margin-bottom: 20px;
}

/* 表单底部按钮区 (固定在底部) */
.form-footer {
  padding: 16px 24px;
  border-top: 1px solid #ebeef5;
  background: #fcfcfc;
  display: flex;
  gap: 12px;
}
.form-footer .el-button {
  flex: 1;
  height: 40px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .workspace {
    flex-direction: column;
  }
  .preview-panel {
    flex: none;
    height: 500px;
  }
}
</style>
