import React, { useState } from 'react';
import { CreditCard, ShieldCheck, X } from 'lucide-react';
import './PaymentModal.css';

const PaymentModal = ({ course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Use a hardcoded price since the mock API might not have it
  const price = course.price || "$49.99";

  const handlePay = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call for payment processing
    setTimeout(() => {
      setLoading(false);
      onSuccess(course);
    }, 1500);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        <div className="payment-modal-header">
          <h2 className="payment-modal-title">Complete Payment</h2>
          <button className="payment-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-modal-body">
          <div className="course-summary">
            <img 
              src={course.image_url?.startsWith('http') ? course.image_url : process.env.REACT_APP_API_URL + course.image_url} 
              alt={course.title} 
              className="course-summary-img"
            />
            <div className="course-summary-info">
              <h3>{course.title}</h3>
              <p>{course.is_ai_generated ? "SkillForge AI" : "Domain Expert"}</p>
            </div>
            <div className="course-summary-price">{price}</div>
          </div>

          <div className="payment-methods">
            <div 
              className={`payment-method ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={18} />
              <span>Credit / Debit Card</span>
            </div>
            <div 
              className={`payment-method ${paymentMethod === 'paypal' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#003087' }}>PayPal</span>
            </div>
          </div>

          <form onSubmit={handlePay} className="payment-form">
            {paymentMethod === 'card' && (
              <>
                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="password" 
                      placeholder="123" 
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'paypal' && (
              <div style={{ padding: '1rem 0', textAlign: 'center', color: '#64748b' }}>
                You will be redirected to PayPal to complete your purchase securely.
              </div>
            )}

            <div className="secure-badge">
              <ShieldCheck size={16} color="#10b981" />
              <span>Secure 256-bit SSL encryption</span>
            </div>

            <button type="submit" className="pay-now-btn" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                `Pay ${price} Securely`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
