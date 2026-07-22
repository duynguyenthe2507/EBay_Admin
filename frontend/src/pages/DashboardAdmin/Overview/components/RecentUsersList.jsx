import React from 'react';
import { Card, CardContent, Typography, Box, Table, TableBody, TableRow, TableCell, Stack, Avatar, Chip } from '@mui/material';

const RecentUsersList = ({ data }) => {
  if (!data || !data.length) return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6">Recent Users</Typography>
        <Typography variant="body2" color="text.secondary" mt={2}>No recent users</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Card sx={{ height: '100%', boxShadow: '0 6px 18px rgba(15,23,42,0.06)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" mb={1}>Recent Users</Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <Table size="small">
            <TableBody>
              {data.map((u, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={u.avatar} alt={u.name} sx={{ width: 30, height: 30 }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">{u.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{u.type}</TableCell>
                  <TableCell>
                    <Chip size="small" label={u.status} color={u.status === 'active' ? 'success' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentUsersList;
