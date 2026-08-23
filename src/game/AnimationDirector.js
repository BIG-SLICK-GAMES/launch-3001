import { formatNumber } from './utils.js';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export class AnimationDirector {
  static levelResults({ title, level, grade, points, elapsed, stars, nextLevel }) {
    const earned = Math.max(0, Number(stars?.newStarsEarned ?? stars?.finalStars ?? 0));
    const total = Math.max(0, Number(stars?.availableStars ?? 0));
    const finalStars = Math.max(0, Number(stars?.finalStars ?? earned));
    const starSlots = Array.from({ length: 3 }, (_, index) => (
      `<span class="${index < finalStars ? 'lit' : ''}" aria-hidden="true">*</span>`
    )).join('');
    const nextAction = nextLevel
      ? `<button data-action="next-level" data-level-id="${escapeHtml(nextLevel.id)}">Next Level</button>`
      : '';

    return `
      <section class="panel result-modal" aria-live="polite">
        <div class="result-modal__header">
          <span>MISSION REPORT</span>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <div class="result-stars">
          <b>+${formatNumber(earned, 0)}</b>
          <small>STARS EARNED</small>
          <div>${starSlots}</div>
        </div>
        <dl class="result-stats">
          <div><dt>Level</dt><dd>${escapeHtml(level?.name ?? 'Launch Route')}</dd></div>
          <div><dt>Grade</dt><dd>${escapeHtml(grade ?? 'Clear')}</dd></div>
          <div><dt>Score</dt><dd>+${formatNumber(points ?? 0, 0)}</dd></div>
          <div><dt>Time</dt><dd>${formatNumber(elapsed ?? 0, 1)}s</dd></div>
          <div><dt>Banked</dt><dd>${formatNumber(total, 0)} stars</dd></div>
        </dl>
        <div class="result-actions">
          ${nextAction}
          <button data-action="restart">Restart</button>
          <button data-action="level-select">Levels</button>
          <button data-action="menu">Lobby</button>
        </div>
      </section>`;
  }
}
