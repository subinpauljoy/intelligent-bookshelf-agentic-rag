import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, List, ListItem, Divider, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api';

interface Message {
  role: 'user' | 'bot';
  content: string;
  sources?: string[];
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/documents/chat', { question: input });
      const botMsg: Message = { 
        role: 'bot', 
        content: response.data.answer,
        sources: response.data.sources 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        RAG Q&A Chat
      </Typography>
      
      <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'auto', p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                color: msg.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography variant="body1">{msg.content}</Typography>
              {msg.sources && msg.sources.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" display="block">Sources:</Typography>
                  {msg.sources.map((src, i) => (
                    <Chip key={i} label={src} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5, borderColor: 'grey.500', color: 'inherit' }} />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        ))}
        {loading && <Typography variant="caption" sx={{ alignSelf: 'flex-start', ml: 2 }}>Thinking...</Typography>}
        <div ref={messagesEndRef} />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField 
          fullWidth 
          placeholder="Ask a question about your documents..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button variant="contained" onClick={handleSend} disabled={loading} endIcon={<SendIcon />}>
          Send
        </Button>
      </Box>
    </Container>
  );
};

export default ChatInterface;
