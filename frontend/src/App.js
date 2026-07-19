import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  createRoutesFromElements,
  Route,
  ScrollRestoration,
} from "react-router-dom";
import Footer from "./components/home/Footer/Footer";
import FooterBottom from "./components/home/Footer/FooterBottom";
import Header from "./components/home/Header/Header";
import HeaderBottom from "./components/home/Header/HeaderBottom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerDashboardSellerLaydout from "./pages/DashboardSeller/ManagerDashboardSellerLaydout";
import ManageProduct from "./pages/DashboardSeller/ManageProduct/ManageProduct";
import ProductDetail from "./pages/DashboardSeller/ManageProduct/ProductDetail";
import ManageStoreProfile from "./pages/DashboardSeller/ManageStoreProfile/ManageStoreProfile";
import ManageInventory from "./pages/DashboardSeller/ManageProduct/ManageInventory";
import ManageOrder from "./pages/DashboardSeller/ManageOrder/ManageOrderHistory";
import ManageDispute from "./pages/DashboardSeller/ManageDispute/ManageDispute";
import ManageReturnRequest from "./pages/DashboardSeller/ManageReturnRequest/ManageReturnRequest";
import ManageShipping from "./pages/DashboardSeller/ManageShipping/ManageShipping";
import Overview from "./pages/DashboardSeller/Overview/Overview";
import OverviewA from "./pages/DashboardAdmin/Overview/Overview";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCart } from "./redux/slices/cart.slice";

import 'react-toastify/dist/ReactToastify.css';

import SignIn from "./pages/SignIn.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

import Home from './pages/Home.jsx';
import Cart from "./pages/Cart/Cart";

import Checkout from "./pages/Checkout/Checkout";
import Address from './pages/Address/Address';
import SignUp from './pages/SignUp';
import Payment from './pages/Payment/Payment';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import StoreRegistration from './pages/StoreRegistration';
import OrderHistory from './pages/OrderHistory/OrderHistory';
import OrderDetail from './pages/OrderHistory/OrderDetail';
import MyReviews from './pages/MyReviews/MyReviews';
import WriteReview from './pages/Review/WriteReview';
import AuthProductDetail from './pages/ProductDetail/AuthProductDetail';
import Chat from './pages/Chat/Chat'; // Import the Chat component
import MyDisputes from './pages/Disputes/MyDisputes';
import CreateDisputeForm from './pages/Disputes/CreateDisputeForm';
import Profile from './pages/Profile/Profile'; // Import the Profile component
import ReturnRequestsList from './pages/ReturnRequests/ReturnRequestsList';

import ManageUser from "./pages/DashboardAdmin/ManageUser/ManageUser";
import ManageStore from "./pages/DashboardAdmin/ManageShop/ManageStore";
import ManageProductA from "./pages/DashboardAdmin/ManageProduct/ManageProduct";
import ManageVoucher from "./pages/DashboardAdmin/ManageVoucher/ManageVoucher";
import ManageOrderAdmin from "./pages/DashboardAdmin/ManageOrder/ManageOrder";
import AdminDashboardLayout from "./pages/DashboardAdmin/ManagerDashboardAdminLaydout";
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './utils/roles';
import AdminSetup2FA from "./pages/AdminSetup2FA.jsx";
import LockedAccount from "./pages/LockedAccount";
import PendingAccount from "./pages/PendingAccount";
import ManageReviews from "./pages/DashboardAdmin/ManageReview/ManageReviews";
import ManageDisputes from "./pages/DashboardAdmin/ManageDispute/ManageDisputes";


