<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Procurement;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ProcurementController extends Controller
{
    // List procurements with pagination
    public function index(Request $request)
    {
        $limit = (int)$request->get('limit', 10);
        $query = Procurement::with(['project','user'])->orderBy('id','desc');

        if($limit === 0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Search procurements by notes or amount
    public function search(Request $request)
    {
        $limit = (int)$request->get('limit', 10);
        $keyword = $request->get('keyword', '');
        $projectId = $request->get('project_id');
        $status = $request->get('status');

        $query = Procurement::with(['project', 'user'])
            ->when($keyword, function($q) use ($keyword) {
                $kw = "%{$keyword}%";
                $q->where('notes','like',$kw)
                ->orWhere('amount','like',$kw);
            })
            ->when($projectId, function($q) use ($projectId) {
                $q->where('project_id', $projectId);
            })
            ->when(!is_null($status), function($q) use ($status) {
                $q->where('status', $status);
            })
            ->orderBy('id','desc');

        if($limit === 0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

// Store procurement
public function store(Request $request)
{
    $validator = Validator::make($request->all(),[
        'project_id' => 'required|exists:projects,id',
        'receipt_image.*' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
        'status' => 'boolean',
        'user_id' => 'required|exists:users,id',
        'notes' => 'nullable|string',
        'transactions' => 'required|array|min:1', // 👈 multiple payment types
        'transactions.*.payment_type_id' => 'required|exists:payment_types,id',
        'transactions.*.amount' => 'required|numeric|min:0',
    ]);

    if ($validator->fails())
        return response()->json(['errors' => $validator->errors()], 422);

    $receiptImages = [];

    if ($request->hasFile('receipt_image')) {
        foreach ($request->file('receipt_image') as $file) {
            // Upload to Cloudinary
            $uploaded = Cloudinary::upload($file->getRealPath(), ['folder' => 'procurements']);
            $receiptImages[] = $uploaded->getSecurePath();

            // Save backup locally
            $backupPath = public_path('procurements');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'procurement_' . time() . '_' . $file->getClientOriginalName();
            $file->move($backupPath, $filename);
        }
    }

    // ✅ Create Procurement first (amount will be updated later)
    $procurement = Procurement::create([
        'project_id' => $request->project_id,
        'amount' => 0,
        'receipt_image' => $receiptImages,
        'status' => $request->status ?? true,
        'user_id' => $request->user_id,
        'notes' => $request->notes,
    ]);

    // ✅ Create Transactions for each payment type
    $totalAmount = 0;
    foreach ($request->transactions as $txn) {
        \App\Models\Transaction::create([
            'payment_type_id' => $txn['payment_type_id'],
            'amount' => $txn['amount'],
            'notes' => 'Procurement',
            'procurement_id' => $procurement->id,
            'type' => 'Out',
            'status' => true,
            'user_id' => $request->user_id,
        ]);
        $totalAmount += $txn['amount'];
    }

    // ✅ Update procurement amount = sum of transactions
    $procurement->update(['amount' => $totalAmount]);

    return response()->json([
        'message' => 'Procurement & Transactions created successfully',
        'data' => $procurement->load('transactions')
    ], 201);
}


    // Show procurement
    public function show($id)
    {
        $procurement = Procurement::with(['project','user'])->find($id);
        if(!$procurement) return response()->json(['message'=>'Procurement not found'],404);
        return response()->json($procurement);
    }

    // Update procurement
    public function update(Request $request,$id)
    {
        $procurement = Procurement::find($id);
        if(!$procurement) return response()->json(['message'=>'Procurement not found'],404);

        $validator = Validator::make($request->all(),[
            'project_id'=>'sometimes|exists:projects,id',
            'amount'=>'sometimes|numeric',
            'receipt_image.*'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'=>'boolean',
            'notes'=>'nullable|string',
        ]);

        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $receiptImages = $procurement->receipt_image ?? [];

        if($request->hasFile('receipt_image')){
            foreach($request->file('receipt_image') as $file){
                $uploaded = Cloudinary::upload($file->getRealPath(), ['folder'=>'procurements']);
                $receiptImages[] = $uploaded->getSecurePath();

                $backupPath = public_path('procurements');
                if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
                $filename = 'procurement_'.$procurement->id.'_'.time().'_'.$file->getClientOriginalName();
                $file->move($backupPath,$filename);
            }
        }

        $procurement->fill($request->except(['receipt_image']));
        $procurement->receipt_image = $receiptImages;
        $procurement->save();

        return response()->json(['message'=>'Procurement updated successfully','data'=>$procurement]);
    }

    // Delete procurement
    public function destroy($id)
    {
        $procurement = Procurement::find($id);
        if(!$procurement) return response()->json(['message'=>'Procurement not found'],404);

        // Optionally: Delete Cloudinary images (not implemented individually here)

        $procurement->delete();
        return response()->json(['message'=>'Procurement deleted successfully']);
    }
}
