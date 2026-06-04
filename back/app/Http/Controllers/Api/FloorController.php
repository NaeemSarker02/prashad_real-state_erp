<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Floor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class FloorController extends Controller
{
    // ✅ List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Floor::with(['project', 'user'])->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // ✅ Search by floor_name
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Floor::with(['project', 'user'])
            ->where('floor_name', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // ✅ Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|exists:projects,id',
            'floor_name' => 'required|string|max:255',
            'floor_plan_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imageUrl = null;
        $publicId = null;

        if ($request->hasFile('floor_plan_image')) {
            // Upload to Cloudinary
            $uploadedFile = Cloudinary::upload(
                $request->file('floor_plan_image')->getRealPath(),
                ['folder' => 'floors']
            );
            $imageUrl = $uploadedFile->getSecurePath();
            $publicId = $uploadedFile->getPublicId();

            // Backup locally
            $backupPath = public_path('floors');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);

            $filename = 'floor_' . time() . '.' . $request->file('floor_plan_image')->getClientOriginalExtension();
            $request->file('floor_plan_image')->move($backupPath, $filename);
        }

        $floor = Floor::create([
            'project_id' => $request->project_id,
            'floor_name' => $request->floor_name,
            'floor_plan_image' => $imageUrl,
            'cloudinary_public_id' => $publicId,
            'status' => $request->status ?? true,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Floor created successfully', 'data' => $floor], 201);
    }

    // ✅ Show
    public function show($id)
    {
        $floor = Floor::with(['project', 'user'])->find($id);

        if (!$floor) {
            return response()->json(['message' => 'Floor not found'], 404);
        }

        return response()->json($floor);
    }

    // ✅ Update
    public function update(Request $request, $id)
    {
        $floor = Floor::find($id);

        if (!$floor) {
            return response()->json(['message' => 'Floor not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'floor_name' => 'sometimes|string|max:255',
            'floor_plan_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('floor_plan_image')) {
            // Delete old Cloudinary image
            if ($floor->cloudinary_public_id) {
                Cloudinary::destroy($floor->cloudinary_public_id);
            }

            // Upload new image
            $uploadedFile = Cloudinary::upload(
                $request->file('floor_plan_image')->getRealPath(),
                ['folder' => 'floors']
            );
            $floor->floor_plan_image = $uploadedFile->getSecurePath();
            $floor->cloudinary_public_id = $uploadedFile->getPublicId();

            // Save new backup locally
            $backupPath = public_path('floors');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);

            $filename = 'floor_' . $floor->id . '_' . time() . '.' . $request->file('floor_plan_image')->getClientOriginalExtension();
            $request->file('floor_plan_image')->move($backupPath, $filename);
        }

        $floor->fill($request->except(['floor_plan_image']))->save();

        return response()->json(['message' => 'Floor updated successfully', 'data' => $floor]);
    }

    // ✅ Delete
    public function destroy($id)
    {
        $floor = Floor::find($id);

        if (!$floor) {
            return response()->json(['message' => 'Floor not found'], 404);
        }

        // Delete Cloudinary
        if ($floor->cloudinary_public_id) {
            Cloudinary::destroy($floor->cloudinary_public_id);
        }

        $floor->delete();

        return response()->json(['message' => 'Floor deleted successfully']);
    }
}
