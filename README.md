# 🏥 AI Tibbiyot Boshqaruv Tizimi

Sun'iy intellekt bilan ta'minlangan klinika boshqaruv platformasi - navbat olish, raqamli retsept va to'liq tibbiy kartalar

---

## ✨ Asosiy Imkoniyatlar

### 🔐 Autentifikatsiya (AUTH)
**Sign Up / Sign In + JWT**
- Foydalanuvchi ro'yxatdan o'tish va tizimga kirish
- JWT token orqali xavfsiz autentifikatsiya
- Rol asosida kirish huquqi (Bemor, Doktor, Admin)
- Parol shifrlash va xavfsiz saqlash

### 🤖 AI Tibbiy Yordamchi
**Aqlli savolga javob berish tizimi**
- Bemorning savoliga tushunarli javob beradi
- Ma'lumotlar bazasidan real tibbiy ma'lumotlarni oladi
- AI o'z tahlilini va tavsiyalarini qo'shadi
- Faqat tibbiyot sohasiga oid savollar uchun ishlatiladi
- Bemor tarixi va oldingi ko'riklar kontekstida javob beradi
- RAG (Retrieval-Augmented Generation) arxitekturasi

### 📅 Navbat Tizimi
**Real-time navbat boshqaruvi**
- Bir vaqtning o'zida bitta bemor navbat ola oladi
- Database-level locking - ikki bemor bir xil navbatni ololmaydi
- Bekor qilingan navbat darhol boshqalar uchun ochiladi
- Real vaqtda navbat holatini yangilash
- Doktor jadvalini ko'rish va bo'sh vaqtlarni tanlash
- SMS/Email eslatmalar (rejalashtirilgan)

### 💊 Raqamli Retsept Tizimi
**QR kod va raqam bilan retsept**
- Doktor bemor uchun retsept yozadi
- Retsept bemorning sahifasida avtomatik ko'rinadi
- QR kod generatsiya qilinadi
- Aptekada skaner orqali QR kodni o'qitish - dorilar ro'yxati chiqadi
- Yoki kod raqamini kiritish orqali ham dorilar ro'yxatini olish mumkin
- Retsept tarixi va takroriy olish imkoniyati
- Raqamli imzo va xavfsizlik

### 📋 Tibbiy Daftar
**To'liq bemor ma'lumotlari**
- Bemorning umumiy shaxsiy ma'lumotlari
- Asosiy tibbiy ko'rsatkichlar (qon guruhi, allergiya, etc.)
- Shoshilinch aloqa ma'lumotlari
- Tibbiy tarix va muhim eslatmalar
- Fayllar va hujjatlar biriktirish

### 🏥 Ko'rik Tarixi
**Har bir tashrifning to'liq yozuvi**
- Bemor oxirgi marta qachon poliklinikaga kelgan
- Qaysi shikoyat bilan murojaat qilgan
- Qanday tashxis qo'yilgan
- Qaysi doktor davolagan
- Berilgan retseptlar va tavsiyalar
- Laboratoriya natijalari
- Barcha ko'riklarning vaqt bo'yicha to'liq jadvali
- Har bir ko'rikning batafsil qaydlari

---

## 🛠️ Texnologiyalar

### Backend
- **Django 4.2** - asosiy backend framework
- **Django REST Framework** - API yaratish
- **PostgreSQL 15** - ma'lumotlar bazasi
- **Redis** - kesh va sessiyalar
- **Celery** - background vazifalar (rejalashtirilgan)

### AI
- **Anthropic Claude API** - sun'iy intellekt
- **RAG arxitekturasi** - ma'lumotlar bazasi + AI
- **Custom prompt engineering** - maxsus promptlar

### Frontend
- **React 18** - foydalanuvchi interfeysi
- **Tailwind CSS** - dizayn
- **Axios** - API so'rovlari

### Xavfsizlik & Deployment
- **HTTPS** - shifrlangan aloqa
- **SSL sertifikat** - Let's Encrypt
- **JWT** - xavfsiz autentifikatsiya
- **Digital Ocean** - hosting
- **Nginx** - reverse proxy va static fayllar
- **Docker** - konteynerizatsiya

---

## 🏗️ Tizim Arxitekturasi
```
Bemor/Doktor
     ↓
[HTTPS/SSL shifrlangan aloqa]
     ↓
  Nginx
     ↓
React Frontend ←→ Django Backend ←→ PostgreSQL
                       ↓
                  AI API (Claude)
                       ↓
                     Redis
```

---

## 🔒 Xavfsizlik

- ✅ HTTPS protokoli - barcha aloqa shifrlangan
- ✅ SSL sertifikat - ma'lumotlar xavfsizligi
- ✅ JWT autentifikatsiya - xavfsiz token
- ✅ Rol asosida ruxsat - har kim o'z ma'lumotlarini ko'radi
- ✅ Parol shifrlash - Django standart xavfsizligi
- ✅ SQL injection himoyasi - Django ORM
- ✅ XSS himoyasi - avtomatik himoya
- ✅ CSRF himoyasi - Django middleware

---

## 📊 Asosiy Xususiyatlar

### Race Condition Oldini Olish
Database-level qulflash orqali ikki bemor bir vaqtning o'zida bir xil navbatni ololmaydi

### RAG Implementation
Ma'lumotlar bazasidagi real bemor ma'lumotlari + AI tahlili = aniq va kontekstga mos javoblar

### Production-ready
HTTPS, SSL, custom domen bilan to'liq ishlab turgan tizim

### Real foydalanuvchilar
Haqiqiy bemorlar va doktorlar uchun ishlab chiqilgan va test qilingan

---

## 🎯 Muammoning Yechimi

**Muammo:** An'anaviy klinikalarda navbat olish qiyin, qog'oz retseptlar yo'qoladi, tibbiy tarix tarqoq

**Yechim:** 
- Online navbat tizimi - telefon qilish shart emas
- Raqamli retseptlar - QR kod bilan aptekada tez xizmat
- AI yordamchi - oddiy savollarga 24/7 javob
- Markazlashgan tibbiy ma'lumotlar - hamma narsa bir joyda

---

## 📈 Natijalar

- Navbat konfliktlari 100% kamaydi (race condition yo'q)
- AI oddiy tibbiy savollarga avtomatik javob beradi
- Raqamli retseptlar apteka xatolarini kamaytiradi
- Bemorlar istalgan vaqt o'z tibbiy tarixini ko'rishlari mumkin
- Doktorlar bemorning to'liq tarixiga bir klikda kirishlari mumkin

---

## 👨‍💻 Muallif

**[Sizning Ismingiz]**

GitHub: xusanboyf32  
Email: inomov4084@gmail.com  
LinkedIn: [linkedin.com/in/username]

---

## 📄 Litsenziya

MIT License

---

⭐ Agar loyiha foydali bo'lsa, star bering!
