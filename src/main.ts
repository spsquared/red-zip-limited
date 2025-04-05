import './game';
import { generateGame, showSolution } from './game';

window.addEventListener('load', () => generateGame(10, 10));

const gridWidthInput = document.getElementById('gWidth') as HTMLInputElement;
const gridHeightInput = document.getElementById('gHeight') as HTMLInputElement;
function setSizeAndRefresh() {
    const w = Math.min(100, Math.max(2, Math.round(Number(gridWidthInput.value))));
    const h = Math.min(100, Math.max(2, Math.round(Number(gridHeightInput.value))));
    gridWidthInput.value = w.toString();
    gridHeightInput.value = h.toString();
    generateGame(w, h);
}

document.getElementById('regenButton')!.onclick = () => setSizeAndRefresh();
document.getElementById('solutionButton')!.onclick = () => showSolution();

document.getElementById('instructionsClose')!.onclick = () => document.getElementById('instructions')!.style.minHeight = '0px';

// setTimeout(() => {
//     const canvas = document.createElement('canvas');
//     canvas.width = 256;
//     canvas.height = 256;
//     const ctx = canvas.getContext('2d')!;
//     ctx.imageSmoothingEnabled = false;
//     ctx.fillStyle = '#F00';
//     ctx.fillRect(0, 0, 256, 256);
//     ctx.lineWidth = 8;
//     ctx.font = 'bold 256px Apex Mk2';
//     ctx.textBaseline = 'middle';
//     ctx.textAlign = 'left';
//     ctx.fillStyle = ctx.strokeStyle = '#FFF';
//     ctx.fillText('L', 102, 144);
//     ctx.strokeText('L', 102, 144);
//     ctx.textAlign = 'right';
//     ctx.fillStyle = ctx.strokeStyle = '#000';
//     ctx.fillText('Z', 159, 144);
//     ctx.strokeText('Z', 159, 144);
//     document.body.appendChild(canvas);
// }, 100);