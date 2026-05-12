<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Assigned to Team</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .ticket-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .ticket-info h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            width: 140px;
            color: #6c757d;
        }
        .info-value {
            flex: 1;
            color: #333;
        }
        .priority {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .priority-0 { background: #d1ecf1; color: #0c5460; }
        .priority-1 { background: #fff3cd; color: #856404; }
        .priority-2 { background: #f8d7da; color: #721c24; }
        .priority-3 { background: #f5c6cb; color: #721c24; }
        .priority-4 { background: #dc3545; color: white; }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .cta-button:hover {
            background: #5568d3;
        }
        .team-notice {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .team-notice strong {
            color: #1976D2;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Ticket Available for Your Team</h1>
    </div>
    
    <div class="content">
        <p>Hi <strong>{{ $teamMember->name }}</strong>,</p>
        
        <div class="team-notice">
            <strong>📢 Team Assignment</strong><br>
            A new ticket has been assigned to your team <strong>{{ $ticket->team->name ?? 'N/A' }}</strong>. 
            This ticket is now available in the team pool and can be claimed by any team member.
        </div>

        <div class="ticket-info">
            <h2>Ticket Details</h2>
            
            <div class="info-row">
                <div class="info-label">Ticket Number:</div>
                <div class="info-value"><strong>{{ $ticket->ticket_number }}</strong></div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Subject:</div>
                <div class="info-value">{{ $ticket->subject_issue }}</div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Requester:</div>
                <div class="info-value">{{ $ticket->name }} ({{ $ticket->email }})</div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Department:</div>
                <div class="info-value">{{ $ticket->department->name ?? 'N/A' }}</div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Priority:</div>
                <div class="info-value">
                    @php
                        $priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency'];
                        $priority = $ticket->priority ?? 1;
                    @endphp
                    <span class="priority priority-{{ $priority }}">
                        {{ $priorities[$priority] ?? 'Medium' }}
                    </span>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Help Topic:</div>
                <div class="info-value">{{ $ticket->help_topic }}</div>
            </div>
            
            <div class="info-row">
                <div class="info-label">Team:</div>
                <div class="info-value"><strong>{{ $ticket->team->name ?? 'N/A' }}</strong></div>
            </div>
        </div>

        <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Issue Description:</strong>
            <p style="margin: 10px 0 0 0; color: #555;">{{ $ticket->issue_detail }}</p>
        </div>

        <div style="text-align: center;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:4200') }}/tickets/detail/{{ $ticket->id }}" class="cta-button">
                👀 View Ticket & Claim
            </a>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
            <strong>💡 Quick Action:</strong> Click "Assign to Me" in the ticket list or detail page to claim this ticket and start working on it.
        </p>

        <div class="footer">
            <p>This is an automated notification from the Ticketing System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
