from celery import shared_task
from groq import Groq
import os


@shared_task
def ai_javob_ber(savol):
    client = Groq(api_key=os.environ.get('GROQ_API_KEY'))

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": "Sen poliklinika AI yordamchisisisan. Bemorga yordam ber."
            },
            {
                "role": "user",
                "content": savol
            }
        ]
    )
    return response.choices[0].message.content
