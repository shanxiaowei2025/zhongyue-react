import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
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
const EditContract = lazy(() => import('../pages/Contracts/EditContract'))
const ContractSign = lazy(() => import('../pages/ContractSign'))
const ContractView = lazy(() => import('../pages/ContractView'))
const EnterpriseService = lazy(() => import('../pages/EnterpriseService'))
const EnterpriseDetail = lazy(() => import('../pages/EnterpriseService/Detail'))
const FinancialSelfInspection = lazy(() => import('../pages/FinancialSelfInspection'))
const FinancialSelfInspectionDetail = lazy(() => import('../pages/FinancialSelfInspection/Detail'))
const FinancialSelfInspectionResponsibleDetail = lazy(() => import('../pages/FinancialSelfInspection/ResponsibleDetail'))
const TaxReview = lazy(() => import('../pages/TaxReview'))
const TaxReviewDetail = lazy(() => import('../pages/TaxReview/Detail'))
const NotFound = lazy(() => import('../pages/NotFound'))

// 路由守卫组件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

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
        path: 'enterprise-service',
        element: <EnterpriseService />,
      },
      {
        path: 'enterprise-service/detail/:id',
        element: <EnterpriseDetail />,
      },
      {
        path: 'financial-self-inspection',
        element: <FinancialSelfInspection />,
      },
      {
        path: 'financial-self-inspection/detail/:id',
        element: <FinancialSelfInspectionDetail />,
      },
      {
        path: 'financial-self-inspection/responsible-detail/:id',
        element: <FinancialSelfInspectionResponsibleDetail />,
      },
      {
        path: 'tax-review',
        element: <TaxReview />,
      },
      {
        path: 'tax-review/:id',
        element: <TaxReviewDetail />,
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
