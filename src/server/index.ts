import express from 'express';
import cors from 'cors';
import { LoggingService } from '../services/LoggingService';

const app = express();
const logger = LoggingService.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/pov', require('./routes/pov'));

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});
