# SmartDoc 财务助手 - 微信小程序

## 项目说明

本小程序是原 Vue 前端的微信小程序迁移版本，已完全适配后端 Spring Boot API。

## 后端 API 适配说明

### 认证机制
- **Token 格式**: 后端使用纯 UUID Token，不需要 `Bearer` 前缀
- **存储方式**: Token 存储在 `wx.Storage` 中，请求时通过 `Authorization` 头传递

### API 接口对应关系

| 功能 | 后端接口 | 方法 | 说明 |
|------|----------|------|------|
| 登录 | `/api/user/login` | POST | 返回 token 和 user |
| 注册 | `/api/user/register` | POST | 返回 code 和 msg |
| 登出 | `/api/user/logout` | POST | 清除服务端 token |
| 更新用户 | `/api/user/update` | POST | 更新昵称/密码 |
| 获取会话列表 | `/api/user/chat/sessions` | GET | AI 对话会话 |
| 获取对话历史 | `/api/user/chat/history` | GET | 需要 sessionId |
| 票据列表 | `/api/doc/list` | GET | 返回数组 |
| OCR 上传 | `/api/doc/upload` | POST | 返回 InvoiceData |
| 保存票据 | `/api/doc/save` | POST | 返回 'success' |
| 删除票据 | `/api/doc/delete/{id}` | DELETE | 软删除 |
| 导出 Excel | `/api/doc/export` | GET | 下载文件 |
| 提交审核 | `/api/audit/submit/{id}` | POST | 用户提交 |
| 待审核列表 | `/api/audit/pending-list` | GET | 管理员 |
| 审核通过 | `/api/audit/pass/{id}` | POST | 管理员 |
| 驳回 | `/api/audit/reject/{id}` | POST | 需要 reason |
| 趋势预测 | `/api/stats/trend` | GET | 含线性回归预测 |
| 知识图谱 | `/api/stats/graph` | GET | 返回 nodes/links |
| K-Means 聚类 | `/api/stats/clustering` | GET | 聚类结果 |
| AI 聚类分析 | `/api/stats/analyze-clustering` | GET | DeepSeek 分析 |
| 预算列表 | `/api/budget/list` | GET | 含 usedAmount |
| 保存预算 | `/api/budget/save` | POST | 按分类存储 |
| 删除预算 | `/api/budget/delete/{id}` | DELETE | |
| 回收站列表 | `/api/recycle/list` | GET | |
| 恢复 | `/api/recycle/restore/{id}` | POST | |
| 彻底删除 | `/api/recycle/destroy/{id}` | DELETE | |
| 清空回收站 | `/api/recycle/clear-all` | DELETE | |
| 操作日志 | `/api/system/logs` | GET | |
| 数据备份 | `/api/system/backup` | GET | 下载 JSON |
| 数据恢复 | `/api/system/restore` | POST | 上传 JSON |

### AI 聊天 (WebSocket)
- **连接地址**: `ws://host:port/ws/chat/{token}`
- **消息格式**: `{ "sessionId": "xxx", "content": "用户问题" }`
- **返回格式**: 纯文本 AI 回答

## TabBar 图标

请将以下 PNG 图标文件（建议 81x81 像素）放置到此目录：

### 普通状态图标（灰色）
- stats.png - 报表图标
- upload.png - 归档/上传图标  
- list.png - 列表/记录图标
- chat.png - 聊天/助手图标
- user.png - 用户/我的图标

### 选中状态图标（蓝色 #409EFF）
- stats-active.png
- upload-active.png
- list-active.png
- chat-active.png
- user-active.png

## 配置说明

1. **服务器地址**: 在 `app.js` 中修改 `globalData.baseUrl`
2. **AppID**: 在 `project.config.json` 中配置
3. **WebSocket**: 确保服务器支持 WebSocket 连接

## 运行方式

1. 微信开发者工具导入 `miniprogram` 目录
2. 配置正确的后端服务器地址
3. 编译运行
