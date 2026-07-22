import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Avatar } from '@mui/material';

const formatNumber = (num) => (num === 0 ? '0' : (num ? Number(num).toLocaleString() : '-'));

const TopProductsTable = ({ data }) => {
  if (!data || !data.length) return null;
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Top Products by Revenue</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Quantity Sold</TableCell>
              <TableCell>Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={r.image} alt={r.product} sx={{ width: 36, height: 36 }} variant="rounded" />
                    <Typography variant="body2">{r.product}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{r.quantity ?? '-'}</TableCell>
                <TableCell>{r.revenue ? `$${formatNumber(r.revenue)}` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopProductsTable;
