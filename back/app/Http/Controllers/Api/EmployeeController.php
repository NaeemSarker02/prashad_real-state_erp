<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    // List employees (pagination or all)
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Employee::with(['user', 'addedBy'])->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // Search employees
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Employee::with(['user', 'addedBy'])
            ->where('name', 'like', "%{$keyword}%")
            ->orWhere('designation', 'like', "%{$keyword}%")
            ->orWhere('city', 'like', "%{$keyword}%")
            ->orWhere('performance', 'like', "%{$keyword}%")
            ->orWhere('status', $keyword)
            ->orderBy('id', 'desc');

        if ($limit === 0) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($limit));
    }

    // Create employee
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'user_id'        => 'required|exists:users,id',
            'designation'    => 'nullable|string|max:255',
            'address'        => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:255',
            'date_of_join'   => 'nullable|date',
            'salary'         => 'nullable|numeric',
            'bonus_percentage' => 'nullable|numeric',
            'performance'    => 'nullable|string|max:255',
            'status'         => 'boolean',
            'added_by'       => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::create($request->all());

        return response()->json(['message' => 'Employee created successfully', 'data' => $employee], 201);
    }

    // Show employee
    public function show($id)
    {
        $employee = Employee::with(['user', 'addedBy'])->find($id);

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        return response()->json($employee);
    }

    // Update employee
    public function update(Request $request, $id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'           => 'sometimes|string|max:255',
            'user_id'        => 'sometimes|exists:users,id',
            'designation'    => 'nullable|string|max:255',
            'address'        => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:255',
            'date_of_join'   => 'nullable|date',
            'salary'         => 'nullable|numeric',
            'bonus_percentage' => 'nullable|numeric',
            'performance'    => 'nullable|string|max:255',
            'status'         => 'boolean',
            'added_by'       => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee->update($request->all());

        return response()->json(['message' => 'Employee updated successfully', 'data' => $employee]);
    }

    // Delete employee
    public function destroy($id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }

        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully']);
    }
}
