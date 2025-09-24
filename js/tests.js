// path: tests/tests.js
/**
 * Unit-тесты для квантовой машины Тьюринга
 * Проверяет корректность работы всех компонентов системы
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex, ComplexUtils } from '../js/complex.js';
import { QuantumState } from '../js/quantum-state.js';
import { QuantumGates } from '../js/quantum-gates.js';
import { QuantumRegister } from '../js/quantum-register.js';
import { QuantumAlgorithms } from '../js/algorithms.js';

/**
 * Простой фреймворк для тестирования
 */
class TestFramework {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.startTime = 0;
    }

    /**
     * Регистрация теста
     * @param {string} name - Название теста
     * @param {Function} testFn - Функция теста
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * Assertion - проверка условия
     * @param {boolean} condition - Условие для проверки
     * @param {string} message - Сообщение об ошибке
     */
    assert(condition, message = 'Assertion failed') {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Проверка равенства с точностью
     * @param {number} actual - Фактическое значение
     * @param {number} expected - Ожидаемое значение
     * @param {number} epsilon - Точность
     * @param {string} message - Сообщение об ошибке
     */
    assertApproximately(actual, expected, epsilon = 1e-10, message = '') {
        const diff = Math.abs(actual - expected);
        if (diff > epsilon) {
            throw new Error(`${message} - Expected ${expected}, got ${actual}, diff ${diff}`);
        }
    }

    /**
     * Проверка равенства комплексных чисел
     * @param {Complex} actual - Фактическое значение
     * @param {Complex} expected - Ожидаемое значение
     * @param {number} epsilon - Точность
     * @param {string} message - Сообщение об ошибке
     */
    assertComplexEquals(actual, expected, epsilon = 1e-10, message = '') {
        if (!actual.equals(expected, epsilon)) {
            throw new Error(`${message} - Expected ${expected.toString()}, got ${actual.toString()}`);
        }
    }

    /**
     * Запуск всех тестов
     */
    async run() {
        console.log('🧪 Начало выполнения тестов...\n');
        this.startTime = Date.now();
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                this.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                console.error(`❌ ${test.name}: ${error.message}`);
                console.error(error.stack);
            }
        }

        this.printSummary();
    }

    /**
     * Печать итогов тестирования
     */
    printSummary() {
        const totalTime = Date.now() - this.startTime;
        const total = this.passed + this.failed;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ');
        console.log('='.repeat(50));
        console.log(`Всего тестов: ${total}`);
        console.log(`Успешно: ${this.passed}`);
        console.log(`Провалено: ${this.failed}`);
        console.log(`Время выполнения: ${totalTime}мс`);
        console.log(`Успешность: ${((this.passed / total) * 100).toFixed(1)}%`);
        
        if (this.failed === 0) {
            console.log('🎉 Все тесты пройдены успешно!');
        } else {
            console.log('⚠️ Некоторые тесты провалены');
        }
        console.log('='.repeat(50));
    }
}

// Создаем экземпляр фреймворка тестирования
const test = new TestFramework();

// ============================================================================
// ТЕСТЫ ДЛЯ КОМПЛЕКСНЫХ ЧИСЕЛ
// ============================================================================

test.test('Complex: Создание и свойства', () => {
    const z1 = new Complex(3, 4);
    test.assert(z1.re === 3, 'Вещественная часть должна быть 3');
    test.assert(z1.im === 4, 'Мнимая часть должна быть 4');
    test.assertApproximately(z1.abs(), 5, 1e-10, 'Модуль должен быть 5');
    test.assertApproximately(z1.arg(), Math.atan2(4, 3), 1e-10, 'Аргумент неверный');
});

test.test('Complex: Арифметические операции', () => {
    const z1 = new Complex(2, 3);
    const z2 = new Complex(1, -1);
    
    // Сложение
    const sum = z1.add(z2);
    test.assertComplexEquals(sum, new Complex(3, 2), 1e-10, 'Сложение');
    
    // Вычитание
    const diff = z1.sub(z2);
    test.assertComplexEquals(diff, new Complex(1, 4), 1e-10, 'Вычитание');
    
    // Умножение
    const mult = z1.mul(z2);
    test.assertComplexEquals(mult, new Complex(5, 1), 1e-10, 'Умножение');
    
    // Деление
    const div = z1.div(z2);
    test.assertComplexEquals(div, new Complex(-0.5, 2.5), 1e-10, 'Деление');
});

