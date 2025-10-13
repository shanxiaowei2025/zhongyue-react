import { useCallback } from 'react'
import useSWR from 'swr'
import { message } from 'antd'
import {
  salaryApi,
  integratedApi,
  getSWRKeys,
  socialInsuranceApi,
  subsidyApi,
  attendanceApi,
  friendCircleApi,
} from '../api/salaryIntegrated'
import {
  useSalaryIntegratedSelectors,
  useSalaryIntegratedActions,
} from '../store/salaryIntegratedStore'
import type {
  SalaryRecord,
  CreateSalaryDto,
  UpdateSalaryDto,
  ImportResult,
  ImportType,
  SalaryQueryParams,
} from '../types/salaryIntegrated'
import { recordImportStatus } from '../utils/importStatus'

// 集成化薪资管理主Hook
export const useSalaryIntegrated = () => {
  const { selectedEmployee, selectedYearMonth, salaryData, relatedData, statistics, loading, searchState } =
    useSalaryIntegratedSelectors()

  const {
    setSelectedEmployee,
    setSelectedYearMonth,
    setSalaryData,
    setRelatedData,
    setStatistics,
    setLoading,
    setSearchState,
    resetSearchState,
    updateSalaryRecord,
    removeSalaryRecord,
    addSalaryRecord,
    batchUpdateSalaryRecords,
  } = useSalaryIntegratedActions()

  // 获取月度数据
  const { isLoading: isMonthlyLoading, mutate: mutateMonthly } = useSWR(
    getSWRKeys.monthlyData(selectedYearMonth, searchState),
    () => integratedApi.loadMonthlyData(selectedYearMonth, searchState),
    {
      revalidateOnFocus: false,
      fallbackData: {
        salaryData: [],
        statistics: {
          employeeCount: 0,
          totalPayable: 0,
          totalSocialInsurance: 0,
          totalTax: 0,
          paidCount: 0,
          unpaidCount: 0,
          confirmedCount: 0,
          unconfirmedCount: 0,
          confirmationRate: 0,
        },
      },
      onSuccess: data => {
        if (data) {
          setSalaryData(data.salaryData)
          setStatistics(data.statistics)
        }
      },
    }
  )

  // 获取选中员工的关联数据
  const { isLoading: isRelatedLoading, mutate: mutateRelated } = useSWR(
    selectedEmployee ? getSWRKeys.relatedData(selectedEmployee.name, selectedYearMonth) : null,
    () => integratedApi.loadEmployeeRelatedData(selectedEmployee!.name, selectedYearMonth),
    {
      revalidateOnFocus: false,
      fallbackData: {
        socialInsurance: undefined,
        subsidy: undefined,
        attendance: undefined,
        friendCircle: undefined,
      },
      onSuccess: data => {
        if (data) {
          setRelatedData(data)
        }
      },
    }
  )

  // 操作方法
  const operations = {
    // 自动生成薪资（固定使用当前月份）
    autoGenerateSalary: useCallback(async () => {
      try {
        setLoading(true)
        message.loading('正在自动生成薪资数据...', 0)

        const result = await salaryApi.autoGenerateSalary()

        message.destroy()
        message.success(`${result.message}`)

        // 也可以使用更详细的信息
        // message.success(`薪资数据生成成功：新增${result.details.created}条，更新${result.details.updated}条记录`)

        // 刷新数据
        await mutateMonthly()

        return result
      } catch (error: any) {
        message.destroy()
        message.error(`自动生成薪资失败: ${error.message}`)
        throw error
      } finally {
        setLoading(false)
      }
    }, [mutateMonthly, setLoading]),

    // 更新薪资记录
    updateSalary: useCallback(
      async (id: number, data: UpdateSalaryDto) => {
        try {
          const updatedRecord = await salaryApi.updateSalary(id, data)

          // 乐观更新
          updateSalaryRecord(id, updatedRecord)

          message.success('薪资记录更新成功')
          return updatedRecord
        } catch (error: any) {
          message.error(`更新薪资记录失败: ${error.message}`)
          throw error
        }
      },
      [updateSalaryRecord]
    ),

    // 删除薪资记录
    deleteSalary: useCallback(
      async (id: number) => {
        try {
          await salaryApi.deleteSalary(id)

          // 乐观更新
          removeSalaryRecord(id)

          message.success('薪资记录删除成功')
        } catch (error: any) {
          message.error(`删除薪资记录失败: ${error.message}`)
          throw error
        }
      },
      [removeSalaryRecord]
    ),

    // 创建薪资记录
    createSalary: useCallback(
      async (data: CreateSalaryDto) => {
        try {
          const newRecord = await salaryApi.createSalary(data)

          // 乐观更新
          addSalaryRecord(newRecord)

          message.success('薪资记录创建成功')
          return newRecord
        } catch (error: any) {
          message.error(`创建薪资记录失败: ${error.message}`)
          throw error
        }
      },
      [addSalaryRecord]
    ),

    // 更新关联数据
    updateRelatedData: useCallback(
      async (type: string, data: any) => {
        try {
          let result

          switch (type) {
            case 'socialInsurance':
              result = await socialInsuranceApi.updateSocialInsurance(data.id, data)
              break
            case 'subsidy':
              result = await subsidyApi.updateSubsidy(data.id, data)
              break
            case 'attendance':
              result = await attendanceApi.updateAttendance(data.id, data)
              break
            case 'friendCircle':
              result = await friendCircleApi.updateFriendCircle(data.id, data)
              break
            default:
              throw new Error(`不支持的数据类型: ${type}`)
          }

          // 刷新关联数据
          await mutateRelated()

          message.success('关联数据更新成功')
          return result
        } catch (error: any) {
          message.error(`更新关联数据失败: ${error.message}`)
          throw error
        }
      },
      [mutateRelated]
    ),

    // 导入数据
    importData: useCallback(
      async (type: ImportType, file: File): Promise<ImportResult> => {
        // 计算导入的数据月份 (当前月-1)
        const now = new Date()
        const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
        const targetYearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`

        try {
          setLoading(true)
          message.loading('正在导入数据...', 0)

          const result = await integratedApi.batchImport(type, file)

          message.destroy()

          // 记录导入状态
          if (result.success) {
            recordImportStatus(type, targetYearMonth, 'success', result.message)
          } else {
            recordImportStatus(type, targetYearMonth, 'failure', result.message)
          }

          // 刷新相关数据
          await mutateMonthly()
          if (selectedEmployee) {
            await mutateRelated()
          }

          return result
        } catch (error: any) {
          message.destroy()
          
          // 记录导入失败状态
          recordImportStatus(type, targetYearMonth, 'failure', error.message || '导入失败')
          
          // 不在这里显示错误信息，让调用方（ImportModal）处理
          // 但是需要确保错误对象包含后端的错误信息
          throw error
        } finally {
          setLoading(false)
        }
      },
      [mutateMonthly, mutateRelated, selectedEmployee, setLoading]
    ),

    // 导出薪资数据为CSV
    exportSalaryCsv: useCallback(
      async (
        additionalParams: {
          department?: string
          name?: string
          idCard?: string
          type?: string
          company?: string
          startDate?: string
          endDate?: string
          isPaid?: boolean
          isConfirmed?: boolean
        } = {}
      ) => {
        try {
          message.loading('正在导出薪资数据...', 0)

          const blob = await salaryApi.exportSalaryCsv({
            yearMonth: selectedYearMonth,
            ...additionalParams,
          })

          // 创建下载链接
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `薪资数据_${selectedYearMonth}.csv`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          message.destroy()
          message.success('薪资数据导出成功')
        } catch (error: any) {
          message.destroy()
          // 如果是404错误，说明后端接口未实现
          if (error.response?.status === 404) {
            message.error('导出功能正在开发中，请稍后再试')
          } else {
            message.error(`导出薪资数据失败: ${error.message}`)
          }
          throw error
        }
      },
      [selectedYearMonth]
    ),

    // 刷新数据
    refreshData: useCallback(async () => {
      try {
        setLoading(true)

        await Promise.all([mutateMonthly(), selectedEmployee ? mutateRelated() : Promise.resolve()])

        message.success('数据刷新成功')
      } catch (error: any) {
        message.error(`刷新数据失败: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }, [mutateMonthly, mutateRelated, selectedEmployee, setLoading]),

    // 切换月份
    switchMonth: useCallback(
      async (yearMonth: string) => {
        setSelectedYearMonth(yearMonth)
        setSelectedEmployee(null) // 切换月份时清空选择
      },
      [setSelectedYearMonth, setSelectedEmployee]
    ),

    // 选择员工
    selectEmployee: useCallback(
      (employee: SalaryRecord | null) => {
        setSelectedEmployee(employee)
      },
      [setSelectedEmployee]
    ),

    // 标记单个员工为已发放
    markEmployeePaid: useCallback(
      async (id: number) => {
        try {
          const updatedRecord = await salaryApi.updateSalary(id, { isPaid: true })

          // 乐观更新
          updateSalaryRecord(id, updatedRecord)

          // 重新计算统计信息
          const currentSalaryData = salaryData.map(item => (item.id === id ? updatedRecord : item))
          const newStatistics = salaryApi.calculateSalaryStatistics(currentSalaryData)
          setStatistics(newStatistics)

          message.success('已标记为发放状态')
          return updatedRecord
        } catch (error: any) {
          message.error(`更新发放状态失败: ${error.message}`)
          throw error
        }
      },
      [updateSalaryRecord, salaryData, setStatistics]
    ),

    // 批量标记当月所有员工为已发放
    markAllPaid: useCallback(async () => {
      try {
        setLoading(true)
        message.loading('正在批量更新发放状态...', 0)

        // 找出所有未发放的员工
        const unpaidEmployees = salaryData.filter(emp => !emp.isPaid)

        if (unpaidEmployees.length === 0) {
          message.destroy()
          message.info('当前月份所有员工均已发放')
          return
        }

        // 批量更新
        const updatePromises = unpaidEmployees.map(emp =>
          salaryApi.updateSalary(emp.id, { isPaid: true })
        )

        const updatedRecords = await Promise.all(updatePromises)

        // 批量乐观更新
        const updatedData = salaryData.map(item => {
          const updatedRecord = updatedRecords.find(record => record.id === item.id)
          return updatedRecord || item
        })

        batchUpdateSalaryRecords(updatedData)

        // 重新计算统计信息
        const newStatistics = salaryApi.calculateSalaryStatistics(updatedData)
        setStatistics(newStatistics)

        message.destroy()
        message.success(`成功标记 ${unpaidEmployees.length} 名员工为已发放`)
      } catch (error: any) {
        message.destroy()
        message.error(`批量更新发放状态失败: ${error.message}`)
        throw error
      } finally {
        setLoading(false)
      }
    }, [salaryData, batchUpdateSalaryRecords, setStatistics, setLoading]),

    // 设置搜索条件
    setSearchFilters: useCallback(
      (filters: SalaryQueryParams) => {
        setSearchState(filters)
      },
      [setSearchState]
    ),

    // 重置搜索条件
    resetSearchFilters: useCallback(() => {
      resetSearchState()
    }, [resetSearchState]),

    // 搜索员工
    searchEmployees: useCallback(
      (keyword: string) => {
        setSearchState({ ...searchState, name: keyword })
      },
      [setSearchState, searchState]
    ),

    // 按部门筛选
    filterByDepartment: useCallback(
      (department: string) => {
        setSearchState({ ...searchState, department })
      },
      [setSearchState, searchState]
    ),

    // 按发放状态筛选
    filterByPaidStatus: useCallback(
      (isPaid?: boolean) => {
        setSearchState({ ...searchState, isPaid })
      },
      [setSearchState, searchState]
    ),

    // 按确认状态筛选
    filterByConfirmStatus: useCallback(
      (isConfirmed?: boolean) => {
        setSearchState({ ...searchState, isConfirmed })
      },
      [setSearchState, searchState]
    ),

    // 应用筛选
    applyFilters: useCallback(
      (params: SalaryQueryParams) => {
        setSearchState(params)
      },
      [setSearchState]
    ),

    // 重置筛选
    resetFilters: useCallback(
      () => {
        setSearchState({})
      },
      [setSearchState]
    ),
  }

  return {
    // 状态数据
    selectedEmployee,
    selectedYearMonth,
    salaryData,
    relatedData,
    statistics,
    loading: loading || isMonthlyLoading || isRelatedLoading,

    // 操作方法
    operations,

    // 刷新方法
    refreshData: operations.refreshData,
  }
}

