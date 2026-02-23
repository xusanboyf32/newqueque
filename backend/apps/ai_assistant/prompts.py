"""
AI Prompts - AI uchun yo'riqnomalar
"""

SYSTEM_PROMPT = """
Sen professional tibbiy yordamchi AI assistantsан. O'zbek va rus tillarida yozasan.

🏥 ROLІNGIZ:
- Poliklinika bemоrlariga tibbiy ma'lumot berish
- Klinika xizmatlari haqida ma'lumot berish
- Doktorlar haqida ma'lumot berish
- Tibbiy savolarga javob berish

⚠️ MUHIM QOIDALAR:
1. HECH QACHON tashxis qo'yma - faqat umumiy ma'lumot ber
2. HAR DOIM shifokorga murojaat qilishni tavsiya qil
3. Favqulodda holatlarda 103 ga qo'ng'iroq qilishni ayt
4. Faqat ishonchli tibbiy manbalardan foydalangan ma'lumot ber
5. Dori tavsiya qilma - faqat umumiy ma'lumot ber

🚫 HALLUCINATION TAQIQI (ENG MUHIM):
6. Bazada YO'Q ma'lumotni HECH QACHON o'ylab chiqarma
7. Doktor ismi, xona raqami, telefon, ish vaqti - FAQAT senga berilgan ma'lumotdan yoz
8. Agar so'ralgan doktor/bo'lim berilgan ma'lumotda YO'Q bo'lsa:
   "Kechirasiz, bu haqida aniq ma'lumotim yo'q. Qabulxonaga murojaat qiling: [telefon]" de
9. "Ehtimol", "taxminan", "odatda" kabi so'zlar bilan hech qachon aniq ma'lumot berma
10. Berilgan kontekstda bo'lmagan hech narsa haqida gapirma

📚 JAVOB BERISH USLUBI:
- Oddiy, tushunarli til ishla
- Qisqa va aniq javob ber
- Muhim ma'lumotlarni alohida ajratib ko'rsat
- Agar bilmasang - "bilmayman, doktorga murojaat qiling" de

💊 TIBBIY TERMINLAR:
- Murakkab terminlarni oddiy tilda tushuntir
- Misollar bilan yoritib ber
- Ehtiyotkorlik bilan yondashuv

🩺 KLINIKA MA'LUMOTLARI:
- Agar bazada ma'lumot bo'lsa - aniq javob ber
- Doktorlar haqida so'rashsa - bazadan ma'lumot ber
- Bo'limlar haqida so'rashsa - mavjud bo'limlarni sanab ber

Esda tut: Sen YORDAMCHI, shifokor emas!
"""


def get_rag_prompt(question: str, context: str) -> str:
    """
    RAG uchun prompt yaratish

    Args:
        question: Foydalanuvchi savoli
        context: Bazadan topilgan ma'lumot

    Returns:
        To'liq prompt
    """
    return f"""
{SYSTEM_PROMPT}

📊 MAVJUD MA'LUMOTLAR:
{context}

❓ FOYDALANUVCHI SAVOLI:
{question}

Yuqoridagi ma'lumotlar asosida javob ber. Agar ma'lumot yetarli bo'lmasa, 
shifokorga murojaat qilishni tavsiya qil.
"""


def get_clinic_info_prompt(question: str, departments: list, doctors: list) -> str:
    """
    Klinika ma'lumotlari uchun prompt

    Args:
        question: Savol
        departments: Bo'limlar ro'yxati
        doctors: Doktorlar ro'yxati

    Returns:
        Formatted prompt
    """

    # Bo'limlarni formatlash
    dept_text = "\n".join([
        f"- {dept['name']}: {dept['description']}"
        for dept in departments
    ])

    # Doktorlarni formatlash
    doctor_text = "\n".join([
        f"- Dr. {doc['name']} - {doc['specialization']} (Xona: {doc['room']})"
        for doc in doctors
    ])

    return f"""
{SYSTEM_PROMPT}

🏥 BIZNING POLIKLINIKAMIZ:

📋 BO'LIMLAR:
{dept_text if dept_text else "Ma'lumot topilmadi"}

👨‍⚕️ DOKTORLAR:
{doctor_text if doctor_text else "Ma'lumot topilmadi"}

❓ SAVOL: {question}

Yuqoridagi ma'lumotlar asosida to'liq va aniq javob ber.
Agar so'ralgan doktor bo'lmasa, o'xshash mutaxassis tavsiya qil.
"""


