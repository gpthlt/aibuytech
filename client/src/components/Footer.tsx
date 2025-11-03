import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>AIBUYTECH.VN</h3>
            <p>Nền tảng mua sắm công nghệ trực tuyến hàng đầu Việt Nam</p>
            <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="YouTube">📺</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Về chúng tôi</h4>
            <ul>
              <li><a href="#">Giới thiệu</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Hỗ trợ khách hàng</h4>
            <ul>
              <li><a href="#">Câu hỏi thường gặp</a></li>
              <li><a href="#">Hướng dẫn mua hàng</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Chính sách bảo hành</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Liên hệ</h4>
            <ul className="contact-info">
              <li>📞 Hotline: 0819186413</li>
              <li>✉️ Email: vuhoangphuc035@gmail.com</li>
              <li>📍 Địa chỉ: Trường quản trị và kinh doanh, ĐHQGHN</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 AIBUYTECH.VN. All rights reserved.</p>
          <p>Made with ❤️ in Vietnam</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
