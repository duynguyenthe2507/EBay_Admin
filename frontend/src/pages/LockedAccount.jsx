import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LockedAccount() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockReason, setLockReason] = useState('');
  const [lockDuration, setLockDuration] = useState('');
  const [lockUntil, setLockUntil] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // First, try to get lock info from localStorage (set during login)
        const storedLockReason = localStorage.getItem('lockReason');
        const storedLockDuration = localStorage.getItem('lockDuration');
        const storedLockUntil = localStorage.getItem('lockUntil');

        if (storedLockReason) {
          setLockReason(storedLockReason);
          localStorage.removeItem('lockReason');
        }
        if (storedLockDuration) {
          setLockDuration(storedLockDuration);
          localStorage.removeItem('lockDuration');
        }
        if (storedLockUntil) {
          setLockUntil(new Date(storedLockUntil));
          localStorage.removeItem('lockUntil');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          // If no token but we have lock info, still show the page
          if (storedLockReason) {
            setLoading(false);
            return;
          }
          navigate('/signin');
          return;
        }

        const response = await axios.get('http://localhost:9999/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success && response.data.data) {
          const user = response.data.data;
          
          // Check if user is locked
          if (user.action !== 'lock') {
            // User is not locked, redirect to home
            navigate('/');
            return;
          }

          setUserInfo(user);
          
          // Get lock details from user metadata or localStorage
          setLockReason(user.lockReason || storedLockReason || 'Hủy đơn hàng quá nhiều lần');
          setLockDuration(user.lockDuration || storedLockDuration || '1 ngày');
          
          // Calculate lock until date
          if (user.lockUntil) {
            setLockUntil(new Date(user.lockUntil));
          } else if (storedLockUntil) {
            setLockUntil(new Date(storedLockUntil));
          } else {
            // Default: 1 day from now
            const until = new Date();
            until.setDate(until.getDate() + 1);
            setLockUntil(until);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 401) {
          // If we have lock info from localStorage, still show the page
          if (localStorage.getItem('lockReason')) {
            setLoading(false);
            return;
          }
          navigate('/signin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleCreateDispute = () => {
    // Navigate to create dispute page
    navigate('/disputes/create', {
      state: {
        type: 'account_lock',
        reason: 'Yêu cầu mở khóa tài khoản',
      },
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Typography>Đang tải...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="error">
            Tài Khoản Của Bạn Đã Bị Khóa
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Thông Tin Khóa Tài Khoản
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Lý do khóa:
              </Typography>
              <Chip
                label={lockReason}
                color="error"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Thời gian khóa:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {lockDuration}
              </Typography>
            </Box>

            {lockUntil && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tài khoản sẽ được mở khóa vào:
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="primary">
                  {formatDate(lockUntil)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2">
            Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng. 
            Vui lòng liên hệ với bộ phận hỗ trợ nếu bạn muốn khiếu nại về quyết định này.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ContactSupportIcon />}
            onClick={handleCreateDispute}
            sx={{ minWidth: 200 }}
          >
            Yêu Cầu Khiếu Nại
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('token');
              navigate('/signin');
            }}
            sx={{ minWidth: 200 }}
          >
            Đăng Xuất
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary">
            Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email: support@shopii.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

