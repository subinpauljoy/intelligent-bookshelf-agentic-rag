import { useEffect, useState } from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, LinearProgress, FormControl, InputLabel, Select, MenuItem, Paper, Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

interface Document {
  id: number;
  filename: string;
  upload_date: string;
  status: string;
  book_id?: number;
}

interface Book {
  id: number;
  title: string;
}

const DocumentManager = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | string>('');
  const [uploading, setUploading] = useState(false);
  const [ingestingIds, setIngestingIds] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchBooks();
  }, []);

  // Poll for updates if any document is processing
  useEffect(() => {
    const hasProcessing = documents.some(doc => doc.status === 'processing');
    let interval: number | undefined;

    if (hasProcessing) {
        interval = window.setInterval(() => {
            fetchDocuments();
        }, 3000);
    }

    return () => clearInterval(interval);
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books/');
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', event.target.files[0]);
      if (selectedBookId) {
          formData.append('book_id', selectedBookId.toString());
      }

      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchDocuments();
        setSelectedBookId('');
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const triggerIngestion = async (id: number) => {
    setIngestingIds(prev => new Set(prev).add(id));
    try {
      await api.post(`/documents/${id}/ingest`);
      fetchDocuments();
    } catch (error) {
      console.error("Ingestion failed", error);
    } finally {
      setIngestingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = (id: number) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
        try {
            await api.delete(`/documents/${documentToDelete}`);
            fetchDocuments();
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            handleCancelDelete();
        }
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Document Ingestion Hub
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Upload New Document</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Link to Book (Optional)</InputLabel>
                <Select
                    value={selectedBookId}
                    label="Link to Book (Optional)"
                    onChange={(e) => setSelectedBookId(e.target.value)}
                >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {books.map(b => (
                        <MenuItem key={b.id} value={b.id}>{b.title}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
            >
                {uploading ? 'Uploading...' : 'Select File & Upload'}
                <input type="file" hidden onChange={handleUpload} />
            </Button>
          </Box>
          {uploading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      <Typography variant="h6" gutterBottom>Recent Uploads</Typography>
      <List>
        {documents.map((doc) => (
          <ListItem key={doc.id} divider sx={{ px: 0 }}>
            <ListItemText 
              primary={doc.filename} 
              secondary={
                <>
                    {`Uploaded: ${new Date(doc.upload_date).toLocaleDateString()}`}
                    {doc.book_id && <Chip label={`Linked to ID: ${doc.book_id}`} size="small" sx={{ ml: 1, height: 20 }} />}
                </>
              } 
            />
            <ListItemSecondaryAction>
              <Chip 
                label={doc.status} 
                size="small"
                color={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'error' : 'default'} 
                sx={{ mr: 2 }}
              />
              {(ingestingIds.has(doc.id) || doc.status === 'processing') ? (
                <CircularProgress size={24} sx={{ mr: 1, verticalAlign: 'middle' }} />
              ) : (
                 doc.status === 'uploaded' ? (
                    <IconButton edge="end" aria-label="ingest" onClick={() => triggerIngestion(doc.id)} color="primary">
                      <PlayArrowIcon />
                    </IconButton>
                 ) : null
              )}
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(doc.id)} color="error" sx={{ ml: 1 }}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          {"Delete Document?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentManager;