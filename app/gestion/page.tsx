"use client"; // Marca este componente como un Client Component

import React, { useEffect } from 'react';
import Chart from 'chart.js/auto'; // Importa Chart.js

export default function GestionDashboard() {
  useEffect(() => {
    // Código para inicializar los gráficos de Chart.js
    // ATC Rentabilidad Chart
    new Chart(document.getElementById('atcChart') as HTMLCanvasElement, {
        type: 'bar',
        data: {
            labels: ['ATC1', 'ATC2', 'ATC3'],
            datasets: [{
                label: 'Copias/Equipo',
                data: [1545, 1481, 7066],
                backgroundColor: ['#1B4D3E', '#3b82f6', '#C41E3A']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#71717a', font: { size: 10 } },
                    grid: { color: '#27272a' }
                },
                x: {
                    ticks: { color: '#a1a1aa', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });

    // Nómina Chart
    new Chart(document.getElementById('nominaChart') as HTMLCanvasElement, {
        type: 'doughnut',
        data: {
            labels: ['Dirección', 'Técnicos', 'Admin', 'Otros'],
            datasets: [{
                data: [2341, 2972, 2156, 1784],
                backgroundColor: ['#C41E3A', '#1B4D3E', '#3b82f6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { size: 10 }, padding: 8, color: '#a1a1aa' }
                }
            }
        }
    });

    // Proyección Chart
    new Chart(document.getElementById('proyeccionChart') as HTMLCanvasElement, {
        type: 'line',
        data: {
            labels: ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
                label: 'Ingresos',
                data: [28000, 32000, 36000, 39000, 40000, 41000, 41131, 41131, 41131],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Costos',
                data: [19000, 21000, 23000, 24500, 25200, 25600, 25837, 25837, 25837],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 10 }, padding: 12, color: '#a1a1aa' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#71717a',
                        font: { size: 10 },
                        callback: function(value: any) { return '$' + value/1000 + 'K'; }
                    },
                    grid: { color: '#27272a' }
                },
                x: {
                    ticks: { color: '#a1a1aa', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
  }, []); // El array vacío asegura que esto se ejecute una sola vez al montar el componente

  return (
    <html lang="es">
    <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Toncan Digital - Dashboard de Gestión Integral</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Chart.js se importa como módulo, no necesita script en head */}
        <style dangerouslySetInnerHTML={{ __html: `
            :root {
                --toncan-green: #1B4D3E;
                --toncan-green-light: #2D7A5F;
                --toncan-red: #C41E3A;
                --bg-dark: #09090b;
                --bg-card: #18181b;
                --bg-card-alt: #1f1f23;
                --text-primary: #fafafa;
                --text-secondary: #a1a1aa;
                --text-muted: #71717a;
                --border: #27272a;
                --success: #22c55e;
                --warning: #f59e0b;
                --danger: #ef4444;
                --info: #3b82f6;
                --purple: #a855f7;
                --cyan: #06b6d4;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }

            body {
                font-family: 'Inter', system-ui, sans-serif;
                background: var(--bg-dark);
                color: var(--text-primary);
                line-height: 1.5;
            }

            .dashboard { display: flex; min-height: 100vh; }

            /* Sidebar */
            .sidebar {
                width: 240px;
                background: var(--bg-card);
                border-right: 1px solid var(--border);
                padding: 20px 14px;
                position: fixed;
                height: 100vh;
                overflow-y: auto;
            }

            .logo-box {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px;
                margin-bottom: 24px;
            }

            .logo-img {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                background: #000;
                padding: 4px;
            }

            .logo-img img { width: 100%; height: 100%; object-fit: contain; }

            .logo-text { font-size: 14px; font-weight: 700; }
            .logo-text span { color: var(--toncan-red); }

            .nav-section { margin-bottom: 20px; }
            .nav-title {
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: var(--text-muted);
                padding: 6px 12px;
                margin-bottom: 4px;
            }

            .nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                border-radius: 6px;
                color: var(--text-secondary);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
                margin-bottom: 2px;
            }

            .nav-item:hover { background: rgba(255,255,255,0.05); }
            .nav-item.active { background: var(--toncan-green); color: white; }

            /* Main */
            .main { margin-left: 240px; flex: 1; padding: 20px 24px; }

            .page-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .page-title { font-size: 22px; font-weight: 700; }
            .page-subtitle { color: var(--text-secondary); font-size: 12px; }

            .header-badges { display: flex; gap: 10px; }
            .badge-date {
                background: var(--bg-card-alt);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 11px;
                border: 1px solid var(--border);
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 12px;
                margin-bottom: 20px;
            }

            .stat-card {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 10px;
                padding: 14px;
            }

            .stat-icon {
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                margin-bottom: 8px;
            }

            .stat-icon.green { background: rgba(34,197,94,0.15); }
            .stat-icon.red { background: rgba(239,68,68,0.15); }
            .stat-icon.blue { background: rgba(59,130,246,0.15); }
            .stat-icon.yellow { background: rgba(245,158,11,0.15); }
            .stat-icon.purple { background: rgba(168,85,247,0.15); }
            .stat-icon.cyan { background: rgba(6,182,212,0.15); }

            .stat-value { font-size: 22px; font-weight: 700; }
            .stat-label { font-size: 10px; color: var(--text-muted); }
            .stat-change { font-size: 10px; margin-top: 4px; }
            .stat-change.up { color: var(--success); }
            .stat-change.down { color: var(--danger); }

            /* Section */
            .section { margin-bottom: 20px; }
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .section-title {
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .section-title::before {
                content: '';
                width: 3px;
                height: 16px;
                background: var(--toncan-green);
                border-radius: 2px;
            }

            /* Cards */
            .card {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 10px;
                overflow: hidden;
            }

            .card-header {
                padding: 12px 16px;
                border-bottom: 1px solid var(--border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .card-title { font-size: 13px; font-weight: 600; }
            .card-body { padding: 16px; }

            /* Grids */
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
            .grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
            .grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }

            /* Table */
            .table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .table th {
                text-align: left;
                padding: 8px 10px;
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--text-muted);
                border-bottom: 1px solid var(--border);
                background: var(--bg-card-alt);
            }
            .table td {
                padding: 8px 10px;
                border-bottom: 1px solid var(--border);
            }
            .table tr:hover { background: rgba(255,255,255,0.02); }
            .table tr.highlight { background: rgba(34,197,94,0.08); }

            /* Badges */
            .badge {
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 9px;
                font-weight: 600;
            }
            .badge-green { background: rgba(34,197,94,0.15); color: var(--success); }
            .badge-yellow { background: rgba(245,158,11,0.15); color: var(--warning); }
            .badge-red { background: rgba(239,68,68,0.15); color: var(--danger); }
            .badge-blue { background: rgba(59,130,246,0.15); color: var(--info); }
            .badge-purple { background: rgba(168,85,247,0.15); color: var(--purple); }

            /* ROI Cards */
            .roi-card {
                background: linear-gradient(135deg, var(--toncan-green) 0%, #0d2922 100%);
                border-radius: 10px;
                padding: 16px;
                text-align: center;
            }
            .roi-card.alt {
                background: linear-gradient(135deg, var(--bg-card-alt) 0%, var(--bg-card) 100%);
                border: 1px solid var(--border);
            }
            .roi-card.danger {
                background: linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%);
            }
            .roi-label { font-size: 10px; opacity: 0.8; margin-bottom: 4px; }
            .roi-value { font-size: 26px; font-weight: 800; }
            .roi-sub { font-size: 10px; opacity: 0.7; margin-top: 4px; }

            /* Progress */
            .progress { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
            .progress-bar { height: 100%; border-radius: 3px; }
            .progress-bar.green { background: var(--success); }
            .progress-bar.yellow { background: var(--warning); }
            .progress-bar.red { background: var(--danger); }

            /* Chart */
            .chart-container { position: relative; height: 180px; }
            .chart-container.tall { height: 220px; }

            /* KPI Box */
            .kpi-box {
                background: var(--bg-card-alt);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
            }
            .kpi-value { font-size: 20px; font-weight: 700; }
            .kpi-label { font-size: 9px; color: var(--text-muted); margin-top: 2px; }

            /* Alert */
            .alert {
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                font-size: 12px;
            }
            .alert-success { background: rgba(34,197,94,0.1); border-left: 3px solid var(--success); }
            .alert-warning { background: rgba(245,158,11,0.1); border-left: 3px solid var(--warning); }
            .alert-danger { background: rgba(239,68,68,0.1); border-left: 3px solid var(--danger); }
            .alert-info { background: rgba(59,130,246,0.1); border-left: 3px solid var(--info); }
            .alert-icon { font-size: 16px; }
            .alert-content h4 { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
            .alert-content p { font-size: 11px; color: var(--text-secondary); }

            /* Mini stat */
            .mini-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--border);
            }
            .mini-stat:last-child { border-bottom: none; }
            .mini-stat-label { font-size: 11px; color: var(--text-secondary); }
            .mini-stat-value { font-size: 13px; font-weight: 600; }

            /* Projection row */
            .projection-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 12px;
                background: var(--bg-card-alt);
                border-radius: 6px;
                margin-bottom: 8px;
            }
            .projection-row.total {
                background: var(--toncan-green);
                font-weight: 600;
            }

            @media (max-width: 1400px) {
                .stats-grid { grid-template-columns: repeat(3, 1fr); }
                .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr 1fr; }
            }

            @media (max-width: 900px) {
                .sidebar { display: none; }
                .main { margin-left: 0; }
                .stats-grid { grid-template-columns: 1fr 1fr; }
                .grid-2, .grid-3, .grid-4, .grid-2-1, .grid-1-2 { grid-template-columns: 1fr; }
            }
        ` }} />
    </head>
    <body>
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-box">
                    <div className="logo-img">
                        <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQ5BDgDASIAAhEBAxEB/8QAHAABAAICAwEAAAAAAAAAAAAAAAYHBAUCAwgB/8QAVhAAAQMCAgQHCwgFCQgCAwEBAAECAwQFBhEHEiExE0FRYXGBsRQiNlJyc5GhssHRFSMyNDVCYnQWM0OTwiRUVYKDkqLh8BdFU2NlpLPiRNIIlPFko//EAB0BAQACAgMBAQAAAAAAAAAAAAAFBgQHAgMIAQn/xABJEQACAQICBQgGBwYFBQACAwAAAQIDBAURBiEhQVESYXGBkaGxwQcTIjIz0RQ0QlKC4fAVIzVicrIkU5LC8RZDc6LSCBclRFT/2gAIAQEAAQUC/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJXo9w... [truncated]" alt="Toncan Digital Logo" />
                    </div>
                    <div className="logo-text">TONCAN <span>DIGITAL</span></div>
                </div>

                <nav>
                    <div className="nav-section">
                        <div className="nav-title">Principal</div>
                        <div className="nav-item active">📊 Dashboard</div>
                        <div className="nav-item">💰 Finanzas</div>
                        <div className="nav-item">📈 Proyecciones</div>
                    </div>
                    <div className="nav-section">
                        <div className="nav-title">Operaciones</div>
                        <div className="nav-item">🖨️ Equipos (418)</div>
                        <div className="nav-item">👥 Personal (25)</div>
                        <div className="nav-item">🚚 Logística</div>
                    </div>
                    <div className="nav-section">
                        <div className="nav-title">Clientes</div>
                        <div className="nav-item">🏢 ATC1 - Bolipuertos</div>
                        <div className="nav-item">📋 ATC2 - Varios</div>
                        <div className="nav-item">📋 ATC3 - Varios</div>
                    </div>
                    <div className="nav-section">
                        <div className="nav-title">Análisis</div>
                        <div className="nav-item">💎 ROI Equipos</div>
                        <div className="nav-item">📊 Rentabilidad</div>
                        <div className="nav-item">⚡ KPIs</div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Dashboard de Gestión Integral</h1>
                        <p className="page-subtitle">Análisis consolidado: ROI, Rentabilidad, Personal y Proyecciones</p>
                    </div>
                    <div className="header-badges">
                        <div className="badge-date">📅 Marzo 2026</div>
                        <div className="badge-date">💹 Tasa BCV: 471.70</div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="alert alert-success">
                    <span className="alert-icon">📈</span>
                    <div className="alert-content">
                        <h4>Capacidad de crecimiento identificada</h4>
                        <p>Con 150 equipos nuevos en inventario, puedes duplicar tu facturación actual. ROI proyectado: 198% anual.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon green">👥</div>
                        <div className="stat-value">25</div>
                        <div className="stat-label">Empleados</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon blue">🖨️</div>
                        <div className="stat-value">268</div>
                        <div className="stat-label">Equipos en Campo</div>
                        <div className="stat-change up">+150 en inventario</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon yellow">📄</div>
                        <div className="stat-value">527K</div>
                        <div className="stat-label">Copias Feb</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">🏢</div>
                        <div className="stat-value">30</div>
                        <div className="stat-label">Clientes Activos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cyan">💵</div>
                        <div className="stat-value">$26.4K</div>
                        <div className="stat-label">Ingresos/Mes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red">📊</div>
                        <div className="stat-value">$8.2K</div>
                        <div className="stat-label">Margen Bruto</div>
                        <div className="stat-change up">31.1% margen</div>
                    </div>
                </div>

                {/* ROI Section */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">💎 Análisis ROI - Equipos Importados (150 unidades)</div>
                    </div>
                    <div className="grid-4">
                        <div className="roi-card alt">
                            <div className="roi-label">INVERSIÓN TOTAL</div>
                            <div className="roi-value" style={{color: 'var(--danger)'}}>$71,560</div>
                            <div className="roi-sub">Boss $54,350 + CBM $17,210</div>
                        </div>
                        <div className="roi-card">
                            <div className="roi-label">INGRESO PROYECTADO/MES</div>
                            <div className="roi-value">$14,760</div>
                            <div className="roi-sub">150 eq × 1,968 cop × $0.05</div>
                        </div>
                        <div className="roi-card">
                            <div className="roi-label">PAYBACK</div>
                            <div className="roi-value">4.8</div>
                            <div className="roi-sub">meses para recuperar</div>
                        </div>
                        <div className="roi-card">
                            <div className="roi-label">ROI ANUAL</div>
                            <div className="roi-value">198%</div>
                            <div className="roi-sub">retorno sobre inversión</div>
                        </div>
                    </div>

                    <div className="grid-2" style={{marginTop: '16px'}}>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Desglose de Inversión</span>
                            </div>
                            <div className="card-body">
                                <div className="mini-stat">
                                    <span className="mini-stat-label">Boss International (110 eq. usados)</span>
                                    <span className="mini-stat-value">$54,350</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-label">CBM Trading (40 Canon IR1643i II)</span>
                                    <span className="mini-stat-value">$17,210</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-label">Nacionalización estimada (10%)</span>
                                    <span className="mini-stat-value">$7,156</span>
                                </div>
                                <div className="mini-stat" style={{background: 'var(--bg-card-alt)', margin: '8px -16px -16px', padding: '12px 16px'}}>
                                    <span className="mini-stat-label" style={{fontWeight: '600'}}>TOTAL INVERSIÓN</span>
                                    <span className="mini-stat-value" style={{color: 'var(--danger)'}}>$78,716</span>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Proyección de Ingresos (150 equipos)</span>
                            </div>
                            <div className="card-body">
                                <div className="mini-stat">
                                    <span className="mini-stat-label">Copias B/N (280K × $0.04)</span>
                                    <span className="mini-stat-value" style={{color: 'var(--success)'}}>$11,200</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-label">Copias Color (15K × $0.60)</span>
                                    <span className="mini-stat-value" style={{color: 'var(--success)'}}>$9,000</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-label">Costo operativo adicional (est.)</span>
                                    <span className="mini-stat-value" style={{color: 'var(--danger)'}}>-$5,440</span>
                                </div>
                                <div className="mini-stat" style={{background: 'var(--toncan-green)', margin: '8px -16px -16px', padding: '12px 16px', borderRadius: '0 0 10px 10px'}}>
                                    <span className="mini-stat-label" style={{fontWeight: '600'}}>UTILIDAD NETA MENSUAL</span>
                                    <span className="mini-stat-value">$14,760</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rentabilidad por Cliente */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📊 Análisis de Rentabilidad por Cliente/ATC</div>
                    </div>
                    <div className="grid-2-1">
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Top 10 Clientes por Rentabilidad</span>
                                <span className="badge badge-green">Copias/Equipo</span>
                            </div>
                            <div className="card-body" style={{padding: '0'}}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Cliente</th>
                                            <th>ATC</th>
                                            <th>Eq.</th>
                                            <th>Copias</th>
                                            <th>Cop/Eq</th>
                                            <th>Eficiencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="highlight">
                                            <td>🥇</td>
                                            <td><strong>F. Stanzione</strong></td>
                                            <td><span className="badge badge-purple">ATC3</span></td>
                                            <td>2</td>
                                            <td>63,041</td>
                                            <td><strong>31,521</strong></td>
                                            <td><span className="badge badge-green">⭐ Óptimo</span></td>
                                        </tr>
                                        <tr className="highlight">
                                            <td>🥈</td>
                                            <td><strong>Inv. Altamirano</strong></td>
                                            <td><span className="badge badge-purple">ATC3</span></td>
                                            <td>1</td>
                                            <td>18,524</td>
                                            <td><strong>18,524</strong></td>
                                            <td><span className="badge badge-green">⭐ Óptimo</span></td>
                                        </tr>
                                        <tr>
                                            <td>🥉</td>
                                            <td><strong>Alimentos Maco</strong></td>
                                            <td><span className="badge badge-purple">ATC3</span></td>
                                            <td>5</td>
                                            <td>32,955</td>
                                            <td>6,591</td>
                                            <td><span className="badge badge-green">Alto</span></td>
                                        </tr>
                                        <tr>
                                            <td>4</td>
                                            <td>Taurel</td>
                                            <td><span className="badge badge-blue">ATC2</span></td>
                                            <td>1</td>
                                            <td>4,993</td>
                                            <td>4,993</td>
                                            <td><span className="badge badge-green">Alto</span></td>
                                        </tr>
                                        <tr>
                                            <td>5</td>
                                            <td>K-NOB Trading</td>
                                            <td><span className="badge badge-blue">ATC2</span></td>
                                            <td>2</td>
                                            <td>6,197</td>
                                            <td>3,099</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                        <tr>
                                            <td>6</td>
                                            <td>Bolip Guamache</td>
                                            <td><span className="badge badge-green">ATC1</span></td>
                                            <td>8</td>
                                            <td>21,590</td>
                                            <td>2,699</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                        <tr>
                                            <td>7</td>
                                            <td>Centro Ort. Pod.</td>
                                            <td><span className="badge badge-blue">ATC2</span></td>
                                            <td>4</td>
                                            <td>10,168</td>
                                            <td>2,542</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                        <tr>
                                            <td>8</td>
                                            <td>Bolip La Guaira</td>
                                            <td><span className="badge badge-green">ATC1</span></td>
                                            <td>46</td>
                                            <td>105,878</td>
                                            <td>2,302</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                        <tr>
                                            <td>9</td>
                                            <td>Epran</td>
                                            <td><span className="badge badge-blue">ATC2</span></td>
                                            <td>1</td>
                                            <td>1,785</td>
                                            <td>1,785</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                        <tr>
                                            <td>10</td>
                                            <td>Bolip Sede</td>
                                            <td><span className="badge badge-green">ATC1</span></td>
                                            <td>35</td>
                                            <td>54,898</td>
                                            <td>1,569</td>
                                            <td><span className="badge badge-yellow">Medio</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <div className="card" style={{marginBottom: '16px'}}>
                                <div className="card-header">
                                    <span className="card-title">Rentabilidad por ATC</span>
                                </div>
                                <div className="card-body">
                                    <div className="chart-container">
                                        <canvas id="atcChart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">⚠️ Clientes Bajo Rendimiento</span>
                                </div>
                                <div className="card-body" style={{padding: '12px'}}>
                                    <div className="alert alert-warning" style={{margin: '0 0 8px 0', padding: '8px 12px'}}>
                                        <div className="alert-content">
                                            <h4>Bolip La Ceiba</h4>
                                            <p>5 eq. → 387 cop/eq (muy bajo)</p>
                                        </div>
                                    </div>
                                    <div className="alert alert-warning" style={{margin: '0 0 8px 0', padding: '8px 12px'}}>
                                        <div className="alert-content">
                                            <h4>Bolip Pto Seco</h4>
                                            <p>3 eq. → 1,336 cop/eq (bajo)</p>
                                        </div>
                                    </div>
                                    <div className="alert alert-danger" style={{margin: '0', padding: '8px 12px'}}>
                                        <div className="alert-content">
                                            <h4>Gente Creativa</h4>
                                            <p>1 eq. → 279 cop/eq (crítico)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs de Personal */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">👥 KPIs de Productividad del Personal</div>
                    </div>
                    <div className="grid-3">
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Carga de Trabajo Actual</span>
                            </div>
                            <div className="card-body">
                                <div className="grid-2" style={{gap: '10px'}}>
                                    <div className="kpi-box">
                                        <div className="kpi-value" style={{color: 'var(--success)'}}>38.3</div>
                                        <div className="kpi-label">Equipos por Técnico (7)</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value">10.7</div>
                                        <div className="kpi-label">Equipos por Empleado</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value">75,354</div>
                                        <div className="kpi-label">Copias por Técnico/Mes</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value" style={{color: 'var(--success)'}}>$3,768</div>
                                        <div className="kpi-label">Facturación por Técnico</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Proyección con 150 Equipos Nuevos</span>
                            </div>
                            <div className="card-body">
                                <div className="grid-2" style={{gap: '10px'}}>
                                    <div className="kpi-box" style={{border: '1px solid var(--warning)'}}>
                                        <div className="kpi-value" style={{color: 'var(--warning)'}}>59.7</div>
                                        <div className="kpi-label">Equipos por Técnico</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value">16.7</div>
                                        <div className="kpi-label">Equipos por Empleado</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value" style={{color: 'var(--danger)'}}>+56%</div>
                                        <div className="kpi-label">Aumento Carga Técnicos</div>
                                    </div>
                                    <div className="kpi-box" style={{border: '1px solid var(--success)'}}>
                                        <div className="kpi-value" style={{color: 'var(--success)'}}>$5,877</div>
                                        <div className="kpi-label">Facturación por Técnico</div>
                                    </div>
                                </div>
                                <div className="alert alert-warning" style={{marginTop: '12px', marginBottom: '0'}}>
                                    <div className="alert-content">
                                        <h4>⚠️ Recomendación</h4>
                                        <p>Considerar contratar 2-3 técnicos adicionales para mantener ratio óptimo de 40-45 eq/técnico</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Distribución de Nómina</span>
                            </div>
                            <div className="card-body">
                                <div className="chart-container">
                                    <canvas id="nominaChart"></canvas>
                                </div>
                                <div style={{textAlign: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
                                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Total Nómina:</span>
                                    <span style={{fontSize: '16px', fontWeight: '700', marginLeft: '8px'}}>$9,253/mes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proyecciones Financieras */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📈 Proyecciones Financieras</div>
                    </div>
                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Estado Actual vs Proyectado (con 150 eq. nuevos)</span>
                            </div>
                            <div className="card-body">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Concepto</th>
                                            <th style={{textAlign: 'right'}}>Actual</th>
                                            <th style={{textAlign: 'right'}}>Proyectado</th>
                                            <th style={{textAlign: 'right'}}>Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Equipos en campo</td>
                                            <td style={{textAlign: 'right'}}>268</td>
                                            <td style={{textAlign: 'right'}}>418</td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}>+56%</td>
                                        </tr>
                                        <tr>
                                            <td>Copias mensuales</td>
                                            <td style={{textAlign: 'right'}}>527,478</td>
                                            <td style={{textAlign: 'right'}}>822,624</td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}>+56%</td>
                                        </tr>
                                        <tr>
                                            <td>Ingresos mensuales</td>
                                            <td style={{textAlign: 'right'}}>$26,374</td>
                                            <td style={{textAlign: 'right'}}>$41,131</td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}>+56%</td>
                                        </tr>
                                        <tr>
                                            <td>Costos operativos</td>
                                            <td style={{textAlign: 'right'}}>$18,169</td>
                                            <td style={{textAlign: 'right'}}>$25,837</td>
                                            <td style={{textAlign: 'right', color: 'var(--danger)'}}>+42%</td>
                                        </tr>
                                        <tr style={{background: 'var(--bg-card-alt)'}}>
                                            <td><strong>Margen Bruto</strong></td>
                                            <td style={{textAlign: 'right'}}><strong>$8,205</strong></td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}><strong>$15,294</strong></td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}><strong>+86%</strong></td>
                                        </tr>
                                        <tr>
                                            <td>Margen %</td>
                                            <td style={{textAlign: 'right'}}>31.1%</td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}>37.2%</td>
                                            <td style={{textAlign: 'right', color: 'var(--success)'}}>+6.1pp</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Proyección Anual</span>
                            </div>
                            <div className="card-body">
                                <div className="chart-container tall">
                                    <canvas id="proyeccionChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-3" style={{marginTop: '16px'}}>
                        <div className="roi-card alt">
                            <div className="roi-label">INGRESOS ANUALES PROYECTADOS</div>
                            <div className="roi-value" style={{color: 'var(--success)'}}>$493,572</div>
                            <div className="roi-sub">$41,131 × 12 meses</div>
                        </div>
                        <div className="roi-card alt">
                            <div className="roi-label">COSTOS ANUALES PROYECTADOS</div>
                            <div className="roi-value" style={{color: 'var(--warning)'}}>$310,044</div>
                            <div className="roi-sub">$25,837 × 12 meses</div>
                        </div>
                        <div className="roi-card">
                            <div className="roi-label">UTILIDAD ANUAL PROYECTADA</div>
                            <div className="roi-value">$183,528</div>
                            <div className="roi-sub">37.2% margen neto</div>
                        </div>
                    </div>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">📋 Resumen Ejecutivo y Recomendaciones</div>
                    </div>
                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header" style={{background: 'var(--toncan-green)'}}>
                                <span className="card-title" style={{color: 'white'}}>✅ Fortalezas</span>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-success" style={{marginBottom: '8px'}}>
                                    <div className="alert-content">
                                        <h4>ROI excepcional en importaciones</h4>
                                        <p>198% ROI anual con payback de 4.8 meses</p>
                                    </div>
                                </div>
                                <div className="alert alert-success" style={{marginBottom: '8px'}}>
                                    <div className="alert-content">
                                        <h4>Clientes de alta eficiencia</h4>
                                        <p>F. Stanzione genera 31,521 cop/eq - 16x el promedio</p>
                                    </div>
                                </div>
                                <div className="alert alert-success" style={{marginBottom: '0'}}>
                                    <div className="alert-content">
                                        <h4>Margen saludable</h4>
                                        <p>31.1% actual, proyectable a 37.2%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header" style={{background: 'var(--warning)'}}>
                                <span className="card-title" style={{color: 'white'}}>⚠️ Áreas de Atención</span>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-warning" style={{marginBottom: '8px'}}>
                                    <div className="alert-content">
                                        <h4>Capacidad técnica al límite</h4>
                                        <p>59.7 eq/técnico proyectado - contratar 2-3 técnicos</p>
                                    </div>
                                </div>
                                <div className="alert alert-warning" style={{marginBottom: '8px'}}>
                                    <div className="alert-content">
                                        <h4>Clientes de bajo rendimiento</h4>
                                        <p>La Ceiba, Pto Seco, Gente Creativa - evaluar renegociación</p>
                                    </div>
                                </div>
                                <div className="alert alert-info" style={{marginBottom: '0'}}>
                                    <div className="alert-content">
                                        <h4>Concentración en Bolipuertos</h4>
                                        <p>60.6% de ingresos - diversificar cartera</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </body>
    </html>