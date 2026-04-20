<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class TestingMasterExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        $rows = collect();
        
        foreach ($this->data as $matrix) {
            foreach ($matrix['items'] as $item) {
                $rows->push([
                    'matrix_name' => $matrix['matrix_name'],
                    'matrix_eng' => $matrix['matrix_eng'] ?? '-',
                    'matrix_form' => $matrix['matrix_form'] ?? '-',
                    'matrix_type' => $matrix['matrix_type'] ?? '-',
                    'method_name' => $item['method_name'] ?? '-',
                    'method_title' => $item['method_title'] ?? '-',
                    'method_reference' => $item['method_reference'] ?? '-',
                    'method_reference_no' => $item['method_reference_no'] ?? '-',
                    'method_year' => $item['method_year'] ?? '-',
                    'method_sub' => $item['method_sub'] ?? '-',
                    'method_sub_no' => $item['method_sub_no'] ?? '-',
                    'parameter_name' => $item['parameter_name'] ?? '-',
                    'parameter_eng' => $item['parameter_eng'] ?? '-',
                    'testing_group_name' => $item['testing_group_name'] ?? '-',
                    'lab_team_name' => $item['lab_team_name'] ?? '-',
                    'lab_team_abb' => $item['lab_team_abb'] ?? '-',
                ]);
            }
        }
        
        return $rows;
    }

    public function headings(): array
    {
        return [
            'Matrix Name',
            'Matrix English',
            'Matrix Form',
            'Matrix Type',
            'Method Name',
            'Method Title',
            'Method Reference',
            'Method Reference No',
            'Method Year',
            'Method Sub',
            'Method Sub No',
            'Parameter Name',
            'Parameter English',
            'Testing Group',
            'Lab Team Name',
            'Lab Team Abbreviation',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style header row
        $sheet->getStyle('A1:P1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '667eea'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Auto-filter
        $sheet->setAutoFilter('A1:P1');

        // Freeze first row
        $sheet->freezePane('A2');

        // Style data rows
        $lastRow = $sheet->getHighestRow();
        $sheet->getStyle('A2:P' . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_TOP,
                'wrapText' => true,
            ],
        ]);

        // Set row height for header
        $sheet->getRowDimension(1)->setRowHeight(25);

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25, // Matrix Name
            'B' => 25, // Matrix English
            'C' => 15, // Matrix Form
            'D' => 15, // Matrix Type
            'E' => 35, // Method Name
            'F' => 30, // Method Title
            'G' => 15, // Method Reference
            'H' => 20, // Method Reference No
            'I' => 12, // Method Year
            'J' => 15, // Method Sub
            'K' => 15, // Method Sub No
            'L' => 25, // Parameter Name
            'M' => 25, // Parameter English
            'N' => 25, // Testing Group
            'O' => 25, // Lab Team Name
            'P' => 15, // Lab Team Abb
        ];
    }

    public function title(): string
    {
        return 'Testing Master Data';
    }
}
