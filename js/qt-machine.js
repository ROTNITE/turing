// path: js/qt-machine.js

import { QuantumRegister } from './quantum-register.js';
import { QuantumTape } from './quantum-tape.js';
import { Algorithms } from './algorithms.js';
import { Utils } from './utils.js';

/**
 * Квантовая машина Тьюринга - основной оркестратор
 * Управляет состоянием, выполнением и взаимодействием компонентов
 */
export class QTMachine {
    constructor() {
        this.quantumRegister = new QuantumRegister(2); // По умолчанию 2 кубита
        this.tapes = [
            new QuantumTape('input'),    // Лента входных данных
            new QuantumTape('work'),     // Рабочая лента  
            new QuantumTape('output')    // Лента выходных данных
        ];
        
        this.isRunning = false;
        this.isPaused = false;
        this.stepCount = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.speed = 5; // 1-10
        this.mode = 'manual'; // 'manual' | 'algorithm'
        
        this.currentAlgorithm = null;
        this.algorithmStep = 0;
        this.history = [];
        this.maxHistoryLength = 1000;
        
        // Колбэки для обновления UI
        this.onStateChange = null;
        this.onStep = null;
        this.onMeasurement = null;
        
        console.log('🤖 Квантовая машина Тьюринга создана');
    }
    
    /**
     * Запуск симуляции
     */
    start() {
        if (this.isRunning) {
            console.warn('Симуляция уже запущена');
            return;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = performance.now();
        
        console.log('▶️ Запуск симуляции');
        this.addToHistory('start', 'Симуляция запущена');
        
        if (this.mode === 'algorithm' && this.currentAlgorithm) {
            this.runAlgorithm();
        } else {
            this.runContinuous();
        }
        
        this.notifyStateChange();
    }
    
    /**
     * Остановка симуляции
     */
    stop() {
        if (!this.isRunning) {
            console.warn('Симуляция не запущена');
            return;
        }
        
        this.isRunning = false;
        this.updateElapsedTime();
        
        console.log('⏹️ Остановка симуляции');
        this.addToHistory('stop', 'Симуляция остановлена');
        
        this.notifyStateChange();
    }
    
    /**
     * Пауза/возобновление симуляции
     */
    pause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.updateElapsedTime();
            console.log('⏸️ Симуляция приостановлена');
        } else {
            this.startTime = performance.now() - this.elapsedTime;
            console.log('▶️ Симуляция возобновлена');
        }
        
