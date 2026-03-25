import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Loader2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Item {
  id: number;
  itemName: string;
  category: string;
  price: number;
  image: string;
  sellerName: string;
  contact: string;
  status: string;
}

const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Hostel Items', 'Clothing', 'Other'];

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState<number[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchItems();
    if (user) {
      fetchFavorites();
    }
  }, [search, category, user]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.map((item: Item) => item.id));
      }
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, itemId: number) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to save items');
      return;
    }

    try {
      const res = await fetch(`/api/favorites/${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { isFavorite } = await res.json();
        if (isFavorite) {
          setFavorites([...favorites, itemId]);
        } else {
          setFavorites(favorites.filter(id => id !== itemId));
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category !== 'All') queryParams.append('category', category);

      const res = await fetch(`/api/items?${queryParams.toString()}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
            />
            <Search className="absolute left-4 top-2.5 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No items found. Try adjusting your search or category.</p>
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
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    ₹{item.price.toFixed(2)}
                  </div>
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
