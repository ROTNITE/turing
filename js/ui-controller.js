// path: js/ui-controller.js

import { Utils } from './utils.js';
import { BlochSphere } from './bloch.js';
import { AmplitudeVisualizer } from './viz-amplitudes.js';

/**
 * Контроллер пользовательского интерфейса
 * Связывает DOM-элементы с квантовой машиной
 */
export class UIController {
    constructor(machine) {
        this.machine = machine;
        this.blochSphere = null;
        this.amplitudeViz = null;
        this.isInitialized = false;
        this.theme = 'dark';
        this.updateInterval = null;
    }
    
    /**
     * Инициализация UI контроллера
     */
    async initialize() {
        console.log('🎨 Инициализация UI контроллера...');
        
        try {
            // Инициализация визуализации
            await this.initializeVisualization();
            
            // Привязка событий
            this.bindEvents();
            
            // Загрузка сохраненных настроек
            this.loadSettings();
            
            // Установка начального состояния
            this.updateDisplay();
            
            this.isInitialized = true;
            console.log('✅ UI контроллер инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации UI:', error);
            throw error;
        }
    }
    
    /**
     * Инициализация компонентов визуализации
     */
    async initializeVisualization() {
        // Блох-сфера
        const blochCanvas = document.getElementById('bloch-canvas');
        if (blochCanvas) {
            this.blochSphere = new BlochSphere(blochCanvas);
            await this.blochSphere.initialize();
        }
        
        // Визуализация амплитуд
        const ampCanvas = document.getElementById('amplitudes-canvas');
        if (ampCanvas) {
            this.amplitudeViz = new AmplitudeVisualizer(ampCanvas);
            await this.amplitudeViz.initialize();
        }
        
        // Визуализация лент
        this.initializeTapeVisualization();
    }
    
