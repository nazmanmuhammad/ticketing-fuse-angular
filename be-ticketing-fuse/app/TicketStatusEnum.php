<?php

namespace App;

enum TicketStatusEnum: int
{
    case PENDING = 0;
    case PROCESS = 1;
    case RESOLVED = 2;
    case CLOSED = 3;
    case CANCELLED = 4;

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::PROCESS => 'Processing',
            self::RESOLVED => 'Resolved',
            self::CLOSED => 'Closed',
            self::CANCELLED => 'Cancelled',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'gray',
            self::PROCESS => 'blue',
            self::RESOLVED => 'green',
            self::CLOSED => 'red',
            self::CANCELLED => 'red',
        };
    }

    public function badge(): string
    {
        return match($this) {
            self::PENDING => 'bg-gray-100 text-gray-800',
            self::PROCESS => 'bg-blue-100 text-blue-800',
            self::RESOLVED => 'bg-green-100 text-green-800',
            self::CLOSED => 'bg-red-100 text-red-800',
            self::CANCELLED => 'bg-red-100 text-red-800',
        };
    }
}
