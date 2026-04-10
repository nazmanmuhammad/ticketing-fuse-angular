<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Resolved</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
        }
        .ticket-number {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
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
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background-color: #d1fae5;
            color: #065f46;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .info-box p {
            color: #78350f;
            font-size: 14px;
            margin: 0;
        }
        .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .success-box p {
            color: #065f46;
            font-size: 14px;
            margin: 0;
        }
        .action-required {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .action-required h3 {
            color: #92400e;
            font-size: 18px;
            margin-bottom: 12px;
        }
        .action-required p {
            color: #78350f;
            font-size: 14px;
            margin-bottom: 16px;
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
            color: #10b981;
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }
        .checkmark {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h1>Ticket Resolved!</h1>
            <p>Your support ticket has been successfully resolved</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hello {{ $ticket->name }},
            </div>

            <div class="success-box">
                <p><strong>✓ Good news!</strong> Your support ticket has been resolved by our technical team.</p>
            </div>

            <div class="message">
                We're pleased to inform you that your ticket has been successfully resolved. Our technical team has completed the work and the issue should now be fixed.
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
                        <div class="detail-label">Status:</div>
                        <div class="detail-value">
                            <span class="status-badge">Resolved</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Created:</div>
                        <div class="detail-value">{{ $ticket->created_at->format('F d, Y H:i') }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Resolved:</div>
                        <div class="detail-value">{{ now()->format('F d, Y H:i') }}</div>
                    </div>
                    @if($ticket->pic_technical)
                    <div class="detail-row">
                        <div class="detail-label">Resolved By:</div>
                        <div class="detail-value">{{ $ticket->pic_technical->name }}</div>
                    </div>
                    @endif
                </div>
            </div>

            <!-- Action Required Box -->
            <div class="action-required">
                <h3>⚠️ Action Required</h3>
                <p>Please review the resolution and close the ticket if you're satisfied with the solution. If the issue persists or you need further assistance, you can reopen the ticket.</p>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <p><strong>What's next?</strong> Please verify that the issue has been resolved. If everything is working correctly, you can close the ticket. If you still experience issues, feel free to reopen it or add a comment.</p>
            </div>

            <!-- Button -->
            <div class="button-container">
                <a href="{{ config('app.frontend_url') }}/tickets/{{ $ticket->id }}" class="button">
                    View Ticket & Close
                </a>
            </div>

            <div class="message">
                Thank you for using our support system. If you have any questions or concerns, please don't hesitate to contact us.
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
