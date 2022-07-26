import crypto from "crypto";

function createString(length: number) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;

    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));

    return result;
}

const algorithm = 'aes-256-ctr';
export const iv = crypto.randomBytes(16);
export const secretKey = createString(32);

export function encrypt(text: string) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    return Buffer.concat([
        cipher.update(text),
        cipher.final()
    ]).toString("hex");
}

export function decrypt(text: string) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    return Buffer.concat([
        decipher.update(Buffer.from(text, 'hex')), 
        decipher.final()
    ]).toString();
}