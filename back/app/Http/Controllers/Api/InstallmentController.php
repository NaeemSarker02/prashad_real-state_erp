<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class InstallmentController extends Controller
{
    // 📌 List installments
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Installment::with(['sale', 'user'])->orderBy('id', 'desc');

        return $limit === 0 ? response()->json($query->get()) : response()->json($query->paginate($limit));
    }

    // 📌 Search installments
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Installment::with(['sale', 'user'])
            ->when($request->get('keyword'), fn($q, $keyword) => $q->where('installment_amount','like',"%{$keyword}%")
                ->orWhere('paid_amount','like',"%{$keyword}%")
                ->orWhere('due_amount','like',"%{$keyword}%"))
            ->when($request->get('sale_id'), fn($q, $saleId) => $q->where('sale_id', $saleId))
            ->when(!is_null($request->get('status')), fn($q, $status) => $q->where('status', $status))
            ->orderBy('id','desc');

        return $limit === 0 ? response()->json($query->get()) : response()->json($query->paginate($limit));
    }

    // 📌 Store installment
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id'=>'required|exists:sales,id',
            'installment_amount'=>'required|numeric',
            'paid_amount'=>'nullable|numeric',
            'due_amount'=>'nullable|numeric',
            'receipt_image'=>'nullable',
            'user_id'=>'required|exists:users,id',
            'status'=>'nullable|string',
            'notes'=>'nullable|string'
        ]);

        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $images = $this->handleReceiptImages($request);

        $installment = Installment::create(array_merge($request->all(), ['receipt_image' => $images]));

        // ✅ Refresh Sale’s paid_amount safely
        $installment->sale->calculatePaidAmount();

        return response()->json([
            'message'=>'Installment created successfully',
            'data'=>$installment->load('sale')
        ],201);
    }

    // 📌 Show installment
    public function show($id)
    {
        $installment = Installment::with(['sale','user'])->find($id);
        return $installment 
            ? response()->json($installment) 
            : response()->json(['message'=>'Installment not found'],404);
    }

    // 📌 Update installment
    public function update(Request $request, $id)
    {
        $installment = Installment::find($id);
        if(!$installment) return response()->json(['message'=>'Installment not found'],404);

        $validator = Validator::make($request->all(), [
            'sale_id'=>'sometimes|exists:sales,id',
            'installment_amount'=>'sometimes|numeric',
            'paid_amount'=>'nullable|numeric',
            'due_amount'=>'nullable|numeric',
            'receipt_image'=>'nullable',
            'user_id'=>'sometimes|exists:users,id',
            'status'=>'nullable|string',
            'notes'=>'nullable|string'
        ]);

        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        if($request->hasFile('receipt_image')){
            $images = $installment->receipt_image ?? [];
            $images = array_merge($images, $this->handleReceiptImages($request));
            $installment->receipt_image = $images;
        }

        $installment->fill($request->except(['receipt_image']))->save();

        // ✅ Refresh Sale’s paid_amount safely
        $installment->sale->calculatePaidAmount();

        return response()->json([
            'message'=>'Installment updated successfully',
            'data'=>$installment->load('sale')
        ]);
    }

    // 📌 Delete installment
    public function destroy($id)
    {
        $installment = Installment::find($id);
        if(!$installment) return response()->json(['message'=>'Installment not found'],404);

        $sale = $installment->sale;
        $installment->delete();

        if($sale) $sale->calculatePaidAmount();

        return response()->json(['message'=>'Installment deleted successfully']);
    }

    // 🔹 Helper: handle receipt image uploads
    private function handleReceiptImages(Request $request): array
    {
        $images = [];
        if(!$request->hasFile('receipt_image')) return $images;

        $backupPath = public_path('installments');
        if(!file_exists($backupPath)) mkdir($backupPath,0777,true);

        foreach($request->file('receipt_image') as $file){
            $uploaded = Cloudinary::upload($file->getRealPath(), ['folder'=>'installments']);
            $images[] = $uploaded->getSecurePath();
            $file->move($backupPath, time().'_'.$file->getClientOriginalName());
        }

        return $images;
    }
}