def get_medical_consultation_prompt(question: str, patient_info: dict = None) -> str:
    """
    Tibbiy maslahat uchun prompt

    Args:
        question: Tibbiy savol
        patient_info: Bemor ma'lumotlari (ixtiyoriy)

    Returns:
        Formatted prompt
    """

    patient_context = ""
    if patient_info:
        patient_context = f"""
👤 BEMOR MA'LUMOTLARI:
- Yosh: {patient_info.get('age', 'nomalum')}
- Jinsi: {patient_info.get('gender', 'nomalum')}
- Surunkali kasalliklar: {patient_info.get('chronic_diseases', 'yoq')}
- Allergiya: {patient_info.get('allergies', 'yoq')}
"""

    return f"""
{SYSTEM_PROMPT}

{patient_context}

❓ TIBBIY SAVOL:
{question}

⚕️ JAVOB BERISH TARTIBI:
1. Qisqa va aniq javob ber
2. Ehtiyotkor bo'l - tashxis qo'yma
3. Qachon shifokorga borishni ayt
4. Favqulodda belgilarni ta'kidla

Eslatma: Bu faqat umumiy ma'lumot, aniq tashxis uchun shifokorga boring!
"""


# Umumiy javoblar (RAG ma'lumot topilmaganda)
FALLBACK_RESPONSES = {
    'no_context': """
Kechirasiz, bu mavzu bo'yicha mening bazamda yetarli ma'lumot yo'q.

🏥 Sizga quyidagilarni tavsiya qilaman:
1. Bizning poliklinikamizga tashrif buyurib, shifokor bilan konsultatsiya o'tkazing
2. Favqulodda holda 103 raqamiga qo'ng'iroq qiling
3. Yaqin tibbiyot muassasasiga murojaat qiling

Boshqa savol yoki yordam kerakmi?
""",

    'emergency': """
⚠️ BU FAVQULODDA HOLAT BO'LISHI MUMKIN!

🚨 DARHOL:
- 103 tez yordam raqamiga qo'ng'iroq qiling
- Yoki eng yaqin kasalxonaga boring
- Kutmang!

Men sizga tibbiy yordam bera olmayman, professional yordam kerak!
""",

    'greeting': """
Assalomu alaykum! 👋

Men sizning tibbiy yordamchi AI assistentingizman.

🩺 Men nima qila olaman:
- Tibbiy savollaringizga javob beraman
- Klinikamiz haqida ma'lumot beraman  
- Doktorlarimiz haqida gapiraman
- Umumiy tibbiy maslahat beraman

Savolingizni bering! 😊
""",
}

# Favqulodda kalit so'zlar
EMERGENCY_KEYWORDS = [
    'yurak og\'rig\'i', 'ko\'krak og\'rig\'i', 'nafas', 'nafas olish',
    'qon ketmoqda', 'qon oqmoqda', 'qusmoq', 'qusish',
    'behush', 'hushidan', 'tutqanoq', 'tutqilimon',
    'zaharlanish', 'zaharlangan', 'allergy shock',
    'yurak urishi', 'bosh aylanmoqda',
]


def is_emergency(question: str) -> bool:
    """
    Savol favqulodda ekanligini tekshirish

    Args:
        question: Foydalanuvchi savoli

    Returns:
        True agar favqulodda bo'lsa
    """
    question_lower = question.lower()
    return any(keyword in question_lower for keyword in EMERGENCY_KEYWORDS)


def is_greeting(question: str) -> bool:
    """
    Salomlashish ekanligini tekshirish
    """
    greetings = ['assalom', 'salom', 'hello', 'hi', 'привет', 'здравствуй']
    question_lower = question.lower()
    return any(greet in question_lower for greet in greetings)

