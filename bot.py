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

from contextlib import asynccontextmanager

# Управление жизненным циклом (запускаем бота вместе с сервером)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Запускаем бота...")
    # Удаляем вебхук, чтобы поллинг работал корректно
    await bot.delete_webhook(drop_pending_updates=True)
    task = asyncio.create_task(dp.start_polling(bot))
    yield
    print("Останавливаем бота...")
    task.cancel()
    await bot.session.close()

# Инициализация API сервера (FastAPI)
app = FastAPI(lifespan=lifespan)

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

@app.post("/generate-words")
async def generate_words(data: dict = Body(...)):
    prompt = data.get("prompt", "10 популярных глаголов")
    
    sys_prompt = (
        "Ты — генератор контента. Сгенерируй список глаголов на иврите. "
        "Верни ответ СТРОГО в формате JSON. Массив объектов с ключами 'hebrew' и 'russian'. "
        "Пример: [{\"hebrew\": \"כָּתַב\", \"russian\": \"писать\"}]"
    )
    
    try:
        response = await ai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" if "JSON" in sys_prompt else "text" },
            max_tokens=800,
            temperature=0.7
        )
        
        # В режиме json_object ИИ может вернуть объект {"words": [...]} или просто массив
        import json
        res_data = json.loads(response.choices[0].message.content)
        
        # Если ИИ завернул всё в ключ (бывает в json_mode), достаем его
        if isinstance(res_data, dict):
            for key in ["words", "verbs", "result"]:
                if key in res_data:
                    return {"words": res_data[key]}
            # Если ключей нет, но это один объект (ошибка ИИ), берем значения
            if len(res_data) == 1:
                val = list(res_data.values())[0]
                if isinstance(val, list): return {"words": val}
            return {"words": [res_data]} # fallback
            
        return {"words": res_data}
    except Exception as e:
        return {"error": str(e)}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
