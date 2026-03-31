<?php

namespace App;

enum UserRoleEnum: int
{
    case USER = 0;
    case AGENT = 1;
    case TECHNICAL = 2;
    case ADMIN = 3;

    public function label(): string
    {
        return match($this) {
            self::USER => 'User',
            self::AGENT => 'Agent',
            self::TECHNICAL => 'Technical',
            self::ADMIN => 'Admin',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::USER => 'gray',
            self::AGENT => 'blue',
            self::TECHNICAL => 'yellow',
            self::ADMIN => 'red',
        };
    }

    public function badge(): string
    {
        return match($this) {
            self::USER => 'bg-gray-100 text-gray-800',
            self::AGENT => 'bg-blue-100 text-blue-800',
            self::TECHNICAL => 'bg-yellow-100 text-yellow-800',
            self::ADMIN => 'bg-red-100 text-red-800',
        };
    }
}
