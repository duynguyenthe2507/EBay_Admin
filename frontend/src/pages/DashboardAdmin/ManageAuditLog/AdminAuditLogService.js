import axios from "axios";

const API = "http://localhost:9999/api/admin/audit-logs";

export const getAuditLogs = async (token) => {
    return axios.get(API, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};