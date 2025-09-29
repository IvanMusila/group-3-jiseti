// src/components/Navbar.jsx
import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutAsync } from '../features/auth/authSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useClickOutside } from '../hooks/useClickOutside'; 

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Optional: Click outside hook to close dropdown
  // useClickOutside(dropdownRef, () => setShowDropdown(false));

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate('/');
      setShowDropdown(false);
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-orange-100 shadow-sm border-b border-orange-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-32">
                <img
                  className="h-full w-auto"
                  src="/images/jiseti-logo2.png"
                  alt="Jiseti Logo"
                />
              </div>
            </Link>
            <Link to="/" className="px-3 py-2 ml-10 rounded-md text-sm font-medium transition-colors text-gray-700 hover:text-yellow-950">
              Home
            </Link>
            
            {/* Navigation Links - Only show when authenticated */}
            {isAuthenticated && (
              <div className="hidden md:ml-8 md:flex md:space-x-6">
                
                <Link
                  to="/reports/new"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute('/reports/new') 
                      ? 'text-yellow-950 bg-orange-200' 
                      : 'text-gray-700 hover:text-yellow-950 hover:bg-orange-200'
                  }`}
                >
                  Create New Report
                </Link>
                
                <Link
                  to="/reports"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute('/reports') 
                      ? 'text-yellow-950 bg-orange-200' 
                      : 'text-gray-700 hover:text-yellow-950 hover:bg-orange-200'
                  }`}
                >
                  Reports
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/reports"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActiveRoute('/admin') 
                        ? 'text-yellow-950 bg-orange-200' 
                        : 'text-gray-700 hover:text-yellow-950 hover:bg-orange-200'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center">
            {!isAuthenticated ? (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-black font-medium rounded-md hover:text-yellow-950 hover:bg-orange-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-yellow-950 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Mobile menu button (optional) */}
                <div className="md:hidden">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-md text-gray-700 hover:text-yellow-950 hover:bg-orange-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Desktop user menu */}
                <div className="hidden md:flex md:items-center md:space-x-4">
                  <span className="text-gray-700 text-sm">
                    Hello, <span className="font-semibold">{user?.name || user?.email}</span>
                  </span>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center text-sm text-gray-700 focus:outline-none hover:text-yellow-950"
                    >
                      <div className="h-8 w-8 bg-yellow-950 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {(user?.name || user?.email).charAt(0).toUpperCase()}
                      </div>
                      <svg 
                        className={`ml-1 h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                          Signed in as<br />
                          <span className="font-medium text-gray-700">{user?.email}</span>
                        </div>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          Your Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          Settings
                        </Link>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            disabled={loading}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {loading ? 'Signing out...' : 'Sign out'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {showDropdown && isAuthenticated && (
          <div className="md:hidden border-t border-orange-200 pt-4 pb-3">
            <div className="flex items-center px-4 pb-3">
              <div className="h-10 w-10 bg-yellow-950 rounded-full flex items-center justify-center text-white font-semibold">
                {(user?.name || user?.email).charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.name || user?.email}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-yellow-950 hover:bg-orange-200"
                onClick={() => setShowDropdown(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/reports"
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-yellow-950 hover:bg-orange-200"
                onClick={() => setShowDropdown(false)}
              >
                Reports
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-yellow-950 hover:bg-orange-200"
                  onClick={() => setShowDropdown(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-yellow-950 hover:bg-orange-200"
                onClick={() => setShowDropdown(false)}
              >
                Your Profile
              </Link>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
              >
                {loading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;