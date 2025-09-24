// path: js/quantum-state.js
/**
 * Класс для представления квантового состояния одиночного кубита
 * Реализует состояние |ψ⟩ = α|0⟩ + β|1⟩ с комплексными амплитудами
 * 
 * @author Quantum Computing Expert  
 * @version 2.0.0
 */

import { Complex, ComplexUtils } from './complex.js';

export class QuantumState {
    /**
     * Создает квантовое состояние кубита
     * @param {Complex} alpha - Амплитуда состояния |0⟩
     * @param {Complex} beta - Амплитуда состояния |1⟩
     */
    constructor(alpha = new Complex(1, 0), beta = new Complex(0, 0)) {
        /** @type {Complex} Амплитуда базисного состояния |0⟩ */
        this.alpha = alpha instanceof Complex ? alpha.clone() : new Complex(alpha, 0);
        
        /** @type {Complex} Амплитуда базисного состояния |1⟩ */
        this.beta = beta instanceof Complex ? beta.clone() : new Complex(beta, 0);
        
        this.normalize();
    }

    /**
     * Нормализация квантового состояния
     * Обеспечивает условие |α|² + |β|² = 1
     */
    normalize() {
        const norm = Math.sqrt(
            this.alpha.abs() * this.alpha.abs() + 
            this.beta.abs() * this.beta.abs()
        );
        
        if (norm < 1e-15) {
            // Устанавливаем состояние |0⟩ если нормировка невозможна
            this.alpha = new Complex(1, 0);
            this.beta = new Complex(0, 0);
        } else {
            this.alpha = new Complex(this.alpha.re / norm, this.alpha.im / norm);
            this.beta = new Complex(this.beta.re / norm, this.beta.im / norm);
        }
    }

    /**
     * Получение вероятности измерить состояние |0⟩
     * P(0) = |α|²
     * @returns {number} Вероятность от 0 до 1
     */
    getProbability0() {
        const alphaAbs = this.alpha.abs();
        return alphaAbs * alphaAbs;
    }

    /**
     * Получение вероятности измерить состояние |1⟩ 
     * P(1) = |β|²
     * @returns {number} Вероятность от 0 до 1
     */
    getProbability1() {
        const betaAbs = this.beta.abs();
        return betaAbs * betaAbs;
    }

    /**
     * Определение типа квантового состояния
     * @returns {string} 'basis-0', 'basis-1', или 'superposition'
     */
    getStateType() {
        const prob0 = this.getProbability0();
        const prob1 = this.getProbability1();
        
        if (prob0 > 0.99) return 'basis-0';
        if (prob1 > 0.99) return 'basis-1';
        return 'superposition';
    }

    /**
     * Квантовое измерение состояния
     * Коллапсирует суперпозицию в базисное состояние согласно правилу Борна
     * @returns {number} Результат измерения: 0 или 1
     */
    measure() {
        const prob0 = this.getProbability0();
        const random = Math.random();
        
        if (random < prob0) {
            // Коллапс к |0⟩
            this.alpha = new Complex(1, 0);
            this.beta = new Complex(0, 0);
            return 0;
        } else {
            // Коллапс к |1⟩
            this.alpha = new Complex(0, 0);
            this.beta = new Complex(1, 0);
            return 1;
        }
    }

    /**
     * Вычисление углов Блоха (θ, φ) для визуализации на сфере Блоха
     * θ = 2*arccos(|α|), φ = arg(β) - arg(α)
     * @returns {{theta: number, phi: number}} Углы в радианах
     */
    getBlochAngles() {
        const alphaAbs = this.alpha.abs();
        const theta = 2 * Math.acos(Math.min(1, alphaAbs)); // Ограничиваем для избежания NaN
        
        // Вычисляем относительную фазу
        let phi = 0;
        if (this.beta.abs() > 1e-10) {
            phi = this.beta.arg() - this.alpha.arg();
            // Нормализуем в диапазон [0, 2π)
            phi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        }
        
        return { theta, phi };
    }

    /**
     * Получение декартовых координат на сфере Блоха
     * x = sin(θ)cos(φ), y = sin(θ)sin(φ), z = cos(θ)
     * @returns {{x: number, y: number, z: number}} Координаты на единичной сфере
     */
    getBlochCoordinates() {
        const { theta, phi } = this.getBlochAngles();
        
        return {
            x: Math.sin(theta) * Math.cos(phi),
            y: Math.sin(theta) * Math.sin(phi), 
            z: Math.cos(theta)
        };
    }

    /**
     * Проверка чистоты квантового состояния
     * Чистые состояния имеют Tr(ρ²) = 1
     * @returns {number} Чистота от 0 до 1
     */
    getPurity() {
        // Для чистых состояний чистота всегда = 1
        return 1.0;
    }

    /**
     * Вычисление энтропии фон Неймана
     * S = -Tr(ρ log ρ)
     * @returns {number} Энтропия (биты)
     */
    getEntropy() {
        const p0 = this.getProbability0();
        const p1 = this.getProbability1();
        
        let entropy = 0;
        if (p0 > 1e-15) entropy -= p0 * Math.log2(p0);
        if (p1 > 1e-15) entropy -= p1 * Math.log2(p1);
        
        return entropy;
    }

