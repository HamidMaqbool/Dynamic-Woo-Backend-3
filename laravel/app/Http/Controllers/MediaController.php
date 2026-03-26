<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 12);
        $search = $request->input('search', '');
        $dateFilter = $request->input('dateFilter', 'all');

        $query = Media::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($dateFilter !== 'all') {
            if ($dateFilter === 'today') {
                $query->whereDate('created_at', now()->toDateString());
            } elseif ($dateFilter === 'this-month') {
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
            } elseif ($dateFilter === 'this-year') {
                $query->whereYear('created_at', now()->year);
            }
        }

        $total = $query->count();
        $media = $query->orderBy('created_at', 'desc')
                       ->skip(($page - 1) * $limit)
                       ->take($limit)
                       ->get();

        return response()->json([
            'media' => $media,
            'total' => $total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'totalPages' => ceil($total / $limit)
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB limit
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            // Store file in public disk
            $path = $file->storeAs('uploads', $fileName, 'public');
            $url = Storage::url($path);

            $type = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 
                   (Str::startsWith($file->getMimeType(), 'video/') ? 'video' : 'file');
            
            $size = round($file->getSize() / 1024, 2) . ' KB';

            $media = Media::create([
                'id' => 'MED-' . time(),
                'name' => $file->getClientOriginalName(),
                'url' => $url,
                'type' => $type,
                'size' => $size,
                'dimensions' => '',
                'thumbnail' => $url,
                'created_at' => now(),
            ]);

            return response()->json($media, 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function destroy($id)
    {
        $media = Media::find($id);

        if (!$media) {
            return response()->json(['message' => 'Media not found'], 404);
        }

        // Delete file from disk
        $fileName = basename($media->url);
        Storage::disk('public')->delete('uploads/' . $fileName);

        $media->delete();

        return response()->json(['success' => true, 'message' => 'Media deleted']);
    }
}
