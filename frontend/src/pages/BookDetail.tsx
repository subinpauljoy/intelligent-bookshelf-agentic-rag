import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, Divider, Rating, TextField, Button, List, ListItem, ListItemText, Alert } from '@mui/material';
import api from '../services/api';

interface Review {
  id: number;
  review_text: string;
  rating: number;
  user_id: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  year_published: number;
  summary: string;
}

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ review_text: '', rating: 5 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookData();
  }, [id]);

  const fetchBookData = async () => {
    try {
      const bookRes = await api.get(`/books/${id}`);
      setBook(bookRes.data);
      const reviewsRes = await api.get(`/books/${id}/reviews`);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.post(`/books/${id}/reviews`, newReview);
      setNewReview({ review_text: '', rating: 5 });
      fetchBookData();
    } catch (err) {
      setError('Failed to post review');
    }
  };

  if (!book) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>{book.title}</Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>by {book.author}</Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body1"><strong>Genre:</strong> {book.genre}</Typography>
            <Typography variant="body1"><strong>Year:</strong> {book.year_published}</Typography>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>Summary</Typography>
        <Typography variant="body1" paragraph>{book.summary}</Typography>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Reviews</Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add a Review</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Rating 
            value={newReview.rating} 
            onChange={(_, val) => setNewReview({...newReview, rating: val || 5})} 
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Write your review..."
            value={newReview.review_text}
            onChange={(e) => setNewReview({...newReview, review_text: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSubmitReview}>Submit Review</Button>
        </Paper>

        <List>
          {reviews.map((review) => (
            <ListItem key={review.id} divider>
              <ListItemText 
                primary={<Rating value={review.rating} readOnly size="small" />}
                secondary={review.review_text}
              />
            </ListItem>
          ))}
          {reviews.length === 0 && <Typography color="text.secondary">No reviews yet.</Typography>}
        </List>
      </Box>
    </Container>
  );
};

export default BookDetail;
