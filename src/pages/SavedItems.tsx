import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Loader2, Heart, HeartOff } from 'lucide-react';

interface Item {
  id: number;
  itemName: string;
  category: string;
  price: number;
  image: string;
  sellerName: string;
  status: string;
}

export default function SavedItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/favorites/${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to remove favorite', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-8 h-8 text-primary-500 fill-primary-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Items</h1>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <HeartOff className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No saved items</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't saved any items yet. Browse the marketplace to find things you like!</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 transition-all shadow-md"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <Link to={`/item/${item.id}`}>
                <div className="h-48 overflow-hidden relative group">
                  <img
                    src={item.image}
                    alt={item.itemName}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${item.status === 'Sold' ? 'grayscale opacity-70' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  {item.status === 'Sold' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="bg-red-500 text-white px-4 py-1 rounded-full font-bold tracking-wider uppercase transform -rotate-12 shadow-lg">Sold</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-semibold text-primary-600 dark:text-primary-400 shadow-sm">
                    ₹{item.price.toFixed(2)}
                  </div>
                  <button
                    onClick={(e) => removeFavorite(e, item.id)}
                    className="absolute top-2 left-2 p-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                    title="Remove from saved"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {item.itemName}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                    <span className="truncate">By {item.sellerName}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
