import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Initialize routers
import authRouter from './routers/auth';
import dashboardRouter from './routers/dashboard';
import complaintsRouter from './routers/complaints';
import transactionsRouter from './routers/transactions';
import predictionsRouter from './routers/predictions';
import alertsRouter from './routers/alerts';
import investigationsRouter from './routers/investigations';
import reportsRouter from './routers/reports';
import auditLogsRouter from './routers/auditLogs';
import usersRouter from './routers/users';
import scenarioRouter from './routers/scenario';

const app = express();
const server = http.createServer(app);

// Configure WebSockets
let io: Server | null = null;
export const getSocketIO = () => io;

const port = process.env.PORT || 8000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'CYBERINTEL Core API Server' });
});

// Register REST API Routers
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/investigations', investigationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/scenario', scenarioRouter);

// Serve built frontend assets in production mode
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// Catch-all route to redirect back to SPA React Router index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Configure Socket.IO
io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`WebSocket client connection established: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`CYBERINTEL Server listening securely on port ${port}`);
});