    /**
     * Привязка событий DOM
     */
    bindEvents() {
        // Кнопки управления
        this.bindControlButtons();
        
        // Переключатель темы
        this.bindThemeToggle();
        
        // Настройки симуляции
        this.bindSettingsControls();
        
        // Вентили
        this.bindGateButtons();
        
        // Предустановки
        this.bindPresetButtons();
        
        // Обработка изменения размера окна
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 200));
    }
    
    /**
     * Привязка кнопок управления
     */
    bindControlButtons() {
        const controls = [
            { id: 'start-btn', action: () => this.machine.start() },
            { id: 'stop-btn', action: () => this.machine.stop() },
            { id: 'step-btn', action: () => this.machine.step() },
            { id: 'reset-btn', action: () => this.machine.reset() }
        ];
        
        controls.forEach(({ id, action }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        action();
                        this.updateDisplay();
                    } catch (error) {
                        console.error(`Ошибка при выполнении ${id}:`, error);
                        this.showNotification(`Ошибка: ${error.message}`, 'error');
                    }
                });
            } else {
                console.warn(`Элемент ${id} не найден`);
            }
        });
    }
    
    /**
     * Привязка переключателя темы
     */
    bindThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }
    
    /**
     * Привязка контролов настроек
     */
    bindSettingsControls() {
        // Слайдер скорости
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseInt(e.target.value);
                this.machine.setSpeed(speed);
                this.updateSpeedDisplay(speed);
            });
        }
        
        // Селектор алгоритма
        const algorithmSelect = document.getElementById('algorithm-select');
        if (algorithmSelect) {
            algorithmSelect.addEventListener('change', (e) => {
                const algorithm = e.target.value;
                if (algorithm) {
                    this.loadPreset(algorithm);
                }
            });
        }
        
        // Селекторы кубитов для двухкубитных операций
        const controlQubit = document.getElementById('control-qubit');
        const targetQubit = document.getElementById('target-qubit');
        
        if (controlQubit && targetQubit) {
            [controlQubit, targetQubit].forEach(select => {
                select.addEventListener('change', () => {
                    this.updateTwoQubitControls();
                });
            });
        }
    }
    
    /**
     * Привязка кнопок квантовых вентилей
     */
    bindGateButtons() {
        // Однокубитные вентили
        const singleQubitGates = ['I', 'X', 'Y', 'Z', 'H', 'S', 'T'];
        singleQubitGates.forEach(gate => {
            const button = document.querySelector(`[data-gate="${gate}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    const qubit = this.getSelectedQubit();
                    this.applyGate(gate, qubit);
                });
            }
        });
        
        // Двухкубитные вентили  
        const twoQubitGates = ['CNOT', 'CZ', 'SWAP'];
        twoQubitGates.forEach(gate => {
            const button = document.querySelector(`[data-gate="${gate}"]`);
            if (button) {
                button.addEventListener('click', () => {
                    const control = this.getControlQubit();
                    const target = this.getTargetQubit();
                    this.applyGate(gate, control, target);
                });
            }
        });
        
        // Кнопки измерения
        const measureButton = document.getElementById('measure-btn');
        if (measureButton) {
            measureButton.addEventListener('click', () => {
                const qubit = this.getSelectedQubit();
                this.measureQubit(qubit);
            });
        }
        
        const measureAllButton = document.getElementById('measure-all-btn');
        if (measureAllButton) {
            measureAllButton.addEventListener('click', () => {
                this.measureAll();
            });
        }
    }
    
    /**
     * Применение квантового вентиля
     */
    applyGate(gate, ...qubits) {
        try {
            this.machine.applyGate(gate, ...qubits);
            this.updateDisplay();
            this.logOperation(`Применен вентиль ${gate} к кубиту(ам) ${qubits.join(',')}`);
        } catch (error) {
            console.error(`Ошибка применения вентиля ${gate}:`, error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
        }
    }
    
    /**
     * Измерение кубита
     */
    measureQubit(qubit) {
        try {
            const result = this.machine.measureQubit(qubit);
            this.updateDisplay();
            this.logOperation(`Измерение кубита ${qubit}: результат ${result}`);
            this.showNotification(`Результат измерения: |${result}⟩`, 'success');
        } catch (error) {
            console.error('Ошибка измерения:', error);
            this.showNotification(`Ошибка измерения: ${error.message}`, 'error');
        }
    }
    
    /**
     * Измерение всех кубитов
     */
    measureAll() {
        try {
            const results = this.machine.measureAll();
            this.updateDisplay();
            this.logOperation(`Измерение всех кубитов: ${results.join('')}`);
            this.showNotification(`Результат: |${results.join('')}⟩`, 'success');
        } catch (error) {
            console.error('Ошибка измерения всех кубитов:', error);
            this.showNotification(`Ошибка измерения: ${error.message}`, 'error');
        }
    }
    
    /**
     * Загрузка предустановки
     */
    loadPreset(presetName) {
        try {
            this.machine.loadPreset(presetName);
            this.updateDisplay();
            this.logOperation(`Загружена предустановка: ${presetName}`);
            this.showNotification(`Загружена предустановка: ${presetName}`, 'info');
        } catch (error) {
            console.error('Ошибка загрузки предустановки:', error);
            this.showNotification(`Ошибка: ${error.message}`, 'error');
        }
    }
    
    /**
     * Обновление отображения
     */
    updateDisplay() {
        if (!this.isInitialized) return;
        
        try {
            this.updateStatusIndicators();
            this.updateQuantumVisualization();
            this.updateTapeVisualization();
            this.updateControlStates();
        } catch (error) {
            console.error('Ошибка обновления дисплея:', error);
        }
    }
    
    /**
     * Обновление индикаторов состояния
     */
    updateStatusIndicators() {
        // Счетчик шагов
        const stepCounter = document.getElementById('step-counter');
        if (stepCounter) {
            stepCounter.textContent = this.machine.stepCount;
        }
        
        // Таймер
        const timer = document.getElementById('timer');
        if (timer) {
            timer.textContent = Utils.formatTime(this.machine.elapsedTime);
        }
        
        // Статус симуляции
        const status = document.getElementById('status');
        if (status) {
            status.textContent = this.machine.getStatusText();
            status.className = `status ${this.machine.isRunning ? 'running' : 'stopped'}`;
        }
    }
    
    /**
     * Обновление квантовой визуализации
     */
    updateQuantumVisualization() {
        const selectedQubit = this.getSelectedQubit();
        const register = this.machine.getQuantumRegister();
        
        // Обновление Блох-сферы
        if (this.blochSphere && register) {
            const state = register.getQubitState(selectedQubit);
            if (state) {
                this.blochSphere.updateState(state);
            }
        }
        
        // Обновление визуализации амплитуд
        if (this.amplitudeViz && register) {
            this.amplitudeViz.updateAmplitudes(register.getAmplitudes());
        }
    }
    
    /**
     * Переключение темы
     */
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', this.theme);
        
        // Обновление иконки переключателя
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
        
        // Сохранение настройки
        localStorage.setItem('qtm-theme', this.theme);
        
        // Уведомление об изменении
        this.showNotification(`Переключена ${this.theme === 'dark' ? 'тёмная' : 'светлая'} тема`, 'info');
    }
    
    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Автоматическое удаление через 4 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
    
    /**
     * Логирование операций
     */
    logOperation(message) {
        const logContainer = document.getElementById('operations-log');
        if (!logContainer) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">${message}</span>
        `;
        
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Ограничение количества записей
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }
    
    /**
     * Получение выбранного кубита
     */
    getSelectedQubit() {
        const selector = document.getElementById('qubit-selector');
        return selector ? parseInt(selector.value) : 0;
    }
    
    /**
     * Получение контрольного кубита
     */
    getControlQubit() {
        const selector = document.getElementById('control-qubit');
        return selector ? parseInt(selector.value) : 0;
    }
    
    /**
     * Получение целевого кубита
     */
    getTargetQubit() {
        const selector = document.getElementById('target-qubit');
        return selector ? parseInt(selector.value) : 1;
    }
    
    /**
     * Загрузка настроек
     */
    loadSettings() {
        // Тема
        const savedTheme = localStorage.getItem('qtm-theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.theme = savedTheme;
        document.body.setAttribute('data-theme', this.theme);
        
        // Скорость симуляции
        const savedSpeed = localStorage.getItem('qtm-speed');
        if (savedSpeed) {
            const speed = parseInt(savedSpeed);
            this.machine.setSpeed(speed);
            this.updateSpeedDisplay(speed);
            
            const speedSlider = document.getElementById('speed-slider');
            if (speedSlider) {
                speedSlider.value = speed;
            }
        }
    }
    
    /**
     * Сохранение настроек
     */
    saveSettings() {
        localStorage.setItem('qtm-theme', this.theme);
        localStorage.setItem('qtm-speed', this.machine.speed.toString());
    }
    
    /**
     * Показать справку
     */
    showHelp() {
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.setAttribute('aria-hidden', 'false');
        }
    }
    
    /**
     * Обновление отображения скорости
     */
    updateSpeedDisplay(speed) {
        const speedDisplay = document.getElementById('speed-value');
        if (speedDisplay) {
            speedDisplay.textContent = speed;
        }
    }
    
    /**
     * Обработка изменения размера окна
     */
    handleResize() {
        if (this.blochSphere) {
            this.blochSphere.handleResize();
        }
        if (this.amplitudeViz) {
            this.amplitudeViz.handleResize();
        }
    }
    
    /**
     * Инициализация визуализации лент
     */
    initializeTapeVisualization() {
        // Инициализация canvas для лент
        const tapeCanvases = document.querySelectorAll('.tape-canvas');
        tapeCanvases.forEach((canvas, index) => {
            if (canvas.getContext) {
                const ctx = canvas.getContext('2d');
                this.setupTapeCanvas(ctx, index);
            }
        });
    }
    
    /**
     * Настройка canvas для ленты
     */
    setupTapeCanvas(ctx, tapeIndex) {
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        
        // Установка размеров с учетом DPI
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        // Начальная отрисовка
        this.renderTape(ctx, tapeIndex);
    }
    
    /**
     * Отрисовка ленты
     */
    renderTape(ctx, tapeIndex) {
        const canvas = ctx.canvas;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        // Очистка
        ctx.clearRect(0, 0, width, height);
        
        // Получение данных ленты
        const tape = this.machine.getTape(tapeIndex);
        if (!tape) return;
        
        const cellWidth = 40;
        const cellHeight = 30;
        const startX = Math.max(0, (width - tape.length * cellWidth) / 2);
        
        // Отрисовка ячеек
        tape.forEach((cell, index) => {
            const x = startX + index * cellWidth;
            const y = (height - cellHeight) / 2;
            
            // Фон ячейки
            ctx.fillStyle = cell.isActive ? '#3182ce' : '#2d3748';
            ctx.fillRect(x, y, cellWidth - 1, cellHeight);
            
            // Обводка
            ctx.strokeStyle = '#4a5568';
            ctx.strokeRect(x, y, cellWidth - 1, cellHeight);
            
            // Содержимое ячейки
            if (cell.value !== null) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(cell.value.toString(), x + cellWidth/2, y + cellHeight/2 + 4);
            }
        });
    }
    
    /**
     * Обновление визуализации лент
     */
    updateTapeVisualization() {
        const tapeCanvases = document.querySelectorAll('.tape-canvas');
        tapeCanvases.forEach((canvas, index) => {
            if (canvas.getContext) {
                const ctx = canvas.getContext('2d');
                this.renderTape(ctx, index);
            }
        });
    }
    
    /**
     * Обновление состояний контролов
     */
    updateControlStates() {
        // Кнопки управления
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const stepBtn = document.getElementById('step-btn');
        
        if (startBtn) startBtn.disabled = this.machine.isRunning;
        if (stopBtn) stopBtn.disabled = !this.machine.isRunning;
        if (stepBtn) stepBtn.disabled = this.machine.isRunning;
        
        // Обновление состояния кнопок вентилей
        const gateButtons = document.querySelectorAll('[data-gate]');
        gateButtons.forEach(button => {
            button.disabled = this.machine.isRunning;
        });
    }
    
    /**
     * Обновление контролов для двухкубитных операций
     */
    updateTwoQubitControls() {
        const controlQubit = this.getControlQubit();
        const targetQubit = this.getTargetQubit();
        
        // Обновление видимости предупреждений
        const warning = document.getElementById('two-qubit-warning');
        if (warning) {
            warning.style.display = (controlQubit === targetQubit) ? 'block' : 'none';
        }
        
        // Обновление состояния кнопок двухкубитных вентилей
        const twoQubitButtons = document.querySelectorAll('[data-gate="CNOT"], [data-gate="CZ"], [data-gate="SWAP"]');
        twoQubitButtons.forEach(button => {
            button.disabled = this.machine.isRunning || (controlQubit === targetQubit);
        });
    }
}
