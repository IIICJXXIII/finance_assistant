const { requireAuth } = require('../../utils/auth')
const { invoiceApi } = require('../../utils/api')

Page({
  data: {
    id: null,
    mode: 'view',
    isEditable: false,
    detail: {},
    formData: {
      merchantName: '',
      itemName: '',
      date: '',
      amount: '',
      invoiceCode: '',
      category: '',
      remark: ''
    },
    categories: ['餐饮美食', '交通出行', '办公耗材', '通讯网络', '电子设备', '其他'],
    categoryIndex: -1,
    saving: false
  },

  onLoad(options) {
    if (!requireAuth()) return
    
    const { id, mode = 'view' } = options
    this.setData({ 
      id: parseInt(id),
      mode,
      isEditable: mode === 'edit'
    })
    
    if (id) {
      this.loadDetail(parseInt(id))
    }
  },

  /**
   * 加载详情 - 从列表中查找（后端没有单独的详情接口）
   */
  async loadDetail(id) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      // 从列表接口获取数据
      const res = await invoiceApi.getList()
      if (res.code === 200 && res.data) {
        const detail = res.data.find(item => item.id === id)
        
        if (detail) {
          const categoryIndex = this.data.categories.indexOf(detail.category)
          
          this.setData({
            detail,
            formData: {
              merchantName: detail.merchantName || '',
              itemName: detail.itemName || '',
              date: detail.date || '',
              amount: detail.amount ? String(detail.amount) : '',
              invoiceCode: detail.invoiceCode || '',
              category: detail.category || '',
              remark: detail.remark || ''
            },
            categoryIndex,
            // 只有草稿(0)或被驳回(3)状态可编辑
            isEditable: this.data.mode === 'edit' && (detail.status === 0 || detail.status === 3 || detail.status === undefined)
          })
        } else {
          wx.showToast({ title: '记录不存在', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      }
    } catch (error) {
      console.error('加载详情失败:', error)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    })
  },

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    })
  },

  /**
   * 保存修改 - 使用 save 接口（后端没有单独的 update 接口）
   */
  async saveChanges() {
    const { formData, id, detail } = this.data

    if (!formData.merchantName.trim()) {
      return wx.showToast({ title: '请输入商户名称', icon: 'none' })
    }

    if (!formData.date) {
      return wx.showToast({ title: '请选择开票日期', icon: 'none' })
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return wx.showToast({ title: '请输入有效金额', icon: 'none' })
    }

    this.setData({ saving: true })

    try {
      // 合并原始数据和修改后的数据
      const submitData = {
        ...detail,
        ...formData,
        id,
        amount: parseFloat(formData.amount)
      }

      // 使用 save 接口保存（后端会根据 id 判断是更新还是新增）
      await invoiceApi.save(submitData)

      wx.showToast({ title: '保存成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
