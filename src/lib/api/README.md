# API Client

کلاینت‌های API و توابع مرتبط با درخواست‌های HTTP.

## ساختار (آینده)

\`\`\`
api/
├── client.js # API client اصلی
├── endpoints.js # لیست endpoint ها
├── interceptors.js # Request/Response interceptors
└── services/ # سرویس‌های API
├── auth.js
├── events.js
├── users.js
└── ...
\`\`\`

## مثال استفاده (آینده)

\`\`\`javascript
import { apiClient } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

// GET request
const events = await apiClient.get(ENDPOINTS.EVENTS);

// POST request
const newEvent = await apiClient.post(ENDPOINTS.EVENTS, data);
\`\`\`







