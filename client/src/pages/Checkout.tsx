import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Vietnam',
    paymentMethod: 'cod' as 'cod' | 'credit_card' | 'momo' | 'vnpay',
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/api/v1/orders', {
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        paymentMethod: formData.paymentMethod,
        note: formData.note,
      });

      toast.success('Order placed successfully!');
      
      // If payment method is not COD, redirect to payment
      if (formData.paymentMethod !== 'cod') {
        navigate(`/orders/${data.data._id}/payment`);
      } else {
        navigate('/orders');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Shipping Address */}
          <div className="form-section">
            <h2 className="section-title">
              Shipping Address
            </h2>

            <div className="form-group">
              <label className="form-label">
                Street Address <span className="required">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="form-input"
                placeholder="Enter your street address..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  City <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                  placeholder="Enter city name..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  State/Province <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="form-input"
                  placeholder="Enter state/province..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Zip Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="form-input"
                  placeholder="Enter zip code..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Country <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-section">
            <h2 className="section-title">
              Payment Method
            </h2>

            <div className="payment-options">
              {[
                { value: 'cod', label: 'Cash on Delivery (COD)', icon: '💵' },
                { value: 'credit_card', label: 'Credit Card', icon: '💳' },
                { value: 'momo', label: 'MoMo Wallet', icon: '📱' },
                { value: 'vnpay', label: 'VNPay', icon: '💰' },
              ].map((method) => (
                <label 
                  key={method.value} 
                  className={`payment-option ${formData.paymentMethod === method.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={formData.paymentMethod === method.value}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'cod' | 'credit_card' | 'momo' | 'vnpay' })}
                  />
                  <span className="payment-label">
                    <span className="payment-icon">{method.icon}</span>
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Order Note */}
          <div className="form-section">
            <h2 className="section-title">
              Order Note (Optional)
            </h2>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={4}
              className="form-textarea"
              placeholder="Add any special instructions for your order..."
            />
          </div>

          {/* Actions */}
          <div className="checkout-actions">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="btn btn-back"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-submit"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Checkout;
