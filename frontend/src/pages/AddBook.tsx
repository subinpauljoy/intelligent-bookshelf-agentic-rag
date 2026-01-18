import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import api from '../services/api';
import { POPULAR_GENRES, PUBLICATION_YEARS } from '../utils/constants';

const AddBook = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/books/', data);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create book';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Add New Book</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
            <InfoIcon color="info" />
            <Typography variant="body2">
                <strong>Tip:</strong> You can leave the summary blank for now. Once you upload and ingest the book's document in the "Documents" section, an AI summary will be generated automatically.
            </Typography>
        </Paper>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Title"
            {...register('title')}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Author"
            {...register('author')}
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="genre-label">Genre</InputLabel>
            <Select
              labelId="genre-label"
              id="genre"
              label="Genre"
              defaultValue=""
              {...register('genre', { required: true })}
            >
              {POPULAR_GENRES.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="year-label">Year Published</InputLabel>
            <Select
              labelId="year-label"
              id="year_published"
              label="Year Published"
              defaultValue={new Date().getFullYear().toString()}
              {...register('year_published')}
            >
              {PUBLICATION_YEARS.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="normal"
            fullWidth
            label="Summary (Optional)"
            multiline
            rows={4}
            {...register('summary')}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Book'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default AddBook;
