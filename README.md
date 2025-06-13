# 中岳后台管理系统

基于 React 19 + TypeScript + Vite + Ant Design 构建的专业财务后台管理系统。

## 技术栈

- **前端框架**: React 19
- **开发语言**: TypeScript 5.x
- **构建工具**: Vite 5.x
- **UI组件库**: Ant Design 5.x
- **状态管理**: Zustand 4.x
- **路由管理**: React Router 7.0
- **表单处理**: Formik + Yup
- **API请求**: Axios + SWR
- **样式处理**: Tailwind CSS
- **日期处理**: Day.js
- **代码规范**: ESLint + Prettier
- **包管理器**: pnpm

## 功能特性

### 认证与授权
- 基于 JWT 的用户认证系统
- 基于角色的访问控制 (RBAC)
- 自动登出机制（长时间未操作）
- 密码过期提醒与强制修改

### 系统管理
- **用户管理**: 创建、编辑、删除用户，分配角色与权限
- **角色管理**: 自定义角色及权限分配
- **权限管理**: 细粒度的权限控制
- **部门管理**: 部门层级结构维护

### 客户管理
- 客户信息的完整生命周期管理
- 多维度客户信息分类（基本信息、业务详情、税务信息等）
- 客户资料上传与管理
- 客户状态跟踪（正常、异常、注销、吊销）
- 业务状态管理（正常、已注销、注销中、挂失、待转移）
- 搜索条件和分页状态持久化
- 客户详情Tab状态持久化

### 合同管理
- 合同创建、编辑、查看完整流程
- 电子合同签署功能
- 合同模板支持
- 合同状态跟踪（草稿、已签署、已生效、已到期）
- 合同附件上传与预览

### 费用管理
- 费用记录的创建、编辑、删除
- 多类型费用分类管理
- 费用审批流程
- 电子收据生成和预览
- 费用自动计算和汇总
- 费用数据导出

### UI/UX
- 响应式设计，适配不同设备
- 多标签页布局，支持标签持久化
- 暗色/亮色主题切换
- 自定义组件库（图片上传、文件上传等）

### 性能优化
- 路由懒加载
- 组件按需加载
- SWR数据缓存策略
- 图片加载优化

## 开发环境

- Node.js >= 18
- pnpm >= 8

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 启动开发服务器

```bash
pnpm dev
```

3. 构建生产环境

```bash
pnpm build
```

## 本地登录

系统内置了模拟登录功能，可以使用以下账号登录：

- 管理员账号
  - 用户名：admin
  - 密码：admin
- 编辑账号
  - 用户名：editor
  - 密码：editor
- 普通用户账号
  - 用户名：user
  - 密码：user

## 项目结构

```
src/
  ├── api/          # API 请求封装
  ├── assets/       # 静态资源
  ├── components/   # 公共组件
  ├── constants/    # 常量定义
  ├── hooks/        # 自定义钩子
  ├── layouts/      # 布局组件
  ├── pages/        # 页面组件
  ├── routes/       # 路由配置
  ├── store/        # 状态管理
  ├── types/        # 类型定义
  ├── utils/        # 工具函数
  ├── App.tsx       # 应用入口
  └── main.tsx      # 渲染入口
```

## 状态管理

系统使用Zustand进行状态管理，提供了以下特性：

- **全局认证状态**: 管理用户登录、权限和会话
- **页面状态持久化**: 基于`usePageStates`钩子实现页面状态的保存和恢复
  - 搜索条件保存
  - 分页参数保存
  - Tab状态保存
  - 滚动位置记忆
- **不可变数据更新**: 使用immer中间件简化状态更新逻辑

## 数据请求

系统使用Axios和SWR进行数据获取，提供了以下特性：

- **统一请求封装**: 封装常用请求方法，统一错误处理
- **请求拦截器**: 自动添加认证token和其他请求头
- **响应拦截器**: 统一处理后端返回的数据格式和错误码
- **数据缓存**: 使用SWR进行数据缓存和自动重新验证
- **请求去重和防抖**: 避免重复请求和频繁请求
- **错误处理和重试**: 提供友好的错误提示和重试机制
- **数据乐观更新**: 提升用户操作体验

