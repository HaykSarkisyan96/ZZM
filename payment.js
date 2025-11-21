// API endpoint для создания платежа
const API_URL = 'https://new-landing-production.up.railway.app/api';

// DOM элементы
const tariffCards = document.querySelectorAll('.tariff-card');
const paymentForm = document.getElementById('paymentForm');
const telegramUsernameInput = document.getElementById('telegramUsername');
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
const yookassaWidgetContainer = document.getElementById('yookassa-widget-container');
const manualPaymentInfo = document.getElementById('manualPaymentInfo');
const paymentPurpose = document.getElementById('paymentPurpose');

// Выбранный тариф
let selectedTariff = null;

// Показ реквизитов для ручной оплаты
function showManualPayment() {
    if (selectedTariff) {
        paymentPurpose.textContent = `Подписка "${selectedTariff.name}" на месяц - ${selectedTariff.price} ₽`;
    }
    manualPaymentInfo.style.display = 'block';
    paymentForm.style.display = 'none';
    manualPaymentInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

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
    
    hideAlerts();
    updatePaymentButton();
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
    
    // Нормализуем username (убираем @ если есть, приводим к нижнему регистру)
    const normalizedUsername = telegramUsername.replace('@', '').toLowerCase();
    if (normalizedUsername.length < 3) {
        showError('Пожалуйста, укажите корректный Telegram username');
        return;
    }
    
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
        // Подготавливаем данные для отправки
        const paymentData = {
            tariff: selectedTariff.id,
            tariff_name: selectedTariff.name,
            price: Number(selectedTariff.price),  // Убеждаемся, что это число
            telegram_username: normalizedUsername,
            phone: normalizedPhone || null  // Отправляем null вместо пустой строки
        };
        
        console.log('Отправляем данные:', paymentData);
        console.log('Типы данных:', {
            tariff: typeof paymentData.tariff,
            tariff_name: typeof paymentData.tariff_name,
            price: typeof paymentData.price,
            telegram_username: typeof paymentData.telegram_username
        });
        
        // Создаем платеж через API
        const response = await fetch(`${API_URL}/create_payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        console.log('Ответ сервера:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Данные ответа:', data);
        
        if (response.ok && data.success) {
            // Проверяем, есть ли настоящий confirmation_token (не тестовый)
            if (data.confirmation_token && !data.confirmation_token.startsWith('test_token_')) {
                // Инициализируем виджет ЮKassa
                try {
                    const checkout = new window.YooMoneyCheckoutWidget({
                        confirmation_token: data.confirmation_token,
                        return_url: 'https://hayksarkisyan96.github.io/ZZM/payment-success.html',
                        error_callback: function(error) {
                            console.error('YooMoney widget error:', error);
                            showError('Ошибка при инициализации платежа. Попробуйте еще раз или используйте оплату по реквизитам.');
                            showManualPayment();
                            paymentButton.disabled = false;
                            updatePaymentButton();
                        }
                    });
                    
                    // Отображаем виджет
                    checkout.render('yookassa-widget-container');
                    yookassaWidgetContainer.style.display = 'block';
                    paymentForm.style.display = 'none';
                    
                    // Прокручиваем к виджету
                    yookassaWidgetContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } catch (error) {
                    console.error('Error initializing YooMoney widget:', error);
                    showError('Не удалось загрузить форму оплаты. Используйте оплату по реквизитам.');
                    showManualPayment();
                    paymentButton.disabled = false;
                    updatePaymentButton();
                }
            } else {
                // Тестовый режим или ключи не настроены - показываем реквизиты
                showError('Автоматическая оплата временно недоступна. Используйте оплату по реквизитам.');
                showManualPayment();
                paymentButton.disabled = false;
                updatePaymentButton();
            }
        } else {
            const errorMsg = data.error || data.message || 'Ошибка при создании платежа';
            showError(errorMsg);
            paymentButton.disabled = false;
            updatePaymentButton();
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Не удалось создать платеж. Проверьте подключение к интернету и попробуйте снова.');
        paymentButton.disabled = false;
        updatePaymentButton();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updatePaymentButton();
});

