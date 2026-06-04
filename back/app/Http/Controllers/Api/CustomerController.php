<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class CustomerController extends Controller
{
    // List customers
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Customer::with(['user', 'lead'])->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit)
        ]);
    }

    // Search customers
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Customer::with(['user', 'lead'])
            ->where('name', 'like', "%{$keyword}%")
            ->orWhere('email', 'like', "%{$keyword}%")
            ->orWhere('status', $keyword)
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit)
        ]);
    }

    // Create customer
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|unique:customers',
            'lead_id' => 'required|exists:leads,id',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'  => 'nullable|boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $imageUrl = null;
        $publicId = null;

        if ($request->hasFile('image')) {
            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'customers']);
            $imageUrl = $upload->getSecurePath();
            $publicId = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('customers');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'customer_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $customer = Customer::create([
            'name'  => $request->name,
            'email' => $request->email,
            'lead_id' => $request->lead_id,
            'image' => $imageUrl,
            'cloudinary_public_id' => $publicId,
            'status' => $request->status ?? true,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Customer created successfully', 'data' => $customer], 201);
    }

    // Show single customer
    public function show($id)
    {
        $customer = Customer::with(['user', 'lead'])->find($id);
        if (!$customer) return response()->json(['message' => 'Customer not found'], 404);

        return response()->json($customer);
    }

    // Update customer
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['message' => 'Customer not found'], 404);

        $validator = Validator::make($request->all(), [
            'name'    => 'sometimes|string|max:255',
            'email'   => 'sometimes|email|unique:customers,email,' . $id,
            'lead_id' => 'sometimes|exists:leads,id',
            'image'   => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status'  => 'sometimes|boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($request->hasFile('image')) {
            if ($customer->cloudinary_public_id) Cloudinary::destroy($customer->cloudinary_public_id);

            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'customers']);
            $customer->image = $upload->getSecurePath();
            $customer->cloudinary_public_id = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('customers');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'customer_' . $customer->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $customer->fill($request->except(['image']))->save();

        return response()->json(['message' => 'Customer updated successfully', 'data' => $customer]);
    }

    // Delete customer
    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) return response()->json(['message' => 'Customer not found'], 404);

        if ($customer->cloudinary_public_id) Cloudinary::destroy($customer->cloudinary_public_id);

        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully']);
    }
}
