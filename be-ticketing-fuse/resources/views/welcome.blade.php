<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }} — Ticketing API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --green: #00ff87;
            --green-dim: rgba(0,255,135,0.12);
            --green-border: rgba(0,255,135,0.25);
        }

        html, body {
            height: 100%;
        }

        body {
            font-family: 'Syne', sans-serif;
            background: #080b10;
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* ── BACKGROUND EFFECTS ── */
        .bg-glow {
            position: fixed;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0,255,135,0.07) 0%, transparent 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: breathe 4s ease-in-out infinite;
        }

        .bg-glow-2 {
            position: fixed;
            width: 900px;
            height: 900px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(0,120,255,0.04) 0%, transparent 65%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        }

        /* subtle dot grid */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 32px 32px;
            pointer-events: none;
            z-index: 0;
        }

        @keyframes breathe {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50%       { transform: translate(-50%, -50%) scale(1.15); opacity: 0.7; }
        }

        /* ── CARD ── */
        .card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 500px;
            margin: 24px;
            background: linear-gradient(145deg, #0d1117 0%, #0a0e15 100%);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 24px;
            padding: 52px 48px 44px;
            box-shadow:
                0 0 0 1px rgba(0,255,135,0.06),
                0 32px 80px rgba(0,0,0,0.6),
                inset 0 1px 0 rgba(255,255,255,0.05);
            animation: slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(32px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* top accent line */
        .card::before {
            content: '';
            position: absolute;
            top: -1px;
            left: 20%;
            right: 20%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--green), transparent);
            border-radius: 2px;
        }

        /* ── TOP ROW ── */
        .top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 40px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .brand-icon {
            width: 36px;
            height: 36px;
            background: var(--green-dim);
            border: 1px solid var(--green-border);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .brand-icon svg { color: var(--green); }

        .brand-name {
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
        }

        .pill-connected {
            display: flex;
            align-items: center;
            gap: 7px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 500;
            color: var(--green);
            background: var(--green-dim);
            border: 1px solid var(--green-border);
            border-radius: 100px;
            padding: 6px 14px;
            letter-spacing: 0.06em;
        }

        .pill-dot {
            width: 7px;
            height: 7px;
            background: var(--green);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--green);
            animation: blink 2s ease-in-out infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; box-shadow: 0 0 8px var(--green); }
            50%       { opacity: 0.5; box-shadow: 0 0 3px var(--green); }
        }

        /* ── MAIN STATUS ── */
        .status-section {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 36px;
            padding-bottom: 36px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .check-ring {
            flex-shrink: 0;
            position: relative;
            width: 80px;
            height: 80px;
        }

        .check-ring-outer {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 1px solid var(--green-border);
            animation: spin-slow 8s linear infinite;
            background: conic-gradient(from 0deg, transparent 60%, rgba(0,255,135,0.15) 100%);
        }

        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        .check-ring-inner {
            position: absolute;
            inset: 8px;
            background: var(--green-dim);
            border: 1px solid var(--green-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .check-ring-inner svg { color: var(--green); }

        .status-text h1 {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            line-height: 1.1;
            margin-bottom: 6px;
            color: #fff;
        }

        .status-text p {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: rgba(255,255,255,0.3);
            line-height: 1.6;
        }

        /* ── META TABLE ── */
        .meta {
            display: flex;
            flex-direction: column;
            gap: 0;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 13px 18px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            transition: background 0.15s;
        }

        .meta-row:last-child { border-bottom: none; }
        .meta-row:hover { background: rgba(255,255,255,0.02); }

        .meta-key {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: rgba(255,255,255,0.25);
        }

        .meta-val {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: rgba(255,255,255,0.55);
        }

        .meta-val.green {
            color: var(--green);
            font-weight: 500;
        }

        .meta-val .dot-inline {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: var(--green);
            border-radius: 50%;
            margin-right: 6px;
            box-shadow: 0 0 6px var(--green);
            animation: blink 2s ease-in-out infinite;
            vertical-align: middle;
        }

        /* ── FOOTER NOTE ── */
        .footer-note {
            margin-top: 28px;
            text-align: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: rgba(255,255,255,0.12);
            letter-spacing: 0.05em;
        }
    </style>
</head>
<body>

    <div class="bg-glow-2"></div>
    <div class="bg-glow"></div>

    <div class="card">

        <!-- TOP ROW -->
        <div class="top-row">
            <div class="brand">
                <div class="brand-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 10v3M6 6v12M10 3v18M14 8v8M18 6v12M22 10v4"/>
                    </svg>
                </div>
                <span class="brand-name">TicketFlow</span>
            </div>
            <div class="pill-connected">
                <span class="pill-dot"></span>
                CONNECTED
            </div>
        </div>

        <!-- MAIN STATUS -->
        <div class="status-section">
            <div class="check-ring">
                <div class="check-ring-outer"></div>
                <div class="check-ring-inner">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
            </div>
            <div class="status-text">
                <h1>Ticketing API<br>is Connected</h1>
                <p>Layanan aktif &amp; siap<br>menerima permintaan.</p>
            </div>
        </div>

        <!-- META -->
        <div class="meta">
            <div class="meta-row">
                <span class="meta-key">status</span>
                <span class="meta-val green"><span class="dot-inline"></span>connected</span>
            </div>
            <div class="meta-row">
                <span class="meta-key">service</span>
                <span class="meta-val">ticketing-api</span>
            </div>
            <div class="meta-row">
                <span class="meta-key">version</span>
                <span class="meta-val">v1.0.0</span>
            </div>
            <div class="meta-row">
                <span class="meta-key">environment</span>
                <span class="meta-val">{{ app()->environment() }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-key">timestamp</span>
                <span class="meta-val">{{ now()->toIso8601String() }}</span>
            </div>
        </div>

        <div class="footer-note">{{ config('app.name') }} · {{ now()->format('Y') }}</div>

    </div>

</body>
</html>
