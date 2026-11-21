"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

const AuthContext = createContext(null);

// I keep the Firebase auth instance in one place so every page shares it
function getAuthSafely() {
  try {
    return clientAuth();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth] = useState(getAuthSafely);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    // Firebase tells me whenever someone signs in or out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  async function logout() {
    if (auth) await signOut(auth);
  }

  // Protected API calls need this token in the Authorization header
  async function getToken() {
    return user ? user.getIdToken() : null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        auth,
        configured: Boolean(auth),
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}