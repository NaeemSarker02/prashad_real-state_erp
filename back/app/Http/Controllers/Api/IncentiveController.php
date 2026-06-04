<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incentive;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class IncentiveController extends Controller
{
    // List incentives with pagination
    public function index(Request $request)
    {
        $limit = (int)$request->get('limit', 10);
        $query = Incentive::with(['project','unit','employee','user'])->orderBy('id','desc');

        if($limit === 0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Search incentives
public function search(Request $request)
{
    $limit = (int)$request->get('limit', 10);
    $keyword = $request->get('keyword', '');
    $projectId = $request->get('project_id');
    $unitId = $request->get('unit_id');
    $employeeId = $request->get('employee_id');
    $paymentStatus = $request->get('payment_status');
    $status = $request->get('status');

    $query = Incentive::with(['project','unit','employee','user'])
        ->when($keyword, function($q) use ($keyword){
            $kw = "%{$keyword}%";
            $q->where('payment_status','like',$kw)
              ->orWhere('amount','like',$kw)
              ->orWhere('percentage','like',$kw);
        })
        ->when($projectId, fn($q) => $q->where('project_id',$projectId))
        ->when($unitId, fn($q) => $q->where('unit_id',$unitId))
        ->when($employeeId, fn($q) => $q->where('employee_id',$employeeId))
        ->when($paymentStatus, fn($q) => $q->where('payment_status',$paymentStatus))
        ->when(!is_null($status), fn($q) => $q->where('status',$status))
        ->orderBy('id','desc');

    if($limit === 0) return response()->json($query->get());
    return response()->json($query->paginate($limit));
}


// Store incentive
public function store(Request $request)
{
    $validator = Validator::make($request->all(),[
        'project_id'=>'required|exists:projects,id',
        'unit_id'=>'required|exists:units,id',
        'employee_id'=>'required|exists:employees,id',
        'percentage'=>'nullable|numeric',
        'amount'=>'required|numeric',
        'payment_status'=>'required|string',
        'user_id'=>'required|exists:users,id',
        'status'=>'boolean',
        'payment_type_id'=>'required|exists:payment_types,id' // 👈 Needed for transaction
    ]);

    if($validator->fails()) 
        return response()->json(['errors'=>$validator->errors()],422);

    // ✅ Create incentive
    $incentive = Incentive::create($request->all());

    // ✅ Create transaction
    \App\Models\Transaction::create([
        'payment_type_id' => $request->payment_type_id,
        'amount'          => $request->amount,
        'notes'           => 'Incentive Payment',
        'incentive_id'    => $incentive->id,
        'type'            => 'Out',
        'status'          => true,
        'user_id'         => $request->user_id,
    ]);

    return response()->json([
        'message'=>'Incentive & Transaction created successfully',
        'data'=>$incentive->load('transactions')
    ],201);
}


    // Show incentive
    public function show($id)
    {
        $incentive = Incentive::with(['project','unit','employee','user'])->find($id);
        if(!$incentive) return response()->json(['message'=>'Incentive not found'],404);
        return response()->json($incentive);
    }

    // Update incentive
    public function update(Request $request,$id)
    {
        $incentive = Incentive::find($id);
        if(!$incentive) return response()->json(['message'=>'Incentive not found'],404);

        $validator = Validator::make($request->all(),[
            'project_id'=>'sometimes|exists:projects,id',
            'unit_id'=>'sometimes|exists:units,id',
            'employee_id'=>'sometimes|exists:employees,id',
            'percentage'=>'nullable|numeric',
            'amount'=>'sometimes|numeric',
            'payment_status'=>'sometimes|string',
            'user_id'=>'sometimes|exists:users,id',
            'status'=>'boolean'
        ]);

        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $incentive->update($request->all());

        return response()->json(['message'=>'Incentive updated successfully','data'=>$incentive]);
    }

    // Delete incentive
    public function destroy($id)
    {
        $incentive = Incentive::find($id);
        if(!$incentive) return response()->json(['message'=>'Incentive not found'],404);

        $incentive->delete();
        return response()->json(['message'=>'Incentive deleted successfully']);
    }
}
