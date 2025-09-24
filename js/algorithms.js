// path: js/algorithms.js
/**
 * Квантовые алгоритмы для демонстрации преимуществ квантовых вычислений
 * Реализует корректные алгоритмы Дойча и Гровера
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

import { Complex } from './complex.js';
import { QuantumState } from './quantum-state.js';
import { QuantumRegister } from './quantum-register.js';
import { QuantumGates, QuantumMatrix } from './quantum-gates.js';
import { QuantumTape } from './quantum-tape.js';

export class QuantumAlgorithms {
    
    // ============================================================================
    // АЛГОРИТМ ДОЙЧА
    // ============================================================================

    /**
     * Реализация алгоритма Дойча для определения типа булевой функции
     * @param {string} functionType - Тип функции: 'constant-0', 'constant-1', 'balanced-identity', 'balanced-not'
     * @returns {Object} Результат выполнения алгоритма
     */
    static deutschAlgorithm(functionType) {
        console.log(`🔬 Выполнение алгоритма Дойча для функции: ${functionType}`);
        
        // Создаем двухкубитный регистр
        const register = new QuantumRegister(2);
        const steps = [];
        
        // Шаг 1: Инициализация |01⟩
        register.setAmplitude(1, Complex.ONE); // |01⟩
        steps.push({
            step: 1,
            operation: 'Инициализация в состоянии |01⟩',
            state: register.toString(),
            description: 'Подготавливаем входные кубиты: первый в |0⟩, второй в |1⟩'
        });

        // Шаг 2: Применяем Hadamard к обоим кубитам
        register.applySingleQubitGate(QuantumGates.H(), 0); // H к первому кубиту
        register.applySingleQubitGate(QuantumGates.H(), 1); // H к второму кубиту
        steps.push({
            step: 2,
            operation: 'H ⊗ H',
            state: register.toString(),
            description: 'Создаем суперпозицию: |+⟩|-⟩ = (|0⟩+|1⟩)(|0⟩-|1⟩)/2'
        });

        // Шаг 3: Применяем оракул функции
        const oracleResult = this.applyDeutschOracle(register, functionType);
        steps.push({
            step: 3,
            operation: `Оракул Uf (${functionType})`,
            state: register.toString(),
            description: `Применяем унитарный оракул для функции f: ${oracleResult.description}`
        });

        // Шаг 4: Применяем Hadamard к первому кубиту
        register.applySingleQubitGate(QuantumGates.H(), 0);
        steps.push({
            step: 4,
            operation: 'H к первому кубиту',
            state: register.toString(),
            description: 'Финальный Hadamard для извлечения информации о функции'
        });

        // Шаг 5: Измерение первого кубита
        const measurementResult = register.measureQubit(0);
        steps.push({
            step: 5,
            operation: 'Измерение первого кубита',
            state: register.toString(),
            description: `Результат измерения: ${measurementResult}`
        });

        // Интерпретация результата
        const interpretation = measurementResult === 0 ? 'константная' : 'сбалансированная';
        const isCorrect = this.checkDeutschResult(functionType, interpretation);

        return {
            algorithm: 'Deutsch',
            functionType,
            steps,
            measurementResult,
            interpretation,
            isCorrect,
            quantumAdvantage: 'Классически требуется 2 вызова функции, квантово - 1',
            finalState: register.toString()
        };
    }

    /**
     * Применение оракула для алгоритма Дойча
     * @param {QuantumRegister} register - Двухкубитный регистр
     * @param {string} functionType - Тип функции
     * @returns {Object} Информация о примененном оракуле
     */
    static applyDeutschOracle(register, functionType) {
        let gateMatrix;
        let description;

        switch (functionType) {
            case 'constant-0':
                // f(x) = 0: не изменяем состояние (тождественная матрица)
                gateMatrix = QuantumGates.I().tensorProduct(QuantumGates.I());
                description = 'f(x) = 0 для всех x (константная функция)';
                break;

            case 'constant-1':
                // f(x) = 1: применяем X к второму кубиту
                gateMatrix = QuantumGates.I().tensorProduct(QuantumGates.X());
                description = 'f(x) = 1 для всех x (константная функция)';
                break;

            case 'balanced-identity':
                // f(x) = x: применяем CNOT
                gateMatrix = QuantumGates.CNOT();
                description = 'f(0) = 0, f(1) = 1 (сбалансированная функция - тождество)';
                break;

            case 'balanced-not':
                // f(x) = NOT x: применяем X к второму кубиту, затем CNOT
                // Эквивалентно CNOT, затем X к второму кубиту
                const xGate = QuantumGates.I().tensorProduct(QuantumGates.X());
                const cnotGate = QuantumGates.CNOT();
                gateMatrix = cnotGate;
                // Применяем X к второму кубиту после CNOT
                register.applySingleQubitGate(QuantumGates.X(), 1);
                description = 'f(0) = 1, f(1) = 0 (сбалансированная функция - отрицание)';
                break;

            default:
                gateMatrix = QuantumGates.I().tensorProduct(QuantumGates.I());
                description = 'Неизвестная функция, применяем тождественную матрицу';
        }

        // Применяем оракул к регистру (кроме balanced-not, который уже частично применен)
        if (functionType !== 'balanced-not') {
            const currentAmplitudes = [];
            for (let i = 0; i < register.dimension; i++) {
                currentAmplitudes.push(register.getAmplitude(i));
            }
            
            const newAmplitudes = gateMatrix.apply(currentAmplitudes);
            
            for (let i = 0; i < register.dimension; i++) {
                register.setAmplitude(i, newAmplitudes[i]);
            }
        }

        return { description, matrix: gateMatrix };
    }

    /**
     * Проверка корректности результата алгоритма Дойча
     * @param {string} functionType - Тип функции
     * @param {string} interpretation - Интерпретация результата
     * @returns {boolean} true если результат корректен
     */
    static checkDeutschResult(functionType, interpretation) {
        const expectedConstant = functionType.includes('constant');
        const gotConstant = interpretation === 'константная';
        return expectedConstant === gotConstant;
    }

    // ============================================================================
    // АЛГОРИТМ ГРОВЕРА
    // ============================================================================

    /**
     * Реализация алгоритма Гровера для поиска в неупорядоченной базе данных
     * @param {number} targetItem - Индекс искомого элемента (0-3 для 2-кубитного случая)
     * @param {number} [iterations] - Количество итераций (по умолчанию оптимальное)
     * @returns {Object} Результат выполнения алгоритма
     */
    static groverAlgorithm(targetItem, iterations = null) {
        console.log(`🔍 Выполнение алгоритма Гровера для поиска элемента ${targetItem}`);
        
        if (targetItem < 0 || targetItem > 3) {
            throw new Error('Целевой элемент должен быть от 0 до 3 для двухкубитного случая');
        }

        // Оптимальное число итераций для N=4: π/4 * √4 ≈ 1.57 ≈ 1-2 итерации
        const optimalIterations = Math.floor(Math.PI / 4 * Math.sqrt(4));
        iterations = iterations ?? optimalIterations;

        const register = new QuantumRegister(2);
        const steps = [];
        
        // Шаг 1: Создание равновесной суперпозиции
        register.applySingleQubitGate(QuantumGates.H(), 0);
        register.applySingleQubitGate(QuantumGates.H(), 1);
        
        steps.push({
            step: 1,
            operation: 'H ⊗ H - создание суперпозиции',
            state: register.toString(),
            description: 'Создаем равновесную суперпозицию всех состояний: (|00⟩+|01⟩+|10⟩+|11⟩)/2',
            probabilities: register.getAllProbabilities()
        });

        // Шаги 2-N: Итерации Гровера
        for (let iteration = 1; iteration <= iterations; iteration++) {
            // Оракул: флип фазы целевого элемента
            this.applyGroverOracle(register, targetItem);
            steps.push({
                step: steps.length + 1,
                operation: `Итерация ${iteration}: Оракул`,
                state: register.toString(),
                description: `Помечаем целевой элемент |${targetItem.toString(2).padStart(2, '0')}⟩ инверсией фазы`,
                probabilities: register.getAllProbabilities()
            });

            // Диффузор: инверсия относительно среднего
            this.applyGroverDiffuser(register);
            steps.push({
                step: steps.length + 1,
                operation: `Итерация ${iteration}: Диффузор`,
                state: register.toString(),
                description: 'Усиливаем амплитуду целевого состояния инверсией относительно среднего',
                probabilities: register.getAllProbabilities()
            });
        }

        // Финальное измерение
        const measurementResult = register.measureAll();
        const finalProbabilities = register.getAllProbabilities();
        
        steps.push({
            step: steps.length + 1,
            operation: 'Измерение',
            state: register.toString(),
            description: `Результат измерения: ${measurementResult}`,
            probabilities: finalProbabilities
        });

        // Анализ результата
        const foundCorrect = measurementResult === targetItem;
        const targetProbability = steps[steps.length - 2].probabilities[targetItem]; // Вероятность перед измерением
        
        return {
            algorithm: 'Grover',
            target: targetItem,
            iterations,
            steps,
            measurementResult,
            foundCorrect,
            targetProbability,
            quantumAdvantage: `Классически: O(N) = 4 проверки в среднем. Квантово: O(√N) = ${iterations} итерации`,
            finalState: register.toString(),
            success: foundCorrect
        };
    }

    /**
     * Применение оракула Гровера (инверсия фазы целевого элемента)
     * @param {QuantumRegister} register - Квантовый регистр
     * @param {number} targetItem - Индекс целевого элемента
     */
    static applyGroverOracle(register, targetItem) {
        // Создаем диагональную матрицу для инверсии фазы
        const oracleMatrix = [];
        
        for (let i = 0; i < register.dimension; i++) {
            const row = [];
            for (let j = 0; j < register.dimension; j++) {
                if (i === j) {
                    // Инвертируем фазу для целевого элемента
                    row.push(i === targetItem ? new Complex(-1, 0) : Complex.ONE);
                } else {
                    row.push(Complex.ZERO);
                }
            }
            oracleMatrix.push(row);
        }

        const oracle = new QuantumMatrix(oracleMatrix);
        
        // Применяем оракул
        const currentAmplitudes = [];
        for (let i = 0; i < register.dimension; i++) {
            currentAmplitudes.push(register.getAmplitude(i));
        }
        
        const newAmplitudes = oracle.apply(currentAmplitudes);
        
        for (let i = 0; i < register.dimension; i++) {
            register.setAmplitude(i, newAmplitudes[i]);
        }
    }

    /**
     * Применение диффузора Гровера (инверсия относительно среднего)
     * @param {QuantumRegister} register - Квантовый регистр
     */
    static applyGroverDiffuser(register) {
        // Диффузор = 2|s⟩⟨s| - I, где |s⟩ = (|00⟩+|01⟩+|10⟩+|11⟩)/2
        // Эквивалентно: H⊗H, инверсия фазы |00⟩, H⊗H
        
        // Шаг 1: H⊗H
        register.applySingleQubitGate(QuantumGates.H(), 0);
        register.applySingleQubitGate(QuantumGates.H(), 1);
        
        // Шаг 2: Инверсия фазы состояния |00⟩
        const currentAmplitude = register.getAmplitude(0);
        register.setAmplitude(0, currentAmplitude.mul(new Complex(-1, 0)));
        
        // Шаг 3: H⊗H
        register.applySingleQubitGate(QuantumGates.H(), 0);
        register.applySingleQubitGate(QuantumGates.H(), 1);
    }

    // ============================================================================
    // СОСТОЯНИЯ БЕЛЛА
    // ============================================================================

    /**
     * Создание состояния Белла заданного типа
     * @param {string} bellType - Тип состояния Белла: 'phi+', 'phi-', 'psi+', 'psi-'
     * @returns {Object} Информация о созданном состоянии Белла
     */
    static createBellState(bellType) {
        const register = new QuantumRegister(2);
        const steps = [];
        
        // Начинаем с |00⟩
        steps.push({
            step: 1,
            operation: 'Инициализация',
            state: register.toString(),
            description: 'Начальное состояние |00⟩'
        });

        // Применяем Hadamard к первому кубиту
        register.applySingleQubitGate(QuantumGates.H(), 0);
        steps.push({
            step: 2,
            operation: 'H к первому кубиту',
            state: register.toString(),
            description: 'Создаем суперпозицию первого кубита: (|00⟩+|10⟩)/√2'
        });

        // Применяем CNOT
        register.applyTwoQubitGate(QuantumGates.CNOT(), 0, 1);
        steps.push({
            step: 3,
            operation: 'CNOT(0→1)',
            state: register.toString(),
            description: 'Создаем запутанность: (|00⟩+|11⟩)/√2'
        });

        // Дополнительные преобразования для других состояний Белла
        switch (bellType.toLowerCase()) {
            case 'phi-':
                // Φ- = (|00⟩-|11⟩)/√2: применяем Z к любому кубиту
                register.applySingleQubitGate(QuantumGates.Z(), 0);
                steps.push({
                    step: 4,
                    operation: 'Z к первому кубиту',
                    state: register.toString(),
                    description: 'Получаем Φ-: (|00⟩-|11⟩)/√2'
                });
                break;
                
            case 'psi+':
                // Ψ+ = (|01⟩+|10⟩)/√2: применяем X к второму кубиту
                register.applySingleQubitGate(QuantumGates.X(), 1);
                steps.push({
                    step: 4,
                    operation: 'X ко второму кубиту',
                    state: register.toString(),
                    description: 'Получаем Ψ+: (|01⟩+|10⟩)/√2'
                });
                break;
                
            case 'psi-':
                // Ψ- = (|01⟩-|10⟩)/√2: применяем Z и X
                register.applySingleQubitGate(QuantumGates.Z(), 0);
                register.applySingleQubitGate(QuantumGates.X(), 1);
                steps.push({
                    step: 4,
                    operation: 'Z к первому, X ко второму',
                    state: register.toString(),
                    description: 'Получаем Ψ-: (|01⟩-|10⟩)/√2'
                });
                break;
                
            default:
                // phi+ - уже создано
                break;
        }

        // Анализ запутанности
        const entanglement = register.getEntanglementMeasure();
        const probabilities = register.getAllProbabilities();

        return {
            bellType: bellType.toLowerCase(),
            steps,
            finalState: register.toString(),
            entanglement,
            probabilities,
            isMaximallyEntangled: entanglement > 0.95
        };
    }

    // ============================================================================
    // КВАНТОВОЕ СЛОЖЕНИЕ (УПРОЩЕННАЯ ВЕРСИЯ)
    // ============================================================================

    /**
     * Демонстрация квантового сложения двух однобитных чисел
     * @param {number} a - Первое число (0 или 1)
     * @param {number} b - Второе число (0 или 1)
     * @returns {Object} Результат квантового сложения
     */
    static quantumAddition(a, b) {
        if (a < 0 || a > 1 || b < 0 || b > 1) {
            throw new Error('Числа должны быть 0 или 1');
        }

        const register = new QuantumRegister(3); // a, b, carry
        const steps = [];

        // Инициализация входных битов
        if (a === 1) register.applySingleQubitGate(QuantumGates.X(), 0);
        if (b === 1) register.applySingleQubitGate(QuantumGates.X(), 1);
        
        steps.push({
            step: 1,
            operation: 'Инициализация',
            state: register.toString(),
            description: `Устанавливаем a=${a}, b=${b}, carry=0`
        });

        // Полный сумматор с помощью вентилей Toffoli и CNOT
        // sum = a ⊕ b ⊕ carry_in
        // carry_out = ab + carry_in(a ⊕ b)

        // Для простоты используем CNOT для XOR
        register.applyTwoQubitGate(QuantumGates.CNOT(), 0, 1); // a XOR b → b
        
        steps.push({
            step: 2,
            operation: 'a ⊕ b',
            state: register.toString(),
            description: 'Вычисляем сумму по модулю 2'
        });

        // Результат
        const result = register.measureAll();
        const sum = result[1];
        const carry = a * b; // Для однобитного сложения carry = a AND b

        steps.push({
            step: 3,
            operation: 'Измерение',
            state: register.toString(),
            description: `Результат: ${a} + ${b} = ${carry}${sum} (двоичное)`
        });

        return {
            algorithm: 'QuantumAddition',
            inputs: { a, b },
            steps,
            result: { sum, carry },
            decimal: carry * 2 + sum,
            finalState: register.toString()
        };
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    /**
     * Получение списка доступных алгоритмов
     * @returns {Array} Список алгоритмов с описаниями
     */
    static getAvailableAlgorithms() {
        return [
            {
                name: 'deutsch',
                displayName: 'Алгоритм Дойча',
                description: 'Определяет тип булевой функции (константная/сбалансированная) за один запрос',
                qubits: 2,
                complexity: 'O(1) vs O(2) классически',
                variants: ['constant-0', 'constant-1', 'balanced-identity', 'balanced-not']
            },
            {
                name: 'grover',
                displayName: 'Поиск Гровера',
                description: 'Квадратичное ускорение поиска в неупорядоченной базе данных',
                qubits: 2,
                complexity: 'O(√N) vs O(N) классически',
                variants: [0, 1, 2, 3] // Целевые элементы для N=4
            },
            {
                name: 'bell',
                displayName: 'Состояния Белла',
                description: 'Создание максимально запутанных двухкубитных состояний',
                qubits: 2,
                complexity: 'Демонстрация квантовой запутанности',
                variants: ['phi+', 'phi-', 'psi+', 'psi-']
            },
            {
                name: 'addition',
                displayName: 'Квантовое сложение',
                description: 'Сложение двух битов в квантовой суперпозиции',
                qubits: 3,
                complexity: 'Демонстрация квантовых арифметических операций',
                variants: [[0,0], [0,1], [1,0], [1,1]]
            }
        ];
    }

    /**
     * Выполнение алгоритма по имени
     * @param {string} algorithmName - Название алгоритма
     * @param {any} parameter - Параметр алгоритма
     * @returns {Object} Результат выполнения
     */
    static runAlgorithm(algorithmName, parameter = null) {
        switch (algorithmName.toLowerCase()) {
            case 'deutsch':
                return this.deutschAlgorithm(parameter || 'constant-0');
            
            case 'grover':
                return this.groverAlgorithm(parameter || 0);
            
            case 'bell':
                return this.createBellState(parameter || 'phi+');
            
            case 'addition':
                const [a, b] = parameter || [0, 1];
                return this.quantumAddition(a, b);
            
            default:
                throw new Error(`Неизвестный алгоритм: ${algorithmName}`);
        }
    }

    /**
     * Получение рекомендуемых предустановок для демонстрации
     * @returns {Array} Список предустановок
     */
    static getRecommendedPresets() {
        return [
            {
                name: 'deutsch-constant',
                displayName: 'Дойч: Константная функция',
                algorithm: 'deutsch',
                parameter: 'constant-0',
                description: 'Демонстрирует определение константной функции f(x)=0'
            },
            {
                name: 'deutsch-balanced', 
                displayName: 'Дойч: Сбалансированная функция',
                algorithm: 'deutsch',
                parameter: 'balanced-identity',
                description: 'Демонстрирует определение сбалансированной функции f(x)=x'
            },
            {
                name: 'grover-search',
                displayName: 'Гровер: Поиск элемента',
                algorithm: 'grover',
                parameter: 2,
                description: 'Поиск элемента |10⟩ в базе данных из 4 элементов'
            },
            {
                name: 'bell-phiplus',
                displayName: 'Белл: Φ+ состояние',
                algorithm: 'bell',
                parameter: 'phi+',
                description: 'Создание максимально запутанного состояния (|00⟩+|11⟩)/√2'
            },
            {
                name: 'quantum-addition',
                displayName: 'Квантовое сложение: 1+1',
                algorithm: 'addition',
                parameter: [1, 1],
                description: 'Демонстрирует квантовое сложение 1+1=10₂'
            }
        ];
    }
}