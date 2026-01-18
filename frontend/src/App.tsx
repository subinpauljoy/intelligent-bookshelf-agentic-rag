import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import BookList from './pages/BookList';
import AddBook from './pages/AddBook';
import UserManagement from './pages/UserManagement';
import DocumentManager from './pages/DocumentManager';
import ChatInterface from './pages/ChatInterface';
import Navigation from './components/Navigation';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Navigation />
            {children}
        </>
    );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><BookList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/books/new" element={
              <ProtectedRoute>
                <Layout><AddBook /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Layout><DocumentManager /></Layout>
              </ProtectedRoute>
            } />
             <Route path="/chat" element={
              <ProtectedRoute>
                <Layout><ChatInterface /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <Layout><UserManagement /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
