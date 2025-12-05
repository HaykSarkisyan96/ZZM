// API endpoint
// Для локальной разработки раскомментируйте строку ниже и закомментируйте продакшен URL
// const API_URL = 'http://localhost:3001/api/process';
const API_URL = 'https://new-landing-production.up.railway.app/api/process';

// Ключи для localStorage
const STORAGE_USERNAME_KEY = 'telegram_username';
const STORAGE_STORE_NAME_KEY = 'store_name';

// DOM элементы (будут инициализированы после загрузки DOM)
let form;
let fileInput;
let fileDropzone;
let fileDropzoneContent;
let filePreview;
let fileName;
let fileRemove;
let usernameInput;
let storeNameInput;
let phoneInput;
let submitButton;
let submitLoader;
let submitButtonText;
let errorAlert;
let errorMessage;
let successAlert;
let successMessage;

// Инициализация DOM элементов
function initDOMElements() {
    form = document.getElementById('calculateForm');
    fileInput = document.getElementById('file-upload');
    fileDropzone = document.getElementById('fileDropzone');
    fileDropzoneContent = document.getElementById('fileDropzoneContent');
    filePreview = document.getElementById('filePreview');
    fileName = document.getElementById('fileName');
    fileRemove = document.getElementById('fileRemove');
    usernameInput = document.getElementById('username');
    storeNameInput = document.getElementById('storeName');
    phoneInput = document.getElementById('phone');
    submitButton = document.getElementById('submitButton');
    submitLoader = document.getElementById('submitLoader');
    submitButtonText = document.getElementById('submitButtonText');
    errorAlert = document.getElementById('errorAlert');
    errorMessage = document.getElementById('errorMessage');
    successAlert = document.getElementById('successAlert');
    successMessage = document.getElementById('successMessage');
    
    // Проверяем, что все элементы найдены
    if (!form || !fileInput || !fileDropzone || !fileDropzoneContent || !filePreview || 
        !fileName || !fileRemove || !usernameInput || !storeNameInput || !phoneInput || 
        !submitButton || !submitLoader || !submitButtonText || !errorAlert || 
        !errorMessage || !successAlert || !successMessage) {
        console.error('Не все DOM элементы найдены!');
        return false;
    }
    return true;
}

// Загружаем сохраненные данные из localStorage
function loadSavedData() {
    if (!usernameInput || !storeNameInput) return;
    const savedUsername = localStorage.getItem(STORAGE_USERNAME_KEY);
    const savedStoreName = localStorage.getItem(STORAGE_STORE_NAME_KEY);
    
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
    }
    if (savedStoreName && storeNameInput) {
        storeNameInput.value = savedStoreName;
    }
}

// Сохраняем данные в localStorage
function saveToLocalStorage() {
    if (!usernameInput || !storeNameInput) return;
    if (usernameInput.value.trim()) {
        localStorage.setItem(STORAGE_USERNAME_KEY, usernameInput.value.trim());
    }
    if (storeNameInput.value.trim()) {
        localStorage.setItem(STORAGE_STORE_NAME_KEY, storeNameInput.value.trim());
    }
}

// Показываем превью файла
function showFilePreview(file) {
    if (!fileName || !fileDropzoneContent || !filePreview) return;
    fileName.textContent = file.name;
    fileDropzoneContent.style.display = 'none';
    filePreview.style.display = 'flex';
}

// Скрываем превью файла
function hideFilePreview() {
    if (!fileDropzoneContent || !filePreview || !fileInput) return;
    fileDropzoneContent.style.display = 'flex';
    filePreview.style.display = 'none';
    fileInput.value = '';
    updateSubmitButton();
}

// Обновляем состояние кнопки отправки
function updateSubmitButton() {
    if (!fileInput || !usernameInput || !submitButton) return;
    const hasFile = fileInput.files && fileInput.files.length > 0;
    const hasUsername = usernameInput.value.trim().length > 0;
    
    submitButton.disabled = !hasFile || !hasUsername;
}

