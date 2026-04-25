import asyncio
import logging
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from openai import AsyncOpenAI

# Загрузка переменных окружения
load_dotenv()
BOT_TOKEN = "8608977060:AAHa8TP0Mk6RxgGERhUqbufvkr5bvDG1Xfg"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Ссылка на веб-приложение
WEBAPP_URL = "https://supf1t.github.io/hebrew-verbs-tma/"

logging.basicConfig(level=logging.INFO)

# Инициализация бота и ИИ
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
ai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Инициализация API сервера (FastAPI)
app = FastAPI()

# Настройка CORS, чтобы WebApp мог делать запросы к боту
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ai")
async def ai_request(data: dict = Body(...)):
    word = data.get("word")
    russian = data.get("russian")
    req_type = data.get("type")
    
    prompts = {
        "example": f"Приведи 2 коротких примера предложения с глаголом '{word}' ({russian}) на иврите с огласовками и переводом на русский. Пиши кратко.",
        "plural": f"Напиши формы множественного числа (мужской и женский род) для глагола '{word}' на иврите с огласовками и переводом.",
        "binyan": f"Какой биньян у глагола '{word}'? Объясни кратко его структуру и особенности."
    }
    
    prompt = prompts.get(req_type, f"Расскажи про глагол {word}")
    
    try:
        response = await ai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты — помощник по изучению иврита. Отвечай кратко, всегда используй огласовки (никудот) для иврита."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )
        return {"answer": response.choices[0].message.content}
    except Exception as e:
        return {"answer": f"Ошибка ИИ: {str(e)}"}

@dp.message(CommandStart())
async def start_cmd(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.button(
        text="Учить глаголы 🚀",
        web_app=WebAppInfo(url=WEBAPP_URL)
    )
    
    await message.answer(
        "Шалом! 👋\nЭто бот для изучения ивритских глаголов.\nЖми кнопку ниже, чтобы начать викторину!",
        reply_markup=builder.as_markup()
    )

async def run_bot():
    print("Бот запущен...")
    await dp.start_polling(bot)

async def run_api():
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    # Запускаем бота и API параллельно
    await asyncio.gather(run_bot(), run_api())

if __name__ == "__main__":
    asyncio.run(main())
