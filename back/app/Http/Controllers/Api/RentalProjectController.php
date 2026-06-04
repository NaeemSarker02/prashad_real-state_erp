<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalProjectController extends Controller
{
    // List all
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = RentalProject::with(['rentalOwnership','user'])->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $keyword = $request->get('keyword','');

        $query = RentalProject::with(['rentalOwnership','user'])
            ->when($keyword,function($q) use($keyword){
                $q->where('name','like',"%$keyword%")
                  ->orWhere('location','like',"%$keyword%");
            })
            ->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),[
            'name'=>'required|string|max:255',
            'location'=>'nullable|string|max:255',
            'valuation'=>'nullable|numeric',
            'rental_ownership_id'=>'required|exists:rental_ownerships,id',
            'owner_percentage'=>'nullable|numeric',
            'notes'=>'nullable|string',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_documents.*'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'type'=>'nullable|string',
            'is_completed'=>'boolean',
            'status'=>'boolean',
            'user_id'=>'required|exists:users,id'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        $imageUrl=null; $imagePublicId=null;
        if($request->hasFile('image')){
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_projects']);
            $imageUrl=$uploaded->getSecurePath();
            $imagePublicId=$uploaded->getPublicId();
            $backupPath=public_path('rental_projects/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        $docUrls=[]; $docPublicIds=[];
        if($request->hasFile('contract_documents')){
            $backupPath=public_path('rental_projects/contracts/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('contract_documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_projects/contracts']);
                $docUrls[]=$uploaded->getSecurePath();
                $docPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
        }

        $project = RentalProject::create(array_merge($request->all(),[
            'image'=>$imageUrl,
            'cloudinary_image_id'=>$imagePublicId,
            'contract_documents'=>$docUrls,
            'contract_public_ids'=>$docPublicIds
        ]));

        return response()->json(['message'=>'Rental Project created successfully','data'=>$project],201);
    }

    // Show
    public function show($id)
    {
        $project=RentalProject::with(['rentalOwnership','user'])->find($id);
        if(!$project) return response()->json(['message'=>'Rental Project not found'],404);
        return response()->json($project);
    }

    // Update
    public function update(Request $request,$id)
    {
        $project=RentalProject::find($id);
        if(!$project) return response()->json(['message'=>'Rental Project not found'],404);

        $validator=Validator::make($request->all(),[
            'name'=>'sometimes|string|max:255',
            'location'=>'nullable|string|max:255',
            'valuation'=>'nullable|numeric',
            'rental_ownership_id'=>'sometimes|exists:rental_ownerships,id',
            'owner_percentage'=>'nullable|numeric',
            'notes'=>'nullable|string',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_documents.*'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'type'=>'nullable|string',
            'is_completed'=>'boolean',
            'status'=>'boolean',
            'user_id'=>'sometimes|exists:users,id'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        if($request->hasFile('image')){
            if($project->cloudinary_image_id) Cloudinary::destroy($project->cloudinary_image_id);
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_projects']);
            $project->image=$uploaded->getSecurePath();
            $project->cloudinary_image_id=$uploaded->getPublicId();
            $backupPath=public_path('rental_projects/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        if($request->hasFile('contract_documents')){
            $docUrls=$project->contract_documents ?? [];
            $docPublicIds=$project->contract_public_ids ?? [];
            $backupPath=public_path('rental_projects/contracts/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('contract_documents') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_projects/contracts']);
                $docUrls[]=$uploaded->getSecurePath();
                $docPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
            $project->contract_documents=$docUrls;
            $project->contract_public_ids=$docPublicIds;
        }

        $project->fill($request->except(['image','contract_documents']))->save();
        return response()->json(['message'=>'Rental Project updated successfully','data'=>$project]);
    }

    // Delete
    public function destroy($id)
    {
        $project=RentalProject::find($id);
        if(!$project) return response()->json(['message'=>'Rental Project not found'],404);

        if($project->cloudinary_image_id) Cloudinary::destroy($project->cloudinary_image_id);
        if($project->contract_public_ids){
            foreach($project->contract_public_ids as $pid) Cloudinary::destroy($pid);
        }

        $project->delete();
        return response()->json(['message'=>'Rental Project deleted successfully']);
    }
}
