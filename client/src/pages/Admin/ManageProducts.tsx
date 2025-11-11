import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../lib/api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import ProductModal from './ProductModal';
import './ManageProducts.css';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  images?: string[];
  brand?: string;
}

function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  useEffect(() => {
    loadProducts();
  }, [currentPage, activeFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (activeFilter === 'active') params.isActive = true;
      if (activeFilter === 'inactive') params.isActive = false;
      if (searchQuery) params.q = searchQuery;

      const { data } = await api.get('/api/v1/admin/products', { params });
      setProducts(data.data.data);
      setTotalPages(data.data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(undefined);
  };

  const handleModalSuccess = () => {
    loadProducts();
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this product?`)) {
      return;
    }

    try {
      await api.patch(`/api/v1/admin/products/${productId}`, { isActive: !currentStatus });
      toast.success(`Product ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/v1/admin/products/${productId}`);
      toast.success('Product deleted successfully');
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete product');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) return <Loading />;

  return (
    <div className="manage-products">
      <div className="page-header">
        <h1>Manage Products</h1>
        <div className="header-actions">
          <button className="btn-add" onClick={handleAddProduct}>
            + Add New Product
          </button>
          <Link to="/admin" className="btn-back">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="controls-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-buttons">
          <button
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => setActiveFilter('all')}
          >
            All Products
          </button>
          <button
            className={activeFilter === 'active' ? 'active' : ''}
            onClick={() => setActiveFilter('active')}
          >
            Active
          </button>
          <button
            className={activeFilter === 'inactive' ? 'active' : ''}
            onClick={() => setActiveFilter('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="product-info">
                      {product.images && product.images.length > 0 && (
                        <img 
                          src={`${API_BASE_URL}${product.images[0]}`}
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '10px' }}
                        />
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.description.substring(0, 60)}...</small>
                        {product.images && product.images.length > 0 && (
                          <small style={{ display: 'block', color: '#667eea' }}>
                            📷 {product.images.length} {product.images.length === 1 ? 'image' : 'images'}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || 'N/A'}</td>
                  <td className="price">{formatCurrency(product.price)}</td>
                  <td>
                    <span className={`stock-badge ${product.stock <= 10 ? 'low' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="btn-edit"
                      title="Edit product"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleToggleActive(product._id, product.isActive)}
                      className="btn-toggle"
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {product.isActive ? '🔒' : '✅'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      className="btn-delete"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct ? {
            ...selectedProduct,
            category: typeof selectedProduct.category === 'string' 
              ? selectedProduct.category 
              : selectedProduct.category._id
          } : undefined}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

export default ManageProducts;