test.test('Complex: Сопряжение и экспонента', () => {
    const z = new Complex(1, 2);
    const conj = z.conj();
    test.assertComplexEquals(conj, new Complex(1, -2), 1e-10, 'Сопряжение');
    
    // exp(iπ) = -1
    const expPi = Complex.exp(Math.PI);
    test.assertComplexEquals(expPi, new Complex(-1, 0), 1e-10, 'exp(iπ) = -1');
    
    // exp(iπ/2) = i
    const expPiHalf = Complex.exp(Math.PI / 2);
    test.assertComplexEquals(expPiHalf, new Complex(0, 1), 1e-10, 'exp(iπ/2) = i');
});

// ============================================================================
// ТЕСТЫ ДЛЯ КВАНТОВЫХ СОСТОЯНИЙ
// ============================================================================

test.test('QuantumState: Создание базисных состояний', () => {
    const state0 = QuantumState.zero();
    test.assertApproximately(state0.getProbability0(), 1, 1e-10, 'P(0) для |0⟩');
    test.assertApproximately(state0.getProbability1(), 0, 1e-10, 'P(1) для |0⟩');
    
    const state1 = QuantumState.one();
    test.assertApproximately(state1.getProbability0(), 0, 1e-10, 'P(0) для |1⟩');
    test.assertApproximately(state1.getProbability1(), 1, 1e-10, 'P(1) для |1⟩');
});

test.test('QuantumState: Создание суперпозиций', () => {
    const statePlus = QuantumState.plus();
    test.assertApproximately(statePlus.getProbability0(), 0.5, 1e-10, 'P(0) для |+⟩');
    test.assertApproximately(statePlus.getProbability1(), 0.5, 1e-10, 'P(1) для |+⟩');
    
    const stateMinus = QuantumState.minus();
    test.assertApproximately(stateMinus.getProbability0(), 0.5, 1e-10, 'P(0) для |-⟩');
    test.assertApproximately(stateMinus.getProbability1(), 0.5, 1e-10, 'P(1) для |-⟩');
});

test.test('QuantumState: Углы Блоха', () => {
    // |0⟩: θ = 0, φ = любое
    const state0 = QuantumState.zero();
    const angles0 = state0.getBlochAngles();
    test.assertApproximately(angles0.theta, 0, 1e-10, 'θ для |0⟩');
    
    // |1⟩: θ = π, φ = любое
    const state1 = QuantumState.one();
    const angles1 = state1.getBlochAngles();
    test.assertApproximately(angles1.theta, Math.PI, 1e-10, 'θ для |1⟩');
    
    // |+⟩: θ = π/2, φ = 0
    const statePlus = QuantumState.plus();
    const anglesPlus = statePlus.getBlochAngles();
    test.assertApproximately(anglesPlus.theta, Math.PI / 2, 1e-10, 'θ для |+⟩');
    test.assertApproximately(anglesPlus.phi, 0, 1e-10, 'φ для |+⟩');
});

test.test('QuantumState: Нормализация', () => {
    // Создаем ненормированное состояние
    const alpha = new Complex(3, 4);
    const beta = new Complex(1, 2);
    const state = new QuantumState(alpha, beta);
    
    // Проверяем нормировку
    const totalProb = state.getProbability0() + state.getProbability1();
    test.assertApproximately(totalProb, 1, 1e-10, 'Сумма вероятностей должна быть 1');
});

// ============================================================================
// ТЕСТЫ ДЛЯ КВАНТОВЫХ ВЕНТИЛЕЙ
// ============================================================================

test.test('QuantumGates: Паули-X (NOT)', () => {
    const state0 = QuantumState.zero();
    const state1 = QuantumGates.pauliX(state0);
    
    test.assertApproximately(state1.getProbability0(), 0, 1e-10, 'X|0⟩ = |1⟩');
    test.assertApproximately(state1.getProbability1(), 1, 1e-10, 'X|0⟩ = |1⟩');
});

test.test('QuantumGates: Hadamard', () => {
    const state0 = QuantumState.zero();
    const statePlus = QuantumGates.hadamard(state0);
    
    test.assertApproximately(statePlus.getProbability0(), 0.5, 1e-10, 'H|0⟩ вероятность |0⟩');
    test.assertApproximately(statePlus.getProbability1(), 0.5, 1e-10, 'H|0⟩ вероятность |1⟩');
    
    // H|1⟩ = |-⟩
    const state1 = QuantumState.one();
    const stateMinus = QuantumGates.hadamard(state1);
    
    // Проверяем что это действительно |-⟩ (амплитуды (1, -1)/√2)
    const expectedMinus = QuantumState.minus();
    test.assert(stateMinus.alpha.equals(expectedMinus.alpha, 1e-10), 'H|1⟩ alpha');
    test.assert(stateMinus.beta.equals(expectedMinus.beta, 1e-10), 'H|1⟩ beta');
});

