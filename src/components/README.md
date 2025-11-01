# Components Directory

این پوشه شامل تمام کامپوننت‌های React پروژه است.

## ساختار

\`\`\`
components/
├── common/ # کامپوننت‌های عمومی و قابل استفاده مجدد
│ ├── Button/
│ ├── Input/
│ ├── Card/
│ ├── Modal/
│ └── ...
│
├── layout/ # کامپوننت‌های لی‌اوت
│ ├── Header/
│ ├── Footer/
│ ├── Sidebar/
│ └── Layout/
│
└── features/ # کامپوننت‌های مرتبط با ویژگی‌های خاص
├── events/
├── chat/
├── profile/
└── ...
\`\`\`

## قوانین

1. هر کامپوننت در پوشه جداگانه
2. نام پوشه با PascalCase
3. فایل اصلی با نام \`index.js\`
4. استایل با نام \`ComponentName.module.css\`

## مثال

\`\`\`
Button/
├── index.js # کامپوننت اصلی
├── Button.module.css # استایل
└── Button.test.js # تست (آینده)
\`\`\`


