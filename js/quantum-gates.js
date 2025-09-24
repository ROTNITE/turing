// path: js/quantum-gates.js
/**
 * Библиотека квантовых вентилей и операций
 * Реализует все основные одно- и двухкубитные квантовые вентили
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex } from './complex.js';
import { QuantumState } from './quantum-state.js';

/**
 * Класс для представления квантовых матриц
 */
export class QuantumMatrix {
    /**
     * @param {Complex[][]} elements - Двумерный массив комплексных элементов
     */
    constructor(elements) {
        this.elements = elements;
        this.rows = elements.length;
        this.cols = elements[0]?.length || 0;
    }

    /**
     * Умножение матрицы на вектор состояния
     * @param {Complex[]} vector - Вектор состояния  
     * @returns {Complex[]} Результирующий вектор
     */
    apply(vector) {
        if (this.cols !== vector.length) {
            throw new Error('Размерности матрицы и вектора не совпадают');
        }

        const result = [];
        for (let i = 0; i < this.rows; i++) {
            let sum = Complex.ZERO;
            for (let j = 0; j < this.cols; j++) {
                sum = sum.add(this.elements[i][j].mul(vector[j]));
            }
            result.push(sum);
        }
        return result;
    }

    /**
     * Тензорное произведение матриц (кронекерово произведение)
     * @param {QuantumMatrix} other - Вторая матрица
     * @returns {QuantumMatrix} Результат тензорного произведения
     */
    tensorProduct(other) {
        const result = [];
        for (let i = 0; i < this.rows; i++) {
            for (let k = 0; k < other.rows; k++) {
                const row = [];
                for (let j = 0; j < this.cols; j++) {
                    for (let l = 0; l < other.cols; l++) {
                        row.push(this.elements[i][j].mul(other.elements[k][l]));
                    }
                }
                result.push(row);
            }
        }
        return new QuantumMatrix(result);
    }
}

/**
 * Основные квантовые вентили
 */
export class QuantumGates {
    
    // ============================================================================
    // ОДНОКУБИТНЫЕ ВЕНТИЛИ (2×2 матрицы)
    // ============================================================================