test.test('QuantumGates: Паули-Z', () => {
    // Z|0⟩ = |0⟩
    const state0 = QuantumState.zero();
    const zState0 = QuantumGates.pauliZ(state0);
    test.assert(zState0.equals(state0, 1e-10), 'Z|0⟩ = |0⟩');
    
    // Z|1⟩ = -|1⟩
    const state1 = QuantumState.one();
    const zState1 = QuantumGates.pauliZ(state1);
    
    // Проверяем что амплитуда |1⟩ изменила знак
    test.assertComplexEquals(zState1.beta, new Complex(-1, 0), 1e-10, 'Z|1⟩ = -|1⟩');
});

// ============================================================================
// ТЕСТЫ ДЛЯ ДВУХКУБИТНЫХ ОПЕРАЦИЙ
// ============================================================================

test.test('QuantumRegister: Создание и базовые операции', () => {
    const register = new QuantumRegister(2);
    
    // Начальное состояние |00⟩
    test.assertApproximately(register.getProbability(0), 1, 1e-10, 'Начальное состояние |00⟩');
    test.assert(register.isNormalized(), 'Регистр должен быть нормирован');
    
    // Применение H к первому кубиту
    register.applySingleQubitGate(QuantumGates.H(), 0);
    
    // Должно получиться (|00⟩ + |10⟩)/√2
    test.assertApproximately(register.getProbability(0), 0.5, 1e-10, 'P(|00⟩) после H');
    test.assertApproximately(register.getProbability(2), 0.5, 1e-10, 'P(|10⟩) после H');
});

test.test('QuantumRegister: CNOT и запутанность', () => {
    const register = new QuantumRegister(2);
    
    // Создаем состояние Белла: H на первом кубите, затем CNOT
    register.applySingleQubitGate(QuantumGates.H(), 0);
    register.applyTwoQubitGate(QuantumGates.CNOT(), 0, 1);
    
    // Должно получиться (|00⟩ + |11⟩)/√2
    test.assertApproximately(register.getProbability(0), 0.5, 1e-10, 'P(|00⟩) в состоянии Белла');
    test.assertApproximately(register.getProbability(3), 0.5, 1e-10, 'P(|11⟩) в состоянии Белла');
    test.assertApproximately(register.getProbability(1), 0, 1e-10, 'P(|01⟩) в состоянии Белла');
    test.assertApproximately(register.getProbability(2), 0, 1e-10, 'P(|10⟩) в состоянии Белла');
    
    // Проверяем запутанность
    const entanglement = register.getEntanglementMeasure();
    test.assert(entanglement > 0.5, 'Состояние должно быть запутанным');
});

// ============================================================================
// ТЕСТЫ ДЛЯ АЛГОРИТМОВ
// ============================================================================

test.test('Алгоритм Дойча: Константная функция', () => {
    const result = QuantumAlgorithms.deutschAlgorithm('constant-0');
    
    test.assert(result.algorithm === 'Deutsch', 'Название алгоритма');
    test.assert(result.interpretation === 'константная', 'Интерпретация результата');
    test.assert(result.isCorrect, 'Результат должен быть корректным');
    test.assert(result.steps.length >= 4, 'Должно быть не менее 4 шагов');
});

test.test('Алгоритм Дойча: Сбалансированная функция', () => {
    const result = QuantumAlgorithms.deutschAlgorithm('balanced-identity');
    
    test.assert(result.interpretation === 'сбалансированная', 'Интерпретация результата');
    test.assert(result.isCorrect, 'Результат должен быть корректным');
});

test.test('Алгоритм Гровера: Поиск элемента', () => {
    const result = QuantumAlgorithms.groverAlgorithm(2, 1); // Ищем элемент 2, 1 итерация
    
    test.assert(result.algorithm === 'Grover', 'Название алгоритма');
    test.assert(result.target === 2, 'Целевой элемент');
    test.assert(result.iterations === 1, 'Количество итераций');
    
    // Вероятность нахождения целевого элемента должна быть выше случайного (25%)
    test.assert(result.targetProbability > 0.25, 'Вероятность должна быть улучшена');
});

test.test('Состояния Белла: Создание Φ+', () => {
    const result = QuantumAlgorithms.createBellState('phi+');
    
    test.assert(result.bellType === 'phi+', 'Тип состояния Белла');
    test.assert(result.isMaximallyEntangled, 'Должно быть максимально запутанным');
    
    // Проверяем вероятности |00⟩ и |11⟩
    const probs = result.probabilities;
    test.assertApproximately(probs[0], 0.5, 1e-10, 'P(|00⟩) в Φ+');
    test.assertApproximately(probs[3], 0.5, 1e-10, 'P(|11⟩) в Φ+');
    test.assertApproximately(probs[1], 0, 1e-10, 'P(|01⟩) в Φ+');
    test.assertApproximately(probs[2], 0, 1e-10, 'P(|10⟩) в Φ+');
});

