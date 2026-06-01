// import { createContext, useState, useEffect } from 'react';
// import { getMe } from '../api/auth';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       getMe()
//         .then((res) => setUser(res.data))
//         .catch(() => localStorage.removeItem('token'))
//         .finally(() => setLoading(false));
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const login = (userData, token) => {
//     localStorage.setItem('token', token);
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//   };

//   const isAuthenticated = !!user;

//   return (
//     <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };





import { createContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

export const AuthContext = createContext();

// Mode développement : utilisateurs simulés
const DEV_USERS = {
  client: { id: 1, email: 'client@aminfo.mg', full_name: 'Jean Client', role: 'client' },
  admin: { id: 2, email: 'admin@aminfo.mg', full_name: 'Admin AM Info', role: 'admin' },
  technician: { id: 3, email: 'tech@aminfo.mg', full_name: 'Tech AM Info', role: 'technician' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const devRole = localStorage.getItem('dev_role');
    
    if (devRole && DEV_USERS[devRole]) {
      // Mode développement
      setUser(DEV_USERS[devRole]);
      setLoading(false);
    } else if (token) {
      // Mode production (backend)
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('dev_role'); // enlever mode dev
    setUser(userData);
  };

  const devLogin = (role) => {
    localStorage.removeItem('token');
    localStorage.setItem('dev_role', role);
    setUser(DEV_USERS[role]);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('dev_role');
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, devLogin, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};