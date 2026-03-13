<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data User berhasil diambil',
            'data'    => User::all(),
        ]);
    }

    public function store(Request $request)
    {
        $item = User::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dibuat',
            'data'    => $item,
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data User ditemukan',
            'data'    => User::findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = User::findOrFail($id);
        $item->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil diperbarui',
            'data'    => $item,
        ]);
    }

    public function destroy(string $id)
    {
        User::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'User berhasil dihapus',
            'data'    => null,
        ]);
    }
}
