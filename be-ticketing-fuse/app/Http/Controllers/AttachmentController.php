<?php

namespace App\Http\Controllers;

use App\Models\Archive;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'files'   => 'required',
            'files.*' => 'mimes:jpg,jpeg,png,docx,pdf,xls,xlsx,doc,pptx,msg,rar,zip|max:30000'
        ]);

        $attachments = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('public/' . date('Y/m/d'));

            $data = [
                'user_id' => 1,
                'url'     => url(Storage::url($path)),
                'name'    => $file->getClientOriginalName(),
                'path'    => $path,
                'size'    => $file->getSize(),
                'mime'    => $file->extension(),
                'info'    => $request->info,
                'remark'  => $request->remark
            ];
            \Log::info($data);

            if ($request->action == 'store') {
                $data['attachmentable_id']   = $request->attachmentable_id;
                $data['attachmentable_type'] = $request->attachmentable_type == 'archive'
                    ? Archive::class
                    : null;

                $attachments[] = Attachment::create($data);
            } else {
                $attachments[] = $data;
            }
        }

        return response()->json($attachments);
    }


    /**
     * Display the specified resource.
     */
    public function show(Attachment $attachment)
    {
        //
    }

    /**
     * Download attachment file
     */
    public function download(string $id)
    {
        $attachment = Attachment::find($id);
        
        if (!$attachment) {
            return response()->json([
                'status' => false,
                'message' => 'Attachment not found'
            ], 404);
        }

        // Check if file exists
        if (!Storage::exists($attachment->path)) {
            return response()->json([
                'status' => false,
                'message' => 'File not found'
            ], 404);
        }

        return Storage::download($attachment->path, $attachment->name);
    }

    /**
     * View/preview attachment file (inline display)
     */
    public function view(string $id)
    {
        $attachment = Attachment::find($id);
        
        if (!$attachment) {
            return response()->json([
                'status' => false,
                'message' => 'Attachment not found'
            ], 404);
        }

        // Check if file exists
        if (!Storage::exists($attachment->path)) {
            return response()->json([
                'status' => false,
                'message' => 'File not found'
            ], 404);
        }

        $file = Storage::get($attachment->path);
        $mimeType = Storage::mimeType($attachment->path);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline; filename="' . $attachment->name . '"');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Attachment $attachment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Attachment $attachment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Attachment $attachment)
    {
        //
    }
}
