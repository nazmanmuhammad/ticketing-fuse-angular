<?php

namespace App\Exports;

use App\Models\RequestType;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RequestTypesExport implements FromCollection, WithHeadings, WithMapping
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
        $query = RequestType::query();

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
     * @param RequestType $requestType
     * @return array
     */
    public function map($requestType): array
    {
        return [
            $requestType->name,
            $requestType->description ?? '',
            $requestType->status == 1 ? 'Active' : 'Inactive',
            $requestType->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
