'use client';

import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { app } from '../services/firebase'; // Assuming your firebase app instance is exported from here

const LoginScreen = () => {
  const [error, setError] = useState<string | null>(null);

  // Ensure firebase app is initialized before getting auth
  // if (!app) {
  //   // Handle the case where firebase app is not initialized
  //   return <div>Error: Firebase not initialized.</div>;
  // }
  const auth = getAuth(app);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, provider);
      // You can access user information from the result if needed:
      // const user = result.user;
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const token = credential.accessToken;
      // const photoURL = user?.photoURL;


      console.log('Login successful!');
      // For example, redirect to a dashboard:
      // window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      console.error('Login failed:', err);
    }
  };

  const provider = new GoogleAuthProvider();

  return (
    <div style={{ backgroundColor: '#F5F5DC', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#A7C4A3', textAlign: 'center', marginBottom: '24px', fontSize: '2rem' }}>Login</h1>
        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</p>} {/* Display error message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => handleGoogleLogin()}
            style={{
 backgroundColor: '#DB4437', // Google brand color
 color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem',
              fontWeight: 'bold',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px',
            }}
          >
 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" style={{ width: '20px', height: '20px' }} />
            Sign in with Google
          </button>
        </div>
        <p style={{ marginTop: '24px', textAlign: 'center', color: '#A7C4A3' }}>
          {/* Removed "Don't have an account?" as social login typically handles this */}
          {/* If you still need a link for other sign-up methods, you can add it here */}
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
