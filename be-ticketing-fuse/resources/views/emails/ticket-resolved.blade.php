<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiket Terselesaikan</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; color: #fff; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .logo-text { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 15px; color: #4b5563; margin-bottom: 25px; line-height: 1.6; }
        .greeting strong { color: #1f2937; font-weight: 600; }
        .success-badge { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 25px; text-align: center; }
        .success-icon { font-size: 48px; margin-bottom: 12px; }
        .success-text { font-size: 18px; font-weight: 700; color: #059669; margin-bottom: 4px; }
        .success-desc { font-size: 13px; color: #6b7280; }
        .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 25px; }
        .info-header { background: #059669; color: #fff; padding: 12px 20px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
        .info-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .info-content { padding: 20px; }
        .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { flex: 0 0 140px; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
        .info-value { flex: 1; font-size: 14px; color: #1f2937; font-weight: 500; }
        .highlight { color: #059669; font-weight: 600; }
        .user-badge { display: inline-flex; align-items: center; gap: 8px; }
        .avatar { width: 28px; height: 28px; background: #10b981; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .user-name { font-weight: 600; color: #1f2937; }
        .user-dept { font-size: 12px; color: #6b7280; display: block; }
        .desc-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 25px; }
        .desc-title { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 10px; font-weight: 600; }
        .desc-text { font-size: 14px; color: #4b5563; line-height: 1.7; }
        .btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 10px 0 25px 0; box-shadow: 0 4px 6px rgba(5,150,105,0.2); }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
        .footer-link { color: #10b981; text-decoration: none; font-weight: 500; }
        .footer-brand { margin-top: 15px; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon">✚</div>
                <div class="logo-text">Ticketing System</div>
            </div>
            <div class="title">Tiket telah diselesaikan</div>
            <div class="subtitle">{{ \Carbon\Carbon::now()->locale('id')->isoFormat('dddd, D MMMM YYYY') }} - dikirim otomatis oleh sistem</div>
        </div>

        <div class="content">
            <p class="greeting">
                Halo <strong>{{ $recipientName }}</strong>, tiket Anda telah diselesaikan oleh tim kami. Terima kasih atas kesabaran Anda.
            </p>

            <div class="success-badge">
                <div class="success-icon">✓</div>
                <div class="success-text">Tiket Terselesaikan</div>
                <div class="success-desc">Masalah Anda telah ditangani dengan baik</div>
            </div>

            <div class="info-box">
                <div class="info-header">
                    <span>INFORMASI TIKET</span>
                    <span class="info-badge">RESOLVED</span>
                </div>
                <div class="info-content">
                    <div class="info-row">
                        <div class="info-label">NO. TIKET</div>
                        <div class="info-value highlight">#{{ $ticket->ticket_number }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">NAMA TUGAS</div>
                        <div class="info-value">{{ $ticket->subject_issue }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">DITANGANI OLEH</div>
                        <div class="info-value">
                            <div class="user-badge">
                                <div class="avatar">{{ $ticket->pic_technical ? strtoupper(substr($ticket->pic_technical->name, 0, 2)) : 'TM' }}</div>
                                <div>
                                    <span class="user-name">{{ $ticket->pic_technical->name ?? 'Tim Support' }}</span>
                                    <span class="user-dept">{{ $ticket->pic_technical->division ?? 'Technical Support' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">KATEGORI</div>
                        <div class="info-value">{{ $ticket->help_topic ?? 'General' }}</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">DIBUAT</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($ticket->created_at)->locale('id')->isoFormat('D MMMM YYYY, HH:mm') }} WIB</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">DISELESAIKAN</div>
                        <div class="info-value highlight">{{ \Carbon\Carbon::now()->locale('id')->isoFormat('D MMMM YYYY, HH:mm') }} WIB</div>
                    </div>
                </div>
            </div>

            @if($ticket->response)
            <div class="desc-box">
                <div class="desc-title">SOLUSI / RESPON</div>
                <div class="desc-text">{{ $ticket->response }}</div>
            </div>
            @endif

            <center>
                <a href="{{ config('app.frontend_url') }}/tickets/detail/{{ $ticket->id }}" class="btn">Lihat Detail Tiket →</a>
            </center>
        </div>

        <div class="footer">
            <p class="footer-text">Email ini dikirim otomatis oleh sistem. Tidak membalas langsung.</p>
            <p class="footer-text">Butuh bantuan? Hubungi <a href="mailto:support@ticketing.id" class="footer-link">support@ticketing.id</a></p>
            <p class="footer-brand">© {{ date('Y') }} Ticketing System</p>
        </div>
    </div>
</body>
</html>
