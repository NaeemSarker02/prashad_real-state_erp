<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class LeadController extends Controller
{
    // ✅ List leads with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Lead::with('user')->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // ✅ Search leads
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword', '');

        $query = Lead::with('user')
            ->where(function ($q) use ($keyword) {
                $kw = "%{$keyword}%";
                $q->where('name', 'like', $kw)
                  ->orWhere('email', 'like', $kw)
                  ->orWhere('contact', 'like', $kw)
                  ->orWhere('nid', 'like', $kw)
                  ->orWhere('gender', 'like', $kw)
                  ->orWhere('occupation', 'like', $kw)
                  ->orWhere('status', $keyword);
            })
            ->orderBy('id', 'desc');

        if ($limit === 0) return response()->json($query->get());

        return response()->json($query->paginate($limit));
    }

    // ✅ Create lead
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:leads',
            'gender' => 'nullable|string|max:20',
            'contact' => 'nullable|string|max:20',
            'nid' => 'nullable|string|max:50',
            'monthly_salary' => 'nullable|numeric',
            'occupation' => 'nullable|string|max:255',
            'background_history' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents.*' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'boolean',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imageUrl = null;
        $publicId = null;

        if ($request->hasFile('image')) {
            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'leads']);
            $imageUrl = $upload->getSecurePath();
            $publicId = $upload->getPublicId();

            // Save local backup
            $backupPath = public_path('leads');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'lead_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        // Upload documents array
        $documents = [];
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $upload = Cloudinary::upload($file->getRealPath(), ['folder' => 'leads/documents']);
                $documents[] = $upload->getSecurePath();

                // Local backup
                $backupPath = public_path('leads/documents');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'doc_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($backupPath, $filename);
            }
        }

        $lead = Lead::create([
            'name' => $request->name,
            'email' => $request->email,
            'gender' => $request->gender,
            'contact' => $request->contact,
            'nid' => $request->nid,
            'monthly_salary' => $request->monthly_salary,
            'occupation' => $request->occupation,
            'background_history' => $request->background_history,
            'image' => $imageUrl,
            'cloudinary_public_id' => $publicId,
            'documents' => $documents,
            'status' => $request->status ?? true,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Lead created successfully', 'data' => $lead], 201);
    }

    // ✅ Show single lead
    public function show($id)
    {
        $lead = Lead::with('user')->find($id);
        if (!$lead) return response()->json(['message' => 'Lead not found'], 404);

        return response()->json($lead);
    }

    // ✅ Update lead
    public function update(Request $request, $id)
    {
        $lead = Lead::find($id);
        if (!$lead) return response()->json(['message' => 'Lead not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:leads,email,' . $id,
            'gender' => 'nullable|string|max:20',
            'contact' => 'nullable|string|max:20',
            'nid' => 'nullable|string|max:50',
            'monthly_salary' => 'nullable|numeric',
            'occupation' => 'nullable|string|max:255',
            'background_history' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents.*' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'status' => 'sometimes|boolean',
            'user_id' => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Replace main image
        if ($request->hasFile('image')) {
            if ($lead->cloudinary_public_id) {
                Cloudinary::destroy($lead->cloudinary_public_id);
            }
            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'leads']);
            $lead->image = $upload->getSecurePath();
            $lead->cloudinary_public_id = $upload->getPublicId();

            // Local backup
            $backupPath = public_path('leads');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'lead_' . $lead->id . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        // Append documents
        if ($request->hasFile('documents')) {
            $existing = $lead->documents ?? [];
            foreach ($request->file('documents') as $file) {
                $upload = Cloudinary::upload($file->getRealPath(), ['folder' => 'leads/documents']);
                $existing[] = $upload->getSecurePath();

                $backupPath = public_path('leads/documents');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'doc_' . $lead->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($backupPath, $filename);
            }
            $lead->documents = $existing;
        }

        $lead->fill($request->except(['image', 'documents']))->save();

        return response()->json(['message' => 'Lead updated successfully', 'data' => $lead]);
    }

    // ✅ Delete lead
    public function destroy($id)
    {
        $lead = Lead::find($id);
        if (!$lead) return response()->json(['message' => 'Lead not found'], 404);

        if ($lead->cloudinary_public_id) {
            Cloudinary::destroy($lead->cloudinary_public_id);
        }

        $lead->delete();

        return response()->json(['message' => 'Lead deleted successfully']);
    }
}
