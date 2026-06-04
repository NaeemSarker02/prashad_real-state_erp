<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdditionalCharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdditionalChargeController extends Controller
{
    // 📌 List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = AdditionalCharge::with('sale')->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // 📌 Search with filters
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');
        $status = $request->get('status');
        $saleId = $request->get('sale_id');

        $query = AdditionalCharge::with('sale')
            ->when($keyword, fn($q) => $q->where('type', 'like', "%{$keyword}%")
                                         ->orWhere('notes', 'like', "%{$keyword}%"))
            ->when($saleId, fn($q) => $q->where('sale_id', $saleId))
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // 📌 Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id' => 'required|exists:sales,id',
            'notes' => 'nullable|string',
            'type' => 'required|string',
            'total_amount' => 'required|numeric',
            'monthly_paid_on' => 'nullable|date',
            'paid_amount' => 'nullable|numeric',
            'due_amount' => 'nullable|numeric',
            'status' => 'nullable|string|in:pending,paid,overdue',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $charge = AdditionalCharge::create($request->all());

        return response()->json(['message' => 'Additional charge created successfully', 'data' => $charge], 201);
    }

    // 📌 Show
    public function show($id)
    {
        $charge = AdditionalCharge::with('sale')->find($id);
        if (!$charge) return response()->json(['message' => 'Additional charge not found'], 404);

        return response()->json($charge);
    }

    // 📌 Update
    public function update(Request $request, $id)
    {
        $charge = AdditionalCharge::find($id);
        if (!$charge) return response()->json(['message' => 'Additional charge not found'], 404);

        $validator = Validator::make($request->all(), [
            'sale_id' => 'sometimes|exists:sales,id',
            'notes' => 'nullable|string',
            'type' => 'sometimes|string',
            'total_amount' => 'sometimes|numeric',
            'monthly_paid_on' => 'nullable|date',
            'paid_amount' => 'nullable|numeric',
            'due_amount' => 'nullable|numeric',
            'status' => 'nullable|string|in:pending,paid,overdue',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $charge->update($request->all());

        return response()->json(['message' => 'Additional charge updated successfully', 'data' => $charge]);
    }

    // 📌 Delete
    public function destroy($id)
    {
        $charge = AdditionalCharge::find($id);
        if (!$charge) return response()->json(['message' => 'Additional charge not found'], 404);

        $charge->delete();

        return response()->json(['message' => 'Additional charge deleted successfully']);
    }
}
