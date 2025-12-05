// API endpoint для создания платежа
const API_URL = 'https://new-landing-production.up.railway.app/api';

// Username Telegram бота
const BOT_USERNAME = 'MoreVkusovBot';

// DOM элементы
const tariffCards = document.querySelectorAll('.tariff-card');
const paymentForm = document.getElementById('paymentForm');
const telegramUsernameInput = document.getElementById('telegramUsername');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const selectedTariffField = document.getElementById('selectedTariffField');
const selectedTariffName = document.getElementById('selectedTariffName');
const selectedTariffPrice = document.getElementById('selectedTariffPrice');
const paymentButton = document.getElementById('paymentButton');
const paymentButtonText = document.getElementById('paymentButtonText');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const successAlert = document.getElementById('successAlert');
const successMessage = document.getElementById('successMessage');
const subscriptionExistsAlert = document.getElementById('subscriptionExistsAlert');
const subscriptionExistsMessage = document.getElementById('subscriptionExistsMessage');
const yookassaWidgetContainer = document.getElementById('yookassa-widget-container');
const manualPaymentInfo = document.getElementById('manualPaymentInfo');
const paymentPurpose = document.getElementById('paymentPurpose');

// Выбранный тариф
let selectedTariff = null;

// Флаг существующей подписки
let hasActiveSubscription = false;

// Таймер для debounce проверки подписки
let subscriptionCheckTimer = null;

