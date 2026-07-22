import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

const OrderStatusChart = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Orders by Status</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              outerRadius={80} 
              innerRadius={50} 
              labelLine={false} 
              label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
            >
              {data.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip formatter={(v, name) => [v, name]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default OrderStatusChart;
