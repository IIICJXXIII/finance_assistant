const { requireAuth } = require('../../utils/auth')
const { invoiceApi } = require('../../utils/api')
const { formatMoney, getCategoryIcon } = require('../../utils/util')

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: '',
    dayExpenses: [],
    dayTotal: '0.00',
    allData: []
  },

  onLoad() {
    if (!requireAuth()) return
    
    const now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedDate: this.formatDateStr(now)
    })
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    try {
      const res = await invoiceApi.getList()
      if (res.code === 200) {
        this.setData({ allData: res.data || [] })
        this.generateCalendar()
        this.loadDayExpenses()
      }
    } catch (error) {
      console.error('加载失败:', error)
    }
  },

  formatDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  generateCalendar() {
    const { currentYear, currentMonth, allData } = this.data
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const today = new Date()
    const todayStr = this.formatDateStr(today)
    
    // 生成有数据的日期集合
    const dataSet = new Set(allData.map(i => i.date))
    
    const days = []
    
    // 上月末尾
    const prevMonth = new Date(currentYear, currentMonth - 1, 0)
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonth.getDate() - i
      const date = this.formatDateStr(new Date(currentYear, currentMonth - 2, d))
      days.push({ day: d, date, isCurrentMonth: false, hasData: dataSet.has(date) })
    }
    
    // 当月
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({
        day: i,
        date,
        isCurrentMonth: true,
        isToday: date === todayStr,
        hasData: dataSet.has(date)
      })
    }
    
    // 下月开头
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = this.formatDateStr(new Date(currentYear, currentMonth, i))
      days.push({ day: i, date, isCurrentMonth: false, hasData: dataSet.has(date) })
    }
    
    this.setData({ days })
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ selectedDate: date })
    this.loadDayExpenses()
  },

  loadDayExpenses() {
    const { allData, selectedDate } = this.data
    const dayExpenses = allData
      .filter(i => i.date === selectedDate)
      .map(i => ({
        ...i,
        amountStr: formatMoney(i.amount),
        icon: getCategoryIcon(i.category)
      }))
    
    const dayTotal = formatMoney(dayExpenses.reduce((sum, i) => sum + (i.amount || 0), 0))
    
    this.setData({ dayExpenses, dayTotal })
  }
})
