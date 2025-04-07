import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { RouteObject } from 'react-router-dom'
import { lazy } from 'react'

// 布局
const MainLayout = lazy(() => import('../layouts/MainLayout'))

// 懒加载组件
const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Users = lazy(() => import('../pages/Users'))
const Roles = lazy(() => import('../pages/Roles'))
const Permissions = lazy(() => import('../pages/Permissions'))
const Profile = lazy(() => import('../pages/Profile'))
const Customers = lazy(() => import('../pages/Customers'))
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
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'roles',
        element: <Roles />,
      },
      {
        path: 'permissions',
        element: <Permissions />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export const router = createBrowserRouter(routes)
