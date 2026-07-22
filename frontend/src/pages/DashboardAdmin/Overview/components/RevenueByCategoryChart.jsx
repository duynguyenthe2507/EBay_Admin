import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1'];

const RevenueByCategoryChart = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Revenue by Category (%)</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" />
            <YAxis />
            <RechartsTooltip formatter={(v) => [`${v}%`, 'Share']} />
            <Bar dataKey="value" fill={COLORS[0]}>
              {data.map((d, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueByCategoryChart;
