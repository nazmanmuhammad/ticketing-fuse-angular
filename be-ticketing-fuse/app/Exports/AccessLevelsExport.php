<?php

namespace App\Exports;

use App\Models\AccessLevel;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AccessLevelsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $search;
    protected $status;
    protected $requestTypeId;

    public function __construct($search = '', $status = '', $requestTypeId = '')
    {
        $this->search = $search;
        $this->status = $status;
        $this->requestTypeId = $requestTypeId;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = AccessLevel::with('requestType');

        if ($this->search) {
            $query->where(function ($q) {
                $q->where('name', 'like', "%{$this->search}%")
                  ->orWhere('description', 'like', "%{$this->search}%");
            });
        }

        if ($this->status !== '') {
            $query->where('status', $this->status);
        }

        if ($this->requestTypeId) {
            $query->where('request_type_id', $this->requestTypeId);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Request Type',
            'Name',
            'Description',
            'Status',
            'Created At',
        ];
    }

    /**
     * @param AccessLevel $accessLevel
     * @return array
     */
    public function map($accessLevel): array
    {
        return [
            $accessLevel->requestType->name ?? '',
            $accessLevel->name,
            $accessLevel->description ?? '',
            $accessLevel->status == 1 ? 'Active' : 'Inactive',
            $accessLevel->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
