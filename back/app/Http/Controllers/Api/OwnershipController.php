<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ownership;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class OwnershipController extends Controller
{
    // ✅ List ownerships with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        $query = Ownership::with('user')->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // ✅ Search ownerships
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Ownership::with('user')
            ->where(function ($q) use ($keyword) {
                $kw = "%{$keyword}%";
                $q->where('name', 'like', $kw)
                  ->orWhere('phone', 'like', $kw)
                  ->orWhere('email', 'like', $kw)
                  ->orWhere('nid', 'like', $kw)
                  ->orWhere('gender', 'like', $kw)
                  ->orWhere('status', $keyword);
            })
            ->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // ✅ Create ownership
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'gender'    => 'nullable|string|max:20',
            'email'     => 'required|email|unique:ownerships',
            'nid'       => 'nullable|string|max:50',
            'user_id'   => 'required|exists:users,id',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_image.*' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'    => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imageUrl = null;
        $publicId = null;

        // Upload single image
        if ($request->hasFile('image')) {
            $upload = Cloudinary::upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'ownerships']
            );
            $imageUrl = $upload->getSecurePath();
            $publicId = $upload->getPublicId();

            // Save local backup
            $backupPath = public_path('ownerships');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'owner_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        // Upload contract images (array)
        $contractImages = [];
        if ($request->hasFile('contract_image')) {
            foreach ($request->file('contract_image') as $file) {
                $upload = Cloudinary::upload(
                    $file->getRealPath(),
                    ['folder' => 'ownerships/contracts']
                );
                $contractImages[] = $upload->getSecurePath();

                // Save local backup
                $backupPath = public_path('ownerships/contracts');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'contract_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($backupPath, $filename);
            }
        }

        $ownership = Ownership::create([
            'name'      => $request->name,
            'phone'     => $request->phone,
            'gender'    => $request->gender,
            'email'     => $request->email,
            'nid'       => $request->nid,
            'user_id'   => $request->user_id,
            'image'     => $imageUrl,
            'cloudinary_public_id' => $publicId,
            'contract_image' => $contractImages,
            'status'    => $request->status ?? true,
        ]);

        return response()->json(['message' => 'Ownership created', 'data' => $ownership], 201);
    }

    // ✅ Show ownership
    public function show($id)
    {
        $ownership = Ownership::with('user')->find($id);
        if (!$ownership) {
            return response()->json(['message' => 'Ownership not found'], 404);
        }
        return response()->json($ownership);
    }

    // ✅ Update ownership
    public function update(Request $request, $id)
    {
        $ownership = Ownership::find($id);
        if (!$ownership) {
            return response()->json(['message' => 'Ownership not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'      => 'sometimes|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'gender'    => 'nullable|string|max:20',
            'email'     => 'sometimes|email|unique:ownerships,email,' . $id,
            'nid'       => 'nullable|string|max:50',
            'user_id'   => 'sometimes|exists:users,id',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_image.*' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'    => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Replace main image
        if ($request->hasFile('image')) {
            if ($ownership->cloudinary_public_id) {
                Cloudinary::destroy($ownership->cloudinary_public_id);
            }

            $upload = Cloudinary::upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'ownerships']
            );
            $ownership->image = $upload->getSecurePath();
            $ownership->cloudinary_public_id = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('ownerships');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'owner_' . $ownership->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        // Add new contract images
        if ($request->hasFile('contract_image')) {
            $existing = $ownership->contract_image ?? [];
            foreach ($request->file('contract_image') as $file) {
                $upload = Cloudinary::upload(
                    $file->getRealPath(),
                    ['folder' => 'ownerships/contracts']
                );
                $existing[] = $upload->getSecurePath();

                $backupPath = public_path('ownerships/contracts');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'contract_' . $ownership->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($backupPath, $filename);
            }
            $ownership->contract_image = $existing;
        }

        $ownership->fill($request->except(['image', 'contract_image']))->save();

        return response()->json(['message' => 'Ownership updated', 'data' => $ownership]);
    }

    // ✅ Delete ownership
    public function destroy($id)
    {
        $ownership = Ownership::find($id);
        if (!$ownership) {
            return response()->json(['message' => 'Ownership not found'], 404);
        }

        if ($ownership->cloudinary_public_id) {
            Cloudinary::destroy($ownership->cloudinary_public_id);
        }

        $ownership->delete();

        return response()->json(['message' => 'Ownership deleted']);
    }
}
