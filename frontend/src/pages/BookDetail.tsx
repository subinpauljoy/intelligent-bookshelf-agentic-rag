import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper, Divider, Rating, TextField, Button, List, ListItem, ListItemText, Alert, Chip, CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from '../services/api';

interface Review {
  id: number;
  review_text: string;
  rating: number;
}

interface BookSummary {
  summary: string;
  review_summary: string;
  average_rating: number;
}

const BookDetail = () => {
  const { id } = useParams();
  const [book, setBook] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<BookSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ review_text: '', rating: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookData();
  }, [id]);

  const fetchBookData = async () => {
    try {
      const bookRes = await api.get(`/books/${id}`);
      setBook(bookRes.data);
      
      const summaryRes = await api.get(`/books/${id}/summary`);
      setAiSummary(summaryRes.data);
      
      const reviewsRes = await api.get(`/books/${id}/reviews`);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await api.post(`/books/${id}/reviews`, newReview);
      setNewReview({ review_text: '', rating: 5 });
      fetchBookData(); // Refresh to update AI summary
    } catch (err) {
      setError('Failed to post review');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', m: 'auto', mt: 4 }} />;
  if (!book) return <Typography>Book not found</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h3" gutterBottom>{book.title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h5" color="text.secondary">by {book.author}</Typography>
            <Chip label={book.genre} size="small" variant="outlined" />
            <Rating value={aiSummary?.average_rating || 0} readOnly precision={0.5} />
        </Box>
        
        <Divider sx={{ my: 3 }} />

        {aiSummary?.review_summary && (
            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 2, mb: 3, color: 'info.contrastText' }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon fontSize="small" /> AI Review Analysis
                </Typography>
                <Typography variant="body2">{aiSummary.review_summary}</Typography>
            </Box>
        )}

        <Typography variant="h6" gutterBottom>Official Summary</Typography>
        <Typography variant="body1" paragraph>{aiSummary?.summary || book.summary}</Typography>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Reader Reviews</Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add your review</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Rating 
            value={newReview.rating} 
            onChange={(_, val) => setNewReview({...newReview, rating: val || 5})} 
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="What did you think of this book?"
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
        </List>
      </Box>
    </Container>
  );
};

export default BookDetail;