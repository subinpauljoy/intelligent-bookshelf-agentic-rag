import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
}

const Recommendations = () => {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const response = await api.get('/books/recommendations');
        setBooks(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecs();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Recommended For You</Typography>
      <Typography variant="body1" sx={{ mb: 4 }} color="text.secondary">
        Based on your interests and high-rated genres.
      </Typography>
      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{book.title}</Typography>
                <Typography color="text.secondary">{book.author}</Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>{book.genre}</Typography>
                <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }} 
                    size="small" 
                    component={Link} 
                    to={`/books/${book.id}`}
                >
                    View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {books.length === 0 && (
          <Typography sx={{ mt: 4 }}>Review some books to get personalized recommendations!</Typography>
      )}
    </Container>
  );
};

export default Recommendations;
