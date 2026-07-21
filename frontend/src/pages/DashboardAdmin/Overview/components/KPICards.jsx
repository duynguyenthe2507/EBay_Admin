import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TimelineIcon from '@mui/icons-material/Timeline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

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

const formatNumber = (num) => (num === 0 ? '0' : (num ? Number(num).toLocaleString() : '-'));

const KPICards = ({ report }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Revenue (Shipped)" value={`$${formatNumber(report?.summary?.totalRevenue)}`} icon={<AttachMoneyIcon color="primary" />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Total Orders" value={formatNumber(report?.summary?.totalOrders)} icon={<ShoppingCartIcon color="secondary" />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Total Users" value={formatNumber(report?.summary?.totalUsers)} icon={<PeopleIcon sx={{ color: '#64748b' }} />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Unique Customers" value={formatNumber(report?.summary?.uniqueCustomers)} icon={<PersonIcon sx={{ color: '#94a3b8' }} />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Products Shipped" value={formatNumber(report?.summary?.productsShipped)} icon={<LocalShippingIcon sx={{ color: '#cbd5e1' }} />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Conversion Rate" value={`${report?.summary?.conversionRate ?? 0}%`} icon={<TimelineIcon sx={{ color: '#334155' }} />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Returns & Disputes" value={formatNumber((report?.returns?.returnRequestsCount || 0) + (report?.returns?.disputesCount || 0))} icon={<AssignmentReturnIcon sx={{ color: '#f59e0b' }} />} />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Active Vouchers" value={formatNumber(report?.vouchers?.active)} icon={<LocalOfferIcon sx={{ color: '#10b981' }} />} />
      </Grid>
    </Grid>
  );
};

export default KPICards;
