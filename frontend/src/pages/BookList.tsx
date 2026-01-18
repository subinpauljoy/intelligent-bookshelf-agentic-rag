import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Fab } from '@mui/material';
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Book Library
      </Typography>
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid item xs={12} sm={6} md={4} key={book.id}>
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
                <Button size="small">Edit</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 16, right: 16 }} component={Link} to="/books/new">
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default BookList;
