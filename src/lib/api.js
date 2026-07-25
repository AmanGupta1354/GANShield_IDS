// FIXED: was using VITE_API_BASE_URL (undefined in .env), now uses VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.detail || data.message || 'Request failed. Please try again.');
    }

    return data;
}

// FIXED: was '/api/auth/login' with JSON body — backend uses OAuth2PasswordRequestForm (form-data)
export async function loginUser(credentials) {
    const form = new URLSearchParams({
        username: credentials.email,   // OAuth2PasswordRequestForm expects 'username'
        password: credentials.password,
    });
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Login failed');
    localStorage.setItem('ganshield_token', data.access_token); // FIXED: key matches App.jsx check
    return data;
}

// FIXED: was '/api/auth/signup' — backend endpoint is '/auth/register'
export async function signupUser(payload) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            password: payload.password,
        }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Registration failed');
    localStorage.setItem('ganshield_token', data.access_token); // FIXED: key matches App.jsx check
    return data;
}