import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Divider, Rating, TextField, Button, 
  List, ListItem, ListItemText, Alert, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Review {
  id: number;
  review_text: string;
  rating: number;
  user_id: number;
  user?: {
    email: string;
  };
}

interface BookSummary {
  summary: string;
  review_summary: string;
  average_rating: number;
}

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<BookSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ review_text: '', rating: 5 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);

  const userReview = user ? reviews.find(r => r.user_id === user.id) : null;

  useEffect(() => {
    fetchBookData();
  }, [id]);

  const fetchBookData = async () => {
    try {
      const bookRes = await api.get(`/books/${id}`);
      setBook(bookRes.data);
      
      const summaryRes = await api.get(`/books/${id}/summary`);
      setAiSummary(summaryRes.data);
      
      const reviewsRes = await api.get(`/reviews/book/${id}`);
      setReviews(reviewsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      await api.post(`/reviews/book/${id}`, newReview);
      setNewReview({ review_text: '', rating: 5 });
      fetchBookData(); // Refresh to update AI summary
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (reviewId: number) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (reviewToDelete === null) return;
    
    try {
      await api.delete(`/reviews/${reviewToDelete}`);
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      fetchBookData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete review');
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
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
        
        {userReview ? (
             <Alert severity="info" sx={{ mb: 3 }}>
                You have already reviewed this book.
             </Alert>
        ) : (
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
              <Button variant="contained" onClick={handleSubmitReview} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Paper>
        )}

        <List>
          {reviews.map((review) => (
            <ListItem key={review.id} divider
              secondaryAction={
                user && (user.is_superuser || user.id === review.user_id) && (
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(review.id)}>
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                       - {review.user?.email || 'Unknown User'}
                    </Typography>
                  </Box>
                }
                secondary={review.review_text}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Review?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this review? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookDetail;