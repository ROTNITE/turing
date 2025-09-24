// path: js/viz-amplitudes.js

import { Utils } from './utils.js';

/**
 * Визуализатор амплитуд квантовых состояний
 * Отображает Re/Im части и вероятности |ψ|²
 */
export class AmplitudeVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isInitialized = false;
        
        // Настройки отображения
        this.showReal = true;
        this.showImaginary = true;
        this.showProbabilities = true;
        this.showLabels = true;
        this.animationEnabled = true;
        
        // Данные для анимации
        this.currentAmplitudes = [];
        this.targetAmplitudes = [];
        this.animationProgress = 1;
        this.animationDuration = 300; // мс
        this.lastUpdateTime = 0;
        
        // Цвета
        this.colors = {
            real: '#3b82f6',        // Синий для Re
            imaginary: '#ef4444',   // Красный для Im  
            probability: '#10b981', // Зеленый для |ψ|²
            background: '#1f2937',  // Фон
            grid: '#374151',        // Сетка
            text: '#f9fafb',        // Текст
            axis: '#6b7280'         // Оси
        };
        
        console.log('📊 Создан визуализатор амплитуд');
    }
    
    /**
     * Инициализация визуализатора
     */
    async initialize() {
        try {
            this.setupCanvas();
            this.setupEventListeners();
            this.draw();
            
            this.isInitialized = true;
            console.log('✅ Визуализатор амплитуд инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации визуализатора амплитуд:', error);
            throw error;
        }
    }
    
    /**
     * Настройка canvas
     */
    setupCanvas() {
        // Настройка размеров с учетом DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Размеры для рисования
        this.width = rect.width;
        this.height = rect.height;
        
        // Настройка контекста
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Изменение размера окна
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 200));
        
        // Переключатели отображения
        const controls = [
            { id: 'show-real', prop: 'showReal' },
            { id: 'show-imaginary', prop: 'showImaginary' },
            { id: 'show-probabilities', prop: 'showProbabilities' }
        ];
        
        controls.forEach(({ id, prop }) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = this[prop];
                checkbox.addEventListener('change', (e) => {
                    this[prop] = e.target.checked;
                    this.draw();
                });
            }
        });
    }
    
    /**
     * Обновление амплитуд
     */
    updateAmplitudes(amplitudes) {
        if (!amplitudes || !this.isInitialized) return;
        
        // Сохранение текущих амплитуд для анимации
        this.currentAmplitudes = this.targetAmplitudes.length > 0 
            ? [...this.targetAmplitudes] 
            : amplitudes.map(amp => ({ re: 0, im: 0, prob: 0 }));
        
        this.targetAmplitudes = amplitudes.map(amp => ({
            re: amp.re || 0,
            im: amp.im || 0, 
            prob: amp.prob || (amp.re * amp.re + amp.im * amp.im)
        }));
        
        // Запуск анимации
        if (this.animationEnabled) {
            this.startAnimation();
        } else {
            this.currentAmplitudes = [...this.targetAmplitudes];
            this.draw();
        }
    }
    
    /**
     * Запуск анимации
     */
    startAnimation() {
        this.animationProgress = 0;
        this.lastUpdateTime = performance.now();
        this.animate();
    }
    
    /**
     * Анимация переходов
     */
    animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        this.animationProgress += deltaTime / this.animationDuration;
        
        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.currentAmplitudes = [...this.targetAmplitudes];
        } else {
            // Интерполяция между текущими и целевыми амплитудами
            this.currentAmplitudes = this.currentAmplitudes.map((current, index) => {
                const target = this.targetAmplitudes[index] || { re: 0, im: 0, prob: 0 };
                const progress = this.easeInOutCubic(this.animationProgress);
                
                return {
                    re: current.re + (target.re - current.re) * progress,
                    im: current.im + (target.im - current.im) * progress,
                    prob: current.prob + (target.prob - current.prob) * progress
                };
            });
        }
        
        this.draw();
        this.lastUpdateTime = currentTime;
        
        if (this.animationProgress < 1) {
            requestAnimationFrame(() => this.animate());
        }
    }
    
    /**
     * Функция сглаживания анимации
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Основная функция отрисовки
     */
    draw() {
        if (!this.isInitialized) return;
        
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Фон
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Проверка наличия данных
        if (!this.currentAmplitudes || this.currentAmplitudes.length === 0) {
            this.drawEmptyState();
            return;
        }
        
        // Вычисление макета
        const layout = this.calculateLayout();
        
        // Отрисовка сетки и осей
        this.drawGrid(layout);
        this.drawAxes(layout);
        
        // Отрисовка данных
        if (this.showReal) {
            this.drawBars(layout, 'real');
        }
        
        if (this.showImaginary) {
            this.drawBars(layout, 'imaginary');
        }
        
        if (this.showProbabilities) {
            this.drawBars(layout, 'probability');
        }
        
        // Подписи и легенда
        if (this.showLabels) {
            this.drawLabels(layout);
            this.drawLegend();
        }
    }
    
    /**
     * Вычисление макета для отрисовки
     */
    calculateLayout() {
        const padding = 60;
        const legendHeight = 40;
        
        const numStates = this.currentAmplitudes.length;
        const barsPerType = this.getActiveBarCount();
        
        return {
            padding: padding,
            plotWidth: this.width - 2 * padding,
            plotHeight: this.height - 2 * padding - legendHeight,
            plotX: padding,
            plotY: padding,
            barWidth: Math.max(8, (this.width - 2 * padding) / (numStates * barsPerType + numStates - 1)),
            numStates: numStates,
            barsPerType: barsPerType,
            maxValue: this.calculateMaxValue(),
            legendY: this.height - legendHeight
        };
    }
    
    /**
     * Подсчет количества активных типов баров
     */
    getActiveBarCount() {
        return (this.showReal ? 1 : 0) + 
               (this.showImaginary ? 1 : 0) + 
               (this.showProbabilities ? 1 : 0);
    }
    
    /**
     * Вычисление максимального значения для масштабирования
     */
    calculateMaxValue() {
        let maxValue = 0;
        
        this.currentAmplitudes.forEach(amp => {
            if (this.showReal) maxValue = Math.max(maxValue, Math.abs(amp.re));
            if (this.showImaginary) maxValue = Math.max(maxValue, Math.abs(amp.im));
            if (this.showProbabilities) maxValue = Math.max(maxValue, amp.prob);
        });
        
        return Math.max(maxValue, 0.1); // Минимальный масштаб
    }
    
    /**
     * Отрисовка сетки
     */
    drawGrid(layout) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([2, 2]);
        
        // Горизонтальные линии
        const numHorizontalLines = 5;
        for (let i = 0; i <= numHorizontalLines; i++) {
            const y = layout.plotY + (layout.plotHeight * i) / numHorizontalLines;
            
            this.ctx.beginPath();
            this.ctx.moveTo(layout.plotX, y);
            this.ctx.lineTo(layout.plotX + layout.plotWidth, y);
            this.ctx.stroke();
        }
        
        // Вертикальные линии для каждого состояния
        for (let i = 0; i < layout.numStates; i++) {
            const x = layout.plotX + (layout.plotWidth * i) / layout.numStates;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, layout.plotY);
            this.ctx.lineTo(x, layout.plotY + layout.plotHeight);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    /**
     * Отрисовка осей
     */
    drawAxes(layout) {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;
        
        // Ось X
        this.ctx.beginPath();
        this.ctx.moveTo(layout.plotX, layout.plotY + layout.plotHeight);
        this.ctx.lineTo(layout.plotX + layout.plotWidth, layout.plotY + layout.plotHeight);
        this.ctx.stroke();
        
        // Ось Y
        this.ctx.beginPath();
        this.ctx.moveTo(layout.plotX, layout.plotY);
        this.ctx.lineTo(layout.plotX, layout.plotY + layout.plotHeight);
        this.ctx.stroke();
        
        // Подписи осей
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        
        // Значения по Y
        const numYLabels = 5;
        for (let i = 0; i <= numYLabels; i++) {
            const value = (layout.maxValue * (numYLabels - i)) / numYLabels;
            const y = layout.plotY + (layout.plotHeight * i) / numYLabels;
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText(value.toFixed(2), layout.plotX - 10, y + 4);
        }
    }
    
    /**
     * Отрисовка столбцов
     */
    drawBars(layout, type) {
        const color = this.colors[type];
        const barOffset = this.getBarOffset(type);
        const barSpacing = 2;
        
        this.currentAmplitudes.forEach((amp, stateIndex) => {
            let value, height;
            
            switch (type) {
                case 'real':
                    value = amp.re;
                    height = Math.abs(value) / layout.maxValue * layout.plotHeight;
                    break;
                case 'imaginary': 
                    value = amp.im;
                    height = Math.abs(value) / layout.maxValue * layout.plotHeight;
                    break;
                case 'probability':
                    value = amp.prob;
                    height = value / layout.maxValue * layout.plotHeight;
                    break;
            }
            
            // Позиция столбца
            const groupX = layout.plotX + (layout.plotWidth * stateIndex) / layout.numStates;
            const barX = groupX + barOffset * (layout.barWidth + barSpacing);
            const barY = value >= 0 
                ? layout.plotY + layout.plotHeight - height
                : layout.plotY + layout.plotHeight;
            
            // Отрисовка столбца
            this.ctx.fillStyle = color;
            this.ctx.fillRect(barX, barY, layout.barWidth, height);
            
            // Обводка
            this.ctx.strokeStyle = Utils.darkenColor(color, 0.2);
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, layout.barWidth, height);
            
            // Значение над столбцом (для небольших графиков)
            if (layout.numStates <= 8 && height > 20) {
                this.ctx.fillStyle = this.colors.text;
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'center';
                
                const textY = barY - 5;
                this.ctx.fillText(value.toFixed(3), barX + layout.barWidth/2, textY);
            }
        });
    }
    
    /**
     * Получение смещения столбца для типа
     */
    getBarOffset(type) {
        let offset = 0;
        
        if (type === 'real') return 0;
        if (this.showReal) offset++;
        
        if (type === 'imaginary') return offset;
        if (this.showImaginary) offset++;
        
        if (type === 'probability') return offset;
        
        return offset;
    }
    
    /**
     * Отрисовка подписей состояний
     */
    drawLabels(layout) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        
        this.currentAmplitudes.forEach((amp, stateIndex) => {
            // Генерация подписи состояния (например, |00⟩, |01⟩, ...)
            const stateBinary = stateIndex.toString(2).padStart(Math.ceil(Math.log2(this.currentAmplitudes.length)), '0');
            const label = `|${stateBinary}⟩`;
            
            const x = layout.plotX + (layout.plotWidth * stateIndex) / layout.numStates + layout.plotWidth / (2 * layout.numStates);
            const y = layout.plotY + layout.plotHeight + 20;
            
            this.ctx.fillText(label, x, y);
        });
        
        // Подпись оси Y
        this.ctx.save();
        this.ctx.translate(20, layout.plotY + layout.plotHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Амплитуда', 0, 0);
        this.ctx.restore();
        
        // Подпись оси X
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Квантовые состояния', layout.plotX + layout.plotWidth / 2, layout.plotY + layout.plotHeight + 40);
    }
    
    /**
     * Отрисовка легенды
     */
    drawLegend() {
        const legendItems = [];
        
        if (this.showReal) legendItems.push({ color: this.colors.real, label: 'Re(ψ)' });
        if (this.showImaginary) legendItems.push({ color: this.colors.imaginary, label: 'Im(ψ)' });  
        if (this.showProbabilities) legendItems.push({ color: this.colors.probability, label: '|ψ|²' });
        
        if (legendItems.length === 0) return;
        
        const legendY = this.height - 30;
        const itemWidth = 80;
        const startX = (this.width - legendItems.length * itemWidth) / 2;
        
        this.ctx.font = '12px sans-serif';
        
        legendItems.forEach((item, index) => {
            const x = startX + index * itemWidth;
            
            // Цветной квадрат
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(x, legendY - 6, 12, 12);
            
            // Текст
            this.ctx.fillStyle = this.colors.text;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, x + 16, legendY + 4);
        });
    }
    
    /**
     * Отрисовка пустого состояния
     */
    drawEmptyState() {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.ctx.fillText('Нет данных для отображения', centerX, centerY);
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText('Создайте квантовое состояние или загрузите предустановку', centerX, centerY + 25);
    }
    
    /**
     * Обработка изменения размера
     */
    handleResize() {
        this.setupCanvas();
        this.draw();
    }
    
    /**
     * Переключение анимации
     */
    setAnimationEnabled(enabled) {
        this.animationEnabled = enabled;
    }
    
    /**
     * Экспорт изображения
     */
    exportImage() {
        return this.canvas.toDataURL('image/png');
    }
    
    /**
     * Сохранение как изображение
     */
    saveAsImage(filename = 'quantum-amplitudes.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.exportImage();
        link.click();
    }
}
