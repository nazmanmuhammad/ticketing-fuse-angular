<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class TeamsExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize
{
    public function __construct(private readonly Collection $rows)
    {
    }

    public function collection(): Collection
    {
        return $this->rows->map(function ($item) {
            $members = $item->teamUsers
                ->map(fn ($teamUser) => $teamUser->user?->name)
                ->filter()
                ->implode(', ');

            return [
                $item->id,
                $item->name,
                $item->description,
                $members,
                (int) ($item->status ?? 1) === 1 ? 'Active' : 'Inactive',
                $item->created_at,
            ];
        });
    }

    public function headings(): array
    {
        return ['ID', 'Name', 'Description', 'Members', 'Status', 'Created At'];
    }

    public function styles(Worksheet $sheet): array
    {
        $sheet->getStyle('A1:F1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('0E0F6B');
        $sheet->getStyle('A1:F1')->getFont()->getColor()->setRGB('FFFFFF');
        return [];
    }
}
