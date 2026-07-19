import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  Tooltip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TimelineIcon from '@mui/icons-material/Timeline';
import Title from "../Title";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Minimal neutral palette for a clean, consistent look
const COLORS = [
  '#0f172a', // dark slate
  '#334155', // slate
  '#64748b', // gray-blue
  '#94a3b8', // light gray-blue
  '#cbd5e1', // pale
];
const CHART_COLOR = COLORS[0];

const TIME_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last 12 Months" },
];

// Component for stats card (compact, minimal)
const StatCard = ({ title, value, icon, subtitle = null, percentChange = null }) => {
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, bgcolor: '#f3f4f6', borderRadius: 1 }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {percentChange !== null && (
            <Box sx={{ textAlign: 'right' }}>
              {percentChange >= 0 ? (
                <TrendingUpIcon fontSize="small" color="success" />
              ) : (
                <TrendingDownIcon fontSize="small" color="error" />
              )}
              <Typography variant="body2" color={percentChange >= 0 ? 'success.main' : 'error.main'}>{Math.abs(percentChange)}%</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

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

      // Normalize and compute helpful datasets with safe fallbacks
      const data = res.data;
      const summary = data.summary || {};
      const insights = data.insights || {};

      // orderStatus -> array for pie
      const rawOrderStatus = summary.orderStatus || {};
      const orderStatus = Object.entries(rawOrderStatus).map(([name, value]) => ({ name, value }));

      // revenueByCategory: convert to percent share if raw numbers present
      const revenueByCategoryRaw = insights.revenueByCategory || [];
      const totalRevenueValue = revenueByCategoryRaw.reduce((s, i) => s + (i.value || 0), 0);
      const revenueByCategory = revenueByCategoryRaw.map((it) => ({
        ...it,
        value: totalRevenueValue > 0 ? Number(((it.value / totalRevenueValue) * 100).toFixed(1)) : (it.value || 0),
      }));

      // revenueOverTime fallback and normalization
      const rawRevenueOverTime = insights.revenueOverTime || insights.revenueByDate || insights.revenue || [];
      // normalize to [{ date: 'YYYY-MM-DD' | label, revenue: number }]
      const toDateKey = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        if (!isNaN(dt)) return dt.toISOString().split('T')[0];
        // fallback: return first 10 chars of string
        return String(d).slice(0, 10);
      };
      const revenueMap = (rawRevenueOverTime || []).reduce((acc, it) => {
        const dateRaw = it.date || it.day || it.createdAt || it.label || it._id;
        const dateKey = toDateKey(dateRaw);
        if (!dateKey) return acc;
        const val = Number(it.revenue ?? it.value ?? it.total ?? it.amount ?? it.y ?? 0) || 0;
        acc[dateKey] = (acc[dateKey] || 0) + val;
        return acc;
      }, {});
      const revenueOverTime = Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));

      // topProducts, productsByCategory and recentOrders/users
      const topProducts = insights.topProducts || [];
      const productsByCategory = insights.productsByCategory || [];
      // If backend provides recentOrders in insights, use it.
      // Otherwise try to derive recent orders from activities.recentActivity
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
      // If backend already provides recentUsers in insights, use it.
      // Otherwise fall back to activities.recentActivity (filtering for New User events)
      const recentUsersFromActivities = (data.activities?.recentActivity || [])
        .filter(a => a.type === "New User")
        .map(act => ({
          // backend shape may differ; prefer details, then name
          name: act.details || act.name || 'Unknown',
          avatar: act.avatar || '',
          // keep a simple type/status so RecentUsersList can render sensibly
          type: act.userType || 'user',
          status: act.status || 'active',
          createdAt: act.createdAt
        }));

      const recentUsers = (insights.recentUsers && insights.recentUsers.length) ? insights.recentUsers : recentUsersFromActivities;

      // include productsByCategory so the ProductsByCategory component receives data
      setReport({
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

  const formatNumber = (num) => (num === 0 ? '0' : (num ? Number(num).toLocaleString() : '-'));

  // Small components for layout
  const KPISection = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Revenue (Shipped)" value={`$${formatNumber(report?.summary?.totalRevenue)}`} icon={<AttachMoneyIcon color="primary" />} percentChange={report?.summary?.revenueChange ?? null} />
      </Grid>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Total Orders" value={formatNumber(report?.summary?.totalOrders)} icon={<ShoppingCartIcon color="secondary" />} percentChange={report?.summary?.ordersChange ?? null} />
      </Grid>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Total Users" value={formatNumber(report?.summary?.totalUsers)} icon={<PeopleIcon sx={{ color: '#64748b' }} />} percentChange={report?.summary?.usersChange ?? null} />
      </Grid>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Unique Customers" value={formatNumber(report?.summary?.uniqueCustomers)} icon={<PersonIcon sx={{ color: '#94a3b8' }} />} />
      </Grid>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Products Shipped" value={formatNumber(report?.summary?.productsShipped)} icon={<LocalShippingIcon sx={{ color: '#cbd5e1' }} />} />
      </Grid>
      <Grid item xs={12} md={4} lg={2}>
        <StatCard title="Conversion" value={`${report?.summary?.conversionRate ?? 0}%`} icon={<TimelineIcon sx={{ color: '#334155' }} />} />
      </Grid>
    </Grid>
  );

  const OrdersStatusPie = () => {
    const data = report?.orderStatus || [];
    if (!data.length) return null;
    return (
      <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Orders by Status</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} labelLine={false} label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}>
                {data.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip formatter={(v, name) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const RevenueByCategory = () => {
    const data = report?.insights?.revenueByCategory || [];
    if (!data.length) return null;
    return (
      <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Revenue by Category (%)</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" />
              <YAxis />
              <RechartsTooltip formatter={(v) => [`${v}%`, 'Share']} />
              <Bar dataKey="value" fill={COLORS[0]}>{data.map((d, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };



  const ProductsByCategory = () => {
    const data = report?.insights?.productsByCategory || [];
    if (!data.length) return null;
    return (
      <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Products by Category</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" />
              <YAxis />
              <RechartsTooltip formatter={(v) => [`${v}`, 'Products']} />
              <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const TopProductsTable = () => {
    const rows = report?.insights?.topProducts || [];
    if (!rows.length) return null;
    return (
      <Card sx={{ boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Top Products</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Sold</TableCell>
                <TableCell>Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={r.image} alt={r.name} sx={{ width: 36, height: 36 }} />
                      <Typography variant="body2">{r.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{r.sold ?? '-'}</TableCell>
                  <TableCell>{r.revenue ? `$${formatNumber(r.revenue)}` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const RecentUsersList = () => {
    const rows = report?.insights?.recentUsers || [];
    if (!rows.length) return (
      <Card sx={{ boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent><Typography variant="body2" color="text.secondary">No recent users</Typography></CardContent>
      </Card>
    );
    return (
      <Card sx={{ boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6">Recent Users</Typography>
          <Box sx={{ maxHeight: 260, overflow: 'auto', mt: 1 }}>
            <Table size="small">
              <TableBody>
                {rows.map((u, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar src={u.avatar} alt={u.name} sx={{ width: 30, height: 30 }} />
                        <Typography variant="body2">{u.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{u.type}</TableCell>
                    <TableCell><Chip size="small" label={u.status} color={u.status === 'active' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    );
  };

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
        <Grid container spacing={2}>
          <Grid item xs={12}>{KPISection()}</Grid>

          <Grid item xs={12} md={6} lg={6}>
            <OrdersStatusPie />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <RevenueByCategory />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <ProductsByCategory />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <TopProductsTable />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <RecentUsersList />
          </Grid>

          <Grid item xs={12} md={6} lg={6}>
            <Card sx={{ boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6">Recent Orders</Typography>
                <Box sx={{ maxHeight: 260, overflow: 'auto', mt: 1 }}>
                  {report?.insights?.recentOrders?.length ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Buyer</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.insights.recentOrders.map((o, i) => (
                          <TableRow key={i} hover>
                            <TableCell>{o.id || o.orderId}</TableCell>
                            <TableCell>{o.buyerName || o.user}</TableCell>
                            <TableCell><Chip size="small" label={o.status} color={o.status === 'shipped' ? 'success' : 'default'} /></TableCell>
                            <TableCell>{o.total ? `$${formatNumber(o.total)}` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No recent orders</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Overview;