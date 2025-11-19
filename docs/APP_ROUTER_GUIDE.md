# راهنمای App Router در PlusMeet

## 🎯 درباره App Router

**App Router** جدیدترین و پیشرفته‌ترین روش Routing در Next.js است که در نسخه 13 معرفی و در نسخه 14 stable شد.

## 🆚 تفاوت با Pages Router

| ویژگی              | Pages Router (قدیمی)   | App Router (جدید)          |
| ------------------ | ---------------------- | -------------------------- |
| **Directory**      | `pages/`               | `app/`                     |
| **File Names**     | `index.js`, `about.js` | `page.js`, `layout.js`     |
| **Layout**         | `_app.js`              | `layout.js` در هر route    |
| **Loading**        | Custom implementation  | `loading.js` built-in      |
| **Error Handling** | `_error.js`            | `error.js` built-in        |
| **404 Page**       | `404.js`               | `not-found.js`             |
| **API Routes**     | `pages/api/*.js`       | `app/api/*/route.js`       |
| **Default**        | Client Component       | Server Component           |
| **Data Fetching**  | `getServerSideProps`   | `async/await` در component |

## 🏗 ساختار فایل‌ها

### فایل‌های ویژه

\`\`\`
app/
├── layout.js # Layout برای تمام children
├── page.js # محتوای اصلی route
├── loading.js # Loading UI (Suspense)
├── error.js # Error UI
├── not-found.js # 404 UI
└── template.js # مثل layout اما re-mount می‌شود
\`\`\`

### مثال ساختار کامل

\`\`\`
app/
├── layout.js # Root layout
├── page.js # Home page (/)
├── loading.js # Loading state
├── error.js # Error boundary
│
├── about/
│ └── page.js # /about
│
├── dashboard/
│ ├── layout.js # Dashboard layout
│ ├── page.js # /dashboard
│ └── settings/
│ └── page.js # /dashboard/settings
│
└── api/
├── health/
│ └── route.js # API endpoint
└── users/
└── route.js # API endpoint
\`\`\`

## 🎨 Server vs Client Components

### Server Components (پیش‌فرض)

همه کامپوننت‌ها به‌صورت پیش‌فرض Server Component هستند:

\`\`\`jsx
// app/page.js
// این یک Server Component است (پیش‌فرض)

export default function HomePage() {
// می‌توانید مستقیماً data fetch کنید
return <div>Home Page</div>;
}
\`\`\`

**مزایا:**

- Bundle size کوچک‌تر (JS به کلاینت ارسال نمی‌شود)
- دسترسی مستقیم به دیتابیس و backend resources
- بهتر برای SEO
- امنیت بیشتر (secrets در سرور می‌مانند)

### Client Components

برای استفاده از hooks و interactivity:

\`\`\`jsx
// app/counter.js
"use client"; // 👈 اضافه کردن این خط

import { useState } from "react";

export default function Counter() {
const [count, setCount] = useState(0);

return (
<button onClick={() => setCount(count + 1)}>
Count: {count}
</button>
);
}
\`\`\`

**چه زمانی استفاده کنیم:**

- استفاده از React Hooks (`useState`, `useEffect`, ...)
- Event handlers (`onClick`, `onChange`, ...)
- Browser APIs (`localStorage`, `window`, ...)
- Context API (`useContext`)
- Class components

## 📦 Layouts

### Root Layout (اجباری)

\`\`\`jsx
// app/layout.js
export default function RootLayout({ children }) {
return (
<html lang="fa">
<body>
{children}
</body>
</html>
);
}
\`\`\`

### Nested Layout

\`\`\`jsx
// app/dashboard/layout.js
export default function DashboardLayout({ children }) {
return (
<div>
<nav>Dashboard Nav</nav>
<main>{children}</main>
</div>
);
}
\`\`\`

## 🔄 Data Fetching

### در Server Components

\`\`\`jsx
// app/posts/page.js
async function getPosts() {
const res = await fetch('https://api.example.com/posts');
return res.json();
}

export default async function PostsPage() {
const posts = await getPosts();

return (
<div>
{posts.map(post => (
<div key={post.id}>{post.title}</div>
))}
</div>
);
}
\`\`\`

### Caching

\`\`\`jsx
// Cache برای 1 ساعت
fetch('https://api.example.com/data', {
next: { revalidate: 3600 }
});

// بدون cache
fetch('https://api.example.com/data', {
cache: 'no-store'
});
\`\`\`

## 🛣 Dynamic Routes

### مثال 1: [id]

\`\`\`
app/
└── posts/
├── page.js # /posts
└── [id]/
└── page.js # /posts/123
\`\`\`

\`\`\`jsx
// app/posts/[id]/page.js
export default function PostPage({ params }) {
return <div>Post ID: {params.id}</div>;
}
\`\`\`

### مثال 2: [...slug] (Catch-all)

\`\`\`
app/
└── docs/
└── [...slug]/
└── page.js # /docs/a, /docs/a/b, /docs/a/b/c
\`\`\`

\`\`\`jsx
// app/docs/[...slug]/page.js
export default function DocsPage({ params }) {
return <div>Slug: {params.slug.join('/')}</div>;
}
\`\`\`

## 🎭 Route Groups

گروه‌بندی بدون تأثیر بر URL:

\`\`\`
app/
├── (marketing)/
│ ├── layout.js # Layout فقط برای marketing
│ ├── about/
│ │ └── page.js # /about (بدون marketing در URL)
│ └── blog/
│ └── page.js # /blog
│
└── (shop)/
├── layout.js # Layout فقط برای shop
└── products/
└── page.js # /products
\`\`\`

## 🔌 API Routes

### ساختار

\`\`\`
app/
└── api/
└── users/
└── route.js
\`\`\`

### پیاده‌سازی

\`\`\`jsx
// app/api/users/route.js
import { NextResponse } from "next/server";

// GET /api/users
export async function GET(request) {
const users = [{ id: 1, name: "Ali" }];
return NextResponse.json(users);
}

// POST /api/users
export async function POST(request) {
const body = await request.json();
// ذخیره در دیتابیس
return NextResponse.json({ success: true });
}

// Dynamic route params
export async function GET(request, { params }) {
const userId = params.id;
return NextResponse.json({ userId });
}
\`\`\`

### استفاده از Query Parameters

\`\`\`jsx
export async function GET(request) {
const searchParams = request.nextUrl.searchParams;
const query = searchParams.get('query');

return NextResponse.json({ query });
}
\`\`\`

## 📝 Metadata

### Static Metadata

\`\`\`jsx
// app/about/page.js
export const metadata = {
title: "درباره ما",
description: "درباره پلتفرم PlusMeet",
};

export default function AboutPage() {
return <div>About</div>;
}
\`\`\`

### Dynamic Metadata

\`\`\`jsx
// app/posts/[id]/page.js
export async function generateMetadata({ params }) {
const post = await getPost(params.id);

return {
title: post.title,
description: post.excerpt,
};
}
\`\`\`

## ⚡️ Loading States

\`\`\`jsx
// app/dashboard/loading.js
export default function Loading() {
return (
<div>
<p>در حال بارگذاری...</p>
<Spinner />
</div>
);
}
\`\`\`

این automatically با Suspense کار می‌کند!

## ❌ Error Handling

\`\`\`jsx
// app/dashboard/error.js
"use client"; // Error components باید Client Component باشند

export default function Error({ error, reset }) {
return (
<div>
<h2>خطایی رخ داد!</h2>
<p>{error.message}</p>
<button onClick={reset}>تلاش مجدد</button>
</div>
);
}
\`\`\`

## 🎯 Best Practices

### 1. Server Components را ترجیح دهید

\`\`\`jsx
// ✅ خوب - Server Component
export default async function Page() {
const data = await fetchData();
return <div>{data}</div>;
}

// ❌ بد - Client Component بدون دلیل
"use client";
export default function Page() {
return <div>Static content</div>;
}
\`\`\`

### 2. Client Components را تا حد امکان پایین نگه دارید

\`\`\`jsx
// ✅ خوب
export default function Page() {
return (
<div>
<Header /> {/_ Server Component _/}
<Counter /> {/_ Client Component - فقط این یکی _/}
<Footer /> {/_ Server Component _/}
</div>
);
}
\`\`\`

### 3. از Loading و Error استفاده کنید

هر route باید `loading.js` و `error.js` داشته باشد.

### 4. Metadata را فراموش نکنید

برای SEO بهتر، همیشه metadata تعریف کنید.

## 🔄 Migration چک‌لیست

برای تبدیل از Pages Router به App Router:

- [ ] `pages/` را به `app/` تبدیل کنید
- [ ] `_app.js` → `layout.js`
- [ ] `_document.js` → `layout.js` (merge)
- [ ] `index.js` → `page.js`
- [ ] `404.js` → `not-found.js`
- [ ] `_error.js` → `error.js`
- [ ] API routes: `pages/api/` → `app/api/*/route.js`
- [ ] `getServerSideProps` → async component
- [ ] `getStaticProps` → async component با cache
- [ ] تمام Client Components را با `"use client"` مشخص کنید

## 📚 منابع

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Routing Fundamentals](https://nextjs.org/docs/app/building-your-application/routing)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

---

**نکته مهم**: PlusMeet به‌طور کامل از App Router استفاده می‌کند و Pages Router در این پروژه پشتیبانی نمی‌شود.







