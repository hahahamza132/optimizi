import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import {
  People,
  Inventory,
  ShoppingCart,
  TrendingUp,
} from '@mui/icons-material';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentOrders from '../components/Dashboard/RecentOrders';
import { dataService } from '../services/dataService';
import { User, Product, Order } from '../types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [users, products, orders] = await Promise.all([
          dataService.getUsers(),
          dataService.getProducts(),
          dataService.getOrders(),
        ]);

        const revenue = orders.reduce((total, order) => total + order.total, 0);

        setStats({
          users: users.length,
          products: products.length,
          orders: orders.length,
          revenue,
        });

        setRecentOrders(orders);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Tableau de bord
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Utilisateurs"
            value={stats.users}
            icon={People}
            color="#6366f1"
            trend={{ value: 12, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Produits"
            value={stats.products}
            icon={Inventory}
            color="#10b981"
            trend={{ value: 8, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Commandes"
            value={stats.orders}
            icon={ShoppingCart}
            color="#f59e0b"
            trend={{ value: 23, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Chiffre d'affaires"
            value={`€${stats.revenue.toFixed(2)}`}
            icon={TrendingUp}
            color="#ef4444"
            trend={{ value: 15, isPositive: true }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RecentOrders orders={recentOrders} />
        </Grid>
      </Grid>
    </Box>
  );
}