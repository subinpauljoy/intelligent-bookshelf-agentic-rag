import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, Divider, Chip, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from '../services/api';

interface Message {
  role: 'user' | 'bot';
  content: string;
  sources?: string[];
}

const EXAMPLE_QUERIES = [
    "List some fantasy books",
    "Tell me about the book 'The Hobbit'",
    "Who is the author of the most recent books?",
    "Summarize the main themes of our library"
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
      { role: 'bot', content: "Hello! I'm your Intelligent Book Assistant. I can help you find books by genre or author, summarize their contents, and answer specific questions from our library. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (text: string = input) => {
    const queryText = text || input;
    if (!queryText.trim()) return;

    const userMsg: Message = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/documents/chat', { question: queryText });
      const botMsg: Message = { 
        role: 'bot', 
        content: response.data.answer,
        sources: response.data.sources 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AutoAwesomeIcon color="primary" /> RAG Assistant
      </Typography>
      
      <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'auto', p: 3, mb: 2, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 3 }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 2, 
                borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                color: msg.role === 'user' ? 'white' : 'text.primary'
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
              {msg.sources && msg.sources.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Divider sx={{ my: 1, bgcolor: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} />
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>Sources:</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {msg.sources.map((src, i) => (
                        <Chip key={i} label={src} size="small" variant="outlined" sx={{ fontSize: '0.65rem', color: 'inherit', borderColor: 'inherit' }} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>
        ))}
        {loading && <Typography variant="caption" sx={{ alignSelf: 'flex-start', ml: 2, fontStyle: 'italic' }}>Thinking...</Typography>}
        <div ref={messagesEndRef} />
      </Paper>

      {messages.length < 3 && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
              {EXAMPLE_QUERIES.map(q => (
                  <Chip key={q} label={q} onClick={() => handleSend(q)} clickable variant="outlined" size="small" color="primary" />
              ))}
          </Stack>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField 
          fullWidth 
          variant="outlined"
          placeholder="Ask a question about books..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
        />
        <Button variant="contained" onClick={() => handleSend()} disabled={loading} sx={{ borderRadius: 4, px: 3 }}>
          <SendIcon />
        </Button>
      </Box>
    </Container>
  );
};

export default ChatInterface;
