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

