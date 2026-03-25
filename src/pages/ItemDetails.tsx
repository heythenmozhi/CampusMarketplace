import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Phone, User, Tag, Loader2, Heart, MessageSquare, Send, CreditCard, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Item {
  id: number;
  itemName: string;
  category: string;
  price: number;
  description: string;
  image: string;
  sellerName: string;
  contact: string;
  createdAt: string;
  status: string;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  text: string;
  createdAt: string;
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchItemAndComments = async () => {
      try {
        const [itemRes, commentsRes] = await Promise.all([
          fetch(`/api/items/${id}`),
          fetch(`/api/items/${id}/comments`)
        ]);
        
        if (itemRes.ok) {
          const data = await itemRes.json();
          setItem(data);
        } else {
          setError('Item not found');
        }

        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }

        if (user) {
          const favRes = await fetch('/api/favorites', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (favRes.ok) {
            const favs = await favRes.json();
            setIsFavorite(favs.some((f: Item) => f.id === Number(id)));
          }
        }
      } catch (err) {
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndComments();
  }, [id, user, token]);

  const toggleFavorite = async () => {
    if (!user) {
      alert('Please login to save items');
      return;
    }

    try {
      const res = await fetch(`/api/favorites/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const res = await fetch(`/api/items/${id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ text: newComment })
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setPaymentProcessing(true);
    
    try {
      // Simulate network delay for payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await fetch(`/api/items/${id}/purchase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
        setPaymentSuccess(true);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
        }, 3000);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred during payment processing.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{error || 'Item not found'}</h2>
        <Link to="/" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium">
          &larr; Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Section */}
          <div className="relative h-96 md:h-auto bg-gray-100 dark:bg-gray-900">
            <img
              src={item.image}
              alt={item.itemName}
              className={`absolute inset-0 w-full h-full object-contain p-4 ${item.status === 'Sold' ? 'grayscale opacity-70' : ''}`}
              referrerPolicy="no-referrer"
            />
            {item.status === 'Sold' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="bg-red-500 text-white px-8 py-3 rounded-full text-2xl font-bold tracking-wider uppercase transform -rotate-12 shadow-xl border-4 border-red-600">Sold Out</span>
              </div>
            )}
            <button
              onClick={toggleFavorite}
              className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
            </button>
          </div>

          {/* Details Section */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 uppercase tracking-wider">
                <Tag className="w-3 h-3 mr-1" />
                {item.category}
              </span>
              {item.status === 'Sold' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 uppercase tracking-wider">
                  Sold
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {item.itemName}
            </h1>
            
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-violet-500 mb-6">
              ₹{item.price.toFixed(2)}
            </div>
            
            <div className="prose prose-primary dark:prose-invert max-w-none mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {item.description}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-100 dark:border-gray-600 mt-auto">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Seller Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">{item.sellerName}</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="font-medium">{item.contact}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <a
                  href={`tel:${item.contact}`}
                  className={`w-full flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-full text-gray-700 dark:text-gray-200 transition-all shadow-sm ${item.status === 'Sold' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  onClick={(e) => item.status === 'Sold' && e.preventDefault()}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Seller
                </a>
                
                {user && item.status !== 'Sold' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white transition-all shadow-md bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Buy Now for ₹{item.price.toFixed(2)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          Comments & Questions
        </h3>

        <div className="space-y-6 mb-8">
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No comments yet. Be the first to ask a question!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{comment.userName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {user ? (
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ask a question about this item..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full shadow-md disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">log in</Link> to leave a comment.
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-500" />
                Secure Checkout
              </h3>
              <button 
                onClick={() => !paymentProcessing && !paymentSuccess && setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                disabled={paymentProcessing || paymentSuccess}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {paymentSuccess ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h4>
                  <p className="text-gray-600 dark:text-gray-400">You have successfully purchased {item.itemName}.</p>
                </div>
              ) : (
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Item:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.itemName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      required
                      maxLength={19}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        required
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVC</label>
                      <input 
                        type="text" 
                        placeholder="123" 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        required
                        maxLength={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name on Card</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={paymentProcessing}
                    className="w-full mt-6 flex justify-center items-center px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-70 transition-colors"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${item.price.toFixed(2)}`
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
