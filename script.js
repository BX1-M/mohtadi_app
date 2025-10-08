// نظام عد التحميلات المحسن
class DownloadTracker {
    constructor() {
        this.supabaseUrl = 'https://nimexmkfzouprdcltcvh.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbWV4bWtmem91cHJkY2x0Y3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDE1MjksImV4cCI6MjA3NTQ3NzUyOX0.ooPFii1YnjWxjY1QT4vPuOw4gFadRmIumy43QcpAKDQ';
        this.totalDownloads = 0;
        this.todayDownloads = 0;
        this.supabase = null;
    }

    // تهيئة النظام
    async initialize() {
        await this.initSupabase();
        await this.loadDownloadCount();
        this.startAutoRefresh();
    }

    // تهيئة Supabase
    async initSupabase() {
        if (window.supabase) {
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        }
    }

    // تحميل عدد التحميلات
    async loadDownloadCount() {
        try {
            if (!this.supabase) {
                this.loadFromLocalStorage();
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            
            // جلب البيانات من Supabase
            const [totalData, todayData] = await Promise.allSettled([
                this.supabase.from('downloads').select('*').eq('type', 'total').single(),
                this.supabase.from('downloads').select('*').eq('type', 'today').eq('date', today).single()
            ]);

            if (totalData.status === 'fulfilled' && totalData.value.data) {
                this.totalDownloads = totalData.value.data.count || 0;
            }

            if (todayData.status === 'fulfilled' && todayData.value.data) {
                this.todayDownloads = todayData.value.data.count || 0;
            } else {
                this.todayDownloads = 0;
            }

        } catch (error) {
            console.log('استخدام البيانات المحلية');
            this.loadFromLocalStorage();
        } finally {
            this.updateUI();
        }
    }

    // زيادة العداد
    async incrementDownloadCount() {
        try {
            const today = new Date().toISOString().split('T')[0];
            let success = false;

            if (this.supabase) {
                success = await this.updateSupabaseCount(today);
            }

            if (success) {
                this.totalDownloads++;
                this.todayDownloads++;
                showToast('✅ تم تسجيل التحميل بنجاح!');
            } else {
                this.incrementLocalCount();
                showToast('📱 تم التسجيل محلياً');
            }

            this.updateUI();
            
        } catch (error) {
            this.incrementLocalCount();
            showToast('📱 جاري التحميل...');
        }

        // فتح رابط التحميل
        setTimeout(() => {
            window.open('https://github.com/BX1-M/mohiedy-apps/releases/download/v1.0.0/application-11b2a8ba-bb2a-471c-a821-58cab3d452b0.apk', '_blank');
        }, 500);
    }

    // تحديث Supabase
    async updateSupabaseCount(today) {
        try {
            const [totalResult, todayResult] = await Promise.allSettled([
                this.supabase.from('downloads').upsert({
                    type: 'total',
                    count: this.totalDownloads + 1,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'type' }),
                
                this.supabase.from('downloads').upsert({
                    type: 'today',
                    date: today,
                    count: (this.todayDownloads || 0) + 1,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'type,date' })
            ]);

            return totalResult.status === 'fulfilled' && todayResult.status === 'fulfilled';
            
        } catch (error) {
            return false;
        }
    }

    // النظام المحلي
    loadFromLocalStorage() {
        const saved = localStorage.getItem('mohiedy_downloads');
        if (saved) {
            const data = JSON.parse(saved);
            this.totalDownloads = data.total || 0;
            this.todayDownloads = data.today || 0;
        }
    }

    saveToLocalStorage() {
        const data = {
            total: this.totalDownloads,
            today: this.todayDownloads,
            lastUpdated: Date.now()
        };
        localStorage.setItem('mohiedy_downloads', JSON.stringify(data));
    }

    incrementLocalCount() {
        this.loadFromLocalStorage();
        this.totalDownloads++;
        this.todayDownloads++;
        this.saveToLocalStorage();
    }

    // تحديث الواجهة
    updateUI() {
        this.updateCounter('downloadCount', this.totalDownloads);
        this.updateCounter('totalDownloads', this.totalDownloads);
        this.updateCounter('todayDownloads', this.todayDownloads);
        this.updateCounter('footerDownloads', this.totalDownloads);
        
        // المستخدمين النشطين (80% من التحميلات)
        const activeUsers = Math.floor(this.totalDownloads * 0.8);
        this.updateCounter('activeUsers', activeUsers);
    }

    // تحريك العداد
    updateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const current = parseInt(element.textContent.replace(/,/g, '')) || 0;
        if (current === target) return;

        this.animateCounter(element, current, target);
    }

