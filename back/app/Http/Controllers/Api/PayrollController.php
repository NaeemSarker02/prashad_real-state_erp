<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Transaction;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class PayrollController extends Controller
{
    // List payrolls with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Payroll::with(['employee', 'user'])->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit),
        ]);
    }

    // Search payrolls
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Payroll::with(['employee', 'user'])
            ->whereHas('employee', function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%");
            })
            ->orWhere('gross_pay', 'like', "%{$keyword}%")
            ->orWhere('net_pay', 'like', "%{$keyword}%")
            ->orWhere('status', $keyword)
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit),
        ]);
    }

    // Create payroll
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'employee_id'      => 'required|exists:employees,id',
        'gross_pay'        => 'required|numeric',
        'income_tax'       => 'nullable|numeric',
        'provident_fund'   => 'nullable|numeric',
        'others_deduction' => 'nullable|numeric',
        'net_pay'          => 'required|numeric',
        'time'             => 'required|date',
        'image'            => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
        'status'           => 'nullable|boolean',
        'user_id'          => 'required|exists:users,id',
        'transactions'     => 'required|array|min:1',
        'transactions.*.payment_type_id' => 'required|exists:payment_types,id',
        'transactions.*.amount'          => 'required|numeric|min:0',
    ]);

    if ($validator->fails())
        return response()->json(['errors' => $validator->errors()], 422);

    $imageUrl = null;
    $publicId = null;

    if ($request->hasFile('image')) {
        $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'payrolls']);
        $imageUrl = $upload->getSecurePath();
        $publicId = $upload->getPublicId();

        $backupPath = public_path('payrolls');
        if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
        $filename = 'payroll_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
        $request->file('image')->move($backupPath, $filename);
    }

    // ✅ Create Payroll (gross_pay will be updated later)
    $payroll = Payroll::create([
        'employee_id'      => $request->employee_id,
        'gross_pay'        => 0,
        'income_tax'       => $request->income_tax ?? 0,
        'provident_fund'   => $request->provident_fund ?? 0,
        'others_deduction' => $request->others_deduction ?? 0,
        'net_pay'          => $request->net_pay,
        'time'             => $request->time,
        'image'            => $imageUrl,
        'cloudinary_public_id' => $publicId,
        'status'           => $request->status ?? true,
        'user_id'          => $request->user_id,
    ]);

    // ✅ Create Transactions for each payment type
    $totalGross = 0;
    foreach ($request->transactions as $txn) {
        \App\Models\Transaction::create([
            'payment_type_id' => $txn['payment_type_id'],
            'amount'          => $txn['amount'],
            'notes'           => 'Payroll',
            'payroll_id'      => $payroll->id,
            'type'            => 'Out',
            'status'          => true,
            'user_id'         => $request->user_id,
        ]);
        $totalGross += $txn['amount'];
    }

    // ✅ Update payroll gross_pay = sum of all transactions
    $payroll->update(['gross_pay' => $totalGross]);

    return response()->json([
        'message' => 'Payroll & Transactions created successfully',
        'data'    => $payroll->load('transactions')
    ], 201);
}


    // Show payroll
    public function show($id)
    {
        $payroll = Payroll::with(['employee', 'user'])->find($id);
        if (!$payroll) return response()->json(['message' => 'Payroll not found'], 404);

        return response()->json($payroll);
    }

    // Update payroll
    public function update(Request $request, $id)
    {
        $payroll = Payroll::find($id);
        if (!$payroll) return response()->json(['message' => 'Payroll not found'], 404);

        $validator = Validator::make($request->all(), [
            'employee_id'     => 'sometimes|exists:employees,id',
            'gross_pay'       => 'sometimes|numeric',
            'income_tax'      => 'nullable|numeric',
            'provident_fund'  => 'nullable|numeric',
            'others_deduction'=> 'nullable|numeric',
            'net_pay'         => 'sometimes|numeric',
            'time'            => 'sometimes|date',
            'image'           => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'          => 'sometimes|boolean',
            'user_id'         => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($request->hasFile('image')) {
            if ($payroll->cloudinary_public_id) Cloudinary::destroy($payroll->cloudinary_public_id);

            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'payrolls']);
            $payroll->image = $upload->getSecurePath();
            $payroll->cloudinary_public_id = $upload->getPublicId();

            $backupPath = public_path('payrolls');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'payroll_' . $payroll->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $payroll->fill($request->except(['image']))->save();

        return response()->json(['message' => 'Payroll updated successfully', 'data' => $payroll]);
    }

    // Delete payroll
    public function destroy($id)
    {
        $payroll = Payroll::find($id);
        if (!$payroll) return response()->json(['message' => 'Payroll not found'], 404);

        if ($payroll->cloudinary_public_id) Cloudinary::destroy($payroll->cloudinary_public_id);

        $payroll->delete();

        return response()->json(['message' => 'Payroll deleted successfully']);
    }
}
