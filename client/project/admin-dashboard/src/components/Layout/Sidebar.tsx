import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Avatar,
  Divider,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  People,
  Category,
  Inventory,
  Store,
  ShoppingCart,
  Analytics,
  Settings,
  ExitToApp,
  TrendingUp,
  Assessment,
  Notifications,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { 
    id: 'dashboard', 
    label: 'Tableau de bord', 
    icon: Dashboard,
    description: 'Vue d\'ensemble',
    color: '#6366f1'
  },
  { 
    id: 'users', 
    label: 'Utilisateurs', 
    icon: People,
    description: 'Gestion des clients',
    color: '#10b981'
  },
  { 
    id: 'fournisseurs', 
    label: 'Fournisseurs', 
    icon: Store,
    description: 'Gestion des fournisseurs',
    color: '#f59e0b'
  },
  { 
    id: 'categories', 
    label: 'Catégories', 
    icon: Category,
    description: 'Organisation des produits',
    color: '#8b5cf6'
  },
  { 
    id: 'products', 
    label: 'Produits', 
    icon: Inventory,
    description: 'Catalogue produits',
    color: '#06b6d4'
  },
  { 
    id: 'orders', 
    label: 'Commandes', 
    icon: ShoppingCart,
    description: 'Gestion des commandes',
    color: '#ef4444'
  },
  { 
    id: 'analytics', 
    label: 'Analyses', 
    icon: Analytics,
    description: 'Rapports et statistiques',
    color: '#ec4899'
  },
];

const settingsItems = [
  { 
    id: 'settings', 
    label: 'Paramètres', 
    icon: Settings,
    description: 'Configuration',
    color: '#64748b'
  },
  { 
    id: 'security', 
    label: 'Sécurité', 
    icon: Security,
    description: 'Gestion sécurité',
    color: '#dc2626'
  },
];

export default function Sidebar({ open, onClose, currentPage, onPageChange }: SidebarProps) {
  const { state, dispatch } = useAuth();
  const theme = useTheme();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderMenuItem = (item: any, isSettings = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    
    return (
      <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          onClick={() => {
            onPageChange(item.id);
            onClose();
          }}
          sx={{
            borderRadius: 3,
            py: 1.5,
            px: 2,
            mx: 1,
            backgroundColor: isActive 
              ? alpha(item.color, 0.15)
              : 'transparent',
            border: isActive 
              ? `2px solid ${alpha(item.color, 0.3)}`
              : '2px solid transparent',
            color: isActive ? item.color : 'text.primary',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              backgroundColor: isActive 
                ? alpha(item.color, 0.2)
                : alpha(item.color, 0.08),
              transform: 'translateX(4px)',
            },
            '&:before': isActive ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: item.color,
              borderRadius: '0 4px 4px 0',
            } : {},
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive ? item.color : 'text.secondary',
            minWidth: 44,
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }
          }}>
            <Icon />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isActive ? alpha(item.color, 0.8) : 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
            }
          />
          {isActive && (
            <Chip
              size="small"
              label="Actif"
              sx={{
                backgroundColor: alpha(item.color, 0.2),
                color: item.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const drawerContent = (
    <Box sx={{ 
      width: 320, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 800, 
            mb: 0.5,
            background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Optimizi
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.9, 
            fontWeight: 500,
            mb: 3 
          }}>
            Interface d'administration
          </Typography>
          
          {state.user && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
            }}>
              <Avatar
                src={state.user.imageUrl}
                sx={{ 
                  width: 48, 
                  height: 48,
                  border: '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {state.user.fullName.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  lineHeight: 1.2,
                  mb: 0.5,
                }}>
                  {state.user.fullName}
                </Typography>
                <Chip
                  label={state.user.role === 'admin' ? 'Administrateur' : 'Fournisseur'}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation principale */}
      <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
        <Typography variant="overline" sx={{ 
          px: 3, 
          mb: 1, 
          fontWeight: 700,
          color: 'text.secondary',
          fontSize: '0.75rem',
          letterSpacing: 1,
        }}>
          Navigation principale
        </Typography>
        
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>

        <Divider sx={{ mx: 3, my: 2 }} />

        <Typography variant="overline" sx={{ 
          px: 3, 
          mb: 1, 
          fontWeight: 700,
          color: 'text.secondary',
          fontSize: '0.75rem',
          letterSpacing: 1,
        }}>
          Administration
        </Typography>
        
        <List sx={{ px: 1 }}>
          {settingsItems.map((item) => renderMenuItem(item, true))}
        </List>
      </Box>

      <Divider />

      {/* Sign Out */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            borderRadius: 3,
            py: 1.5,
            px: 2,
            mx: 1,
            color: 'error.main',
            backgroundColor: alpha(theme.palette.error.main, 0.05),
            border: `2px solid ${alpha(theme.palette.error.main, 0.1)}`,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              transform: 'translateX(4px)',
              '& .MuiListItemIcon-root': {
                transform: 'scale(1.1)',
              }
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ListItemIcon sx={{ 
            color: 'error.main', 
            minWidth: 44,
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              transition: 'transform 0.3s ease',
            }
          }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Typography variant="body2" sx={{ 
                fontWeight: 600,
                fontSize: '0.95rem' 
              }}>
                Déconnexion
              </Typography>
            }
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 320,
            border: 'none',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 320,
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}