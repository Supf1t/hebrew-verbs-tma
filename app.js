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
    storage.load('custom_verbs', (customData) => {
        if (customData && customData.length > 0) {
            // Восстанавливаем динамические группы
            const cGroups = {};
            customData.forEach(w => {
                if (w.groupId && w.groupName && !cGroups[w.groupId]) {
                    cGroups[w.groupId] = w.groupName;
                }
            });
            Object.keys(cGroups).forEach(gId => {
                groups.push({ id: parseInt(gId), name: cGroups[gId], color: '#8b5cf6' });
            });
            verbsData.push(...customData);
        }

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
    });
}

function updateProgressUI() {
    let pool = currentGroup === 0 ? verbsData : verbsData.filter(w => w.groupId === currentGroup);
    const total = pool.length;
    const learned = pool.filter(w => userStats.learned.includes(w.id)).length;
    const progressEl = document.getElementById('progress-text');
    if(progressEl) progressEl.textContent = `Выучено в группе: ${learned} / ${total}`;
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
    if (isDictView) renderDictionary();
}

let isDictView = false;
function toggleDictionary() {
    isDictView = !isDictView;
    if (isDictView) {
        document.getElementById('quiz-view').style.display = 'none';
        document.getElementById('dict-view').style.display = 'block';
        document.getElementById('dict-btn').textContent = "⬅️ К викторине";
        renderDictionary();
    } else {
        document.getElementById('quiz-view').style.display = 'block';
        document.getElementById('dict-view').style.display = 'none';
        document.getElementById('dict-btn').textContent = "📚 Мой словарь";
    }
}

function renderDictionary() {
    let pool = currentGroup === 0 ? verbsData : verbsData.filter(w => w.groupId === currentGroup);
    
    // Сначала невыученные, потом выученные
    const sorted = [...pool].sort((a, b) => {
        const aL = userStats.learned.includes(a.id);
        const bL = userStats.learned.includes(b.id);
        return aL - bL; 
    });

    const content = sorted.map(w => {
        const isLearned = userStats.learned.includes(w.id);
        return `
            <div class="dict-item">
                <div style="text-align: left;">
                    <div style="font-size: 24px; font-family: 'David', sans-serif; font-weight: bold; margin-bottom: 4px;">${w.hebrew}</div>
                    <div style="font-size: 16px; opacity: 0.9;">${w.russian}</div>
                </div>
                <div style="text-align: right;">
                    <div style="margin-bottom: 8px;">
                        <span class="dict-status ${isLearned ? 'status-learned' : 'status-learning'}">
                            ${isLearned ? '✓ Выучено' : 'Учим'}
                        </span>
                    </div>
                    <button onclick="speakHebrew('${w.hebrew}', event)" style="background: none; border: none; font-size: 22px; cursor: pointer;">🔊</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('dict-content').innerHTML = content;
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

    updateProgressUI();
    renderQuiz();
}

function speakHebrew(text, event) {
    if (event) event.stopPropagation(); // Чтобы не нажималась кнопка ответа
    if ('speechSynthesis' in window) {
        // Отменяем предыдущую озвучку
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        // Немного замедлим, чтобы было понятнее новичкам
        utterance.rate = 0.85; 
        window.speechSynthesis.speak(utterance);
    } else {
        tg.showAlert("Озвучка не поддерживается на этом устройстве");
    }
}

function renderQuiz() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = `
        <h2 style="margin-bottom: 24px; font-size: 32px; font-weight: bold;">${currentWord.russian}</h2>
        ${currentOptions.map((opt, index) => `
            <div style="display: flex; gap: 8px; margin: 10px 0;">
                <button class="quiz-option" style="margin: 0;" id="btn-${index}" onclick="checkAnswer(${opt.correct}, ${index})">
                    ${opt.hebrew}
                </button>
                <button onclick="speakHebrew('${opt.hebrew}', event)" style="background: var(--bg-color); border: 1px solid var(--primary-color); border-radius: 8px; padding: 0 15px; cursor: pointer; font-size: 20px; transition: 0.2s;">
                    🔊
                </button>
            </div>
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
        // Если ответил правильно 5 раз и ни разу не ошибся (или баланс +5), считаем выученным
        if (userStats.counts[wid].c - userStats.counts[wid].w >= 5 && !userStats.learned.includes(wid)) {
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
const BACKEND_URL = "https://hebrew-verbs-tma.onrender.com"; // Постоянный адрес на Render

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

// AI Word Generation
function openGenModal() {
    tg.HapticFeedback.impactOccurred('medium');
    document.getElementById('gen-modal').style.display = 'block';
    document.getElementById('gen-status').textContent = '';
    document.getElementById('gen-topic').value = '';
    document.getElementById('gen-amount').value = '10';
}

function closeGenModal() {
    document.getElementById('gen-modal').style.display = 'none';
}

async function generateWords() {
    const topic = document.getElementById('gen-topic').value.trim();
    const amount = document.getElementById('gen-amount').value || 10;
    
    if (!topic) {
        document.getElementById('gen-status').textContent = "Введите тему!";
        return;
    }
    
    const statusEl = document.getElementById('gen-status');
    statusEl.textContent = "ИИ думает... Это займет 10-20 секунд.";
    
    const promptStr = `Сгенерируй ${amount} глаголов на тему: ${topic}`;
    
    try {
        const response = await fetch(`${BACKEND_URL}/generate-words`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptStr })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        if (!data.words || data.words.length === 0) throw new Error("Пустой ответ от ИИ");
        
        const newGroupId = Date.now(); // Уникальный ID для новой группы
        const groupName = "✨ " + topic;
        
        const newVerbs = data.words.map((w, i) => ({
            id: 'c_' + newGroupId + '_' + i,
            groupId: newGroupId,
            groupName: groupName, // Сохраняем имя группы прямо в слове
            hebrew: w.hebrew,
            russian: w.russian
        }));
        
        storage.load('custom_verbs', (existing) => {
            const allCustom = (existing || []).concat(newVerbs);
            storage.save('custom_verbs', allCustom);
            
            // Создаем новую группу
            groups.push({ id: newGroupId, name: groupName, color: '#8b5cf6' });
            
            // Добавляем в выпадающий список
            const select = document.getElementById('group-select');
            const opt = document.createElement('option');
            opt.value = newGroupId;
            opt.textContent = groupName;
            select.appendChild(opt);
            
            verbsData.push(...newVerbs);
            
            statusEl.textContent = `Группа "${topic}" (${newVerbs.length} слов) успешно создана!`;
            setTimeout(() => {
                closeGenModal();
                if (isDictView) renderDictionary();
            }, 2000);
        });
        
    } catch(e) {
        statusEl.textContent = "Ошибка: " + e.message;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Закрытие модалок при клике вне
window.onclick = function (event) {
    const aiModal = document.getElementById('ai-modal');
    const genModal = document.getElementById('gen-modal');
    if (event.target == aiModal) closeModal();
    if (event.target == genModal) closeGenModal();
}
