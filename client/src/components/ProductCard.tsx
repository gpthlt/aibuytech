import { Link } from 'react-router-dom';
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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Get first image from images array or fallback to imageUrl or placeholder
  const getProductImage = () => {
    if (product.images && product.images.length > 0) {
      return `http://api.aibuytech.store${product.images[0]}`;
    }
    if (product.imageUrl) {
      return `http://api.aibuytech.store${product.imageUrl}`;
    }
    return '/placeholder.jpg';
  };

  return (
    <Link to={`/products/${product._id}`} className="product-card">
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
        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.preventDefault();
              // Add to cart logic will be handled in ProductDetail
            }}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Hết hàng' : 'Xem chi tiết'}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
