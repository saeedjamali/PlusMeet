# 📝 راهنمای تایپوگرافی PlusMeet

## 🎯 فلسفه تایپوگرافی

سیستم تایپوگرافی PlusMeet بر اساس اصول زیر طراحی شده:

- **خوانایی**: فونت‌های خوانا در تمام اندازه‌ها
- **سلسله‌مراتب واضح**: تفکیک مشخص بین عناوین و متن
- **هماهنگی با برند**: حس گرم، دوستانه و صمیمی
- **چندزبانه**: پشتیبانی کامل از فارسی و انگلیسی
- **قابلیت دسترسی**: نسبت کنتراست مناسب در همه حالات

---

## 🔤 فونت‌های استفاده شده

### فارسی

#### 1. Vazirmatn (فونت اصلی)

```css
font-family: var(--font-primary-fa);
```

**استفاده**: متن عمومی، پاراگراف‌ها، فرم‌ها، دکمه‌ها

**ویژگی‌ها**:

- ✅ خوانایی عالی در اندازه‌های کوچک
- ✅ طراحی مدرن با لبه‌های نرم
- ✅ وزن‌های متنوع (300-700)
- ✅ بهینه برای صفحه‌نمایش

**مثال**:
\`\`\`html

<p>این یک متن نمونه با فونت Vazirmatn است.</p>
\`\`\`

#### 2. Yekan / IRANYekan (فونت ثانویه)

```css
font-family: var(--font-secondary-fa);
```

**استفاده**: عناوین، تیترها، لوگو، بنرها

**ویژگی‌ها**:

- ✅ شناخته‌شده و محبوب
- ✅ حس معاصر و شیک
- ✅ مناسب برای عناوین برجسته
- ✅ وزن‌های قوی (400-800)

**مثال**:
\`\`\`html

<h1>عنوان اصلی با فونت Yekan</h1>
<h2>عنوان فرعی</h2>
\`\`\`

#### 3. Shabnam (فونت سوم - اختیاری)

```css
font-family: var(--font-tertiary-fa);
```

**استفاده**: کارت‌ها، بخش‌های معرفی، محتوای دوستانه

**ویژگی‌ها**:

- ✅ طراحی گردتر
- ✅ حس دوستانه‌تر
- ✅ مناسب برای محتوای غیررسمی

### انگلیسی

#### 1. Inter (فونت اصلی)

```css
font-family: var(--font-primary-en);
```

**استفاده**: متن پایه، پاراگراف‌ها، لیست‌ها

**ویژگی‌ها**:

- ✅ طراحی مخصوص UI
- ✅ خوانایی بالا در اندازه‌های کوچک
- ✅ Variable Font با وزن‌های 300-800
- ✅ بهینه برای صفحه‌نمایش

#### 2. Poppins (فونت ثانویه)

```css
font-family: var(--font-secondary-en);
```

**استفاده**: عناوین، دکمه‌ها، CTA

**ویژگی‌ها**:

- ✅ هندسی و مدرن
- ✅ ظاهر دوستانه
- ✅ وزن‌های واضح (400-700)

#### 3. Source Sans Pro (فونت سوم - اختیاری)

```css
font-family: var(--font-tertiary-en);
```

**استفاده**: فرم‌ها، برچسب‌ها، UI

---

## 📏 مقیاس اندازه فونت (Type Scale)

### تعریف اندازه‌ها

| نام      | متغیر CSS          | اندازه          | استفاده                   |
| -------- | ------------------ | --------------- | ------------------------- |
| **5XL**  | `--font-size-5xl`  | 48px (3rem)     | Hero Titles، صفحه Landing |
| **4XL**  | `--font-size-4xl`  | 36px (2.25rem)  | Page Titles               |
| **3XL**  | `--font-size-3xl`  | 30px (1.875rem) | Section Headers           |
| **2XL**  | `--font-size-2xl`  | 24px (1.5rem)   | Card Titles               |
| **XL**   | `--font-size-xl`   | 20px (1.25rem)  | Subheadings               |
| **LG**   | `--font-size-lg`   | 18px (1.125rem) | Lead Text                 |
| **Base** | `--font-size-base` | 16px (1rem)     | Body Text                 |
| **SM**   | `--font-size-sm`   | 14px (0.875rem) | Small Text، Captions      |
| **XS**   | `--font-size-xs`   | 12px (0.75rem)  | Tiny Text، Labels         |

### مثال استفاده

\`\`\`css
.hero-title {
font-size: var(--font-size-5xl);
font-weight: 800;
line-height: 1.1;
}

.body-text {
font-size: var(--font-size-base);
font-weight: 400;
line-height: 1.6;
}

.caption {
font-size: var(--font-size-sm);
font-weight: 500;
line-height: 1.4;
}
\`\`\`

---

## ⚖️ وزن فونت (Font Weights)

| نام           | متغیر                     | مقدار | استفاده       |
| ------------- | ------------------------- | ----- | ------------- |
| **Light**     | `--font-weight-light`     | 300   | متن سبک       |
| **Normal**    | `--font-weight-normal`    | 400   | متن عادی      |
| **Medium**    | `--font-weight-medium`    | 500   | تاکید ملایم   |
| **SemiBold**  | `--font-weight-semibold`  | 600   | تاکید متوسط   |
| **Bold**      | `--font-weight-bold`      | 700   | عناوین        |
| **ExtraBold** | `--font-weight-extrabold` | 800   | عناوین برجسته |

\`\`\`css
.light { font-weight: var(--font-weight-light); }
.normal { font-weight: var(--font-weight-normal); }
.medium { font-weight: var(--font-weight-medium); }
.semibold { font-weight: var(--font-weight-semibold); }
.bold { font-weight: var(--font-weight-bold); }
.extrabold { font-weight: var(--font-weight-extrabold); }
\`\`\`

---

## 📐 فاصله خطوط (Line Height)

| نام         | متغیر                   | مقدار | استفاده       |
| ----------- | ----------------------- | ----- | ------------- |
| **Tight**   | `--line-height-tight`   | 1.25  | عناوین        |
| **Normal**  | `--line-height-normal`  | 1.5   | متن عادی      |
| **Relaxed** | `--line-height-relaxed` | 1.75  | متن طولانی    |
| **Loose**   | `--line-height-loose`   | 2     | متن فاصله‌دار |

\`\`\`css
h1, h2, h3 {
line-height: var(--line-height-tight);
}

p {
line-height: var(--line-height-normal);
}

.article-text {
line-height: var(--line-height-relaxed);
}
\`\`\`

---

## 🎨 کلاس‌های آماده (Utility Classes)

### عناوین

\`\`\`css
/_ عنوان اصلی _/
.heading-hero {
font-family: var(--font-secondary-fa);
font-size: var(--font-size-5xl);
font-weight: 800;
line-height: 1.1;
color: var(--color-text-primary);
}

/_ عنوان صفحه _/
.heading-page {
font-family: var(--font-secondary-fa);
font-size: var(--font-size-4xl);
font-weight: 700;
line-height: 1.2;
}

/_ عنوان بخش _/
.heading-section {
font-family: var(--font-secondary-fa);
font-size: var(--font-size-3xl);
font-weight: 700;
line-height: 1.25;
}
\`\`\`

### متن

\`\`\`css
/_ متن اصلی _/
.body-text {
font-family: var(--font-primary-fa);
font-size: var(--font-size-base);
font-weight: 400;
line-height: 1.6;
color: var(--color-text-primary);
}

/_ متن برجسته _/
.body-text-lead {
font-size: var(--font-size-lg);
font-weight: 500;
line-height: 1.5;
}

/_ متن کوچک _/
.text-small {
font-size: var(--font-size-sm);
line-height: 1.4;
color: var(--color-text-secondary);
}

/_ متن خیلی کوچک _/
.text-tiny {
font-size: var(--font-size-xs);
line-height: 1.3;
color: var(--color-text-disabled);
}
\`\`\`

---

## 🔄 استفاده در کامپوننت‌ها

### React Component

\`\`\`jsx
export default function Typography({ variant = "body", children }) {
const styles = {
h1: "text-5xl font-extrabold font-secondary",
h2: "text-4xl font-bold font-secondary",
h3: "text-3xl font-bold font-secondary",
body: "text-base font-normal",
lead: "text-lg font-medium",
small: "text-sm",
};

return <div className={styles[variant]}>{children}</div>;
}
\`\`\`

### استفاده

\`\`\`jsx
<Typography variant="h1">عنوان اصلی</Typography>
<Typography variant="body">متن توضیحی</Typography>
<Typography variant="small">متن کوچک</Typography>
\`\`\`

---

## 📱 Responsive Typography

### تنظیمات Responsive

\`\`\`css
/_ Mobile First _/
.responsive-heading {
font-size: var(--font-size-2xl);
}

/_ Tablet _/
@media (min-width: 768px) {
.responsive-heading {
font-size: var(--font-size-3xl);
}
}

/_ Desktop _/
@media (min-width: 1024px) {
.responsive-heading {
font-size: var(--font-size-4xl);
}
}

/_ Large Desktop _/
@media (min-width: 1280px) {
.responsive-heading {
font-size: var(--font-size-5xl);
}
}
\`\`\`

---

## ✅ Best Practices

### 1. سلسله‌مراتب واضح

\`\`\`css
/_ ✅ خوب _/
h1 { font-size: 2.25rem; font-weight: 800; }
h2 { font-size: 1.875rem; font-weight: 700; }
p { font-size: 1rem; font-weight: 400; }

/_ ❌ بد _/
h1 { font-size: 1.2rem; }
h2 { font-size: 1.15rem; }
p { font-size: 1.1rem; }
\`\`\`

### 2. Line Height مناسب

\`\`\`css
/_ ✅ خوب _/
h1 { line-height: 1.2; }
p { line-height: 1.6; }

/_ ❌ بد _/
h1 { line-height: 2; } /_ خیلی زیاد _/
p { line-height: 1.1; } /_ خیلی کم _/
\`\`\`

### 3. استفاده از فونت مناسب

\`\`\`css
/_ ✅ خوب - عنوان با فونت ثانویه _/
h1 {
font-family: var(--font-secondary-fa);
}

/_ ✅ خوب - متن با فونت اصلی _/
p {
font-family: var(--font-primary-fa);
}

/_ ❌ بد - همه با یک فونت _/

- {
  font-family: var(--font-primary-fa);
  }
  \`\`\`

### 4. وزن مناسب برای هر المان

\`\`\`css
/_ ✅ خوب _/
button {
font-weight: 600; /_ SemiBold برای دکمه‌ها _/
}

p {
font-weight: 400; /_ Normal برای متن _/
}

/_ ❌ بد - همه Bold _/

- {
  font-weight: 700;
  }
  \`\`\`

---

## 🌐 چندزبانه

### تعویض خودکار فونت

\`\`\`html

<!-- فارسی -->
<div lang="fa">
  <h1>عنوان فارسی</h1>
  <p>متن فارسی</p>
</div>

<!-- انگلیسی -->
<div lang="en">
  <h1>English Title</h1>
  <p>English text</p>
</div>
\`\`\`

### CSS

\`\`\`css
/_ پیش‌فرض فارسی _/
body {
font-family: var(--font-primary-fa);
direction: rtl;
}

/_ انگلیسی _/
[lang="en"] {
font-family: var(--font-primary-en);
direction: ltr;
}
\`\`\`

---

## 📊 جدول خلاصه

| المان       | فونت      | اندازه  | وزن | Line Height |
| ----------- | --------- | ------- | --- | ----------- |
| **H1**      | Secondary | 36-48px | 800 | 1.1-1.2     |
| **H2**      | Secondary | 30-36px | 700 | 1.2         |
| **H3**      | Secondary | 24-30px | 700 | 1.25        |
| **Body**    | Primary   | 16px    | 400 | 1.5-1.6     |
| **Lead**    | Primary   | 18px    | 500 | 1.5         |
| **Small**   | Primary   | 14px    | 400 | 1.4         |
| **Button**  | Primary   | 16px    | 600 | 1.5         |
| **Caption** | Primary   | 12-14px | 400 | 1.3         |

---

## 📚 منابع

- [Vazirmatn على GitHub](https://github.com/rastikerdar/vazirmatn)
- [IRANYekan على FontIran](https://fontiran.com)
- [Inter Font](https://rsms.me/inter/)
- [Poppins على Google Fonts](https://fonts.google.com/specimen/Poppins)

---

**آخرین به‌روزرسانی**: 27 اکتبر 2025







