import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединение классов с помощью clsx и tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование секунд в строку формата HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const formatted = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Форматирование секунд в строку формата MM:SS
 */
export function formatTimeShort(seconds: number): string {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  
  const minutes = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;

  const formatted = [
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Преобразование минут в секунды
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Преобразование секунд в минуты
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Генерация случайного HEX цвета
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#06B6D4', // cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Генерация случайного градиента
 */
export function generateRandomGradient(): string {
  const color1 = generateRandomColor();
  const color2 = generateRandomColor();
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

export function hexToRgba(hex: string, alpha = 1): string {
  let normalized = hex.replace('#', '');

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function createCategoryGradient(categoryColor: string, intensity = 0.15): string {
  const primary = hexToRgba(categoryColor, intensity);
  const secondary = hexToRgba(categoryColor, Math.max(intensity / 4, 0.05));
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

/**
 * Создание градиента для выполненной задачи (цвет категории + зеленый)
 */
export function createCompletedGradient(categoryColor: string): string {
  return `linear-gradient(135deg, ${categoryColor} 0%, #10B981 100%)`;
}

/**
 * Создание градиента для задачи в BACKLOG (желтый + цвет категории)
 */
export function createBacklogGradient(categoryColor: string): string {
  return `linear-gradient(135deg, #F59E0B 0%, ${categoryColor} 100%)`;
}

/**
 * Создание градиента для задачи в IN_PROGRESS (синий + цвет категории)
 */
export function createInProgressGradient(categoryColor: string): string {
  return `linear-gradient(135deg, #3B82F6 0%, ${categoryColor} 100%)`;
}

/**
 * Форматирование даты в формат YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Получение даты начала дня
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Получение даты конца дня
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Проверка, является ли дата сегодняшней
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

/**
 * Проверка, является ли дата прошлой
 */
export function isPastDate(date: Date): boolean {
  const today = getStartOfDay();
  const checkDate = getStartOfDay(date);
  return checkDate < today;
}

/**
 * Получение массива последних N дней
 */
export function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(getStartOfDay(date));
  }
  return days;
}

/**
 * Расчет процента выполнения задач
 * Формула: выполненные / (выполненные + в процессе) * 100
 */
export function calculateCompletionPercentage(
  completed: number,
  inProgress: number
): number {
  const total = completed + inProgress;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Получение цвета на основе процента выполнения
 * ≥67% - зеленый, 34-66% - желтый, ≤33% - красный
 */
export function getPercentageColor(percentage: number): string {
  if (percentage >= 67) return '#10B981'; // green
  if (percentage >= 34) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

/**
 * Возвращает контрастный цвет текста (#ffffff или #111827) для заданного HEX-фона
 * Выбор делается по наибольшему контрасту по формуле WCAG.
 */
export function getContrastTextColor(hexBackground: string): '#ffffff' | '#111827' {
  const normalized = hexBackground.replace('#', '').length === 3
    ? hexBackground
        .replace('#', '')
        .split('')
        .map((c) => c + c)
        .join('')
    : hexBackground.replace('#', '');

  const int = parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  const srgbToLinear = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };

  const l = 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  const luminanceWhite = 1;
  const luminanceDark = 0.035; // приблизительная яркость #111827

  const contrastWithWhite = (luminanceWhite + 0.05) / (l + 0.05);
  const contrastWithDark = (l + 0.05) / (luminanceDark + 0.05);

  return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#111827';
}

/**
 * Расчет процента план/факт
 * Формула: (ожидаемое / фактическое) * 100
 */
export function calculatePlanFactPercentage(
  expectedTime: number,
  actualTime: number
): number | null {
  if (!expectedTime) return null;
  if (actualTime === 0) return 0;
  return Math.round((expectedTime / actualTime) * 100);
}

