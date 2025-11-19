// Smooth scroll for CTA buttons (только для кнопок без ссылок)
document.querySelectorAll('.cta-button').forEach(button => {
    // Проверяем, является ли элемент ссылкой - если да, не блокируем переход
    if (button.tagName === 'A' && button.href) {
        // Это ссылка, не блокируем переход
        return;
    }
    // Это кнопка без ссылки, можно добавить обработчик
    button.addEventListener('click', function(e) {
        e.preventDefault();
        // Здесь можно добавить логику перехода к боту или обработке заявки
        console.log('CTA clicked');
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

