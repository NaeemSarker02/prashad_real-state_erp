<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalUnitController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = RentalUnit::with(['rentalProject','rentalFloor','rentalBlock','tenant','rentedBy','user'])->orderBy('id','desc');

        return $limit === 0 
            ? response()->json($query->get()) 
            : response()->json($query->paginate($limit));
    }

    // Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = RentalUnit::with(['rentalProject','rentalFloor','rentalBlock','tenant','rentedBy','user'])
            ->where('name','like',"%{$keyword}%")
            ->orWhere('features','like',"%{$keyword}%")
            ->orderBy('id','desc');

        return $limit === 0 
            ? response()->json($query->get()) 
            : response()->json($query->paginate($limit));
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),[
            'rental_project_id' => 'required|exists:rental_projects,id',
            'rental_floor_id' => 'required|exists:rental_floors,id',
            'rental_block_id' => 'required|exists:rental_blocks,id',
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors'=>$validator->errors()],422);
        }

        $data = $request->except('image');

        // Upload image
        if ($request->hasFile('image')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('image')->getRealPath())->getSecurePath();
            $data['image'] = $uploadedFileUrl;

            $backupPath = public_path('rental_units');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
            $request->file('image')->move($backupPath, time().'_'.$request->file('image')->getClientOriginalName());
        }

        $unit = RentalUnit::create($data);

        return response()->json(['message'=>'Rental Unit created successfully','data'=>$unit],201);
    }

    // Show
    public function show($id)
    {
        $unit = RentalUnit::with(['rentalProject','rentalFloor','rentalBlock','tenant','rentedBy','user'])->find($id);
        if (!$unit) return response()->json(['message'=>'Rental Unit not found'],404);
        return response()->json($unit);
    }

    // Update
    public function update(Request $request, $id)
    {
        $unit = RentalUnit::find($id);
        if (!$unit) return response()->json(['message'=>'Rental Unit not found'],404);

        $validator = Validator::make($request->all(),[
            'rental_project_id' => 'sometimes|exists:rental_projects,id',
            'rental_floor_id' => 'sometimes|exists:rental_floors,id',
            'rental_block_id' => 'sometimes|exists:rental_blocks,id',
            'name' => 'sometimes|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors'=>$validator->errors()],422);
        }

        $data = $request->except('image');

        // Replace image if new one uploaded
        if ($request->hasFile('image')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('image')->getRealPath())->getSecurePath();
            $data['image'] = $uploadedFileUrl;

            $backupPath = public_path('rental_units');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
            $request->file('image')->move($backupPath, time().'_'.$request->file('image')->getClientOriginalName());
        }

        $unit->update($data);

        return response()->json(['message'=>'Rental Unit updated successfully','data'=>$unit]);
    }

    // Delete
    public function destroy($id)
    {
        $unit = RentalUnit::find($id);
        if (!$unit) return response()->json(['message'=>'Rental Unit not found'],404);

        $unit->delete();
        return response()->json(['message'=>'Rental Unit deleted successfully']);
    }
}
