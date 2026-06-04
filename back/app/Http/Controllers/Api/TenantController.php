<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class TenantController extends Controller
{
    // List tenants
    public function index(Request $request)
    {
        $limit = (int)$request->get('limit', 10);
        $query = Tenant::with(['user','rentalLead'])->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Search tenants
    public function search(Request $request)
    {
        $limit = (int)$request->get('limit',10);
        $keyword = $request->get('keyword','');

        $query = Tenant::with(['user','rentalLead'])
            ->when($keyword,function($q) use($keyword){
                $q->where('name','like',"%$keyword%")
                  ->orWhere('email','like',"%$keyword%")
                  ->orWhere('contact','like',"%$keyword%")
                  ->orWhere('nid','like',"%$keyword%");
            })
            ->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Store tenant
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),[
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:tenants,email',
            'gender'=>'nullable|string|max:20',
            'contact'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents'=>'nullable',
            'user_id'=>'required|exists:users,id',
            'rental_lead_id'=>'nullable|exists:rental_leads,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $imageUrl=null; $imagePublicId=null;
        if($request->hasFile('image')){
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'tenants']);
            $imageUrl=$uploaded->getSecurePath();
            $imagePublicId=$uploaded->getPublicId();
            $backupPath=public_path('tenants/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        $documentUrls=[]; $documentPublicIds=[];
        if($request->hasFile('documents')){
            $backupPath=public_path('tenants/documents/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'tenants/documents']);
                $documentUrls[]=$uploaded->getSecurePath();
                $documentPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
        }

        $tenant = Tenant::create(array_merge($request->all(),[
            'image'=>$imageUrl,
            'cloudinary_image_id'=>$imagePublicId,
            'documents'=>$documentUrls,
            'document_public_ids'=>$documentPublicIds
        ]));

        return response()->json(['message'=>'Tenant created successfully','data'=>$tenant],201);
    }

    // Show
    public function show($id)
    {
        $tenant=Tenant::with(['user','rentalLead'])->find($id);
        if(!$tenant) return response()->json(['message'=>'Tenant not found'],404);
        return response()->json($tenant);
    }

    // Update
    public function update(Request $request,$id)
    {
        $tenant=Tenant::find($id);
        if(!$tenant) return response()->json(['message'=>'Tenant not found'],404);

        $validator=Validator::make($request->all(),[
            'name'=>'sometimes|string|max:255',
            'email'=>'sometimes|email|unique:tenants,email,'.$id,
            'gender'=>'nullable|string|max:20',
            'contact'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents'=>'nullable',
            'user_id'=>'sometimes|exists:users,id',
            'rental_lead_id'=>'nullable|exists:rental_leads,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        if($request->hasFile('image')){
            if($tenant->cloudinary_image_id) Cloudinary::destroy($tenant->cloudinary_image_id);
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'tenants']);
            $tenant->image=$uploaded->getSecurePath();
            $tenant->cloudinary_image_id=$uploaded->getPublicId();
            $backupPath=public_path('tenants/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        if($request->hasFile('documents')){
            $docUrls=$tenant->documents ?? [];
            $docPublicIds=$tenant->document_public_ids ?? [];
            $backupPath=public_path('tenants/documents/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'tenants/documents']);
                $docUrls[]=$uploaded->getSecurePath();
                $docPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
            $tenant->documents=$docUrls;
            $tenant->document_public_ids=$docPublicIds;
        }

        $tenant->fill($request->except(['image','documents']))->save();
        return response()->json(['message'=>'Tenant updated successfully','data'=>$tenant]);
    }

    // Delete
    public function destroy($id)
    {
        $tenant=Tenant::find($id);
        if(!$tenant) return response()->json(['message'=>'Tenant not found'],404);

        if($tenant->cloudinary_image_id) Cloudinary::destroy($tenant->cloudinary_image_id);
        if($tenant->document_public_ids){
            foreach($tenant->document_public_ids as $pid) Cloudinary::destroy($pid);
        }

        $tenant->delete();
        return response()->json(['message'=>'Tenant deleted successfully']);
    }
}
