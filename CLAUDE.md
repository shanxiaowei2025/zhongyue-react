# AI 助手核心规则

Always respond in Chinese.

## 三阶段工作流

### 阶段一：分析问题
**声明格式**：`【分析问题】`

**必须做的事**：
- 深入理解需求本质
- 搜索所有相关代码
- 识别问题根因
- 发现架构问题
- 如果有不清楚的，请向我收集必要的信息
- 提供1~3个解决方案（如果方案与用户想达成的目标有冲突，则不应该成为一个方案）
- 评估每个方案的优劣

**融入的原则**：
- 系统性思维：看到具体问题时，思考整个系统
- 第一性原则：从功能本质出发，而不是现有代码
- DRY原则：发现重复代码必须指出
- 长远考虑：评估技术债务和维护成本

**绝对禁止**：
- ❌ 修改任何代码
- ❌ 急于给出解决方案
- ❌ 跳过搜索和理解步骤
- ❌ 不分析就推荐方案

### 阶段二：细化方案
**声明格式**：`【细化方案】`

**前置条件**：
- 用户明确选择了方案（如："用方案1"、"实现这个"）

**必须做的事**：
- 列出变更（新增、修改、删除）的文件，简要描述每个文件的变化

### 阶段三：执行方案
**声明格式**：`【执行方案】`

**必须做的事**：
- 严格按照选定方案实现
- 修改后运行代码格式化（pnpm format）、类型检查（pnpm type-check）

**绝对禁止**：
- ❌ 提交代码（除非用户明确要求）
- 启动开发服务器

## 🚨 阶段切换规则

1. **默认阶段**：收到新问题时，始终从【分析问题】开始
2. **切换条件**：只有用户明确指示时才能切换阶段
3. **禁止行为**：不允许在一次回复中同时进行两个阶段

## ⚠️ 每次回复前的强制检查

```
□ 我在回复开头声明了阶段吗？
□ 我的行为符合当前阶段吗？
□ 如果要切换阶段，用户同意了吗？
```

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**中岳会计管理系统** (ZhongYue Accounting Management System) - A professional financial backend management system built with React 19, TypeScript, and Ant Design for comprehensive contract and expense management.

## Development Commands

```bash
# Start development server (port 5173)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint TypeScript code
pnpm lint

# Format code with Prettier
pnpm format
```

## Tech Stack Architecture

- **Frontend**: React 19 + TypeScript 5.x + Vite 5.x
- **UI Library**: Ant Design 5.24.6 (primary) + Tailwind CSS (utility)
- **State Management**: Zustand 4.5.6 with Immer middleware
- **Data Fetching**: SWR 2.3.3 + Axios 1.8.4
- **Forms**: Formik 2.4.6 + Yup 1.6.1 validation
- **Routing**: React Router 7.0 with lazy-loaded pages

## Key Architecture Patterns

### Authentication & Security
- JWT tokens with automatic refresh in `src/api/request.ts`
- Role-based access control with `AuthorizedRoute` and `PermissionGuard` components
- 30-minute inactivity logout with password expiration enforcement
- All API requests go through authentication interceptors

### State Management Strategy
- **Zustand stores** in `src/store/` for global state (auth, forms, page states)
- **SWR** for server state caching and revalidation
- **Page state persistence** for filters, pagination, and UI states
- **Immer middleware** for immutable state updates

### Component Structure
- **Lazy-loaded pages** in `src/pages/` for performance
- **Reusable components** in `src/components/`
- **Custom hooks** for data fetching (`useCustomer`, `useContract`, etc.)
- **Compound components** for complex UI patterns

### API Architecture
- All API modules in `src/api/` with consistent patterns
- Axios interceptors handle authentication and error responses
- SWR keys follow predictable naming conventions
- Environment-specific API base URLs (dev: localhost:3001, prod: container)

## Important Development Guidelines

### File Organization
```
src/
├── api/            # API request modules by domain
├── components/     # Reusable UI components
├── pages/          # Page components (lazy-loaded)
├── store/          # Zustand state stores
├── types/          # TypeScript definitions
├── hooks/          # Custom React hooks
├── routes/         # Routing configuration
└── utils/          # Utility functions
```

### Code Patterns to Follow
- Use existing custom hooks for data fetching rather than direct API calls
- Follow the established Zustand store patterns with Immer
- Implement proper permission checks using `PermissionGuard` for new features
- Use Ant Design components primarily, Tailwind for spacing/layout utilities
- All new pages should be lazy-loaded and follow existing route patterns

### Business Domain Context
- **Contract management**: Creation, digital signing, viewing, and lifecycle tracking
- **Expense management**: Receipt upload, expense tracking, audit workflows
- **Customer management**: Business profiles and relationship management  
- **User management**: Role-based access with departments and permissions
- **Enterprise services**: Service tracking and compliance monitoring

### Configuration Notes
- Vite proxy configured for `/api` routes in development
- Tailwind preflight disabled to work with Ant Design
- Code splitting configured for React, Ant Design, and utility chunks
- Docker deployment with Nginx serving and API container communication

### Common Workflows
- Authentication state is managed in `src/store/auth.ts`
- Form validation uses Yup schemas with Formik integration
- File uploads handled through `FileUpload` components with MinIO backend
- PDF generation available via `@react-pdf/renderer` for contracts
- Electronic signatures supported via `react-signature-canvas`

When adding new features, ensure they follow the established patterns for authentication, state management, and component structure. The codebase emphasizes security, performance, and maintainability.