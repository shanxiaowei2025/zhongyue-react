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
- 客户管理
  - 客户列表
  - 客户详情查看
  - 客户创建/编辑/删除
  - 客户资料分类管理 (基本信息、业务详情、税务信息、银行账户、证照信息)
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
