// src/services/authService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

export const login = async (credentials) => {
  try {
    const headers = {};
    if (process.env.REACT_APP_FAKE_IP) headers['X-Forwarded-For'] = process.env.REACT_APP_FAKE_IP;
    const response = await axios.post(`${API_URL}/login`, credentials, { headers });
    return response.data;
  } catch (error) {
    // If account is locked or pending, return the error response data instead of throwing
    if (error.response?.data?.accountStatus === 'locked' || error.response?.data?.accountStatus === 'rejected') {
      return error.response.data;
    }
    throw new Error(
      error.response?.data?.message ||
      'Đã xảy ra lỗi khi đăng nhập'
    );
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Đã xảy ra lỗi khi đăng ký'
    );
  }
};

export const forgotPassword = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, data);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Đã xảy ra lỗi khi yêu cầu khôi phục mật khẩu'
    );
  }
};

export const setupAdmin2FA = async (jwt) => {
  const headers = { Authorization: `Bearer ${jwt}` };
  if (process.env.REACT_APP_FAKE_IP) headers['X-Forwarded-For'] = process.env.REACT_APP_FAKE_IP;
  const response = await axios.post(`${API_URL}/admin/2fa/setup`, {}, {
    headers
  });
  return response.data;
};

export const verifyAdmin2FA = async (tempToken, code, trustDevice) => {
  const headers = { Authorization: `Bearer ${tempToken}` };
  if (process.env.REACT_APP_FAKE_IP) headers['X-Forwarded-For'] = process.env.REACT_APP_FAKE_IP;
  const response = await axios.post(`${API_URL}/admin/2fa/verify`, { token: code, trustDevice }, { headers });
  return response.data;
};