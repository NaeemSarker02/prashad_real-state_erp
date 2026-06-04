<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BlockController extends Controller
{
    // List blocks filtered by project_id + floor_id
    public function index(Request $request)
    {
        $query = Block::with(['units', 'project', 'floor', 'user'])
            ->when($request->project_id, fn($q) => $q->where('project_id', $request->project_id))
            ->when($request->floor_id, fn($q) => $q->where('floor_id', $request->floor_id))
            ->orderBy('id', 'desc');

        $limit = (int) $request->get('limit', 10);
        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Store block
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'floor_id' => 'required|exists:floors,id',
            'block_name' => 'required|string|max:255',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $block = Block::create($request->all());
        return response()->json(['message' => 'Block created successfully', 'data' => $block], 201);
    }

    // Show block with units
    public function show($id)
    {
        $block = Block::with(['units', 'project', 'floor', 'user'])->find($id);
        if (!$block) return response()->json(['message' => 'Block not found'], 404);

        return response()->json($block);
    }

    // Update block
    public function update(Request $request, $id)
    {
        $block = Block::find($id);
        if (!$block) return response()->json(['message' => 'Block not found'], 404);

        $validator = Validator::make($request->all(), [
            'project_id' => 'sometimes|exists:projects,id',
            'floor_id' => 'sometimes|exists:floors,id',
            'block_name' => 'sometimes|string|max:255',
            'status' => 'boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $block->update($request->all());
        return response()->json(['message' => 'Block updated successfully', 'data' => $block]);
    }

    // Delete block
    public function destroy($id)
    {
        $block = Block::find($id);
        if (!$block) return response()->json(['message' => 'Block not found'], 404);

        $block->delete();
        return response()->json(['message' => 'Block deleted successfully']);
    }
}
