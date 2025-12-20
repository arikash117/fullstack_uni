import { useLocation } from 'react-router-dom';

export function useAuth() {
    const location = useLocation();
  
    const isAuthPage = 
        location.pathname.startsWith('/dashboard') ||
        location.pathname === '/register' ||
        location.pathname === '/login';

    return {
        isLoggedIn: isAuthPage,
        login: () => {},
        logout: () => {},
        loading: false,
    };
}