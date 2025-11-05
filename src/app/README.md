# App Directory - Next.js App Router

این پوشه شامل تمام صفحات و route های پروژه با معماری **App Router** است.

## 📁 ساختار

\`\`\`
app/
├── layout.js # Layout اصلی (Root Layout)
├── page.js # صفحه اصلی (/)
├── loading.js # کامپوننت Loading
├── error.js # کامپوننت Error
├── not-found.js # صفحه 404
│
├── api/ # API Routes
│ └── health/
│ └── route.js # Health Check API
│
└── [future routes]/ # Route های آینده
\`\`\`

## 🔧 فایل‌های کلیدی

### layout.js

Root Layout که تمام صفحات را wrap می‌کند. شامل:

- ThemeProvider
- Global CSS
- Metadata
- Font optimization

### page.js

صفحه اصلی (Home Page) پروژه

### loading.js

نمایش Loading UI هنگام بارگذاری صفحات

### error.js

مدیریت خطاها و نمایش Error UI

### not-found.js

صفحه 404 برای route های نامعتبر

## 🆕 ویژگی‌های App Router

### 1. Server Components (پیش‌فرض)

تمام کامپوننت‌ها به‌صورت پیش‌فرض Server Component هستند.

\`\`\`jsx
// Server Component (پیش‌فرض)
export default function MyPage() {
return <div>This is a Server Component</div>;
}
\`\`\`

برای Client Component از `"use client"` استفاده کنید:

\`\`\`jsx
"use client";

export default function MyClientComponent() {
const [state, setState] = useState(0);
return <div>Client Component</div>;
}
\`\`\`

### 2. Nested Layouts

هر پوشه می‌تواند layout خاص خودش را داشته باشد:

\`\`\`
app/
├── layout.js # Root Layout
└── dashboard/
├── layout.js # Dashboard Layout
└── page.js
\`\`\`

### 3. Route Groups

برای سازماندهی بدون تأثیر بر URL:

\`\`\`
app/
├── (marketing)/
│ ├── about/
│ └── blog/
└── (shop)/
├── products/
└── cart/
\`\`\`

### 4. Parallel Routes

نمایش چند route همزمان:

\`\`\`
app/
├── @sidebar/
├── @content/
└── layout.js
\`\`\`

### 5. Intercepting Routes

Intercept کردن navigation:

\`\`\`
app/
├── feed/
│ └── (..)photo/[id]/page.js
└── photo/[id]/page.js
\`\`\`

## 📝 ایجاد Route جدید

### مثال: صفحه About

\`\`\`bash

# ایجاد پوشه و فایل

mkdir -p src/app/about
touch src/app/about/page.js
\`\`\`

\`\`\`jsx
// src/app/about/page.js
export const metadata = {
title: "درباره ما - PlusMeet",
description: "درباره پلتفرم PlusMeet",
};

export default function AboutPage() {
return (
<div>
<h1>درباره ما</h1>
<p>محتوای صفحه درباره ما</p>
</div>
);
}
\`\`\`

### مثال: API Route

\`\`\`bash

# ایجاد API route

mkdir -p src/app/api/users
touch src/app/api/users/route.js
\`\`\`

\`\`\`jsx
// src/app/api/users/route.js
import { NextResponse } from "next/server";

export async function GET() {
const users = [{ id: 1, name: "Ali" }];
return NextResponse.json(users);
}

export async function POST(request) {
const body = await request.json();
return NextResponse.json({ success: true, data: body });
}
\`\`\`

## 🎯 Best Practices

### 1. استفاده از Server Components

هر جا که ممکن است از Server Components استفاده کنید:

- سریع‌تر
- کم‌حجم‌تر
- بهتر برای SEO

### 2. Client Components فقط وقت لازم

فقط برای موارد زیر از `"use client"` استفاده کنید:

- استفاده از Hooks (useState, useEffect, ...)
- Event handlers (onClick, onChange, ...)
- Browser APIs
- Context (useContext)

### 3. Metadata برای SEO

همیشه metadata را تعریف کنید:

\`\`\`jsx
export const metadata = {
title: "عنوان صفحه",
description: "توضیحات صفحه",
};
\`\`\`

### 4. Loading و Error States

برای UX بهتر از loading.js و error.js استفاده کنید.

### 5. Data Fetching

در Server Components مستقیماً data fetch کنید:

\`\`\`jsx
// Server Component
async function getData() {
const res = await fetch('https://api.example.com/data');
return res.json();
}

export default async function Page() {
const data = await getData();
return <div>{data.title}</div>;
}
\`\`\`

## 🔄 Migration از Pages Router

اگر کامپوننتی از Pages Router دارید:

**قبل (Pages Router):**
\`\`\`jsx
// pages/index.js
import { useState } from 'react';

export default function Home() {
const [count, setCount] = useState(0);
return <div>Count: {count}</div>;
}
\`\`\`

**بعد (App Router):**
\`\`\`jsx
// app/page.js
"use client";

import { useState } from 'react';

export default function HomePage() {
const [count, setCount] = useState(0);
return <div>Count: {count}</div>;
}
\`\`\`

## 📚 منابع بیشتر

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

**نکته**: این پروژه از App Router استفاده می‌کند که معماری پیشرفته‌تر و بهینه‌تر Next.js است.




