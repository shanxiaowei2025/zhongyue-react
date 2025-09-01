import { createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'
import { AuthorizedRoute } from '../components/AuthorizedRoute'

// 布局
const MainLayout = lazy(() => import('../layouts/MainLayout'))

// 懒加载组件
const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Users = lazy(() => import('../pages/Users'))
const Roles = lazy(() => import('../pages/Roles'))
const Permissions = lazy(() => import('../pages/Permissions'))
const Departments = lazy(() => import('../pages/Departments'))
const Profile = lazy(() => import('../pages/Profile'))
const Customers = lazy(() => import('../pages/Customers'))
const Expenses = lazy(() => import('../pages/Expenses'))
const Contracts = lazy(() => import('../pages/Contracts'))
const CreateContract = lazy(() => import('../pages/Contracts/CreateContract'))
const ContractDetail = lazy(() => import('../pages/Contracts/ContractDetail'))
const Reports = lazy(() => import('../pages/Reports'))
const AgencyFeeAnalysisDetail = lazy(() => import('../pages/Reports/AgencyFeeAnalysisDetail'))
const EmployeePerformanceDetail = lazy(() => import('../pages/Reports/EmployeePerformanceDetail'))
const CustomerChurnDetail = lazy(() => import('../pages/Reports/CustomerChurnDetail'))
const ServiceExpiryDetail = lazy(() => import('../pages/Reports/ServiceExpiryDetail'))
const AccountantClientDetail = lazy(() => import('../pages/Reports/AccountantClientDetail'))
const NewCustomerDetail = lazy(() => import('../pages/Reports/NewCustomerDetail'))
const CustomerLevelDetail = lazy(() => import('../pages/Reports/CustomerLevelDetail'))
const EditContract = lazy(() => import('../pages/Contracts/EditContract'))
const ContractSign = lazy(() => import('../pages/ContractSign'))
const ContractView = lazy(() => import('../pages/ContractView'))
const EnterpriseService = lazy(() => import('../pages/EnterpriseService'))
const EnterpriseDetail = lazy(() => import('../pages/EnterpriseService/Detail'))
const FinancialSelfInspection = lazy(() => import('../pages/FinancialSelfInspection'))
const FinancialSelfInspectionDetail = lazy(() => import('../pages/FinancialSelfInspection/Detail'))
const FinancialSelfInspectionResponsibleDetail = lazy(
  () => import('../pages/FinancialSelfInspection/ResponsibleDetail')
)
const FinancialSelfInspectionReviewedDetail = lazy(
  () => import('../pages/FinancialSelfInspection/ReviewedDetail')
)
const TaxReview = lazy(() => import('../pages/TaxReview'))
const TaxReviewDetail = lazy(() => import('../pages/TaxReview/Detail'))
const Employees = lazy(() => import('../pages/Employees'))
const EmployeeForm = lazy(() => import('../pages/Employees/EmployeeForm'))
const EmployeeDetail = lazy(() => import('../pages/Employees/EmployeeDetail'))
const SalaryManagement = lazy(() => import('../pages/SalaryManagement'))
const MySalary = lazy(() => import('../pages/MySalary'))
const DataQuery = lazy(() => import('../pages/DataQuery'))
const Notifications = lazy(() => import('../pages/Notifications'))
const NotFound = lazy(() => import('../pages/NotFound'))

// 路由配置
const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthorizedRoute>
        <MainLayout />
      </AuthorizedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin']}>
            <Users />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin']}>
            <Roles />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'permissions',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin']}>
            <Permissions />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'departments',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin']}>
            <Departments />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'data-query',
        element: <DataQuery />,
      },
      {
        path: 'expenses',
        element: <Expenses />,
      },
      {
        path: 'contracts',
        element: <Contracts />,
      },
      {
        path: 'contracts/create',
        element: <CreateContract />,
      },
      {
        path: 'contracts/detail/:id',
        element: <ContractDetail />,
      },
      {
        path: 'contracts/edit/:id',
        element: <EditContract />,
      },
      {
        path: 'reports',
        element: <Reports />,
        children: [
          {
            path: 'agency-fee-analysis',
            element: <AgencyFeeAnalysisDetail />,
          },
          {
            path: 'employee-performance',
            element: <EmployeePerformanceDetail />,
          },
          {
            path: 'customer-churn',
            element: <CustomerChurnDetail />,
          },
          {
            path: 'service-expiry',
            element: <ServiceExpiryDetail />,
          },
          {
            path: 'accountant-client',
            element: <AccountantClientDetail />,
          },
          {
            path: 'new-customer',
            element: <NewCustomerDetail />,
          },
          {
            path: 'customer-level',
            element: <CustomerLevelDetail />,
          },
        ],
      },
      {
        path: 'employees',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <Employees />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'employees/create',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <EmployeeForm />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'employees/edit/:id',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <EmployeeForm />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'employees/detail/:id',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <EmployeeDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'salary-management',
        element: (
          <AuthorizedRoute
            requiredRoles={['super_admin', 'salary_admin', '超级管理员', '薪资管理员']}
          >
            <SalaryManagement />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'my-salary',
        element: <MySalary />,
      },
      {
        path: 'enterprise-service',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <EnterpriseService />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'enterprise-service/detail/:id',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <EnterpriseDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'financial-self-inspection',
        element: (
          <AuthorizedRoute
            requiredRoles={[
              'super_admin',
              'admin',
              'consultantAccountant',
              'bookkeepingAccountant',
              '超级管理员',
              '管理员',
              '顾问会计',
              '记账会计',
            ]}
          >
            <FinancialSelfInspection />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'financial-self-inspection/detail/:id',
        element: (
          <AuthorizedRoute
            requiredRoles={[
              'super_admin',
              'admin',
              'consultantAccountant',
              'bookkeepingAccountant',
              '超级管理员',
              '管理员',
              '顾问会计',
              '记账会计',
            ]}
          >
            <FinancialSelfInspectionDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'financial-self-inspection/responsible-detail/:id',
        element: (
          <AuthorizedRoute
            requiredRoles={[
              'super_admin',
              'admin',
              'consultantAccountant',
              'bookkeepingAccountant',
              '超级管理员',
              '管理员',
              '顾问会计',
              '记账会计',
            ]}
          >
            <FinancialSelfInspectionResponsibleDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'financial-self-inspection/reviewed-detail/:id',
        element: (
          <AuthorizedRoute requiredRoles={['super_admin', 'admin', '超级管理员', '管理员']}>
            <FinancialSelfInspectionReviewedDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'tax-review',
        element: (
          <AuthorizedRoute
            requiredRoles={[
              'super_admin',
              'admin',
              'consultantAccountant',
              'bookkeepingAccountant',
              '超级管理员',
              '管理员',
              '顾问会计',
              '记账会计',
            ]}
          >
            <TaxReview />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'tax-review/:id',
        element: (
          <AuthorizedRoute
            requiredRoles={[
              'super_admin',
              'admin',
              'consultantAccountant',
              'bookkeepingAccountant',
              '超级管理员',
              '管理员',
              '顾问会计',
              '记账会计',
            ]}
          >
            <TaxReviewDetail />
          </AuthorizedRoute>
        ),
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '/contract-sign/:token',
    element: <ContractSign />,
  },
  {
    path: '/contract/view/:encryptedCode',
    element: <ContractView />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export const router = createBrowserRouter(routes)
