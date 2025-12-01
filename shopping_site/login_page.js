import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    setDoc, 
    doc, 
    collection 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, db, auth;
const RETRY_MAX_ATTEMPTS = 5;

function showCustomModal(message) {
    document.getElementById('modal-text').textContent = message;
    document.getElementById('custom-modal').style.display = 'flex';
}

function showMessage(type, message) {
    const msgBox = document.getElementById('message-box');
    msgBox.textContent = message;
    msgBox.className = `message-box ${type}`;
    msgBox.style.display = 'block';
    setTimeout(() => {
        msgBox.style.display = 'none';
    }, 5000);
}

function setButtonsDisabled(disabled) {
    document.getElementById('login-btn').disabled = disabled;
    document.getElementById('signup-btn').disabled = disabled;
}

async function retryOperation(operation, ...args) {
    for (let i = 0; i < RETRY_MAX_ATTEMPTS; i++) {
        try {
            return await operation(...args);
        } catch (error) {
            if (i === RETRY_MAX_ATTEMPTS - 1) {
                console.error("Firebase operation failed after multiple retries:", error);
                throw error; 
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function initializeFirebase() {
    if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing.");
        document.getElementById('auth-bar').textContent = `Auth Error: Firebase Config Missing.`;
        return;
    }

    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        if (initialAuthToken) {
            await retryOperation(signInWithCustomToken, auth, initialAuthToken);
        } else {
            await retryOperation(signInAnonymously, auth);
        }

        onAuthStateChanged(auth, (user) => {
            updateUI(user);
        });

    } catch (error) {
        console.error("Error initializing Firebase or signing in:", error);
        document.getElementById('auth-bar').textContent = `Auth Error: ${error.code}`;
        showMessage('error', `Initialization failed: ${error.message}`);
    }
}

function updateUI(user) {
    const authBar = document.getElementById('auth-bar');
    const authFormContainer = document.getElementById('auth-form-container');
    const authenticatedContent = document.getElementById('authenticated-content');
    
    if (user) {
        const status = user.email ? 'Email/Password' : 'Guest (Anonymous)';
        const statusColor = user.email ? '#28a745' : '#ffc107';
        
        authBar.innerHTML = `Welcome, ${status}! (UID: ${user.uid}) <span style="color: ${statusColor};">● Logged In</span>`;
        document.getElementById('user-uid').textContent = user.uid;
        authFormContainer.style.display = 'none';
        authenticatedContent.style.display = 'block';
    } else {
        authBar.innerHTML = `Not Logged In <span style="color: #dc3545;">● Anonymous/Guest</span>`;
        authFormContainer.style.display = 'block';
        authenticatedContent.style.display = 'none';
    }
}

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('error', 'Please enter both email and password.');
        return;
    }
    if (password.length < 6) {
        showMessage('error', 'Password must be at least 6 characters long.');
        return;
    }

    setButtonsDisabled(true);
    try {
        const userCredential = await retryOperation(createUserWithEmailAndPassword, auth, email, password);
        const user = userCredential.user;

        const userRef = doc(collection(db, `/artifacts/${appId}/users/${user.uid}/profile`), 'data');
        await retryOperation(setDoc, userRef, { 
            email: user.email, 
            createdAt: new Date().toISOString() 
        });

        showMessage('success', 'Sign up successful! Welcome to your new account.');
    } catch (error) {
        console.error("Sign up error:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already in use. Please log in instead.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'The email address is not valid.';
        }
        showMessage('error', `Sign Up Failed: ${errorMessage}`);
    } finally {
        setButtonsDisabled(false);
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('error', 'Please enter both email and password.');
        return;
    }

    setButtonsDisabled(true);
    try {
        await retryOperation(signInWithEmailAndPassword, auth, email, password);
        showMessage('success', 'Login successful! Redirecting...');
    } catch (error) {
        console.error("Login error:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password.';
        }
        showMessage('error', `Login Failed: ${errorMessage}`);
    } finally {
        setButtonsDisabled(false);
    }
}

async function handleLogout() {
    try {
        await retryOperation(signOut, auth);
        showMessage('success', 'Successfully logged out. You can sign in again.');
    } catch (error) {
        console.error("Logout error:", error);
        showMessage('error', `Logout Failed: ${error.message}`);
    }
}

document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('signup-btn').addEventListener('click', handleSignUp);
document.getElementById('logout-btn').addEventListener('click', handleLogout);

document.addEventListener('DOMContentLoaded', initializeFirebase);