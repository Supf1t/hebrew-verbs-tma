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
let userStats = { learned: [], counts: {} };

// Обертка для хранилища (CloudStorage для ТГ, localStorage для браузера)
const storage = {
    save: (key, value) => {
        if (tg.isExpanded !== undefined && tg.CloudStorage) {
            tg.CloudStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    },
    load: (key, callback) => {
        if (tg.isExpanded !== undefined && tg.CloudStorage) {
            tg.CloudStorage.getItem(key, (err, val) => {
                callback(val ? JSON.parse(val) : null);
            });
        } else {
            const val = localStorage.getItem(key);
            callback(val ? JSON.parse(val) : null);
        }
    }
};

function initApp() {
    const select = document.getElementById('group-select');
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        select.appendChild(opt);
    });
    
    // Загружаем статистику
    storage.load('verbs_stats', (data) => {
        if (data) userStats = data;
        updateProgressUI();
        nextQuestion();
    });
}

function updateProgressUI() {
    const total = verbsData.length;
    const learned = userStats.learned.length;
    const progressEl = document.getElementById('progress-text');
    if(progressEl) progressEl.textContent = `Выучено: ${learned} / ${total}`;
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
    document.getElementById('ai-section').style.display = 'none';
    
    // Фильтруем по группе
    let pool = currentGroup === 0 ? verbsData : verbsData.filter(w => w.groupId === currentGroup);
    
    // Пытаемся давать невыученные слова чаще (80% шанс)
    let unlearnedPool = pool.filter(w => !userStats.learned.includes(w.id));
    if (unlearnedPool.length === 0) unlearnedPool = pool; // Если все выучены, повторяем все
    
    let targetPool = (Math.random() < 0.8 && unlearnedPool.length > 0) ? unlearnedPool : pool;
    
    currentWord = targetPool[Math.floor(Math.random() * targetPool.length)];
    
    // Выбираем 3 неправильных варианта
    let wrongOptions = getRandomWords(pool, 3, currentWord);
    if (wrongOptions.length < 3) {
        wrongOptions = getRandomWords(verbsData, 3, currentWord);
    }
    
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
        updateStats(true);
    } else {
        tg.HapticFeedback.notificationOccurred('error');
        updateStats(false);
    }
    
    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('ai-section').style.display = 'block'; 
}

function updateStats(isCorrect) {
    const wid = currentWord.id;
    if (!userStats.counts[wid]) userStats.counts[wid] = { c: 0, w: 0 };
    
    if (isCorrect) {
        userStats.counts[wid].c += 1;
        // Если ответил правильно 3 раза и ни разу не ошибся (или баланс +3), считаем выученным
        if (userStats.counts[wid].c - userStats.counts[wid].w >= 3 && !userStats.learned.includes(wid)) {
            userStats.learned.push(wid);
        }
    } else {
        userStats.counts[wid].w += 1;
        // Если ошибся, убираем из выученных
        userStats.learned = userStats.learned.filter(id => id !== wid);
    }
    
    storage.save('verbs_stats', userStats);
    updateProgressUI();
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
window.onclick = function (event) {
    const modal = document.getElementById('ai-modal');
    if (event.target == modal) closeModal();
}
