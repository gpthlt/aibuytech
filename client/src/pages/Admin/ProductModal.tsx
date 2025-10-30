import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import './ProductModal.css';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  brand?: string;
  images?: string[];
  isActive?: boolean;
}

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

function ProductModal({ product, onClose, onSuccess }: ProductModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    stock: product?.stock || 0,
    brand: product?.brand || '',
    isActive: product?.isActive !== undefined ? product.isActive : true,
  });

  useEffect(() => {
    loadCategories();
    
    // Load existing images as previews
    if (product?.images && product.images.length > 0) {
      const fullImageUrls = product.images.map(img => `http://localhost:8000${img}`);
      setExistingImages(product.images); // Store original paths
      setImagePreviews(fullImageUrls); // Display full URLs
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/api/v1/products/categories');
      setCategories(data.data);
    } catch (error: any) {
      toast.error('Failed to load categories');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Calculate total images (existing + new)
    const totalImages = existingImages.length + files.length;
    if (totalImages > 6) {
      toast.error(`Maximum 6 images allowed. You already have ${existingImages.length} images.`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    setImageFiles(validFiles);

    // Create previews for new files
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    
    // Combine existing images with new previews
    const existingFullUrls = existingImages.map(img => `http://localhost:8000${img}`);
    setImagePreviews([...existingFullUrls, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const existingCount = existingImages.length;
    
    if (index < existingCount) {
      // Removing existing image
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
    } else {
      // Removing new file
      const fileIndex = index - existingCount;
      const newFiles = imageFiles.filter((_, i) => i !== fileIndex);
      setImageFiles(newFiles);
    }
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (formData.stock < 0) {
      toast.error('Stock cannot be negative');
      return;
    }

    try {
      setLoading(true);

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price.toString());
      submitData.append('category', formData.category);
      submitData.append('stock', formData.stock.toString());
      submitData.append('isActive', formData.isActive.toString());
      
      if (formData.brand) {
        submitData.append('brand', formData.brand);
      }

      // Append images
      imageFiles.forEach((file) => {
        submitData.append('images', file);
      });

      // If editing, include existing images that weren't removed
      if (product?._id && existingImages.length > 0) {
        existingImages.forEach((img) => {
          submitData.append('existingImages[]', img);
        });
      }

      if (product?._id) {
        // Update existing product
        await api.put(`/api/v1/admin/products/${product._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await api.post('/api/v1/admin/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter product name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}                
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Enter product description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">
                Price (VND) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="1000"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock">
                Stock <span className="required">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Enter brand name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="images">
              Product Images (Max 6 images, 5MB each)
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
            <p className="form-hint">
              Upload up to 6 images. Supported formats: JPEG, PNG, GIF, WebP
            </p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
              />
              <span>Active (visible to customers)</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
