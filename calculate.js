// API endpoint
// Для локальной разработки раскомментируйте строку ниже и закомментируйте продакшен URL
// const API_URL = 'http://localhost:3001/api/process';
const API_URL = 'https://new-landing-production.up.railway.app/api/process';

// Ключи для localStorage
const STORAGE_USERNAME_KEY = 'telegram_username';
const STORAGE_STORE_NAME_KEY = 'store_name';

// DOM элементы
const form = document.getElementById('calculateForm');
const fileInput = document.getElementById('file-upload');
const fileDropzone = document.getElementById('fileDropzone');
const fileDropzoneContent = document.getElementById('fileDropzoneContent');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const fileRemove = document.getElementById('fileRemove');
const usernameInput = document.getElementById('username');
const storeNameInput = document.getElementById('storeName');
const submitButton = document.getElementById('submitButton');
const submitLoader = document.getElementById('submitLoader');
const submitButtonText = document.getElementById('submitButtonText');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const successAlert = document.getElementById('successAlert');
const successMessage = document.getElementById('successMessage');

// Загружаем сохраненные данные из localStorage
function loadSavedData() {
    const savedUsername = localStorage.getItem(STORAGE_USERNAME_KEY);
    const savedStoreName = localStorage.getItem(STORAGE_STORE_NAME_KEY);
    
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    if (savedStoreName) {
        storeNameInput.value = savedStoreName;
    }
}

// Сохраняем данные в localStorage
function saveToLocalStorage() {
    if (usernameInput.value.trim()) {
        localStorage.setItem(STORAGE_USERNAME_KEY, usernameInput.value.trim());
    }
    if (storeNameInput.value.trim()) {
        localStorage.setItem(STORAGE_STORE_NAME_KEY, storeNameInput.value.trim());
    }
}

// Показываем превью файла
function showFilePreview(file) {
    fileName.textContent = file.name;
    fileDropzoneContent.style.display = 'none';
    filePreview.style.display = 'flex';
}

// Скрываем превью файла
function hideFilePreview() {
    fileDropzoneContent.style.display = 'flex';
    filePreview.style.display = 'none';
    fileInput.value = '';
    updateSubmitButton();
}

// Обновляем состояние кнопки отправки
function updateSubmitButton() {
    const hasFile = fileInput.files && fileInput.files.length > 0;
    const hasUsername = usernameInput.value.trim().length > 0;
    
    submitButton.disabled = !hasFile || !hasUsername;
}

// Показываем ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
    successAlert.style.display = 'none';
    // Прокручиваем к ошибке
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показываем успех
function showSuccess(message, botLink, botUsername) {
    const messageHTML = `
        <span style="font-weight: 600;">✅ Заявка готова!</span><br>
        <span>
            Напишите боту 
            <a href="${botLink}" target="_blank" rel="noopener noreferrer">
                @${botUsername}
                <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
            </a>
            команду /start, и вы получите заявку автоматически.
        </span>
    `;
    successMessage.innerHTML = messageHTML;
    successAlert.style.display = 'flex';
    errorAlert.style.display = 'none';
    // Прокручиваем к успеху
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Скрываем все алерты
function hideAlerts() {
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
}

// Обработка изменения файла
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            showFilePreview(file);
            hideAlerts();
            updateSubmitButton();
        } else {
            showError('Пожалуйста, загрузите файл формата .xlsx или .xls');
            hideFilePreview();
        }
    }
});

// Обработка удаления файла
fileRemove.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideFilePreview();
    hideAlerts();
});

// Drag and Drop для файла
fileDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropzone.style.borderColor = 'var(--accent-blue)';
    fileDropzone.style.background = 'rgba(0, 0, 0, 0.05)';
});

fileDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropzone.style.borderColor = 'var(--border-color)';
    fileDropzone.style.background = 'var(--muted-bg)';
});

fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileDropzone.style.borderColor = 'var(--border-color)';
    fileDropzone.style.background = 'var(--muted-bg)';
    
    const file = e.dataTransfer.files[0];
    if (file) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Создаем новый FileList для input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            showFilePreview(file);
            hideAlerts();
            updateSubmitButton();
        } else {
            showError('Пожалуйста, загрузите файл формата .xlsx или .xls');
        }
    }
});

// Обработка изменения username
usernameInput.addEventListener('input', (e) => {
    let value = e.target.value.trim();
    // Убираем @ если пользователь его указал
    if (value.startsWith('@')) {
        value = value.substring(1);
        e.target.value = value;
    }
    hideAlerts();
    updateSubmitButton();
    saveToLocalStorage();
});

// Обработка изменения store name
storeNameInput.addEventListener('input', () => {
    saveToLocalStorage();
});

// Обработка отправки формы
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();
    
    // Валидация
    if (!fileInput.files || fileInput.files.length === 0) {
        showError('Пожалуйста, загрузите Excel файл');
        return;
    }
    
    const username = usernameInput.value.trim();
    if (!username) {
        showError('Telegram username не указан');
        return;
    }
    
    // Показываем состояние загрузки
    submitButton.disabled = true;
    submitLoader.style.display = 'block';
    submitButtonText.textContent = 'Обрабатываем файл...';
    
    try {
        // Создаем FormData
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('username', username);
        
        const storeName = storeNameInput.value.trim();
        if (storeName) {
            formData.append('store_name', storeName);
        }
        
        // Отправляем запрос
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        // Проверяем, является ли ответ JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Сервер вернул неожиданный ответ: ${text.substring(0, 100)}`);
        }
        
        if (response.ok && data.success) {
            // Успех
            showSuccess(
                data.message,
                data.bot_link || `https://t.me/${data.bot_username || 'ваш_бот'}`,
                data.bot_username || 'ваш_бот'
            );
            
            // Очищаем файл
            hideFilePreview();
            
            // Сохраняем данные
            saveToLocalStorage();
        } else {
            // Ошибка от API
            const errorMsg = data.error || data.message || 'Произошла ошибка при обработке файла';
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        
        // Более детальная обработка ошибок
        let errorMessage = 'Не удалось обработать файл. ';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Не удалось подключиться к серверу. Проверьте, что API сервер запущен и доступен по адресу: ' + API_URL;
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Проверьте подключение к интернету и попробуйте снова.';
        }
        
        showError(errorMessage);
    } finally {
        // Скрываем состояние загрузки
        submitButton.disabled = false;
        submitLoader.style.display = 'none';
        submitButtonText.textContent = 'Получить заявку в Telegram';
        updateSubmitButton();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updateSubmitButton();
});

