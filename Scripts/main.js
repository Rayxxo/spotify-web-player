import { CLIENT_ID, REDIRECT_UREI } from './config.js';
import { generateRandomString, sha256in, base64encode } from './pkce.js';


// Main function to initiate PKCE OAuth2 flow
async function main() {
    // Step 1: Generate code verifier and challenge
    const verifier = generateRandomString(64);
    const hashed = await sha256in(verifier);
    const challenge = base64encode(hashed);

    console.log("Verifier:", verifier);
    console.log("Challenge:", challenge);
    
    // Step 2: Construct authorization URL. This is Spotify specific.
    const clientId = CLIENT_ID;
    const redirecturi = REDIRECT_UREI;
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const scope = "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";


    // Step 3: Store the verifier for later use and redirect to Spotify authorization endpoint
    window.localStorage.setItem('code_verifier', verifier);

    // This the parameters required by Spotify for PKCE OAuth2
    const params = {
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        redirect_uri: redirecturi,
    };


    // This specific methods will convert the params object into query string and append to URL

    /*
    The final URL will look something like this:
    https://accounts.spotify.com/authorize?response_type=code&client_id=YOUR_CLIENT_ID&scope=YOUR_SCOPES&code_challenge_method=S256&code_challenge=YOUR_CODE_CHALLENGE&redirect_uri=YOUR_REDIRECT_URI
    */

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

main();



