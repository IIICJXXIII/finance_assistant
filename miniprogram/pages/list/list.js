/**
 * 归档记录列表页面逻辑
 */
const { requireAuth } = require('../../utils/auth')
const { invoiceApi, approvalApi } = require('../../utils/api')
const { formatMoney, getStatusInfo, debounce } = require('../../utils/util')

Page({
  /**
   * 页面数据
   */
  data: {
    // 搜索和筛选
    keyword: '',
    currentCategory: '',
    categories: ['餐饮美食', '交通出行', '办公耗材', '通讯网络', '电子设备'],
    
    // 列表数据
    list: [],
    allData: [],
    total: 0,
    
    // 加载状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    noMore: false,
    
    // 分页
    page: 1,
    pageSize: 20,
    
    // 操作弹窗
    showActions: false,
    currentItem: null
  },

  /**
   * 生命周期函数 - 页面加载
   */
  onLoad() {
    if (!requireAuth()) return
    
    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.handleSearch.bind(this), 500)
  },

  /**
   * 生命周期函数 - 页面显示
   */
  onShow() {
    this.loadData()
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true })
    
    try {
      const res = await invoiceApi.getList()
      
      if (res.code === 200) {
        const allData = (res.data || []).map(item => this.formatItem(item))
        
        this.setData({
          allData,
          total: allData.length
        })
        
        // 应用筛选
        this.applyFilter()
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ 
        loading: false,
        refreshing: false
      })
    }
  },

  /**
   * 格式化列表项
   */
  formatItem(item) {
    const statusInfo = getStatusInfo(item.status)
    
    // 分类样式
    const categoryClassMap = {
      '餐饮美食': 'tag-primary',
      '交通出行': 'tag-success',
      '办公耗材': 'tag-warning',
      '通讯网络': 'tag-danger',
      '电子设备': 'tag-info'
    }
    
    // 状态样式
    const statusClassMap = {
      'info': 'status-draft',
      'warning': 'status-pending',
      'success': 'status-approved',
      'danger': 'status-rejected'
    }
    
    return {
      ...item,
      amountStr: formatMoney(item.amount),
      statusText: statusInfo.text,
      statusClass: statusClassMap[statusInfo.type] || 'status-draft',
      categoryClass: categoryClassMap[item.category] || 'tag-info'
    }
  },

  /**
   * 应用筛选
   */
  applyFilter() {
    const { allData, keyword, currentCategory } = this.data
    
    let filtered = [...allData]
    
    // 关键词筛选
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(item => 
        (item.merchantName && item.merchantName.toLowerCase().includes(kw)) ||
        (item.itemName && item.itemName.toLowerCase().includes(kw))
      )
    }
    
    // 分类筛选
    if (currentCategory) {
      filtered = filtered.filter(item => item.category === currentCategory)
    }
    
    this.setData({
      list: filtered,
      total: filtered.length,
      noMore: true
    })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
    this.debouncedSearch()
  },

  /**
   * 执行搜索
   */
  handleSearch() {
    this.applyFilter()
  },

  /**
   * 清空搜索
   */
  clearSearch() {
    this.setData({ keyword: '' })
    this.applyFilter()
  },

  /**
   * 分类筛选
   */
  onCategoryFilter(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.applyFilter()
  },

  /**
   * 下拉刷新
   */
  onRefresh() {
    this.setData({ refreshing: true })
    this.loadData()
  },

  /**
   * 加载更多
   */
  onLoadMore() {
    // 本地数据，不需要分页
  },

  /**
   * 查看详情
   */
  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      currentItem: item,
      showActions: true
    })
  },

  /**
   * 隐藏操作弹窗
   */
  hideActions() {
    this.setData({ showActions: false })
  },

  /**
   * 提交审批 - 使用 approvalApi.submit
   */
  async submitApproval() {
    const { currentItem } = this.data
    
    try {
      await approvalApi.submit(currentItem.id)
      
      wx.showToast({
        title: '已提交审批',
        icon: 'success'
      })
      
      this.hideActions()
      this.loadData()
    } catch (error) {
      console.error('提交失败:', error)
    }
  },

  /**
   * 编辑
   */
  editItem() {
    const { currentItem } = this.data
    this.hideActions()
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${currentItem.id}&mode=edit`
    })
  },

  /**
   * 删除
   */
  async deleteItem() {
    const { currentItem } = this.data
    
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: '删除后将移入回收站，是否继续？',
        success: res => resolve(res.confirm)
      })
    })
    
    if (!confirmed) return
    
    try {
      await invoiceApi.delete(currentItem.id)
      
      wx.showToast({
        title: '已删除',
        icon: 'success'
      })
      
      this.hideActions()
      this.loadData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  },

  /**
   * 跳转到上传页
   */
  goToUpload() {
    wx.switchTab({
      url: '/pages/upload/upload'
    })
  }
})
