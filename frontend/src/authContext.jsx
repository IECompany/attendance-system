import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null); // Initialize with null

export const AuthProvider = ({ children }) => {
  // State to hold user information and token
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // To manage initial loading state

  // On initial load, check localStorage for existing token and user data
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        // Clear invalid data if parsing fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false); // Mark loading as complete
  }, []);

  // Login function: sets user, token, and stores in localStorage
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    // You might also want to store other specific user data here if needed by other components
    localStorage.setItem('userType', userData.userType);
    localStorage.setItem('companyId', userData.companyId);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('erpId', userData.email || userData.pacsId);
  };

  // Logout function: clears user, token, and removes from localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('companyId');
    localStorage.removeItem('userName');
    localStorage.removeItem('erpId');
  };

  // The value provided to consumers of this context
  const contextValue = {
    user,
    token,
    loading, // Provide loading state
    login,
    logout,
    isAuthenticated: !!user && !!token, // Convenience boolean
    // You can also provide the role directly from the user object if user is not null
    role: user ? user.userType : null,
    companyId: user ? user.companyId : null,
    userName: user ? user.name : null,
    erpId: user ? (user.email || user.pacsId) : null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children} {/* Only render children once loading is complete */}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};