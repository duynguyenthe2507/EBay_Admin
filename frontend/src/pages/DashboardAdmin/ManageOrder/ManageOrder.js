import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Orders from "./Orders";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function ManageOrder() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [orders, setOrders] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalOrders, setTotalOrders] = React.useState(0);
  const [filters, setFilters] = React.useState({
    search: "",
    status: "all",
  });

  // Set the dashboard title
  React.useEffect(() => {
    handleSetDashboardTitle("Quản Lý Đơn Hàng");
  }, [handleSetDashboardTitle]);

  // Fetch orders with pagination and filters
  const updateOrderList = React.useCallback(
    async (page = 1, currentFilters = filters) => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        if (currentFilters.search) {
          params.append("search", currentFilters.search);
        }
        if (currentFilters.status && currentFilters.status !== "all") {
          params.append("status", currentFilters.status);
        }

        const res = await axios.get(
          `http://localhost:9999/api/admin/orders?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (res.data.success) {
          setOrders(res.data.data || []);
          setTotalPages(res.data.totalPages || 1);
          setCurrentPage(res.data.currentPage || 1);
          setTotalOrders(res.data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching order list:", error);
      }
    },
    [filters]
  );

  React.useEffect(() => {
    updateOrderList(1, filters);
  }, [filters, updateOrderList]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateOrderList(newPage, filters);
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
          <Orders
            orders={orders}
            onOrderUpdated={(page) =>
              updateOrderList(page || currentPage, filters)
            }
            currentPage={currentPage}
            totalPages={totalPages}
            totalOrders={totalOrders}
            onPageChange={handlePageChange}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Paper>
      </Grid>
    </>
  );
}

