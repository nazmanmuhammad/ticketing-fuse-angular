<?php

namespace App\Exports;

use App\Models\TicketSource;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TicketSourcesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $search;
    protected $status;

    public function __construct($search = '', $status = '')
    {
        $this->search = $search;
        $this->status = $status;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = TicketSource::query();

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('name', 'like', "%{$this->search}%")
                  ->orWhere('description', 'like', "%{$this->search}%");
            });
        }

        if ($this->status !== '') {
            $query->where('status', $this->status);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Name',
            'Description',
            'Status',
            'Created At',
        ];
    }

    /**
     * @param TicketSource $ticketSource
     * @return array
     */
    public function map($ticketSource): array
    {
        return [
            $ticketSource->name,
            $ticketSource->description ?? '',
            $ticketSource->status == 1 ? 'Active' : 'Inactive',
            $ticketSource->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
