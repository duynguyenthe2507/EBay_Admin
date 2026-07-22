import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const CHART_COLOR = '#3b82f6';

const UserRegistrationsChart = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>New User Registrations</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis />
            <RechartsTooltip formatter={(v) => [`${v}`, 'New Users']} />
            <Area type="monotone" dataKey="count" stroke={CHART_COLOR} fillOpacity={1} fill="url(#colorUsers)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default UserRegistrationsChart;
