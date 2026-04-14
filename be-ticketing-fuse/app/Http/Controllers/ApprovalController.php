<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\ApprovalItem;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    /**
     * Update approval item status (approve/reject)
     */
    public function updateItem(Request $request, $id)
    {
        $approvalItem = ApprovalItem::findOrFail($id);
        
        // Validate request
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
            'user_id' => 'required|uuid'
        ]);
        
        // Check if user is authorized to approve/reject
        if ($approvalItem->user_id !== $request->user_id) {
            return response()->json([
                'status' => false,
                'message' => 'You are not authorized to approve/reject this item'
            ], 403);
        }
        
        // Check if already processed
        if ($approvalItem->status !== 'pending') {
            return response()->json([
                'status' => false,
                'message' => 'This approval item has already been processed'
            ], 400);
        }
        
        // Update approval item
        $approvalItem->update([
            'status' => $request->status,
            'notes' => $request->notes,
            'approved_at' => now()
        ]);
        
        // Check if all approval items are processed
        $approval = $approvalItem->approval;
        $allItems = $approval->items;
        
        $allApproved = $allItems->every(function ($item) {
            return $item->status === 'approved';
        });
        
        $anyRejected = $allItems->contains(function ($item) {
            return $item->status === 'rejected';
        });
        
        // Update parent approval status
        if ($anyRejected) {
            $approval->update([
                'status' => 'rejected',
                'completed_at' => now()
            ]);
        } elseif ($allApproved) {
            $approval->update([
                'status' => 'approved',
                'completed_at' => now()
            ]);
        }
        
        return response()->json([
            'status' => true,
            'message' => 'Approval item updated successfully',
            'data' => $approvalItem->load('user')
        ]);
    }
}
