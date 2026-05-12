<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tiket Ditugaskan ke Tim</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 40px 30px; color: #fff; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .logo-text { font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 15px; color: #4b5563; margin-bottom: 25px; line-height: 1.6; }
        .greeting strong { color: #1f2937; font-weight: 600; }
        .team-badge { background: #f3e8ff; border: 2px solid #a78bfa; border-radius: 8px; padding: 16px; margin-bottom: 25px; text-align: center; }
        .team-icon { font-size: 32px; margin-bottom: 8px; }
        .team-name { font-size: 18px; font-weight: 700; color: #7c3aed; }
        .team-desc { font-size: 13px; color: #6b7280; margin-top: 4px; }
        .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 25px; }
        .info-header { background: #7c3aed; color: #fff; padding: 12px 20px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; }
        .info-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .info-content { padding: 20px; }
        .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { flex: 0 0 140px; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
        .info-value { flex: 1; font-size: 14px; color: #1f2937; font-weight: 500; }
        .highlight { color: #7c3aed; font-weight: 600; }
        .user-badge { display: inline-flex; align-items: center; gap: 8px; }
        .avatar { width: 28px; height: 28px; background: #a78bfa; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
        .user-name { font-weight: 600; color: #1f2937; }
        .user-dept { font-size: 12px; color: #6b7280; display: block; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .priority-high { background: #fef3c7; color: #92400e; }
        .priority-critical { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #dbeafe; color: #1e40af; }
        .priority-low { background: #f3f4f6; color: #4b5563; }
        .deadline { color: #dc2626; font-weight: 600; }
        .desc-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 25px; }
        .desc-title { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 10px; font-weight: 600; }
        .desc-text { font-size: 14px; color: #4b5563; line-height: 1.7; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 10px 0 25px 0; box-shadow: 0 4px 6px rgba(124,58,237,0.2); }
        .footer { background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
        .footer-link { color: #7c3aed; text-decoration: none; font-weight: 500; }
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
            <div class="title">Tiket baru untuk tim Anda</div>
            <div class="subtitle">{{ \Carbon\Carbon::now()->locale('id')->isoFormat('dddd, D MMMM YYYY') }} - dikirim otomatis oleh sistem</div>
        </div>

        <div class="content">
            <p class="greeting">
                Halo <strong>{{ $recipientName }}</strong>, sebuah tiket telah ditugaskan ke tim Anda. Anggota tim dapat mengklaim tiket ini untuk mengerjakannya.
            </p>

            <div class="team-badge">
                <div class="team-icon">👥</div>
                <div class="team-name">{{ $ticket->team->name ?? 'Tim' }}</div>
                <div class="team-desc">Tiket tersedia untuk diklaim oleh anggota tim</div>
            </div>

            <div class="info-box">
                <div class="info-header">
                    <span>INFORMASI TIKET</span>
                    <span class="info-badge">TEAM</span>
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
                        <div class="info-label">REQUESTER</div>
                        <div class="info-value">
                            <div class="user-badge">
                                <div class="avatar">{{ strtoupper(substr($ticket->name, 0, 2)) }}</div>
                                <div>
                                    <span class="user-name">{{ $ticket->name }}</span>
                                    <span class="user-dept">{{ $ticket->requester->division ?? 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">PRIORITAS</div>
                        <div class="info-value">
                            @php
                                $priorityClass = 'priority-low';
                                $priorityText = 'Low';
                                if($ticket->priority == 5) { $priorityClass = 'priority-critical'; $priorityText = 'Emergency'; }
                                elseif($ticket->priority == 4) { $priorityClass = 'priority-critical'; $priorityText = 'Critical'; }
                                elseif($ticket->priority == 3) { $priorityClass = 'priority-high'; $priorityText = 'High'; }
                                elseif($ticket->priority == 2) { $priorityClass = 'priority-medium'; $priorityText = 'Medium'; }
                            @endphp
                            <span class="priority {{ $priorityClass }}">{{ $priorityText }}</span>
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
                    @if($ticket->end_date)
                    <div class="info-row">
                        <div class="info-label">BATAS WAKTU</div>
                        <div class="info-value deadline">{{ \Carbon\Carbon::parse($ticket->end_date)->locale('id')->isoFormat('D MMMM YYYY, HH:mm') }} WIB</div>
                    </div>
                    @endif
                </div>
            </div>

            @if($ticket->issue_detail)
            <div class="desc-box">
                <div class="desc-title">DESKRIPSI</div>
                <div class="desc-text">{{ $ticket->issue_detail }}</div>
            </div>
            @endif

            <center>
                <a href="{{ config('app.frontend_url') }}/tickets/detail/{{ $ticket->id }}" class="btn">Lihat & Klaim Tiket →</a>
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
