import React from 'react';
import { Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, Stack, Rating } from '@mui/material';

const TopRatedProductsTable = ({ data }) => {
  if (!data || !data.length) return null;
  
  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={2}>Top Rated Products</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Average Rating</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>
                  <Typography variant="body2">{r.product}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Rating value={r.avgRating} readOnly precision={0.1} size="small" />
                    <Typography variant="body2" color="text.secondary">
                      ({r.avgRating})
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopRatedProductsTable;
