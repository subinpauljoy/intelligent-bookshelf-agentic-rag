import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import api from '../services/api';

const AddBook = () => {
  const { register, handleSubmit, setValue, watch } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/books/', data);
      navigate('/');
    } catch (err) {
      setError('Failed to create book');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    const title = watch('title');
    const author = watch('author');
    if (!title || !author) {
      setError('Please enter title and author to generate summary');
      return;
    }
    
    setAiLoading(true);
    try {
      const prompt = `Title: ${title}, Author: ${author}. Provide a summary for this book.`;
      const response = await api.post('/generate-summary', { body: prompt }); // Assuming backend takes 'body' or raw text
      // Adjust backend to accept {text: ...} as per previous impl
      const res = await api.post('/generate-summary', { text: prompt }); 
      setValue('summary', res.data.summary);
    } catch (err) {
      console.error(err);
      setError('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Add New Book</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
          <TextField
            margin="normal"
            fullWidth
            label="Genre"
            {...register('genre')}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Year Published"
            type="number"
            {...register('year_published')}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Summary"
            multiline
            rows={4}
            {...register('summary')}
          />
          <Button 
            variant="outlined" 
            onClick={generateSummary} 
            disabled={aiLoading}
            sx={{ mt: 1, mb: 2 }}
          >
            {aiLoading ? <CircularProgress size={24} /> : 'Generate Summary with AI'}
          </Button>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
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
