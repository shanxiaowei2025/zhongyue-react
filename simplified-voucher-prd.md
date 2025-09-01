# 凭证存放记录功能PRD（精简版）

## 1. 产品概述

### 1.1 功能定位
在客户管理系统的档案存放信息中新增凭证存放记录功能，实现对客户凭证整理进度的分年分月管理，支持状态跟踪和批量导出。

### 1.2 核心价值
- **提升工作效率**：记账会计可快速录入和查看凭证整理进度
- **进度可视化**：通过颜色状态直观展示每月整理情况  
- **统一管理**：支持批量导出生成进度报表
- **权限控制**：基于角色的精细化权限管理

## 2. 功能架构

### 2.1 功能模块设计

```
凭证存放记录功能
├── 客户编辑模态框集成（快速编辑模式）
│   ├── 年度信息管理
│   ├── 月份状态设置  
│   ├── 批量操作
│   └── 通用备注
├── 独立管理页面（完整功能模式）
│   ├── 进度概览统计
│   ├── 批量管理工具
│   └── 高级筛选功能
└── 导出功能
    ├── 单客户导出
    └── 全局批量导出
```

### 2.2 用户权限设计

| 角色 | 查看 | 编辑 | 删除 | 导出 |
|------|------|------|------|------|
| 记账会计 | ✅ | ✅ | ✅ | ✅ |
| 顾问会计 | ✅ | ❌ | ❌ | ✅ |
| 管理员/超级管理员 | ✅ | ✅ | ✅ | ✅ |
| 其他用户 | ❌ | ❌ | ❌ | ❌ |

## 3. 技术架构

### 3.1 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端层 (React)   │    │   后端层 (NestJS)   │    │   数据层 (MySQL)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - 紧凑式凭证组件   │    │ - VoucherRecord     │    │ - voucher_record_   │
│ - 独立管理页面     │◄──►│   Controller        │◄──►│   years             │
│ - Popover编辑器   │    │ - VoucherRecord     │    │ - voucher_record_   │
│ - 批量操作组件     │    │   Service           │    │   months            │
│ - Excel导出工具   │    │ - 权限控制服务       │    │ - 权限验证          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 数据库设计

