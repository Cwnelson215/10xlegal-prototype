# Environment Setup Guide

## Development Setup

### 1. Create `.env` file

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

### 2. Configure API URL

Edit `.env` and set your backend server URL:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Production Setup

### 1. Build the Project

```bash
npm run build
```

### 2. Set API URL for Production

Before deploying, ensure your backend is configured and update the API URL.

### 3. Environment Variable in Production

For production deployments, you can set the API URL in two ways:

**Option A: Using `.env` file during build**
```env
VITE_API_URL=https://api.yourdomain.com/api
npm run build
```

**Option B: Setting on window object before app loads**
```html
<script>
    window.__API_URL__ = 'https://api.yourdomain.com/api';
</script>
<script src="/dist/app.js"></script>
```

## API Configuration Details

The API configuration is loaded in the following priority:

1. `window.__API_URL__` (if set globally in HTML)
2. VITE environment variables (if using Vite config)
3. Default fallback: `http://localhost:3000/api`

This approach allows flexibility for:
- Different API URLs per environment (dev, staging, prod)
- Dynamic URL assignment at runtime
- Easy configuration for Docker containers

## Testing the API Connection

After starting both frontend and backend:

1. Go to `http://localhost:5173`
2. Click "Get Started" or "Sign In"
3. Select a role (Client, Lawyer, or Legal Official)
4. Enter test credentials
5. Submit - this will test the API connection

If successful, you'll be redirected to the dashboard.

## Troubleshooting

### API Connection Issues

**Problem**: "Failed to fetch" or CORS errors

**Solution**:
1. Ensure backend is running at the configured URL
2. Check that backend allows requests from `http://localhost:5173`
3. Verify CORS headers are properly configured on backend

**Problem**: 404 on API endpoints

**Solution**:
1. Verify the API URL in `.env` is correct
2. Ensure backend endpoints match those defined in `src/api/config.ts`
3. Check that all required endpoints are implemented on backend

**Problem**: 401 Unauthorized

**Solution**:
1. Ensure login/register endpoints return correct response format
2. Token should be in `response.data.token` path
3. Backend should accept Bearer token in Authorization header

## Backend Response Format

The backend should return responses in this format:

```json
{
    "success": true,
    "data": {
        "token": "jwt-token-here",
        "refreshToken": "refresh-token-here",
        "user": {
            "id": "user-id",
            "name": "User Name",
            "email": "user@example.com",
            "role": "lawyer",
            "createdAt": "2024-01-28T00:00:00Z",
            "updatedAt": "2024-01-28T00:00:00Z"
        }
    },
    "message": "Login successful"
}
```

## Vite Configuration

If you need to configure API URLs in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
```

This allows using `/api` in your code instead of full URLs.