// Показ реквизитов для ручной оплаты
function showManualPayment() {
    if (selectedTariff) {
        paymentPurpose.textContent = `Подписка "${selectedTariff.name}" на месяц - ${selectedTariff.price} ₽`;
    }
    manualPaymentInfo.style.display = 'block';
    paymentForm.style.display = 'none';
    manualPaymentInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Автоматический выбор тарифа из URL параметра
function selectTariffFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const tariffParam = urlParams.get('tariff');
    
    if (tariffParam) {
        // Ищем карточку тарифа с нужным data-tariff
        const targetCard = Array.from(tariffCards).find(card => card.dataset.tariff === tariffParam);
        
        if (targetCard) {
            // Программно кликаем на карточку тарифа
            targetCard.click();
            // Прокручиваем к форме
            setTimeout(() => {
                paymentForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    selectTariffFromURL();
});

// Обработка выбора тарифа
tariffCards.forEach(card => {
    card.addEventListener('click', () => {
        // Убираем выделение с других карточек
        tariffCards.forEach(c => c.classList.remove('selected'));
        
        // Выделяем выбранную карточку
        card.classList.add('selected');
        
        // Сохраняем выбранный тариф
        selectedTariff = {
            id: card.dataset.tariff,
            name: card.dataset.name,
            price: parseInt(card.dataset.price, 10)  // Явно указываем основание 10
        };
        
        console.log('Выбран тариф:', selectedTariff);
        
        // Показываем выбранный тариф в форме
        selectedTariffName.textContent = selectedTariff.name;
        selectedTariffPrice.textContent = `${selectedTariff.price} ₽/месяц`;
        selectedTariffField.style.display = 'block';
        
        // Активируем кнопку оплаты, если телефон заполнен
        updatePaymentButton();
    });
});

// Обновление состояния кнопки оплаты
function updatePaymentButton() {
    const hasUsername = telegramUsernameInput.value.trim().length > 0;
    const hasTariff = selectedTariff !== null;
    
    // НЕ блокируем кнопку при наличии подписки - разрешаем смену тарифа
    paymentButton.disabled = !hasUsername || !hasTariff;
    
    if (hasTariff && hasUsername) {
        paymentButtonText.textContent = `Оплатить ${selectedTariff.price} ₽`;
    } else if (hasTariff) {
        paymentButtonText.textContent = 'Укажите Telegram username';
    } else {
        paymentButtonText.textContent = 'Выберите тариф';
    }
}

// Обработка изменения Telegram username
telegramUsernameInput.addEventListener('input', (e) => {
    // Убираем @ если пользователь ввел
    let value = e.target.value.trim();
    if (value.startsWith('@')) {
        value = value.substring(1);
    }
    e.target.value = value ? '@' + value : '';
    
    // Скрываем alert о подписке при изменении
    hasActiveSubscription = false;
    subscriptionExistsAlert.style.display = 'none';
    hideAlerts();
    updatePaymentButton();
    
    // Проверяем подписку с задержкой (debounce)
    if (subscriptionCheckTimer) {
        clearTimeout(subscriptionCheckTimer);
    }
    
    subscriptionCheckTimer = setTimeout(() => {
        const normalizedValue = value.toLowerCase().trim();
        if (normalizedValue.length >= 3) {
            checkSubscription(normalizedValue);
        } else {
            hasActiveSubscription = false;
            updatePaymentButton();
        }
    }, 800); // Проверка через 800ms после последнего ввода
});

// Обработка изменения номера телефона
phoneInput.addEventListener('input', (e) => {
    // Форматирование номера телефона
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.startsWith('8')) {
        value = '7' + value.substring(1);
    }
    
    if (value.startsWith('7')) {
        let formatted = '+7';
        if (value.length > 1) {
            formatted += ' (' + value.substring(1, 4);
        }
        if (value.length >= 4) {
            formatted += ') ' + value.substring(4, 7);
        }
        if (value.length >= 7) {
            formatted += '-' + value.substring(7, 9);
        }
        if (value.length >= 9) {
            formatted += '-' + value.substring(9, 11);
        }
        e.target.value = formatted;
    }
    
    hideAlerts();
});

// Скрытие алертов
function hideAlerts() {
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    subscriptionExistsAlert.style.display = 'none';
}

// Синхронная проверка подписки (используется перед отправкой формы)
async function checkSubscriptionSynchronous(username) {
    if (!username || username.length < 3) {
        return { hasSubscription: false };
    }
    
    const normalizedUsername = username.replace('@', '').toLowerCase().trim();
    
    try {
        console.log('Проверка подписки для:', normalizedUsername);
        const response = await fetch(`${API_URL}/check_subscription?username=${encodeURIComponent(normalizedUsername)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Ответ проверки подписки:', response.status, response.statusText);
        
        if (response.ok) {
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Ошибка парсинга JSON ответа:', e);
                const textResponse = await response.text();
                console.log('Текст ответа (не JSON):', textResponse);
                
                // Если ответ - просто текст или число
                if (textResponse === 'true' || textResponse === '1' || textResponse.trim().toLowerCase() === 'true') {
                    console.log('Подписка найдена (текстовый ответ)');
                    return { hasSubscription: true };
                }
                return { hasSubscription: false };
            }
            
            console.log('Данные синхронной проверки подписки:', JSON.stringify(data, null, 2));
            console.log('Тип данных:', typeof data);
            if (typeof data === 'object' && data !== null) {
                console.log('Ключи объекта:', Object.keys(data));
                console.log('Все значения объекта:', Object.entries(data));
            }
            
            // СНАЧАЛА проверяем тестовый период (приоритет перед подпиской)
            let hasTrial = false;
            let trialExpiresAt = null;
            
            if (typeof data === 'object' && data !== null) {
                // ПРИОРИТЕТ 1: Проверяем в объекте subscription (основной способ)
                if (data.subscription && typeof data.subscription === 'object') {
                    if (data.subscription.is_trial === true || data.subscription.is_trial === 1) {
                        hasTrial = true;
                        trialExpiresAt = data.subscription.trial_ends_at || data.subscription.trial_expiration_date || data.subscription.trial_expires || data.subscription.trial_end_date;
                    }
                }
                // ПРИОРИТЕТ 2: Проверяем на верхнем уровне (для обратной совместимости)
                if (!hasTrial && (data.has_trial === true || data.trial_active === true || data.is_trial === true || data.is_trial === 1)) {
                    hasTrial = true;
                    trialExpiresAt = data.trial_expires_at || data.trial_expiration_date || data.trial_expires || data.trial_end_date;
                } 
                // ПРИОРИТЕТ 3: Проверяем в объекте trial
                if (!hasTrial && data.trial && typeof data.trial === 'object') {
                    if (data.trial.active === true || data.trial.status === 'active' || data.trial.status === 'ACTIVE') {
                        hasTrial = true;
                        trialExpiresAt = data.trial.expires_at || data.trial.expiration_date || data.trial.expires || data.trial.end_date;
                    }
                }
            }
            
            console.log('Результат проверки тестового периода:', hasTrial ? 'АКТИВЕН' : 'НЕ АКТИВЕН');
            if (hasTrial && data.subscription) {
                console.log('Данные тестового периода:', {
                    is_trial: data.subscription.is_trial,
                    trial_ends_at: data.subscription.trial_ends_at
                });
            }
            
            // Если есть тестовый период, возвращаем информацию о нем (ПЕРЕД проверкой подписки)
            if (hasTrial) {
                console.log('Тестовый период активен, дата окончания:', trialExpiresAt);
                return {
                    hasSubscription: false,
                    hasTrial: true,
                    trialExpiresAt: trialExpiresAt
                };
            }
            
            // ТЕПЕРЬ проверяем подписку (только если тестового периода нет)
            let subscriptionExists = false;
            let subscriptionReason = '';
            
            // Если это объект (стандартный формат ответа API)
            if (typeof data === 'object' && data !== null) {
                // ПРИОРИТЕТ 1: Прямое поле has_subscription из API (самый надежный способ)
                if (data.has_subscription === true) {
                    subscriptionExists = true;
                    subscriptionReason = 'has_subscription === true (API)';
                }
                // ПРИОРИТЕТ 2: Проверяем наличие объекта subscription с активным статусом (НО НЕ тестовый период)
                else if (data.subscription && typeof data.subscription === 'object') {
                    // Проверяем, что это НЕ тестовый период
                    const isTrial = data.subscription.is_trial === true || data.subscription.is_trial === 1;
                    if (!isTrial && (data.subscription.status === 'active' || data.subscription.status === 'ACTIVE')) {
                        subscriptionExists = true;
                        subscriptionReason = 'subscription.status === active (не тестовый период)';
                    }
                }
                // ПРИОРИТЕТ 3: Проверяем success и наличие данных о подписке
                else if (data.success === true && (data.subscription || data.tariff_name || data.tariff)) {
                    subscriptionExists = true;
                    subscriptionReason = 'success === true и есть данные о подписке';
                }
                // ПРИОРИТЕТ 4: Проверяем другие возможные поля
                else if (data.subscription_exists === true) {
                    subscriptionExists = true;
                    subscriptionReason = 'subscription_exists === true';
                } else if (data.is_active === true) {
                    subscriptionExists = true;
                    subscriptionReason = 'is_active === true';
                } else if (data.active === true) {
                    subscriptionExists = true;
                    subscriptionReason = 'active === true';
                } else if (data.status && (data.status === 'active' || data.status === 'ACTIVE')) {
                    subscriptionExists = true;
                    subscriptionReason = 'status === active';
                }
            }
            // Если это просто boolean или строка
            else if (data === true || data === 'true' || data === 1 || data === '1') {
                subscriptionExists = true;
                subscriptionReason = 'boolean/string true';
            }
            // Если это массив - проверяем, не пустой ли он
            else if (Array.isArray(data) && data.length > 0) {
                subscriptionExists = true;
                subscriptionReason = 'непустой массив';
            }
            
            console.log('Результат синхронной проверки подписки:', subscriptionExists ? 'НАЙДЕНА' : 'НЕ НАЙДЕНА', subscriptionReason ? `(${subscriptionReason})` : '');
            
            if (subscriptionExists) {
                // Извлекаем информацию о тарифе и дате истечения (приоритет: из объекта subscription)
                const subscription = data.subscription || data;
                const tariffName = 
                    subscription.tariff_name || 
                    subscription.tariff || 
                    subscription.tariff_id ||
                    data.tariff_name || 
                    data.tariff || 
                    data.tariff_id ||
                    'активна';
                
                const expiresAt = 
                    subscription.expires_at || 
                    subscription.expiration_date || 
                    subscription.expires || 
                    subscription.end_date ||
                    data.expires_at || 
                    data.expiration_date || 
                    data.expires || 
                    data.end_date;
                
                console.log('Информация о подписке:', { tariffName, expiresAt });
                
                return {
                    hasSubscription: true,
                    tariffName: tariffName,
                    expiresAt: expiresAt
                };
            }
        } else {
            console.log('Ошибка ответа при проверке подписки:', response.status, response.statusText);
            let errorText = '';
            try {
                errorText = await response.text();
                console.log('Текст ошибки:', errorText);
            } catch (e) {
                console.error('Не удалось прочитать текст ошибки:', e);
            }
            
            // Если API вернул ошибку, но статус 404 или другой - это нормально, подписки нет
            // Но если это 500 или другая ошибка сервера - лучше не блокировать, но логировать
            if (response.status >= 500) {
                console.warn('Серверная ошибка при проверке подписки. Продолжаем, но с осторожностью.');
            }
        }
        
        return { hasSubscription: false };
    } catch (error) {
        console.error('Ошибка при синхронной проверке подписки:', error);
        console.error('Стек ошибки:', error.stack);
        // При ошибке сети или другого типа - логируем, но не блокируем оплату
        // Это предотвратит ложные блокировки при проблемах с сетью
        return { hasSubscription: false };
    }
}

// Проверка существующей подписки (с debounce, используется при вводе)
async function checkSubscription(username) {
    if (!username || username.length < 3) {
        hasActiveSubscription = false;
        hideAlerts();
        updatePaymentButton();
        return;
    }
    
    // Нормализуем username
    const normalizedUsername = username.replace('@', '').toLowerCase().trim();
    
    try {
        const response = await fetch(`${API_URL}/check_subscription?username=${encodeURIComponent(normalizedUsername)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Ответ API check_subscription:', JSON.stringify(data, null, 2));
            console.log('Тип данных:', typeof data);
            console.log('Ключи объекта:', Object.keys(data || {}));
            
            // СНАЧАЛА проверяем тестовый период (приоритет перед подпиской)
            let hasTrial = false;
            let trialExpiresAt = null;
            
            if (typeof data === 'object' && data !== null) {
                // ПРИОРИТЕТ 1: Проверяем в объекте subscription (основной способ)
                if (data.subscription && typeof data.subscription === 'object') {
                    if (data.subscription.is_trial === true || data.subscription.is_trial === 1) {
                        hasTrial = true;
                        trialExpiresAt = data.subscription.trial_ends_at || data.subscription.trial_expiration_date || data.subscription.trial_expires || data.subscription.trial_end_date;
                    }
                }
                // ПРИОРИТЕТ 2: Проверяем на верхнем уровне (для обратной совместимости)
                if (!hasTrial && (data.has_trial === true || data.trial_active === true || data.is_trial === true || data.is_trial === 1)) {
                    hasTrial = true;
                    trialExpiresAt = data.trial_expires_at || data.trial_expiration_date || data.trial_expires || data.trial_end_date;
                } 
                // ПРИОРИТЕТ 3: Проверяем в объекте trial
                if (!hasTrial && data.trial && typeof data.trial === 'object') {
                    if (data.trial.active === true || data.trial.status === 'active' || data.trial.status === 'ACTIVE') {
                        hasTrial = true;
                        trialExpiresAt = data.trial.expires_at || data.trial.expiration_date || data.trial.expires || data.trial.end_date;
                    }
                }
            }
            
            console.log('Тестовый период найден при вводе:', hasTrial);
            if (hasTrial && data.subscription) {
                console.log('Данные тестового периода:', {
                    is_trial: data.subscription.is_trial,
                    trial_ends_at: data.subscription.trial_ends_at
                });
            }
            
            // Если есть тестовый период, показываем специальное сообщение
            if (hasTrial) {
                hasActiveSubscription = false; // НЕ блокируем, но предупреждаем
                const formattedDate = trialExpiresAt ? new Date(trialExpiresAt).toLocaleDateString('ru-RU', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : '';
                
                let message = `<strong>⚠️ У вас активен тестовый период</strong><br>`;
                if (formattedDate) {
                    message += `Тестовый период действует до: <strong>${formattedDate}</strong><br>`;
                } else {
                    message += `Тестовый период активен<br>`;
                }
                message += `<br>Вы можете оплатить тариф сейчас - он активируется после окончания тестового периода.`;
                
                subscriptionExistsMessage.innerHTML = message;
                subscriptionExistsAlert.style.display = 'flex';
                errorAlert.style.display = 'none';
                successAlert.style.display = 'none';
                
                // НЕ блокируем кнопку оплаты - разрешаем оплату
                updatePaymentButton();
            } else {
                // ТЕПЕРЬ проверяем подписку (только если тестового периода нет)
                let subscriptionExists = false;
                
                // Если это объект (стандартный формат ответа API)
                if (typeof data === 'object' && data !== null) {
                    // ПРИОРИТЕТ 1: Прямое поле has_subscription из API (самый надежный способ)
                    if (data.has_subscription === true) {
                        subscriptionExists = true;
                    }
                    // ПРИОРИТЕТ 2: Проверяем наличие объекта subscription с активным статусом (НО НЕ тестовый период)
                    else if (data.subscription && typeof data.subscription === 'object') {
                        // Проверяем, что это НЕ тестовый период
                        const isTrial = data.subscription.is_trial === true || data.subscription.is_trial === 1;
                        if (!isTrial && (data.subscription.status === 'active' || data.subscription.status === 'ACTIVE')) {
                            subscriptionExists = true;
                        }
                    }
                    // ПРИОРИТЕТ 3: Проверяем success и наличие данных о подписке
                    else if (data.success === true && (data.subscription || data.tariff_name || data.tariff)) {
                        subscriptionExists = true;
                    }
                    // ПРИОРИТЕТ 4: Проверяем другие возможные поля
                    else if (data.subscription_exists === true || 
                             data.is_active === true || 
                             data.active === true ||
                             data.status === 'active' ||
                             data.status === 'ACTIVE') {
                        subscriptionExists = true;
                    }
                }
                // Если это просто boolean или строка
                else if (data === true || data === 'true' || data === 1 || data === '1') {
                    subscriptionExists = true;
                }
                // Если это массив - проверяем, не пустой ли он
                else if (Array.isArray(data) && data.length > 0) {
                    subscriptionExists = true;
                }
                
                console.log('Подписка найдена при вводе:', subscriptionExists);
                
                if (subscriptionExists) {
                    // Подписка существует - показываем информацию, но НЕ блокируем оплату
                    hasActiveSubscription = false; // НЕ блокируем, разрешаем смену тарифа
                    // Извлекаем информацию о тарифе и дате (приоритет: из объекта subscription)
                    const subscription = data.subscription || data;
                    const tariffName = subscription.tariff_name || subscription.tariff || data.tariff_name || data.tariff || 'активна';
                    const expiresAt = subscription.expires_at || subscription.expiration_date || data.expires_at || data.expiration_date;
                    const formattedDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ru-RU', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : '';
                    
                    let message = `<strong>ℹ️ У вас уже есть активная подписка</strong><br>`;
                    message += `Текущий тариф: <strong>${tariffName}</strong>`;
                    if (formattedDate) {
                        message += `<br>Действует до: <strong>${formattedDate}</strong>`;
                    }
                    message += `<br><br>Вы можете выбрать новый тариф и оплатить его - подписка будет обновлена автоматически.`;
                    
                    subscriptionExistsMessage.innerHTML = message;
                    subscriptionExistsAlert.style.display = 'flex';
                    errorAlert.style.display = 'none';
                    successAlert.style.display = 'none';
                    
                    // НЕ блокируем кнопку оплаты - разрешаем смену тарифа
                    updatePaymentButton();
                } else {
                    // Подписки нет
                    hasActiveSubscription = false;
                    subscriptionExistsAlert.style.display = 'none';
                    updatePaymentButton();
                }
            }
        } else {
            // Если endpoint не существует (404) или другая ошибка
            console.log('Ошибка при проверке подписки:', response.status, response.statusText);
            const errorText = await response.text().catch(() => '');
            console.log('Текст ошибки:', errorText);
            // Не блокируем, если API не доступен
            hasActiveSubscription = false;
            subscriptionExistsAlert.style.display = 'none';
            updatePaymentButton();
        }
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error);
        // При ошибке не блокируем оплату - возможно endpoint еще не реализован
        hasActiveSubscription = false;
        subscriptionExistsAlert.style.display = 'none';
        updatePaymentButton();
    }
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
    subscriptionExistsAlert.style.display = 'none';
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показ информации о существующей подписке
function showSubscriptionExists(message) {
    subscriptionExistsMessage.innerHTML = message || '<strong>У вас уже есть активная подписка</strong><br>Повторная оплата невозможна.';
    subscriptionExistsAlert.style.display = 'flex';
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    subscriptionExistsAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Обработка отправки формы
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();
    
    if (!selectedTariff) {
        showError('Пожалуйста, выберите тариф');
        return;
    }
    
    const telegramUsername = telegramUsernameInput.value.trim();
    if (!telegramUsername) {
        showError('Пожалуйста, укажите Telegram username');
        return;
    }
    
    // Нормализуем username (убираем @ если есть, приводим к нижнему регистру, убираем пробелы)
    const normalizedUsername = telegramUsername.replace('@', '').toLowerCase().trim();
    if (normalizedUsername.length < 3) {
        showError('Пожалуйста, укажите корректный Telegram username');
        return;
    }
    
    // ОБЯЗАТЕЛЬНАЯ проверка подписки перед отправкой формы
    console.log('=== НАЧАЛО ПРОВЕРКИ ПОДПИСКИ ===');
    console.log('Username для проверки:', normalizedUsername);
    paymentButton.disabled = true;
    paymentButtonText.textContent = 'Проверка подписки...';
    
    // Выполняем синхронную проверку подписки
    let subscriptionCheck;
    try {
        subscriptionCheck = await checkSubscriptionSynchronous(normalizedUsername);
        console.log('Результат проверки подписки:', subscriptionCheck);
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error);
        // При ошибке проверки НЕ блокируем оплату, но предупреждаем пользователя
        // Это предотвратит ложные блокировки при проблемах с сетью
        console.warn('⚠️ Не удалось проверить подписку из-за ошибки. Продолжаем оплату, но проверка будет выполнена на сервере.');
        paymentButton.disabled = false;
        updatePaymentButton();
        // НЕ возвращаемся - продолжаем создание платежа, сервер проверит подписку
    }
    
    // Если проверка прошла успешно и тестовый период найден - показываем предупреждение
    if (subscriptionCheck && subscriptionCheck.hasTrial === true) {
        // Тестовый период активен - показываем предупреждение, но разрешаем оплату
        console.log('⚠️ ТЕСТОВЫЙ ПЕРИОД АКТИВЕН! Показываем предупреждение.');
        hasActiveSubscription = false; // НЕ блокируем
        
        const trialExpiresAt = subscriptionCheck.trialExpiresAt;
        const formattedDate = trialExpiresAt ? new Date(trialExpiresAt).toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : '';
        
        let message = `<strong>⚠️ У вас активен тестовый период</strong><br>`;
        if (formattedDate) {
            message += `Тестовый период действует до: <strong>${formattedDate}</strong><br>`;
        } else {
            message += `Тестовый период активен<br>`;
        }
        message += `<br>Вы можете оплатить тариф сейчас - он активируется после окончания тестового периода.`;
        
        subscriptionExistsMessage.innerHTML = message;
        subscriptionExistsAlert.style.display = 'flex';
        subscriptionExistsAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log('=== ПРОВЕРКА ЗАВЕРШЕНА: ТЕСТОВЫЙ ПЕРИОД АКТИВЕН, РАЗРЕШАЕМ ОПЛАТУ ===');
        // НЕ возвращаемся - продолжаем создание платежа
    }
    // Если проверка прошла успешно и подписка найдена - показываем информацию, но НЕ блокируем
    else if (subscriptionCheck && subscriptionCheck.hasSubscription === true) {
        // Подписка найдена - показываем информацию, но разрешаем смену тарифа
        console.log('ℹ️ ПОДПИСКА НАЙДЕНА! Разрешаем смену тарифа.');
        hasActiveSubscription = false; // НЕ блокируем
        
        const tariffName = subscriptionCheck.tariffName || 'активна';
        const expiresAt = subscriptionCheck.expiresAt;
        const formattedDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : '';
        
        let message = `<strong>ℹ️ У вас уже есть активная подписка</strong><br>`;
        message += `Текущий тариф: <strong>${tariffName}</strong>`;
        if (formattedDate) {
            message += `<br>Действует до: <strong>${formattedDate}</strong>`;
        }
        message += `<br><br>Вы можете выбрать новый тариф и оплатить его - подписка будет обновлена автоматически.`;
        
        subscriptionExistsMessage.innerHTML = message;
        subscriptionExistsAlert.style.display = 'flex';
        subscriptionExistsAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log('=== ПРОВЕРКА ЗАВЕРШЕНА: ПОДПИСКА НАЙДЕНА, РАЗРЕШАЕМ СМЕНУ ===');
        // НЕ возвращаемся - продолжаем создание платежа для смены тарифа
    }
    
    console.log('✅ Продолжаем создание платежа...');
    console.log('=== ПРОВЕРКА ЗАВЕРШЕНА ===');
    
    // Нормализуем номер телефона (если указан)
    let normalizedPhone = null;
    const phone = phoneInput.value.trim();
    if (phone) {
        normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '7');
        if (!normalizedPhone.startsWith('7') || normalizedPhone.length !== 11) {
            showError('Пожалуйста, укажите корректный номер телефона или оставьте поле пустым');
            return;
        }
    }
    
    // Показываем состояние загрузки
    paymentButton.disabled = true;
    paymentButtonText.textContent = 'Создание платежа...';
    
    try {
        // Проверяем, что поле email существует
        if (!emailInput) {
            console.error('Поле email не найдено!');
            showError('Ошибка: поле email не найдено на странице');
            return;
        }
        
        // Получаем email
        const email = emailInput.value.trim();
        console.log('Значение email из поля:', email, 'длина:', email.length);
        
        if (!email) {
            showError('Пожалуйста, укажите email для получения чека');
            return;
        }
        
        // Проверяем формат email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Пожалуйста, укажите корректный email адрес');
            return;
        }
        
        // Подготавливаем данные для отправки
        const paymentData = {
            tariff: selectedTariff.id,
            tariff_name: selectedTariff.name,
            price: Number(selectedTariff.price),  // Убеждаемся, что это число
            telegram_username: normalizedUsername,
            email: email,
            phone: normalizedPhone || null  // Отправляем null вместо пустой строки
        };
        
        console.log('Отправляем данные:', paymentData);
        console.log('Email для отправки:', email, 'тип:', typeof email, 'длина:', email.length);
        console.log('Типы данных:', {
            tariff: typeof paymentData.tariff,
            tariff_name: typeof paymentData.tariff_name,
            price: typeof paymentData.price,
            telegram_username: typeof paymentData.telegram_username,
            email: typeof paymentData.email
        });
        
        // Создаем платеж через API
        console.log('Отправляем запрос на создание платежа...');
        let response;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // Таймаут 120 секунд (2 минуты)
        
        try {
            response = await fetch(`${API_URL}/create_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            console.log('Ответ сервера получен:', response.status, response.statusText);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('Ошибка при запросе к API:', fetchError);
            if (fetchError.name === 'AbortError' || fetchError.message.includes('aborted')) {
                showError('Превышено время ожидания ответа от сервера. Пожалуйста, попробуйте еще раз или используйте оплату по реквизитам.');
                showManualPayment();
            } else {
                showError('Ошибка при подключении к серверу. Проверьте подключение к интернету и попробуйте снова.');
            }
            paymentButton.disabled = false;
            updatePaymentButton();
            return;
        }
        
        let data;
        try {
            const responseText = await response.text();
            console.log('Текст ответа от сервера:', responseText);
            data = JSON.parse(responseText);
            console.log('Распарсенные данные:', data);
        } catch (e) {
            console.error('Ошибка парсинга JSON ответа при создании платежа:', e);
            console.log('Статус ответа:', response.status);
            console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()));
            showError('Ошибка при создании платежа. Попробуйте еще раз.');
            paymentButton.disabled = false;
            updatePaymentButton();
            return;
        }
        
        console.log('Данные ответа при создании платежа:', JSON.stringify(data, null, 2));
        console.log('Полный ответ API:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        // ВАЖНО: Проверяем ошибку о существующей подписке ДО проверки success
        if (!response.ok || !data.success) {
            const errorMsg = data.error || data.message || 'Ошибка при создании платежа';
            const errorType = data.error_type || '';
            console.log('Ошибка создания платежа:', errorMsg, 'Тип:', errorType);
            console.log('Полный ответ API (ошибка):', JSON.stringify(data, null, 2));
            
            // Специальная обработка таймаута
            if (errorType === 'timeout' || response.status === 504) {
                showError('Превышено время ожидания ответа от платежной системы. Пожалуйста, попробуйте еще раз или используйте оплату по реквизитам.');
                showManualPayment();
                paymentButton.disabled = false;
                updatePaymentButton();
                return;
            }
            
            // Проверяем, не связана ли ошибка с существующей подпиской
            const errorText = (errorMsg || '').toLowerCase();
            const errorDataStr = JSON.stringify(data).toLowerCase();
            
            // Проверяем различные варианты сообщений о существующей подписке
            const subscriptionError = 
                errorText.includes('подписка') && (errorText.includes('уже') || errorText.includes('существует') || errorText.includes('активна')) ||
                errorText.includes('subscription') && (errorText.includes('already') || errorText.includes('exists') || errorText.includes('active')) ||
                errorDataStr.includes('has_subscription') ||
                errorDataStr.includes('subscription_exists') ||
                (data.has_subscription === true) ||
                (data.subscription_exists === true) ||
                (data.subscription && data.subscription.active === true);
            
            // НЕ блокируем оплату при наличии подписки - API должен обработать смену тарифа
            // Если API вернул ошибку о подписке, это может быть старая версия API
            // Показываем ошибку, но не блокируем полностью
            if (subscriptionError) {
                console.log('API сообщает о существующей подписке. Показываем предупреждение, но не блокируем.');
                hasActiveSubscription = false; // НЕ блокируем
                
                // Пытаемся получить информацию о подписке из ответа
                const tariffName = data.tariff_name || data.tariff || 'активна';
                const expiresAt = data.expires_at || data.expiration_date;
                const formattedDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ru-RU', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : '';
                
                let message = `<strong>ℹ️ У вас уже есть активная подписка</strong><br>`;
                if (tariffName !== 'активна') {
                    message += `Текущий тариф: <strong>${tariffName}</strong>`;
                }
                if (formattedDate) {
                    message += `<br>Действует до: <strong>${formattedDate}</strong>`;
                }
                message += `<br><br>Вы можете выбрать новый тариф и оплатить его - подписка будет обновлена автоматически.`;
                
                subscriptionExistsMessage.innerHTML = message || errorMsg;
                subscriptionExistsAlert.style.display = 'flex';
                subscriptionExistsAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                updatePaymentButton();
                paymentButton.disabled = false;
                // НЕ возвращаемся - продолжаем, но API должен обработать смену тарифа
            } else {
                // Если это не ошибка подписки и не таймаут, показываем ошибку
                console.log('❌ Ошибка создания платежа (не подписка, не таймаут):', errorMsg);
                showError(errorMsg);
                paymentButton.disabled = false;
                updatePaymentButton();
                return;
            }
        }
        
        console.log('Проверка успешного ответа: response.ok =', response.ok, 'data.success =', data.success);
        console.log('Полные данные ответа:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.success) {
            console.log('✅ Успешный ответ получен, обрабатываем...');
            console.log('confirmation_token:', data.confirmation_token ? `присутствует (${data.confirmation_token.substring(0, 20)}...)` : 'отсутствует');
            console.log('Полный ответ API:', JSON.stringify(data, null, 2));
            console.log('yookassa_shop_id_configured:', data.yookassa_shop_id_configured);
            console.log('yookassa_secret_key_configured:', data.yookassa_secret_key_configured);
            
            // Проверяем, что виджет YooMoney загружен
            if (typeof window.YooMoneyCheckoutWidget === 'undefined') {
                console.error('❌ YooMoneyCheckoutWidget не загружен! Проверьте, что скрипт https://yookassa.ru/checkout-widget/v1/checkout-widget.js загружен.');
                showError('Виджет оплаты не загружен. Обновите страницу и попробуйте снова.');
                showManualPayment();
                paymentButton.disabled = false;
                updatePaymentButton();
                return;
            }
            
            // Проверяем, есть ли настоящий confirmation_token (не тестовый)
            if (data.confirmation_token && !data.confirmation_token.startsWith('test_token_')) {
                console.log('✅ Настоящий confirmation_token получен, инициализируем виджет...');
                console.log('confirmation_token (полный):', data.confirmation_token);
                console.log('Инициализируем виджет ЮKassa...');
                // Инициализируем виджет ЮKassa
                try {
                    const checkout = new window.YooMoneyCheckoutWidget({
                        confirmation_token: data.confirmation_token,
                        return_url: 'https://hayksarkisyan96.github.io/ZZM/payment-success.html',
                        error_callback: function(error) {
                            console.error('YooMoney widget error:', error);
                            console.error('Детали ошибки виджета:', JSON.stringify(error, null, 2));
                            showError('Ошибка при инициализации платежа. Попробуйте еще раз или используйте оплату по реквизитам.');
                            showManualPayment();
                            paymentButton.disabled = false;
                            updatePaymentButton();
                        }
                    });
                    
                    console.log('Виджет создан, отображаем...');
                    // Отображаем виджет
                    checkout.render('yookassa-widget-container');
                    yookassaWidgetContainer.style.display = 'block';
                    paymentForm.style.display = 'none';
                    
                    console.log('Виджет отображен, прокручиваем...');
                    // Прокручиваем к виджету
                    yookassaWidgetContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    console.log('✅ Виджет успешно инициализирован и отображен');
                } catch (error) {
                    console.error('Error initializing YooMoney widget:', error);
                    console.error('Стек ошибки:', error.stack);
                    showError('Не удалось загрузить форму оплаты. Используйте оплату по реквизитам.');
                    showManualPayment();
                    paymentButton.disabled = false;
                    updatePaymentButton();
                }
            } else {
                // Тестовый режим или ключи не настроены - показываем реквизиты
                console.warn('⚠️ confirmation_token отсутствует или тестовый:', data.confirmation_token);
                console.warn('Полный ответ API:', JSON.stringify(data, null, 2));
                console.warn('yookassa_shop_id_configured:', data.yookassa_shop_id_configured);
                console.warn('yookassa_secret_key_configured:', data.yookassa_secret_key_configured);
                showError('Автоматическая оплата временно недоступна. Используйте оплату по реквизитам.');
                showManualPayment();
                paymentButton.disabled = false;
                updatePaymentButton();
            }
        } else {
            // Ответ не успешный
            console.error('❌ Ответ не успешный:', {
                status: response.status,
                ok: response.ok,
                data: data
            });
            const errorMsg = data.error || data.message || 'Ошибка при создании платежа';
            console.log('Ошибка создания платежа:', errorMsg);
            console.log('Полный ответ API:', JSON.stringify(data, null, 2));
            
            // Проверяем, не связана ли ошибка с существующей подпиской
            const errorText = errorMsg.toLowerCase();
            const errorDataStr = JSON.stringify(data).toLowerCase();
            
            // Проверяем различные варианты сообщений о существующей подписке
            const subscriptionError = 
                errorText.includes('подписка') && (errorText.includes('уже') || errorText.includes('существует') || errorText.includes('активна')) ||
                errorText.includes('subscription') && (errorText.includes('already') || errorText.includes('exists') || errorText.includes('active')) ||
                errorDataStr.includes('has_subscription') ||
                errorDataStr.includes('subscription_exists') ||
                (data.has_subscription === true) ||
                (data.subscription_exists === true);
            
            // НЕ блокируем оплату при наличии подписки - API должен обработать смену тарифа
            if (subscriptionError) {
                console.log('API сообщает о существующей подписке. Показываем предупреждение, но не блокируем.');
                hasActiveSubscription = false; // НЕ блокируем
                
                // Пытаемся получить информацию о подписке из ответа
                const tariffName = data.tariff_name || data.tariff || 'активна';
                const expiresAt = data.expires_at || data.expiration_date;
                const formattedDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ru-RU', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) : '';
                
                let message = `<strong>ℹ️ У вас уже есть активная подписка</strong><br>`;
                if (tariffName !== 'активна') {
                    message += `Текущий тариф: <strong>${tariffName}</strong>`;
                }
                if (formattedDate) {
                    message += `<br>Действует до: <strong>${formattedDate}</strong>`;
                }
                message += `<br><br>Вы можете выбрать новый тариф и оплатить его - подписка будет обновлена автоматически.`;
                
                subscriptionExistsMessage.innerHTML = message || errorMsg;
                subscriptionExistsAlert.style.display = 'flex';
                subscriptionExistsAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                updatePaymentButton();
                // НЕ показываем ошибку, показываем только информационное сообщение
            } else {
                showError(errorMsg);
            }
            
            paymentButton.disabled = false;
            updatePaymentButton();
        }
    } catch (error) {
        console.error('Error:', error);
        
        // Проверяем тип ошибки
        let errorMessage = 'Не удалось создать платеж. ';
        if (error.message && error.message.includes('timeout')) {
            errorMessage += 'Превышено время ожидания ответа от сервера. Пожалуйста, попробуйте еще раз или используйте оплату по реквизитам.';
            showManualPayment();
        } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            errorMessage += 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.';
        } else {
            errorMessage += 'Проверьте подключение к интернету и попробуйте снова.';
        }
        
        showError(errorMessage);
        paymentButton.disabled = false;
        updatePaymentButton();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что все элементы найдены
    if (!emailInput) {
        console.error('Поле email не найдено на странице!');
    } else {
        console.log('Поле email найдено:', emailInput);
    }
    
    // Проверяем подписку, если username уже заполнен (например, из URL параметров)
    const initialUsername = telegramUsernameInput.value.trim().replace('@', '').toLowerCase();
    if (initialUsername.length >= 3) {
        checkSubscription(initialUsername);
    }
    
    updatePaymentButton();
});

