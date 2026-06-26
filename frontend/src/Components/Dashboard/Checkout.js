import React, { useState } from 'react';
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import './Checkout.css';

const Checkout = ({ course, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

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
    <div className="checkout-container">
      <div className="checkout-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Secure Checkout</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-main">
          {/* Step 1: Login (Mocked as done) */}
          <div className="checkout-step completed">
            <div className="step-header">
              <span className="step-number">1</span>
              <div className="step-title">
                <h3>Login</h3>
                <CheckCircle2 size={18} color="#2874f0" />
              </div>
            </div>
            <div className="step-body">
              <p>Logged in securely</p>
            </div>
          </div>

          {/* Step 2: Order Summary */}
          <div className="checkout-step completed">
            <div className="step-header">
              <span className="step-number">2</span>
              <div className="step-title">
                <h3>Order Summary</h3>
                <CheckCircle2 size={18} color="#2874f0" />
              </div>
            </div>
            <div className="step-body">
              <div className="checkout-item">
                <img 
                  src={course.image_url?.startsWith('http') ? course.image_url : process.env.REACT_APP_API_URL + course.image_url} 
                  alt={course.title} 
                />
                <div className="checkout-item-details">
                  <h4>{course.title}</h4>
                  <p>{course.is_ai_generated ? "SkillForge AI" : "Domain Expert"}</p>
                </div>
                <div className="checkout-item-price">{price}</div>
              </div>
            </div>
          </div>

          {/* Step 3: Payment Options */}
          <div className="checkout-step active">
            <div className="step-header">
              <span className="step-number">3</span>
              <div className="step-title">
                <h3>Payment Options</h3>
              </div>
            </div>
            <div className="step-body">
              <div className="payment-options">
                <div 
                  className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <input type="radio" checked={paymentMethod === 'card'} readOnly />
                  <CreditCard size={20} />
                  <span>Credit / Debit / ATM Card</span>
                </div>
                
                {paymentMethod === 'card' && (
                  <form onSubmit={handlePay} className="payment-form-card">
                    <div className="form-group">
                      <input 
                        type="text" 
                        placeholder="Enter Card Number" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <input 
                          type="text" 
                          placeholder="Valid Thru (MM/YY)" 
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <input 
                          type="password" 
                          placeholder="CVV" 
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <button type="submit" className="pay-now-btn" disabled={loading}>
                      {loading ? <div className="spinner"></div> : `PAY ${price}`}
                    </button>
                  </form>
                )}

                <div 
                  className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <input type="radio" checked={paymentMethod === 'paypal'} readOnly />
                  <span style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#003087' }}>PayPal</span>
                </div>
                
                {paymentMethod === 'paypal' && (
                  <div className="payment-form-card">
                    <p style={{ color: '#878787', marginBottom: '1rem' }}>You will be redirected to PayPal to complete this purchase securely.</p>
                    <button onClick={handlePay} className="pay-now-btn" disabled={loading}>
                      {loading ? <div className="spinner"></div> : `PAY ${price} WITH PAYPAL`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="price-details-card">
            <h3>Price Details</h3>
            <div className="price-row">
              <span>Price</span>
              <span>{price}</span>
            </div>
            <div className="price-row">
              <span>Discount</span>
              <span className="discount-text">-$0.00</span>
            </div>
            <div className="price-row total">
              <span>Amount Payable</span>
              <span>{price}</span>
            </div>
            <div className="secure-badge-checkout">
              <ShieldCheck size={24} color="#878787" />
              <p>Safe and Secure Payments. Easy returns. 100% Authentic products.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
