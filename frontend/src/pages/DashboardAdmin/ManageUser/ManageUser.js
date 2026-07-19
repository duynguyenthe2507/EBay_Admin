import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Users from "./Users";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function ManageUser() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [users, setUsers] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalUsers, setTotalUsers] = React.useState(0);
  const [filters, setFilters] = React.useState({
    search: '',
    role: '',
    action: 'all',
    newUsers: false
  });

  // Set the dashboard title
  React.useEffect(() => {
    handleSetDashboardTitle("Manage Users");
  }, [handleSetDashboardTitle]);

  // Fetch users with pagination and filters
  const updateUserList = React.useCallback(async (page = 1, currentFilters = filters) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (currentFilters.search) {
        params.append('search', currentFilters.search);
      }
      if (currentFilters.role && currentFilters.role !== 'all') {
        params.append('role', currentFilters.role);
      }
      if (currentFilters.action && currentFilters.action !== 'all') {
        params.append('action', currentFilters.action);
      }
      if (currentFilters.newUsers) {
        params.append('newUsers', 'true');
      }

      const res = await axios.get(
        `http://localhost:9999/api/admin/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setUsers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
      setTotalUsers(res.data.total || 0);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  }, [filters]);

  React.useEffect(() => {
    updateUserList(1, filters);
  }, [filters, updateUserList]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUserList(newPage, filters);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Users
            users={users}
            onUserUpdated={(page) => updateUserList(page || currentPage, filters)}
            currentPage={currentPage}
            totalPages={totalPages}
            totalUsers={totalUsers}
            onPageChange={handlePageChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Paper>
      </Grid>
    </>
  );
}
