/**
 * 智能归档页面逻辑
 */
const { requireAuth, getCurrentUser } = require('../../utils/auth')
const { invoiceApi } = require('../../utils/api')

Page({
  /**
   * 页面数据
   */
  data: {
    // 文件相关
    previewUrl: '',
    filePath: '',
    fileType: '',
    
    // 状态
    loading: false,
    recognized: false,
    submitting: false,
    
    // 表单数据
    formData: {
      merchantName: '',
      itemName: '',
      date: '',
      amount: '',
      invoiceCode: '',
      category: '',
      remark: ''
    },
    
    // 分类选项
    categories: ['餐饮美食', '交通出行', '办公耗材', '通讯网络', '电子设备', '其他'],
    categoryIndex: -1
  },

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    if (!requireAuth()) return
  },

  /**
   * 选择文件
   */
  chooseFile() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFilePaths[0]
        this.setData({
          filePath,
          previewUrl: filePath,
          fileType: 'image'
        })
        
        // 开始 OCR 识别
        this.startOCR(filePath)
      }
    })
  },

  /**
   * OCR 识别
   */
  async startOCR(filePath) {
    this.setData({ 
      loading: true, 
      recognized: false 
    })

    try {
      const res = await invoiceApi.ocrUpload(filePath)
      
      if (res.code === 200 && res.data) {
        const data = res.data
        
        // 填充表单
        this.setData({
          'formData.merchantName': data.merchantName || '',
          'formData.itemName': data.itemName || '',
          'formData.date': data.date || '',
          'formData.amount': data.amount ? String(data.amount) : '',
          'formData.invoiceCode': data.invoiceCode || '',
          'formData.category': data.category || '',
          recognized: true
        })

        // 设置分类索引
        if (data.category) {
          const index = this.data.categories.indexOf(data.category)
          if (index !== -1) {
            this.setData({ categoryIndex: index })
          }
        }

        wx.showToast({
          title: '识别成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('OCR识别失败:', error)
      wx.showToast({
        title: '识别失败，请手动填写',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 通用输入处理
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  /**
   * 日期选择
   */
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    })
  },

  /**
   * 分类选择
   */
  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    })
  },

  /**
   * 重置表单
   */
  resetForm() {
    this.setData({
      previewUrl: '',
      filePath: '',
      fileType: '',
      loading: false,
      recognized: false,
      formData: {
        merchantName: '',
        itemName: '',
        date: '',
        amount: '',
        invoiceCode: '',
        category: '',
        remark: ''
      },
      categoryIndex: -1
    })
  },

  /**
   * 提交归档
   */
  async handleSubmit() {
    const { formData } = this.data

    // 表单校验
    if (!formData.merchantName.trim()) {
      return wx.showToast({
        title: '请输入商户名称',
        icon: 'none'
      })
    }

    if (!formData.date) {
      return wx.showToast({
        title: '请选择开票日期',
        icon: 'none'
      })
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      })
    }

    if (!formData.category) {
      return wx.showToast({
        title: '请选择费用分类',
        icon: 'none'
      })
    }

    this.setData({ submitting: true })

    try {
      const user = getCurrentUser()
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user ? user.id : null,
        status: 0 // 草稿状态
      }

      const res = await invoiceApi.save(submitData)

      if (res.code === 200) {
        wx.showToast({
          title: '归档成功',
          icon: 'success'
        })

        // 重置表单
        this.resetForm()

        // 延迟跳转到列表页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/list/list'
          })
        }, 1500)
      }
    } catch (error) {
      console.error('归档失败:', error)
      wx.showToast({
        title: error.msg || '归档失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
