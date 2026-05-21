<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Request Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0E0F6B; padding: 30px; text-align: center;">
                            <img src="{{ $message->embed($logoPath) }}" alt="{{ $appSettings->app_name ?? 'WorkDesk' }}" style="height: 40px;">
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Access Request Created</h1>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                                Hello <strong>{{ $accessRequest->name }}</strong>,
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                Your access request has been successfully created and is now being processed by our team.
                            </p>

                            <!-- Request Details Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Request Number:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: bold;">{{ $accessRequest->request_number }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Resource Name:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: bold;">{{ $accessRequest->resource_name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Request Type:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->request_type }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Access Level:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->access_level }}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Duration Type:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->duration_type }}</td>
                                            </tr>
                                            @if($accessRequest->start_date)
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Start Date:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->start_date->format('d M Y') }}</td>
                                            </tr>
                                            @endif
                                            @if($accessRequest->end_date)
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">End Date:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->end_date->format('d M Y') }}</td>
                                            </tr>
                                            @endif
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Status:</td>
                                                <td style="padding: 8px 0;">
                                                    <span style="background-color: #FFA500; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                                        {{ $accessRequest->status_name }}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Created:</td>
                                                <td style="padding: 8px 0; color: #333333; font-size: 14px;">{{ $accessRequest->created_at->format('d M Y, H:i') }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                                You will receive updates via email as your request progresses. If you have any questions, please contact our support team.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td style="border-radius: 4px; background-color: #0E0F6B;">
                                        <a href="{{ config('app.frontend_url') }}/access-requests/{{ $accessRequest->id }}" 
                                           style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                                            View Request Details
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <img src="{{ $message->embed($sigLogoPath) }}" alt="SIG" style="height: 60px; margin-bottom: 15px;">
                            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                                © {{ date('Y') }} {{ $appSettings->app_title ?? 'Semen Indonesia Group' }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
