<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Comment on Ticket</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header with Bubbles -->
                    <tr>
                        <td style="background-color: #0E0F6B; padding: 40px 30px; color: #ffffff; position: relative; overflow: hidden;">
                            <!-- Decorative Bubbles -->
                            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background-color: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                            <div style="position: absolute; top: 50px; right: 100px; width: 150px; height: 150px; background-color: rgba(255,255,255,0.08); border-radius: 50%;"></div>
                            <div style="position: absolute; bottom: -30px; right: 50px; width: 100px; height: 100px; background-color: rgba(255,255,255,0.06); border-radius: 50%;"></div>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="position: relative; z-index: 1;">
                                <tr>
                                    <td>
                                        <img src="{{ $logoUrl }}" alt="{{ $appSettings->app_name ?? 'Helpdesk' }}" style="height: 40px; display: block; margin-bottom: 20px;" />
                                        <h1 style="margin: 20px 0 8px 0; font-size: 24px; font-weight: 700;">New comment on ticket</h1>
                                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">{{ \Carbon\Carbon::parse($comment['created_at'])->format('l, d F Y') }} - sent automatically by system</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin: 0 0 25px 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                                Hello <strong style="color: #1f2937;">{{ $recipientName }}</strong>, there is a new comment on a ticket you are following. Please review and respond if necessary.
                            </p>

                            <!-- Comment Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-left: 4px solid #0E0F6B; border-radius: 6px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding-right: 8px; vertical-align: middle;">
                                                                <div style="width: 32px; height: 32px; background-color: #0E0F6B; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600;">
                                                                    {{ strtoupper(substr($comment['user']['name'] ?? 'User', 0, 2)) }}
                                                                </div>
                                                            </td>
                                                            <td style="vertical-align: middle;">
                                                                <div style="font-weight: 700; color: #1f2937; font-size: 15px; margin-bottom: 2px;">{{ $comment['user']['name'] ?? 'User' }}</div>
                                                                <div style="font-size: 12px; color: #6b7280;">{{ \Carbon\Carbon::parse($comment['created_at'])->format('d F Y, H:i') }} WIB</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <div style="font-size: 14px; color: #4b5563; line-height: 1.7; padding: 12px; background: #fff; border-radius: 4px; margin-top: 12px;">
                                            {{ $comment['comment'] }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 25px; overflow: hidden;">
                                <tr>
                                    <td style="background-color: #0E0F6B; color: #ffffff; padding: 12px 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="font-weight: 600; font-size: 13px; text-transform: uppercase;">TICKET INFORMATION</td>
                                                <td align="right">
                                                    <span style="background-color: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block;">COMMENT</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="12" cellspacing="0">
                                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                                <td width="140" style="font-size: 13px; color: #9ca3af; text-transform: uppercase; vertical-align: top;">TICKET NO.</td>
                                                <td style="font-size: 14px; color: #0E0F6B; font-weight: 600;">#{{ $ticket['ticket_number'] }}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                                <td width="140" style="font-size: 13px; color: #9ca3af; text-transform: uppercase; vertical-align: top;">TASK NAME</td>
                                                <td style="font-size: 14px; color: #1f2937; font-weight: 500;">{{ $ticket['subject_issue'] }}</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                                <td width="140" style="font-size: 13px; color: #9ca3af; text-transform: uppercase; vertical-align: top;">STATUS</td>
                                                <td style="font-size: 14px; color: #1f2937; font-weight: 500;">
                                                    @php
                                                        $statusText = 'Pending';
                                                        if($ticket['status'] == 1) $statusText = 'Processing';
                                                        elseif($ticket['status'] == 2) $statusText = 'Resolved';
                                                        elseif($ticket['status'] == 3) $statusText = 'Closed';
                                                        elseif($ticket['status'] == 4) $statusText = 'Cancelled';
                                                    @endphp
                                                    {{ $statusText }}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="140" style="font-size: 13px; color: #9ca3af; text-transform: uppercase; vertical-align: top;">CATEGORY</td>
                                                <td style="font-size: 14px; color: #1f2937; font-weight: 500;">{{ $ticket['help_topic'] ?? 'General' }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 25px 0;">
                                        <a href="{{ config('app.frontend_url') }}/tickets/detail/{{ $ticket['id'] }}" style="display: inline-block; background-color: #0E0F6B; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">View & Reply Comment →</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0E0F6B; padding: 40px 30px; color: #ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 25px;">
                                        <img src="{{ $sigLogoUrl }}" alt="SIG Logo" style="height: 60px; display: block; margin: 0 auto;" />
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 25px; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;">{{ $appSettings->app_title ?? 'SIG Helpdesk' }}</p>
                                        <p style="margin: 0 0 15px 0; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.6;">Streamline your support workflow with our comprehensive ticketing solution.<br/>Manage, track, and resolve issues efficiently.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 15px; text-align: center;">
                                        <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.5);">© {{ date('Y') }} {{ $appSettings->app_title ?? 'SIG Helpdesk' }}. All Rights Reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
