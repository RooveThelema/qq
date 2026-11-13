/**
 * MapModule - Бункер Nacht der Untoten: стены, коллизии, открываемые завалы,
 * настенное оружие, точки спавна зомби, терминалы Лудки/Сапёра и сеточная BFS-навигация.
 */
import { EVENTS } from '../../core/Constants.js';

export class MapModule {
  constructor() {
    this.name = 'map';
    this.engine = null;

    this.width = 2800;
    this.height = 2000;
    this.minX = -1400;
    this.minY = -1000;

    // Параметры навигационной сетки для BFS flow-field
    this.cellSize = 20;
    this.gridCols = Math.floor(this.width / this.cellSize);  // 140
    this.gridRows = Math.floor(this.height / this.cellSize); // 100
    this.walkableGrid = new Uint8Array(this.gridCols * this.gridRows);
    this.distGrid = new Int16Array(this.gridCols * this.gridRows);
    this.distGrid.fill(-1);
    this.lastFlowTargetCell = -1;
    this.flowDirty = true;

    this.baseWalls = [
      // Внешние стены по периметру (2800x2000)
      { x: -1400, y: -1000, w: 2800, h: 40 },
      { x: -1400, y: 960, w: 2800, h: 40 },
      { x: -1400, y: -1000, w: 40, h: 2000 },
      { x: 1360, y: -1000, w: 40, h: 2000 },

      // Верхняя перегородка: вход в Северный Реактор / Био-Лабораторию (y = -480)
      { x: -1360, y: -480, w: 500, h: 30 },
      { x: -720, y: -480, w: 780, h: 30 },
      { x: 200, y: -480, w: 700, h: 30 },
      { x: 1040, y: -480, w: 320, h: 30 },

      // Нижняя перегородка: вход в Южный Казино-Сейф / Зал Лудки (y = 450)
      { x: -1360, y: 450, w: 500, h: 30 },
      { x: -720, y: 450, w: 780, h: 30 },
      { x: 200, y: 450, w: 700, h: 30 },
      { x: 1040, y: 450, w: 320, h: 30 },

      // Перегородка: Стартовый Бункер <-> Центральный Арсенал (x = -240)
      { x: -240, y: -450, w: 30, h: 360 },
      { x: -240, y: 90, w: 30, h: 360 },

      // Перегородка: Центральный Арсенал <-> Восточный Ангар (x = 560)
      { x: 560, y: -450, w: 30, h: 360 },
      { x: 560, y: 90, w: 30, h: 360 },

      // Перемычка внутри Северной Лаборатории
      { x: -10, y: -960, w: 30, h: 280 },
      // Перемычка внутри Южного Зала Лудки
      { x: -10, y: 680, w: 30, h: 280 },

      // Колонны Стартового Бункера
      { x: -1020, y: -250, w: 90, h: 90 },
      { x: -1020, y: 160, w: 90, h: 90 },
      { x: -580, y: -45, w: 90, h: 90 },

      // Колонны Центрального Арсенала
      { x: 20, y: -240, w: 85, h: 85 },
      { x: 280, y: 155, w: 85, h: 85 },

      // Грузовые блоки Восточного Ангара
      { x: 840, y: -260, w: 140, h: 80 },
      { x: 840, y: 180, w: 140, h: 80 },
      { x: 1100, y: -45, w: 90, h: 90 },

      // Реакторные ядра Северного крыла
      { x: -820, y: -790, w: 100, h: 100 },
      { x: -320, y: -790, w: 100, h: 100 },
      { x: 380, y: -790, w: 100, h: 100 },
      { x: 960, y: -790, w: 100, h: 100 },

      // Колонны Сейфа в Южном крыле
      { x: -820, y: 660, w: 100, h: 100 },
      { x: -320, y: 660, w: 100, h: 100 },
      { x: 380, y: 660, w: 100, h: 100 },
      { x: 960, y: 660, w: 100, h: 100 }
    ];

    this.doors = [
      {
        id: 'door_arsenal',
        name: 'Проход в Арсенал',
        cost: 750,
        x: -240,
        y: -90,
        w: 30,
        h: 180,
        isOpen: false
      },
      {
        id: 'door_north_spawn',
        name: 'Северный Реактор',
        cost: 750,
        x: -860,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_spawn',
        name: 'Зал Лудки 777',
        cost: 750,
        x: -860,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_east_hangar',
        name: 'Восточный Ангар',
        cost: 1000,
        x: 560,
        y: -90,
        w: 30,
        h: 180,
        isOpen: false
      },
      {
        id: 'door_north_arsenal',
        name: 'Шлюз Лаборатории',
        cost: 900,
        x: 60,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_casino',
        name: 'Южный Шлюз Сейфа',
        cost: 900,
        x: 60,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_north_hangar',
        name: 'Спуск в Ангар (Сев.)',
        cost: 1000,
        x: 900,
        y: -480,
        w: 140,
        h: 30,
        isOpen: false
      },
      {
        id: 'door_south_hangar',
        name: 'Спуск в Ангар (Юж.)',
        cost: 1000,
        x: 900,
        y: 450,
        w: 140,
        h: 30,
        isOpen: false
      }
    ];

    // 20 окон и проломов спавна зомби по всему периметру большого бункера
    this.spawnPoints = [
      // Стартовый бункер (доступны с 1-го раунда!)
      { x: -1335, y: -330, wallSide: 'left', zone: 'spawn', name: 'Западное окно #1' },
      { x: -1335, y: -110, wallSide: 'left', zone: 'spawn', name: 'Западное окно #2' },
      { x: -1335, y: 110, wallSide: 'left', zone: 'spawn', name: 'Западное окно #3' },
      { x: -1335, y: 330, wallSide: 'left', zone: 'spawn', name: 'Западное окно #4' },

      // Северный Реактор / Лаборатория
      { x: -1335, y: -720, wallSide: 'left', zone: 'north_lab', name: 'СЗ угол лаборатории' },
      { x: -1080, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #1' },
      { x: -560, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #2' },
      { x: 180, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #3' },
      { x: 700, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #4' },
      { x: 1160, y: -935, wallSide: 'top', zone: 'north_lab', name: 'Северный пролом #5' },

      // Южный Зал Лудки
      { x: -1335, y: 720, wallSide: 'left', zone: 'south_casino', name: 'ЮЗ угол зала лудки' },
      { x: -1080, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #1' },
      { x: -560, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #2' },
      { x: 180, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #3' },
      { x: 700, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #4' },
      { x: 1160, y: 935, wallSide: 'bottom', zone: 'south_casino', name: 'Южный пролом #5' },

      // Восточный Ангар
      { x: 1335, y: -720, wallSide: 'right', zone: 'hangar', name: 'СВ шлюз' },
      { x: 1335, y: -220, wallSide: 'right', zone: 'hangar', name: 'Восточные ворота (Сев.)' },
      { x: 1335, y: 220, wallSide: 'right', zone: 'hangar', name: 'Восточные ворота (Юж.)' },
      { x: 1335, y: 720, wallSide: 'right', zone: 'hangar', name: 'ЮВ шлюз' }
    ];

    // Точки Mystery Box по разным крыльям
    this.boxSpawnLocations = [
      { x: 130, y: -400, w: 90, h: 45, name: 'Центральный Арсенал' },
      { x: 1140, y: -380, w: 90, h: 45, name: 'Восточный Ангар' },
      { x: -560, y: -910, w: 90, h: 45, name: 'Северный Реактор' },
      { x: 560, y: 860, w: 90, h: 45, name: 'Южный Казино-Сейф' },
      { x: -1200, y: -410, w: 90, h: 45, name: 'Уголок стартового бункера' }
    ];
    this.mysteryBoxPos = { ...this.boxSpawnLocations[0] };

    // Терминалы Лудки 777 в каждом крупном крыле
    this.ludkaTerminals = [
      { id: 'terminal_spawn', name: 'ТЕРМИНАЛ ЛУДКИ', x: -560, y: -420, w: 68, h: 36 },
      { id: 'terminal_arsenal', name: 'ТЕРМИНАЛ ЛУДКИ', x: 160, y: 380, w: 68, h: 36 },
      { id: 'terminal_north', name: 'ТЕРМИНАЛ ЛУДКИ', x: 640, y: -920, w: 68, h: 36 },
      { id: 'terminal_casino', name: 'ТЕРМИНАЛ ЛУДКИ', x: -520, y: 880, w: 68, h: 36 }
    ];
    this.memeTerminals = this.ludkaTerminals;

    // Терминалы Сапёра (Минное поле)
    this.saperTerminals = [
      { id: 'saper_spawn', name: 'ТЕРМИНАЛ САПЁРА', x: -560, y: 380, w: 68, h: 36 },
      { id: 'saper_arsenal', name: 'ТЕРМИНАЛ САПЁРА', x: -120, y: -420, w: 68, h: 36 },
      { id: 'saper_casino', name: 'ТЕРМИНАЛ САПЁРА', x: 160, y: 880, w: 68, h: 36 }
    ];

    // Настенное оружие (Wall Buys)
    this.wallBuys = [
      {
        weaponId: 'olympia',
        name: 'Olympia (Дробовик)',
        cost: 500,
        ammoCost: 250,
        x: -1345,
        y: -220,
        w: 15,
        h: 70
      },
      {
        weaponId: 'm14',
        name: 'M14 (Винтовка)',
        cost: 500,
        ammoCost: 250,
        x: -1345,
        y: 220,
        w: 15,
        h: 70
      },
      {
        weaponId: 'mp40',
        name: 'MP40 (Автомат)',
        cost: 1000,
        ammoCost: 500,
        x: 340,
        y: -435,
        w: 70,
        h: 15
      },
      {
        weaponId: 'ak47',
        name: 'АК-47 «Калаш»',
        cost: 1600,
        ammoCost: 800,
        x: 1345,
        y: 0,
        w: 15,
        h: 70
      }
    ];

    this.ambientDecals = [
      { x: -920, y: -180, r: 46, color: 'rgba(70, 10, 10, 0.4)' },
      { x: -720, y: 140, r: 62, color: 'rgba(55, 8, 8, 0.45)' },
      { x: 150, y: -110, r: 54, color: 'rgba(65, 12, 12, 0.35)' },
      { x: 950, y: -80, r: 50, color: 'rgba(50, 5, 5, 0.38)' },
      { x: -450, y: -700, r: 45, color: 'rgba(20, 90, 40, 0.25)' },
      { x: 250, y: 740, r: 55, color: 'rgba(60, 10, 10, 0.38)' }
    ];

    this.rebuildWalls();
  }

  init(engine) {
    this.engine = engine;
    this.rebuildWalls();

    engine.bus.on(EVENTS.GAME_RESTART, () => {
      this.reset();
    });
  }

  reset() {
    for (const door of this.doors) {
      door.isOpen = false;
    }
    this.mysteryBoxPos = { ...this.boxSpawnLocations[0] };
    this.rebuildWalls();
  }

  rebuildWalls() {
    this.walls = [...this.baseWalls];
    for (const door of this.doors) {
      if (!door.isOpen) {
        this.walls.push({ x: door.x, y: door.y, w: door.w, h: door.h });
      }
    }
    this.buildCollisionGrid();
  }

  buildCollisionGrid() {
    const cs = this.cellSize;
    const cols = this.gridCols;
    const rows = this.gridRows;

    for (let r = 0; r < rows; r++) {
      const cy = this.minY + r * cs + cs * 0.5;
      for (let c = 0; c < cols; c++) {
        const cx = this.minX + c * cs + cs * 0.5;
        this.walkableGrid[r * cols + c] = this.checkCollision(cx, cy, 14) ? 0 : 1;
      }
    }

    this.flowDirty = true;
    this.lastFlowTargetCell = -1;
  }

  worldToCell(x, y) {
    const col = Math.max(0, Math.min(this.gridCols - 1, Math.floor((x - this.minX) / this.cellSize)));
    const row = Math.max(0, Math.min(this.gridRows - 1, Math.floor((y - this.minY) / this.cellSize)));
    return { col, row, idx: row * this.gridCols + col };
  }

  /**
   * Построение BFS flow-field от позиции игрока. Гарантирует обход колонн, стен и поиск открытых дверей.
   */
  ensureFlowField(targetX, targetY) {
    const targetCell = this.worldToCell(targetX, targetY);
    if (!this.flowDirty && targetCell.idx === this.lastFlowTargetCell) {
      return;
    }

    this.flowDirty = false;
    this.lastFlowTargetCell = targetCell.idx;
    this.distGrid.fill(-1);

    // Если игрок чуть задел непроходимую ячейку края, ищем ближайшую проходимую
    let startIdx = targetCell.idx;
    if (!this.walkableGrid[startIdx]) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
      for (const [dc, dr] of dirs) {
        const nc = targetCell.col + dc;
        const nr = targetCell.row + dr;
        if (nc >= 0 && nc < this.gridCols && nr >= 0 && nr < this.gridRows) {
          const nIdx = nr * this.gridCols + nc;
          if (this.walkableGrid[nIdx]) {
            startIdx = nIdx;
            break;
          }
        }
      }
    }

    if (!this.walkableGrid[startIdx]) return;

    const queue = new Int32Array(this.gridCols * this.gridRows);
    let head = 0;
    let tail = 0;

    this.distGrid[startIdx] = 0;
    queue[tail++] = startIdx;

    const cols = this.gridCols;
    const rows = this.gridRows;

    while (head < tail) {
      const cur = queue[head++];
      const curDist = this.distGrid[cur];
      const r = Math.floor(cur / cols);
      const c = cur % cols;

      // 4-связные соседи для точных расстояний без прорезания углов стен
      if (c > 0) {
        const ni = cur - 1;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (c + 1 < cols) {
        const ni = cur + 1;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (r > 0) {
        const ni = cur - cols;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
      if (r + 1 < rows) {
        const ni = cur + cols;
        if (this.walkableGrid[ni] && this.distGrid[ni] === -1) {
          this.distGrid[ni] = curDist + 1;
          queue[tail++] = ni;
        }
      }
    }
  }

  /**
   * Проверяет, достижима ли точка (x, y) от текущей цели (игрока) через открытые проходы.
   */
  isReachable(x, y, targetX, targetY) {
    this.ensureFlowField(targetX, targetY);
    const cell = this.worldToCell(x, y);
    if (this.distGrid[cell.idx] >= 0) return true;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = cell.col + dc;
        const nr = cell.row + dr;
        if (nc >= 0 && nc < this.gridCols && nr >= 0 && nr < this.gridRows) {
          if (this.distGrid[nr * this.gridCols + nc] >= 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Проверка прямой видимости между двумя точками без стен на пути.
   */
  hasLineOfSight(x1, y1, x2, y2, radius = 14) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;

    const step = 16;
    const steps = Math.ceil(dist / step);
    const sx = dx / steps;
    const sy = dy / steps;

    for (let i = 1; i < steps; i++) {
      if (this.checkCollision(x1 + sx * i, y1 + sy * i, radius)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Возвращает нормализованный вектор движения к игроку с обходом стен и колонн.
   */
  getFlowDirection(x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return { x: 0, y: 0 };

    if (this.hasLineOfSight(x, y, targetX, targetY, 14)) {
      return { x: dx / dist, y: dy / dist };
    }

    this.ensureFlowField(targetX, targetY);
    const cell = this.worldToCell(x, y);
    const cols = this.gridCols;
    const rows = this.gridRows;

    let bestDist = Infinity;
    let bestCol = cell.col;
    let bestRow = cell.row;

    // Если текущая ячейка невалидна, ищем ближайшую достижимую
    const curD = this.distGrid[cell.idx];
    if (curD >= 0) {
      bestDist = curD;
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dc === 0 && dr === 0) continue;
        const nc = cell.col + dc;
        const nr = cell.row + dr;
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;

        const nIdx = nr * cols + nc;
        const nDist = this.distGrid[nIdx];
        if (nDist < 0) continue;

        // Запрещаем срезать угол по диагонали через стену
        if (dc !== 0 && dr !== 0) {
          const adj1 = this.walkableGrid[cell.row * cols + nc];
          const adj2 = this.walkableGrid[nr * cols + cell.col];
          if (!adj1 || !adj2) continue;
        }

        if (nDist < bestDist) {
          bestDist = nDist;
          bestCol = nc;
          bestRow = nr;
        }
      }
    }

    if (bestCol === cell.col && bestRow === cell.row) {
      return { x: dx / dist, y: dy / dist };
    }

    const wx = this.minX + bestCol * this.cellSize + this.cellSize * 0.5;
    const wy = this.minY + bestRow * this.cellSize + this.cellSize * 0.5;
    const vx = wx - x;
    const vy = wy - y;
    const vLen = Math.hypot(vx, vy) || 1;
    return { x: vx / vLen, y: vy / vLen };
  }

  openDoor(doorId) {
    const door = this.doors.find(d => d.id === doorId);
    if (!door || door.isOpen) return false;

    door.isOpen = true;
    const multiplayer = this.engine?.getModule('multiplayer');
    if (multiplayer?.room && !multiplayer.isHost) multiplayer.send({type:'door', id:doorId});
    this.rebuildWalls();

    const bus = this.engine?.bus;
    if (bus) {
      bus.emit(EVENTS.FX_BLOOD, { x: door.x + door.w / 2, y: door.y + door.h / 2, count: 2 });
      bus.emit('hud:prompt', null);
    }
    const visuals = this.engine?.getModule('visuals');
    if (visuals) {
      visuals.addFloatingText(`${door.name.toUpperCase()} ОТКРЫТО!`, door.x, door.y + door.h / 2, '#66ff66', 1.4);
      visuals.addScreenShake(6.0, 0.3);
      visuals.playSfx('boxReady');
    }

    return true;
  }

  /**
   * Проверка столкновения круглой сущности со стенами и завалами
   */
  checkCollision(x, y, radius) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));

      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) {
        return true;
      }
    }
    return false;
  }

  render(ctx) {
    ctx.save();

    // 1. Пол бункера (бетонные плиты)
    ctx.fillStyle = '#14171a';
    ctx.fillRect(this.minX, this.minY, this.width, this.height);

    ctx.strokeStyle = '#1d2126';
    ctx.lineWidth = 2;
    const tileSize = 80;
    const maxX = this.minX + this.width;
    const maxY = this.minY + this.height;
    ctx.beginPath();
    for (let x = this.minX; x <= maxX; x += tileSize) {
      ctx.moveTo(x, this.minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = this.minY; y <= maxY; y += tileSize) {
      ctx.moveTo(this.minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();

    // Разметка зон на полу
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.font = '900 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPAWN BUNKER', -800, 15);
    ctx.fillText('ARSENAL & BOX', 160, 15);
    ctx.fillText('EAST HANGAR', 960, 15);
    ctx.fillText('NORTH REACTOR', 0, -720);
    ctx.fillText('CASINO VAULT 777', 0, 740);

    // 2. Засохшие пятна крови на полу
    for (const d of this.ambientDecals) {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Меловые контуры настенного оружия (Wall Buys)
    for (const wb of this.wallBuys) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(wb.x - wb.w / 2, wb.y - wb.h / 2, wb.w, wb.h);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 235, 150, 0.85)';
      ctx.font = 'bold 11px monospace';
      if (wb.w > wb.h) {
        ctx.textAlign = 'center';
        ctx.fillText(`${wb.name.split(' ')[0]} [${wb.cost}]`, wb.x, wb.y + (wb.y < 0 ? 24 : -18));
      } else {
        ctx.textAlign = wb.x < 0 ? 'left' : 'right';
        ctx.fillText(`${wb.name.split(' ')[0]} [${wb.cost}]`, wb.x < 0 ? wb.x + 18 : wb.x - 18, wb.y + 4);
      }
    }

    // 4. Стены и колонны
    for (const wall of this.baseWalls) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(wall.x + 8, wall.y + 8, wall.w, wall.h);

      ctx.fillStyle = '#2c3138';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

      ctx.fillStyle = '#424954';
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
      ctx.fillRect(wall.x, wall.y, 4, wall.h);

      ctx.strokeStyle = '#181b1f';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    }

    // 5. Двери / завалы
    for (const door of this.doors) {
      const horiz = door.w > door.h;
      if (door.isOpen) {
        ctx.fillStyle = 'rgba(40, 30, 20, 0.4)';
        ctx.fillRect(door.x - (horiz ? 0 : 10), door.y - (horiz ? 10 : 0), door.w + (horiz ? 0 : 20), door.h + (horiz ? 20 : 0));
        ctx.strokeStyle = 'rgba(100, 80, 50, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(door.x - (horiz ? 0 : 10), door.y - (horiz ? 10 : 0), door.w + (horiz ? 0 : 20), door.h + (horiz ? 20 : 0));
      } else {
        ctx.fillStyle = '#4a3319';
        ctx.fillRect(door.x, door.y, door.w, door.h);

        ctx.strokeStyle = '#2b1d0c';
        ctx.lineWidth = 3;
        if (horiz) {
          for (let dx = 0; dx < door.w; dx += 24) {
            ctx.strokeRect(door.x + dx + 2, door.y + 2, 20, door.h - 4);
          }
        } else {
          for (let dy = 0; dy < door.h; dy += 24) {
            ctx.strokeRect(door.x + 2, door.y + dy + 2, door.w - 4, 20);
          }
        }

        ctx.strokeStyle = '#e6b800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(door.x, door.y);
        ctx.lineTo(door.x + door.w, door.y + door.h);
        ctx.moveTo(door.x, door.y + door.h);
        ctx.lineTo(door.x + door.w, door.y);
        ctx.stroke();

        const cx = door.x + door.w / 2;
        const cy = door.y + door.h / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(cx - 50, cy - 12, 100, 24);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 50, cy - 12, 100, 24);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[F] ${door.cost}`, cx, cy + 5);
      }
    }

    // 6. Окна спавна на стенах периметра
    for (const sp of this.spawnPoints) {
      let wx = sp.x;
      let wy = sp.y;
      let ww = 44;
      let wh = 24;

      if (sp.wallSide === 'left') {
        wx = this.minX + 22;
        wy = sp.y - 26;
        ww = 26;
        wh = 52;
      } else if (sp.wallSide === 'right') {
        wx = this.minX + this.width - 48;
        wy = sp.y - 26;
        ww = 26;
        wh = 52;
      } else if (sp.wallSide === 'top') {
        wx = sp.x - 26;
        wy = this.minY + 22;
        ww = 52;
        wh = 26;
      } else if (sp.wallSide === 'bottom') {
        wx = sp.x - 26;
        wy = this.minY + this.height - 48;
        ww = 52;
        wh = 26;
      }

      // Темный проем в стене
      ctx.fillStyle = '#060708';
      ctx.fillRect(wx, wy, ww, wh);
      ctx.strokeStyle = '#5a3a1e';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, ww, wh);

      // Доски баррикады
      ctx.strokeStyle = '#734a26';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(wx + 2, wy + 4);
      ctx.lineTo(wx + ww - 2, wy + wh - 4);
      ctx.moveTo(wx + 2, wy + wh - 4);
      ctx.lineTo(wx + ww - 2, wy + 4);
      ctx.stroke();

      // Красное свечение пролома
      ctx.fillStyle = 'rgba(255, 30, 30, 0.22)';
      ctx.beginPath();
      ctx.arc(wx + ww / 2, wy + wh / 2, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Терминалы Лудки и Сапёра
    const pulse = 0.65 + Math.sin(performance.now() * 0.005) * 0.35;
    for (const term of this.ludkaTerminals) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(term.x + 4, term.y + 4, term.w, term.h);

      ctx.fillStyle = '#14161a';
      ctx.strokeStyle = `rgba(200, 155, 60, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.fillRect(term.x, term.y, term.w, term.h);
      ctx.strokeRect(term.x, term.y, term.w, term.h);

      ctx.fillStyle = `rgba(140, 29, 29, ${0.22 + pulse * 0.16})`;
      ctx.fillRect(term.x + 6, term.y + 6, term.w - 12, term.h - 12);

      ctx.fillStyle = '#e0b858';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ЛУДКА', term.x + term.w / 2, term.y + 22);
    }

    for (const term of this.saperTerminals) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(term.x + 4, term.y + 4, term.w, term.h);

      ctx.fillStyle = '#111914';
      ctx.strokeStyle = `rgba(94, 168, 100, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.fillRect(term.x, term.y, term.w, term.h);
      ctx.strokeRect(term.x, term.y, term.w, term.h);

      ctx.fillStyle = `rgba(42, 110, 56, ${0.22 + pulse * 0.16})`;
      ctx.fillRect(term.x + 6, term.y + 6, term.w - 12, term.h - 12);

      ctx.fillStyle = '#9fe0a6';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('САПЁР', term.x + term.w / 2, term.y + 22);
    }

    // 8. Подсветка зоны Mystery Box
    const box = this.mysteryBoxPos;
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(box.x - 15, box.y - 15, box.w + 30, box.h + 30);
    ctx.setLineDash([]);

    ctx.restore();
  }
}
