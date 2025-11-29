// API endpoint для создания тестового периода
const API_URL = 'https://new-landing-production.up.railway.app/api';

// Username Telegram бота
const BOT_USERNAME = 'MoreVkusovBot';

// DOM элементы
const trialForm = document.getElementById('trialForm');
const telegramUsernameInput = document.getElementById('telegramUsername');
const trialButton = document.getElementById('trialButton');
const trialButtonText = document.getElementById('trialButtonText');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const successAlert = document.getElementById('successAlert');
const successMessage = document.getElementById('successMessage');

// Обработка изменения username
telegramUsernameInput.addEventListener('input', (e) => {
    let value = e.target.value.trim();
    // Убираем @ если пользователь его указал
    if (value.startsWith('@')) {
        value = value.substring(1);
        e.target.value = value;
    }
    hideAlerts();
});

// Скрытие алертов
function hideAlerts() {
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
}

// Показ ошибки
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
    successAlert.style.display = 'none';
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показ успеха
function showSuccess(message) {
    successMessage.innerHTML = message;
    successAlert.style.display = 'flex';
    errorAlert.style.display = 'none';
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Обработка отправки формы
trialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();
    
    const username = telegramUsernameInput.value.trim();
    
    // Валидация
    if (!username) {
        showError('Пожалуйста, укажите Telegram username');
        return;
    }
    
    // Проверка формата username
    if (!/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
        showError('Некорректный формат Telegram username. Используйте только буквы, цифры и подчеркивание (5-32 символа)');
        return;
    }
    
    // Показываем состояние загрузки
    trialButton.disabled = true;
    trialButtonText.textContent = 'Активируем тестовый период...';
    
    try {
        const response = await fetch(`${API_URL}/create_trial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_username: username.toLowerCase(),
            }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Обработка ошибок
            if (data.error) {
                if (data.error.includes('уже есть активная подписка') || data.error.includes('уже есть тестовый период')) {
                    showError(`У вас уже есть активная подписка или тестовый период. Если вам нужно продлить или изменить тариф, сделайте это через нашего <a href="https://t.me/${BOT_USERNAME}" target="_blank" style="color: inherit; text-decoration: underline;">Telegram бота</a>.`);
                } else {
                    showError(data.error || 'Произошла ошибка при активации тестового периода');
                }
            } else {
                showError('Произошла ошибка при активации тестового периода');
            }
            trialButton.disabled = false;
            trialButtonText.textContent = 'Активировать тестовый период';
            return;
        }
        
        // Успешная активация
        const successMsg = `
            <div style="line-height: 1.8;">
                <div style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #00C853;">
                    ✅ Тестовый период активирован!
                </div>
                
                <div style="margin-bottom: 24px; padding: 16px; background: rgba(0, 200, 83, 0.1); border-radius: 8px; border-left: 4px solid #00C853;">
                    Тестовый период для <strong>@${username}</strong> действует <strong>3 дня</strong> с момента активации.
                </div>
                
                <div style="margin-bottom: 16px;">
                    <strong style="font-size: 16px;">📱 Чтобы начать использовать тестовый период:</strong>
                </div>
                
                <ol style="margin: 0 0 24px 20px; padding: 0; line-height: 2;">
                    <li style="margin-bottom: 8px;">
                        Перейдите в нашего <a href="https://t.me/${BOT_USERNAME}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: 600;">Telegram бота</a>
                    </li>
                    <li style="margin-bottom: 8px;">
                        Нажмите команду <strong>/start</strong>
                    </li>
                    <li style="margin-bottom: 8px;">
                        Загрузите Excel файл и получите заявку!
                    </li>
                </ol>
                
                <div style="margin-top: 24px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; font-size: 14px; color: rgba(26, 26, 46, 0.8);">
                    💡 Вы получите уведомление за 1 день до окончания тестового периода.
                </div>
            </div>
        `;
        showSuccess(successMsg);
        
        // Очищаем форму
        telegramUsernameInput.value = '';
        trialButton.disabled = true;
        trialButtonText.textContent = 'Тестовый период активирован';
        
    } catch (error) {
        console.error('Ошибка при активации тестового периода:', error);
        showError('Произошла ошибка при подключении к серверу. Пожалуйста, попробуйте позже.');
        trialButton.disabled = false;
        trialButtonText.textContent = 'Активировать тестовый период';
    }
});

