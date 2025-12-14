# MedusaJS Setup Instructions

## ✅ Current Status

### Services Running
- **Medusa Backend**: http://localhost:9000 (RUNNING ✅)
- **Medusa Admin UI**: http://localhost:9000/app (ACCESSIBLE ✅)
- **Next.js Frontend**: http://localhost:3000 (RUNNING ✅)
- **PostgreSQL (Medusa)**: Port 5435 (HEALTHY ✅)
- **Redis (Medusa)**: Port 6380 (HEALTHY ✅)

### Admin Credentials
- **Email**: admin@revampit.ch
- **Password**: Admin123!

---

## 🔧 Next Steps to Complete Medusa Setup

### Step 1: Access Admin Panel

1. Open http://localhost:9000/app in your browser
2. Login with:
   - Email: `admin@revampit.ch`
   - Password: `Admin123!`

### Step 2: Create Publishable API Key

1. In the admin panel, navigate to **Settings** → **Publishable API Keys**
2. Click **"Create API Key"**
3. Enter name: `Web Storefront`
4. Click **"Save"**
5. Copy the generated key (starts with `pk_`)

### Step 3: Add API Key to Environment

Edit `/home/g/dev/revampit/.env.local` and add:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
```

Replace `pk_your_key_here` with the actual key from Step 2.

### Step 4: Add Sample Products

In the admin panel:

1. Navigate to **Products** → **Add Product**

2. **Product 1: ThinkPad T480**
   - Title: `ThinkPad T480 Refurbished`
   - Handle: `thinkpad-t480-refurbished`
   - Description: `Generalüberholter Lenovo ThinkPad T480 mit Intel Core i5, 16GB RAM, 256GB SSD. Perfekt für Business und Home Office.`
   - Status: **Published**
   - Price: `599.00 CHF`
   - Inventory: `5`

3. **Product 2: Dell Monitor**
   - Title: `Dell Monitor 24" Full HD`
   - Handle: `dell-monitor-24-full-hd`
   - Description: `24-Zoll Full HD Monitor von Dell. IPS-Panel, 60Hz, HDMI und DisplayPort.`
   - Status: **Published**
   - Price: `149.00 CHF`
   - Inventory: `10`

4. **Product 3: Wireless Mouse**
   - Title: `Wireless Ergonomic Mouse`
   - Handle: `wireless-ergonomic-mouse`
   - Description: `Ergonomische kabellose Maus mit 2.4GHz Verbindung.`
   - Status: **Published**
   - Price: `29.00 CHF`
   - Inventory: `20`

### Step 5: Test the Shop

1. Restart Next.js dev server (if needed):
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

2. Open http://localhost:3000/shop/medusa

3. You should see the products you created

4. Test:
   - Click on a product
   - Add to cart
   - View cart
   - Update quantities
   - Remove items

---

## 🔍 Verification Commands

### Check Services
```bash
# Medusa health
curl http://localhost:9000/health

# Next.js health
curl http://localhost:3000/api/health

# Docker services
docker compose -f docker-compose.medusa.yml ps
```

### Test API with Key
```bash
# Replace pk_xxx with your actual key
curl -H "x-publishable-api-key: pk_xxx" http://localhost:9000/store/products
```

---

## 🚀 Production Deployment (Future)

When ready to deploy:

1. **Backend Hosting**:
   - Deploy Medusa to VPS (DigitalOcean, Hetzner, etc.)
   - Use managed PostgreSQL and Redis
   - Set up SSL with Let's Encrypt
   - Configure environment variables

2. **Frontend**:
   - Already deployed on Vercel
   - Update `NEXT_PUBLIC_MEDUSA_URL` to production URL
   - Add `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` to Vercel env vars

3. **Domain Setup**:
   - Backend: `medusa.revamp-it.ch` or `api.revamp-it.ch`
   - Frontend shop: Already at `revampit.vercel.app/shop/medusa`

---

## 📝 Notes

- **Payment Integration**: Not yet implemented (as per your requirements)
- **Mock API**: Fallback available at `/api/medusa/mock` for development
- **Admin Access**: Only via http://localhost:9000/app (secure for production later)

---

## ❓ Troubleshooting

### Products Not Showing

1. Check if products are **Published** (not draft)
2. Verify API key is correct in `.env.local`
3. Check browser console for errors
4. Verify Medusa backend is running: `curl http://localhost:9000/health`

### "Invalid publishable key" Error

1. Make sure you created the API key in admin panel
2. Check the key is in `.env.local` with correct variable name
3. Restart Next.js after adding environment variable

### Database Connection Issues

```bash
# Restart Docker services
docker compose -f docker-compose.medusa.yml restart

# Check logs
docker compose -f docker-compose.medusa.yml logs medusa_db
```

---

**Last Updated**: 2025-12-03
