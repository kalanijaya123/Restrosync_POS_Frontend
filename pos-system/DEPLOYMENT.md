# 🚀 Deployment Configuration Guide

## ✅ What's Been Set Up

### 1. Environment Variables
- Created `.env` file (for local development)
- Created `.env.example` (template for team)
- Updated `.gitignore` to exclude `.env` files

### 2. API Configuration
All API calls now use environment variables:
- **Development**: `http://localhost:8080`
- **Production**: Set in `.env` file

### 3. Updated Files
The following files now use centralized API configuration:
- ✅ `src/services/api.ts` - Main API service with `getApiUrl()` helper
- ✅ `src/pages/MenuManager.tsx`
- ✅ `src/pages/Dashboard.tsx`
- ✅ `src/pages/Inventory.tsx`

**Note**: Other pages still need updating. Use this pattern:
```typescript
import { getApiUrl } from '../services/api'

// Replace:
fetch('http://localhost:8080/api/orders')
// With:
fetch(getApiUrl('/orders'))
```

## 📝 Deployment Steps

### For Development (Local)
```bash
# .env is already configured for localhost
npm run dev
```

### For Production

#### 1. Update .env file:
```env
VITE_API_URL=https://your-backend-url.com
```

Examples:
- Render: `https://restrosync-backend.onrender.com`
- Vercel: `https://restrosync-api.vercel.app`
- Railway: `https://restrosync.up.railway.app`

#### 2. Build the project:
```bash
npm run build
```

#### 3. Deploy the `dist` folder to:
- **Vercel**: Connect GitHub repo, auto-deploys
- **Netlify**: Drag & drop `dist` folder
- **Render**: Static site, point to `dist`

### Environment Variables in Hosting Platform

If deploying to Vercel/Netlify/Render, add environment variable in their dashboard:
- **Key**: `VITE_API_URL`
- **Value**: `https://your-backend-url.com`

## 🔧 Remaining Tasks

Update these files to use `getApiUrl()`:
- [ ] `src/pages/OrderEntry.tsx`
- [ ] `src/pages/OrderHistory.tsx`
- [ ] `src/pages/OrderSummary.tsx`
- [ ] `src/pages/Payment.tsx`
- [ ] `src/pages/ManagerDashboard.tsx`
- [ ] `src/pages/ThirdPartyOrders.tsx`
- [ ] `src/contexts/NotificationContext.tsx`

## 🎯 Quick Test

After updating `.env`:
```bash
# Stop the dev server (Ctrl+C)
npm run dev
# Check browser console - API calls should use new URL
```

## ⚠️ Important Notes

1. **Never commit `.env`** to Git (already in `.gitignore`)
2. **Always commit `.env.example`** as a template
3. **Restart dev server** after changing `.env`
4. **Double-check CORS** settings on your backend for production URL
