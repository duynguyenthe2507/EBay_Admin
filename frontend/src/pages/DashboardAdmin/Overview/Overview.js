import React, { useEffect, useState } from "react";
import { Box, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, LinearProgress, Typography, Grid } from "@mui/material";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Title from "../Title";

// Import modular components
import KPICards from "./components/KPICards";
import OrderStatusChart from "./components/OrderStatusChart";
import RevenueByCategoryChart from "./components/RevenueByCategoryChart";
import ProductsByCategoryChart from "./components/ProductsByCategoryChart";
import TopProductsTable from "./components/TopProductsTable";
import RecentUsersList from "./components/RecentUsersList";
import RecentOrdersList from "./components/RecentOrdersList";
import UserRegistrationsChart from "./components/UserRegistrationsChart";
import RevenueOverTimeChart from "./components/RevenueOverTimeChart";
import TopSellersTable from "./components/TopSellersTable";
import InventoryAlertsTable from "./components/InventoryAlertsTable";
import TopRatedProductsTable from "./components/TopRatedProductsTable";

const TIME_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last 12 Months" },
];

const Overview = () => {
  const { handleSetDashboardTitle } = useOutletContext();
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (handleSetDashboardTitle) handleSetDashboardTitle("Dashboard Overview");
  }, [handleSetDashboardTitle]);

  const fetchData = async (selectedPeriod = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `http://localhost:9999/api/admin/report${selectedPeriod ? `?period=${selectedPeriod}` : ""}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` } }
      );
      if (!res.data || !res.data.success) throw new Error('API returned unsuccessful');

      const data = res.data;
      const summary = data.summary || {};
      const insights = data.insights || {};

      const rawOrderStatus = summary.orderStatus || {};
      const orderStatus = Object.entries(rawOrderStatus).map(([name, value]) => ({ name, value }));

      const revenueByCategoryRaw = insights.revenueByCategory || [];
      const totalRevenueValue = revenueByCategoryRaw.reduce((s, i) => s + (i.value || 0), 0);
      const revenueByCategory = revenueByCategoryRaw.map((it) => ({
        ...it,
        value: totalRevenueValue > 0 ? Number(((it.value / totalRevenueValue) * 100).toFixed(1)) : (it.value || 0),
      }));

      const toDateKey = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        if (!isNaN(dt)) return dt.toISOString().split('T')[0];
        return String(d).slice(0, 10);
      };

      const rawRevenueOverTime = data.trends?.revenueOverTime || insights.revenueOverTime || [];
      const revenueMap = (rawRevenueOverTime || []).reduce((acc, it) => {
        const dateKey = toDateKey(it.date || it.day || it.createdAt || it._id);
        if (!dateKey) return acc;
        const val = Number(it.revenue ?? it.value ?? it.amount ?? 0) || 0;
        acc[dateKey] = (acc[dateKey] || 0) + val;
        return acc;
      }, {});
      const revenueOverTime = Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));

      const topProducts = insights.topProducts || [];
      const productsByCategory = insights.productsByCategory || [];
      
      const recentOrdersFromActivities = (data.activities?.recentActivity || [])
        .filter(a => a.type === "New Order" || a.type === "Order Created" || a.entity === "order")
        .map(act => ({
          id: act.orderId || act.id,
          orderId: act.orderId || act.id,
          buyerName: act.userName || act.buyerName || act.details || (act.user && act.user.name),
          user: act.userName || (act.user && act.user.name),
          status: act.status || act.orderStatus || 'pending',
          total: act.total || act.amount || 0,
          createdAt: act.createdAt
        }));

      const recentOrders = (insights.recentOrders && insights.recentOrders.length) ? insights.recentOrders : recentOrdersFromActivities;

      const recentUsersFromActivities = (data.activities?.recentActivity || [])
        .filter(a => a.type === "New User")
        .map(act => ({
          name: act.details || act.name || 'Unknown',
          avatar: act.avatar || '',
          type: act.userType || 'user',
          status: act.status || 'active',
          createdAt: act.createdAt
        }));

      const recentUsers = (insights.recentUsers && insights.recentUsers.length) ? insights.recentUsers : recentUsersFromActivities;

      setReport({
        ...data,
        summary,
        insights: { revenueByCategory, revenueOverTime, topProducts, productsByCategory, recentOrders, recentUsers },
        orderStatus,
      });
    } catch (err) {
      console.error('fetch report failed', err?.message || err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(period); }, [period]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Title highlight>Dashboard Overview</Title>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel id="period-label">Period</InputLabel>
            <Select labelId="period-label" value={period} label="Period" onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 160 }} startAdornment={<FilterAltIcon sx={{ mr: 1 }} />}>
              {TIME_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => fetchData(period)} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', my: 2 }}><LinearProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !report ? (
        <Typography color="text.secondary">No data available</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <KPICards report={report} />
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <RevenueOverTimeChart data={report?.insights?.revenueOverTime} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <OrderStatusChart data={report?.orderStatus} />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <UserRegistrationsChart data={report?.trends?.usersOverTime} />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <RevenueByCategoryChart data={report?.insights?.revenueByCategory} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <ProductsByCategoryChart data={report?.insights?.productsByCategory} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <TopProductsTable data={report?.insights?.topProducts} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <TopRatedProductsTable data={report?.ratings?.topRatedProducts} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <TopSellersTable data={report?.topSellers} />
          </Grid>
          
          <Grid item xs={12} md={6} lg={4}>
            <InventoryAlertsTable lowStock={report?.stock?.lowStockProducts} outOfStock={report?.stock?.outOfStockProducts} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <RecentUsersList data={report?.insights?.recentUsers} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <RecentOrdersList data={report?.insights?.recentOrders} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Overview;