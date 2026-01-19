import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BookDetail from './BookDetail';
import * as AuthContextModule from '../context/AuthContext';
import api from '../services/api';

// Mocks
vi.mock('../services/api');
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual as any,
        useParams: () => ({ id: '1' }),
    };
});

const mockBook = {
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Fiction',
    summary: 'A great book.',
};
const mockAiSummary = {
    summary: 'An amazing book about testing.',
    review_summary: 'Readers loved it.',
    average_rating: 4.5,
};
const mockReviews = [
    { id: 1, review_text: 'Great read!', rating: 5, user_id: 2, user: { email: 'user2@example.com' } },
    { id: 2, review_text: 'Not bad.', rating: 3, user_id: 3, user: { email: 'user3@example.com' } },
];
const mockUser = { id: 1, email: 'user1@example.com', is_superuser: false };

describe('BookDetail Page', () => {
    let getMock: vi.Mock;
    let postMock: vi.Mock;
    let deleteMock: vi.Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        getMock = vi.fn();
        postMock = vi.fn();
        deleteMock = vi.fn();
        (api.get as vi.Mock) = getMock;
        (api.post as vi.Mock) = postMock;
        (api.delete as vi.Mock) = deleteMock;

        (AuthContextModule.useAuth as vi.Mock).mockReturnValue({ user: mockUser });

        // Mock the multiple API calls in useEffect
        getMock
            .mockResolvedValueOnce({ data: mockBook }) // Book details
            .mockResolvedValueOnce({ data: mockAiSummary }) // Summary
            .mockResolvedValueOnce({ data: mockReviews }); // Reviews
    });

    const renderComponent = () => {
        render(
            <BrowserRouter>
                <BookDetail />
            </BrowserRouter>
        );
    };

    test('renders loading state initially', async () => {
        getMock.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100)));
        renderComponent();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
    });

    test('fetches and displays book details and reviews', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Book')).toBeInTheDocument();
            expect(screen.getByText(/by Test Author/i)).toBeInTheDocument();
            expect(screen.getByText('Readers loved it.')).toBeInTheDocument();
            expect(screen.getByText('Great read!')).toBeInTheDocument();
        });
    });

    test('allows a user to submit a review', async () => {
        renderComponent();
        
        const reviewInput = await screen.findByLabelText(/what did you think of this book\?/i);
        const submitButton = await screen.findByRole('button', { name: /submit review/i });
        const ratingInput = await screen.findByRole('radio', { name: "5 Stars" });
        
        await fireEvent.change(reviewInput, { target: { value: 'Awesome book!' } });
        await fireEvent.click(ratingInput);
        
        postMock.mockResolvedValueOnce({});
        getMock
            .mockResolvedValueOnce({ data: mockBook })
            .mockResolvedValueOnce({ data: mockAiSummary })
            .mockResolvedValueOnce({ data: [...mockReviews, { id: 3, review_text: 'Awesome book!', rating: 5, user_id: 1, user: {email: 'user1@example.com'} }] });

        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(postMock).toHaveBeenCalledWith('/reviews/book/1', {
            review_text: 'Awesome book!',
            rating: 5,
        });
        expect(await screen.findByText(/you have already reviewed this book/i)).toBeInTheDocument();
    });

    test('allows a user to delete their own review', async () => {
        const reviewsWithUserReview = [...mockReviews, { id: 3, review_text: 'My review', rating: 4, user_id: mockUser.id, user: {email: mockUser.email} }];
        getMock.mockReset()
            .mockResolvedValueOnce({ data: mockBook })
            .mockResolvedValueOnce({ data: mockAiSummary })
            .mockResolvedValueOnce({ data: reviewsWithUserReview });
            
        renderComponent();

        const deleteButton = (await screen.findAllByRole('button', { name: /delete/i }))[0];
        fireEvent.click(deleteButton);
        
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        deleteMock.mockResolvedValue({});
        getMock.mockReset()
            .mockResolvedValueOnce({ data: mockBook })
            .mockResolvedValueOnce({ data: mockAiSummary })
            .mockResolvedValueOnce({ data: mockReviews });

        const confirmDelete = screen.getByRole('button', { name: /delete/i });
        
        await act(async () => {
            fireEvent.click(confirmDelete);
        });

        await waitFor(() => {
            expect(deleteMock).toHaveBeenCalledWith('/reviews/3');
            expect(screen.queryByText('My review')).not.toBeInTheDocument();
        });
    });
});
