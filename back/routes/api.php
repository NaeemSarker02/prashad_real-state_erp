<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\OwnershipController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;

use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\PayrollSummaryController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\ProcurementController;
use App\Http\Controllers\Api\IncentiveController;

use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AdditionalChargeController;
use App\Http\Controllers\Api\ProjectHierarchyController;

Route::prefix('hierarchy')->group(function () {
    Route::get('project/{id}', [ProjectHierarchyController::class, 'projectFloors']);   // Project + Floors
    Route::get('floor/{id}', [ProjectHierarchyController::class, 'floorUnits']);       // Floor + Units by Block
    Route::get('block/{id}', [ProjectHierarchyController::class, 'blockUnits']);       // Block + Units
    Route::get('project-hierarchy/{id}', [ProjectHierarchyController::class, 'projectHierarchy']); // Full hierarchy
});
Route::prefix('additional-charges')->group(function () {
    Route::get('/', [AdditionalChargeController::class, 'index']);
    Route::get('/search', [AdditionalChargeController::class, 'search']);
    Route::post('/', [AdditionalChargeController::class, 'store']);
    Route::get('/{id}', [AdditionalChargeController::class, 'show']);
    Route::put('/{id}', [AdditionalChargeController::class, 'update']);
    Route::delete('/{id}', [AdditionalChargeController::class, 'destroy']);
});

Route::prefix('transactions')->group(function () {
    Route::get('/', [TransactionController::class, 'index']);
    Route::get('/search', [TransactionController::class, 'search']);
    Route::post('/', [TransactionController::class, 'store']);
    Route::get('/{id}', [TransactionController::class, 'show']);
    Route::put('/{id}', [TransactionController::class, 'update']);
    Route::delete('/{id}', [TransactionController::class, 'destroy']);
});




use App\Http\Controllers\Api\RentalLeadController;
use App\Http\Controllers\Api\RentalOwnershipController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\RentalProjectController;
use App\Http\Controllers\Api\RentalBlockController;
use App\Http\Controllers\Api\RentalFloorController;
use App\Http\Controllers\Api\RentalUnitController;
use App\Http\Controllers\Api\RentalInstallmentController;

Route::prefix('rental-installments')->group(function () {
    Route::get('/', [RentalInstallmentController::class, 'index']);
    Route::get('/search', [RentalInstallmentController::class, 'search']);
    Route::post('/', [RentalInstallmentController::class, 'store']);
    Route::get('/{id}', [RentalInstallmentController::class, 'show']);
    Route::put('/{id}', [RentalInstallmentController::class, 'update']);
    Route::delete('/{id}', [RentalInstallmentController::class, 'destroy']);
});

Route::prefix('rental-units')->group(function () {
    Route::get('/', [RentalUnitController::class, 'index']);
    Route::get('/search', [RentalUnitController::class, 'search']);
    Route::post('/', [RentalUnitController::class, 'store']);
    Route::get('/{id}', [RentalUnitController::class, 'show']);
    Route::put('/{id}', [RentalUnitController::class, 'update']);
    Route::delete('/{id}', [RentalUnitController::class, 'destroy']);
});

Route::prefix('rental-blocks')->group(function () {
    Route::get('/', [RentalBlockController::class,'index']);
    Route::get('/search', [RentalBlockController::class,'search']);
    Route::post('/', [RentalBlockController::class,'store']);
    Route::get('/{id}', [RentalBlockController::class,'show']);
    Route::put('/{id}', [RentalBlockController::class,'update']);
    Route::delete('/{id}', [RentalBlockController::class,'destroy']);
});
Route::prefix('rental-floors')->group(function () {
    Route::get('/', [RentalFloorController::class,'index']);
    Route::get('/search', [RentalFloorController::class,'search']);
    Route::post('/', [RentalFloorController::class,'store']);
    Route::get('/{id}', [RentalFloorController::class,'show']);
    Route::put('/{id}', [RentalFloorController::class,'update']);
    Route::delete('/{id}', [RentalFloorController::class,'destroy']);
});

Route::prefix('rental-projects')->group(function(){
    Route::get('/', [RentalProjectController::class,'index']);
    Route::get('/search', [RentalProjectController::class,'search']);
    Route::post('/', [RentalProjectController::class,'store']);
    Route::get('/{id}', [RentalProjectController::class,'show']);
    Route::put('/{id}', [RentalProjectController::class,'update']);
    Route::delete('/{id}', [RentalProjectController::class,'destroy']);
});

Route::prefix('tenants')->group(function(){
    Route::get('/', [TenantController::class,'index']);
    Route::get('/search', [TenantController::class,'search']);
    Route::post('/', [TenantController::class,'store']);
    Route::get('/{id}', [TenantController::class,'show']);
    Route::put('/{id}', [TenantController::class,'update']);
    Route::delete('/{id}', [TenantController::class,'destroy']);
});