const Layout = () => {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header />
      <HeaderBottom />
      {/* <SpecialCase /> */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
      <FooterBottom />
    </div>
  );
};
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorPage />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />}></Route> {/* Trang chủ cho buyer */}
        <Route path="/cart" element={<Cart />}></Route>
        <Route path="/checkout" element={<Checkout />}></Route>
        <Route path="/address" element={<Address />}></Route>
        <Route path="/payment" element={<Payment />}></Route>
        <Route path="/payment-result" element={<PaymentResult />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/order-history" element={<OrderHistory />}></Route>
        <Route path="/order-details/:id" element={<OrderDetail />}></Route>
        <Route path="/my-reviews" element={<MyReviews />}></Route>
        <Route path="/write-review/:productId" element={<WriteReview />}></Route>
        <Route path="/auth/product/:productId" element={<AuthProductDetail />}></Route>
        <Route path="/chat" element={<Chat />}></Route>
        <Route path="/disputes" element={<MyDisputes />}></Route>
        <Route path="/create-dispute/:orderItemId" element={<CreateDisputeForm />}></Route>
        <Route path="/return-requests" element={<ReturnRequestsList />}></Route>
      </Route>

      {/* Admin routes - must come BEFORE seller routes to avoid prefix matching issues */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MONITOR, ROLES.SUPPORT, ROLES.FINANCE]}>
          <AdminDashboardLayout />
        </ProtectedRoute>
      }>
        {/* Overview - All admin-level can view */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MONITOR, ROLES.SUPPORT, ROLES.FINANCE]}>
            <OverviewA />
          </ProtectedRoute>
        }></Route>

        {/* Manage Products - Admin only */}
        <Route path="/admin/manage-products" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <ManageProductA />
          </ProtectedRoute>
        }></Route>

        {/* Manage Users - Admin & Support only */}
        <Route path="/admin/manage-users" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPPORT]}>
            <ManageUser />
          </ProtectedRoute>
        }></Route>

        {/* Manage Stores - Admin & Finance only */}
        <Route path="/admin/manage-stores" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.FINANCE]}>
            <ManageStore />
          </ProtectedRoute>
        }></Route>

        {/* Manage Vouchers - Admin & Support & Finance */}
        <Route path="/admin/manage-vouchers" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPPORT, ROLES.FINANCE]}>
            <ManageVoucher />
          </ProtectedRoute>
        }></Route>

        {/* Manage Orders - Admin only */}
        <Route path="/admin/manage-orders" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <ManageOrderAdmin />
          </ProtectedRoute>
        }></Route>

        {/* Manage Reviews - Admin & Support */}
        <Route path="/admin/manage-reviews" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPPORT]}>
            <ManageReviews />
          </ProtectedRoute>
        }></Route>

        {/* Manage Disputes - Admin & Support */}
        <Route path="/admin/manage-disputes" element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPPORT]}>
            <ManageDisputes />
          </ProtectedRoute>
        }></Route>
      </Route>

      {/* Seller/Dashboard routes - protected to prevent buyer access */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={[ROLES.SELLER]}>
          <ManagerDashboardSellerLaydout />
        </ProtectedRoute>
      } errorElement={<ErrorPage />}>
        <Route path="overview" element={<Overview />}></Route>
        <Route path="manage-product" element={<ManageProduct />}></Route>
        <Route path="manage-inventory" element={<ManageInventory />} />
        <Route path="manage-store" element={<ManageStoreProfile />}></Route>
        <Route path="product/:id" element={<ProductDetail />} errorElement={<ErrorPage />} />
        <Route path="manage-order" element={<ManageOrder />}></Route>
        <Route path="manage-shipping" element={<ManageShipping />}></Route>
        <Route path="manage-dispute" element={<ManageDispute />} />
        <Route path="manage-return-request" element={<ManageReturnRequest />} />
      </Route>

      <Route path="/locked-account" element={<LockedAccount />}></Route>
      <Route path="/pending-account" element={<PendingAccount />}></Route>
      <Route path="/signin" element={<SignIn />}></Route>
      <Route path="/admin/setup-2fa" element={<AdminSetup2FA />}></Route>
      <Route path="/signup" element={<SignUp />}></Route>
      <Route path="/store-registration" element={<StoreRegistration />}></Route>
      <Route path="/forgot-password" element={<ForgotPassword />}></Route>
      <Route path="*" element={<ErrorPage />} />
    </Route>
  )
);

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchCart());

  }, [dispatch]);

  return (
    <div className="font-bodyFont">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

