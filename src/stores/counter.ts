/**
 * Pinia 状态管理示例 - 计数器 Store
 *
 * 说明: 这是 Vue 官方脚手架生成的示例 Store
 * Pinia 是 Vue 3 推荐的状态管理库，用于在组件之间共享状态
 *
 * 使用方式: 在组件中通过 const store = useCounterStore() 获取实例
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * 定义计数器 Store
 *
 * @param 'counter' - Store 的唯一标识符 (ID)
 * @param () => {...} - Setup 函数式语法，类似于组件的 setup()
 */
export const useCounterStore = defineStore('counter', () => {
  // --- 响应式状态 (State) ---
  // 类似于组件中的 ref()
  const count = ref(0)

  // --- 计算属性 (Getters) ---
  // 基于 state 派生的响应式值
  const doubleCount = computed(() => count.value * 2)

  // --- 操作方法 (Actions) ---
  // 用于修改 state 的函数
  function increment() {
    count.value++
  }

  // 返回需要暴露给组件使用的状态和方法
  return { count, doubleCount, increment }
})
