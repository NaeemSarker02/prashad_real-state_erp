<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Floor;
use App\Models\Block;
use App\Models\Unit;
use Illuminate\Http\Request;

class ProjectHierarchyController extends Controller
{
    // ✅ Get Project with Floors
    public function projectFloors($projectId)
    {
        $project = Project::with(['floors'])->find($projectId);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        return response()->json($project);
    }

    // ✅ Get Floor with Units categorized by Blocks
    public function floorUnits($floorId)
    {
        $floor = Floor::with(['project'])->find($floorId);

        if (!$floor) {
            return response()->json(['message' => 'Floor not found'], 404);
        }

        // Get blocks in that project
        $blocks = Block::where('project_id', $floor->project_id)
            ->with(['units' => fn($q) => $q->where('floor_id', $floor->id)])
            ->get();

        return response()->json([
            'floor' => $floor,
            'blocks' => $blocks
        ]);
    }

    // ✅ Get Block with Units
    public function blockUnits($blockId)
    {
        $block = Block::with(['units'])->find($blockId);

        if (!$block) {
            return response()->json(['message' => 'Block not found'], 404);
        }

        return response()->json($block);
    }

    // ✅ Get Project → Floors → Blocks → Units (full hierarchy)
    public function projectHierarchy($projectId)
    {
        $project = Project::with([
            'floors',
            'blocks.units'
        ])->find($projectId);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        return response()->json($project);
    }
}