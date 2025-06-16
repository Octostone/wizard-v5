'use client';

import { useEffect, useState } from 'react';
import styles from '../app/page.module.css';

export default function GoogleAuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error initiating Google auth:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <button
      onClick={handleAuth}
      className={styles.googleAuthButton}
      disabled={isAuthenticated}
    >
      {isAuthenticated ? 'Connected to Google' : 'Connect with Google'}
    </button>
  );
} 