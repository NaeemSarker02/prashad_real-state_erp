<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseCategoryController extends Controller
{
    // List with pagination or all
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = ExpenseCategory::with('user')->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Search by name or type
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = ExpenseCategory::with('user')
            ->where('name', 'like', "%{$keyword}%")
            ->orWhere('type', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Create
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|unique:expense_categories,name',
            'type'    => 'nullable|string',
            'status'  => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = ExpenseCategory::create([
            'name'    => $request->name,
            'type'    => $request->type,
            'status'  => $request->status ?? true,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Expense category created successfully', 'data' => $category], 201);
    }

    // Show single
    public function show($id)
    {
        $category = ExpenseCategory::with('user')->find($id);
        if (!$category) return response()->json(['message' => 'Expense category not found'], 404);

        return response()->json($category);
    }

    // Update
    public function update(Request $request, $id)
    {
        $category = ExpenseCategory::find($id);
        if (!$category) return response()->json(['message' => 'Expense category not found'], 404);

        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|unique:expense_categories,name,' . $id,
            'type'    => 'nullable|string',
            'status'  => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category->update([
            'name'    => $request->name,
            'type'    => $request->type,
            'status'  => $request->status ?? $category->status,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Expense category updated successfully', 'data' => $category]);
    }

    // Delete
    public function destroy($id)
    {
        $category = ExpenseCategory::find($id);
        if (!$category) return response()->json(['message' => 'Expense category not found'], 404);

        $category->delete();

        return response()->json(['message' => 'Expense category deleted successfully']);
    }
}
