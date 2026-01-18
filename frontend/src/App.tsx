import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import BookList from './pages/BookList';
import AddBook from './pages/AddBook';
import BookDetail from './pages/BookDetail';
import Recommendations from './pages/Recommendations';
import UserManagement from './pages/UserManagement';
import DocumentManager from './pages/DocumentManager';
import ChatInterface from './pages/ChatInterface';
import Navigation from './components/Navigation';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { ReactElement, ReactNode } from 'react';

const theme = createTheme();

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Layout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

function App(): ReactNode {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected Routes wrapped in Layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
                <Route path="/" element={<BookList />} />
                <Route path="/books/new" element={<AddBook />} />
                <Route path="/books/:id" element={<BookDetail />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/documents" element={<DocumentManager />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/admin/users" element={<UserManagement />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;