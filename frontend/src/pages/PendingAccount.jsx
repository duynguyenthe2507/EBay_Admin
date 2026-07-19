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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PendingAccount() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
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
          
          // Get rejection reason from localStorage if available
          const rejectionReason = localStorage.getItem('rejectionReason');
          if (rejectionReason && !user.rejectionReason) {
            user.rejectionReason = rejectionReason;
          }
          
          // Check if user account is pending or rejected
          if (user.accountStatus === 'pending') {
            // Account is pending approval
            setUserInfo(user);
          } else if (user.accountStatus === 'rejected') {
            // Account is rejected
            setUserInfo(user);
          } else if (user.role === 'seller') {
            // For seller, also check store status
            try {
              const storeResponse = await axios.get('http://localhost:9999/api/seller/store', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (storeResponse.data.success && storeResponse.data.data) {
                const store = storeResponse.data.data;
                if (store.status === 'pending') {
                  setUserInfo({ ...user, storeStatus: 'pending' });
                } else if (store.status === 'approved') {
                  // Store approved, redirect to home
                  navigate('/');
                  return;
                } else if (store.status === 'rejected') {
                  // Store rejected, show different message
                  setUserInfo({ ...user, storeStatus: 'rejected' });
                }
              }
            } catch (storeError) {
              // No store found, might be new seller
              setUserInfo({ ...user, storeStatus: 'no_store' });
            }
          } else if (user.accountStatus === 'approved' || !user.accountStatus) {
            // Account is approved or no status (default approved), redirect to home
            navigate('/');
            return;
          } else {
            // Account is pending
            setUserInfo(user);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        if (error.response?.status === 401) {
          navigate('/signin');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:9999/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        
        // Check if account is now approved
        if (user.role === 'seller') {
          const storeResponse = await axios.get('http://localhost:9999/api/seller/store', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (storeResponse.data.success && storeResponse.data.data) {
            const store = storeResponse.data.data;
            if (store.status === 'approved') {
              // Account approved, redirect
              navigate('/');
              return;
            }
          }
        } else if (user.accountStatus === 'approved') {
          navigate('/');
          return;
        }

        // Still pending, refresh page
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const isRejected = userInfo?.accountStatus === 'rejected' || userInfo?.storeStatus === 'rejected';
  const isNoStore = userInfo?.storeStatus === 'no_store';
  const isPending = userInfo?.accountStatus === 'pending';

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
          {isRejected ? (
            <PendingIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          ) : (
            <HourglassEmptyIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          )}
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color={isRejected ? 'error' : 'warning.main'}>
            {isRejected 
              ? (userInfo?.accountStatus === 'rejected' ? 'Tài Khoản Của Bạn Đã Bị Từ Chối' : 'Cửa Hàng Của Bạn Đã Bị Từ Chối')
              : 'Tài Khoản Của Bạn Đang Chờ Duyệt'}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PendingIcon color={isRejected ? 'error' : 'warning'} sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Trạng Thái Tài Khoản
              </Typography>
            </Box>

            {isRejected ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  {userInfo?.accountStatus === 'rejected' 
                    ? 'Tài khoản của bạn đã bị từ chối bởi quản trị viên.'
                    : 'Cửa hàng của bạn đã bị từ chối bởi quản trị viên.'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {userInfo?.accountStatus === 'rejected'
                    ? 'Vui lòng liên hệ với bộ phận hỗ trợ để biết thêm chi tiết hoặc yêu cầu xem xét lại tài khoản của bạn.'
                    : 'Vui lòng liên hệ với bộ phận hỗ trợ để biết thêm chi tiết hoặc tạo tài khoản mới.'}
                </Typography>
                {userInfo?.rejectionReason && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium" gutterBottom>
                      Lý do từ chối:
                    </Typography>
                    <Typography variant="body2">
                      {userInfo.rejectionReason}
                    </Typography>
                  </Box>
                )}
              </Alert>
            ) : isNoStore ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  Bạn chưa đăng ký cửa hàng.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Vui lòng đăng ký cửa hàng để bắt đầu bán hàng.
                </Typography>
              </Alert>
            ) : isPending ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="medium">
                    Tài khoản của bạn đang chờ được duyệt bởi quản trị viên.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Quá trình duyệt thường mất từ 1-3 ngày làm việc. Chúng tôi sẽ thông báo cho bạn ngay khi tài khoản được duyệt.
                  </Typography>
                </Alert>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thời gian chờ duyệt:
                  </Typography>
                  <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Vui lòng kiên nhẫn trong khi chúng tôi xem xét đơn đăng ký của bạn.
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="medium">
                  Đang kiểm tra trạng thái tài khoản...
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isRejected && !isNoStore && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              sx={{ minWidth: 200 }}
            >
              {checkingStatus ? 'Đang kiểm tra...' : 'Kiểm Tra Trạng Thái'}
            </Button>
          )}

          {isNoStore && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate('/store-registration')}
              sx={{ minWidth: 200 }}
            >
              Đăng Ký Cửa Hàng
            </Button>
          )}

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

