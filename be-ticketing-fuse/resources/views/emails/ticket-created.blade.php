<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Created</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f7fa;
            padding: 20px;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0E0F6B 0%, #1a1d8f 100%);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
        }
        .header-icon {
            width: 64px;
            height: 64px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .header p {
            font-size: 16px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .ticket-card {
            background-color: #f7fafc;
            border-left: 4px solid #0E0F6B;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
        }
        .ticket-number {
            font-size: 24px;
            font-weight: 700;
            color: #0E0F6B;
            margin-bottom: 16px;
        }
        .ticket-details {
            display: table;
            width: 100%;
        }
        .detail-row {
            display: table-row;
        }
        .detail-label {
            display: table-cell;
            padding: 8px 0;
            font-weight: 600;
            color: #4a5568;
            width: 140px;
        }
        .detail-value {
            display: table-cell;
            padding: 8px 0;
            color: #2d3748;
        }
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-low { background-color: #c6f6d5; color: #22543d; }
        .priority-medium { background-color: #feebc8; color: #7c2d12; }
        .priority-high { background-color: #fed7d7; color: #742a2a; }
        .priority-critical { background-color: #feb2b2; color: #742a2a; }
        .priority-emergency { background-color: #fc8181; color: #742a2a; }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background-color: #bee3f8;
            color: #2c5282;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #0E0F6B 0%, #1a1d8f 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .info-box {
            background-color: #ebf4ff;
            border-left: 4px solid #0E0F6B;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .info-box p {
            color: #1a365d;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #718096;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .footer-links {
            margin-top: 16px;
        }
        .footer-links a {
            color: #0E0F6B;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <h1>Ticket Created Successfully!</h1>
            <p>Your support ticket has been created</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hello {{ $ticket->name }},
            </div>

            <div class="message">
                Thank you for contacting our support team. Your ticket has been successfully created and our team will review it shortly.
            </div>

            <!-- Ticket Card -->
            <div class="ticket-card">
                <div class="ticket-number">#{{ $ticket->ticket_number }}</div>
                
                <div class="ticket-details">
                    <div class="detail-row">
                        <div class="detail-label">Subject:</div>
                        <div class="detail-value">{{ $ticket->subject_issue }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Priority:</div>
                        <div class="detail-value">
                            <span class="priority-badge priority-{{ ['low', 'medium', 'high', 'critical', 'emergency'][$ticket->priority] ?? 'medium' }}">
                                {{ ['Low', 'Medium', 'High', 'Critical', 'Emergency'][$ticket->priority] ?? 'Medium' }}
                            </span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Status:</div>
                        <div class="detail-value">
                            <span class="status-badge">{{ $ticket->status_name }}</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Created:</div>
                        <div class="detail-value">{{ $ticket->created_at->format('F d, Y H:i') }}</div>
                    </div>
                    @if($ticket->issue_detail)
                    <div class="detail-row">
                        <div class="detail-label">Description:</div>
                        <div class="detail-value">{{ Str::limit($ticket->issue_detail, 150) }}</div>
                    </div>
                    @endif
                </div>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <p><strong>What happens next?</strong> Our support team will review your ticket and respond as soon as possible. You will receive email notifications for any updates.</p>
            </div>

            <!-- Button -->
            <div class="button-container">
                <a href="{{ config('app.frontend_url') }}/tickets/{{ $ticket->id }}" class="button">
                    View Ticket Details
                </a>
            </div>

            <div class="message">
                If you have any questions or need immediate assistance, please don't hesitate to contact us.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>SIG Helpdesk Support</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <div class="footer-links">
                <a href="{{ config('app.frontend_url') }}">Visit Portal</a>
                <a href="{{ config('app.frontend_url') }}/help">Help Center</a>
                <a href="{{ config('app.frontend_url') }}/contact">Contact Us</a>
            </div>
        </div>
    </div>
</body>
</html>
