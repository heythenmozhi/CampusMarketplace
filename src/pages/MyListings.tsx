import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2, Loader2, PlusCircle, Tag } from 'lucide-react';

interface Item {
  id: number;
  itemName: string;
  category: string;
  price: number;
  image: string;
  status: string;
}

export default function MyListings() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchMyItems();
    }
  }, [user, token]);

  const fetchMyItems = async () => {
    try {
      const res = await fetch(`/api/users/${user?.id}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch listings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item', error);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Listings</h1>
        <Link
          to="/post-item"
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          Post New Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <PlusCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No listings yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't posted any items for sale.</p>
          <Link
            to="/post-item"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gradient-to-r from-primary-500 to-violet-500 hover:from-primary-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg"
          >
            Post your first item
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col"
            >
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
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {item.category}
                  </div>
                  {item.status === 'Available' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Sold
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">
                  {item.itemName}
                </h3>
                
                <div className="mt-auto flex justify-between gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link
                    to={`/item/${item.id}`}
                    className="flex-1 text-center py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    to={`/edit-item/${item.id}`}
                    className="flex-1 flex justify-center items-center py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex justify-center items-center py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
