/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PostItem from './pages/PostItem';
import ItemDetails from './pages/ItemDetails';
import MyListings from './pages/MyListings';
import EditItem from './pages/EditItem';
import SavedItems from './pages/SavedItems';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route 
            path="/post-item" 
            element={
              <ProtectedRoute>
                <PostItem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-item/:id" 
            element={
              <ProtectedRoute>
                <EditItem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-listings" 
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved" 
            element={
              <ProtectedRoute>
                <SavedItems />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