    /**
     * Создание копии квантового состояния
     * @returns {QuantumState} Глубокая копия состояния
     */
    clone() {
        return new QuantumState(this.alpha.clone(), this.beta.clone());
    }

    /**
     * Проверка равенства двух квантовых состояний
     * @param {QuantumState} other - Сравниваемое состояние
     * @param {number} eps - Точность сравнения
     * @returns {boolean} true если состояния равны
     */
    equals(other, eps = 1e-10) {
        return this.alpha.equals(other.alpha, eps) && 
               this.beta.equals(other.beta, eps);
    }

    /**
     * Строковое представление квантового состояния
     * @param {number} precision - Количество знаков после запятой
     * @returns {string} Строка вида "α|0⟩ + β|1⟩"
     */
    toString(precision = 3) {
        const alphaStr = this.alpha.toString(precision);
        const betaStr = this.beta.toString(precision);
        
        // Специальные случаи для читаемости
        if (this.beta.abs() < Math.pow(10, -precision)) {
            return alphaStr === '1' ? '|0⟩' : `${alphaStr}|0⟩`;
        }
        
        if (this.alpha.abs() < Math.pow(10, -precision)) {
            return betaStr === '1' ? '|1⟩' : `${betaStr}|1⟩`;
        }
        
        const betaPrefix = this.beta.re >= 0 && this.beta.im === 0 ? '+' : '';
        return `${alphaStr}|0⟩ ${betaPrefix}${betaStr}|1⟩`;
    }

    /**
     * Создание матрицы плотности ρ = |ψ⟩⟨ψ|
     * @returns {Complex[][]} Матрица плотности 2×2
     */
    getDensityMatrix() {
        return [
            [
                this.alpha.mul(this.alpha.conj()),
                this.alpha.mul(this.beta.conj())
            ],
            [
                this.beta.mul(this.alpha.conj()),
                this.beta.mul(this.beta.conj())
            ]
        ];
    }

    /**
     * Вычисление ожидаемого значения оператора Паули
     * @param {'X'|'Y'|'Z'} pauli - Тип оператора Паули
     * @returns {number} Ожидаемое значение
     */
    getExpectationValue(pauli) {
        const { x, y, z } = this.getBlochCoordinates();
        
        switch (pauli) {
            case 'X': return x;
            case 'Y': return y;
            case 'Z': return z;
            default: throw new Error(`Неизвестный оператор Паули: ${pauli}`);
        }
    }

    // ============================================================================
    // СТАТИЧЕСКИЕ МЕТОДЫ ДЛЯ СОЗДАНИЯ СПЕЦИАЛЬНЫХ СОСТОЯНИЙ
    // ============================================================================

    /**
     * Создание базисного состояния |0⟩
     * @returns {QuantumState} Состояние |0⟩
     */
    static zero() {
        return new QuantumState(new Complex(1, 0), new Complex(0, 0));
    }

    /**
     * Создание базисного состояния |1⟩
     * @returns {QuantumState} Состояние |1⟩
     */
    static one() {
        return new QuantumState(new Complex(0, 0), new Complex(1, 0));
    }

    /**
     * Создание состояния |+⟩ = (|0⟩ + |1⟩)/√2
     * @returns {QuantumState} Состояние |+⟩
     */
    static plus() {
        const amp = new Complex(1/Math.sqrt(2), 0);
        return new QuantumState(amp, amp);
    }

    /**
     * Создание состояния |-⟩ = (|0⟩ - |1⟩)/√2
     * @returns {QuantumState} Состояние |-⟩
     */
    static minus() {
        const amp = new Complex(1/Math.sqrt(2), 0);
        return new QuantumState(amp, new Complex(-1/Math.sqrt(2), 0));
    }

    /**
     * Создание состояния |+i⟩ = (|0⟩ + i|1⟩)/√2
     * @returns {QuantumState} Состояние |+i⟩
     */
    static plusI() {
        const amp = new Complex(1/Math.sqrt(2), 0);
        return new QuantumState(amp, new Complex(0, 1/Math.sqrt(2)));
    }

    /**
     * Создание состояния |-i⟩ = (|0⟩ - i|1⟩)/√2
     * @returns {QuantumState} Состояние |-i⟩
     */
    static minusI() {
        const amp = new Complex(1/Math.sqrt(2), 0);
        return new QuantumState(amp, new Complex(0, -1/Math.sqrt(2)));
    }

    /**
     * Создание произвольного состояния с углами Блоха
     * @param {number} theta - Полярный угол [0, π]
     * @param {number} phi - Азимутальный угол [0, 2π]
     * @returns {QuantumState} Состояние на сфере Блоха
     */
    static fromBlochAngles(theta, phi) {
        const alpha = new Complex(Math.cos(theta / 2), 0);
        const beta = Complex.exp(phi).mul(new Complex(Math.sin(theta / 2), 0));
        return new QuantumState(alpha, beta);
    }

    /**
     * Создание случайного квантового состояния
     * @returns {QuantumState} Случайное нормированное состояние
     */
    static random() {
        const theta = Math.acos(1 - 2 * Math.random()); // Равномерное распределение на сфере
        const phi = 2 * Math.PI * Math.random();
        return QuantumState.fromBlochAngles(theta, phi);
    }
}