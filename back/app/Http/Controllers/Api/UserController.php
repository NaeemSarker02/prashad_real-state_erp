<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class UserController extends Controller
{
    // ✅ List users with pagination + search
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        $query = User::with('role')->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json([
            'status' => true,
            'message' => 'Users retrieved successfully',
            'data' => $query->paginate($limit)
        ]);
    }

    /**
     * Search users by name/email/contact/nid/gender with pagination or all
     */
    public function searchUsers(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = User::with('role')
            ->where(function ($q) use ($keyword) {
                $kw = "%{$keyword}%";
                $q->where('name', 'like', $kw)
                  ->orWhere('email', 'like', $kw)
                  ->orWhere('contact', 'like', $kw)
                  ->orWhere('nid', 'like', $kw)
                  ->orWhere('gender', 'like', $kw)
                  ->orWhere('status', $keyword); // allows 0 or 1
            })
            ->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json([
            'status' => true,
            'message' => 'Users retrieved successfully',
            'data' => $query->paginate($limit)
        ]);
    }

    // ✅ Create user
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users',
            'password'  => 'required|string|min:6',
            'contact'   => 'nullable|string|max:20',
            'gender'    => 'nullable|string|max:20',
            'nid'       => 'nullable|string|max:50',
            'role_id'   => 'required|exists:roles,id',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'    => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $imageUrl = null;


     



        if ($request->hasFile('image')) {
            // Upload to Cloudinary
            $uploadedFileUrl = Cloudinary::upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'users']
            );

            $imageUrl = $uploadedFileUrl->getSecurePath();
            $publicId = $uploadedFileUrl->getPublicId(); // store this in DB

            // Save backup locally
            $backupPath = public_path('users');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
              
            $filename = $request->name . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'contact'   => $request->contact,
            'gender'    => $request->gender,
            'nid'       => $request->nid,
            'role_id'   => $request->role_id,
            'cloudinary_public_id'   => $publicId,
            'image'     => $imageUrl,
            'status'    => $request->status,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    // ✅ Get user by ID
    public function show($id)
    {
        $user = User::with('role')->find($id);

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'User not found'], 404);
        }

        return response()->json(['status' => true, 'data' => $user]);
    }



    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['status' => false, 'message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $id,
            'password'  => 'sometimes|string|min:6',
            'contact'   => 'nullable|string|max:20',
            'gender'    => 'nullable|string|max:20',
            'nid'       => 'nullable|string|max:50',
            'role_id'   => 'sometimes|exists:roles,id',
            'image'     => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'    => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('image')) {
            // Delete old Cloudinary image if exists
            if ($user->cloudinary_public_id) {
                Cloudinary::destroy($user->cloudinary_public_id);
            }

            // Delete old local backup
            $backupPath = public_path('users/');
            $oldLocalFile = $backupPath . basename($user->image);
            if (file_exists($oldLocalFile)) {
                unlink($oldLocalFile);
            }

            // Upload new image to Cloudinary
            $uploadedFile = Cloudinary::upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'users']
            );

            $user->image = $uploadedFile->getSecurePath();
            $user->cloudinary_public_id = $uploadedFile->getPublicId(); // save public ID for future deletion

            // Save new backup locally with unique name
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0777, true);
            }
            $filename = 'user_' . $user->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->fill($request->except(['password', 'image']))->save();

        return response()->json([
            'status' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }




    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Delete from Cloudinary if exists
        if ($user->cloudinary_public_id) {
            Cloudinary::destroy($user->cloudinary_public_id);
        }


        $user->delete();

        return response()->json([
            'status' => true,
            'message' => 'User deleted successfully'
        ], 200);
    }
}
