import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

/** Oturum yoksa giriş sayfasına yönlendirir; girişten sonra kullanıcı geldiği sayfaya döner. */
const RequireAuth = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Outlet />;
};

export default RequireAuth;
