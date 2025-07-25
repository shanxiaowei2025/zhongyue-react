import { useEffect, useCallback } from 'react'
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
  RelatedData,
  CreateSalaryDto,
  UpdateSalaryDto,
  ImportResult,
  ImportType,
  ExportType,
} from '../types/salaryIntegrated'

// 集成化薪资管理主Hook
export const useSalaryIntegrated = () => {
  const { selectedEmployee, selectedYearMonth, salaryData, relatedData, statistics, loading } =
    useSalaryIntegratedSelectors()

  const {
    setSelectedEmployee,
    setSelectedYearMonth,
    setSalaryData,
    setRelatedData,
    setStatistics,
    setLoading,
    updateSalaryRecord,
    removeSalaryRecord,
    addSalaryRecord,
    batchUpdateSalaryRecords,
  } = useSalaryIntegratedActions()

  // 获取月度数据
  const {
    data: monthlyData,
    isLoading: isMonthlyLoading,
    isValidating: isMonthlyValidating,
    mutate: mutateMonthly,
  } = useSWR(
    getSWRKeys.monthlyData(selectedYearMonth),
    () => integratedApi.loadMonthlyData(selectedYearMonth),
    {
      revalidateOnFocus: false,
      fallbackData: {
        salaryData: [],
        statistics: {
          employeeCount: 0,
          totalPayable: 0,
          totalSocialInsurance: 0,
          totalTax: 0,
          totalActual: 0,
          paidCount: 0,
          unpaidCount: 0,
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
  const {
    data: employeeRelatedData,
    isLoading: isRelatedLoading,
    isValidating: isRelatedValidating,
    mutate: mutateRelated,
  } = useSWR(
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
    // 自动生成薪资
    autoGenerateSalary: useCallback(
      async (yearMonth: string) => {
        try {
          setLoading(true)
          message.loading('正在自动生成薪资数据...', 0)

          const result = await salaryApi.autoGenerateSalary(yearMonth)

          message.destroy()
          message.success(`成功生成 ${result.length} 条薪资记录`)

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
      },
      [mutateMonthly, setLoading]
    ),

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
        try {
          setLoading(true)
          message.loading('正在导入数据...', 0)

          const result = await integratedApi.batchImport(type, file)

          message.destroy()

          if (result.success) {
            message.success(`导入成功，共导入 ${result.successCount} 条记录`)

            // 刷新相关数据
            await mutateMonthly()
            if (selectedEmployee) {
              await mutateRelated()
            }
          } else {
            message.warning(
              `导入完成，成功 ${result.successCount} 条，失败 ${result.failedCount} 条`
            )
          }

          return result
        } catch (error: any) {
          message.destroy()
          message.error(`导入失败: ${error.message}`)
          throw error
        } finally {
          setLoading(false)
        }
      },
      [mutateMonthly, mutateRelated, selectedEmployee, setLoading]
    ),

    // 导出数据
    exportData: useCallback(
      async (type: ExportType, params: { yearMonth?: string } = {}) => {
        try {
          message.loading('正在导出数据...', 0)

          const blob = await integratedApi.batchExport(type, {
            yearMonth: selectedYearMonth,
            ...params,
          })

          // 创建下载链接
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url

          // 根据类型设置文件名
          const typeNames: Record<ExportType, string> = {
            salary: '薪资数据',
            socialInsurance: '社保数据',
            subsidy: '补贴数据',
            attendance: '考勤数据',
            friendCircle: '朋友圈数据',
          }

          link.download = `${typeNames[type]}_${selectedYearMonth}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          message.destroy()
          message.success('导出成功')
        } catch (error: any) {
          message.destroy()
          message.error(`导出失败: ${error.message}`)
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

// 薪资统计Hook
export const useSalaryStatistics = (yearMonth: string) => {
  const { data, error, isLoading } = useSWR(
    getSWRKeys.salaryStatistics(yearMonth),
    () => salaryApi.getSalaryStatistics(yearMonth),
    {
      revalidateOnFocus: false,
    }
  )

  return {
    statistics: data,
    isLoading,
    error,
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
