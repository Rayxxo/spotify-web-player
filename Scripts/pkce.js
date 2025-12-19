
// PKCE is a security extension to OAuth 2.0 for public clients on mobile devices and single-page applications.
// It enhances security by requiring a dynamically generated code verifier and code challenge during the authorization process.

// Generates a random string to be used as the code verifier. Think of code verifier as a key to your padlock.
export function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const charactersLength = characters.length;
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Hashes the code verifier using SHA-256 algorithm. This is like locking your padlock.
export async function sha256in(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

// Encodes the hashed code verifier into a URL-safe base64 string. This is your code challenge, which you send to the authorization server.
export function base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}



