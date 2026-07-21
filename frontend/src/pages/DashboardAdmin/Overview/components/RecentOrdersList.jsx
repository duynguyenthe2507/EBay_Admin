import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';

const formatNumber = (num) => (num === 0 ? '0' : (num ? Number(num).toLocaleString() : '-'));

const RecentOrdersList = ({ data }) => {
  if (!data || !data.length) return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6">Recent Orders</Typography>
        <Typography variant="body2" color="text.secondary" mt={2}>No recent orders</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={1}>Recent Orders</Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((o, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {o.id || o.orderId}
                    </Typography>
                  </TableCell>
                  <TableCell>{o.buyerName || o.user}</TableCell>
                  <TableCell>
                    <Chip size="small" label={o.status} color={o.status === 'shipped' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{o.total ? `$${formatNumber(o.total)}` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersList;
