import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as dotenv from "dotenv";

dotenv.config({path: '../.env'})

const uipd : string = process.env.COGNITO_USER_POOL_ID ? process.env.COGNITO_USER_POOL_ID : "";
const cid : string = process.env.COGNITO_CLIENT_ID ? process.env.COGNITO_CLIENT_ID : "";

console.log(uipd);

const verifier = CognitoJwtVerifier.create({
    userPoolId: uipd,
    tokenUse: "access",
    clientId: cid
});

export async function authToken(req: any, res: any, next: any) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({ error: 'Access token missing' });
    }

    try {
        const payload = await verifier.verify(token);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}