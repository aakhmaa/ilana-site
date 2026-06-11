// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Animation on scroll
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

document.querySelectorAll('.product-card, .about-card, .review-card, .contact-item').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// ── Form submission ────────────────────────────────────────────────────────
// ⚠️ Замените на URL вашего сервера после деплоя, например:
// const BACKEND_URL = 'https://your-server.com/api/order';
const BACKEND_URL = 'https://ilana-site.onrender.com/api/order';
const form = document.getElementById('orderForm');
const submitBtn = form?.querySelector('button[type="submit"]');

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name    = document.getElementById('name').value.trim();
        const company = document.getElementById('company').value.trim();
        const phone   = document.getElementById('phone').value.trim();

        if (!name || !company || !phone) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        // Блокируем кнопку во время отправки
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем...';

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    company,
                    phone,
                    email:   document.getElementById('email').value.trim(),
                    message: document.getElementById('message').value.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message || 'Заявка принята!', 'success');
                form.reset();
            } else {
                showNotification(data.error || 'Ошибка при отправке. Попробуйте ещё раз.', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Не удалось подключиться к серверу. Позвоните нам напрямую.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заявку';
        }
    });
}

// ── Уведомление (вместо alert) ─────────────────────────────────────────────
function showNotification(text, type = 'success') {
    const existing = document.getElementById('notify-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'notify-toast';
    toast.textContent = text;
    Object.assign(toast.style, {
        position:     'fixed',
        bottom:       '30px',
        right:        '30px',
        background:   type === 'success' ? '#1E3A8A' : '#dc2626',
        color:        '#fff',
        padding:      '16px 24px',
        borderRadius: '10px',
        fontSize:     '15px',
        boxShadow:    '0 8px 24px rgba(0,0,0,0.2)',
        zIndex:       '9999',
        maxWidth:     '320px',
        animation:    'fadeInUp 0.4s ease',
    });

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Header shadow on scroll
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    header.style.boxShadow = window.scrollY > 50
        ? '0 2px 20px rgba(30, 58, 138, 0.15)'
        : '0 2px 15px rgba(30, 58, 138, 0.08)';
});

// Responsive header padding
function handleResponsive() {
    const header = document.querySelector('.header');
    header.style.padding = window.innerWidth <= 768 ? '10px 0' : '15px 0';
}
window.addEventListener('resize', handleResponsive);
handleResponsive();

console.log('BioDezKZ сайт загружен успешно');
