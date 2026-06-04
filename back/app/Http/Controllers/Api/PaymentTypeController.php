<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class PaymentTypeController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = PaymentType::with('user')->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Search by name/type/account_number/status
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = PaymentType::with('user')
            ->where('name', 'like', "%{$keyword}%")
            ->orWhere('type', 'like', "%{$keyword}%")
            ->orWhere('account_number', 'like', "%{$keyword}%")
            ->orWhere('status', $keyword)
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // Create
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:payment_types,name',
            'type' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imageUrl = null;
        $publicId = null;

        if ($request->hasFile('image')) {
            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'payment_types']);
            $imageUrl = $upload->getSecurePath();
            $publicId = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('payment_types');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'payment_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $paymentType = PaymentType::create([
            'name' => $request->name,
            'type' => $request->type,
            'account_number' => $request->account_number,
            'image' => $imageUrl,
            'cloudinary_public_id' => $publicId,
            'status' => $request->status ?? true,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Payment type created successfully', 'data' => $paymentType], 201);
    }

    // Show single
    public function show($id)
    {
        $paymentType = PaymentType::with('user')->find($id);
        if (!$paymentType) return response()->json(['message' => 'Payment type not found'], 404);

        return response()->json($paymentType);
    }

    // Update
    public function update(Request $request, $id)
    {
        $paymentType = PaymentType::find($id);
        if (!$paymentType) return response()->json(['message' => 'Payment type not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:payment_types,name,' . $id,
            'type' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'sometimes|boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Replace image
        if ($request->hasFile('image')) {
            if ($paymentType->cloudinary_public_id) {
                Cloudinary::destroy($paymentType->cloudinary_public_id);
            }

            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'payment_types']);
            $paymentType->image = $upload->getSecurePath();
            $paymentType->cloudinary_public_id = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('payment_types');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'payment_' . $paymentType->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $paymentType->fill($request->except(['image']))->save();

        return response()->json(['message' => 'Payment type updated successfully', 'data' => $paymentType]);
    }

    // Delete
    public function destroy($id)
    {
        $paymentType = PaymentType::find($id);
        if (!$paymentType) return response()->json(['message' => 'Payment type not found'], 404);

        if ($paymentType->cloudinary_public_id) {
            Cloudinary::destroy($paymentType->cloudinary_public_id);
        }

        $paymentType->delete();

        return response()->json(['message' => 'Payment type deleted successfully']);
    }
}
