import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface AuthorizedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export const AuthorizedRoute = ({ children, requiredRoles }: AuthorizedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 如果没有指定所需角色，则允许访问
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>
  }

  // 检查用户是否具有所需角色
  const hasRequiredRole = user?.roles.some(role => requiredRoles.includes(role))

  if (!hasRequiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