        this.notifyStateChange();
    }
    
    /**
     * Выполнение одного шага
     */
    step() {
        try {
            this.stepCount++;
            console.log(`👣 Шаг ${this.stepCount}`);
            
            if (this.mode === 'algorithm' && this.currentAlgorithm) {
                this.executeAlgorithmStep();
            } else {
                this.executeManualStep();
            }
            
            this.addToHistory('step', `Выполнен шаг ${this.stepCount}`);
            this.notifyStep();
            
        } catch (error) {
            console.error('Ошибка при выполнении шага:', error);
            this.addToHistory('error', `Ошибка на шаге ${this.stepCount}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Сброс состояния
     */
    reset() {
        this.stop();
        
        this.stepCount = 0;
        this.elapsedTime = 0;
        this.algorithmStep = 0;
        this.history = [];
        
        // Сброс квантового регистра
        this.quantumRegister.reset();
        
        // Сброс лент
        this.tapes.forEach(tape => tape.reset());
        
        console.log('🔄 Состояние сброшено');
        this.addToHistory('reset', 'Система сброшена в начальное состояние');
        
        this.notifyStateChange();
    }
    
    /**
     * Применение квантового вентиля
     */
    applyGate(gateName, ...qubits) {
        try {
            this.quantumRegister.applyGate(gateName, ...qubits);
            
            const qubitsStr = qubits.length > 1 ? `кубитам ${qubits.join(',')}` : `кубиту ${qubits[0]}`;
            console.log(`🚪 Применен вентиль ${gateName} к ${qubitsStr}`);
            
            this.addToHistory('gate', `${gateName}(${qubits.join(',')})`, {
                gate: gateName,
                qubits: qubits,
                state: this.quantumRegister.getState()
            });
            
            this.notifyStateChange();
            
        } catch (error) {
            console.error(`Ошибка применения вентиля ${gateName}:`, error);
            throw error;
        }
    }
    
    /**
     * Измерение кубита
     */
    measureQubit(qubitIndex) {
        try {
            const result = this.quantumRegister.measure(qubitIndex);
            
            console.log(`📏 Измерение кубита ${qubitIndex}: результат ${result}`);
            
            this.addToHistory('measurement', `Измерение кубита ${qubitIndex} → |${result}⟩`, {
                qubit: qubitIndex,
                result: result,
                state: this.quantumRegister.getState()
            });
            
            this.notifyMeasurement(qubitIndex, result);
            this.notifyStateChange();
            
            return result;
            
        } catch (error) {
            console.error('Ошибка измерения:', error);
            throw error;
        }
    }
    
    /**
     * Измерение всех кубитов
     */
    measureAll() {
        try {
            const results = [];
            const numQubits = this.quantumRegister.getNumQubits();
            
            for (let i = 0; i < numQubits; i++) {
                results.push(this.quantumRegister.measure(i));
            }
            
            console.log(`📐 Измерение всех кубитов: |${results.join('')}⟩`);
            
            this.addToHistory('measurement_all', `Измерение всех кубитов → |${results.join('')}⟩`, {
                results: results,
                state: this.quantumRegister.getState()
            });
            
            this.notifyMeasurement('all', results);
            this.notifyStateChange();
            
            return results;
            
        } catch (error) {
            console.error('Ошибка измерения всех кубитов:', error);
            throw error;
        }
    }
    
    /**
     * Загрузка предустановки
     */
    loadPreset(presetName) {
        try {
            console.log(`📋 Загрузка предустановки: ${presetName}`);
            
            // Сброс состояния
            this.reset();
            
            // Загрузка предустановки через алгоритмы
            switch (presetName) {
                case 'bell-phi-plus':
                    Algorithms.createBellState(this.quantumRegister, 'phi-plus');
                    break;
                    
                case 'bell-phi-minus':
                    Algorithms.createBellState(this.quantumRegister, 'phi-minus');
                    break;
                    
                case 'bell-psi-plus':
                    Algorithms.createBellState(this.quantumRegister, 'psi-plus');
                    break;
                    
                case 'bell-psi-minus':
                    Algorithms.createBellState(this.quantumRegister, 'psi-minus');
                    break;
                    
                case 'deutsch-constant':
                    this.currentAlgorithm = 'deutsch';
                    this.mode = 'algorithm';
                    Algorithms.setupDeutschAlgorithm(this.quantumRegister, 'constant');
                    break;
                    
                case 'deutsch-balanced':
                    this.currentAlgorithm = 'deutsch';
                    this.mode = 'algorithm';
                    Algorithms.setupDeutschAlgorithm(this.quantumRegister, 'balanced');
                    break;
                    
                case 'grover-00':
                    this.currentAlgorithm = 'grover';
                    this.mode = 'algorithm';
                    Algorithms.setupGroverAlgorithm(this.quantumRegister, '00');
                    break;
                    
                case 'grover-01':
                    this.currentAlgorithm = 'grover';
                    this.mode = 'algorithm';
                    Algorithms.setupGroverAlgorithm(this.quantumRegister, '01');
                    break;
                    
                case 'grover-10':
                    this.currentAlgorithm = 'grover';
                    this.mode = 'algorithm';
                    Algorithms.setupGroverAlgorithm(this.quantumRegister, '10');
                    break;
                    
                case 'grover-11':
                    this.currentAlgorithm = 'grover';
                    this.mode = 'algorithm';
                    Algorithms.setupGroverAlgorithm(this.quantumRegister, '11');
                    break;
                    
                default:
                    throw new Error(`Неизвестная предустановка: ${presetName}`);
            }
            
            this.addToHistory('preset', `Загружена предустановка: ${presetName}`);
            console.log(`✅ Предустановка ${presetName} загружена`);
            
            this.notifyStateChange();
            
        } catch (error) {
            console.error('Ошибка загрузки предустановки:', error);
            throw error;
        }
    }
    
    /**
     * Непрерывное выполнение
     */
    runContinuous() {
        if (!this.isRunning || this.isPaused) return;
        
        try {
            this.step();
        } catch (error) {
            console.error('Ошибка в непрерывном режиме:', error);
            this.stop();
            return;
        }
        
        // Планирование следующего шага с учетом скорости
        const delay = Math.max(50, 1000 / this.speed);
        setTimeout(() => this.runContinuous(), delay);
    }
    
    /**
     * Выполнение алгоритма
     */
    runAlgorithm() {
        if (!this.isRunning || this.isPaused || !this.currentAlgorithm) return;
        
        try {
            const isComplete = this.executeAlgorithmStep();
            
            if (isComplete) {
                console.log(`✅ Алгоритм ${this.currentAlgorithm} завершен`);
                this.addToHistory('algorithm_complete', `Алгоритм ${this.currentAlgorithm} завершен`);
                this.stop();
                return;
            }
            
        } catch (error) {
            console.error('Ошибка в алгоритме:', error);
            this.stop();
            return;
        }
        
        // Планирование следующего шага
        const delay = Math.max(500, 2000 / this.speed); // Алгоритмы выполняются медленнее
        setTimeout(() => this.runAlgorithm(), delay);
    }
    
    /**
     * Выполнение шага алгоритма
     */
    executeAlgorithmStep() {
        if (!this.currentAlgorithm) return true;
        
        switch (this.currentAlgorithm) {
            case 'deutsch':
                return Algorithms.executeDeutschStep(this.quantumRegister, this.algorithmStep++);
                
            case 'grover':
                return Algorithms.executeGroverStep(this.quantumRegister, this.algorithmStep++);
                
            default:
                console.warn(`Неизвестный алгоритм: ${this.currentAlgorithm}`);
                return true;
        }
    }
    
    /**
     * Выполнение ручного шага
     */
    executeManualStep() {
        // В ручном режиме просто обновляем время и счетчики
        // Реальные операции выполняются через applyGate/measure
        this.updateElapsedTime();
    }
    
    /**
     * Установка скорости
     */
    setSpeed(speed) {
        this.speed = Math.max(1, Math.min(10, speed));
        console.log(`⚡ Скорость установлена: ${this.speed}`);
    }
    
    /**
     * Получение текущего состояния
     */
    getState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stepCount: this.stepCount,
            elapsedTime: this.elapsedTime,
            speed: this.speed,
            mode: this.mode,
            currentAlgorithm: this.currentAlgorithm,
            algorithmStep: this.algorithmStep,
            quantumState: this.quantumRegister.getState(),
            tapes: this.tapes.map(tape => tape.getState())
        };
    }
    
    /**
     * Получение квантового регистра
     */
    getQuantumRegister() {
        return this.quantumRegister;
    }
    
    /**
     * Получение ленты по индексу
     */
    getTape(index) {
        return this.tapes[index] || null;
    }
    
    /**
     * Получение всех лент
     */
    getTapes() {
        return this.tapes;
    }
    
    /**
     * Получение истории
     */
    getHistory() {
        return this.history;
    }
    
    /**
     * Получение текста статуса
     */
    getStatusText() {
        if (this.isRunning) {
            if (this.isPaused) {
                return 'Приостановлено';
            } else if (this.mode === 'algorithm') {
                return `Выполняется: ${this.currentAlgorithm}`;
            } else {
                return 'Выполняется';
            }
        } else {
            return 'Остановлено';
        }
    }
    
    /**
     * Добавление записи в историю
     */
    addToHistory(type, message, data = null) {
        const entry = {
            timestamp: Date.now(),
            step: this.stepCount,
            type: type,
            message: message,
            data: data
        };
        
        this.history.push(entry);
        
        // Ограничение размера истории
        if (this.history.length > this.maxHistoryLength) {
            this.history = this.history.slice(-this.maxHistoryLength + 100);
        }
    }
    
    /**
     * Обновление времени выполнения
     */
    updateElapsedTime() {
        if (this.startTime > 0) {
            this.elapsedTime = performance.now() - this.startTime;
        }
    }
    
    /**
     * Уведомление об изменении состояния
     */
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }
    
    /**
     * Уведомление о выполнении шага
     */
    notifyStep() {
        if (this.onStep) {
            this.onStep(this.stepCount);
        }
    }
    
    /**
     * Уведомление об измерении
     */
    notifyMeasurement(qubit, result) {
        if (this.onMeasurement) {
            this.onMeasurement(qubit, result);
        }
    }
    
    /**
     * Сериализация состояния
     */
    serialize() {
        return {
            stepCount: this.stepCount,
            elapsedTime: this.elapsedTime,
            mode: this.mode,
            currentAlgorithm: this.currentAlgorithm,
            algorithmStep: this.algorithmStep,
            quantumRegister: this.quantumRegister.serialize(),
            tapes: this.tapes.map(tape => tape.serialize()),
            history: this.history.slice(-50) // Только последние 50 записей
        };
    }
    
    /**
     * Десериализация состояния
     */
    deserialize(data) {
        this.stepCount = data.stepCount || 0;
        this.elapsedTime = data.elapsedTime || 0;
        this.mode = data.mode || 'manual';
        this.currentAlgorithm = data.currentAlgorithm || null;
        this.algorithmStep = data.algorithmStep || 0;
        
        if (data.quantumRegister) {
            this.quantumRegister.deserialize(data.quantumRegister);
        }
        
        if (data.tapes) {
            data.tapes.forEach((tapeData, index) => {
                if (this.tapes[index]) {
                    this.tapes[index].deserialize(tapeData);
                }
            });
        }
        
        if (data.history) {
            this.history = data.history;
        }
        
        console.log('📥 Состояние машины восстановлено');
        this.notifyStateChange();
    }
}
