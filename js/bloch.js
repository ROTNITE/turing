// path: js/bloch.js
/**
 * Визуализация сферы Блоха для квантовых состояний
 * Реализует корректное отображение углов θ и φ
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex } from './complex.js';
import { QuantumState } from './quantum-state.js';

export class BlochSphere {
    /**
     * Создает визуализатор сферы Блоха
     * @param {HTMLCanvasElement} canvas - Canvas для рисования
     */
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas элемент обязателен для Блох-сферы');
        }

        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;
        
        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvas.getContext('2d');
        
        /** @type {number} */
        this.centerX = canvas.width / 2;
        
        /** @type {number} */
        this.centerY = canvas.height / 2;
        
        /** @type {number} */
        this.radius = Math.min(canvas.width, canvas.height) / 2 - 20;

        /** @type {Object} Цвета для текущей темы */
        this.colors = this.getThemeColors();

        // Настройка качества рендеринга
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Привязка обработчика изменения темы
        this.bindThemeEvents();
    }

    /**
     * Основной метод отрисовки сферы Блоха с квантовым состоянием
     * @param {QuantumState} state - Квантовое состояние для визуализации
     * @param {Object} options - Опции отображения
     */
    draw(state, options = {}) {
        const opts = {
            showGrid: true,
            showAxes: true,
            showLabels: true,
            showAngles: true,
            showCoordinates: false,
            animateState: false,
            ...options
        };

        // Очищаем canvas
        this.clear();

        // Обновляем цвета для текущей темы
        this.colors = this.getThemeColors();

        // Получаем углы и координаты состояния
        const { theta, phi } = state.getBlochAngles();
        const { x, y, z } = state.getBlochCoordinates();

        // Рисуем элементы сферы
        if (opts.showGrid) this.drawGrid();
        if (opts.showAxes) this.drawAxes();
        
        this.drawSphere();
        this.drawStateVector(x, y, z, theta, phi);
        
        if (opts.showLabels) this.drawLabels();
        if (opts.showAngles) this.drawAngles(theta, phi);
        if (opts.showCoordinates) this.drawCoordinates(x, y, z);

        // Отображаем информацию о состоянии
        this.drawStateInfo(state, theta, phi);
    }

    /**
     * Очистка canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Заливаем фон цветом темы
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Отрисовка основной сферы
     */
    drawSphere() {
        const ctx = this.ctx;

        // Внешний контур сферы
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = this.colors.sphereBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Полупрозрачная заливка сферы
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.colors.sphereFill;
        ctx.fill();
    }

    /**
     * Отрисовка координатных осей
     */
    drawAxes() {
        const ctx = this.ctx;
        
        ctx.strokeStyle = this.colors.axes;
        ctx.lineWidth = 2;

        // Ось Z (вертикальная)
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY - this.radius * 1.1);
        ctx.lineTo(this.centerX, this.centerY + this.radius * 1.1);
        ctx.stroke();

        // Ось X (горизонтальная)
        ctx.beginPath();
        ctx.moveTo(this.centerX - this.radius * 1.1, this.centerY);
        ctx.lineTo(this.centerX + this.radius * 1.1, this.centerY);
        ctx.stroke();

        // Ось Y (диагональная, показывает проекцию 3D)
        const yAxisAngle = -Math.PI / 6; // 30 градусов
        const yAxisLength = this.radius * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(
            this.centerX - yAxisLength * Math.cos(yAxisAngle),
            this.centerY + yAxisLength * Math.sin(yAxisAngle)
        );
        ctx.lineTo(
            this.centerX + yAxisLength * Math.cos(yAxisAngle),
            this.centerY - yAxisLength * Math.sin(yAxisAngle)
        );
        ctx.stroke();

        // Стрелки на концах осей
        this.drawArrow(this.centerX, this.centerY - this.radius * 1.1, 0, 8);     // Z+
        this.drawArrow(this.centerX + this.radius * 1.1, this.centerY, Math.PI/2, 8); // X+
        this.drawArrow(
            this.centerX + yAxisLength * Math.cos(yAxisAngle),
            this.centerY - yAxisLength * Math.sin(yAxisAngle),
            yAxisAngle - Math.PI/2, 6
        ); // Y+
    }

    /**
     * Отрисовка координатной сетки
     */
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;

        // Экваториальная окружность
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Меридианы (вертикальные полуокружности)
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 4;
            const xOffset = this.radius * Math.cos(angle) * 0.3;
            
            ctx.beginPath();
            ctx.ellipse(
                this.centerX + xOffset, 
                this.centerY, 
                this.radius * Math.abs(Math.sin(angle)), 
                this.radius, 
                0, 0, 2 * Math.PI
            );
            ctx.stroke();
        }

        // Параллели (горизонтальные эллипсы)
        for (let i = 1; i < 4; i++) {
            const yOffset = (this.radius * i) / 4;
            const ellipseRadius = this.radius * Math.sqrt(1 - (i/4) * (i/4));
            
            // Верхние параллели
            ctx.beginPath();
            ctx.ellipse(
                this.centerX, 
                this.centerY - yOffset, 
                ellipseRadius, 
                ellipseRadius * 0.3, 
                0, 0, 2 * Math.PI
            );
            ctx.stroke();
            
            // Нижние параллели
            ctx.beginPath();
            ctx.ellipse(
                this.centerX, 
                this.centerY + yOffset, 
                ellipseRadius, 
                ellipseRadius * 0.3, 
                0, 0, 2 * Math.PI
            );
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
    }

    /**
     * Отрисовка вектора состояния на сфере
     * @param {number} x - X координата на сфере Блоха
     * @param {number} y - Y координата на сфере Блоха
     * @param {number} z - Z координата на сфере Блоха
     * @param {number} theta - Полярный угол
     * @param {number} phi - Азимутальный угол
     */
    drawStateVector(x, y, z, theta, phi) {
        const ctx = this.ctx;

        // Преобразуем 3D координаты в 2D координаты canvas
        // Используем простую ортогональную проекцию
        const canvasX = this.centerX + x * this.radius;
        const canvasY = this.centerY - z * this.radius; // Y инвертирован в canvas
        
        // Учитываем Y-компонент через смещение
        const yProjection = y * this.radius * 0.3;
        const finalX = canvasX + yProjection * Math.cos(-Math.PI/6);
        const finalY = canvasY + yProjection * Math.sin(-Math.PI/6);

        // Рисуем вектор состояния
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(finalX, finalY);
        ctx.strokeStyle = this.colors.stateVector;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Рисуем точку на конце вектора
        ctx.beginPath();
        ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = this.colors.statePoint;
        ctx.fill();
        ctx.strokeStyle = this.colors.statePointBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Рисуем проекцию на экваториальную плоскость
        const projX = this.centerX + x * this.radius;
        const projY = this.centerY;
        
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(finalX, finalY);
        ctx.lineTo(projX, projY);
        ctx.strokeStyle = this.colors.projection;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(projX, projY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = this.colors.projection;
        ctx.fill();
        ctx.setLineDash([]);

        // Рисуем дугу для угла θ (от оси Z)
        if (theta > 0.1 && theta < Math.PI - 0.1) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius * 0.3, -Math.PI/2, -Math.PI/2 + theta, false);
            ctx.strokeStyle = this.colors.angleTheta;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Рисуем дугу для угла φ (от оси X в экваториальной плоскости)  
        if (Math.abs(Math.sin(theta)) > 0.1 && phi > 0.1) {
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius * 0.4, 0, phi, false);
            ctx.strokeStyle = this.colors.anglePhi;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Отрисовка подписей осей и состояний
     */
    drawLabels() {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.labels;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';

        // Подписи базисных состояний на осях
        ctx.fillText('|0⟩', this.centerX, this.centerY - this.radius - 20);     // Верх (Z+)
        ctx.fillText('|1⟩', this.centerX, this.centerY + this.radius + 30);     // Низ (Z-)
        
        ctx.fillText('|+⟩', this.centerX + this.radius + 20, this.centerY + 5); // Право (X+)
        ctx.fillText('|-⟩', this.centerX - this.radius - 20, this.centerY + 5); // Лево (X-)
        
        // Подписи для Y состояний (более тонкие)
        ctx.font = '12px Arial';
        ctx.fillText('|+i⟩', this.centerX + 15, this.centerY - 15);
        ctx.fillText('|-i⟩', this.centerX - 15, this.centerY + 15);

        // Подписи осей
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.colors.axisLabels;
        ctx.fillText('Z', this.centerX + 10, this.centerY - this.radius - 20);
        ctx.fillText('X', this.centerX + this.radius + 20, this.centerY - 10);
        ctx.fillText('Y', this.centerX + 25, this.centerY - 25);
    }

    /**
     * Отображение углов θ и φ
     * @param {number} theta - Полярный угол
     * @param {number} phi - Азимутальный угол
     */
    drawAngles(theta, phi) {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.angleText;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';

        const thetaDeg = (theta * 180 / Math.PI).toFixed(1);
        const phiDeg = (phi * 180 / Math.PI).toFixed(1);

        ctx.fillText(`θ = ${thetaDeg}°`, 10, this.canvas.height - 40);
        ctx.fillText(`φ = ${phiDeg}°`, 10, this.canvas.height - 25);
    }

    /**
     * Отображение декартовых координат
     * @param {number} x - X координата
     * @param {number} y - Y координата  
     * @param {number} z - Z координата
     */
    drawCoordinates(x, y, z) {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.coordinateText;
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';

        ctx.fillText(`x = ${x.toFixed(3)}`, this.canvas.width - 10, this.canvas.height - 55);
        ctx.fillText(`y = ${y.toFixed(3)}`, this.canvas.width - 10, this.canvas.height - 40);
        ctx.fillText(`z = ${z.toFixed(3)}`, this.canvas.width - 10, this.canvas.height - 25);
    }

    /**
     * Отображение информации о квантовом состоянии
     * @param {QuantumState} state - Квантовое состояние
     * @param {number} theta - Полярный угол
     * @param {number} phi - Азимутальный угол
     */
    drawStateInfo(state, theta, phi) {
        const ctx = this.ctx;
        
        // Фон для информационной панели
        const panelX = 10;
        const panelY = 10;
        const panelWidth = 220;
        const panelHeight = 90;
        
        ctx.fillStyle = this.colors.infoPanelBackground;
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = this.colors.infoPanelBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Текст с информацией о состоянии
        ctx.fillStyle = this.colors.infoText;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';

        const stateStr = state.toString(3);
        const prob0 = (state.getProbability0() * 100).toFixed(1);
        const prob1 = (state.getProbability1() * 100).toFixed(1);
        const entropy = state.getEntropy().toFixed(3);

        ctx.fillText('Состояние:', panelX + 5, panelY + 15);
        ctx.fillText(stateStr, panelX + 5, panelY + 30);
        ctx.fillText(`P(0) = ${prob0}%  P(1) = ${prob1}%`, panelX + 5, panelY + 45);
        ctx.fillText(`H = ${entropy} bits`, panelX + 5, panelY + 60);
        ctx.fillText(`θ=${(theta*180/Math.PI).toFixed(1)}° φ=${(phi*180/Math.PI).toFixed(1)}°`, panelX + 5, panelY + 75);
    }

    /**
     * Отрисовка стрелки
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {number} angle - Угол поворота стрелки
     * @param {number} size - Размер стрелки
     */
    drawArrow(x, y, angle, size) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/2, size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
        
        ctx.fillStyle = this.colors.axes;
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Получение цветовой схемы в зависимости от темы
     * @returns {Object} Объект с цветами
     */
    getThemeColors() {
        const isDarkTheme = document.body.getAttribute('data-theme') === 'dark' || 
                           (!document.body.getAttribute('data-theme') && 
                            window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDarkTheme) {
            return {
                background: '#1a202c',
                sphereBorder: '#4a5568',
                sphereFill: 'rgba(74, 85, 104, 0.1)',
                axes: '#a0aec0',
                grid: '#4a5568',
                stateVector: '#ff6b6b',
                statePoint: '#ff4757',
                statePointBorder: '#ffffff',
                projection: '#ffa502',
                angleTheta: '#3742fa',
                anglePhi: '#2ed573',
                labels: '#e2e8f0',
                axisLabels: '#cbd5e0',
                angleText: '#a0aec0',
                coordinateText: '#a0aec0',
                infoPanelBackground: 'rgba(45, 55, 72, 0.9)',
                infoPanelBorder: '#4a5568',
                infoText: '#e2e8f0'
            };
        } else {
            return {
                background: '#ffffff',
                sphereBorder: '#2d3748',
                sphereFill: 'rgba(45, 55, 72, 0.05)',
                axes: '#4a5568',
                grid: '#cbd5e0',
                stateVector: '#e53e3e',
                statePoint: '#c53030',
                statePointBorder: '#000000',
                projection: '#dd6b20',
                angleTheta: '#3182ce',
                anglePhi: '#38a169',
                labels: '#2d3748',
                axisLabels: '#1a202c',
                angleText: '#4a5568',
                coordinateText: '#4a5568',
                infoPanelBackground: 'rgba(255, 255, 255, 0.95)',
                infoPanelBorder: '#cbd5e0',
                infoText: '#2d3748'
            };
        }
    }

    /**
     * Привязка событий изменения темы
     */
    bindThemeEvents() {
        // Слушаем изменения системной темы
        window.matchMedia('(prefers-color-scheme: dark)')
              .addEventListener('change', () => {
                  this.colors = this.getThemeColors();
              });

        // Слушаем изменения темы через MutationObserver
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'data-theme') {
                    this.colors = this.getThemeColors();
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Анимация перехода между состояниями
     * @param {QuantumState} fromState - Начальное состояние
     * @param {QuantumState} toState - Конечное состояние
     * @param {number} duration - Длительность анимации в мс
     * @param {Function} onComplete - Callback по завершении
     */
    animateTransition(fromState, toState, duration = 1000, onComplete = null) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Интерполяция между состояниями
            const t = progress;
            const interpolatedAlpha = new Complex(
                fromState.alpha.re * (1-t) + toState.alpha.re * t,
                fromState.alpha.im * (1-t) + toState.alpha.im * t
            );
            const interpolatedBeta = new Complex(
                fromState.beta.re * (1-t) + toState.beta.re * t,
                fromState.beta.im * (1-t) + toState.beta.im * t
            );
            
            const interpolatedState = new QuantumState(interpolatedAlpha, interpolatedBeta);
            this.draw(interpolatedState, { animateState: true });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Изменение размера canvas с сохранением качества
     * @param {number} width - Новая ширина
     * @param {number} height - Новая высота
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.radius = Math.min(width, height) / 2 - 20;
        
        // Обновляем настройки качества
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    /**
     * Экспорт изображения сферы Блоха
     * @param {string} format - Формат изображения ('png' или 'jpeg')
     * @returns {string} Data URL изображения
     */
    exportImage(format = 'png') {
        return this.canvas.toDataURL(`image/${format}`, 0.95);
    }
}