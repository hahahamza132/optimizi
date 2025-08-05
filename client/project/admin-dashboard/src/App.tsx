import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Box, Toolbar } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { theme } from './theme/theme';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Security from './pages/Security';
import Fournisseurs from './pages/Fournisseurs';
import Login from './pages/Login';

const pageComponents = {
  dashboard: Dashboard,
  users: () => <div>Users Page (Coming Soon)</div>,
  categories: () => <div>Categories Page (Coming Soon)</div>,
  products: () => <div>Products Page (Coming Soon)</div>,
  fournisseurs: Fournisseurs,
  orders: () => <div>Orders Page (Coming Soon)</div>,
  analytics: () => <div>Analytics Page (Coming Soon)</div>,
  settings: () => <div>Settings Page (Coming Soon)</div>,
  security: Security,
};

const pageTitles = {
  dashboard: 'Tableau de bord',
  users: 'Gestion des utilisateurs',
  categories: 'Gestion des catégories',
  products: 'Gestion des produits',
  fournisseurs: 'Gestion des fournisseurs',
  orders: 'Gestion des commandes',
  analytics: 'Analyses et rapports',
  settings: 'Paramètres',
  security: 'Sécurité',
};

function AppContent() {
  const { state } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setSidebarOpen(false); // Close mobile sidebar when page changes
  };

  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Chargement...</div>
      </Box>
    );
  }

  if (!state.isAuthenticated) {
    return <Login />;
  }

  const CurrentPageComponent = pageComponents[currentPage as keyof typeof pageComponents];
  const currentTitle = pageTitles[currentPage as keyof typeof pageTitles];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={handleDrawerToggle} title={currentTitle} />
      
      <Sidebar
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { lg: 'calc(100% - 320px)' },
          ml: { lg: '320px' },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          transition: 'margin 0.3s ease-in-out',
        }}
      >
        <Toolbar />
        <CurrentPageComponent />
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;