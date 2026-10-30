import express from 'express';
import cors from 'cors';
import { getUser } from './state.js';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';

export function startServer(port) {
    const app = express();
    app.use(cors()); // lets websites on any domain call your API
    const limiter = rateLimit({
        windowMs: config.rateWindow * 1000,
        limit: config.rateLimit,
        standardHeaders: 'draft-7', // sends RateLimit-* headers so clients can see their limit
        legacyHeaders: false,
        handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: {
            code: 'rate_limited',
            message: 'Too many requests, slow down.',
            },
        });
        },
    });
    app.use('/v1', limiter);
    const examplesDir = fileURLToPath(new URL('../examples/', import.meta.url));
    app.use('/demo', express.static(examplesDir, { index: 'demo.html' }));

    app.get('/', (req, res) => {
        res.json({ success: true, message: 'API is running' });
    });

    app.get('/v1/users/:id', (req, res) => {
        const data = getUser(req.params.id);

        if (!data) {
        return res.status(404).json({
            success: false,
            error: {
            code: 'user_not_monitored',
            message: 'This user is not being monitored.',
            },
        });
        }

        res.json({ success: true, data });
    });

    return new Promise((resolve) => {
        const server = app.listen(port, () => {
        console.log(`API listening on http://localhost:${port}`);
        resolve(server);
        });
    });
}