    /**
     * Тождественная матрица I
     * Не изменяет состояние кубита
     */
    static I() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO],
            [Complex.ZERO, Complex.ONE]
        ]);
    }

    /**
     * Вентиль Паули-X (квантовый NOT)
     * X|0⟩ = |1⟩, X|1⟩ = |0⟩
     */
    static X() {
        return new QuantumMatrix([
            [Complex.ZERO, Complex.ONE],
            [Complex.ONE, Complex.ZERO]
        ]);
    }

    /**
     * Вентиль Паули-Y 
     * Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩
     */
    static Y() {
        return new QuantumMatrix([
            [Complex.ZERO, Complex.MINUS_I],
            [Complex.I, Complex.ZERO]
        ]);
    }

    /**
     * Вентиль Паули-Z (фазовый флип)
     * Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩
     */
    static Z() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO],
            [Complex.ZERO, new Complex(-1, 0)]
        ]);
    }

    /**
     * Вентиль Адамара (создание суперпозиции)
     * H|0⟩ = (|0⟩ + |1⟩)/√2, H|1⟩ = (|0⟩ - |1⟩)/√2
     */
    static H() {
        const invSqrt2 = new Complex(1/Math.sqrt(2), 0);
        const negInvSqrt2 = new Complex(-1/Math.sqrt(2), 0);
        
        return new QuantumMatrix([
            [invSqrt2, invSqrt2],
            [invSqrt2, negInvSqrt2]
        ]);
    }

    /**
     * S-вентиль (фазовый сдвиг π/2)
     * S|0⟩ = |0⟩, S|1⟩ = i|1⟩
     */
    static S() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO],
            [Complex.ZERO, Complex.I]
        ]);
    }

    /**
     * T-вентиль (фазовый сдвиг π/4)  
     * T|0⟩ = |0⟩, T|1⟩ = exp(iπ/4)|1⟩
     */
    static T() {
        const phase = Complex.exp(Math.PI / 4);
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO],
            [Complex.ZERO, phase]
        ]);
    }

    /**
     * Поворот вокруг оси X на угол θ
     * RX(θ) = cos(θ/2)I - i*sin(θ/2)X
     * @param {number} angle - Угол поворота в радианах
     */
    static RX(angle) {
        const cosHalf = new Complex(Math.cos(angle / 2), 0);
        const minusISinHalf = new Complex(0, -Math.sin(angle / 2));
        
        return new QuantumMatrix([
            [cosHalf, minusISinHalf],
            [minusISinHalf, cosHalf]
        ]);
    }

    /**
     * Поворот вокруг оси Y на угол θ
     * RY(θ) = cos(θ/2)I - i*sin(θ/2)Y
     * @param {number} angle - Угол поворота в радианах
     */
    static RY(angle) {
        const cosHalf = new Complex(Math.cos(angle / 2), 0);
        const sinHalf = new Complex(Math.sin(angle / 2), 0);
        const negSinHalf = new Complex(-Math.sin(angle / 2), 0);
        
        return new QuantumMatrix([
            [cosHalf, negSinHalf],
            [sinHalf, cosHalf]
        ]);
    }

    /**
     * Поворот вокруг оси Z на угол θ  
     * RZ(θ) = cos(θ/2)I - i*sin(θ/2)Z
     * @param {number} angle - Угол поворота в радианах
     */
    static RZ(angle) {
        const expMinusHalf = Complex.exp(-angle / 2);
        const expPlusHalf = Complex.exp(angle / 2);
        
        return new QuantumMatrix([
            [expMinusHalf, Complex.ZERO],
            [Complex.ZERO, expPlusHalf]
        ]);
    }

    // ============================================================================
    // ДВУХКУБИТНЫЕ ВЕНТИЛИ (4×4 матрицы)
    // ============================================================================

    /**
     * CNOT вентиль (контролируемый NOT)
     * |00⟩ → |00⟩, |01⟩ → |01⟩, |10⟩ → |11⟩, |11⟩ → |10⟩
     * Создает запутанность между кубитами
     */
    static CNOT() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE],
            [Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO]
        ]);
    }

    /**
     * CZ вентиль (контролируемый Z)
     * |00⟩ → |00⟩, |01⟩ → |01⟩, |10⟩ → |10⟩, |11⟩ → -|11⟩
     */
    static CZ() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, Complex.ZERO, new Complex(-1, 0)]
        ]);
    }

    /**
     * SWAP вентиль (перестановка кубитов)
     * |00⟩ → |00⟩, |01⟩ → |10⟩, |10⟩ → |01⟩, |11⟩ → |11⟩
     */
    static SWAP() {
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, Complex.ONE, Complex.ZERO],
            [Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, Complex.ZERO, Complex.ONE]
        ]);
    }

    /**
     * Контролируемый вентиль Адамара
     */
    static CH() {
        const invSqrt2 = new Complex(1/Math.sqrt(2), 0);
        const negInvSqrt2 = new Complex(-1/Math.sqrt(2), 0);
        
        return new QuantumMatrix([
            [Complex.ONE, Complex.ZERO, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ONE, Complex.ZERO, Complex.ZERO],
            [Complex.ZERO, Complex.ZERO, invSqrt2, invSqrt2],
            [Complex.ZERO, Complex.ZERO, invSqrt2, negInvSqrt2]
        ]);
    }

    // ============================================================================
    // ПРИМЕНЕНИЕ ВЕНТИЛЕЙ К КВАНТОВЫМ СОСТОЯНИЯМ
    // ============================================================================

    /**
     * Применить однокубитный вентиль к состоянию
     * @param {QuantumState} state - Квантовое состояние
     * @param {QuantumMatrix} gate - Матрица вентиля 2×2
     * @returns {QuantumState} Новое состояние после применения вентиля
     */
    static applySingleQubitGate(state, gate) {
        const vector = [state.alpha, state.beta];
        const result = gate.apply(vector);
        return new QuantumState(result[0], result[1]);
    }

    /**
     * Применить двухкубитный вентиль к двум состояниям
     * @param {QuantumState} state1 - Первое квантовое состояние  
     * @param {QuantumState} state2 - Второе квантовое состояние
     * @param {QuantumMatrix} gate - Матрица вентиля 4×4
     * @returns {[QuantumState, QuantumState]} Массив из двух новых состояний
     */
    static applyTwoQubitGate(state1, state2, gate) {
        // Создаем вектор состояния тензорным произведением
        const vector = [
            state1.alpha.mul(state2.alpha), // |00⟩
            state1.alpha.mul(state2.beta),  // |01⟩
            state1.beta.mul(state2.alpha),  // |10⟩
            state1.beta.mul(state2.beta)    // |11⟩
        ];
        
        const result = gate.apply(vector);
        
        // Декомпозиция обратно в два состояния (если возможно)
        // Для запутанных состояний это приближение
        const newState1 = new QuantumState(
            new Complex(
                (result[0].abs() + result[1].abs()) / Math.sqrt(2),
                0
            ),
            new Complex(
                (result[2].abs() + result[3].abs()) / Math.sqrt(2), 
                0
            )
        );
        
        const newState2 = new QuantumState(
            new Complex(
                (result[0].abs() + result[2].abs()) / Math.sqrt(2),
                0
            ),
            new Complex(
                (result[1].abs() + result[3].abs()) / Math.sqrt(2),
                0
            )
        );
        
        return [newState1, newState2];
    }

    // ============================================================================
    // МЕТОДЫ ДЛЯ УДОБНОГО ПРИМЕНЕНИЯ ВЕНТИЛЕЙ
    // ============================================================================

    /**
     * Применить вентиль Адамара к состоянию
     * @param {QuantumState} state - Квантовое состояние
     * @returns {QuantumState} Состояние после применения H
     */
    static hadamard(state) {
        return this.applySingleQubitGate(state, this.H());
    }

    /**
     * Применить вентиль Паули-X к состоянию
     * @param {QuantumState} state - Квантовое состояние
     * @returns {QuantumState} Состояние после применения X
     */
    static pauliX(state) {
        return this.applySingleQubitGate(state, this.X());
    }

    /**
     * Применить вентиль Паули-Y к состоянию  
     * @param {QuantumState} state - Квантовое состояние
     * @returns {QuantumState} Состояние после применения Y
     */
    static pauliY(state) {
        return this.applySingleQubitGate(state, this.Y());
    }

    /**
     * Применить вентиль Паули-Z к состоянию
     * @param {QuantumState} state - Квантовое состояние  
     * @returns {QuantumState} Состояние после применения Z
     */
    static pauliZ(state) {
        return this.applySingleQubitGate(state, this.Z());
    }

    /**
     * Применить S-вентиль к состоянию
     * @param {QuantumState} state - Квантовое состояние
     * @returns {QuantumState} Состояние после применения S
     */
    static sGate(state) {
        return this.applySingleQubitGate(state, this.S());
    }

    /**
     * Применить T-вентиль к состоянию
     * @param {QuantumState} state - Квантовое состояние
     * @returns {QuantumState} Состояние после применения T
     */
    static tGate(state) {
        return this.applySingleQubitGate(state, this.T());
    }

    /**
     * Применить CNOT к двум состояниям
     * @param {QuantumState} control - Управляющий кубит
     * @param {QuantumState} target - Целевой кубит
     * @returns {[QuantumState, QuantumState]} Новые состояния после CNOT
     */
    static cnot(control, target) {
        return this.applyTwoQubitGate(control, target, this.CNOT());
    }

    /**
     * Применить CZ к двум состояниям
     * @param {QuantumState} state1 - Первый кубит
     * @param {QuantumState} state2 - Второй кубит
     * @returns {[QuantumState, QuantumState]} Новые состояния после CZ
     */
    static cz(state1, state2) {
        return this.applyTwoQubitGate(state1, state2, this.CZ());
    }

    // ============================================================================
    // СОЗДАНИЕ СПЕЦИАЛЬНЫХ ЗАПУТАННЫХ СОСТОЯНИЙ
    // ============================================================================

    /**
     * Создание состояния Белла Φ+ = (|00⟩ + |11⟩)/√2
     * @returns {[QuantumState, QuantumState]} Пара запутанных кубитов
     */
    static createBellPhiPlus() {
        const state0 = QuantumState.zero();
        const state1 = QuantumState.zero();
        
        // H на первом кубите + CNOT
        const afterH = this.hadamard(state0);
        return this.cnot(afterH, state1);
    }

    /**
     * Создание состояния Белла Φ- = (|00⟩ - |11⟩)/√2
     * @returns {[QuantumState, QuantumState]} Пара запутанных кубитов  
     */
    static createBellPhiMinus() {
        const [state1, state2] = this.createBellPhiPlus();
        return [this.pauliZ(state1), state2];
    }

    /**
     * Создание состояния Белла Ψ+ = (|01⟩ + |10⟩)/√2
     * @returns {[QuantumState, QuantumState]} Пара запутанных кубитов
     */
    static createBellPsiPlus() {
        const [state1, state2] = this.createBellPhiPlus();
        return [state1, this.pauliX(state2)];
    }

    /**
     * Создание состояния Белла Ψ- = (|01⟩ - |10⟩)/√2  
     * @returns {[QuantumState, QuantumState]} Пара запутанных кубитов
     */
    static createBellPsiMinus() {
        const [state1, state2] = this.createBellPhiPlus();
        return [this.pauliZ(state1), this.pauliX(state2)];
    }

    // ============================================================================
    // ИНФОРМАЦИЯ О ВЕНТИЛЯХ
    // ============================================================================

    /**
     * Получить информацию о квантовом вентиле
     * @param {string} gateName - Название вентиля
     * @returns {{symbol: string, description: string, type: string}}
     */
    static getGateInfo(gateName) {
        const gates = {
            'I': { symbol: 'I', description: 'Тождественная матрица', type: 'single' },
            'X': { symbol: 'X', description: 'Квантовый NOT (поворот на π вокруг X)', type: 'single' },
            'Y': { symbol: 'Y', description: 'Поворот на π вокруг оси Y', type: 'single' },
            'Z': { symbol: 'Z', description: 'Фазовый флип (поворот на π вокруг Z)', type: 'single' },
            'H': { symbol: 'H', description: 'Адамар - создание суперпозиции', type: 'single' },
            'S': { symbol: 'S', description: 'Фазовый сдвиг на π/2', type: 'single' },
            'T': { symbol: 'T', description: 'Фазовый сдвиг на π/4', type: 'single' },
            'RX': { symbol: 'Rx', description: 'Поворот вокруг оси X', type: 'parametric' },
            'RY': { symbol: 'Ry', description: 'Поворот вокруг оси Y', type: 'parametric' },
            'RZ': { symbol: 'Rz', description: 'Поворот вокруг оси Z', type: 'parametric' },
            'CNOT': { symbol: '⊕', description: 'Контролируемый NOT - создает запутанность', type: 'two-qubit' },
            'CZ': { symbol: 'CZ', description: 'Контролируемый Z - условный фазовый флип', type: 'two-qubit' },
            'SWAP': { symbol: '⇄', description: 'Перестановка двух кубитов', type: 'two-qubit' },
            'CH': { symbol: 'CH', description: 'Контролируемый Адамар', type: 'two-qubit' }
        };
        
        return gates[gateName] || { 
            symbol: '?', 
            description: 'Неизвестный вентиль', 
            type: 'unknown' 
        };
    }

    /**
     * Получить список всех доступных вентилей
     * @returns {string[]} Массив названий вентилей
     */
    static getAvailableGates() {
        return ['I', 'X', 'Y', 'Z', 'H', 'S', 'T', 'RX', 'RY', 'RZ', 'CNOT', 'CZ', 'SWAP', 'CH'];
    }
}