## 数据库表结构

### 用户表 (zy_user)

- id: 主键
- username: 用户名
- password: 密码
- nickname: 昵称
- email: 邮箱
- avatar: 头像
- phone: 手机号
- sex: 性别 (0: 男, 1: 女)
- status: 状态 (0: 禁用, 1: 启用)
- dept_id: 部门ID
- remark: 备注
- roles: 角色列表
- user_groups: 用户组列表
- user_permissions: 用户权限列表
- is_superuser: 是否超级管理员
- is_staff: 是否员工
- is_active: 是否激活
- is_expense_auditor: 是否费用审核员
- date_joined: 加入日期
- last_login: 最后登录时间
- first_name: 名
- last_name: 姓
- create_time: 创建时间
- update_time: 更新时间

### 角色表 (zy_role)

- id: 主键
- name: 角色名称
- code: 角色代码
- status: 状态 (0: 禁用, 1: 启用)
- remark: 备注
- create_time: 创建时间
- update_time: 更新时间

### 权限表 (zy_permission)

- id: 主键
- role_name: 角色名称
- page_name: 页面名称
- permission_name: 权限名称
- permission_value: 权限值
- description: 描述
- role_id: 角色ID

### 客户表 (zy_customer)

- id: 主键
- company_name: 企业的法定名称
- daily_contact: 日常业务联系人姓名
- daily_contact_phone: 日常业务联系人的联系电话
- sales_representative: 负责该客户的业务员姓名
- social_credit_code: 企业的统一社会信用代码
- tax_bureau: 企业所属的税务分局
- business_source: 客户的业务来源渠道
- tax_registration_type: 企业的税务登记类型
- chief_accountant: 负责该企业的主管会计姓名
- responsible_accountant: 负责该企业的责任会计姓名
- enterprise_status: 企业当前的经营状态
- affiliated_enterprises: 与该企业有关联的其他企业
- main_business: 企业的主要经营业务
- boss_profile: 企业老板的个人特征描述
- communication_notes: 与该企业沟通时需要注意的事项
- business_scope: 企业的经营范围描述
- business_address: 企业的实际经营地址
- registered_capital: 企业的注册资本金额
- establishment_date: 企业的成立日期
- license_expiry_date: 营业执照的到期日期
- capital_contribution_deadline: 注册资本认缴的截止日期
- enterprise_type: 企业的类型，如有限责任公司、股份有限公司等
- shareholders: 企业的股东信息
- supervisors: 企业的监事信息
- annual_inspection_password: 工商年检系统的登录密码
- paid_in_capital: 企业实际缴纳的注册资本金额
- administrative_licenses: 企业获得的行政许可信息
- capital_contribution_records: 企业注册资本实缴的记录
- basic_bank: 企业的基本开户银行名称
- basic_bank_account: 企业的基本开户银行账号
- basic_bank_number: 企业基本开户银行的行号
- general_bank: 企业的一般开户银行名称
- general_bank_account: 企业的一般开户银行账号
- general_bank_number: 企业一般开户银行的行号
- has_online_banking: 企业是否办理了网上银行
- is_online_banking_custodian: 企业的网银盾是否由我方托管
- legal_representative_name: 企业法定代表人姓名
- legal_representative_phone: 企业法定代表人的联系电话
- legal_representative_id: 企业法定代表人的身份证号码
- legal_representative_tax_password: 法定代表人的电子税务局登录密码
- financial_contact_name: 企业财务负责人姓名
- financial_contact_phone: 企业财务负责人的联系电话
- financial_contact_id: 企业财务负责人的身份证号码
- financial_contact_tax_password: 财务负责人的电子税务局登录密码
- tax_officer_name: 企业办税员姓名
- tax_officer_phone: 企业办税员的联系电话
- tax_officer_id: 企业办税员的身份证号码
- tax_officer_tax_password: 办税员的电子税务局登录密码
- tripartite_agreement_account: 用于税费扣缴的三方协议账户
- tax_categories: 企业需要缴纳的税种
- personal_income_tax_staff: 需要申报个人所得税的员工信息
- personal_income_tax_password: 个人所得税申报系统的登录密码
- legal_person_id_images: 法定代表人身份证的扫描件或照片地址 (JSON)
- other_id_images: 其他相关人员身份证的扫描件或照片地址 (JSON)
- business_license_images: 企业营业执照的扫描件或照片地址 (JSON)
- bank_account_license_images: 企业开户许可证的扫描件或照片地址 (JSON)
- supplementary_images: 其他补充的扫描件或照片地址 (JSON)
- update_time: 记录的最后更新时间
- create_time: 记录的创建时间
- submitter: 创建或最后修改该记录的用户
- business_status: 当前业务的状态
- boss_name: 企业老板的姓名

