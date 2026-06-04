<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalLeadController extends Controller
{
    // List rental leads
    public function index(Request $request)
    {
        $limit = (int)$request->get('limit',10);
        $query = RentalLead::with('user')->orderBy('id','desc');
        if($limit===0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Search rental leads
    public function search(Request $request)
    {
        $limit = (int)$request->get('limit',10);
        $keyword = $request->get('keyword','');
        $query = RentalLead::with('user')
            ->when($keyword, fn($q) => $q->where('name','like',"%$keyword%")
                ->orWhere('email','like',"%$keyword%")
                ->orWhere('contact','like',"%$keyword%")
                ->orWhere('nid','like',"%$keyword%")
                ->orWhere('gender','like',"%$keyword%")
                ->orWhere('occupation','like',"%$keyword%"))
            ->orderBy('id','desc');
        if($limit===0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Store rental lead
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:rental_leads,email',
            'gender'=>'nullable|string|max:20',
            'contact'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'monthly_salary'=>'nullable|numeric',
            'occupation'=>'nullable|string|max:100',
            'background_history'=>'nullable|string',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents'=>'nullable',
            'user_id'=>'required|exists:users,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        // Single image upload
        $imageUrl=null; $imagePublicId=null;
        if($request->hasFile('image')){
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_leads']);
            $imageUrl=$uploaded->getSecurePath();
            $imagePublicId=$uploaded->getPublicId();
            $backupPath=public_path('rental_leads/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        // Multiple documents
        $documentsUrls=[]; $documentsPublicIds=[];
        if($request->hasFile('documents')){
            $backupPath=public_path('rental_leads/documents/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_leads/documents']);
                $documentsUrls[]=$uploaded->getSecurePath();
                $documentsPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
        }

        $rentalLead=RentalLead::create(array_merge($request->all(),[
            'image'=>$imageUrl,
            'cloudinary_image_id'=>$imagePublicId,
            'documents'=>$documentsUrls,
            'documents_public_ids'=>$documentsPublicIds
        ]));

        return response()->json(['message'=>'Rental Lead created successfully','data'=>$rentalLead],201);
    }

    // Show
    public function show($id)
    {
        $lead=RentalLead::with('user')->find($id);
        if(!$lead) return response()->json(['message'=>'Rental Lead not found'],404);
        return response()->json($lead);
    }

    // Update
    public function update(Request $request,$id)
    {
        $lead=RentalLead::find($id);
        if(!$lead) return response()->json(['message'=>'Rental Lead not found'],404);

        $validator = Validator::make($request->all(), [
            'name'=>'sometimes|string|max:255',
            'email'=>'sometimes|email|unique:rental_leads,email,'.$id,
            'gender'=>'nullable|string|max:20',
            'contact'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'monthly_salary'=>'nullable|numeric',
            'occupation'=>'nullable|string|max:100',
            'background_history'=>'nullable|string',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'documents'=>'nullable',
            'user_id'=>'sometimes|exists:users,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        // Image replacement
        if($request->hasFile('image')){
            if($lead->cloudinary_image_id) Cloudinary::destroy($lead->cloudinary_image_id);
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_leads']);
            $lead->image=$uploaded->getSecurePath();
            $lead->cloudinary_image_id=$uploaded->getPublicId();
            $backupPath=public_path('rental_leads/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        // Documents replacement
        if($request->hasFile('documents')){
            $documentsUrls=$lead->documents ?? [];
            $documentsPublicIds=$lead->documents_public_ids ?? [];
            $backupPath=public_path('rental_leads/documents/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_leads/documents']);
                $documentsUrls[]=$uploaded->getSecurePath();
                $documentsPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
            $lead->documents=$documentsUrls;
            $lead->documents_public_ids=$documentsPublicIds;
        }

        $lead->fill($request->except(['image','documents']))->save();
        return response()->json(['message'=>'Rental Lead updated successfully','data'=>$lead]);
    }

    // Delete
    public function destroy($id)
    {
        $lead=RentalLead::find($id);
        if(!$lead) return response()->json(['message'=>'Rental Lead not found'],404);

        if($lead->cloudinary_image_id) Cloudinary::destroy($lead->cloudinary_image_id);
        if($lead->documents_public_ids){
            foreach($lead->documents_public_ids as $publicId) Cloudinary::destroy($publicId);
        }

        $backupPath=public_path('rental_leads/');
        if($lead->image && file_exists($backupPath.basename($lead->image))) unlink($backupPath.basename($lead->image));
        if($lead->documents){
            foreach($lead->documents as $doc){
                $localPath=$backupPath.'documents/'.basename($doc);
                if(file_exists($localPath)) unlink($localPath);
            }
        }

        $lead->delete();
        return response()->json(['message'=>'Rental Lead deleted successfully']);
    }
}