    animateCounter(element, start, end) {
        const duration = 800;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(start + (end - start) * progress);
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end.toLocaleString();
            }
        };
        
        requestAnimationFrame(update);
    }

    // التحديث التلقائي
    startAutoRefresh() {
        setInterval(() => {
            this.loadDownloadCount();
        }, 10000); // كل 10 ثواني
    }
}

// إنشاء كائن التتبع
const downloadTracker = new DownloadTracker();

// دالة التحميل الرئيسية
async function directDownload() {
    await downloadTracker.incrementDownloadCount();
}

// التمرير السلس
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// إظهار الرسائل
function showToast(message) {
    // إزالة الرسائل القديمة
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--primary)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '25px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '10000',
        fontWeight: '600',
        animation: 'slideUp 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// إعداد الصور
function initImageLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img);
    });
}

// منزلق الصور
function initScreenshotSlider() {
    const screenshots = document.querySelectorAll('.screenshot');
    const navButtons = document.querySelectorAll('.nav-btn');
    let currentIndex = 0;
    
    function showSlide(index) {
        screenshots.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        navButtons.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
        
        currentIndex = index;
    }
    
    function nextSlide() {
        const nextIndex = (currentIndex + 1) % screenshots.length;
        showSlide(nextIndex);
    }
    
    // الأزرار
    navButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => showSlide(index));
    });
    
    // التبديل التلقائي
    let slideInterval = setInterval(nextSlide, 5000);
    
    // إيقاف عند التمرير
    const container = document.querySelector('.screenshots-container');
    if (container) {
        container.addEventListener('mouseenter', () => clearInterval(slideInterval));
        container.addEventListener('mouseleave', () => {
            slideInterval = setInterval(nextSlide, 5000);
        });
    }
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
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.feature-card, .screenshot').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// القائمة المتنقلة
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuBtn || !navLinks) return;
    
    menuBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.contains('active');
        
        if (isOpen) {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active');
        } else {
            navLinks.classList.add('active');
            menuBtn.classList.add('active');
        }
    });
    
    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });
}

// تأثير التمرير للهيدر
function initHeaderScroll() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// عدادات الإحصائيات
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            let currentValue;
            if (target % 1 === 0) {
                currentValue = Math.floor(target * progress);
            } else {
                currentValue = (target * progress).toFixed(1);
            }
            
            counter.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(update);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(counter);
    });
}

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل Supabase
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => downloadTracker.initialize();
    document.head.appendChild(script);
    
    // إخفاء شاشة الترحيب
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    }, 2500);
    
    // تهيئة المكونات
    setTimeout(() => {
        initMobileMenu();
        initHeaderScroll();
        initImageLoading();
        initScreenshotSlider();
        initScrollAnimations();
        initCounters();
    }, 500);
    
    // إضافة أنيميشن للرسائل
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
        
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
        
        .mobile-menu-btn.active span:nth-child(1) {
            transform: rotate(45deg) translate(6px, 6px);
        }
        
        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-btn.active span:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -6px);
        }
    `;
    document.head.appendChild(style);
});

// جعل الدوال متاحة عالمياً
window.directDownload = directDownload;
window.scrollToSection = scrollToSection;
