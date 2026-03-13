<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data Department berhasil diambil',
            'data'    => Department::all(),
        ]);
    }

    public function store(Request $request)
    {
        $item = Department::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil dibuat',
            'data'    => $item,
        ], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'status'  => true,
            'message' => 'Data Department ditemukan',
            'data'    => Department::findOrFail($id),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = Department::findOrFail($id);
        $item->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil diperbarui',
            'data'    => $item,
        ]);
    }

    public function destroy(string $id)
    {
        Department::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Department berhasil dihapus',
            'data'    => null,
        ]);
    }
}
