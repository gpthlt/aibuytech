import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">🛒</span>
            <span className="logo-text">AIBUYTECH</span>
          </Link>

          <nav className="nav">
            <Link to="/" className="nav-link">
              Trang chủ
            </Link>
            <Link to="/products" className="nav-link">
              Sản phẩm
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className="nav-link">
                  Đơn hàng
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="nav-link admin-link">
                    <span className="admin-icon">⚙️</span>
                    Admin
                  </Link>
                )}
                <Link to="/cart" className="nav-link cart-link">
                  <span className="cart-icon">🛒</span>
                  {itemCount > 0 && (
                    <span className="cart-badge">{itemCount}</span>
                  )}
                </Link>
              </>
            )}
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-name">👋 {user?.name}</span>
                <button onClick={handleLogout} className="btn btn-outline">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