## 最近更新

### 2024-07-XX

- **✅ 升级到React 19**：
  - 升级React框架到v19版本
  - 添加`@ant-design/v5-patch-for-react-19`支持最新React版本
  - 优化组件渲染性能
  - 利用新的Hooks API改进状态管理

- **✅ 安全性增强**：
  - 实现自动登出机制，长时间无操作自动退出
  - 添加密码过期检查和强制修改功能
  - 改进API请求错误处理和状态码管理
  - 优化权限控制，提供更细粒度的访问控制

- **✅ 用户体验优化**：
  - 优化多标签页管理，实现标签状态持久化
  - 改进图片上传组件，支持预览和重试加载
  - 添加文件上传进度显示和状态反馈
  - 优化表单验证和错误提示体验

### 2023-08-XX

- **✅ 修复签名板显示问题**：
  - 解决了合同签署页面中签名板在电脑端右侧缺失的问题
  - 优化了`SignatureCanvasForward`组件，确保canvas能够完全撑满父容器
  - 改进了canvas尺寸计算逻辑，支持动态适应容器大小
  - 保持了笔触与笔迹的一致性，通过`devicePixelRatio`处理高分辨率屏幕
  - 增加了横屏模式下的签名区域尺寸，提供更好的签名体验
  - 添加了CSS强制样式，确保签名画布在各种设备上都能正确显示

- **✅ 修复合同签署超时问题**：
  - 移除了合同签署相关API的超时限制，解决签名上传时的timeout错误
  - 将`publicRequest`和主要axios实例的`timeout`设置为0（无超时）
  - 确保大文件上传和慢网络环境下的签名操作不会被中断

- **✅ 优化代理记账合同表单**：
  - 去掉了委托业务范围勾选项后面的金额输入框，简化操作流程
  - 更新了`AgencyAccountingAgreement`组件，移除了服务费用输入和处理逻辑
  - 更新了`AgencyAccountingAgreementView`组件，在查看模式中不再显示服务费用
  - 简化了`declarationService`数据结构，只保存选中的服务项目信息

- **✅ 统一产品服务协议字体样式**：
  - 修复了产品服务协议中勾选框和服务项目文本的字体不一致问题
  - 强制所有文本元素使用`'SourceHanSerifCN', '思源宋体', serif`字体族
  - 更新了CSS样式，确保Ant Design组件也使用正确的字体
  - 优化了查看模式中inline样式的字体设置，保证显示一致性

- **✅ 优化合同签署日期自动生成逻辑**：
  - 将签署日期自动生成提前到"生成签署链接"操作的开始阶段
  - 在生成合同图片前先检查并设置甲方、乙方签署日期（如果为空）
  - 添加了数据刷新机制，确保页面立即显示更新后的日期信息
  - 优化了流程顺序：日期设置 → 页面刷新 → 生成合同图片 → 生成签署链接
  - 提升了用户体验，生成的合同图片中能够正确显示当前日期

- **✅ 客户管理搜索优化**：
  - 将搜索表单中的"税号"字段替换为"统一社会信用代码"
  - 更新了相关的TypeScript类型定义和API参数
  - 确保了前后端接口的一致性

