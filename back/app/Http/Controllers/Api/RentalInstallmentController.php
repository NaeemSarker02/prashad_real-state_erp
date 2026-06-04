<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalInstallment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalInstallmentController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = RentalInstallment::with(['rentalUnit', 'user'])->orderBy('id', 'desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = RentalInstallment::with(['rentalUnit', 'user'])
            ->where('installment_amount', 'like', "%{$keyword}%")
            ->orWhere('paid_amount', 'like', "%{$keyword}%")
            ->orWhere('due_amount', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'rental_unit_id' => 'required|exists:rental_units,id',
            'installment_amount' => 'required|numeric',
            'paid_amount' => 'nullable|numeric',
            'due_amount' => 'nullable|numeric',
            'receipt_images.*' => 'nullable|image|mimes:jpg,jpeg,png|max:10240',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except('receipt_images');

        // Upload multiple receipt images
        $uploadedImages = [];
        if ($request->hasFile('receipt_images')) {
            foreach ($request->file('receipt_images') as $image) {
                $uploadedFileUrl = Cloudinary::upload($image->getRealPath(), ['folder' => 'rental_installments'])->getSecurePath();
                $uploadedImages[] = $uploadedFileUrl;

                // Backup locally
                $backupPath = public_path('rental_installments');
                if (!file_exists($backupPath)) {
                    mkdir($backupPath, 0777, true);
                }
                $image->move($backupPath, time() . '_' . $image->getClientOriginalName());
            }
        }

        $data['receipt_images'] = $uploadedImages;

        $installment = RentalInstallment::create($data);

        return response()->json(['message' => 'Rental Installment created successfully', 'data' => $installment], 201);
    }

    // Show
    public function show($id)
    {
        $installment = RentalInstallment::with(['rentalUnit', 'user'])->find($id);
        if (!$installment) return response()->json(['message' => 'Rental Installment not found'], 404);
        return response()->json($installment);
    }

    // Update
    public function update(Request $request, $id)
    {
        $installment = RentalInstallment::find($id);
        if (!$installment) return response()->json(['message' => 'Rental Installment not found'], 404);

        $validator = Validator::make($request->all(), [
            'rental_unit_id' => 'sometimes|exists:rental_units,id',
            'installment_amount' => 'sometimes|numeric',
            'paid_amount' => 'sometimes|numeric',
            'due_amount' => 'sometimes|numeric',
            'receipt_images.*' => 'nullable|image|mimes:jpg,jpeg,png|max:10240',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except('receipt_images');

        // Replace images if new uploaded
        $uploadedImages = $installment->receipt_images ?? [];
        if ($request->hasFile('receipt_images')) {
            foreach ($request->file('receipt_images') as $image) {
                $uploadedFileUrl = Cloudinary::upload($image->getRealPath(), ['folder' => 'rental_installments'])->getSecurePath();
                $uploadedImages[] = $uploadedFileUrl;

                // Backup locally
                $backupPath = public_path('rental_installments');
                if (!file_exists($backupPath)) {
                    mkdir($backupPath, 0777, true);
                }
                $image->move($backupPath, time() . '_' . $image->getClientOriginalName());
            }
        }

        $data['receipt_images'] = $uploadedImages;

        $installment->update($data);

        return response()->json(['message' => 'Rental Installment updated successfully', 'data' => $installment]);
    }

    // Delete
    public function destroy($id)
    {
        $installment = RentalInstallment::find($id);
        if (!$installment) return response()->json(['message' => 'Rental Installment not found'], 404);

        $installment->delete();
        return response()->json(['message' => 'Rental Installment deleted successfully']);
    }
}
