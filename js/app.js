// ================================================================
// MATEMÁTICAS DISCRETAS II — App.js (SPA por tema)
// ================================================================

const AppState = {
    temaData: null,
    temaId: null,
    subtemaActual: null,
    ejercicioActual: null,
    progreso: {}
};

// ================================================================
// INICIALIZACIÓN
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    cargarTema();
});

function initTheme() {
    const saved = localStorage.getItem('md2-theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('md2-theme', isLight ? 'light' : 'dark');
}

// ================================================================
// CARGA DE DATOS
// ================================================================

function cargarTema() {
    const params = new URLSearchParams(window.location.search);
    const temaId = params.get('tema') || 'tema1';
    AppState.temaId = temaId;

    // Mostrar loading en la vista de subtemas
    const container = document.getElementById('subtemas-content');
    if (container) {
        container.innerHTML = '<div class="loading">Cargando tema</div>';
    }

    fetch(`data/${temaId}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`No se encontró data/${temaId}.json`);
            return r.json();
        })
        .then(data => {
            AppState.temaData = data;
            mostrarVistaSubtemas();
        })
        .catch(err => {
            if (container) {
                container.innerHTML = `
                    <div class="error-box">
                        <strong>Error al cargar el tema</strong><br>
                        ${err.message}<br><br>
                        <a href="index.html" style="color:var(--accent);">← Volver al menú principal</a>
                    </div>
                `;
            }
        });
}

// ================================================================
// NAVEGACIÓN ENTRE VISTAS
// ================================================================

function mostrarVista(id) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    const vista = document.getElementById(id);
    if (vista) vista.classList.add('activa');
    window.scrollTo(0, 0);
    renderizarKaTeX();
}

function renderizarKaTeX() {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ],
            throwOnError: false
        });
    }
}

// ================================================================
// VISTA: SUBTEMAS DEL TEMA
// ================================================================

function mostrarVistaSubtemas() {
    const data = AppState.temaData;
    const container = document.getElementById('subtemas-content');
    if (!container || !data) return;

    let html = `
        <div class="subtema-header">
            <h1>${escapeHtml(data.titulo)}</h1>
            <p class="subtitle">${escapeHtml(data.descripcion)}</p>
        </div>
        <h2>Selecciona un subtema</h2>
        <div class="grid-2">
    `;

    data.subtemas.forEach(sub => {
        const progreso = calcularProgresoSubtema(sub.subtema_id);
        html += `
            <div class="card card-interactive" onclick="seleccionarSubtema('${sub.subtema_id}')">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                    <span style="padding:4px 10px; border-radius:999px; background:var(--accent-soft); color:var(--accent); font-size:12px; font-weight:700;">${escapeHtml(sub.subtema_id)}</span>
                    <span style="font-size:16px; font-weight:600; color:var(--text);">${escapeHtml(sub.titulo)}</span>
                </div>
                <p style="font-size:14px; color:var(--text-secondary); margin:0 0 8px 0;">${sub.ejercicios.length} ejercicios</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${progreso}%;"></div>
                </div>
                <div class="progress-label">${progreso}% completado</div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    mostrarVista('vista-subtemas');
}

function seleccionarSubtema(subtemaId) {
    AppState.subtemaActual = subtemaId;
    AppState.ejercicioActual = null;
    const subtema = AppState.temaData.subtemas.find(s => s.subtema_id === subtemaId);
    if (subtema) {
        renderSubtema(subtema);
        mostrarVista('vista-subtema');
    }
}

// ================================================================
// VISTA: CONTENIDO DE SUBTEMA (TEORÍA + EJERCICIOS)
// ================================================================

function renderSubtema(subtema) {
    const container = document.getElementById('subtema-content');
    if (!container) return;

    const teoria = subtema.teoria;
    let html = `
        <div class="subtema-header">
            <div class="subtema-numero">${escapeHtml(subtema.subtema_id)}</div>
            <h1>${escapeHtml(subtema.titulo)}</h1>
        </div>
    `;

    if (teoria.introduccion) {
        html += `<p class="intro-text">${teoria.introduccion}</p>`;
    }

    if (teoria.definiciones?.length) {
        html += `<h2>📖 Definiciones</h2>`;
        teoria.definiciones.forEach(def => {
            html += `
                <div class="definicion">
                    <div class="definicion-titulo">${escapeHtml(def.nombre)}</div>
                    <p>${def.contenido}</p>
                    ${def.nota ? `<div class="nota">💡 ${def.nota}</div>` : ''}
                </div>
            `;
        });
    }

    if (teoria.lemas?.length) {
        html += `<h2>📌 Lemas</h2>`;
        teoria.lemas.forEach(lema => {
            html += `
                <div class="lema">
                    <div class="lema-titulo">${escapeHtml(lema.nombre)}</div>
                    <p>${lema.contenido}</p>
                    ${lema.esquema_demostracion ? `<p style="margin-top:8px; font-style:italic; color:var(--text-muted);"><strong>Idea:</strong> ${lema.esquema_demostracion}</p>` : ''}
                </div>
            `;
        });
    }

    if (teoria.ejemplos?.length) {
        html += `<h2>💡 Ejemplos</h2>`;
        teoria.ejemplos.forEach((ej, i) => {
            html += `<div class="ejemplo">`;
            html += `<div class="ejemplo-titulo">${escapeHtml(ej.titulo)}</div>`;
            html += `<p>${ej.descripcion}</p>`;
            if (ej.items?.length) {
                html += `<ul>${ej.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            }
            if (ej.diagrama) {
                const diagramaId = `hasse-${subtema.subtema_id}-${i}`;
                html += `<div class="hasse-container" id="${diagramaId}"></div>`;
                html += `<p class="hasse-caption">Figura ${i+1} — Diagrama de Hasse</p>`;
                setTimeout(() => renderHasse(diagramaId, ej.diagrama), 0);
            }
            if (ej.observacion) {
                html += `<div class="observacion">${ej.observacion}</div>`;
            }
            html += `</div>`;
        });
    }

    if (teoria.notacion) {
        html += `<div class="card" style="margin-top:20px;"><p style="margin:0; font-size:14px; color:var(--text-secondary);"><strong>Notación:</strong> ${teoria.notacion}</p></div>`;
    }

    if (teoria.nota_previa) {
        html += `<div class="card nota-previa" style="margin-top:20px; border-left:3px solid var(--warning);"><p style="margin:0; color:var(--text-secondary);">🤔 <strong>Para reflexionar:</strong> ${teoria.nota_previa}</p></div>`;
    }

    html += `
        <div class="lista-ejercicios">
            <div class="lista-ejercicios-header">Ejercicios del subtema</div>
            ${subtema.ejercicios.map((ej, idx) => {
                const visto = estaVisto(ej.id);
                return `
                <div class="ejercicio-row" onclick="seleccionarEjercicio('${ej.id}')">
                    <div class="ejercicio-row-info">
                        <div class="ejercicio-numero" style="${visto ? 'background:var(--success-soft); color:var(--success);' : ''}">${visto ? '✓' : idx + 1}</div>
                        <div>
                            <div class="ejercicio-titulo">Ejercicio ${idx + 1}</div>
                            <div class="ejercicio-meta">Nivel ${ej.nivel} · ${ej.etiquetas.map(e => e === 'teoria' ? 'teoría' : e).join(', ')}</div>
                        </div>
                    </div>
                    <div class="ejercicio-arrow">→</div>
                </div>
            `;}).join('')}
        </div>
    `;

    container.innerHTML = html;
}

function irASubtemaActual() {
    AppState.ejercicioActual = null;
    const subtema = AppState.temaData?.subtemas?.find(s => s.subtema_id === AppState.subtemaActual);
    if (subtema) {
        renderSubtema(subtema);
        mostrarVista('vista-subtema');
        // Restaurar posición de scroll si existe
        if (AppState.scrollSubtema !== undefined) {
            setTimeout(() => {
                window.scrollTo(0, AppState.scrollSubtema);
                AppState.scrollSubtema = undefined;
            }, 50);
        }
    }
}

// ================================================================
// VISTA: EJERCICIO INDIVIDUAL
// ================================================================

function seleccionarEjercicio(ejId) {
    AppState.ejercicioActual = ejId;
    AppState.scrollSubtema = window.scrollY;

    const subtema = AppState.temaData?.subtemas?.find(s => s.subtema_id === AppState.subtemaActual);
    if (!subtema) return;

    const ejercicio = subtema.ejercicios.find(e => e.id === ejId);
    const ejIndex = subtema.ejercicios.findIndex(e => e.id === ejId);
    if (ejercicio) {
        renderEjercicio(ejercicio, ejIndex + 1, subtema);
        mostrarVista('vista-ejercicio');
    }
}

function renderEjercicio(ej, num, subtema) {
    const container = document.getElementById('ejercicio-content');
    if (!container) return;

    let html = `
        <nav class="breadcrumb">
            <span>${escapeHtml(AppState.temaData.titulo)}</span>
            <span>›</span>
            <span>${escapeHtml(subtema.subtema_id)} ${escapeHtml(subtema.titulo)}</span>
            <span>›</span>
            <span class="current">Ejercicio ${num}</span>
        </nav>

        <div class="card">
            <div class="card-header">
                <div>
                    <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:4px;">Ejercicio ${num}</div>
                    <h1 style="font-size:1.3rem;">${escapeHtml(ej.enunciado.replace(/\$\$.*?\$\$/g, '').replace(/\$.*?\$/g, '').substring(0, 80).trim())}${ej.enunciado.replace(/\$\$.*?\$\$/g, '').replace(/\$.*?\$/g, '').length > 80 ? '...' : ''}</h1>
                </div>
                <div class="tags">
                    ${ej.etiquetas.map(et => `<span class="tag tag-${et === 'teoria' ? 'teoria' : 'ejercicio'}">${et === 'teoria' ? 'teoría' : escapeHtml(et)}</span>`).join('')}
                    <span class="tag tag-dificultad">Nivel ${ej.nivel}</span>
                </div>
            </div>

            <div class="enunciado">
                <p><strong>Enunciado:</strong></p>
                <p>${ej.enunciado}</p>
            </div>
    `;

    if (ej.tips?.length) {
        html += `<div class="tips">`;
        ej.tips.forEach(tip => {
            html += `
                <div class="tip-box" onclick="this.classList.toggle('open')">
                    <button class="tip-header" onclick="event.stopPropagation()">
                        <span>💡 ${escapeHtml(tip.titulo)}</span>
                        <span class="tip-icon">+</span>
                    </button>
                    <div class="tip-body">${tip.contenido}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `
        <div class="solucion-wrapper">
            <button class="btn-solucion" onclick="toggleSolucion('${ej.id}', this)">
                🔓 Mostrar solución paso a paso
            </button>
            <div id="sol-${ej.id}" class="solucion">
                <h4><span>✓</span> Solución detallada</h4>
    `;

    ej.solucion.pasos.forEach((paso, i) => {
        html += `
            <div class="paso">
                <div class="paso-titulo">
                    <span class="paso-numero">${i + 1}</span>
                    ${escapeHtml(paso.titulo)}
                </div>
                <p>${paso.contenido}</p>
                ${paso.formula ? `<div class="formula-block">$$${paso.formula}$$</div>` : ''}
            </div>
        `;
    });

    html += `
            </div>
        </div>
        </div>
    `;

    const yaCompletado = estaVisto(ej.id);
    if (yaCompletado) {
        html += `
            <div style="margin-top:16px; padding:12px 16px; border-radius:8px; background:var(--success-soft); color:var(--success); font-size:14px; text-align:center;">
                ✓ Ejercicio ya completado
            </div>
        `;
    } else {
        html += `
            <div class="evaluacion-wrapper" id="eval-${ej.id}" style="display:none; margin-top:16px;">
                <p style="color:var(--text-secondary); font-size:14px; margin-bottom:12px; text-align:center;">¿Tu solución coincide con la del sistema?</p>
                <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
                    <button class="btn-eval btn-correcto" onclick="marcarEjercicioCompletado('${ej.id}', true)" style="padding:10px 18px; border-radius:8px; border:none; background:var(--success); color:#fff; font-weight:600; cursor:pointer;">✅ Sí, coincide</button>
                    <button class="btn-eval btn-incorrecto" onclick="marcarEjercicioCompletado('${ej.id}', false)" style="padding:10px 18px; border-radius:8px; border:none; background:var(--danger); color:#fff; font-weight:600; cursor:pointer;">❌ No coincide</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function toggleSolucion(ejId, btn) {
    const sol = document.getElementById(`sol-${ejId}`);
    if (!sol) return;
    const visible = sol.classList.toggle('visible');
    btn.textContent = visible ? '🔒 Ocultar solución' : '🔓 Mostrar solución paso a paso';
    if (visible) {
        marcarSolucionVista(ejId);
        const evalDiv = document.getElementById(`eval-${ejId}`);
        if (evalDiv && !estaVisto(ejId)) {
            evalDiv.style.display = 'block';
        }
    } else {
        const evalDiv = document.getElementById(`eval-${ejId}`);
        if (evalDiv) evalDiv.style.display = 'none';
    }
}

// ================================================================
// GENERADOR DE HASSE SVG
// ================================================================

function renderHasse(containerId, diagrama) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ancho = 360;
    const alto = 400;
    const inicioY = 55;
    const espacioY = 90;
    const centroX = ancho / 2;

    const niveles = {};
    diagrama.nodos.forEach(n => {
        if (!niveles[n.nivel]) niveles[n.nivel] = [];
        niveles[n.nivel].push(n);
    });

    const posiciones = {};
    Object.keys(niveles).forEach(nivel => {
        const nodosNivel = niveles[nivel];
        const total = nodosNivel.length;
        const anchoDisponible = ancho - 50;
        const paso = total > 1 ? anchoDisponible / (total - 1) : 0;
        const inicioX = total > 1 ? 25 : centroX;

        nodosNivel.forEach((nodo, i) => {
            posiciones[nodo.id] = {
                x: total > 1 ? inicioX + i * paso : centroX,
                y: inicioY + parseInt(nivel) * espacioY
            };
        });
    });

    const destacados = diagrama.destacados || [];

    let svg = `<svg viewBox="0 0 ${ancho} ${alto}" style="width:100%;max-width:380px;height:auto;">`;

    diagrama.aristas.forEach(([desde, hacia]) => {
        const p1 = posiciones[desde];
        const p2 = posiciones[hacia];
        if (p1 && p2) {
            svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="var(--border)" stroke-width="1.5" opacity="0.5"/>`;
        }
    });

    diagrama.nodos.forEach(n => {
        const p = posiciones[n.id];
        if (!p) return;
        const esDestacado = destacados.includes(n.id);
        const colorStroke = esDestacado ? 'var(--accent)' : 'var(--border-light)';
        const strokeWidth = esDestacado ? 2.5 : 1.5;
        const fontWeight = esDestacado ? 600 : 500;
        // Reemplazar \emptyset por el símbolo Unicode ∅
        const etiqueta = n.etiqueta.replace(/\\emptyset/g, '∅');

        svg += `<circle cx="${p.x}" cy="${p.y}" r="22" fill="var(--bg-card)" stroke="${colorStroke}" stroke-width="${strokeWidth}"/>`;
        svg += `<text x="${p.x}" y="${p.y + 5}" text-anchor="middle" style="font-family:var(--font);font-size:13px;font-weight:${fontWeight};fill:var(--text);">${etiqueta}</text>`;
    });

    svg += '</svg>';
    container.innerHTML = svg;
}

// ================================================================
// PROGRESO (localStorage)
// ================================================================

function getProgressKey() {
    return `md2-progreso-${AppState.temaId}`;
}

function cargarProgreso() {
    try {
        const raw = localStorage.getItem(getProgressKey());
        AppState.progreso = raw ? JSON.parse(raw) : {};
    } catch {
        AppState.progreso = {};
    }
}

function guardarProgreso() {
    localStorage.setItem(getProgressKey(), JSON.stringify(AppState.progreso));
}

function marcarVisto(ejId) {
    cargarProgreso();
    if (!AppState.progreso[AppState.subtemaActual]) {
        AppState.progreso[AppState.subtemaActual] = {};
    }
    AppState.progreso[AppState.subtemaActual][ejId] = { visto: true, fecha: Date.now() };
    guardarProgreso();
}

function marcarSolucionVista(ejId) {
    cargarProgreso();
    if (!AppState.progreso[AppState.subtemaActual]) {
        AppState.progreso[AppState.subtemaActual] = {};
    }
    if (AppState.progreso[AppState.subtemaActual][ejId]) {
        AppState.progreso[AppState.subtemaActual][ejId].solucion = true;
    }
    guardarProgreso();
}

function marcarEjercicioCompletado(ejId, correcto) {
    marcarVisto(ejId);
    cargarProgreso();
    if (AppState.progreso[AppState.subtemaActual]?.[ejId]) {
        AppState.progreso[AppState.subtemaActual][ejId].correcto = correcto;
    }
    guardarProgreso();

    const evalDiv = document.getElementById(`eval-${ejId}`);
    if (evalDiv) {
        evalDiv.innerHTML = `
            <div style="padding:12px 16px; border-radius:8px; background:var(--success-soft); color:var(--success); font-size:14px; text-align:center;">
                ✓ Ejercicio completado${correcto ? ' — ¡Bien hecho!' : ' — Sigue practicando'}
            </div>
        `;
        evalDiv.style.display = 'block';
    }
}

function estaVisto(ejId) {
    cargarProgreso();
    return AppState.progreso[AppState.subtemaActual]?.[ejId]?.visto || false;
}

function calcularProgresoSubtema(subtemaId) {
    cargarProgreso();
    const subtema = AppState.temaData?.subtemas?.find(s => s.subtema_id === subtemaId);
    if (!subtema) return 0;
    const total = subtema.ejercicios.length;
    if (total === 0) return 0;
    const vistos = subtema.ejercicios.filter(ej => {
        return AppState.progreso[subtemaId]?.[ej.id]?.visto;
    }).length;
    return Math.round((vistos / total) * 100);
}

// ================================================================
// UTILIDADES
// ================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}