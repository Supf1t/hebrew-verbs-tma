// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

if (tg.colorScheme === 'dark') {
    document.body.classList.add('tg-dark');
}

let currentGroup = 0;
let currentWord = null;
let currentOptions = [];
let isAnswered = false;

function initApp() {
    const select = document.getElementById('group-select');
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        select.appendChild(opt);
    });
    nextQuestion();
}

function changeGroup() {
    const select = document.getElementById('group-select');
    currentGroup = parseInt(select.value);
    
    if (currentGroup !== 0) {
        const groupInfo = groups.find(g => g.id === currentGroup);
        document.documentElement.style.setProperty('--primary-color', groupInfo.color);
    } else {
        document.documentElement.style.setProperty('--primary-color', '#3b82f6');
    }
    nextQuestion();
}

function getRandomWords(wordsArray, count, excludeWord) {
    const filtered = wordsArray.filter(w => w.id !== excludeWord.id);
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function nextQuestion() {
    isAnswered = false;
    document.getElementById('next-btn').style.display = 'none';
    
    // Фильтруем по группе
    let pool = currentGroup === 0 ? verbsData : verbsData.filter(w => w.groupId === currentGroup);
    
    // Выбираем случайное правильное слово
    currentWord = pool[Math.floor(Math.random() * pool.length)];
    
    // Выбираем 3 неправильных варианта из той же группы (или глобально, если мало слов)
    let wrongOptions = getRandomWords(pool, 3, currentWord);
    if (wrongOptions.length < 3) {
        wrongOptions = getRandomWords(verbsData, 3, currentWord); // добираем из глобального пула
    }
    
    // Собираем варианты и перемешиваем
    currentOptions = [
        { ...currentWord, correct: true },
        ...wrongOptions.map(w => ({ ...w, correct: false }))
    ].sort(() => 0.5 - Math.random());

    renderQuiz();
}

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <h2 style="margin-bottom: 24px; font-size: 32px; font-weight: bold;">${currentWord.russian}</h2>
        ${currentOptions.map((opt, index) => `
            <button class="quiz-option" id="btn-${index}" onclick="checkAnswer(${opt.correct}, ${index})">
                ${opt.hebrew}
            </button>
        `).join('')}
    `;
}

function checkAnswer(isCorrect, index) {
    if (isAnswered) return;
    isAnswered = true;

    // Показываем правильный и неправильный (если ошиблись)
    currentOptions.forEach((opt, i) => {
        const btn = document.getElementById(`btn-${i}`);
        if (opt.correct) {
            btn.style.backgroundColor = '#10b981'; // Зеленый
            btn.style.color = 'white';
        } else if (i === index && !isCorrect) {
            btn.style.backgroundColor = '#ef4444'; // Красный
            btn.style.color = 'white';
        } else {
            btn.style.opacity = '0.6';
        }
    });

    if (isCorrect) {
        tg.HapticFeedback.notificationOccurred('success');
    } else {
        tg.HapticFeedback.notificationOccurred('error');
    }
    
    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('ai-section').style.display = 'block'; // Показываем ИИ только после ответа
}

// AI Functions
const BACKEND_URL = "https://cavalry-amends-nimble.ngrok-free.dev"; // Обновлено через ngrok

function showAiMenu() {
    document.getElementById('ai-modal').style.display = 'block';
    backToAiMenu();
}

function closeModal() {
    document.getElementById('ai-modal').style.display = 'none';
}

function backToAiMenu() {
    document.getElementById('ai-menu').style.display = 'block';
    document.getElementById('ai-response').style.display = 'none';
}

async function askAi(type) {
    document.getElementById('ai-menu').style.display = 'none';
    document.getElementById('ai-response').style.display = 'block';
    document.getElementById('ai-text').textContent = "ИИ думает...";

    try {
        const response = await fetch(`${BACKEND_URL}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: currentWord.hebrew,
                russian: currentWord.russian,
                type: type
            })
        });
        const data = await response.json();
        document.getElementById('ai-text').innerHTML = data.answer.replace(/\n/g, '<br>');
    } catch (e) {
        document.getElementById('ai-text').textContent = "Ошибка: не удалось связаться с ИИ. Проверьте, запущен ли бот и туннель.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Закрытие модалки при клике вне её
window.onclick = function(event) {
    const modal = document.getElementById('ai-modal');
    if (event.target == modal) closeModal();
}
