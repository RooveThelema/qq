/**
 * ChalkRenderer - Процедурная отрисовка культовых меловых черточек (Tally Marks)
 * в стиле Call of Duty: Zombies (Nacht der Untoten / Kino der Toten).
 *
 * Логика отображения:
 * - Раунды 1-4: Вертикальные меловые штрихи (I, II, III, IIII)
 * - Раунд 5: 4 вертикальных штриха + диагональное перечеркивание (Bundled 5)
 * - Раунды 6-9: Связка из 5 + оставшиеся штрихи (1..4)
 * - Раунд 10: Две полные перечеркнутые связки (5 + 5)
 * - Раунд 11+: Кровавое число с подтеками + микро-черточки или римские цифры
 */

export class ChalkRenderer {
  /**
   * Отрисовка черточек раунда
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x Координата X
   * @param {number} y Координата Y (базовая линия)
   * @param {number} round Номер раунда
   * @param {number} scale Масштаб
   * @param {number} alpha Прозрачность
   * @param {string} color Цвет черточек (по умолчанию кроваво-красный)
   */
  static drawRoundTallies(ctx, x, y, round, scale = 1.0, alpha = 1.0, color = '#ff2b2b') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Свечение крови / раскаленного мела
    ctx.shadowColor = '#800000';
    ctx.shadowBlur = 10 * scale;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeHeight = 44 * scale;
    const strokeSpacing = 11 * scale;
    const bundleWidth = 4 * strokeSpacing;

    if (round <= 10) {
      const fullBundles = Math.floor(round / 5);
      const remainder = round % 5;
      let curX = x;

      // Рисуем полные связки по 5
      for (let b = 0; b < fullBundles; b++) {
        this.drawBundle(ctx, curX, y, strokeHeight, strokeSpacing, scale);
        curX += bundleWidth + 18 * scale;
      }

      // Рисуем оставшиеся одиночные штрихи (1..4)
      for (let i = 0; i < remainder; i++) {
        this.drawSingleStroke(ctx, curX + i * strokeSpacing, y, strokeHeight, scale, i);
      }
    } else {
      // Для раундов > 10: стилизованные крупные цифры с кровавыми подтеками
      ctx.font = `900 ${Math.round(52 * scale)}px "Courier New", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${round}`, x, y + 6 * scale);

      // Маленькие декоративные черточки под числом
      const miniRemainder = (round % 5) || 5;
      let subX = x;
      for (let i = 0; i < miniRemainder; i++) {
        this.drawSingleStroke(ctx, subX + i * 8 * scale, y + 18 * scale, 14 * scale, scale * 0.45, i);
      }
    }

    ctx.restore();
  }

  /**
   * Отрисовка одной вертикальной черточки мела с естественной кривизной и шероховатостью
   */
  static drawSingleStroke(ctx, x, y, height, scale, seed = 0) {
    const tilt = ((seed % 3) - 1) * 1.5 * scale;
    ctx.lineWidth = (3.6 + ((seed * 13) % 1.5)) * scale;

    ctx.beginPath();
    ctx.moveTo(x + tilt, y - height);
    // Легкий изгиб посередине для эффекта рисования от руки
    const midJitter = (((seed * 7) % 5) - 2) * 0.8 * scale;
    ctx.quadraticCurveTo(x + midJitter, y - height * 0.5, x - tilt * 0.5, y);
    ctx.stroke();

    // Небольшая меловая клякса / нажим в начале и конце
    ctx.beginPath();
    ctx.arc(x + tilt, y - height, ctx.lineWidth * 0.5, 0, Math.PI * 2);
    ctx.arc(x - tilt * 0.5, y, ctx.lineWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Отрисовка полной группы из 5 черточек (4 вертикальные + 1 диагональный слэш)
   */
  static drawBundle(ctx, x, y, height, spacing, scale) {
    // 4 вертикальных штриха
    for (let i = 0; i < 4; i++) {
      this.drawSingleStroke(ctx, x + i * spacing, y, height, scale, i);
    }

    // Диагональное перечеркивание слева-направо снизу-вверх (или сверху-слева вниз-вправо)
    ctx.lineWidth = 4.2 * scale;
    ctx.beginPath();
    const startX = x - 4 * scale;
    const startY = y - height * 0.15;
    const endX = x + 3 * spacing + 6 * scale;
    const endY = y - height * 0.88;

    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      (startX + endX) * 0.5,
      (startY + endY) * 0.5 - 2 * scale,
      endX,
      endY
    );
    ctx.stroke();
  }

  /**
   * Отрисовка брызг крови и капель под раундом
   */
  static drawBloodDrips(ctx, x, y, count = 3, scale = 1.0) {
    ctx.save();
    ctx.fillStyle = '#8b0000';
    ctx.strokeStyle = '#5c0000';
    for (let i = 0; i < count; i++) {
      const dropX = x + (i * 18 - 8) * scale;
      const dropY = y + (8 + (i * 7) % 12) * scale;
      const dropLen = (6 + (i * 11) % 14) * scale;

      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(dropX, y);
      ctx.lineTo(dropX, dropY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(dropX, dropY, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
