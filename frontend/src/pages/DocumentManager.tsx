import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '../services/api';

interface Document {
  id: number;
  filename: string;
  upload_date: string;
  status: string;
}

const DocumentManager = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', event.target.files[0]);

      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fetchDocuments();
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const triggerIngestion = async (id: number) => {
    try {
      await api.post(`/documents/${id}/ingest`);
      fetchDocuments();
      // Poll for status update or just refresh manually for now
    } catch (error) {
      console.error("Ingestion failed", error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Document Management (RAG)
      </Typography>
      
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
        sx={{ mb: 3 }}
        disabled={uploading}
      >
        Upload Document
        <input type="file" hidden onChange={handleUpload} />
      </Button>
      
      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      <List>
        {documents.map((doc) => (
          <ListItem key={doc.id} divider>
            <ListItemText 
              primary={doc.filename} 
              secondary={`Uploaded: ${new Date(doc.upload_date).toLocaleDateString()}`} 
            />
            <ListItemSecondaryAction>
              <Chip 
                label={doc.status} 
                color={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'error' : 'default'} 
                sx={{ mr: 2 }}
              />
              {doc.status === 'uploaded' && (
                <IconButton edge="end" aria-label="ingest" onClick={() => triggerIngestion(doc.id)}>
                  <PlayArrowIcon />
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default DocumentManager;
