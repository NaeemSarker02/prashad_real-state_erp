<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class TransactionController extends Controller
{
    // ✅ List transactions
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Transaction::with(['user', 'paymentType'])->orderBy('id', 'desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // ✅ Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Transaction::with(['user', 'paymentType'])
            ->where('notes', 'like', "%{$keyword}%")
            ->orWhere('amount', 'like', "%{$keyword}%")
            ->orWhere('type', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // ✅ Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'amount' => 'required|numeric',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails())
            return response()->json(['errors' => $validator->errors()], 422);

        $imageUrl = null;
        $publicId = null;

        if ($request->hasFile('image')) {
            $uploaded = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'transactions']);
            $imageUrl = $uploaded->getSecurePath();
            $publicId = $uploaded->getPublicId();

            $backupPath = public_path('transactions');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = time().'_'.$request->file('image')->getClientOriginalName();
            $request->file('image')->move($backupPath, $filename);
        }

        $transaction = Transaction::create(array_merge(
            $request->all(),
            ['image' => $imageUrl, 'cloudinary_public_id' => $publicId]
        ));

        return response()->json(['message' => 'Transaction created', 'data' => $transaction], 201);
    }

    // ✅ Show
    public function show($id)
    {
        $transaction = Transaction::with(['user','paymentType'])->find($id);
        return $transaction
            ? response()->json($transaction)
            : response()->json(['message' => 'Transaction not found'], 404);
    }

    // ✅ Update
    public function update(Request $request, $id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) return response()->json(['message' => 'Transaction not found'], 404);

        $validator = Validator::make($request->all(), [
            'payment_type_id' => 'nullable|exists:payment_types,id',
            'amount' => 'sometimes|numeric',
            'notes' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
        ]);

        if ($validator->fails())
            return response()->json(['errors' => $validator->errors()], 422);

        if ($request->hasFile('image')) {
            if ($transaction->cloudinary_public_id) Cloudinary::destroy($transaction->cloudinary_public_id);

            $uploaded = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'transactions']);
            $transaction->image = $uploaded->getSecurePath();
            $transaction->cloudinary_public_id = $uploaded->getPublicId();

            $backupPath = public_path('transactions');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = time().'_'.$request->file('image')->getClientOriginalName();
            $request->file('image')->move($backupPath, $filename);
        }

        $transaction->fill($request->except('image'))->save();

        return response()->json(['message' => 'Transaction updated', 'data' => $transaction]);
    }

    // ✅ Destroy
    public function destroy($id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) return response()->json(['message' => 'Transaction not found'], 404);

        if ($transaction->cloudinary_public_id) Cloudinary::destroy($transaction->cloudinary_public_id);

        $transaction->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }
}
