import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import Loading from '../components/Loading';
import Reviews from '../components/Reviews';
import toast from 'react-hot-toast';
import './ProductDetail.css';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  description: string;
  stock: number;
  category?: {
    _id: string;
    name: string;
  };
  specifications?: Record<string, string>;
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchProduct = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/v1/products/${id}`);
      setProduct(data.data);
    } catch (error: unknown) {
      console.error('Error fetching product:', error);
      toast.error('Không thể tải thông tin sản phẩm');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }

    if (!product) return;

    setAdding(true);
    try {
      await api.post('/api/v1/cart', {
        productId: product._id,
        quantity,
      });
      toast.success('Đã thêm vào giỏ hàng');
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Get all product images
  const getProductImages = () => {
    const images: string[] = [];
    if (product?.images && product.images.length > 0) {
      product.images.forEach(img => images.push(`http://localhost:8000${img}`));
    } else if (product?.imageUrl) {
      images.push(`http://localhost:8000${product.imageUrl}`);
    } else {
      images.push('/placeholder.jpg');
    }
    return images;
  };

  const productImages = product ? getProductImages() : [];

  if (loading) {
    return <Loading fullScreen text="Đang tải sản phẩm..." />;
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-detail">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Quay lại
        </button>

        <div className="product-content">
          {/* Images Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img
                src={productImages[selectedImageIndex]}
                alt={product.name}
              />
            </div>
            {productImages.length > 1 && (
              <div className="thumbnail-list">
                {productImages.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info-section">
            {product.category && (
              <span className="product-category">{product.category.name}</span>
            )}
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price">{formatPrice(product.price)}</div>

            <div className="stock-info">
              {product.stock > 0 ? (
                <span className="in-stock">✓ Còn hàng ({product.stock} sản phẩm)</span>
              ) : (
                <span className="out-of-stock">✗ Hết hàng</span>
              )}
            </div>

            <div className="quantity-selector">
              <label>Số lượng:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1))
                    )
                  }
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary btn-large"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding}
              >
                {adding ? 'Đang thêm...' : '🛒 Thêm vào giỏ hàng'}
              </button>
              <button
                className="btn btn-outline btn-large"
                onClick={() => {
                  handleAddToCart();
                  setTimeout(() => navigate('/checkout'), 500);
                }}
                disabled={product.stock === 0 || adding}
              >
                Mua ngay
              </button>
            </div>

            <div className="product-description">
              <h3>Mô tả sản phẩm</h3>
              <p>{product.description}</p>
            </div>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="product-specs">
                <h3>Thông số kỹ thuật</h3>
                <table>
                  <tbody>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td className="spec-label">{key}</td>
                        <td className="spec-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reviews Section */}
            <Reviews productId={product._id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
