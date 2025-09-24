// path: js/utils.js

/**
 * Утилиты для квантового симулятора
 */
export class Utils {
    /**
     * Проверка поддержки браузера
     */
    static checkBrowserSupport() {
        const requiredFeatures = [
            'ES6 modules' in window,
            'requestAnimationFrame' in window,
            'localStorage' in window,
            'Canvas' in window
        ];
        
        // Проверка ES6 модулей
        try {
            new Function('import("")');
        } catch (e) {
            console.warn('ES6 modules not supported');
            return false;
        }
        
        // Проверка Canvas
        const canvas = document.createElement('canvas');
        if (!canvas.getContext || !canvas.getContext('2d')) {
            console.warn('Canvas not supported');
            return false;
        }
        
        return true;
    }
    
    /**
     * Debounce функция
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle функция  
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Форматирование времени
     */
    static formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Затемнение цвета
     */
    static darkenColor(color, factor) {
        // Простая реализация для hex и rgb цветов
        if (color.startsWith('#')) {
            const num = parseInt(color.slice(1), 16);
            const r = Math.floor((num >> 16) * (1 - factor));
            const g = Math.floor((num >> 8 & 0x00FF) * (1 - factor));
            const b = Math.floor((num & 0x0000FF) * (1 - factor));
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
    
    /**
     * Осветление цвета
     */
    static lightenColor(color, factor) {
        if (color.startsWith('#')) {
            const num = parseInt(color.slice(1), 16);
            const r = Math.floor((num >> 16) + (255 - (num >> 16)) * factor);
            const g = Math.floor((num >> 8 & 0x00FF) + (255 - (num >> 8 & 0x00FF)) * factor);
            const b = Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * factor);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    }
    
    /**
     * Генерация случайного ID
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Клонирование объекта
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
        return obj;
    }
    
    /**
     * Проверка на число
     */
    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
    
    /**
     * Ограничение значения в диапазоне
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Линейная интерполяция
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    /**
     * Преобразование радиан в градусы
     */
    static radToDeg(rad) {
        return rad * 180 / Math.PI;
    }
    
    /**
     * Преобразование градусов в радианы
     */
    static degToRad(deg) {
        return deg * Math.PI / 180;
    }
    
    /**
     * Форматирование комплексного числа
     */
    static formatComplex(complex, precision = 3) {
        if (!complex || (complex.re === undefined && complex.im === undefined)) {
            return '0';
        }
        
        const re = Number(complex.re || 0).toFixed(precision);
        const im = Number(complex.im || 0).toFixed(precision);
        
        if (Math.abs(complex.im || 0) < 1e-10) {
            return re;
        } else if (Math.abs(complex.re || 0) < 1e-10) {
            return `${im}i`;
        } else {
            const sign = (complex.im || 0) >= 0 ? '+' : '';
            return `${re}${sign}${im}i`;
        }
    }
    
    /**
     * Форматирование квантового состояния
     */
    static formatQuantumState(amplitudes, precision = 3) {
        if (!amplitudes || amplitudes.length === 0) {
            return '|0⟩';
        }
        
        const terms = [];
        amplitudes.forEach((amp, index) => {
            if (Math.abs(amp.re || 0) > 1e-10 || Math.abs(amp.im || 0) > 1e-10) {
                const coeff = Utils.formatComplex(amp, precision);
                const basis = index.toString(2).padStart(Math.ceil(Math.log2(amplitudes.length)), '0');
                
                if (coeff === '1') {
                    terms.push(`|${basis}⟩`);
                } else if (coeff === '-1') {
                    terms.push(`-|${basis}⟩`);
                } else {
                    terms.push(`${coeff}|${basis}⟩`);
                }
            }
        });
        
        if (terms.length === 0) {
            return '|0⟩';
        }
        
        return terms.join(' + ').replace(/\+ -/g, '- ');
    }
    
    /**
     * Сохранение в localStorage
     */
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Ошибка сохранения в localStorage:', error);
            return false;
        }
    }
    
    /**
     * Загрузка из localStorage
     */
    static loadFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Ошибка загрузки из localStorage:', error);
            return defaultValue;
        }
    }
    
    /**
     * Удаление из localStorage
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Ошибка удаления из localStorage:', error);
            return false;
        }
    }
    
    /**
     * Скачивание файла
     */
    static downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Проверка мобильного устройства
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * Получение параметров URL
     */
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    }
    
    /**
     * Генерация цвета по индексу
     */
    static generateColor(index, saturation = 70, lightness = 50) {
        const hue = (index * 137.5) % 360; // Золотое сечение для распределения цветов
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    /**
     * Валидация email
     */
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Копирование в буфер обмена
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.warn('Ошибка копирования в буфер обмена:', error);
            return false;
        }
    }
    
    /**
     * Анимация скролла к элементу
     */
    static scrollToElement(element, duration = 500) {
        if (!element) return;
        
        const startPosition = window.pageYOffset;
        const targetPosition = element.getBoundingClientRect().top + startPosition;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    }
}
