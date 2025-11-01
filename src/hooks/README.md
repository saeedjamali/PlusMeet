# Custom Hooks

این پوشه شامل Custom React Hooks پروژه است.

## قوانین نام‌گذاری

- همه Hook ها با \`use\` شروع می‌شوند
- از camelCase استفاده کنید
- نام باید توصیفی باشد

## مثال‌ها

\`\`\`javascript
// useLocalStorage.js
export function useLocalStorage(key, initialValue) {
// implementation
}

// useDebounce.js
export function useDebounce(value, delay) {
// implementation
}

// useMediaQuery.js
export function useMediaQuery(query) {
// implementation
}
\`\`\`

## Hooks رایج (که در آینده اضافه می‌شوند)

- \`useAuth\` - مدیریت authentication
- \`useApi\` - مدیریت API calls
- \`useForm\` - مدیریت فرم‌ها
- \`useDebounce\` - debouncing
- \`useLocalStorage\` - کار با localStorage
- \`useMediaQuery\` - responsive hooks


