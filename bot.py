import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Вставьте ваш токен сюда
BOT_TOKEN = "8608977060:AAHa8TP0Mk6RxgGERhUqbufvkr5bvDG1Xfg"
# Ссылка на веб-приложение (позже заменим на реальный URL, например ngrok или GitHub Pages)
WEBAPP_URL = "https://google.com"

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

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

async def main():
    print("Бот запущен...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
