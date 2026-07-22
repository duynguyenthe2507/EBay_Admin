import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import VoucherList from './VoucherList';

const ManageVoucher = () => {
  const { handleSetDashboardTitle, isMonitor } = useOutletContext();
  
  useEffect(() => {
    handleSetDashboardTitle("Voucher Management");
  }, [handleSetDashboardTitle]);

  return <VoucherList isMonitor={isMonitor} />;
};

export default ManageVoucher; 