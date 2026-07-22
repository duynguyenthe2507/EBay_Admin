import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar } from '@mui/material';

const formatNumber = (num) => (num === 0 ? '0' : (num ? Number(num).toLocaleString() : '-'));

const TopSellersTable = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Top Sellers by Revenue</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Seller</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 30, height: 30, bgcolor: '#f3f4f6', color: '#0f172a' }}>
                      {r.seller?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>{r.seller}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{r.orderCount ?? '-'}</TableCell>
                <TableCell>{r.totalRevenue ? `$${formatNumber(r.totalRevenue)}` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopSellersTable;