Route::prefix('rental-ownerships')->group(function(){
    Route::get('/', [RentalOwnershipController::class,'index']);
    Route::get('/search', [RentalOwnershipController::class,'search']);
    Route::post('/', [RentalOwnershipController::class,'store']);
    Route::get('/{id}', [RentalOwnershipController::class,'show']);
    Route::put('/{id}', [RentalOwnershipController::class,'update']);
    Route::delete('/{id}', [RentalOwnershipController::class,'destroy']);
});

Route::prefix('rental-leads')->group(function(){
    Route::get('/', [RentalLeadController::class,'index']);
    Route::get('/search', [RentalLeadController::class,'search']);
    Route::post('/', [RentalLeadController::class,'store']);
    Route::get('/{id}', [RentalLeadController::class,'show']);
    Route::put('/{id}', [RentalLeadController::class,'update']);
    Route::delete('/{id}', [RentalLeadController::class,'destroy']);
});






Route::prefix('floors')->group(function () {
    Route::get('/', [FloorController::class, 'index']);          // List with pagination
    Route::get('/search', [FloorController::class, 'search']);   // Search
    Route::post('/', [FloorController::class, 'store']);         // Create
    Route::get('/{id}', [FloorController::class, 'show']);       // Show single
    Route::put('/{id}', [FloorController::class, 'update']);     // Update
    Route::delete('/{id}', [FloorController::class, 'destroy']); // Delete
});

Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);          // List roles (with pagination or all if limit=0)
    Route::get('/search', [RoleController::class, 'searchRoles']); // Search roles
    Route::post('/', [RoleController::class, 'store']);         // Create role
    Route::get('/{id}', [RoleController::class, 'show']);       // Show single role
    Route::put('/{id}', [RoleController::class, 'update']);     // Update role
    Route::delete('/{id}', [RoleController::class, 'destroy']); // Delete role
});
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);         // List users (with pagination or all if limit=0)
    Route::get('/search', [UserController::class, 'searchUsers']); // Search users
    Route::post('/', [UserController::class, 'store']);        // Create user
    Route::get('/{id}', [UserController::class, 'show']);      // Show single user
    Route::put('/{id}', [UserController::class, 'update']);    // Update user (full update)
    Route::delete('/{id}', [UserController::class, 'destroy']); // Delete user
});
Route::prefix('ownerships')->group(function () {
    Route::get('/', [OwnershipController::class, 'index']);          // List ownerships
    Route::get('/search', [OwnershipController::class, 'search']);   // Search ownerships
    Route::post('/', [OwnershipController::class, 'store']);         // Create ownership
    Route::get('/{id}', [OwnershipController::class, 'show']);       // Show ownership
    Route::put('/{id}', [OwnershipController::class, 'update']);     // Update ownership
    Route::delete('/{id}', [OwnershipController::class, 'destroy']); // Delete ownership
});
Route::prefix('expense-categories')->group(function () {
    Route::get('/', [ExpenseCategoryController::class, 'index']);          // List
    Route::get('/search', [ExpenseCategoryController::class, 'search']);   // Search
    Route::post('/', [ExpenseCategoryController::class, 'store']);         // Create
    Route::get('/{id}', [ExpenseCategoryController::class, 'show']);       // Show
    Route::put('/{id}', [ExpenseCategoryController::class, 'update']);     // Update
    Route::delete('/{id}', [ExpenseCategoryController::class, 'destroy']); // Delete
});
Route::prefix('expenses')->group(function () {
    Route::get('/', [ExpenseController::class, 'index']);          // List
    Route::get('/search', [ExpenseController::class, 'search']);   // Search
    Route::post('/', [ExpenseController::class, 'store']);         // Create
    Route::get('/{id}', [ExpenseController::class, 'show']);       // Show
    Route::put('/{id}', [ExpenseController::class, 'update']);     // Update
    Route::delete('/{id}', [ExpenseController::class, 'destroy']); // Delete
});
Route::prefix('leads')->group(function () {
    Route::get('/', [LeadController::class, 'index']);          // List
    Route::get('/search', [LeadController::class, 'search']);   // Search
    Route::post('/', [LeadController::class, 'store']);         // Create
    Route::get('/{id}', [LeadController::class, 'show']);       // Show
    Route::put('/{id}', [LeadController::class, 'update']);     // Update
    Route::delete('/{id}', [LeadController::class, 'destroy']); // Delete
});

Route::prefix('payment-types')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);          // List
    Route::get('/search', [PaymentTypeController::class, 'search']);   // Search
    Route::post('/', [PaymentTypeController::class, 'store']);         // Create
    Route::get('/{id}', [PaymentTypeController::class, 'show']);       // Show
    Route::put('/{id}', [PaymentTypeController::class, 'update']);     // Update
    Route::delete('/{id}', [PaymentTypeController::class, 'destroy']); // Delete
});

