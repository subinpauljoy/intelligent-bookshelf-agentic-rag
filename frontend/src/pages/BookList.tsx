import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Fab, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  summary: string;
}

const BookList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setBookToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (bookToDelete) {
      try {
        await api.delete(`/books/${bookToDelete}`);
        fetchBooks();
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete book. Please try again.");
      } finally {
        handleCloseDialog();
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Book Library
      </Typography>
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {book.title}
                </Typography>
                <Typography>
                  Author: {book.author}
                </Typography>
                <Typography color="text.secondary">
                  Genre: {book.genre}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {book.summary ? book.summary.substring(0, 100) + '...' : 'No summary available.'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to={`/books/${book.id}`}>View</Button>
                <Button size="small" component={Link} to={`/books/${book.id}/edit`}>Edit</Button>
                <Button size="small" color="error" onClick={() => handleDeleteClick(book.id)}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {books.length === 0 && (
            <Grid size={12}>
                <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4, border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <Typography variant="h6" color="text.secondary">No books to show.</Typography>
                    <Typography variant="body1" color="text.secondary">Click the <b>+</b> icon in the bottom right to add your first book!</Typography>
                </Paper>
            </Grid>
        )}
      </Grid>
      
      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 16, right: 16 }} component={Link} to="/books/new">
        <AddIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {"Delete Book?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this book? This action is irreversible and will also delete all associated reviews and documents.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookList;