import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useSelector } from 'react-redux'
import App from './App'

// Eager: layouts + route guards are tiny and needed to frame every page.
import AppLayout from './AppLayout'
import SellerLayout from './Features/Products/components/SellerLayout'
import AdminLayout from './Features/Admin/components/AdminLayout'
import ProtectedRoute from './Features/Authentication/components/ProtectedRoute'
import OptionalAuthRoute from './Features/Authentication/components/OptionalAuthRoute'
import SellerProtected from './Features/Authentication/components/SellerProtected'
import AdminProtected from './Features/Authentication/components/AdminProtected'
import Maintenance from './Shared/components/Maintenance'
import useSettings from './Features/Admin/Hook/useSettings'

// Lazy: every route page loads as its own chunk, so the Landing page no longer
// ships the admin/seller consoles (and their heavy charts) in the first download.
const Login = lazy(() => import('./Features/Authentication/Pages/Login'))
const Register = lazy(() => import('./Features/Authentication/Pages/Register'))
const ForgotPassword = lazy(() => import('./Features/Authentication/Pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./Features/Authentication/Pages/ResetPassword'))
const Dashboard = lazy(() => import('./Features/Products/Pages/Dashboard'))
const ProductDetail = lazy(() => import('./Features/Products/Pages/ProductDetail'))
const Cart = lazy(() => import('./Features/Cart/Pages/Cart'))
const MyOrders = lazy(() => import('./Features/Orders/Pages/MyOrders'))
const RequestCustomCake = lazy(() => import('./Features/CustomCake/Pages/RequestCustomCake'))
const MyCustomCakes = lazy(() => import('./Features/CustomCake/Pages/MyCustomCakes'))
const Wishlist = lazy(() => import('./Features/Wishlist/Pages/Wishlist'))

const SellerOverview = lazy(() => import('./Features/Products/Pages/SellerOverview'))
const CreateProduct = lazy(() => import('./Features/Products/Pages/CreateProduct'))
const SellerProducts = lazy(() => import('./Features/Products/Pages/SellerProducts'))
const SellerProductDetail = lazy(() => import('./Features/Products/Pages/SellerProductDetail'))
const SellerOrders = lazy(() => import('./Features/Orders/Pages/SellerOrders'))
const SellerNotifications = lazy(() => import('./Features/Products/Pages/SellerNotifications'))
const SellerCustomRequests = lazy(() => import('./Features/CustomCake/Pages/SellerCustomRequests'))
const SellerCoupons = lazy(() => import('./Features/Coupons/Pages/SellerCoupons'))
const SellerCatalog = lazy(() => import('./Features/Catalog/Pages/SellerCatalog'))
const SellerInventory = lazy(() => import('./Features/Products/Pages/SellerInventory'))

const AdminOverview = lazy(() => import('./Features/Admin/Pages/AdminOverview'))
const AdminOrders = lazy(() => import('./Features/Admin/Pages/AdminOrders'))
const AdminNotifications = lazy(() => import('./Features/Admin/Pages/AdminNotifications'))
const AdminUsers = lazy(() => import('./Features/Admin/Pages/AdminUsers'))
const AdminBanners = lazy(() => import('./Features/Admin/Pages/AdminBanners'))
const AdminPayments = lazy(() => import('./Features/Admin/Pages/AdminPayments'))
const AdminReports = lazy(() => import('./Features/Admin/Pages/AdminReports'))
const AdminSettings = lazy(() => import('./Features/Admin/Pages/AdminSettings'))

// Forces the maintenance page for everyone except admins when the
// admin Settings toggle is on. Admins (and the /login + /admin paths)
// stay reachable so the toggle can always be turned back off.
const MaintenanceGate = ({ children }) => {
    const { getPublicSettingsHandler } = useSettings()
    const User = useSelector(state => state.auth.User)
    const location = useLocation()
    const [maintenance, setMaintenance] = useState(false)

    useEffect(() => {
        getPublicSettingsHandler()
            .then(s => setMaintenance(!!s?.maintenanceMode))
            .catch(() => setMaintenance(false))
    }, [location.pathname])

    const isAdmin = User?.role === 'admin'
    const onAllowedPath = location.pathname === '/login' || location.pathname.startsWith('/admin')

    if (maintenance && !isAdmin && !onAllowedPath) {
        return <Maintenance />
    }

    return children
}

// Lightweight fallback shown while a route's chunk loads (never shown for the
// eager Landing home, so first paint stays instant).
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#F9E0D6]">
        <div className="w-8 h-8 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
    </div>
)

const AppRoutes = () => {


    return (
        <BrowserRouter>
            <MaintenanceGate>
            <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path='/' element={<App />} />
                    <Route path='/shop' element={<Dashboard />} />
                    <Route path='/product/:productId' element={<ProductDetail />} />
                    <Route path='/cart' element={<OptionalAuthRoute> <Cart /> </OptionalAuthRoute>} />
                    <Route path='/myOrders' element={<ProtectedRoute> <MyOrders /> </ProtectedRoute>} />
                    <Route path='/customCake' element={<ProtectedRoute> <RequestCustomCake /> </ProtectedRoute>} />
                    <Route path='/myCustomCakes' element={<ProtectedRoute> <MyCustomCakes /> </ProtectedRoute>} />
                    <Route path='/wishlist' element={<ProtectedRoute> <Wishlist /> </ProtectedRoute>} />
                </Route>



                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route path='/forgotPassword' element={<ForgotPassword />} />
                <Route path='/resetPassword' element={<ResetPassword />} />
                <Route path='/resetPassword/:token' element={<ResetPassword />} />
                <Route path='/maintenance' element={<Maintenance />} />

                <Route path='/product' >
                    {/* Seller console — shares the sidebar layout */}
                    <Route element={<SellerProtected> <SellerLayout /> </SellerProtected>}>
                        <Route path='/product/dashboard' element={<SellerOverview />} />
                        <Route path='/product/createProduct' element={<CreateProduct />} />
                        <Route path='/product/sellerProducts' element={<SellerProducts />} />
                        <Route path='/product/orders' element={<SellerOrders />} />
                        <Route path='/product/notifications' element={<SellerNotifications />} />
                        <Route path='/product/customRequests' element={<SellerCustomRequests />} />
                        <Route path='/product/coupons' element={<SellerCoupons />} />
                        <Route path='/product/catalog' element={<SellerCatalog />} />
                        <Route path='/product/inventory' element={<SellerInventory />} />
                    </Route>
                    {/* Focused full-screen editor (its own save/discard bar) */}
                    <Route path='/product/sellerProducts/:productId' element={<SellerProtected> <SellerProductDetail /> </SellerProtected>} />
                </Route>

                {/* Admin platform */}
                <Route element={<AdminProtected> <AdminLayout /> </AdminProtected>}>
                    <Route path='/admin' element={<AdminOverview />} />
                    <Route path='/admin/orders' element={<AdminOrders />} />
                    <Route path='/admin/notifications' element={<AdminNotifications />} />
                    <Route path='/admin/users' element={<AdminUsers />} />
                    <Route path='/admin/banners' element={<AdminBanners />} />
                    <Route path='/admin/payments' element={<AdminPayments />} />
                    <Route path='/admin/reports' element={<AdminReports />} />
                    <Route path='/admin/settings' element={<AdminSettings />} />
                </Route>


            </Routes>
            </Suspense>
            </MaintenanceGate>
        </BrowserRouter>
    )
}

export default AppRoutes
