# 中岳后台管理系统

基于 React 19 + TypeScript + Vite + Ant Design 构建的后台管理系统。

## 技术栈

- React 19
- TypeScript
- Vite
- Ant Design
- Zustand (状态管理)
- React Router
- Formik + Yup (表单处理)
- ESLint + Prettier (代码规范)

## 功能特性

- 用户管理
  - 用户列表
  - 用户创建/编辑/删除
  - 用户状态管理
- 角色管理
  - 角色列表
  - 角色创建/编辑/删除
  - 角色权限分配
- 权限管理
  - 权限列表
  - 权限创建/编辑/删除
- 个人中心
  - 个人信息修改
  - 密码修改
  - 头像上传

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
  ├── api/          # API 请求
  ├── components/   # 公共组件
  ├── layouts/      # 布局组件
  ├── pages/        # 页面组件
  ├── store/        # 状态管理
  ├── types/        # 类型定义
  ├── utils/        # 工具函数
  └── App.tsx       # 应用入口
```

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
