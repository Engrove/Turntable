// src/services/protractorRenderer.js

/**
 * @file src/services/protractorRenderer.js
 * @description En dedikerad "grafikmotor" för att rita en tonarms-protraktor på en HTML Canvas.
 * Denna modul är helt frikopplad från Vue och tar emot all nödvändig data för rendering.
 */

// === HJÄLPFUNKTIONER FÖR ATT RITA ===

/**
 * Ritar spindelhålet och hårkorset.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D-kontext.
 * @param {object} spindle - Spindelns koordinater { x, y }.
 */
function drawSpindle(ctx, spindle) {
  ctx.save();
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 0.2;

  // Hårkors
  ctx.beginPath();
  ctx.moveTo(spindle.x - 7, spindle.y);
  ctx.lineTo(spindle.x + 7, spindle.y);
  ctx.moveTo(spindle.x, spindle.y - 7);
  ctx.lineTo(spindle.x, spindle.y + 7);
  ctx.stroke();

  // Spindelhålscirkel
  ctx.beginPath();
  ctx.arc(spindle.x, spindle.y, 3.6, 0, 2 * Math.PI);
  ctx.stroke();

  // Text (endast för utskrift)
  ctx.fillStyle = '#555';
  ctx.font = '5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Spindle Hole', spindle.x, spindle.y + 8);
  
  ctx.restore();
}

/**
 * Ritar en nollpunkt med dess justeringsrutnät.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D-kontext.
 * @param {object} nullPoint - Nollpunktens data { x, y, tangentAngle }.
 * @param {string} label - Textetikett för nollpunkten (t.ex. "Inner Null: 66.00mm").
 */
function drawNullPoint(ctx, nullPoint, label) {
  ctx.save();
  ctx.translate(nullPoint.x, nullPoint.y);
  ctx.rotate(nullPoint.tangentAngle * (Math.PI / 180));

  // Rita rutnät
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 0.2;
  ctx.beginPath();
  // Horisontella linjer
  ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
  ctx.moveTo(-15, -10); ctx.lineTo(15, -10);
  ctx.moveTo(-15, 10); ctx.lineTo(15, 10);
  // Vertikala linjer
  ctx.moveTo(0, -20); ctx.lineTo(0, 20);
  ctx.moveTo(-10, -15); ctx.lineTo(-10, 15);
  ctx.moveTo(10, -15); ctx.lineTo(10, 15);
  ctx.stroke();

  // Nollpunktsprick
  ctx.beginPath();
  ctx.arc(0, 0, 0.2, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();

  // Rotera tillbaka för att rita texten horisontellt
  ctx.rotate(-nullPoint.tangentAngle * (Math.PI / 180));
  ctx.fillStyle = '#555';
  ctx.font = '5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -25);
  
  ctx.restore();
}

/**
 * Ritar tonarmens svepbåge.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D-kontext.
 * @param {string} arcPath - SVG-sökvägsdata för bågen.
 */
function drawStylusArc(ctx, arcPath) {
  if (!arcPath) return;
  
  ctx.save();
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 0.2;
  ctx.setLineDash([2, 2]);
  
  const path = new Path2D(arcPath);
  ctx.stroke(path);
  
  ctx.restore();
}

/**
 * Ritar en 100mm-skalningslinjal för att verifiera utskriftsstorlek.
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D-kontext.
 */
function drawScaleRuler(ctx) {
  const x = 20, y = 20;
  ctx.save();
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 0.2;

  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 100, y);
  ctx.moveTo(x + 100, y - 5);
  ctx.lineTo(x + 100, y + 5);
  ctx.stroke();

  ctx.fillStyle = '#555';
  ctx.font = '5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('100mm Scale Reference', x + 50, y - 8);

  ctx.restore();
}


// === HUVUDFUNKTION ===

/**
 * Exporterad huvudfunktion som ritar hela protraktorn på en given canvas-kontext.
 * @param {CanvasRenderingContext2D} ctx - Mål-canvasens 2D-kontext.
 * @param {object} renderData - Dataobjektet från alignmentStore.protractorRenderData.
 */
export function renderProtractor(ctx, renderData) {
  const { paper, spindle, innerNull, outerNull, arcPath } = renderData;

  // Rensa canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 1. Rita pappersbakgrund (om det behövs, oftast är canvasen redan vit)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, paper.width, paper.height);

  // 2. Rita skalningslinjal
  drawScaleRuler(ctx);

  // 3. Rita spindel
  if (spindle) {
    drawSpindle(ctx, spindle);
  }

  // 4. Rita svepbåge
  if (arcPath) {
    drawStylusArc(ctx, arcPath);
  }

  // 5. Rita nollpunkter
  if (innerNull && outerNull) {
    drawNullPoint(ctx, innerNull, `Inner Null: ${renderData.nulls.inner.toFixed(2)}mm`);
    drawNullPoint(ctx, outerNull, `Outer Null: ${renderData.nulls.outer.toFixed(2)}mm`);
  }
}
// src/services/protractorRenderer.js
