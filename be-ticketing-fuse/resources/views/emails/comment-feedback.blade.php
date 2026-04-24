<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Feedback - {{ $ticket['ticket_number'] }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .ticket-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
        }
        .ticket-info h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
            min-width: 120px;
        }
        .info-value {
            color: #6c757d;
            flex: 1;
            text-align: right;
        }
        .new-comment {
            background-color: #e8f5e8;
            border: 1px solid #c3e6c3;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .new-comment h3 {
            margin-top: 0;
            color: #155724;
            font-size: 16px;
        }
        .comment-meta {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 10px;
        }
        .comment-text {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #d4edda;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .attachments {
            margin-top: 15px;
        }
        .attachment-item {
            background-color: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 5px 0;
            border: 1px solid #dee2e6;
            font-size: 14px;
        }
        .comments-history {
            margin-top: 30px;
        }
        .comments-history h3 {
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 10px;
        }
        .comment-item {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 3px solid #6c757d;
        }
        .comment-header {
            font-size: 12px;
            color: #6c757d;
            margin-bottom: 8px;
        }
        .comment-body {
            background-color: white;
            padding: 12px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-process { background-color: #cce5ff; color: #004085; }
        .status-resolved { background-color: #d4edda; color: #155724; }
        .status-closed { background-color: #d1ecf1; color: #0c5460; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .priority-low { background-color: #e2e3e5; color: #383d41; }
        .priority-medium { background-color: #cce5ff; color: #004085; }
        .priority-high { background-color: #fff3cd; color: #856404; }
        .priority-critical { background-color: #f5c6cb; color: #721c24; }
        .priority-emergency { background-color: #d1ecf1; color: #0c5460; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .container { padding: 20px; }
            .info-row { flex-direction: column; }
            .info-value { text-align: left; margin-top: 5px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Feedback</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket #{{ $ticket['ticket_number'] }}</p>
        </div>

        <div class="ticket-info">
            <h2>📋 Ticket Information</h2>
            <div class="info-row">
                <span class="info-label">Ticket Number:</span>
                <span class="info-value"><strong>{{ $ticket['ticket_number'] }}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">{{ $ticket['subject_issue'] }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">
                    @php
                        $statusClass = match($ticket['status']) {
                            0 => 'status-pending',
                            1 => 'status-process', 
                            2 => 'status-resolved',
                            3 => 'status-closed',
                            4 => 'status-cancelled',
                            default => 'status-pending'
                        };
                        $statusText = match($ticket['status']) {
                            0 => 'Pending',
                            1 => 'Process', 
                            2 => 'Resolved',
                            3 => 'Closed',
                            4 => 'Cancelled',
                            default => 'Pending'
                        };
                    @endphp
                    <span class="status-badge {{ $statusClass }}">{{ $statusText }}</span>
                </span>
            </div>
            @if($ticket['priority'] !== null)
            <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value">
                    @php
                        $priorityClass = match($ticket['priority']) {
                            0 => 'priority-low',
                            1 => 'priority-medium',
                            2 => 'priority-high', 
                            3 => 'priority-critical',
                            4 => 'priority-emergency',
                            default => 'priority-low'
                        };
                        $priorityText = match($ticket['priority']) {
                            0 => 'Low',
                            1 => 'Medium',
                            2 => 'High', 
                            3 => 'Critical',
                            4 => 'Emergency',
                            default => 'Low'
                        };
                    @endphp
                    <span class="priority-badge {{ $priorityClass }}">{{ $priorityText }}</span>
                </span>
            </div>
            @endif
            <div class="info-row">
                <span class="info-label">Requester:</span>
                <span class="info-value">{{ $ticket['requester']['name'] ?? 'Unknown' }}</span>
            </div>
            @if($ticket['pic_technical'])
            <div class="info-row">
                <span class="info-label">Technical:</span>
                <span class="info-value">{{ $ticket['pic_technical']['name'] }}</span>
            </div>
            @endif
            @if($ticket['pic_helpdesk'])
            <div class="info-row">
                <span class="info-label">Helpdesk:</span>
                <span class="info-value">{{ $ticket['pic_helpdesk']['name'] }}</span>
            </div>
            @endif
        </div>

        <div class="new-comment">
            <h3>💬 New Comment from {{ $commenter['name'] }}</h3>
            <div class="comment-meta">
                Posted on {{ \Carbon\Carbon::parse($comment['created_at'])->format('F j, Y \a\t g:i A') }}
            </div>
            <div class="comment-text">{{ $comment['comment'] }}</div>
            
            @if(!empty($comment['attachments']))
            <div class="attachments">
                <strong>📎 Attachments:</strong>
                @foreach($comment['attachments'] as $attachment)
                <div class="attachment-item">
                    📄 {{ $attachment['name'] }} 
                    @if($attachment['size'])
                        ({{ number_format($attachment['size'] / 1024, 1) }} KB)
                    @endif
                </div>
                @endforeach
            </div>
            @endif
        </div>

        @if(!empty($allComments) && count($allComments) > 1)
        <div class="comments-history">
            <h3>💭 Comment History</h3>
            @foreach($allComments as $historyComment)
            <div class="comment-item">
                <div class="comment-header">
                    <strong>{{ $historyComment['user']['name'] ?? 'Unknown User' }}</strong> • 
                    {{ \Carbon\Carbon::parse($historyComment['created_at'])->format('M j, Y g:i A') }}
                </div>
                <div class="comment-body">{{ $historyComment['comment'] }}</div>
                
                @if(!empty($historyComment['attachments']))
                <div class="attachments">
                    <strong>📎 Attachments:</strong>
                    @foreach($historyComment['attachments'] as $attachment)
                    <div class="attachment-item">
                        📄 {{ $attachment['name'] }}
                        @if($attachment['size'])
                            ({{ number_format($attachment['size'] / 1024, 1) }} KB)
                        @endif
                    </div>
                    @endforeach
                </div>
                @endif
            </div>
            @endforeach
        </div>
        @endif

        <div class="footer">
            <p>This is an automated notification from the Ticketing System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>