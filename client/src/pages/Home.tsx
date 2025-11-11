import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import './Home.css';

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description: string;
  stock: number;
  category?: {
    name: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchMode, setSearchMode] = useState<'text' | 'image' | 'ai'>('text');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { q: searchTerm }),
      });

      // Backend expects sort format: 'price' or '-price' (prefix - for desc)
      const sortValue = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
      params.append('sort', sortValue);

      const { data } = await api.get(`/api/v1/products?${params}`);
      setProducts(data.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchMode === 'image') {
      if (!selectedImage) {
        toast.error('Vui lòng chọn hình ảnh để tìm kiếm');
        return;
      }

      await handleImageSearch(selectedImage);
    } else if (searchMode === 'ai') {
      if (!aiQuery.trim()) {
        toast.error('Vui lòng nhập câu hỏi để tìm kiếm');
        return;
      }

      await handleAISearch(aiQuery);
    } else {
      setPagination({ ...pagination, page: 1 });
      fetchProducts();
    }
  };

  const handleImageSearch = async (imageFile: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('topK', '12');

      const { data } = await api.post('/api/v1/products/search/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProducts(data.data.data || []);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
      toast.success(`Tìm thấy ${data.data.data?.length || 0} sản phẩm tương tự`);
    } catch (error: any) {
      console.error('Error searching by image:', error);
      toast.error(error.response?.data?.error?.message || 'Không thể tìm kiếm bằng hình ảnh');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = async (query: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/products/search/ai', {
        query: query.trim(),
        page: 1,
        limit: pagination.limit,
      });

      setProducts(data.data.data || []);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: data.data.pagination.total,
        totalPages: data.data.pagination.totalPages,
      }));
      toast.success(`Tìm thấy ${data.data.data?.length || 0} sản phẩm phù hợp`);
    } catch (error: any) {
      console.error('Error searching with AI:', error);
      toast.error(error.response?.data?.error?.message || 'Không thể tìm kiếm với AI');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModeSwitch = (mode: 'text' | 'image' | 'ai') => {
    setSearchMode(mode);
    if (mode === 'text') {
      handleClearImage();
      setSearchTerm('');
      setAiQuery('');
      setPagination({ ...pagination, page: 1 });
      fetchProducts();
    } else if (mode === 'image') {
      setSearchTerm('');
      setAiQuery('');
    } else if (mode === 'ai') {
      handleClearImage();
      setSearchTerm('');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home">
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
          <h1 className="hero-title">
            Chào mừng đến với <span className="gradient-text">AIBUYTECH</span>
          </h1>
          <p className="hero-subtitle">Nền tảng mua sắm công nghệ hàng đầu Việt Nam</p>
        </section>

        {/* Filters & Search */}
        <section className="filters">
          {/* Search Mode Toggle */}
          <div className="search-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${searchMode === 'text' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('text')}
            >
              📝 Tìm kiếm
            </button>
            <button
              type="button"
              className={`mode-btn ${searchMode === 'image' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('image')}
            >
              🖼️ Tìm kiếm bằng hình ảnh
            </button>
            <button
              type="button"
              className={`mode-btn ${searchMode === 'ai' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('ai')}
            >
              🤖 Tìm kiếm bằng AI
            </button>
          </div>

          <div className="filters-row">
            <form onSubmit={handleSearch} className="search-form">
              {searchMode === 'text' ? (
                <>
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <button type="submit" className="btn btn-primary">
                    🔍 Tìm kiếm
                  </button>
                </>
              ) : searchMode === 'image' ? (
                <>
                  <div className="image-search-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="file-input"
                      id="image-search-input"
                    />
                    <label htmlFor="image-search-input" className="file-input-label">
                      {selectedImage ? '📷 Đã chọn hình ảnh' : '📷 Chọn hình ảnh'}
                    </label>
                    {imagePreview && (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="clear-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={!selectedImage}>
                    🔍 Tìm kiếm
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mua điện thoại dưới 10tr..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="search-input"
                  />
                  <button type="submit" className="btn btn-primary" disabled={!aiQuery.trim()}>
                    🔍 Tìm kiếm
                  </button>
                </>
              )}
            </form>

            <div className="sort-controls">
              <label>Sắp xếp:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select">
                <option value="createdAt">Mới nhất</option>
                <option value="price">Giá</option>
                <option value="name">Tên</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="select"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        {loading ? (
          <Loading text="Đang tải sản phẩm..." />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
