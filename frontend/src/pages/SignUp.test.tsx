import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import SignUp from './SignUp';
import * as AuthService from '../services/auth';

// Mocks
vi.mock('../services/auth');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useNavigate: vi.fn(),
        Link: (props: any) => <a {...props} href={props.to}>{props.children}</a>
    };
});

describe('SignUp Page', () => {
    let mockNavigate: vi.Mock;
    let mockRegisterUser: vi.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        mockRegisterUser = vi.fn();
        
        // Mock the implementation of the hooks and services
        (useNavigate as vi.Mock).mockReturnValue(mockNavigate);
        (AuthService.registerUser as vi.Mock) = mockRegisterUser;
    });

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
    };

    test('renders sign-up form correctly', () => {
        renderComponent();
        expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /already have an account\? sign in/i })).toBeInTheDocument();
    });

    test('allows user to enter email and password', async () => {
        renderComponent();
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        await fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        await fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

        expect(emailInput).toHaveValue('newuser@example.com');
        expect(passwordInput).toHaveValue('newpassword123');
    });

    test('handles successful registration and navigation', async () => {
        mockRegisterUser.mockResolvedValue({ id: 1, email: 'newuser@example.com', is_active: true, is_superuser: false });
        
        renderComponent();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(AuthService.registerUser).toHaveBeenCalledWith({ email: 'newuser@example.com', password: 'newpassword123' });
            expect(mockNavigate).toHaveBeenCalledWith('/login');
            expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
        });
    });

    test('displays error message on failed registration', async () => {
        mockRegisterUser.mockRejectedValue(new Error('Email already exists'));

        renderComponent();

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole('button', { name: /sign up/i });

        fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
