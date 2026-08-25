import cors from "cors";
import express from "express";
import os from "os";
import { authToken } from './middleware/auth.js';
import * as dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import axios from "axios";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { GoogleGenAI, Schema, ThinkingLevel, Type } from "@google/genai";
import multer from "multer";

dotenv.config({path: '../.env'})

const app = express();
const PORT = process.env.PORT ?? 8000;

// Configure Multer for in-memory file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

function fileToGenerativePart(buffer: Buffer, mimeType: string) {
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType
        },
    };
}

const idVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.VITE_COGNITO_USER_POOL_ID ?? "",
    tokenUse: "id",
    clientId: process.env.VITE_COGNITO_CLIENT_ID ?? ""
});

const getCorsOrigins = () => {
    const defaultOrigins = [
        "http://localhost:3000",
        "https://scheduler.absites.xyz",
        "https://us-east-2zwqsbahy3.auth.us-east-2.amazoncognito.com"
    ];
    const frontendEnv = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL;
    if (frontendEnv) {
        if (frontendEnv.startsWith("http://") || frontendEnv.startsWith("https://")) {
            const clean = frontendEnv.endsWith("/") ? frontendEnv.slice(0, -1) : frontendEnv;
            if (!defaultOrigins.includes(clean)) defaultOrigins.push(clean);
        } else {
            const httpUrl = `http://${frontendEnv}`;
            const httpsUrl = `https://${frontendEnv}`;
            if (!defaultOrigins.includes(httpUrl)) defaultOrigins.push(httpUrl);
            if (!defaultOrigins.includes(httpsUrl)) defaultOrigins.push(httpsUrl);
        }
    }
    return defaultOrigins;
};

app.use(cors({
    origin: (origin, callback) => {
        const allowed = getCorsOrigins();
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked origin: ${origin}`));
        }
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/ping", (req, res) => {
    res.json({ status: "ok" });
});

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
            return `http://${raw}`;
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

app.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
        const file = req.file;

        if (!file || !file.buffer || file.buffer.length === 0) {
            return res.status(400).json({ error: "No image file provided in request. Expected multipart form-data field 'image'." });
        }

        if (!file.mimetype.startsWith("image/")) {
            return res.status(400).json({ error: "Invalid file format. Please upload an image file." });
        }

        const resSchema : Schema = {
            type: Type.ARRAY,
            description: "List of scheduled events",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "Name of the event"
                    },
                    days: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        },
                        description: "The days the event happens"
                    },
                    start: {
                        type: Type.STRING,
                        description: "Start time of the event"
                    },
                    end: {
                        type: Type.STRING,
                        description: "End time of the event"
                    },
                    location: {
                        type: Type.STRING,
                        description: "Location of the event"
                    }
                },
                required: ["title", "days", "start", "end", "location"]
            }
        };

        const prompt = "I have given you a picture of a schedule. I want you to extract the details from it and return a structured output as given. Have no repeating course titles. Make sure to remove the 'Room: ' part of the locations. Always extract the end time if possible.";

        const imagePart = fileToGenerativePart(file.buffer, file.mimetype || "image/png");

        const response = await genAI.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [prompt, imagePart],
            config: {
                responseMimeType: "application/json",
                responseSchema: resSchema,
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.LOW
                }
            }
        });

        const text : string = response.text ? response.text : "No response";
        const toSend = JSON.parse(text);

        return res.status(200).json({
            success: true,
            result: toSend
        });

    } catch (err: any) {
        console.error("Gemini API error during image processing:", err);
        return res.status(500).json({
            error: "Failed to process image with Gemini API",
            details: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


