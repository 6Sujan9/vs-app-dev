import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import '../styles/header.css';

/**
 * Header Component
 * Displays the logo, app title, and navigation options
 */
const Header = ({ showNav = true }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <img 
            src="/ai_fitness_coach_logo.svg" 
            alt="AI Fitness Coach" 
            className="logo" 
            title="AI Fitness Coach"
          />
          <div className="app-title">
            <h1>AI Fitness Coach</h1>
            <p className="tagline">Your AI-Powered Fitness & Nutrition Guide</p>
          </div>
        </div>

        {/* Navigation */}
        {showNav && (
          <nav className="header-nav">
            <div className="nav-links">
              <button 
                className="nav-link" 
                onClick={() => handleNavigate('/dashboard')}
                title="Go to Dashboard"
              >
                📊 Dashboard
              </button>
              <button 
                className="nav-link" 
                onClick={() => handleNavigate('/chat')}
                title="Chat with AI Coach"
              >
                💬 Chat
              </button>
            </div>

            {/* User Menu */}
            <div className="user-menu">
              {profile && (
                <div className="user-info">
                  <span className="user-name">
                    {profile.first_name} {profile.last_name}
                  </span>
                </div>
              )}
              <button 
                className="logout-btn" 
                onClick={handleLogout}
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