// 薪资列表Hook
export const useSalaryList = (params: { yearMonth: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    getSWRKeys.salaryList(params),
    () => salaryApi.getSalaryList({ ...params, pageSize: 1000 }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  return {
    salaries: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 薪资详情Hook
export const useSalaryDetail = (id: number | null) => {
  const { data, error, isLoading } = useSWR(
    id ? getSWRKeys.salaryDetail(id) : null,
    () => salaryApi.getSalaryDetail(id!),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    salary: data,
    isLoading,
    error,
  }
}

// 薪资统计Hook（基于薪资列表数据计算）
export const useSalaryStatistics = (yearMonth: string) => {
  const { salaries } = useSalaryList({ yearMonth })

  const statistics = salaryApi.calculateSalaryStatistics(salaries)

  return {
    statistics,
    isLoading: false,
    error: null,
  }
}

// 关联数据Hook
export const useRelatedData = (employeeName: string | null, yearMonth: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    employeeName ? getSWRKeys.relatedData(employeeName, yearMonth) : null,
    () => integratedApi.loadEmployeeRelatedData(employeeName!, yearMonth),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    relatedData: data || {},
    isLoading,
    error,
    refresh: mutate,
  }
}

// 社保信息Hook
export const useSocialInsurance = (params: { yearMonth?: string; name?: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    getSWRKeys.socialInsuranceList(params),
    () => socialInsuranceApi.getSocialInsuranceList(params),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    socialInsuranceList: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 补贴信息Hook
export const useSubsidy = (params: { yearMonth?: string; name?: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    getSWRKeys.subsidyList(params),
    () => subsidyApi.getSubsidyList(params),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    subsidyList: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 考勤扣款Hook
export const useAttendance = (params: { yearMonth?: string; name?: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    getSWRKeys.attendanceList(params),
    () => attendanceApi.getAttendanceList(params),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    attendanceList: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 朋友圈扣款Hook
export const useFriendCircle = (params: { yearMonth?: string; name?: string }) => {
  const { data, error, isLoading, mutate } = useSWR(
    getSWRKeys.friendCircleList(params),
    () => friendCircleApi.getFriendCircleList(params),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    friendCircleList: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}
