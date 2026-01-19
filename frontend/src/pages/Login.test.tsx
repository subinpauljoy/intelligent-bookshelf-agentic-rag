import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Login from './Login';
import * as AuthContextModule from '../context/AuthContext';
import * as AuthService from '../services/auth';

// Mocks
vi.mock('../context/AuthContext');
vi.mock('../services/auth');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: vi.fn(),
        Link: (props: any) => <a {...props} href={props.to}>{props.children}</a>
    };
});


describe('Login Page', () => {
    let mockLogin: vi.Mock;
    let mockNavigate: vi.Mock;
    let mockLoginUser: vi.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        mockLogin = vi.fn();
        mockNavigate = vi.fn();
        mockLoginUser = vi.fn();
        
        // Mock the implementation of the hooks and services
        (AuthContextModule.useAuth as vi.Mock).mockReturnValue({ login: mockLogin });
        (useNavigate as vi.Mock).mockReturnValue(mockNavigate);
        (AuthService.loginUser as vi.Mock) = mockLoginUser;
    });

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    test('renders login form correctly', () => {
        renderComponent();
        expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /don't have an account\? sign up/i })).toBeInTheDocument();
    });

    test('allows user to enter email and password', async () => {
        renderComponent();
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        await fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });

    test('handles successful login and navigation', async () => {
        mockLoginUser.mockResolvedValue({ access_token: 'fake-token' });
        
        renderComponent();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(AuthService.loginUser).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockLogin).toHaveBeenCalledWith('fake-token');
            expect(mockNavigate).toHaveBeenCalledWith('/');
            expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
        });
    });

    test('displays error message on failed login', async () => {
        mockLoginUser.mockRejectedValue(new Error('Invalid credentials'));

        renderComponent();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
            expect(mockLogin).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
