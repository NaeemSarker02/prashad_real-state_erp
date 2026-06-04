<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Lead;
use App\Models\Customer;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SaleController extends Controller
{
    // 📌 List sales with optional pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        $query = Sale::with(['customer', 'unit', 'employee', 'user'])
                     ->orderBy('id', 'desc');

        $sales = $limit === 0 ? $query->get() : $query->paginate($limit);

        return response()->json($sales);
    }

    // 📌 Search sales dynamically
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);

        $query = Sale::with(['customer', 'unit', 'employee', 'user'])
            ->when($request->keyword, function ($q, $keyword) {
                $q->where('payment_status', 'like', "%{$keyword}%")
                  ->orWhere('total_amount', 'like', "%{$keyword}%")
                  ->orWhere('paid_amount', 'like', "%{$keyword}%");
            })
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->unit_id, fn($q) => $q->where('unit_id', $request->unit_id))
            ->when($request->employee_id, fn($q) => $q->where('employee_id', $request->employee_id))
            ->when($request->payment_status, fn($q) => $q->where('payment_status', $request->payment_status))
            ->when(!is_null($request->status), fn($q) => $q->where('status', $request->status))
            ->orderBy('id', 'desc');

        $sales = $limit === 0 ? $query->get() : $query->paginate($limit);

        return response()->json($sales);
    }

    // 📌 Store a new sale
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lead_id'            => 'required|exists:leads,id',
            'unit_id'            => 'required|exists:units,id',
            'total_amount'       => 'required|numeric',
            'down_payment'       => 'nullable|numeric',
            'monthly_charges'    => 'nullable|numeric',
            'total_installments' => 'nullable|integer',
            'monthly_paid_on'    => 'nullable|integer|min:1|max:31',
            'total_duration'     => 'nullable|integer',
            'user_id'            => 'required|exists:users,id',
            'employee_id'        => 'nullable|exists:employees,id',
            'status'             => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ✅ Get lead
        $lead = Lead::findOrFail($request->lead_id);

        // ✅ Get or create customer
        $customer = Customer::firstOrCreate(
            ['lead_id' => $lead->id],
            [
                'name'  => $lead->name,
                'email' => $lead->email,
                'image' => $lead->image,
                'cloudinary_public_id' => $lead->cloudinary_public_id,
                'status' => true,
                'user_id' => $request->user_id,
            ]
        );

        // ✅ Fetch unit booking amount
        $unit = Unit::findOrFail($request->unit_id);
        $bookingAmount = $unit->booking_amount ?? 0;

        // ✅ Create sale
        $sale = Sale::create([
            'customer_id'        => $customer->id,
            'unit_id'            => $request->unit_id,
            'total_amount'       => $request->total_amount,
            'down_payment'       => $request->down_payment ?? 0,
            'booking_amount'     => $bookingAmount,
            'paid_amount'        => 0, // start with 0; model calculates later
            'monthly_charges'    => $request->monthly_charges ?? 0,
            'total_installments' => $request->total_installments,
            'monthly_paid_on'    => $request->monthly_paid_on,
            'total_duration'     => $request->total_duration,
            'payment_status'     => 'pending',
            'employee_id'        => $request->employee_id,
            'status'             => $request->status ?? true,
            'user_id'            => $request->user_id,
        ]);

        // ✅ Create first installment (this month)
        $firstInstallmentAmount = $sale->monthly_charges ?: $sale->total_amount;

        $dueDate = $request->monthly_paid_on
            ? Carbon::now()->day($request->monthly_paid_on) // this month
            : Carbon::now()->startOfMonth();

        $sale->installments()->create([
            'installment_amount' => $firstInstallmentAmount,
            'paid_amount'        => 0,
            'status'             => 'pending',
            'due_date'           => $dueDate,
            'user_id'            => $request->user_id,
        ]);

        // ✅ Recalculate paid amount after creating installment
        $sale->calculatePaidAmount();

        return response()->json([
            'message'  => 'Sale created successfully',
            'customer' => $customer,
            'sale'     => $sale->load('installments')
        ], 201);
    }

    // 📌 Show a sale
    public function show($id)
    {
        $sale = Sale::with(['customer', 'unit', 'employee', 'user', 'installments'])->find($id);

        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }

        return response()->json($sale);
    }

    // 📌 Update a sale
    public function update(Request $request, $id)
    {
        $sale = Sale::find($id);

        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'customer_id'        => 'sometimes|exists:customers,id',
            'unit_id'            => 'sometimes|exists:units,id',
            'total_amount'       => 'sometimes|numeric',
            'down_payment'       => 'nullable|numeric',
            'monthly_charges'    => 'nullable|numeric',
            'total_installments' => 'nullable|integer',
            'monthly_paid_on'    => 'nullable|integer|min:1|max:31',
            'total_duration'     => 'nullable|integer',
            'employee_id'        => 'nullable|exists:employees,id',
            'status'             => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ✅ Refresh booking_amount if unit changed
        if ($request->has('unit_id')) {
            $unit = Unit::findOrFail($request->unit_id);
            $sale->booking_amount = $unit->booking_amount ?? 0;
        }

        $sale->update($request->except(['booking_amount']));

        // ✅ Recalculate paid amount after update
        $sale->calculatePaidAmount();

        return response()->json([
            'message' => 'Sale updated successfully',
            'sale'    => $sale
        ]);
    }

    // 📌 Delete a sale
    public function destroy($id)
    {
        $sale = Sale::find($id);

        if (!$sale) {
            return response()->json(['message' => 'Sale not found'], 404);
        }

        $sale->delete();

        return response()->json(['message' => 'Sale deleted successfully']);
    }
}
