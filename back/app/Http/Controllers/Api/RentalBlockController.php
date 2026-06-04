<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RentalBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RentalBlockController extends Controller
{
    // List with pagination
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 10);
        $query = RentalBlock::with(['rentalProject','user'])->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Search
    public function search(Request $request)
    {
        $limit = (int) $request->get('limit',10);
        $keyword = $request->get('keyword','');

        $query = RentalBlock::with(['rentalProject','user'])
            ->where('block_name','like',"%{$keyword}%")
            ->orderBy('id','desc');

        return $limit === 0
            ? response()->json($query->get())
            : response()->json($query->paginate($limit));
    }

    // Store
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),[
            'block_name'=>'required|string|max:255',
            'rental_project_id'=>'required|exists:rental_projects,id',
            'status'=>'boolean',
            'user_id'=>'required|exists:users,id'
        ]);

        if($validator->fails()){
            return response()->json(['errors'=>$validator->errors()],422);
        }

        $block = RentalBlock::create($request->all());

        return response()->json(['message'=>'Rental Block created successfully','data'=>$block],201);
    }

    // Show
    public function show($id)
    {
        $block = RentalBlock::with(['rentalProject','user'])->find($id);
        if(!$block) return response()->json(['message'=>'Rental Block not found'],404);
        return response()->json($block);
    }

    // Update
    public function update(Request $request,$id)
    {
        $block = RentalBlock::find($id);
        if(!$block) return response()->json(['message'=>'Rental Block not found'],404);

        $validator = Validator::make($request->all(),[
            'block_name'=>'sometimes|string|max:255',
            'rental_project_id'=>'sometimes|exists:rental_projects,id',
            'status'=>'boolean',
            'user_id'=>'sometimes|exists:users,id'
        ]);

        if($validator->fails()){
            return response()->json(['errors'=>$validator->errors()],422);
        }

        $block->fill($request->all())->save();

        return response()->json(['message'=>'Rental Block updated successfully','data'=>$block]);
    }

    // Delete
    public function destroy($id)
    {
        $block = RentalBlock::find($id);
        if(!$block) return response()->json(['message'=>'Rental Block not found'],404);

        $block->delete();
        return response()->json(['message'=>'Rental Block deleted successfully']);
    }
}
