// Easing функция для более плавной анимации (ease-in-out-cubic)
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Плавная прокрутка с кастомной анимацией
function smoothScrollTo(targetPosition, duration = 800) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Применяем easing функцию
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// Плавная прокрутка для навигационных ссылок
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик для всех навигационных ссылок
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Пропускаем пустые ссылки (#)
            if (href === '#' || href === '') {
                return;
            }
            
            // Находим целевой элемент
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Вычисляем позицию с учетом фиксированного header
                const headerHeight = 100; // Высота фиксированного header с отступом
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                // Плавная прокрутка с кастомной анимацией (800ms для более плавного движения)
                smoothScrollTo(targetPosition, 800);
            }
        });
    });
});

// CTA buttons - обработчик только для кнопок без ссылок
// ВАЖНО: Ссылки (<a>) не должны иметь обработчиков, которые блокируют переход
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.cta-button').forEach(element => {
        // Пропускаем все элементы <a> (ссылки) - они должны работать как обычные ссылки
        if (element.tagName === 'A' || element.nodeName === 'A' || element.href) {
            // Это ссылка, не добавляем обработчик
            return;
        }
        // Это кнопка (не ссылка), можно добавить обработчик
        element.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('CTA button clicked (not a link)');
        });
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate cards on scroll
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.pain-card, .step-card, .benefit-card, .use-case-card');
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Scroll to Top button
    const scrollToTopButton = document.getElementById('scrollToTop');
    
    function toggleScrollButton() {
        if (scrollToTopButton) {
            if (window.pageYOffset > 100) {
                scrollToTopButton.classList.add('visible');
            } else {
                scrollToTopButton.classList.remove('visible');
            }
        }
    }
    
    // Проверить при загрузке
    toggleScrollButton();
    
    // Показать/скрыть стрелку при скролле
    window.addEventListener('scroll', toggleScrollButton);
    
    // Плавная прокрутка наверх при клике
    if (scrollToTopButton) {
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