// Показываем ошибку
function showError(message) {
    if (!errorMessage || !errorAlert || !successAlert) return;
    errorMessage.innerHTML = message;  // Используем innerHTML для поддержки HTML ссылок
    errorAlert.style.display = 'flex';
    successAlert.style.display = 'none';
    // Прокручиваем к ошибке
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показываем успех
function showSuccess(message, botLink, botUsername, autoSent = false) {
    let messageHTML;
    
    if (autoSent) {
        // Заявка отправлена автоматически (повторное использование)
        messageHTML = `
            <span style="font-weight: 600;">✅ Заявка успешно отправлена в Telegram!</span><br>
            <span>
                Проверьте свой Telegram — заявка уже пришла. 
                <a href="${botLink}" target="_blank" rel="noopener noreferrer">
                    Открыть бота
                    <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </span>
        `;
    } else {
        // Первое использование - нужно написать /start
        messageHTML = `
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
    }
    
    if (successMessage && successAlert && errorAlert) {
        successMessage.innerHTML = messageHTML;
        successAlert.style.display = 'flex';
        errorAlert.style.display = 'none';
        // Прокручиваем к успеху
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Скрываем все алерты
function hideAlerts() {
    if (!errorAlert || !successAlert) return;
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
}

// Инициализация обработчиков событий
function initEventListeners() {
    if (!fileInput || !fileDropzone || !fileRemove || !usernameInput || !storeNameInput || !form) {
        console.error('Не все элементы для обработчиков событий найдены!');
        return;
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
        
        const phone = phoneInput ? phoneInput.value.trim() : '';
        if (phone) {
            formData.append('phone', phone);
        }
        
        // Отправляем запрос
        console.log('Отправляем запрос на:', API_URL);
        console.log('Данные формы:', {
            username: username,
            phone: phone,
            store_name: storeName,
            file: fileInput.files[0] ? fileInput.files[0].name : 'не выбран'
        });
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        }).catch(fetchError => {
            console.error('Fetch error:', fetchError);
            throw new Error('Load failed: ' + fetchError.message);
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Проверяем, является ли ответ JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('Response data:', data);
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Сервер вернул неожиданный ответ: ${text.substring(0, 100)}`);
        }
        
        if (response.ok && data.success) {
            // Проверяем, была ли заявка отправлена автоматически
            const autoSent = data.auto_sent === true;
            const botUsername = data.bot_username || 'MoreVkusovBot';
            const botLink = data.bot_link || `https://t.me/${botUsername}`;
            
            // Используем сообщение из API, если оно есть, иначе формируем свое
            let messageHTML;
            if (data.message) {
                // Используем сообщение из API (там уже правильный текст)
                // Заменяем @username на кликабельную ссылку
                const messageWithLink = data.message.replace(
                    new RegExp(`@${botUsername}`, 'g'),
                    `<a href="${botLink}" target="_blank" rel="noopener noreferrer" style="color: hsl(210, 100%, 50%); text-decoration: underline; font-weight: 600;">@${botUsername}</a>`
                );
                
                messageHTML = `
                    <span style="font-weight: 600;">${messageWithLink}</span>
                    ${autoSent ? `<br><span>
                        <a href="${botLink}" target="_blank" rel="noopener noreferrer" style="color: hsl(210, 100%, 50%); text-decoration: underline; font-weight: 600;">
                            Открыть бота
                            <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                        </a>
                    </span>` : ''}
                `;
            } else {
                // Fallback на старое поведение, если сообщения нет
                if (autoSent) {
                    messageHTML = `
                        <span style="font-weight: 600;">✅ Заявка успешно отправлена в Telegram!</span><br>
                        <span>
                            Проверьте свой Telegram — заявка уже пришла. 
                            <a href="${botLink}" target="_blank" rel="noopener noreferrer" style="color: hsl(210, 100%, 50%); text-decoration: underline; font-weight: 600;">
                                Открыть бота
                                <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                            </a>
                        </span>
                    `;
                } else {
                    messageHTML = `
                        <span style="font-weight: 600;">✅ Заявка готова!</span><br>
                        <span>
                            Перейдите в Telegram бота 
                            <a href="${botLink}" target="_blank" rel="noopener noreferrer" style="color: hsl(210, 100%, 50%); text-decoration: underline; font-weight: 600;">
                                @${botUsername}
                                <svg class="external-link-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                            </a>
                            и нажмите команду <strong>/start</strong>, чтобы получить заявку.
                        </span>
                    `;
                }
            }
            
            successMessage.innerHTML = messageHTML;
            successAlert.style.display = 'flex';
            errorAlert.style.display = 'none';
            successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Очищаем файл
            hideFilePreview();
            
            // Сохраняем данные
            saveToLocalStorage();
        } else {
            // Ошибка от API
            const errorMsg = data.error || data.message || 'Произошла ошибка при обработке файла';
            
            // Если требуется подписка, показываем ссылку на оплату
            if (data.requires_subscription && data.payment_link) {
                showError(`${errorMsg}<br><br><a href="${data.payment_link}" target="_blank" style="color: hsl(210, 100%, 50%); text-decoration: underline;">Оформить подписку →</a>`);
            } else {
                showError(errorMsg);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Более детальная обработка ошибок
        let errorMessage = 'Не удалось обработать файл. ';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Не удалось подключиться к серверу. Проверьте, что API сервер запущен и доступен по адресу: ' + API_URL;
        } else if (error.message && error.message.includes('Load failed')) {
            errorMessage += 'Не удалось загрузить файл. Возможные причины:<br>' +
                           '1. Проблема с подключением к интернету<br>' +
                           '2. API сервер временно недоступен<br>' +
                           '3. Проблема с подпиской (проверьте, что подписка активирована)<br><br>' +
                           'Попробуйте обновить страницу и попробовать снова.';
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
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, начинаем инициализацию...');
    
    // Инициализируем DOM элементы
    if (!initDOMElements()) {
        console.error('Ошибка инициализации DOM элементов');
        alert('Ошибка загрузки страницы. Пожалуйста, обновите страницу.');
        return;
    }
    
    console.log('DOM элементы инициализированы');
    
    // Инициализируем обработчики событий
    initEventListeners();
    console.log('Обработчики событий инициализированы');
    
    // Обработка клика на dropzone (для надежности)
    fileDropzone.addEventListener('click', (e) => {
        // Если клик был на кнопке удаления файла, не открываем диалог
        if (e.target.closest('#fileRemove')) {
            return;
        }
        // Программно вызываем клик на input
        console.log('Клик на dropzone, открываем диалог выбора файла');
        fileInput.click();
    });
    
    // Загружаем сохраненные данные и обновляем кнопку
    loadSavedData();
    updateSubmitButton();
    console.log('Инициализация завершена');
});