- 优化费用管理模块：
  - 费用收据模态框宽度扩展至1200px，提供更大的显示空间
  - 增加横向滚动功能，确保在所有屏幕尺寸下都能正常查看收据内容
  - 优化收据保存功能，保存为图片时不包含电子合同上传部分，确保收据的清洁性
  - 优化收据布局和显示效果，提升用户体验
- 字体优化：
  - 嵌入 SimSun（宋体）字体文件，确保在所有环境下收据文档都能正确显示标准字体
  - 添加字体回退机制，在 SimSun 不可用时自动使用微软雅黑等替代字体
  - 创建专用的正式文档字体样式类，便于在其他正式文档中重复使用

### 2023-07-XX

- 增强了图片管理功能：
  - 客户删除时自动删除关联的所有图片文件，避免服务器存储冗余数据
  - 改进图片预览体验，点击整个图片容器而不仅是图片本身即可查看大图
  - 优化多图片上传标签显示，在图片底部清晰显示用户设置的标签
  - 图片上传或删除后自动保存客户信息但不关闭编辑窗口，提升用户体验
- 提升了代码健壮性：
  - 增强了图片管理逻辑，支持多种数据结构格式
  - 添加详细的状态日志记录，便于调试和问题排查

### 2023-06-XX

- 添加了页面状态持久化功能：
  - 客户详情页中的Tab状态现在会被保存，在页面刷新或关闭后重新打开时会恢复到上次查看的Tab
  - 保存了客户详情页的滚动位置，在切换Tab时会保持浏览的位置
  - 客户列表页面的搜索条件和分页参数也会被持久化保存
- 优化了组件性能和用户体验：
  - 使用SWR进行数据获取
  - 优化了图片预览功能
  - 改进了表单提交逻辑

## Docker部署

本项目支持使用Docker进行容器化部署，简化了部署流程。

### 使用Docker部署

1. 构建Docker镜像:

```bash
docker build -t zhongyue-react .
```

2. 运行Docker容器:

```bash
docker run -d -p 80:80 --name zhongyue-frontend zhongyue-react
```

### 使用Docker Compose部署

如果你希望使用Docker Compose来简化多容器部署:

1. 启动服务:

```bash
docker-compose up -d
```

2. 停止服务:

```bash
docker-compose down
```

### 自定义API服务器地址

若要连接到自定义的API服务器，可以修改`nginx/nginx.conf`文件中的`proxy_pass`配置，或在部署时挂载自定义配置:

```bash
docker run -d -p 80:80 -v /path/to/custom/nginx.conf:/etc/nginx/conf.d/default.conf zhongyue-frontend
```

### 生产环境注意事项

在生产环境中部署时，建议:

1. 使用HTTPS加密通信
2. 为API服务配置适当的CORS策略
3. 使用环境变量管理敏感信息
4. 配置适当的日志记录和监控

- 移除了图片上传大小限制，现在支持上传任意大小的图片
- 修复了Nginx配置中的client_max_body_size限制，解决了413 Request Entity Too Large错误
- 优化多图片上传标签显示，在图片底部清晰显示用户设置的标签
- 图片上传或删除后自动保存客户信息但不关闭编辑窗口，提升用户体验

## 🆕 新增功能：费用收据跳转查看

### 功能说明
在企业服务详情页面的"费用贡献"模块中，用户可以点击收据编号直接跳转到费用管理页面并自动打开对应的收据详情模态框。

### 实现方式
1. **URL参数传递**：点击收据时，会跳转到 `/expenses?openReceipt=收据编号`
2. **自动模态框打开**：费用管理页面会识别URL参数，自动查找对应的费用记录并打开收据模态框
3. **参数清理**：模态框打开后，会自动清除URL参数，避免重复打开

### 使用流程
1. 在企业服务页面，查看企业的费用贡献记录
2. 点击任意收据编号链接
3. 自动跳转到费用管理页面
4. 收据详情模态框自动打开，显示完整的电子收据信息

### 技术特点
- ✅ 支持URL直接访问收据
- ✅ 保持现有模态框体验
- ✅ 支持浏览器前进/后退
- ✅ 便于分享和书签
- ✅ 自动错误处理和用户提示
