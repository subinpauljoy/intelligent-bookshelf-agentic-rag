import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Alert, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import InfoIcon from '@mui/icons-material/Info';
import api from '../services/api';
import { POPULAR_GENRES } from '../utils/constants';

const AddBook = () => {
  const { register, handleSubmit, control } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    
    // Transform dayjs object to year number
    const payload = {
        ...data,
        year_published: data.year_published ? data.year_published.year() : new Date().getFullYear()
    };

    try {
      await api.post('/books/', payload);
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

          <Controller
            name="year_published"
            control={control}
            defaultValue={dayjs()}
            render={({ field }) => (
              <DatePicker
                {...field}
                label="Year Published"
                views={['year']}
                sx={{ width: '100%', mt: 2, mb: 1 }}
                slotProps={{ textField: { required: true } }}
                onChange={(date) => field.onChange(date)}
              />
            )}
          />

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
