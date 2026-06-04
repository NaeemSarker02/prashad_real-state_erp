<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Sale;
use Carbon\Carbon;

class CheckInstallments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Run: php artisan installments:check
     */
    protected $signature = 'installments:check';

    /**
     * The console command description.
     */
    protected $description = 'Check sales and manage installments & payment status automatically.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();

        $sales = Sale::with('installments')->where('status', true)->get();

        foreach ($sales as $sale) {
            // ✅ Skip if fully paid
            if ($sale->paid_amount >= $sale->total_amount) {
                $sale->update(['payment_status' => 'paid']);
                continue;
            }

            $sale->update(['payment_status' => 'pending']);

            // Build due date for this month
            try {
                $dueDate = Carbon::createFromFormat(
                    'Y-m-d',
                    $today->format("Y-m-") . str_pad($sale->monthly_paid_on, 2, '0', STR_PAD_LEFT)
                );
            } catch (\Exception $e) {
                $this->error("⚠️ Invalid monthly_paid_on for Sale #{$sale->id}");
                continue;
            }

            // ✅ If installment for this month doesn’t exist → create one
            $installmentExists = $sale->installments()
                ->whereMonth('due_date', $dueDate->month)
                ->whereYear('due_date', $dueDate->year)
                ->exists();

            if (!$installmentExists) {
                $remaining = $sale->total_amount - $sale->paid_amount;

                // 👉 Use monthly_charges OR remaining if it's the last installment
                $installmentAmount = $sale->monthly_charges > 0
                    ? min($sale->monthly_charges, $remaining)
                    : $remaining;

                $installment = $sale->installments()->create([
                    'installment_amount' => round($installmentAmount, 2),
                    'paid_amount'        => 0,
                    'due_amount'         => round($installmentAmount, 2),
                    'due_date'           => $dueDate,
                    'status'             => 'pending',
                    'user_id'            => $sale->user_id,
                    'notes'              => 'Auto-generated installment',
                ]);

                $this->info("✅ Created new installment #{$installment->id} for Sale #{$sale->id}");
            }

            // ✅ Mark overdue installments (if 7 days past due date and unpaid)
            foreach ($sale->installments()->where('status', 'pending')->get() as $inst) {
                $overdueDate = Carbon::parse($inst->due_date)->addDays(7);
                if ($today->greaterThan($overdueDate) && $inst->paid_amount <= 0) {
                    $inst->update(['status' => 'overdue']);
                    $this->warn("⚠️ Installment #{$inst->id} for Sale #{$sale->id} marked overdue.");
                }
            }
        }

        $this->info("🎉 Installments check completed.");
        return Command::SUCCESS;
    }
}
