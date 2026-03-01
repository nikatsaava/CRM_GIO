# 🪑 Tale CRM — სრული გაშვების სახელმძღვანელო

## სტეკი
- **Backend**: Node.js + NestJS (REST API)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL (Supabase)
- **Deploy**: Railway (backend) + Vercel (frontend)

---

## ნაბიჯი 1 — Supabase-ს მონაცემთა ბაზა

1. გადადი → https://supabase.com → **New Project**
2. შეარჩიე Region: **Europe (Frankfurt)**
3. პროექტი შეიქმნება 1-2 წუთში
4. **Settings → Database → Connection String → URI** დააკოპირე URL

```
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

---

## ნაბიჯი 2 — Backend-ის Deploy (Railway)

1. გადადი → https://railway.app → **New Project → Deploy from GitHub repo**  
   *(ან drag & drop `backend/` папку)*

2. **Environment Variables** დაამატე:
```
DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres
JWT_SECRET=Xk9#mP2qR8sT4wY7zA1b (შეცვალე!)
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tale2024! (შეცვალე!)
CORS_ORIGIN=https://your-app.vercel.app
PORT=3001
NODE_ENV=production
```

3. **Settings → Build Command**: `npm install && npm run build`  
   **Start Command**: `npm run start:prod`

4. Railway-ს **URL** დააკოპირე (მაგ: `https://tale-crm.railway.app`)

5. **ადმინის შექმნა** (ერთხელ):  
   Railway Console-ში ან locally გაუშვი:
```bash
cd backend
npm install
DATABASE_URL="..." ADMIN_USERNAME=admin ADMIN_PASSWORD="tale2024!" npx ts-node src/seed.ts
```

---

## ნაბიჯი 3 — Frontend-ის Deploy (Vercel)

1. გადადი → https://vercel.com → **New Project → Import Git Repository**

2. **Root Directory**: `frontend`

3. **Environment Variables**:
```
VITE_API_URL=https://tale-crm.railway.app/api
```

4. Deploy — მოიწევს 1-2 წუთი

5. Railway-ში `CORS_ORIGIN` განაახლე Vercel-ის URL-ით

---

## ლოკალური გაშვება (development)

### Prerequisites
- Node.js 20+
- PostgreSQL ან Supabase URL

### Backend
```bash
cd backend
npm install
cp .env.example .env
# შეავსე .env DATABASE_URL-ით
npm run start:dev
# API: http://localhost:3001/api
```

### ადმინის შექმნა (ერთხელ)
```bash
cd backend
npx ts-node src/seed.ts
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# .env-ში: VITE_API_URL=http://localhost:3001/api
npm run dev
# App: http://localhost:5173
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | შესვლა |
| POST | /api/auth/change-password | პაროლის შეცვლა |
| GET | /api/orders | შეკვეთების სია |
| POST | /api/orders | შეკვეთის შექმნა |
| PUT | /api/orders/:id | შეკვეთის განახლება |
| PATCH | /api/orders/:id/status | სტატუსის შეცვლა |
| DELETE | /api/orders/:id | შეკვეთის წაშლა |
| GET | /api/clients | კლიენტების სია |
| POST | /api/clients | კლიენტის შექმნა |
| PUT | /api/clients/:id | კლიენტის განახლება |
| GET | /api/analytics/dashboard | ანალიტიკა |

---

## პროექტის სტრუქტურა

```
tale-crm/
├── backend/
│   └── src/
│       ├── auth/          # JWT auth, login, password change
│       ├── clients/       # კლიენტების CRUD
│       ├── orders/        # შეკვეთების CRUD + OrderItems
│       ├── analytics/     # Dashboard stats
│       ├── common/        # JWT Guard
│       ├── app.module.ts
│       ├── main.ts
│       └── seed.ts        # Admin user creation
│
└── frontend/
    └── src/
        ├── api/           # Axios API calls
        ├── components/    # UI components, OrderForm, Layout
        ├── pages/         # Orders, Clients, Analytics, Login, Settings
        └── store/         # Zustand auth store
```

---

## შესვლა
- **URL**: https://your-app.vercel.app
- **Username**: admin (ან .env-ში ADMIN_USERNAME)
- **Password**: tale2024! (ან .env-ში ADMIN_PASSWORD)

> ⚠️ პირველი შესვლის შემდეგ **შეცვალე პაროლი** Settings გვერდზე!
