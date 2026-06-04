<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ProjectController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = Project::with(['user', 'ownership'])->orderBy('id', 'desc');

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

        $query = Project::with(['user', 'ownership'])
            ->where('name', 'like', "%{$keyword}%")
            ->orWhere('location', 'like', "%{$keyword}%")
            ->orWhere('valuation', 'like', "%{$keyword}%")
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
            'name'               => 'required|string|max:255',
            'location'           => 'nullable|string',
            'valuation'          => 'required|numeric',
            'ownership_id'       => 'required|exists:ownerships,id',
            'owner_percentage'   => 'numeric|min:0|max:100',
            'note'               => 'nullable|string',
            'contract_documents' => 'nullable|array',
            'contract_documents.*' => 'image|mimes:jpeg,png,jpg|max:10240',
            'image'              => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'is_completed'       => 'boolean',
            'status'             => 'boolean',
            'user_id'            => 'required|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $contractDocs = [];
        $contractPublicIds = [];

        // Upload multiple contract documents
        if ($request->hasFile('contract_documents')) {
            foreach ($request->file('contract_documents') as $doc) {
                $upload = Cloudinary::upload($doc->getRealPath(), ['folder' => 'projects/contracts']);
                $contractDocs[] = $upload->getSecurePath();
                $contractPublicIds[] = $upload->getPublicId();

                // Backup
                $backupPath = public_path('projects/contracts');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'contract_' . time() . '_' . uniqid() . '.' . $doc->getClientOriginalExtension();
                $doc->move($backupPath, $filename);
            }
        }

        // Upload main image
        $imageUrl = null;
        $publicId = null;
        if ($request->hasFile('image')) {
            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'projects']);
            $imageUrl = $upload->getSecurePath();
            $publicId = $upload->getPublicId();

            $backupPath = public_path('projects');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'project_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $project = Project::create([
            ...$request->all(),
            'contract_documents' => $contractDocs,
            'cloudinary_public_ids' => $contractPublicIds,
            'image' => $imageUrl,
            'cloudinary_image_id' => $publicId,
        ]);

        return response()->json(['message' => 'Project created successfully', 'data' => $project], 201);
    }

    // Show
    public function show($id)
    {
        $project = Project::with(['user', 'ownership'])->find($id);
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        return response()->json($project);
    }

    // Update
    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        $validator = Validator::make($request->all(), [
            'name'               => 'sometimes|string|max:255',
            'location'           => 'nullable|string',
            'valuation'          => 'sometimes|numeric',
            'ownership_id'       => 'sometimes|exists:ownerships,id',
            'owner_percentage'   => 'numeric|min:0|max:100',
            'note'               => 'nullable|string',
            'contract_documents' => 'nullable|array',
            'contract_documents.*' => 'image|mimes:jpeg,png,jpg|max:10240',
            'image'              => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'is_completed'       => 'boolean',
            'status'             => 'boolean',
            'user_id'            => 'sometimes|exists:users,id',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        // Replace contract documents
        if ($request->hasFile('contract_documents')) {
            if ($project->cloudinary_public_ids) {
                foreach ($project->cloudinary_public_ids as $pid) {
                    Cloudinary::destroy($pid);
                }
            }

            $contractDocs = [];
            $contractPublicIds = [];
            foreach ($request->file('contract_documents') as $doc) {
                $upload = Cloudinary::upload($doc->getRealPath(), ['folder' => 'projects/contracts']);
                $contractDocs[] = $upload->getSecurePath();
                $contractPublicIds[] = $upload->getPublicId();

                $backupPath = public_path('projects/contracts');
                if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
                $filename = 'contract_' . $project->id . '_' . uniqid() . '.' . $doc->getClientOriginalExtension();
                $doc->move($backupPath, $filename);
            }

            $project->contract_documents = $contractDocs;
            $project->cloudinary_public_ids = $contractPublicIds;
        }

        // Replace main image
        if ($request->hasFile('image')) {
            if ($project->cloudinary_image_id) {
                Cloudinary::destroy($project->cloudinary_image_id);
            }

            $upload = Cloudinary::upload($request->file('image')->getRealPath(), ['folder' => 'projects']);
            $project->image = $upload->getSecurePath();
            $project->cloudinary_image_id = $upload->getPublicId();

            $backupPath = public_path('projects');
            if (!file_exists($backupPath)) mkdir($backupPath, 0777, true);
            $filename = 'project_' . $project->id . '_' . uniqid() . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($backupPath, $filename);
        }

        $project->fill($request->except(['contract_documents', 'image']))->save();

        return response()->json(['message' => 'Project updated successfully', 'data' => $project]);
    }

    // Destroy
    public function destroy($id)
    {
        $project = Project::find($id);
        if (!$project) return response()->json(['message' => 'Project not found'], 404);

        if ($project->cloudinary_public_ids) {
            foreach ($project->cloudinary_public_ids as $pid) {
                Cloudinary::destroy($pid);
            }
        }
        if ($project->cloudinary_image_id) {
            Cloudinary::destroy($project->cloudinary_image_id);
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }
}
