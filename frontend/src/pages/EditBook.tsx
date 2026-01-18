import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, CircularProgress, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import api from '../services/api';
import { POPULAR_GENRES } from '../utils/constants';

const EditBook = () => {
  const { id } = useParams();
  const { register, handleSubmit, setValue, watch } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        const book = response.data;
        setValue('title', book.title);
        setValue('author', book.author);
        setValue('genre', book.genre);
        setValue('year_published', book.year_published);
        setValue('summary', book.summary);
      } catch (err) {
        setError('Failed to fetch book details');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, setValue]);

  const onSubmit = async (data: any) => {
    setSaveLoading(true);
    try {
      await api.put(`/books/${id}`, data);
      navigate(`/books/${id}`);
    } catch (err) {
      setError('Failed to update book');
    } finally {
      setSaveLoading(false);
    }
  };

  const generateSummary = async () => {
    setAiLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await api.post('/ai/generate-summary', { book_id: parseInt(id!) }); 
      
      if (res.data.error) {
          setInfo(res.data.error);
      } else {
          setValue('summary', res.data.summary);
      }
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', m: 'auto', mt: 4 }} />;

  const summaryValue = watch('summary');
  const genreValue = watch('genre');

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Edit Book</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>{info}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField margin="normal" required fullWidth label="Title" {...register('title')} InputLabelProps={{ shrink: true }} />
          <TextField margin="normal" required fullWidth label="Author" {...register('author')} InputLabelProps={{ shrink: true }} />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="genre-label" shrink>Genre</InputLabel>
            <Select
              labelId="genre-label"
              id="genre"
              label="Genre"
              value={genreValue || ''}
              {...register('genre', { required: true })}
              onChange={(e) => setValue('genre', e.target.value)}
            >
              {POPULAR_GENRES.map((genre) => (
                <MenuItem key={genre} value={genre}>
                  {genre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField margin="normal" fullWidth label="Year Published" type="number" {...register('year_published')} InputLabelProps={{ shrink: true }} />
          <TextField 
            margin="normal" 
            fullWidth 
            label="Summary" 
            multiline 
            rows={6} 
            {...register('summary')} 
            InputLabelProps={{ shrink: !!summaryValue }}
          />
          
          <Button 
            variant="outlined" 
            onClick={generateSummary} 
            disabled={aiLoading} 
            sx={{ mt: 1, mb: 2 }}
            startIcon={<InfoIcon />}
          >
            {aiLoading ? <CircularProgress size={24} /> : 'Generate Summary from Ingested Doc'}
          </Button>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button type="submit" fullWidth variant="contained" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Update Book'}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default EditBook;
