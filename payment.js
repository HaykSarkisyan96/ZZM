// API endpoint для создания платежа
const API_URL = 'https://new-landing-production.up.railway.app/api';

// DOM элементы
const tariffCards = document.querySelectorAll('.tariff-card');
const paymentForm = document.getElementById('paymentForm');
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

// Выбранный тариф
let selectedTariff = null;

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
            price: parseInt(card.dataset.price)
        };
        
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
    const hasPhone = phoneInput.value.trim().length > 0;
    const hasTariff = selectedTariff !== null;
    
    paymentButton.disabled = !hasPhone || !hasTariff;
    
    if (hasTariff && hasPhone) {
        paymentButtonText.textContent = `Оплатить ${selectedTariff.price} ₽`;
    } else if (hasTariff) {
        paymentButtonText.textContent = 'Укажите номер телефона';
    } else {
        paymentButtonText.textContent = 'Выберите тариф';
    }
}

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
    updatePaymentButton();
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
    
    const phone = phoneInput.value.trim();
    if (!phone) {
        showError('Пожалуйста, укажите номер телефона');
        return;
    }
    
    // Нормализуем номер телефона (убираем все кроме цифр, начинаем с 7)
    const normalizedPhone = phone.replace(/\D/g, '').replace(/^8/, '7');
    if (!normalizedPhone.startsWith('7') || normalizedPhone.length !== 11) {
        showError('Пожалуйста, укажите корректный номер телефона');
        return;
    }
    
    // Показываем состояние загрузки
    paymentButton.disabled = true;
    paymentButtonText.textContent = 'Создание платежа...';
    
    try {
        // Создаем платеж через API
        const response = await fetch(`${API_URL}/create_payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tariff: selectedTariff.id,
                tariff_name: selectedTariff.name,
                price: selectedTariff.price,
                phone: normalizedPhone
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Инициализируем виджет ЮKassa
            const checkout = new window.YooMoneyCheckoutWidget({
                confirmation_token: data.confirmation_token,
                return_url: window.location.origin + '/payment-success.html',
                error_callback: function(error) {
                    showError('Ошибка при инициализации платежа. Попробуйте еще раз.');
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

