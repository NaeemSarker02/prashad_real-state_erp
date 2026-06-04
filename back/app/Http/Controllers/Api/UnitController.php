<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UnitController extends Controller
{
    // List units filtered by project_id, floor_id, block_id
    public function index(Request $request)
    {
        $query = Unit::with(['project', 'floor', 'block', 'user'])
            ->when($request->project_id, fn($q) => $q->where('project_id', $request->project_id))
            ->when($request->floor_id, fn($q) => $q->where('floor_id', $request->floor_id))
            ->when($request->block_id, fn($q) => $q->where('block_id', $request->block_id))
            ->orderBy('id', 'desc');

        $limit = (int) $request->get('limit', 10);
        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Store unit
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'floor_id' => 'required|exists:floors,id',
            'block_id' => 'required|exists:blocks,id',
            'unit_name' => 'required|string|max:255',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $unit = Unit::create($request->all());
        return response()->json(['message' => 'Unit created successfully', 'data' => $unit], 201);
    }

    // Show unit
    public function show($id)
    {
        $unit = Unit::with(['project', 'floor', 'block', 'user'])->find($id);
        if (!$unit) return response()->json(['message' => 'Unit not found'], 404);

        return response()->json($unit);
    }

    // Update unit
    public function update(Request $request, $id)
    {
        $unit = Unit::find($id);
        if (!$unit) return response()->json(['message' => 'Unit not found'], 404);

        $validator = Validator::make($request->all(), [
            'project_id' => 'sometimes|exists:projects,id',
            'floor_id' => 'sometimes|exists:floors,id',
            'block_id' => 'sometimes|exists:blocks,id',
            'unit_name' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $unit->update($request->all());
        return response()->json(['message' => 'Unit updated successfully', 'data' => $unit]);
    }

    // Delete unit
    public function destroy($id)
    {
        $unit = Unit::find($id);
        if (!$unit) return response()->json(['message' => 'Unit not found'], 404);

        $unit->delete();
        return response()->json(['message' => 'Unit deleted successfully']);
    }
}
