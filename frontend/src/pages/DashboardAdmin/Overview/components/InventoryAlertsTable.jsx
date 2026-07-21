import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';

const InventoryAlertsTable = ({ lowStock, outOfStock }) => {
  const combined = [
    ...(outOfStock || []).map(item => ({ ...item, status: 'Out of Stock' })),
    ...(lowStock || []).map(item => ({ ...item, status: 'Low Stock' }))
  ].slice(0, 5); // Limit to top 5 alerts

  if (!combined.length) return null;

  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Inventory Alerts</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combined.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <Typography variant="body2">{r.product}</Typography>
                </TableCell>
                <TableCell>{r.quantity}</TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    label={r.status} 
                    color={r.status === 'Out of Stock' ? 'error' : 'warning'} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default InventoryAlertsTable;
