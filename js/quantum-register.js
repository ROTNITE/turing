// path: js/quantum-register.js
/**
 * Класс для представления многокубитной квантовой системы
 * Реализует регистр из n кубитов с полным вектором состояния
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex, ComplexUtils } from './complex.js';
import { QuantumMatrix, QuantumGates } from './quantum-gates.js';

export class QuantumRegister {
    /**
     * Создает квантовый регистр из n кубитов
     * @param {number} numQubits - Количество кубитов (1-8 рекомендуется)
     */
    constructor(numQubits) {
        if (numQubits < 1 || numQubits > 20) {
            throw new Error('Количество кубитов должно быть от 1 до 20');
        }
        
        /** @type {number} Количество кубитов в регистре */
        this.numQubits = numQubits;
        
        /** @type {number} Размер гильбертова пространства (2^n) */
        this.dimension = Math.pow(2, numQubits);
        
        /** @type {Complex[]} Вектор амплитуд базисных состояний */
        this.amplitudes = new Array(this.dimension);
        
        // Инициализация в состоянии |00...0⟩
        this.initialize();
    }

    /**
     * Инициализация регистра в состоянии |00...0⟩
     */
    initialize() {
        for (let i = 0; i < this.dimension; i++) {
            this.amplitudes[i] = Complex.ZERO.clone();
        }
        this.amplitudes[0] = Complex.ONE.clone(); // |00...0⟩
    }

    /**
     * Получение амплитуды базисного состояния
     * @param {number} basisState - Индекс базисного состояния (0 to 2^n-1)
     * @returns {Complex} Амплитуда состояния
     */
    getAmplitude(basisState) {
        if (basisState < 0 || basisState >= this.dimension) {
            throw new Error(`Индекс состояния должен быть от 0 до ${this.dimension-1}`);
        }
        return this.amplitudes[basisState].clone();
    }

    /**
     * Установка амплитуды базисного состояния
     * @param {number} basisState - Индекс базисного состояния
     * @param {Complex} amplitude - Новая амплитуда
     */
    setAmplitude(basisState, amplitude) {
        if (basisState < 0 || basisState >= this.dimension) {
            throw new Error(`Индекс состояния должен быть от 0 до ${this.dimension-1}`);
        }
        this.amplitudes[basisState] = amplitude instanceof Complex ? amplitude.clone() : new Complex(amplitude, 0);
    }

    /**
     * Нормализация квантового регистра
     * Обеспечивает условие Σ|ψᵢ|² = 1
     */
    normalize() {
        try {
            this.amplitudes = ComplexUtils.normalize(this.amplitudes);
        } catch (error) {
            // Если нормализация невозможна, сбрасываем в |0⟩
            this.initialize();
        }
    }

    /**
     * Проверка нормировки регистра
     * @param {number} eps - Точность проверки
     * @returns {boolean} true если регистр нормирован
     */
    isNormalized(eps = 1e-10) {
        return ComplexUtils.isNormalized(this.amplitudes, eps);
    }

    /**
     * Получение вероятности измерить конкретное базисное состояние
     * @param {number} basisState - Индекс базисного состояния
     * @returns {number} Вероятность от 0 до 1
     */
    getProbability(basisState) {
        const amplitude = this.getAmplitude(basisState);
        return amplitude.abs() * amplitude.abs();
    }

    /**
     * Получение массива всех вероятностей
     * @returns {number[]} Массив вероятностей для каждого базисного состояния
     */
    getAllProbabilities() {
        return this.amplitudes.map(amp => {
            const abs = amp.abs();
            return abs * abs;
        });
    }

    /**
     * Применение одночастичного вентиля к конкретному кубиту
     * @param {QuantumMatrix} gate - Матрица вентиля 2×2
     * @param {number} targetQubit - Номер целевого кубита (0-indexed)
     */
    applySingleQubitGate(gate, targetQubit) {
        if (targetQubit < 0 || targetQubit >= this.numQubits) {
            throw new Error(`Номер кубита должен быть от 0 до ${this.numQubits-1}`);
        }

        const newAmplitudes = new Array(this.dimension);
        
        for (let state = 0; state < this.dimension; state++) {
            newAmplitudes[state] = Complex.ZERO.clone();
        }

        // Применяем вентиль к каждой паре состояний, отличающихся битом targetQubit
        for (let state = 0; state < this.dimension; state++) {
            const bit = (state >> targetQubit) & 1;
            const flippedState = state ^ (1 << targetQubit);

            if (bit === 0) {
                // Применяем первую строку матрицы
                newAmplitudes[state] = newAmplitudes[state].add(
                    gate.elements[0][0].mul(this.amplitudes[state])
                );
                newAmplitudes[flippedState] = newAmplitudes[flippedState].add(
                    gate.elements[1][0].mul(this.amplitudes[state])
                );
            } else {
                // Применяем вторую строку матрицы
                newAmplitudes[state] = newAmplitudes[state].add(
                    gate.elements[1][1].mul(this.amplitudes[state])
                );
                newAmplitudes[flippedState] = newAmplitudes[flippedState].add(
                    gate.elements[0][1].mul(this.amplitudes[state])
                );
            }
        }

        this.amplitudes = newAmplitudes;
    }

    /**
     * Применение двухчастичного вентиля к двум кубитам
     * @param {QuantumMatrix} gate - Матрица вентиля 4×4
     * @param {number} controlQubit - Номер управляющего кубита
     * @param {number} targetQubit - Номер целевого кубита
     */
    applyTwoQubitGate(gate, controlQubit, targetQubit) {
        if (controlQubit < 0 || controlQubit >= this.numQubits ||
            targetQubit < 0 || targetQubit >= this.numQubits) {
            throw new Error(`Номера кубитов должны быть от 0 до ${this.numQubits-1}`);
        }
        
        if (controlQubit === targetQubit) {
            throw new Error('Управляющий и целевой кубиты не могут совпадать');
        }

        const newAmplitudes = new Array(this.dimension);
        for (let i = 0; i < this.dimension; i++) {
            newAmplitudes[i] = Complex.ZERO.clone();
        }

        // Применяем двухкубитный вентиль
        for (let state = 0; state < this.dimension; state++) {
            const controlBit = (state >> controlQubit) & 1;
            const targetBit = (state >> targetQubit) & 1;
            const inputState = controlBit * 2 + targetBit; // 0,1,2,3 для |00⟩,|01⟩,|10⟩,|11⟩

            // Вычисляем все возможные выходные состояния
            for (let outputState = 0; outputState < 4; outputState++) {
                const newControlBit = Math.floor(outputState / 2);
                const newTargetBit = outputState % 2;
                
                // Создаем новое состояние с обновленными битами
                let newState = state;
                newState = (newState & ~(1 << controlQubit)) | (newControlBit << controlQubit);
                newState = (newState & ~(1 << targetQubit)) | (newTargetBit << targetQubit);
                
                // Добавляем вклад от матричного элемента
                const matrixElement = gate.elements[outputState][inputState];
                newAmplitudes[newState] = newAmplitudes[newState].add(
                    matrixElement.mul(this.amplitudes[state])
                );
            }
        }

        this.amplitudes = newAmplitudes;
    }

    /**
     * Измерение всего квантового регистра
     * Коллапсирует состояние в одно из базисных состояний
     * @returns {number} Результат измерения (индекс базисного состояния)
     */
    measureAll() {
        const probabilities = this.getAllProbabilities();
        const random = Math.random();
        
        let cumulativeProb = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProb += probabilities[i];
            if (random < cumulativeProb) {
                // Коллапс к базисному состоянию |i⟩
                this.initialize();
                this.amplitudes[i] = Complex.ONE.clone();
                return i;
            }
        }
        
        // Fallback (не должен выполняться при корректной нормировке)
        this.initialize();
        return 0;
    }

    /**
     * Измерение конкретного кубита
     * @param {number} qubitIndex - Номер измеряемого кубита
     * @returns {number} Результат измерения: 0 или 1
     */
    measureQubit(qubitIndex) {
        if (qubitIndex < 0 || qubitIndex >= this.numQubits) {
            throw new Error(`Номер кубита должен быть от 0 до ${this.numQubits-1}`);
        }

        // Вычисляем вероятность получить |0⟩ на данном кубите
        let prob0 = 0;
        for (let state = 0; state < this.dimension; state++) {
            const bit = (state >> qubitIndex) & 1;
            if (bit === 0) {
                prob0 += this.getProbability(state);
            }
        }

        const random = Math.random();
        const result = random < prob0 ? 0 : 1;

        // Коллапс состояния
        const newAmplitudes = new Array(this.dimension);
        let normalizationFactor = 0;

        for (let state = 0; state < this.dimension; state++) {
            const bit = (state >> qubitIndex) & 1;
            if (bit === result) {
                newAmplitudes[state] = this.amplitudes[state].clone();
                normalizationFactor += newAmplitudes[state].abs() * newAmplitudes[state].abs();
            } else {
                newAmplitudes[state] = Complex.ZERO.clone();
            }
        }

        // Нормализация после коллапса
        if (normalizationFactor > 0) {
            const norm = Math.sqrt(normalizationFactor);
            for (let state = 0; state < this.dimension; state++) {
                newAmplitudes[state] = new Complex(
                    newAmplitudes[state].re / norm,
                    newAmplitudes[state].im / norm
                );
            }
        }

        this.amplitudes = newAmplitudes;
        return result;
    }

    /**
     * Создание копии квантового регистра
     * @returns {QuantumRegister} Глубокая копия регистра
     */
    clone() {
        const copy = new QuantumRegister(this.numQubits);
        copy.amplitudes = this.amplitudes.map(amp => amp.clone());
        return copy;
    }

    /**
     * Получение строкового представления в двоичном виде
     * @param {number} basisState - Индекс базисного состояния
     * @returns {string} Двоичное представление (например, "101" для состояния |101⟩)
     */
    basisStateToString(basisState) {
        return basisState.toString(2).padStart(this.numQubits, '0');
    }

    /**
     * Преобразование двоичной строки в индекс базисного состояния
     * @param {string} binaryString - Двоичная строка (например, "101")
     * @returns {number} Индекс базисного состояния
     */
    stringToBasisState(binaryString) {
        return parseInt(binaryString, 2);
    }

    /**
     * Строковое представление квантового регистра
     * @param {number} precision - Точность отображения амплитуд
     * @param {boolean} onlySignificant - Показывать только значимые амплитуды
     * @returns {string} Строковое представление
     */
    toString(precision = 3, onlySignificant = true) {
        const threshold = Math.pow(10, -precision);
        const terms = [];

        for (let i = 0; i < this.dimension; i++) {
            const amplitude = this.amplitudes[i];
            
            if (!onlySignificant || amplitude.abs() > threshold) {
                const ampStr = amplitude.toString(precision);
                const stateStr = this.basisStateToString(i);
                
                if (amplitude.equals(Complex.ONE)) {
                    terms.push(`|${stateStr}⟩`);
                } else if (amplitude.equals(new Complex(-1, 0))) {
                    terms.push(`-|${stateStr}⟩`);
                } else {
                    terms.push(`${ampStr}|${stateStr}⟩`);
                }
            }
        }

        return terms.length > 0 ? terms.join(' + ').replace(/\+ -/g, '- ') : '|0⟩';
    }

    /**
     * Получение информации о запутанности (упрощенная метрика)
     * @returns {number} Мера запутанности от 0 (нет запутанности) до 1 (максимальная)
     */
    getEntanglementMeasure() {
        if (this.numQubits === 1) return 0;
        
        // Используем энтропию как меру запутанности для двухкубитных состояний
        if (this.numQubits === 2) {
            const entropy = this.getEntropy();
            return Math.min(entropy, 1); // Нормализуем к [0,1]
        }
        
        // Для многокубитных состояний - упрощенная метрика
        let entanglement = 0;
        const probs = this.getAllProbabilities();
        
        // Если состояние факторизуемо, большинство вероятностей будет близко к 0
        const nonZeroProbs = probs.filter(p => p > 1e-10);
        entanglement = (nonZeroProbs.length - 1) / (this.dimension - 1);
        
        return Math.min(entanglement, 1);
    }

    /**
     * Вычисление энтропии фон Неймана регистра
     * @returns {number} Энтропия в битах
     */
    getEntropy() {
        let entropy = 0;
        const probs = this.getAllProbabilities();
        
        for (const prob of probs) {
            if (prob > 1e-15) {
                entropy -= prob * Math.log2(prob);
            }
        }
        
        return entropy;
    }

    // ============================================================================
    // СТАТИЧЕСКИЕ МЕТОДЫ ДЛЯ СОЗДАНИЯ СПЕЦИАЛЬНЫХ СОСТОЯНИЙ
    // ============================================================================

    /**
     * Создание состояния Белла Φ+ для двух кубитов
     * @returns {QuantumRegister} Регистр в состоянии (|00⟩ + |11⟩)/√2
     */
    static createBellPhiPlus() {
        const register = new QuantumRegister(2);
        const amp = new Complex(1/Math.sqrt(2), 0);
        
        register.setAmplitude(0, amp); // |00⟩
        register.setAmplitude(3, amp); // |11⟩
        
        return register;
    }

    /**
     * Создание состояния ГHZ для трех кубитов
     * @returns {QuantumRegister} Регистр в состоянии (|000⟩ + |111⟩)/√2
     */
    static createGHZ() {
        const register = new QuantumRegister(3);
        const amp = new Complex(1/Math.sqrt(2), 0);
        
        register.setAmplitude(0, amp); // |000⟩
        register.setAmplitude(7, amp); // |111⟩
        
        return register;
    }

    /**
     * Создание равновесной суперпозиции всех состояний
     * @param {number} numQubits - Количество кубитов
     * @returns {QuantumRegister} Регистр в равновесной суперпозиции
     */
    static createUniformSuperposition(numQubits) {
        const register = new QuantumRegister(numQubits);
        const amp = new Complex(1/Math.sqrt(register.dimension), 0);
        
        for (let i = 0; i < register.dimension; i++) {
            register.setAmplitude(i, amp);
        }
        
        return register;
    }

    /**
     * Создание W-состояния для n кубитов  
     * W = (|100...0⟩ + |010...0⟩ + ... + |000...1⟩)/√n
     * @param {number} numQubits - Количество кубитов
     * @returns {QuantumRegister} Регистр в W-состоянии
     */
    static createWState(numQubits) {
        const register = new QuantumRegister(numQubits);
        const amp = new Complex(1/Math.sqrt(numQubits), 0);
        
        for (let i = 0; i < numQubits; i++) {
            const state = 1 << (numQubits - 1 - i); // Позиция i-го кубита в состоянии |1⟩
            register.setAmplitude(state, amp);
        }
        
        return register;
    }
}