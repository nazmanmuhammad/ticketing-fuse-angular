<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Komentar Baru pada Tiket</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 40px 30px; color: #fff; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .logo-text { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 15px; color: #4b5563; margin-bottom: 25px; line-height: 1.6; }
        .greeting strong { color: #1f2937; font-weight: 600; }
        .comment-box { background: #fff7ed; border-left: 4px solid #f97316; border-radius: 6px; padding: 20px; margin-bottom: 25px; }
        .comment-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .comment-avatar { width: 40px; height: 40px; background: #f97316; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 600; }
        .comment-meta { flex: 1; }
        .comment-author { font-weight: 700; color: #1f2937; font-size: 15px; }
        .comment-time { font-size: 12px; color: #6b7280; }
        .comment-text { font-size: 14px; color: #4b5563; line-height: 1.7; padding: 12px; background: #fff; border-radius: 4px; margin-top: 12px; }
        .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 25px; }
        .info-header { background: #ea580c; color: #fff; padding: 12px 20px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
        .info-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .info-content { padding: 20px; }
        .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { flex: 0 0 140px; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
        .info-value { flex: 1; font-size: 14px; color: #1f2937; font-weight: 500; }
        .highlight { color: #ea580c; font-weight: 600; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 10px 0 25px 0; box-shadow: 0 4px 6px rgba(234,88,12,0.2); }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
        .footer-link { color: #f97316; text-decoration: none; font-weight: 500; }
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
            <div class="title">Komentar baru pada tiket</div>
            <div class="subtitle">{{ \Carbon\Carbon::parse($comment->created_at)->locale('id')->isoFormat('dddd, D MMMM YYYY') }} - dikirim otomatis oleh sistem</div>
        </div>

        <div class="content">
            <p class="greeting">
                Halo <strong>{{ $recipientName }}</strong>, ada komentar baru pada tiket yang Anda ikuti. Silakan tinjau dan berikan tanggapan jika diperlukan.
            </p>

            <div class="comment-box">
                <div class="comment-header">
                    <div class="comment-avatar">{{ strtoupper(substr($comment->user->name ?? 'U', 0, 2)) }}</div>
                    <div class="comment-meta">
                        <div class="comment-author">{{ $comment->user->name ?? 'User' }}</div>
                        <div class="comment-time">{{ \Carbon\Carbon::parse($comment->created_at)->locale('id')->isoFormat('D MMMM YYYY, HH:mm') }} WIB</div>
                    </div>
                </div>
                <div class="comment-text">{{ $comment->comment }}</div>
            </div>

            <div class="info-box">
                <div class="info-header">
                    <span>INFORMASI TIKET</span>
                    <span class="info-badge">COMMENT</span>
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
                        <div class="info-label">STATUS</div>
                        <div class="info-value">
                            @php
                                $statusText = 'Pending';
                                if($ticket->status == 1) $statusText = 'Processing';
                                elseif($ticket->status == 2) $statusText = 'Resolved';
                                elseif($ticket->status == 3) $statusText = 'Closed';
                                elseif($ticket->status == 4) $statusText = 'Cancelled';
                            @endphp
                            {{ $statusText }}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">KATEGORI</div>
                        <div class="info-value">{{ $ticket->help_topic ?? 'General' }}</div>
                    </div>
                </div>
            </div>

            <center>
                <a href="{{ config('app.frontend_url') }}/tickets/detail/{{ $ticket->id }}" class="btn">Lihat & Balas Komentar →</a>
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
