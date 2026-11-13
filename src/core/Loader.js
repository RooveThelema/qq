/**
 * Loader - Поэтапный загрузчик модулей игры.
 */
export class Loader {
  constructor(engine) {
    this.engine = engine;
    this.stages = [];

    this.overlay = document.getElementById('loader-overlay');
    this.stageTitle = document.getElementById('loading-stage');
    this.stageDetails = document.getElementById('loading-details');
    this.progressBar = document.getElementById('loading-bar');
    this.percentLabel = document.getElementById('loading-percent');
    this.consoleLog = document.getElementById('loading-log');
  }

  addStage(title, details, taskFn) {
    this.stages.push({ title, details, taskFn });
  }

  logMessage(msg) {
    if (!this.consoleLog) return;
    const line = document.createElement('div');
    const time = new Date().toTimeString().split(' ')[0];
    line.textContent = `[${time}] ${msg}`;
    this.consoleLog.appendChild(line);
    this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
  }

  updateUI(percent, title, details) {
    if (this.progressBar) this.progressBar.style.width = `${percent}%`;
    if (this.percentLabel) this.percentLabel.textContent = `${Math.round(percent)}%`;
    if (this.stageTitle) this.stageTitle.textContent = title;
    if (this.stageDetails) this.stageDetails.textContent = details;
  }

  async run() {
    const total = this.stages.length;
    this.logMessage('Запуск Call of Duty: Zombies 2D...');

    for (let i = 0; i < total; i++) {
      const stage = this.stages[i];
      const startPercent = (i / total) * 100;
      const targetPercent = ((i + 1) / total) * 100;

      this.updateUI(startPercent, stage.title, stage.details);
      this.logMessage(`[${i + 1}/${total}] ${stage.title}`);

      try {
        await stage.taskFn(this.engine);
        await new Promise((r) => setTimeout(r, 40));
      } catch (err) {
        this.logMessage(`ОШИБКА: ${stage.title}: ${err.message}`);
        console.error(err);
      }

      this.updateUI(targetPercent, stage.title, 'Готово');
    }

    this.logMessage('Все системы готовы к бою.');
    this.updateUI(100, 'Готово к бою', 'Добро пожаловать в бункер...');

    await new Promise((r) => setTimeout(r, 180));

    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }

    this.engine.start();
  }
}
