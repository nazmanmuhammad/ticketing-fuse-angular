<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamUser;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        $data = Team::all();

        return response()->json([
            'status'  => true,
            'message' => 'Data Team berhasil diambil',
            'data'    => $data,
        ]);
    }

    public function store(Request $request)
    {
        $team = Team::create($request->only(['name', 'description']));

        foreach ($request->members as $userId) {
            TeamUser::create([
                'team_id' => $team->id,
                'user_id' => $userId,
            ]);
        }

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dibuat',
            'data'    => $team->load('teamUsers'),
        ], 201);
    }

    public function show(string $id)
    {
        $item = Team::findOrFail($id);

        return response()->json([
            'status'  => true,
            'message' => 'Data Team ditemukan',
            'data'    => $item,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $item = Team::findOrFail($id);
        $item->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil diperbarui',
            'data'    => $item,
        ]);
    }

    public function destroy(string $id)
    {
        Team::findOrFail($id)->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dihapus',
            'data'    => null,
        ]);
    }

    public function addUser(Request $request)
    {
        $item = TeamUser::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Team berhasil dibuat',
            'data'    => $item,
        ], 201);
    }
}
