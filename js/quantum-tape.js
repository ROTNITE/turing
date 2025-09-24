// path: js/quantum-tape.js
/**
 * Класс для представления квантовой ленты в машине Тьюринга
 * Реализует ленту с квантовыми ячейками и головкой чтения/записи
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex } from './complex.js';
import { QuantumState } from './quantum-state.js';
import { QuantumRegister } from './quantum-register.js';
import { QuantumGates } from './quantum-gates.js';

export class QuantumTape {
    /**
     * Создает квантовую ленту
     * @param {number} size - Размер ленты (количество ячеек)
     * @param {string} type - Тип ленты ('input', 'work', 'output')
     */
    constructor(size = 20, type = 'work') {
        if (size < 1 || size > 100) {
            throw new Error('Размер ленты должен быть от 1 до 100');
        }

        /** @type {number} Размер ленты */
        this.size = size;
        
        /** @type {string} Тип ленты */
        this.type = type;
        
        /** @type {QuantumState[]} Массив квантовых состояний ячеек */
        this.cells = [];
        
        /** @type {number} Позиция головки чтения/записи */
        this.headPosition = 0;
        
        /** @type {Array<{step: number, operation: string, cell: number, state: QuantumState}>} История операций */
        this.operationHistory = [];

        this.initializeTape();
    }

    /**
     * Инициализация всех ячеек ленты в состоянии |0⟩
     */
    initializeTape() {
        this.cells = [];
        for (let i = 0; i < this.size; i++) {
            this.cells.push(QuantumState.zero());
        }
        this.headPosition = Math.floor(this.size / 2); // Начинаем с центра
    }

    /**
     * Получение квантового состояния ячейки
     * @param {number} position - Позиция ячейки
     * @returns {QuantumState} Квантовое состояние ячейки
     */
    getState(position) {
        if (position < 0 || position >= this.size) {
            return QuantumState.zero(); // За границами ленты всегда |0⟩
        }
        return this.cells[position].clone();
    }

    /**
     * Установка квантового состояния ячейки
     * @param {number} position - Позиция ячейки
     * @param {QuantumState} state - Новое квантовое состояние
     */
    setState(position, state) {
        if (position >= 0 && position < this.size) {
            this.cells[position] = state.clone();
            this.addToHistory('setState', position, state);
        }
    }

    /**
     * Получение состояния ячейки под головкой
     * @returns {QuantumState} Текущее состояние под головкой
     */
    getCurrentState() {
        return this.getState(this.headPosition);
    }

    /**
     * Установка состояния ячейки под головкой
     * @param {QuantumState} state - Новое состояние
     */
    setCurrentState(state) {
        this.setState(this.headPosition, state);
    }

    /**
     * Перемещение головки влево
     * @returns {boolean} true если перемещение успешно
     */
    moveLeft() {
        if (this.headPosition > 0) {
            this.headPosition--;
            this.addToHistory('moveLeft', this.headPosition + 1);
            return true;
        }
        return false;
    }

    /**
     * Перемещение головки вправо
     * @returns {boolean} true если перемещение успешно
     */
    moveRight() {
        if (this.headPosition < this.size - 1) {
            this.headPosition++;
            this.addToHistory('moveRight', this.headPosition - 1);
            return true;
        }
        return false;
    }

    /**
     * Применение квантового вентиля к ячейке под головкой
     * @param {string} gateName - Название вентиля
     * @param {number} [angle] - Угол для параметризованных вентилей
     * @returns {QuantumState} Новое состояние после применения вентиля
     */
    applyGate(gateName, angle = 0) {
        const currentState = this.getCurrentState();
        let newState;

        try {
            switch (gateName.toLowerCase()) {
                case 'h':
                case 'hadamard':
                    newState = QuantumGates.hadamard(currentState);
                    break;
                
                case 'x':
                case 'pauli-x':
                case 'paulix':
                    newState = QuantumGates.pauliX(currentState);
                    break;
                
                case 'y':
                case 'pauli-y':
                case 'pauliy':
                    newState = QuantumGates.pauliY(currentState);
                    break;
                
                case 'z':
                case 'pauli-z':
                case 'pauliz':
                    newState = QuantumGates.pauliZ(currentState);
                    break;
                
                case 's':
                case 's-gate':
                    newState = QuantumGates.sGate(currentState);
                    break;
                
                case 't':
                case 't-gate':
                    newState = QuantumGates.tGate(currentState);
                    break;
                
                case 'rx':
                    newState = QuantumGates.applySingleQubitGate(currentState, QuantumGates.RX(angle));
                    break;
                
                case 'ry':
                    newState = QuantumGates.applySingleQubitGate(currentState, QuantumGates.RY(angle));
                    break;
                
                case 'rz':
                    newState = QuantumGates.applySingleQubitGate(currentState, QuantumGates.RZ(angle));
                    break;
                
                default:
                    console.warn(`Неизвестный вентиль: ${gateName}`);
                    newState = currentState.clone();
            }
        } catch (error) {
            console.error(`Ошибка применения вентиля ${gateName}:`, error);
            newState = currentState.clone();
        }

        this.setCurrentState(newState);
        this.addToHistory(`gate:${gateName}`, this.headPosition, newState, { angle });
        
        return newState;
    }

    /**
     * Применение двухкубитного вентиля между текущей ячейкой и соседней
     * @param {string} gateName - Название двухкубитного вентиля
     * @param {number} targetPosition - Позиция целевой ячейки
     * @returns {boolean} true если операция успешна
     */
    applyTwoQubitGate(gateName, targetPosition) {
        if (targetPosition < 0 || targetPosition >= this.size || targetPosition === this.headPosition) {
            console.warn('Некорректная позиция для двухкубитного вентиля');
            return false;
        }

        const controlState = this.getCurrentState();
        const targetState = this.getState(targetPosition);
        let newStates;

        try {
            switch (gateName.toLowerCase()) {
                case 'cnot':
                    newStates = QuantumGates.cnot(controlState, targetState);
                    break;
                
                case 'cz':
                    newStates = QuantumGates.cz(controlState, targetState);
                    break;
                
                default:
                    console.warn(`Неизвестный двухкубитный вентиль: ${gateName}`);
                    return false;
            }
        } catch (error) {
            console.error(`Ошибка применения двухкубитного вентиля ${gateName}:`, error);
            return false;
        }

        // Обновляем состояния
        this.setCurrentState(newStates[0]);
        this.setState(targetPosition, newStates[1]);
        
        this.addToHistory(`twoQubit:${gateName}`, this.headPosition, newStates[0], { 
            target: targetPosition, 
            targetState: newStates[1] 
        });
        
        return true;
    }

    /**
     * Измерение состояния ячейки под головкой
     * @returns {{result: number, state: QuantumState}} Результат измерения и коллапсированное состояние
     */
    measureCurrent() {
        const currentState = this.getCurrentState();
        const result = currentState.measure();
        
        this.setCurrentState(currentState); // Сохраняем коллапсированное состояние
        this.addToHistory('measure', this.headPosition, currentState, { result });
        
        return { result, state: currentState.clone() };
    }

    /**
     * Измерение всех ячеек ленты
     * @returns {number[]} Массив результатов измерений
     */
    measureAll() {
        const results = [];
        
        for (let i = 0; i < this.size; i++) {
            const state = this.getState(i);
            const result = state.measure();
            results.push(result);
            this.setState(i, state); // Сохраняем коллапсированное состояние
        }
        
        this.addToHistory('measureAll', -1, null, { results });
        return results;
    }

    /**
     * Создание регистра из нескольких ячеек ленты
     * @param {number} startPos - Начальная позиция
     * @param {number} length - Длина регистра
     * @returns {QuantumRegister} Квантовый регистр
     */
    createRegister(startPos, length) {
        if (startPos < 0 || startPos + length > this.size || length < 1) {
            throw new Error('Некорректные параметры для создания регистра');
        }

        const register = new QuantumRegister(length);
        
        // Создаем тензорное произведение состояний
        let tensorProduct = [Complex.ONE];
        
        for (let i = 0; i < length; i++) {
            const state = this.getState(startPos + i);
            const stateVector = [state.alpha, state.beta];
            
            // Вычисляем тензорное произведение
            const newProduct = [];
            for (const amp1 of tensorProduct) {
                for (const amp2 of stateVector) {
                    newProduct.push(amp1.mul(amp2));
                }
            }
            tensorProduct = newProduct;
        }
        
        // Устанавливаем амплитуды в регистр
        for (let i = 0; i < tensorProduct.length && i < register.dimension; i++) {
            register.setAmplitude(i, tensorProduct[i]);
        }
        
        register.normalize();
        return register;
    }

    /**
     * Применение регистра обратно к ячейкам ленты
     * @param {QuantumRegister} register - Квантовый регистр
     * @param {number} startPos - Начальная позиция на ленте
     */
    applyRegister(register, startPos) {
        if (startPos < 0 || startPos + register.numQubits > this.size) {
            throw new Error('Регистр не помещается в указанную позицию ленты');
        }

        // Для упрощения разлагаем регистр на отдельные кубиты
        // Это приближение для случаев без сильной запутанности
        for (let i = 0; i < register.numQubits; i++) {
            const qubitPos = startPos + i;
            
            // Вычисляем эффективное состояние кубита через трассирование
            let prob0 = 0;
            let prob1 = 0;
            
            for (let state = 0; state < register.dimension; state++) {
                const prob = register.getProbability(state);
                const bit = (state >> (register.numQubits - 1 - i)) & 1;
                
                if (bit === 0) {
                    prob0 += prob;
                } else {
                    prob1 += prob;
                }
            }
            
            // Создаем эффективное состояние кубита
            const alpha = new Complex(Math.sqrt(prob0), 0);
            const beta = new Complex(Math.sqrt(prob1), 0);
            const newState = new QuantumState(alpha, beta);
            
            this.setState(qubitPos, newState);
        }
    }

    /**
     * Получение статистики состояний ленты
     * @returns {Object} Статистика ленты
     */
    getStatistics() {
        let basisStates = 0;
        let superpositions = 0;
        let totalProbability = 0;
        let avgEntropy = 0;

        for (let i = 0; i < this.size; i++) {
            const state = this.getState(i);
            const stateType = state.getStateType();
            
            if (stateType === 'superposition') {
                superpositions++;
            } else {
                basisStates++;
            }
            
            totalProbability += state.getProbability0() + state.getProbability1();
            avgEntropy += state.getEntropy();
        }

        return {
            size: this.size,
            type: this.type,
            headPosition: this.headPosition,
            basisStates,
            superpositions,
            avgEntropy: avgEntropy / this.size,
            operationCount: this.operationHistory.length
        };
    }

    /**
     * Сброс ленты к начальному состоянию
     */
    reset() {
        this.initializeTape();
        this.operationHistory = [];
        this.addToHistory('reset', -1);
    }

    /**
     * Добавление записи в историю операций
     * @param {string} operation - Тип операции
     * @param {number} position - Позиция операции
     * @param {QuantumState} [state] - Состояние после операции
     * @param {Object} [metadata] - Дополнительные данные
     */
    addToHistory(operation, position, state = null, metadata = {}) {
        const entry = {
            step: this.operationHistory.length + 1,
            timestamp: Date.now(),
            operation,
            position,
            state: state ? state.clone() : null,
            metadata
        };
        
        this.operationHistory.push(entry);
        
        // Ограничиваем размер истории
        if (this.operationHistory.length > 1000) {
            this.operationHistory = this.operationHistory.slice(-500);
        }
    }

    /**
     * Получение истории операций
     * @param {number} [limit] - Максимальное количество записей
     * @returns {Array} История операций
     */
    getHistory(limit = 50) {
        return this.operationHistory.slice(-limit);
    }

    /**
     * Очистка истории операций
     */
    clearHistory() {
        this.operationHistory = [];
    }

    /**
     * Создание копии ленты
     * @returns {QuantumTape} Глубокая копия ленты
     */
    clone() {
        const copy = new QuantumTape(this.size, this.type);
        copy.headPosition = this.headPosition;
        copy.cells = this.cells.map(cell => cell.clone());
        copy.operationHistory = [...this.operationHistory];
        return copy;
    }

    /**
     * Сравнение с другой лентой
     * @param {QuantumTape} other - Сравниваемая лента
     * @param {number} eps - Точность сравнения
     * @returns {boolean} true если ленты идентичны
     */
    equals(other, eps = 1e-10) {
        if (this.size !== other.size || this.type !== other.type) {
            return false;
        }
        
        for (let i = 0; i < this.size; i++) {
            if (!this.cells[i].equals(other.cells[i], eps)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Сериализация ленты в JSON
     * @returns {Object} JSON-представление ленты
     */
    toJSON() {
        return {
            size: this.size,
            type: this.type,
            headPosition: this.headPosition,
            cells: this.cells.map(cell => ({
                alpha: { re: cell.alpha.re, im: cell.alpha.im },
                beta: { re: cell.beta.re, im: cell.beta.im }
            })),
            historyLength: this.operationHistory.length
        };
    }

    /**
     * Десериализация ленты из JSON
     * @param {Object} json - JSON-представление
     * @returns {QuantumTape} Восстановленная лента
     */
    static fromJSON(json) {
        const tape = new QuantumTape(json.size, json.type);
        tape.headPosition = json.headPosition || 0;
        
        if (json.cells) {
            tape.cells = json.cells.map(cellData => {
                const alpha = new Complex(cellData.alpha.re, cellData.alpha.im);
                const beta = new Complex(cellData.beta.re, cellData.beta.im);
                return new QuantumState(alpha, beta);
            });
        }
        
        return tape;
    }

    /**
     * Строковое представление ленты
     * @returns {string} Строковое представление
     */
    toString() {
        const cellStrings = this.cells.map((cell, index) => {
            const marker = index === this.headPosition ? '→' : ' ';
            const stateType = cell.getStateType();
            let symbol = '?';
            
            switch (stateType) {
                case 'basis-0': symbol = '0'; break;
                case 'basis-1': symbol = '1'; break;
                case 'superposition': symbol = '±'; break;
            }
            
            return `${marker}${symbol}`;
        });
        
        return `${this.type.toUpperCase()}[${cellStrings.join('|')}]`;
    }
}