import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useComparisonStore } from '../store/useComparisonStore';
import api from '../lib/api';
import { API_BASE_URL } from '../lib/api';
import toast from 'react-hot-toast';
import './Comparison.css';

function Comparison() {
  const { products, removeProduct, clearComparison } = useComparisonStore();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (products.length < 2) {
      toast.error('Vui lòng chọn ít nhất 2 sản phẩm để so sánh');
      return;
    }

    if (products.length > 4) {
      toast.error('Bạn chỉ có thể so sánh tối đa 4 sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const productIds = products.map((p) => p._id);
      const response = await api.post(
        '/api/v1/products/compare',
        { productIds },
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `so-sanh-san-pham-${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Đã tải xuống tài liệu so sánh thành công!');
    } catch (error: any) {
      console.error('Error downloading comparison:', error);
      toast.error(
        error.response?.data?.error?.message || 'Không thể tải xuống tài liệu so sánh'
      );
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (product: any) => {
    if (product.images && product.images.length > 0) {
      return `${API_BASE_URL}${product.images[0]}`;
    }
    if (product.imageUrl) {
      return `${API_BASE_URL}${product.imageUrl}`;
    }
    return '/placeholder.jpg';
  };

  if (products.length === 0) {
    return (
      <div className="comparison-empty">
        <h2>Chưa có sản phẩm nào để so sánh</h2>
        <p>Thêm sản phẩm vào danh sách so sánh để bắt đầu</p>
        <Link to="/" className="btn btn-primary">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <h1>So sánh sản phẩm</h1>
        <div className="comparison-actions">
          <button onClick={clearComparison} className="btn btn-outline">
            Xóa tất cả
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-primary"
            disabled={loading || products.length < 2}
          >
            {loading ? 'Đang tạo tài liệu...' : 'Tải xuống so sánh'}
          </button>
        </div>
      </div>

      {products.length < 2 && (
        <div className="comparison-warning">
          <p>Vui lòng chọn ít nhất 2 sản phẩm để so sánh (tối đa 4 sản phẩm)</p>
        </div>
      )}

      <div className="comparison-grid">
        {products.map((product) => (
          <div key={product._id} className="comparison-item">
            <button
              className="comparison-remove-btn"
              onClick={() => removeProduct(product._id)}
              title="Xóa khỏi so sánh"
            >
              ✕
            </button>
            <Link to={`/products/${product._id}`} className="comparison-item-link">
              <img src={getProductImage(product)} alt={product.name} />
              <h3>{product.name}</h3>
              {product.category && (
                <span className="comparison-category">{product.category.name}</span>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Comparison;

