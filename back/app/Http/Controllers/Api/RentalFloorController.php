<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalFloor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalFloorController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = RentalFloor::with(['rentalProject', 'user'])->orderBy('id', 'desc');

        return $limit === 0 
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Search by floor_name
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = RentalFloor::with(['rentalProject', 'user'])
            ->where('floor_name', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        return $limit === 0 
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'rental_project_id' => 'required|exists:rental_projects,id',
            'floor_name' => 'required|string|max:255',
            'floor_plan_image' => 'nullable|image|mimes:jpg,jpeg,png',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['rental_project_id', 'floor_name', 'status', 'user_id']);

        // Handle image upload
        if ($request->hasFile('floor_plan_image')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('floor_plan_image')->getRealPath())->getSecurePath();
            $data['floor_plan_image'] = $uploadedFileUrl;

            // Backup locally
            $backupPath = public_path('rental_floors');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
            $request->file('floor_plan_image')->move($backupPath, time() . '_' . $request->file('floor_plan_image')->getClientOriginalName());
        }

        $floor = RentalFloor::create($data);

        return response()->json(['message' => 'Rental Floor created successfully', 'data' => $floor], 201);
    }

    // Show
    public function show($id)
    {
        $floor = RentalFloor::with(['rentalProject', 'user'])->find($id);
        if (!$floor) return response()->json(['message' => 'Rental Floor not found'], 404);

        return response()->json($floor);
    }

    // Update
    public function update(Request $request, $id)
    {
        $floor = RentalFloor::find($id);
        if (!$floor) return response()->json(['message' => 'Rental Floor not found'], 404);

        $validator = Validator::make($request->all(), [
            'rental_project_id' => 'sometimes|exists:rental_projects,id',
            'floor_name' => 'sometimes|string|max:255',
            'floor_plan_image' => 'nullable|image|mimes:jpg,jpeg,png',
            'status' => 'boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['rental_project_id', 'floor_name', 'status', 'user_id']);

        // Handle new image upload
        if ($request->hasFile('floor_plan_image')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('floor_plan_image')->getRealPath())->getSecurePath();
            $data['floor_plan_image'] = $uploadedFileUrl;

            $backupPath = public_path('rental_floors');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
            $request->file('floor_plan_image')->move($backupPath, time() . '_' . $request->file('floor_plan_image')->getClientOriginalName());
        }

        $floor->update($data);

        return response()->json(['message' => 'Rental Floor updated successfully', 'data' => $floor]);
    }

    // Delete
    public function destroy($id)
    {
        $floor = RentalFloor::find($id);
        if (!$floor) return response()->json(['message' => 'Rental Floor not found'], 404);

        $floor->delete();
        return response()->json(['message' => 'Rental Floor deleted successfully']);
    }
}