Route::prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);        // List
    Route::get('/search', [CustomerController::class, 'search']); // Search
    Route::post('/', [CustomerController::class, 'store']);       // Create
    Route::get('/{id}', [CustomerController::class, 'show']);     // Show
    Route::put('/{id}', [CustomerController::class, 'update']);   // Update
    Route::delete('/{id}', [CustomerController::class, 'destroy']); // Delete
});
Route::prefix('employees')->group(function () {
    Route::get('/', [EmployeeController::class, 'index']);       // List employees
    Route::get('/search', [EmployeeController::class, 'search']); // Search employees
    Route::post('/', [EmployeeController::class, 'store']);      // Create employee
    Route::get('/{id}', [EmployeeController::class, 'show']);    // Show employee
    Route::put('/{id}', [EmployeeController::class, 'update']);  // Update employee
    Route::delete('/{id}', [EmployeeController::class, 'destroy']); // Delete employee
});

Route::prefix('payrolls')->group(function () {
    Route::get('/', [PayrollController::class, 'index']);        // List
    Route::get('/search', [PayrollController::class, 'search']); // Search
    Route::post('/', [PayrollController::class, 'store']);       // Create
    Route::get('/{id}', [PayrollController::class, 'show']);     // Show
    Route::put('/{id}', [PayrollController::class, 'update']);   // Update
    Route::delete('/{id}', [PayrollController::class, 'destroy']); // Delete
});
Route::prefix('payroll-summaries')->group(function () {
    Route::get('/', [PayrollSummaryController::class, 'index']);       // List
    Route::get('/search', [PayrollSummaryController::class, 'search']); // Search
    Route::post('/', [PayrollSummaryController::class, 'store']);      // Create
    Route::get('/{id}', [PayrollSummaryController::class, 'show']);    // Show
    Route::put('/{id}', [PayrollSummaryController::class, 'update']);  // Update
    Route::delete('/{id}', [PayrollSummaryController::class, 'destroy']); // Delete
});
Route::prefix('projects')->group(function () {
    Route::get('/', [ProjectController::class, 'index']);
    Route::get('/search', [ProjectController::class, 'search']);
    Route::post('/', [ProjectController::class, 'store']);
    Route::get('/{id}', [ProjectController::class, 'show']);
    Route::put('/{id}', [ProjectController::class, 'update']);
    Route::delete('/{id}', [ProjectController::class, 'destroy']);
});
Route::prefix('blocks')->group(function () {
    Route::get('/', [BlockController::class, 'index']);       // List blocks
    Route::get('/search', [BlockController::class, 'search']); // Search blocks
    Route::post('/', [BlockController::class, 'store']);      // Create block
    Route::get('/{id}', [BlockController::class, 'show']);    // Show block
    Route::put('/{id}', [BlockController::class, 'update']);  // Update block
    Route::delete('/{id}', [BlockController::class, 'destroy']); // Delete block
});

Route::prefix('units')->group(function(){
    Route::get('/', [UnitController::class,'index']);
    Route::get('/search',[UnitController::class,'search']);
    Route::post('/',[UnitController::class,'store']);
    Route::get('/{id}',[UnitController::class,'show']);
    Route::put('/{id}',[UnitController::class,'update']);
    Route::delete('/{id}',[UnitController::class,'destroy']);
});
Route::prefix('procurements')->group(function(){
    Route::get('/', [ProcurementController::class,'index']);
    Route::get('/search',[ProcurementController::class,'search']);
    Route::post('/',[ProcurementController::class,'store']);
    Route::get('/{id}',[ProcurementController::class,'show']);
    Route::put('/{id}',[ProcurementController::class,'update']);
    Route::delete('/{id}',[ProcurementController::class,'destroy']);
});
Route::prefix('incentives')->group(function(){
    Route::get('/', [IncentiveController::class,'index']);
    Route::get('/search',[IncentiveController::class,'search']);
    Route::post('/',[IncentiveController::class,'store']);
    Route::get('/{id}',[IncentiveController::class,'show']);
    Route::put('/{id}',[IncentiveController::class,'update']);
    Route::delete('/{id}',[IncentiveController::class,'destroy']);
});
Route::prefix('sales')->group(function(){
    Route::get('/', [SaleController::class,'index']);
    Route::get('/search',[SaleController::class,'search']);
    Route::post('/',[SaleController::class,'store']);
    Route::get('/{id}',[SaleController::class,'show']);
    Route::put('/{id}',[SaleController::class,'update']);
    Route::delete('/{id}',[SaleController::class,'destroy']);
});


Route::prefix('installments')->group(function(){
    Route::get('/', [InstallmentController::class,'index']);
    Route::get('/search',[InstallmentController::class,'search']);
    Route::post('/',[InstallmentController::class,'store']);
    Route::get('/{id}',[InstallmentController::class,'show']);
    Route::put('/{id}',[InstallmentController::class,'update']);
    Route::delete('/{id}',[InstallmentController::class,'destroy']);
});


