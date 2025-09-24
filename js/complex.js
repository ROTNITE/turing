// path: js/complex.js
/**
 * Класс для представления комплексных чисел в квантовых вычислениях
 * Реализует полную арифметику комплексных чисел с методами для квантовой механики
 * 
 * @author Quantum Computing Expert
 * @version 2.0.0
 */

export class Complex {
    /**
     * Создает комплексное число z = re + i*im
     * @param {number} re - Вещественная часть
     * @param {number} im - Мнимая часть
     */
    constructor(re = 0, im = 0) {
        /** @type {number} Вещественная часть */
        this.re = Number(re);
        /** @type {number} Мнимая часть */
        this.im = Number(im);
    }

    /**
     * Сложение комплексных чисел
     * z1 + z2 = (a+bi) + (c+di) = (a+c) + (b+d)i
     * @param {Complex} other - Второе комплексное число
     * @returns {Complex} Сумма комплексных чисел
     */
    add(other) {
        return new Complex(
            this.re + other.re,
            this.im + other.im
        );
    }

    /**
     * Вычитание комплексных чисел
     * z1 - z2 = (a+bi) - (c+di) = (a-c) + (b-d)i
     * @param {Complex} other - Вычитаемое комплексное число
     * @returns {Complex} Разность комплексных чисел
     */
    sub(other) {
        return new Complex(
            this.re - other.re,
            this.im - other.im
        );
    }

    /**
     * Умножение комплексных чисел
     * z1 * z2 = (a+bi)(c+di) = (ac-bd) + (ad+bc)i
     * @param {Complex} other - Второй множитель
     * @returns {Complex} Произведение комплексных чисел
     */
    mul(other) {
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }

    /**
     * Деление комплексных чисел
     * z1 / z2 = z1 * conj(z2) / |z2|²
     * @param {Complex} other - Делитель
     * @returns {Complex} Частное комплексных чисел
     * @throws {Error} При делении на ноль
     */
    div(other) {
        const denominator = other.re * other.re + other.im * other.im;
        
        if (Math.abs(denominator) < 1e-15) {
            throw new Error('Деление на ноль в комплексных числах');
        }

        return new Complex(
            (this.re * other.re + this.im * other.im) / denominator,
            (this.im * other.re - this.re * other.im) / denominator
        );
    }

    /**
     * Комплексное сопряжение
     * conj(a + bi) = a - bi
     * @returns {Complex} Комплексно-сопряженное число
     */
    conj() {
        return new Complex(this.re, -this.im);
    }

    /**
     * Модуль (абсолютное значение) комплексного числа
     * |z| = √(re² + im²)
     * @returns {number} Модуль комплексного числа
     */
    abs() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    /**
     * Аргумент (фаза) комплексного числа
     * arg(z) = arctan(im/re) с учетом квадранта
     * @returns {number} Аргумент в радианах [-π, π]
     */
    arg() {
        return Math.atan2(this.im, this.re);
    }

    /**
     * Возведение в степень
     * z^n = |z|^n * exp(i * n * arg(z))
     * @param {number} n - Степень
     * @returns {Complex} Результат возведения в степень
     */
    pow(n) {
        const r = Math.pow(this.abs(), n);
        const theta = n * this.arg();
        return Complex.exp(theta).mul(new Complex(r, 0));
    }

    /**
     * Проверка равенства с заданной точностью
     * @param {Complex} other - Сравниваемое число
     * @param {number} eps - Точность сравнения
     * @returns {boolean} true если числа равны с точностью eps
     */
    equals(other, eps = 1e-10) {
        return Math.abs(this.re - other.re) < eps && 
               Math.abs(this.im - other.im) < eps;
    }

    /**
     * Создание копии комплексного числа
     * @returns {Complex} Копия числа
     */
    clone() {
        return new Complex(this.re, this.im);
    }

    /**
     * Проверка, является ли число чисто вещественным
     * @param {number} eps - Точность проверки
     * @returns {boolean} true если мнимая часть близка к нулю
     */
    isReal(eps = 1e-10) {
        return Math.abs(this.im) < eps;
    }

    /**
     * Проверка, является ли число чисто мнимым
     * @param {number} eps - Точность проверки
     * @returns {boolean} true если вещественная часть близка к нулю
     */
    isImaginary(eps = 1e-10) {
        return Math.abs(this.re) < eps;
    }

