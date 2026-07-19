import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { setupAdmin2FA } from '../services/authService';
import { toast } from 'react-toastify';

const AdminSetup2FA = () => {
    const storeToken = useSelector((s) => s.auth?.token);
    const tempToken = typeof window !== 'undefined' ? sessionStorage.getItem('temp2fa') : null;
    const [qr, setQr] = useState('');
    const [otpauth, setOtpauth] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                const res = await setupAdmin2FA(tempToken || storeToken);
                setQr(res.qr);
                setOtpauth(res.otpauth);
                toast.success('2FA secret generated. Scan the QR with Authenticator.');
            } catch (e) {
                toast.error(e.message || 'Failed to setup 2FA');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [storeToken, tempToken]);

    return (
        <div className="max-w-lg mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Setup Admin 2FA</h1>
            <p className="text-gray-600 mb-4">Quét mã QR bằng Google Authenticator/Authy. Nếu không quét được, dùng liên kết otpauth bên dưới.</p>
            {loading && <p>Generating...</p>}
            {!loading && qr && (
                <div className="flex flex-col items-center gap-4">
                    <img src={qr} alt="2FA QR" className="w-64 h-64" />
                    <code className="text-xs break-all bg-gray-100 p-2 rounded">{otpauth}</code>
                    <p className="text-sm text-gray-500">Sau khi quét, quay lại màn hình đăng nhập và nhập mã 2FA khi được yêu cầu.</p>
                </div>
            )}
        </div>
    );
};

export default AdminSetup2FA;


