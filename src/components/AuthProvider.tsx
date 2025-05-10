"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../services/firebase'; // Adjust if your firebase app export is different

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    // You can render a global loading spinner here if you like
    return <div>Loading authentication state...</div>; 
  }

  if (!user && pathname !== '/login') {
    // Still loading or redirecting, render null or a loader
    return null; 
  }

  return <>{children}</>;
};

export default AuthProvider;
