<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Get all roles without pagination (ordered).
     */
    // public function index()
    // {
    //     return response()->json(Role::orderBy('id', 'asc')->get());
    // }

    /**
     * Get roles with pagination or all if limit=0.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        $query = Role::orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    /**
     * Search roles by role_name or permissions with pagination or all if limit=0.
     */
    public function searchRoles(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Role::where('role_name', 'like', "%$keyword%")
            ->orWhere('permissions', 'like', "%$keyword%")
            ->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    /**
     * Store a new role.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role_name' => 'required|string|unique:roles,role_name',
            'permissions' => 'nullable|string',
            'access' => 'nullable|array',
            'status' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = Role::create([
            'role_name' => $request->role_name,
            'permissions' => $request->permissions,
            'access' => $request->access,
            'status' => $request->status ?? true,
        ]);

        return response()->json(['message' => 'Role created successfully', 'data' => $role], 201);
    }

    /**
     * Show a single role by id.
     */
    public function show($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        return response()->json($role);
    }

    /**
     * Update a role.
     */
    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_name' => 'required|string|unique:roles,role_name,' . $role->id,
            'permissions' => 'nullable|string',
            'access' => 'nullable|array',
            'status' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role->update([
            'role_name' => $request->role_name,
            'permissions' => $request->permissions,
            'access' => $request->access,
            'status' => $request->status ?? $role->status,
        ]);

        return response()->json(['message' => 'Role updated successfully', 'data' => $role]);
    }

    /**
     * Delete a role.
     */
    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }
}