    /**
     * Строковое представление комплексного числа
     * @param {number} precision - Количество знаков после запятой
     * @returns {string} Строковое представление
     */
    toString(precision = 3) {
        const re = this.re.toFixed(precision);
        const im = this.im.toFixed(precision);
        
        if (Math.abs(this.im) < Math.pow(10, -precision)) {
            return re;
        }
        
        if (Math.abs(this.re) < Math.pow(10, -precision)) {
            return this.im >= 0 ? `${im}i` : `${im}i`;
        }
        
        return this.im >= 0 ? `${re}+${im}i` : `${re}${im}i`;
    }

    /**
     * Создание комплексного числа из экспоненциальной формы
     * exp(iθ) = cos(θ) + i*sin(θ)
     * @param {number} angle - Угол в радианах
     * @returns {Complex} Комплексное число на единичной окружности
     */
    static exp(angle) {
        return new Complex(Math.cos(angle), Math.sin(angle));
    }

    /**
     * Создание комплексного числа из полярных координат
     * @param {number} r - Радиус (модуль)
     * @param {number} theta - Угол в радианах
     * @returns {Complex} Комплексное число в полярной форме
     */
    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    /**
     * Константы для часто используемых комплексных чисел
     */
    static get ZERO() { return new Complex(0, 0); }
    static get ONE() { return new Complex(1, 0); }
    static get I() { return new Complex(0, 1); }
    static get MINUS_I() { return new Complex(0, -1); }

    /**
     * Создание комплексного числа из вещественного
     * @param {number} real - Вещественное число
     * @returns {Complex} Комплексное число с нулевой мнимой частью
     */
    static real(real) {
        return new Complex(real, 0);
    }

    /**
     * Создание чисто мнимого числа
     * @param {number} imaginary - Мнимая часть
     * @returns {Complex} Чисто мнимое число
     */
    static imaginary(imaginary) {
        return new Complex(0, imaginary);
    }
}

/**
 * Утилиты для работы с комплексными числами в квантовой механике
 */
export class ComplexUtils {
    /**
     * Проверка нормировки комплексного вектора
     * Σ|cᵢ|² = 1
     * @param {Complex[]} amplitudes - Массив комплексных амплитуд
     * @returns {boolean} true если вектор нормирован
     */
    static isNormalized(amplitudes, eps = 1e-10) {
        const sum = amplitudes.reduce((acc, amp) => acc + amp.abs() * amp.abs(), 0);
        return Math.abs(sum - 1) < eps;
    }

    /**
     * Нормировка комплексного вектора
     * @param {Complex[]} amplitudes - Массив комплексных амплитуд
     * @returns {Complex[]} Нормированный вектор
     */
    static normalize(amplitudes) {
        const norm = Math.sqrt(
            amplitudes.reduce((acc, amp) => acc + amp.abs() * amp.abs(), 0)
        );
        
        if (norm < 1e-15) {
            throw new Error('Невозможно нормировать нулевой вектор');
        }
        
        return amplitudes.map(amp => new Complex(amp.re / norm, amp.im / norm));
    }

    /**
     * Вычисление скалярного произведения комплексных векторов
     * ⟨ψ₁|ψ₂⟩ = Σᵢ conj(ψ₁ᵢ) * ψ₂ᵢ
     * @param {Complex[]} vec1 - Первый вектор
     * @param {Complex[]} vec2 - Второй вектор
     * @returns {Complex} Скалярное произведение
     */
    static dot(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Векторы должны иметь одинаковую размерность');
        }
        
        let result = Complex.ZERO;
        for (let i = 0; i < vec1.length; i++) {
            result = result.add(vec1[i].conj().mul(vec2[i]));
        }
        return result;
    }

    /**
     * Тензорное произведение комплексных векторов
     * |ψ₁⟩ ⊗ |ψ₂⟩
     * @param {Complex[]} vec1 - Первый вектор
     * @param {Complex[]} vec2 - Второй вектор
     * @returns {Complex[]} Тензорное произведение
     */
    static tensorProduct(vec1, vec2) {
        const result = [];
        for (let i = 0; i < vec1.length; i++) {
            for (let j = 0; j < vec2.length; j++) {
                result.push(vec1[i].mul(vec2[j]));
            }
        }
        return result;
    }
}