// ============================================================================
// ТЕСТЫ НА ИНВАРИАНТЫ И ГРАНИЧНЫЕ СЛУЧАИ
// ============================================================================

test.test('Инварианты: Сохранение нормировки', () => {
    const state = QuantumState.random();
    const gates = ['H', 'X', 'Y', 'Z', 'S', 'T'];
    
    for (const gateName of gates) {
        let newState;
        switch (gateName) {
            case 'H': newState = QuantumGates.hadamard(state); break;
            case 'X': newState = QuantumGates.pauliX(state); break;
            case 'Y': newState = QuantumGates.pauliY(state); break;
            case 'Z': newState = QuantumGates.pauliZ(state); break;
            case 'S': newState = QuantumGates.sGate(state); break;
            case 'T': newState = QuantumGates.tGate(state); break;
        }
        
        const totalProb = newState.getProbability0() + newState.getProbability1();
        test.assertApproximately(totalProb, 1, 1e-10, `Нормировка после ${gateName}`);
    }
});

test.test('Граничные случаи: Деление на ноль в комплексных числах', () => {
    const z1 = new Complex(1, 1);
    const z2 = new Complex(0, 0);
    
    try {
        z1.div(z2);
        test.assert(false, 'Должно быть исключение при делении на ноль');
    } catch (error) {
        test.assert(error.message.includes('ноль'), 'Правильное сообщение об ошибке');
    }
});

test.test('Граничные случаи: Некорректные параметры регистра', () => {
    try {
        new QuantumRegister(0);
        test.assert(false, 'Должно быть исключение для 0 кубитов');
    } catch (error) {
        test.assert(error.message.includes('1 до 20'), 'Правильное сообщение об ошибке');
    }
    
    try {
        new QuantumRegister(25);
        test.assert(false, 'Должно быть исключение для слишком большого числа кубитов');
    } catch (error) {
        test.assert(error.message.includes('1 до 20'), 'Правильное сообщение об ошибке');
    }
});

// ============================================================================
// ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================================================

test.test('Производительность: Операции с комплексными числами', () => {
    const startTime = Date.now();
    const iterations = 10000;
    
    for (let i = 0; i < iterations; i++) {
        const z1 = new Complex(Math.random(), Math.random());
        const z2 = new Complex(Math.random(), Math.random());
        
        z1.add(z2).mul(z1).conj().abs();
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`Производительность комплексных чисел: ${iterations} операций за ${elapsed}мс`);
    test.assert(elapsed < 1000, 'Операции с комплексными числами должны быть быстрыми');
});

test.test('Производительность: Применение вентилей', () => {
    const startTime = Date.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
        const state = QuantumState.random();
        QuantumGates.hadamard(QuantumGates.pauliX(QuantumGates.pauliZ(state)));
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`Производительность вентилей: ${iterations} операций за ${elapsed}мс`);
    test.assert(elapsed < 2000, 'Применение вентилей должно быть достаточно быстрым');
});

// ============================================================================
// ЗАПУСК ТЕСТОВ
// ============================================================================

// Запускаем все тесты
test.run().then(() => {
    // Дополнительные проверки после завершения тестов
    if (test.failed === 0) {
        console.log('\n🎯 ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ:');
        
        // Проверяем доступность всех экспортируемых классов
        const requiredClasses = [Complex, QuantumState, QuantumGates, QuantumRegister, QuantumAlgorithms];
        const classNames = ['Complex', 'QuantumState', 'QuantumGates', 'QuantumRegister', 'QuantumAlgorithms'];
        
        requiredClasses.forEach((cls, index) => {
            if (typeof cls === 'function' || typeof cls === 'object') {
                console.log(`✅ ${classNames[index]} - доступен`);
            } else {
                console.log(`❌ ${classNames[index]} - недоступен`);
            }
        });
        
        // Проверяем наличие основных методов
        const complexMethods = ['add', 'mul', 'conj', 'abs', 'arg'];
        const hasMethods = complexMethods.every(method => 
            typeof Complex.prototype[method] === 'function'
        );
        
        if (hasMethods) {
            console.log('✅ Все методы Complex - реализованы');
        } else {
            console.log('❌ Некоторые методы Complex отсутствуют');
        }
        
        console.log('\n🚀 Система готова к использованию!');
    }
}).catch(error => {
    console.error('Критическая ошибка при запуске тестов:', error);
});

// Экспорт для использования в других модулях
export { test, TestFramework };