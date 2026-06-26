import React, { useState, useEffect } from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';
import './Cart.css';

const Cart = ({ onBack, onCheckoutSuccess, onCheckout }) => {
  const [cartItems, setCartItems] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('sf_cart') || '[]');
    setCartItems(savedCart);
  }, []);

  const handleRemove = (courseId) => {
    const updatedCart = cartItems.filter(item => item.id !== courseId);
    setCartItems(updatedCart);
    localStorage.setItem('sf_cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const totalPrice = cartItems.length * 49.99; // Mock price $49.99 per course

  const mockCartCourseForPayment = {
    id: 'cart_checkout',
    title: `SkillForge Cart (${cartItems.length} items)`,
    is_ai_generated: false,
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=200',
    price: `$${totalPrice.toFixed(2)}`
  };

  const handlePaymentSuccess = () => {
    // Enroll in all cart courses
    const enrolled = JSON.parse(localStorage.getItem('sf_enrolled_courses') || '[]');
    const newEnrolled = [...enrolled, ...cartItems.map(c => c.id)];
    // deduplicate just in case
    const uniqueEnrolled = [...new Set(newEnrolled)];
    localStorage.setItem('sf_enrolled_courses', JSON.stringify(uniqueEnrolled));

    // Clear cart
    localStorage.removeItem('sf_cart');
    setCartItems([]);
    window.dispatchEvent(new Event('cart_updated'));

    setShowPayment(false);
    
    alert('Payment successful! You are now enrolled in all courses.');
    if (onCheckoutSuccess) {
      onCheckoutSuccess();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <div className="empty-cart-content">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty Cart" className="empty-cart-img" />
          <h2>Your cart is empty!</h2>
          <p>Explore our wide range of courses and start your learning journey today.</p>
          <button className="shop-now-btn" onClick={onBack}>Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Continue Shopping
        </button>
        <h1>Shopping Cart</h1>
      </div>

      <div className="cart-content">
        <div className="cart-items-section">
          <div className="cart-items-header">
            <h3>My Cart ({cartItems.length})</h3>
          </div>
          <div className="cart-items-list">
            {cartItems.map((course) => (
              <div key={course.id} className="cart-item">
                <div className="cart-item-image">
                  <img 
                    src={course.image_url?.startsWith('http') ? course.image_url : process.env.REACT_APP_API_URL + course.image_url} 
                    alt={course.title} 
                  />
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-title">{course.title}</h3>
                  <p className="cart-item-author">{course.is_ai_generated ? "SkillForge AI" : "Domain Expert"}</p>
                  <p className="cart-item-rating">⭐ {course.rating} • {course.students_count} students</p>
                  <div className="cart-item-actions">
                    <button className="remove-btn" onClick={() => handleRemove(course.id)}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">
                  <span className="current-price">$49.99</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary-card">
            <h3>Price Details</h3>
            <div className="summary-row">
              <span>Price ({cartItems.length} items)</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span className="discount-text">-$0.00</span>
            </div>
            <div className="summary-row total-row">
              <span>Total Amount</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="savings-msg">
              You will save $0.00 on this order
            </div>
            <button className="place-order-btn" onClick={() => {
              if (onCheckout) {
                onCheckout(mockCartCourseForPayment);
              } else {
                setShowPayment(true);
              }
            }}>
              Enroll Now
            </button>
          </div>
          <div className="secure-checkout-badge">
            <ShieldCheck size={20} />
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small helper component for the shield icon since it's used in the text
const ShieldCheck = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check" color="#878787">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

export default Cart;
