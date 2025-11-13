import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';
import { useComparisonStore } from '../store/useComparisonStore';
import './ProductCard.css';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
    images?: string[];
    description?: string;
    stock: number;
    category?: {
      name: string;
    };
  };
}

function ProductCard({ product }: ProductCardProps) {
  const { addProduct, removeProduct, isInComparison, canAdd } = useComparisonStore();
  const inComparison = isInComparison(product._id);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inComparison) {
      removeProduct(product._id);
    } else {
      if (canAdd()) {
        addProduct(product);
      } else {
        alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm');
      }
    }
  };

  // Get first image from images array or fallback to imageUrl or placeholder
  const getProductImage = () => {
    if (product.images && product.images.length > 0) {
      return `${API_BASE_URL}${product.images[0]}`;
    }
    if (product.imageUrl) {
      return `${API_BASE_URL}${product.imageUrl}`;
    }
    return '/placeholder.jpg';
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-link">
        <div className="product-image-wrapper">
          <img
            src={getProductImage()}
            alt={product.name}
            className="product-image"
          />
          {product.stock === 0 && (
            <div className="out-of-stock-badge">Hết hàng</div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <div className="low-stock-badge">Còn {product.stock} sản phẩm</div>
          )}
        </div>

        <div className="product-info">
          {product.category && (
            <span className="product-category">{product.category.name}</span>
          )}
          <h3 className="product-name">{product.name}</h3>
          {product.description && (
            <p className="product-description">
              {product.description.length > 100
                ? product.description.substring(0, 100) + '...'
                : product.description}
            </p>
          )}
        </div>
      </Link>
      <div className="product-footer">
        <span className="product-price">{formatPrice(product.price)}</span>
        <div className="product-actions">
          <Link
            to={`/products/${product._id}`}
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              if (product.stock === 0) {
                e.preventDefault();
              }
            }}
          >
            {product.stock === 0 ? 'Hết hàng' : 'Xem chi tiết'}
          </Link>
          <button
            className={`btn btn-primary btn-sm ${inComparison ? 'active' : ''}`}
            onClick={handleCompareClick}
            title={inComparison ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
          >
            {inComparison ? '✓ So sánh' : 'So sánh'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