#### 3.2.1 年度记录表 (voucher_record_years)
```sql
CREATE TABLE `voucher_record_years` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `customer_id` int NOT NULL COMMENT '客户ID',
  `year` int NOT NULL COMMENT '年度',
  `storage_location` varchar(255) COMMENT '存放位置',
  `handler` varchar(100) COMMENT '经手人', 
  `withdrawal_record` text COMMENT '取走记录',
  `general_remarks` text COMMENT '通用备注',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_customer_year` (`customer_id`, `year`),
  FOREIGN KEY (`customer_id`) REFERENCES `sys_customer` (`id`)
);
```

#### 3.2.2 月度记录表 (voucher_record_months) 
```sql
CREATE TABLE `voucher_record_months` (
  `id` int PRIMARY KEY AUTO_INCREMENT,
  `year_record_id` int NOT NULL COMMENT '年度记录ID',
  `month` tinyint NOT NULL COMMENT '月份(1-12)',
  `status` enum('completed','incomplete','not_required','not_set') DEFAULT 'not_set',
  `description` text COMMENT '月度说明',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_year_month` (`year_record_id`, `month`),
  FOREIGN KEY (`year_record_id`) REFERENCES `voucher_record_years` (`id`)
);
```

### 3.3 核心API设计

#### 3.3.1 主要接口列表
```typescript
// 获取客户凭证记录
GET /voucher-records/customer/:customerId/year/:year

// 创建年度记录 
POST /voucher-records/customer/:customerId/year

// 更新年度基本信息
PATCH /voucher-records/year/:yearRecordId

// 批量更新月度状态
PATCH /voucher-records/year/:yearRecordId/months

// 批量导出
GET /voucher-records/export/batch?year=2024&format=excel

// 进度统计
GET /voucher-records/statistics?year=2024
```

#### 3.3.2 数据传输对象 (DTO)
```typescript
// 月度记录更新DTO
export class UpdateMonthsDto {
  months: {
    month: number;        // 1-12
    status: VoucherStatus; // 状态枚举
    description?: string;  // 说明
  }[];
}

// 年度信息DTO
export class YearRecordDto {
  year: number;
  storageLocation?: string;
  handler?: string; 
  withdrawalRecord?: string;
  generalRemarks?: string;
}
```

## 4. 前端实现方案

### 4.1 组件设计架构

```typescript
// 主要组件层次结构
VoucherRecordManager (主组件)
├── VoucherRecordCompact (紧凑模式 - 用于模态框)
│   ├── YearControls (年份选择)
│   ├── CollapseYearInfo (年度信息面板)
│   ├── MonthsGrid (月份状态网格)
│   ├── BatchOperations (批量操作)
│   └── RemarksSection (备注区域)
├── VoucherManagementPage (独立页面)
│   ├── StatsOverview (统计概览)
│   ├── FilterPanel (筛选面板) 
│   └── ProgressTable (进度表格)
└── MonthEditPopover (月份编辑弹窗)
```

### 4.2 关键技术实现

#### 4.2.1 状态管理
```typescript
// 使用SWR进行数据缓存和状态管理
const useVoucherRecord = (customerId: number, year: number) => {
  const { data, error, mutate } = useSWR(
    `/voucher-records/customer/${customerId}/year/${year}`,
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000 
    }
  );
  
  return { voucherRecord: data, isLoading: !data && !error, mutate };
};
```

#### 4.2.2 权限控制Hook
```typescript
const useVoucherPermission = (customerId: number) => {
  const { user } = useAuthStore();
  
  return useMemo(() => {
    if (user?.roles?.includes('admin')) {
      return { canView: true, canEdit: true, canDelete: true };
    }
    if (user?.roles?.includes('bookkeepingAccountant')) {
      return { canView: true, canEdit: true, canDelete: true };
    }
    if (user?.roles?.includes('consultantAccountant')) {
      return { canView: true, canEdit: false, canDelete: false };
    }
    return { canView: false, canEdit: false, canDelete: false };
  }, [user, customerId]);
};
```

## 5. 后端实现方案

### 5.1 核心Service实现

```typescript
@Injectable()
export class VoucherRecordService {
  
  // 获取或创建年度记录（含12个月初始化）
  async getOrCreateYearRecord(customerId: number, year: number) {
    let yearRecord = await this.findYearRecord(customerId, year);
    
    if (!yearRecord) {
      yearRecord = await this.createYearRecordWithMonths(customerId, year);
    }
    
    return yearRecord;
  }

  // 批量更新月度状态
  async batchUpdateMonthStatus(yearRecordId: number, updates: MonthUpdateDto[]) {
    const results = await Promise.all(
      updates.map(update => 
        this.monthRepository.upsert({
          yearRecordId,
          month: update.month,
          status: update.status,
          description: update.description,
        }, ['yearRecordId', 'month'])
      )
    );
    
    return results;
  }

  // 生成进度统计
  async getProgressStatistics(year: number, customerIds?: number[]) {
    const query = this.createStatsQuery(year, customerIds);
    const stats = await query.getRawMany();
    
    return {
      totalCustomers: stats.totalCustomers,
      completed: stats.completedCount,
      incomplete: stats.incompleteCount,
      notRequired: stats.notRequiredCount,
    };
  }
}
```

### 5.2 权限验证Service

```typescript
@Injectable() 
export class VoucherPermissionService {
  
  async checkVoucherPermission(userId: number, action: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });
    
    // 权限矩阵验证逻辑
    const rolePermissions = {
      'bookkeepingAccountant': ['view', 'edit', 'delete', 'export'],
      'consultantAccountant': ['view', 'export'],
      'admin': ['view', 'edit', 'delete', 'export'],
      'super_admin': ['view', 'edit', 'delete', 'export']
    };
    
    return user?.roles.some(role => 
      rolePermissions[role]?.includes(action)
    ) || false;
  }
}
```

## 6. 导出功能设计

### 6.1 Excel导出格式
导出的Excel表格格式参考现有的"凭证进度及档案表.xlsx"，包含以下列：

| 列名 | 说明 | 数据来源 |
|------|------|----------|
| 客户名称 | 企业名称 | sys_customer.companyName |
| 记账会计 | 负责记账的会计 | sys_customer.bookkeepingAccountant |
| 存放位置 | 凭证存放地址 | voucher_record_years.storage_location |
| 经手人 | 负责人员 | voucher_record_years.handler |
| 1月-12月 | 各月状态 | voucher_record_months.status |
| 完成率 | 计算得出 | 已完成月份数/12 |
| 取走记录 | 借出情况 | voucher_record_years.withdrawal_record |
| 备注 | 通用备注 | voucher_record_years.general_remarks |

### 6.2 导出实现
```typescript
@Get('export/batch')
async exportVoucherProgress(@Query() query: ExportQueryDto) {
  const data = await this.voucherRecordService.getExportData(query);
  
  const excelData = data.map(item => ({
    '客户名称': item.companyName,
    '记账会计': item.bookkeepingAccountant,
    '存放位置': item.storageLocation,
    '经手人': item.handler,
    ...this.generateMonthColumns(item.months),
    '完成率': item.completionRate + '%',
    '取走记录': item.withdrawalRecord,
    '备注': item.generalRemarks,
  }));
  
  return this.excelService.generateWorkbook(excelData, query.year);
}
```

## 7. 实施计划

### 7.1 开发时间规划（共10天）

| 阶段 | 时间 | 交付内容 |
|------|------|----------|
| Phase 1 | 3天 | 数据库设计、后端API开发、权限控制 |
| Phase 2 | 4天 | 前端紧凑组件、模态框集成、交互功能 |
| Phase 3 | 2天 | 独立管理页面、批量操作功能 |
| Phase 4 | 1天 | 导出功能、测试优化、文档完善 |

### 7.2 技术风险控制

| 风险项 | 缓解措施 |
|--------|----------|
| 模态框空间限制 | 采用紧凑设计，Popover替代嵌套Modal |
| 性能问题 | 使用SWR缓存，虚拟滚动优化大数据展示 |
| 权限复杂性 | 基于现有权限系统扩展，详细权限测试 |
| 数据一致性 | 数据库约束，事务处理，乐观锁控制 |

## 8. 成功指标

### 8.1 功能指标
- ✅ 支持按年月管理凭证进度
- ✅ 4种状态可视化展示（已完成/未完成/无需整理/未设置）
- ✅ 批量操作提升录入效率80%以上
- ✅ 导出功能生成标准化Excel报表

### 8.2 性能指标  
- 页面加载时间 < 2秒
- 批量更新响应时间 < 1秒
- 导出1000客户数据 < 10秒
- 数据库查询响应时间 < 500ms

### 8.3 用户体验指标
- 操作流程简化至最少3步完成月度状态更新
- 界面响应式适配，支持移动端操作
- 权限控制精确，无误操作提示完善

这个精简版PRD突出了核心架构设计和实现方案，配合效果图能够清晰地指导开发团队进行功能实现。