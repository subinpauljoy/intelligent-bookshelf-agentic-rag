import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, Link, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';
import Navigation from './Navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as AuthContextModule from '../context/AuthContext'; // Import the module to mock its exports

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: vi.fn(),
    Link: vi.fn(({ children, to, ...props }) => (
      <a href={to as string} {...props}>
        {children}
      </a>
    )),
  };
});

// Mock AuthContext
const mockLogout = vi.fn();
const mockUser = { id: 1, email: 'test@example.com', is_superuser: false };
const mockSuperuser = { id: 2, email: 'admin@example.com', is_superuser: true };

// Mock useAuth specifically
vi.mock('../context/AuthContext', async (importOriginal) => {
  const originalModule = await importOriginal<typeof AuthContextModule>();
  return {
    ...originalModule,
    useAuth: vi.fn(), // Mock the useAuth hook
  };
});

// Mock useMediaQuery to control mobile/desktop view for tests
vi.mock('@mui/material/useMediaQuery');

const renderWithProviders = (ui: React.ReactElement, { user = mockUser, isMobile = false } = {}) => {
  (useMediaQuery as vi.Mock).mockReturnValue(isMobile);
  // Set the return value of the mocked useAuth hook for this test
  (AuthContextModule.useAuth as vi.Mock).mockReturnValue({
    user,
    token: 'fake-token',
    login: vi.fn(),
    logout: mockLogout,
    isAuthenticated: !!user,
  });

  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
        <BrowserRouter>{ui}</BrowserRouter>
    </ThemeProvider>
  );
};

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the app title', () => {
    renderWithProviders(<Navigation />);
    expect(screen.getByText('Intelligent Books')).toBeInTheDocument();
  });

  test('renders desktop navigation links for a regular user', () => {
    renderWithProviders(<Navigation />, { isMobile: false });
    expect(screen.getByRole('link', { name: /books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /recommendations/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /q&a/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('renders desktop navigation links for a superuser', () => {
    renderWithProviders(<Navigation />, { user: mockSuperuser, isMobile: false });
    expect(screen.getByRole('link', { name: /books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('calls logout and navigates to login on logout button click (desktop)', () => {
    const mockNavigate = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(mockNavigate);

    renderWithProviders(<Navigation />, { isMobile: false });
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('renders mobile menu icon and no desktop links when in mobile view', () => {
    renderWithProviders(<Navigation />, { isMobile: true });
    expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /books/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  test('opens and closes drawer in mobile view', async () => {
    renderWithProviders(<Navigation />, { isMobile: true });
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Assert that a specific item in the drawer is visible, indicating the drawer is open
    expect(screen.getByRole('link', { name: /books/i })).toBeInTheDocument();

    // Close the drawer by clicking on a list item
    fireEvent.click(screen.getByRole('link', { name: /books/i }));

    // Assert that the drawer content is no longer in the document (or not visible)
    // Using queryByRole because the element might be removed or hidden
    expect(screen.queryByRole('link', { name: /books/i })).not.toBeInTheDocument();
  });

  test('calls logout and navigates to login on logout button click (mobile drawer)', () => {
    const mockNavigate = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(mockNavigate);

    renderWithProviders(<Navigation />, { isMobile: true });
    fireEvent.click(screen.getByLabelText(/menu/i)); // Open drawer
    
    fireEvent.click(screen.getByText('Logout')); // Click logout in drawer

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
