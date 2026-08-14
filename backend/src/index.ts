import cors from "cors";
import express from "express";
import os from "os";
import { authToken } from './middleware/auth.js';
import * as dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import axios from "axios";
import { CognitoJwtVerifier } from "aws-jwt-verify";

dotenv.config({path: '../.env'})

const app = express();
const PORT = process.env.PORT ?? 8000;

const idVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.VITE_COGNITO_USER_POOL_ID ?? "",
    tokenUse: "id",
    clientId: process.env.VITE_COGNITO_CLIENT_ID ?? ""
});

app.use(cors({
    origin: ["http://localhost:3000", "https://scheduler.absites.xyz", "https://us-east-2zwqsbahy3.auth.us-east-2.amazoncognito.com"],
    credentials: true
}));
app.use(cookieParser())
app.use(express.json());


app.get("/api/health", authToken, (req, res) => {

    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: uptimeSeconds,
        process: {
            pid: process.pid,
            nodeVersion: process.version,
            memory: {
                rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
                heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
                heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
            },
        },
        system: {
            platform: process.platform,
            arch: process.arch,
            freememMB: (os.freemem() / (1024 * 1024)).toFixed(2),
            totalmemMB: (os.totalmem() / (1024 * 1024)).toFixed(2),
            cpus: os.cpus().length,
            loadavg: os.loadavg(),
        },
    });
});


app.post("/api/login", async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).send('Authorization code missing');
    }

    try {
        const authHeader = Buffer.from(
            `${process.env.VITE_COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`
        ).toString('base64');


        const cid :string = process.env.VITE_COGNITO_CLIENT_ID ? process.env.VITE_COGNITO_CLIENT_ID  : "";
        const codeParam = typeof code === 'string' ? code : String(code || '');

        const getFrontendUrl = () => {
            const raw = process.env.VITE_FRONTEND_URL || 'localhost:3000';
            if (raw.startsWith('http://') || raw.startsWith('https://')) {
                return raw.endsWith('/') ? raw.slice(0, -1) : raw;
            }
            const isProd = process.env.NODE_ENV === 'production';
            return isProd ? `https://${raw}` : `http://${raw}`;
        };

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: cid,
            code: codeParam,
            redirect_uri: `${getFrontendUrl()}/login`
        });

        const response = await axios.post(
            `https://${process.env.VITE_COGNITO_DOMAIN}/oauth2/token`,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${authHeader}`,
                },
            }
        );

        const tokens = response.data;

        // Set tokens in HttpOnly cookies
        res.cookie('access_token', tokens.access_token, {
            httpOnly: true,
            secure: false, // Set to true in production (HTTPS)
            sameSite: 'lax',
            maxAge: tokens.expires_in * 1000,
        });

        res.cookie('id_token', tokens.id_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: tokens.expires_in * 1000,
        });

        res.status(200).send("Authentication success");
    } catch(err) {
        console.error('OAuth Callback Error:', err);
        res.status(500).send('Authentication failed');
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('id_token');
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

app.get("/api/validate", async (req, res) => {
    const idToken = req.cookies.id_token;
    
    if (!idToken) {
        return res.status(401).json({ authenticated: false });
    }

    try {
        const payload = await idVerifier.verify(idToken);
        res.json({ authenticated: true, user: payload });
    } catch (err) {
        console.error("Token verification error:", err);
        res.status(401).json({ authenticated: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


