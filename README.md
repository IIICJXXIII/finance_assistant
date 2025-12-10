# 🧾 SmartDoc Frontend - 智能票据归档系统前端

基于 **Vue 3 + TypeScript + Vite + Element Plus** 构建的现代化财务票据管理前端应用。

## 后端仓库
https://github.com/IIICJXXIII/smart_doc_backend

---

## ✨ 技术栈

- **核心框架**：Vue 3 (Composition API)
- **开发语言**：TypeScript
- **构建工具**：Vite 7.x
- **UI 组件库**：Element Plus
- **路由管理**：Vue Router 4
- **状态管理**：Pinia
- **图表库**：Apache ECharts
- **HTTP 请求**：Axios

---

## 📂 项目结构

```plaintext
src/
├── assets/              # 静态资源 (CSS, 图片等)
├── components/          # 可复用组件
├── router/              # 路由配置
│   └── index.ts         # 路由守卫 & 路由表
├── stores/              # Pinia 状态管理
├── views/               # 页面组件
│   ├── Login.vue        # 登录页
│   ├── Register.vue     # 注册页
│   ├── SmartUploader.vue # 智能上传识别页
│   ├── DocList.vue      # 归档记录列表
│   └── StatsDashboard.vue # 数据统计看板
├── App.vue              # 根组件 (侧边栏 + 路由出口)
├── main.ts              # 应用入口 (Axios 拦截器配置)
└── env.d.ts             # TypeScript 类型声明
```

---

## 🚀 快速开始

### 1. 环境要求

- **Node.js**: 16.0 或更高版本
- **npm**: 7.0+

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 4. 构建生产版本

```bash
npm run build
```

生成的文件将输出到 `dist/` 目录。

### 5. 代码检查

```bash
npm run lint
```

---

## 🔧 配置说明

### API 基础路径

默认后端 API 地址为 `http://localhost:8080`，如需修改请在以下文件中统一调整：

- `src/views/Login.vue`
- `src/views/Register.vue`
- `src/views/SmartUploader.vue`
- `src/views/DocList.vue`
- `src/views/StatsDashboard.vue`

建议抽取为环境变量（`.env` 文件）：

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Axios 拦截器

在 `src/main.ts` 中已配置：

- **请求拦截器**：自动在请求头中附加 `Authorization: token`
- **响应拦截器**：401 状态码自动跳转登录页

---

## 📄 页面功能

| 路由路径    | 页面名称 | 功能说明                                     |
| ----------- | -------- | -------------------------------------------- |
| `/login`    | 登录页   | 用户登录认证                                 |
| `/register` | 注册页   | 新用户注册                                   |
| `/upload`   | 智能上传 | 拖拽/点击上传票据，AI 自动识别               |
| `/list`     | 归档列表 | 查看历史归档记录，支持编辑/删除              |
| `/stats`    | 数据报表 | ECharts 可视化统计（支出趋势图、分类占比等） |

---

## 🛡️ 路由守卫

项目实现了基于 Token 的路由权限控制：

- **白名单页面**：`/login`, `/register` 无需 Token 即可访问
- **受保护页面**：其他页面需登录后才能访问，未登录自动跳转到 `/login`

---

## 🎨 推荐 IDE 配置

### VS Code

- [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 3 官方插件
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

> 注意：如已安装 Vetur 插件，请禁用以避免冲突。

### 浏览器调试工具

- **Chrome/Edge**：[Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- **Firefox**：[Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

## 📝 开发注意事项

1. **TypeScript 类型支持**：已在 `env.d.ts` 中声明 `.vue` 文件模块，确保 IDE 正确识别。
2. **Element Plus 按需引入**：当前为完整引入，如需优化打包体积可配置自动导入。
3. **状态持久化**：用户信息存储于 `localStorage`，刷新页面后自动恢复登录状态。

---

## 🔗 相关链接

- [Vite 配置文档](https://vite.dev/config/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Apache ECharts 文档](https://echarts.apache.org/)

---

## 📦 主要依赖版本

```json
{
  "vue": "^3.5.25",
  "vue-router": "^4.6.3",
  "pinia": "^3.0.4",
  "element-plus": "latest",
  "axios": "latest",
  "echarts": "latest"
}
```

---

## 🤝 贡献

本项目为课程设计/毕业设计参考项目，欢迎提出改进建议。

**License**: MIT
