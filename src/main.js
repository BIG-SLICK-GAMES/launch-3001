import './styles/main.css';
import { Game } from './game/Game.js';

window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'BSG_PROFILE') return;
  window.__launch3001Profile = event.data.profile;
  window.launch3001?.refreshProfile?.();
});

const app = document.querySelector('#app');
const game = new Game(app);
game.start();

window.launch3001 = game;
