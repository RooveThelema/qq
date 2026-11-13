/**
 * EventBus - Центральная шина событий игры.
 * Позволяет модулям общаться полностью асинхронно и независимо друг от друга.
 */
export class EventBus {
  constructor(debug = false) {
    this.listeners = new Map();
    this.debug = debug;
  }

  /**
   * Подписаться на событие
   * @param {string} event Название события (из Constants.EVENTS)
   * @param {Function} callback Функция-обработчик
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Одноразовая подписка
   */
  once(event, callback) {
    const unbind = this.on(event, (data) => {
      unbind();
      callback(data);
    });
    return unbind;
  }

  /**
   * Отписаться от события
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).delete(callback);
  }

  /**
   * Отправить событие с данными всем подписчикам
   * @param {string} event Название события
   * @param {any} data Данные события
   */
  emit(event, data) {
    if (this.debug) {
      console.log(`[EventBus] ${event}`, data);
    }
    if (!this.listeners.has(event)) return;

    for (const callback of this.listeners.get(event)) {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus Error] Ошибка в обработчике события '${event}':`, err);
      }
    }
  }

  /**
   * Очистить всех подписчиков
   */
  clear() {
    this.listeners.clear();
  }
}
