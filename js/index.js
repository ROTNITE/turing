// path: js/index.js

/**
 * Главная точка входа для Квантовой машины Тьюринга v2.0
 * Инициализирует все модули и связывает их в единую систему
 */

// Импорт всех модулей
import { Complex } from './complex.js';
import { QuantumState } from './quantum-state.js';
import { QuantumGates } from './quantum-gates.js';
import { QuantumRegister } from './quantum-register.js';
import { QuantumTape } from './quantum-tape.js';
import { QTMachine } from './qt-machine.js';
import { BlochSphere } from './bloch.js';
import { AmplitudeVisualizer } from './viz-amplitudes.js';
import { Algorithms } from './algorithms.js';
import { UIController } from './ui-controller.js';
import { Utils } from './utils.js';

/**
 * Инициализация приложения
 */
async function initializeApp() {
    try {
        console.log('🚀 Инициализация Квантовой машины Тьюринга v2.0...');
        
        // Проверка совместимости браузера
        if (!Utils.checkBrowserSupport()) {
            throw new Error('Браузер не поддерживает необходимые функции');
        }
        
        // Создание основных компонентов
        const machine = new QTMachine();
        const uiController = new UIController(machine);
        
        // Инициализация UI
        await uiController.initialize();
        
        // Глобальный доступ для отладки
        window.quantumSimulator = {
            machine,
            ui: uiController,
            Complex,
            QuantumState,
            QuantumGates,
            QuantumRegister,
            Utils
        };
        
        console.log('✅ Квантовая машина Тьюринга инициализирована успешно');
        console.log('🎮 Доступные команды:');
        console.log('  - quantumSimulator.machine.start() - запуск симуляции');
        console.log('  - quantumSimulator.machine.step() - один шаг');
        console.log('  - quantumSimulator.machine.reset() - сброс');
        console.log('  - quantumSimulator.ui.loadPreset("bell-phi-plus") - загрузка предустановки');
        
        // Запуск тестов в режиме разработки
        if (window.location.search.includes('debug=1')) {
            await runQuickTests();
        }
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showErrorMessage('Не удалось инициализировать приложение: ' + error.message);
    }
}

/**
 * Быстрые тесты для проверки работоспособности
 */
async function runQuickTests() {
    console.log('🧪 Запуск быстрых тестов...');
    
    try {
        // Тест комплексных чисел
        const c1 = new Complex(1, 0);
        const c2 = new Complex(0, 1);
        const result = c1.mul(c2);
        console.assert(Math.abs(result.im - 1) < 1e-10, 'Complex multiplication test');
        
        // Тест квантового состояния
        const state = new QuantumState();
        QuantumGates.hadamard(state);
        console.assert(Math.abs(state.getProbability(0) - 0.5) < 1e-10, 'Hadamard test');
        
        // Тест двухкубитных операций
        const register = new QuantumRegister(2);
        register.applyGate('H', 0);
        register.applyGate('CNOT', 0, 1);
        console.assert(register.getEntanglement() > 0.9, 'CNOT entanglement test');
        
        console.log('✅ Все быстрые тесты пройдены');
    } catch (error) {
        console.error('❌ Ошибка в тестах:', error);
    }
}

/**
 * Показать сообщение об ошибке пользователю
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #f56565; color: white; padding: 15px 25px;
        border-radius: 8px; font-weight: bold; z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 10000);
}

/**
 * Обработка горячих клавиш
 */
function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) return;
        
        const simulator = window.quantumSimulator;
        if (!simulator) return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                simulator.machine.isRunning ? simulator.machine.stop() : simulator.machine.start();
                break;
            case 'KeyS':
                e.preventDefault();
                simulator.machine.step();
                break;
            case 'KeyR':
                e.preventDefault();
                simulator.machine.reset();
                break;
            case 'KeyT':
                e.preventDefault();
                simulator.ui.toggleTheme();
                break;
            case 'KeyH':
                e.preventDefault();
                simulator.ui.showHelp();
                break;
        }
    });
}

/**
 * Обработчик загрузки DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupHotkeys();
});

/**
 * Обработчик ошибок
 */
window.addEventListener('error', (event) => {
    console.error('🔥 Глобальная ошибка:', event.error);
    showErrorMessage('Произошла ошибка. Проверьте консоль разработчика.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🔥 Необработанное отклонение промиса:', event.reason);
    showErrorMessage('Ошибка асинхронной операции. Проверьте консоль.');
});
