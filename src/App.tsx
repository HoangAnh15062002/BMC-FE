import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { EstimatesPage } from './pages/EstimatesPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { SiteExecutionPage } from './pages/SiteExecutionPage';
import { VariationsPage } from './pages/VariationsPage';
import { CostControlPage } from './pages/CostControlPage';
import { AdminPage } from './pages/AdminPage';
import { CatalogsPage } from './pages/CatalogsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="estimates" element={<EstimatesPage />} />
                <Route path="procurement" element={<ProcurementPage />} />
                <Route path="warehouses" element={<WarehousesPage />} />
                <Route path="site-execution" element={<SiteExecutionPage />} />
                <Route path="variations" element={<VariationsPage />} />
                <Route path="cost-control" element={<CostControlPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="catalogs" element={<CatalogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

