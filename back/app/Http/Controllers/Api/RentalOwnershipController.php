<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalOwnership;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class RentalOwnershipController extends Controller
{
    // List rental ownerships
    public function index(Request $request)
    {
        $limit=(int)$request->get('limit',10);
        $query=RentalOwnership::with('user')->orderBy('id','desc');
        if($limit===0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Search rental ownerships
    public function search(Request $request)
    {
        $limit=(int)$request->get('limit',10);
        $keyword=$request->get('keyword','');
        $query=RentalOwnership::with('user')
            ->when($keyword,function($q) use($keyword){
                $q->where('name','like',"%$keyword%")
                  ->orWhere('email','like',"%$keyword%")
                  ->orWhere('phone','like',"%$keyword%")
                  ->orWhere('nid','like',"%$keyword%");
            })->orderBy('id','desc');

        if($limit===0) return response()->json($query->get());
        return response()->json($query->paginate($limit));
    }

    // Store rental ownership
    public function store(Request $request)
    {
        $validator=Validator::make($request->all(),[
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:rental_ownerships,email',
            'gender'=>'nullable|string|max:20',
            'phone'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_image'=>'nullable',
            'contract_start_date'=>'nullable|date',
            'contract_end_date'=>'nullable|date',
            'user_id'=>'required|exists:users,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        // Upload single image
        $imageUrl=null; $imagePublicId=null;
        if($request->hasFile('image')){
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_ownerships']);
            $imageUrl=$uploaded->getSecurePath();
            $imagePublicId=$uploaded->getPublicId();
            $backupPath=public_path('rental_ownerships/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        // Upload contract images
        $contractUrls=[]; $contractPublicIds=[];
        if($request->hasFile('contract_image')){
            $backupPath=public_path('rental_ownerships/contracts/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('contract_image') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_ownerships/contracts']);
                $contractUrls[]=$uploaded->getSecurePath();
                $contractPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
        }

        $ownership=RentalOwnership::create(array_merge($request->all(),[
            'image'=>$imageUrl,
            'cloudinary_image_id'=>$imagePublicId,
            'contract_image'=>$contractUrls,
            'contract_image_public_ids'=>$contractPublicIds
        ]));

        return response()->json(['message'=>'Rental Ownership created successfully','data'=>$ownership],201);
    }

    // Show
    public function show($id)
    {
        $ownership=RentalOwnership::with('user')->find($id);
        if(!$ownership) return response()->json(['message'=>'Rental Ownership not found'],404);
        return response()->json($ownership);
    }

    // Update
    public function update(Request $request,$id)
    {
        $ownership=RentalOwnership::find($id);
        if(!$ownership) return response()->json(['message'=>'Rental Ownership not found'],404);

        $validator=Validator::make($request->all(),[
            'name'=>'sometimes|string|max:255',
            'email'=>'sometimes|email|unique:rental_ownerships,email,'.$id,
            'gender'=>'nullable|string|max:20',
            'phone'=>'nullable|string|max:20',
            'nid'=>'nullable|string|max:50',
            'image'=>'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'contract_image'=>'nullable',
            'contract_start_date'=>'nullable|date',
            'contract_end_date'=>'nullable|date',
            'user_id'=>'sometimes|exists:users,id',
            'status'=>'boolean'
        ]);
        if($validator->fails()) return response()->json(['errors'=>$validator->errors()],422);

        // Replace image
        if($request->hasFile('image')){
            if($ownership->cloudinary_image_id) Cloudinary::destroy($ownership->cloudinary_image_id);
            $uploaded=Cloudinary::upload($request->file('image')->getRealPath(),['folder'=>'rental_ownerships']);
            $ownership->image=$uploaded->getSecurePath();
            $ownership->cloudinary_image_id=$uploaded->getPublicId();
            $backupPath=public_path('rental_ownerships/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            $request->file('image')->move($backupPath,time().'_'.$request->file('image')->getClientOriginalName());
        }

        // Add more contract images
        if($request->hasFile('contract_image')){
            $contractUrls=$ownership->contract_image ?? [];
            $contractPublicIds=$ownership->contract_image_public_ids ?? [];
            $backupPath=public_path('rental_ownerships/contracts/');
            if(!file_exists($backupPath)) mkdir($backupPath,0777,true);
            foreach($request->file('contract_image') as $file){
                $uploaded=Cloudinary::upload($file->getRealPath(),['folder'=>'rental_ownerships/contracts']);
                $contractUrls[]=$uploaded->getSecurePath();
                $contractPublicIds[]=$uploaded->getPublicId();
                $file->move($backupPath,time().'_'.$file->getClientOriginalName());
            }
            $ownership->contract_image=$contractUrls;
            $ownership->contract_image_public_ids=$contractPublicIds;
        }

        $ownership->fill($request->except(['image','contract_image']))->save();
        return response()->json(['message'=>'Rental Ownership updated successfully','data'=>$ownership]);
    }

    // Destroy
    public function destroy($id)
    {
        $ownership=RentalOwnership::find($id);
        if(!$ownership) return response()->json(['message'=>'Rental Ownership not found'],404);

        if($ownership->cloudinary_image_id) Cloudinary::destroy($ownership->cloudinary_image_id);
        if($ownership->contract_image_public_ids){
            foreach($ownership->contract_image_public_ids as $pid) Cloudinary::destroy($pid);
        }

        $ownership->delete();
        return response()->json(['message'=>'Rental Ownership deleted successfully']);
    }
}
