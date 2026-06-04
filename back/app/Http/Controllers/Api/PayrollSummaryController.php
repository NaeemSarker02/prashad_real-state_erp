<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollSummary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class PayrollSummaryController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = PayrollSummary::with('user')->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit),
        ]);
    }

    // Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = PayrollSummary::with('user')
            ->where('notes', 'like', "%{$keyword}%")
            ->orWhere('total_amount', 'like', "%{$keyword}%")
            ->orWhere('paid_amount', 'like', "%{$keyword}%")
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json([
            'status' => true,
            'data' => $query->paginate($limit),
        ]);
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'time'          => 'required|date',
            'notes'         => 'nullable|string',
            'receipt_image' => 'nullable|array',
            'receipt_image.*' => 'image|mimes:jpeg,png,jpg|max:10240',
            'total_amount'  => 'required|numeric',
            'paid_amount'   => 'required|numeric',
            'status'        => 'boolean',
            'user_id'       => 'required|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $images = [];
        $publicIds = [];

        if ($request->hasFile('receipt_image')) {
            foreach ($request->file('receipt_image') as $image) {
                $upload = Cloudinary::upload($image->getRealPath(), ['folder' => 'payroll_summaries']);
                $images[] = $upload->getSecurePath();
                $publicIds[] = $upload->getPublicId();

                // Backup
                $backupPath = public_path('payroll_summaries');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'summary_' . time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $image->move($backupPath, $filename);
            }
        }

        $summary = PayrollSummary::create([
            ...$request->all(),
            'receipt_image' => $images,
            'cloudinary_public_ids' => $publicIds,
        ]);

        return response()->json(['message' => 'Payroll summary created successfully', 'data' => $summary], 201);
    }

    // Show
    public function show($id)
    {
        $summary = PayrollSummary::with('user')->find($id);
        if (!$summary) return response()->json(['message' => 'Payroll summary not found'], 404);

        return response()->json($summary);
    }

    // Update
    public function update(Request $request, $id)
    {
        $summary = PayrollSummary::find($id);
        if (!$summary) return response()->json(['message' => 'Payroll summary not found'], 404);

        $validator = Validator::make($request->all(), [
            'time'          => 'sometimes|date',
            'notes'         => 'nullable|string',
            'receipt_image' => 'nullable|array',
            'receipt_image.*' => 'image|mimes:jpeg,png,jpg|max:10240',
            'total_amount'  => 'sometimes|numeric',
            'paid_amount'   => 'sometimes|numeric',
            'status'        => 'boolean',
            'user_id'       => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        if ($request->hasFile('receipt_image')) {
            if ($summary->cloudinary_public_ids) {
                foreach ($summary->cloudinary_public_ids as $publicId) {
                    Cloudinary::destroy($publicId);
                }
            }

            $images = [];
            $publicIds = [];
            foreach ($request->file('receipt_image') as $image) {
                $upload = Cloudinary::upload($image->getRealPath(), ['folder' => 'payroll_summaries']);
                $images[] = $upload->getSecurePath();
                $publicIds[] = $upload->getPublicId();

                $backupPath = public_path('payroll_summaries');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'summary_' . $summary->id . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $image->move($backupPath, $filename);
            }

            $summary->receipt_image = $images;
            $summary->cloudinary_public_ids = $publicIds;
        }

        $summary->fill($request->except(['receipt_image']))->save();

        return response()->json(['message' => 'Payroll summary updated successfully', 'data' => $summary]);
    }

    // Destroy
    public function destroy($id)
    {
        $summary = PayrollSummary::find($id);
        if (!$summary) return response()->json(['message' => 'Payroll summary not found'], 404);

        if ($summary->cloudinary_public_ids) {
            foreach ($summary->cloudinary_public_ids as $publicId) {
                Cloudinary::destroy($publicId);
            }
        }

        $summary->delete();

        return response()->json(['message' => 'Payroll summary deleted successfully']);
    }
}
