import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BookList from './BookList';
import api from '../services/api';

// Mocks
vi.mock('../services/api');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        Link: (props: any) => <a {...props} href={props.to}>{props.children}</a>,
    };
});

const mockBooks = [
    { id: 1, title: 'Book 1', author: 'Author 1', genre: 'Genre 1', summary: 'Summary 1' },
    { id: 2, title: 'Book 2', author: 'Author 2', genre: 'Genre 2', summary: 'Summary 2' },
];

describe('BookList Page', () => {
    let getMock: vi.Mock;
    let deleteMock: vi.Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        getMock = vi.fn();
        deleteMock = vi.fn();
        (api.get as vi.Mock) = getMock;
        (api.delete as vi.Mock) = deleteMock;
    });

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <BookList />
            </BrowserRouter>
        );
    };

    test('renders book library title', async () => {
        getMock.mockResolvedValue({ data: [] });
        renderComponent();
        expect(screen.getByRole('heading', { name: /book library/i })).toBeInTheDocument();
        await waitFor(() => expect(getMock).toHaveBeenCalledWith('/books/'));
    });
    
    test('displays message when no books are available', async () => {
        getMock.mockResolvedValue({ data: [] });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/no books to show/i)).toBeInTheDocument();
        });
    });

    test('renders a list of books successfully', async () => {
        getMock.mockResolvedValue({ data: mockBooks });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Book 1')).toBeInTheDocument();
            expect(screen.getByText('Book 2')).toBeInTheDocument();
        });
    });
    
    test('handles API error on fetch', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        getMock.mockRejectedValue(new Error('Failed to fetch'));
        renderComponent();

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching books:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    test('opens delete confirmation dialog on delete click', async () => {
        getMock.mockResolvedValue({ data: mockBooks });
        renderComponent();
        
        await waitFor(() => {
            expect(screen.getByText('Book 1')).toBeInTheDocument();
        });
        
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText(/delete book\?/i)).toBeInTheDocument();
        });
    });

    test('closes delete dialog on cancel', async () => {
        getMock.mockResolvedValue({ data: mockBooks });
        renderComponent();
        
        await waitFor(() => {
            expect(screen.getByText('Book 1')).toBeInTheDocument();
        });
        
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    test('calls delete API and refetches on confirm', async () => {
        getMock.mockResolvedValue({ data: mockBooks });
        deleteMock.mockResolvedValue({});
        
        renderComponent();
        
        await waitFor(() => {
            expect(screen.getByText('Book 1')).toBeInTheDocument();
        });
        
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
        
        const confirmDeleteButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmDeleteButton);

        await waitFor(() => {
            expect(deleteMock).toHaveBeenCalledWith('/books/1');
            expect(getMock).toHaveBeenCalledTimes(2); // Initial fetch + refetch
        });
    });
});
