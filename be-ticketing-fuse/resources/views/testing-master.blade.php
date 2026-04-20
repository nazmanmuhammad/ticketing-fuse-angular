<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testing Master Data</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 8px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.2);
            padding: 15px 20px;
            border-radius: 6px;
            backdrop-filter: blur(10px);
        }
        
        .stat-card .label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .stat-card .value {
            font-size: 24px;
            font-weight: bold;
        }
        
        .content {
            padding: 30px;
        }
        
        .matrix-section {
            margin-bottom: 40px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .matrix-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 2px solid #667eea;
        }
        
        .matrix-title {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
        }
        
        .matrix-info {
            display: flex;
            gap: 20px;
            font-size: 13px;
            color: #666;
        }
        
        .matrix-info span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-liquid {
            background: #e3f2fd;
            color: #1976d2;
        }
        
        .badge-solid {
            background: #fff3e0;
            color: #f57c00;
        }
        
        .badge-food {
            background: #e8f5e9;
            color: #388e3c;
        }
        
        .badge-water {
            background: #e1f5fe;
            color: #0277bd;
        }
        
        .table-wrapper {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        
        thead {
            background: #f8f9fa;
        }
        
        th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #555;
            border-bottom: 2px solid #dee2e6;
            white-space: nowrap;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: top;
        }
        
        tbody tr:hover {
            background: #f8f9fa;
        }
        
        .method-name {
            font-weight: 500;
            color: #333;
        }
        
        .parameter-name {
            color: #667eea;
            font-weight: 500;
        }
        
        .team-badge {
            display: inline-block;
            padding: 4px 8px;
            background: #e3f2fd;
            color: #1976d2;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        
        .loading {
            text-align: center;
            padding: 60px 20px;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 20px;
            border-radius: 6px;
            margin: 20px;
        }
        
        .export-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }
        
        .export-btn:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
        }
        
        .export-btn svg {
            width: 18px;
            height: 18px;
        }
        
        .actions-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .actions-bar h2 {
            font-size: 18px;
            color: #333;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Testing Master Data</h1>
            <p>Comprehensive testing methods and parameters grouped by matrix</p>
            
            @if(isset($data['status']) && $data['status'])
                <div class="stats">
                    <div class="stat-card">
                        <div class="label">Total Matrix</div>
                        <div class="value">{{ count($data['data']) }}</div>
                    </div>
                    <div class="stat-card">
                        <div class="label">Total Items</div>
                        <div class="value">{{ collect($data['data'])->sum(fn($m) => count($m['items'])) }}</div>
                    </div>
                    @if(isset($data['cached_at']))
                    <div class="stat-card">
                        <div class="label">Cached At</div>
                        <div class="value" style="font-size: 14px;">{{ $data['cached_at'] }}</div>
                    </div>
                    @endif
                </div>
            @endif
        </div>
        
        @if(isset($data['status']) && $data['status'] && !empty($data['data']))
            <div class="actions-bar">
                <h2>Data Overview</h2>
                <a href="{{ url('testing/export') }}" class="export-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Export to Excel
                </a>
            </div>
        @endif
        
        <div class="content">
            @if(!isset($data['status']) || !$data['status'])
                <div class="error">
                    <strong>Error:</strong> {{ $data['message'] ?? 'Failed to load data' }}
                </div>
            @elseif(empty($data['data']))
                <div class="no-data">
                    <p>No data available</p>
                </div>
            @else
                @foreach($data['data'] as $matrix)
                    <div class="matrix-section">
                        <div class="matrix-header">
                            <div class="matrix-title">{{ $matrix['matrix_name'] }}</div>
                            <div class="matrix-info">
                                @if($matrix['matrix_eng'])
                                    <span>🌐 {{ $matrix['matrix_eng'] }}</span>
                                @endif
                                @if($matrix['matrix_form'])
                                    <span class="badge badge-{{ strtolower($matrix['matrix_form']) }}">
                                        {{ $matrix['matrix_form'] }}
                                    </span>
                                @endif
                                @if($matrix['matrix_type'])
                                    <span class="badge badge-{{ strtolower($matrix['matrix_type']) }}">
                                        {{ $matrix['matrix_type'] }}
                                    </span>
                                @endif
                                <span>📊 {{ count($matrix['items']) }} items</span>
                            </div>
                        </div>
                        
                        <div class="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">#</th>
                                        <th>Method Name</th>
                                        <th>Parameter</th>
                                        <th>Testing Group</th>
                                        <th>Lab Team</th>
                                        <th>Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($matrix['items'] as $index => $item)
                                        <tr>
                                            <td>{{ $index + 1 }}</td>
                                            <td>
                                                <div class="method-name">{{ $item['method_name'] ?? '-' }}</div>
                                                @if(isset($item['method_title']) && $item['method_title'])
                                                    <div style="font-size: 11px; color: #999; margin-top: 4px;">
                                                        {{ $item['method_title'] }}
                                                    </div>
                                                @endif
                                            </td>
                                            <td>
                                                <div class="parameter-name">{{ $item['parameter_name'] ?? '-' }}</div>
                                                @if(isset($item['parameter_eng']) && $item['parameter_eng'])
                                                    <div style="font-size: 11px; color: #999; margin-top: 4px;">
                                                        {{ $item['parameter_eng'] }}
                                                    </div>
                                                @endif
                                            </td>
                                            <td>{{ $item['testing_group_name'] ?? '-' }}</td>
                                            <td>
                                                @if(isset($item['lab_team_name']))
                                                    <span class="team-badge">
                                                        {{ $item['lab_team_abb'] ?? $item['lab_team_name'] }}
                                                    </span>
                                                @else
                                                    -
                                                @endif
                                            </td>
                                            <td>
                                                @if(isset($item['method_reference']) && isset($item['method_reference_no']))
                                                    {{ $item['method_reference'] }} {{ $item['method_reference_no'] }}
                                                    @if(isset($item['method_year']))
                                                        :{{ $item['method_year'] }}
                                                    @endif
                                                @else
                                                    -
                                                @endif
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                @endforeach
            @endif
        </div>
    </div>
</body>
</html>
