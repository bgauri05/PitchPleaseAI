import { Navigate, Outlet } from 'react-router';

export function ProtectedRoute() {
  const businessId = localStorage.getItem('business_id');

  if (!businessId) return <Navigate to="/setup" replace />;

  return <Outlet />;
}
