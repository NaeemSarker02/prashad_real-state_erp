<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ExpenseController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Expense::with(['user', 'category'])->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Search by note, amount, status
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Expense::with(['user', 'category'])
            ->where('note', 'like', "%{$keyword}%")
            ->orWhere('amount', 'like', "%{$keyword}%")
            ->orWhere('status', $keyword)
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Create expense
// Create expense
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'expense_category_id' => 'required|exists:expense_categories,id',
        'note' => 'nullable|string',
        'amount' => 'required|numeric',
        'cash_memo_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
        'status' => 'boolean',
        'user_id' => 'required|exists:users,id',
        'transactions' => 'required|array|min:1', // 👈 multiple payment types
        'transactions.*.payment_type_id' => 'required|exists:payment_types,id',
        'transactions.*.amount' => 'required|numeric|min:0',
    ]);

    if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

    $imageUrl = null;
    $publicId = null;

    if ($request->hasFile('cash_memo_image')) {
        $upload = Cloudinary::upload($request->file('cash_memo_image')->getRealPath(), ['folder' => 'expenses']);
        $imageUrl = $upload->getSecurePath();
        $publicId = $upload->getPublicId();

        // Local backup
        $backupPath = public_path('expenses');
        if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
        $filename = 'expense_' . time() . '.' . $request->file('cash_memo_image')->getClientOriginalExtension();
        $request->file('cash_memo_image')->move($backupPath, $filename);
    }

    // ✅ Create Expense first
    $expense = Expense::create([
        'expense_category_id' => $request->expense_category_id,
        'note' => $request->note,
        'amount' => $request->amount, // will update below
        'cash_memo_image' => $imageUrl,
        'cloudinary_public_id' => $publicId,
        'status' => $request->status ?? true,
        'user_id' => $request->user_id,
    ]);

    // ✅ Create Transactions for each payment type
    $totalAmount = 0;
    foreach ($request->transactions as $txn) {
        $transaction = \App\Models\Transaction::create([
            'payment_type_id' => $txn['payment_type_id'],
            'amount' => $txn['amount'],
            'notes' => 'Expense',
            'expense_id' => $expense->id,
            'type' => 'Out',
            'status' => true,
            'user_id' => $request->user_id,
        ]);
        $totalAmount += $txn['amount'];
    }

    // ✅ Update expense amount = sum of transactions
    $expense->update(['amount' => $totalAmount]);

    return response()->json([
        'message' => 'Expense & Transactions created successfully',
        'expense' => $expense->load('transactions')
    ], 201);
}


    // Show single expense
    public function show($id)
    {
        $expense = Expense::with(['user', 'category'])->find($id);
        if (!$expense) return response()->json(['message' => 'Expense not found'], 404);

        return response()->json($expense);
    }

    // Update expense
    public function update(Request $request, $id)
    {
        $expense = Expense::find($id);
        if (!$expense) return response()->json(['message' => 'Expense not found'], 404);

        $validator = Validator::make($request->all(), [
            'expense_category_id' => 'sometimes|exists:expense_categories,id',
            'note' => 'nullable|string',
            'amount' => 'sometimes|numeric',
            'cash_memo_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'sometimes|boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($request->hasFile('cash_memo_image')) {
            if ($expense->cloudinary_public_id) Cloudinary::destroy($expense->cloudinary_public_id);

            $upload = Cloudinary::upload($request->file('cash_memo_image')->getRealPath(), ['folder' => 'expenses']);
            $expense->cash_memo_image = $upload->getSecurePath();
            $expense->cloudinary_public_id = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('expenses');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'expense_' . $expense->id . '_' . time() . '.' . $request->file('cash_memo_image')->getClientOriginalExtension();
            $request->file('cash_memo_image')->move($backupPath, $filename);
        }

        $expense->fill($request->except(['cash_memo_image']))->save();

        return response()->json(['message' => 'Expense updated successfully', 'data' => $expense]);
    }

    // Delete expense
    public function destroy($id)
    {
        $expense = Expense::find($id);
        if (!$expense) return response()->json(['message' => 'Expense not found'], 404);

        if ($expense->cloudinary_public_id) Cloudinary::destroy($expense->cloudinary_public_id);

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }
}
