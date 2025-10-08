// نظام عد التحميلات
let downloadCount = 0;

// تهيئة عداد التحميلات
function initializeDownloadCounter() {
    const savedCount = localStorage.getItem('mohiedy_download_count');
    downloadCount = savedCount ? parseInt(savedCount) : 15000; // بدء من 15000
    updateDownloadCounter();
}

// تحديث العداد في الواجهة
function updateDownloadCounter() {
    const downloadCountElement = document.getElementById('downloadCount');
    const totalDownloadsElement = document.getElementById('totalDownloads');
    
    if (downloadCountElement) {
        downloadCountElement.textContent = downloadCount.toLocaleString();
    }
    
    if (totalDownloadsElement) {
        totalDownloadsElement.textContent = downloadCount.toLocaleString();
    }
}

// زيادة عداد التحميلات
function incrementDownloadCount() {
    downloadCount++;
    localStorage.setItem('mohiedy_download_count', downloadCount.toString());
    updateDownloadCounter();
}

// دالة التحميل المباشر (تعمل مع جميع الأزرار)
function directDownload() {
    const downloadUrl = 'https://github.com/BX1-M/mohiedy-apps/releases/download/v1.0.0/application-11b2a8ba-bb2a-471c-a821-58cab3d452b0.apk';
    
    // زيادة عداد التحميلات
    incrementDownloadCount();
    
    // فتح الرابط في نافذة جديدة مباشرة
    window.open(downloadUrl, '_blank');
    
    // إظهار رسالة للمستخدم
    showDownloadToast('جاري فتح صفحة التحميل...');
}

// شاشة الترحيب
document.addEventListener('DOMContentLoaded', function() {
    initializeDownloadCounter();
    
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        welcomeScreen.classList.add('hidden');
        
        setTimeout(() => {
            startCounters();
            initScrollAnimations();
            initScreenshotSlider();
        }, 500);
    }, 3000);
});

// عدادات الإحصائيات
function startCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-count');
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                if (target % 1 === 0) {
                    counter.textContent = Math.floor(current);
                } else {
                    counter.textContent = current.toFixed(1);
                }
                requestAnimationFrame(updateCounter);
            } else {
                if (target % 1 === 0) {
                    counter.textContent = target;
                } else {
                    counter.textContent = target.toFixed(1);
                }
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// منزلق لقطات الشاشة
function initScreenshotSlider() {
    const screenshots = document.querySelectorAll('.screenshot');
    const navButtons = document.querySelectorAll('.nav-btn');
    let currentSlide = 0;
    
    function showSlide(index) {
        screenshots.forEach(slide => slide.classList.remove('active'));
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        screenshots[index].classList.add('active');
        navButtons[index].classList.add('active');
        currentSlide = index;
    }
    
    navButtons.forEach((button, index) => {
        button.addEventListener('click', () => showSlide(index));
    });
    
    // التبديل التلقائي كل 5 ثوانٍ
    setInterval(() => {
        let nextSlide = (currentSlide + 1) % screenshots.length;
        showSlide(nextSlide);
    }, 5000);
}

// تأثيرات التمرير
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const animatedElements = document.querySelectorAll('.feature-card, .coming-soon-card, .contact-card');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// التمرير السلس
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

// دالة لعرض رسائل للمستخدم
function showDownloadToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 600;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// إضافة الأنيميشن للرسائل
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);

// القائمة المتنقلة
document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// تأثيرات إضافية للخلفية
document.addEventListener('mousemove', function(e) {
    const hero = document.querySelector('.hero');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    hero.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
});

// تحسين تجربة اللمس للهواتف
document.addEventListener('touchstart', function() {}, { passive: true });

// تحميل الصور بشكل كسول
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}