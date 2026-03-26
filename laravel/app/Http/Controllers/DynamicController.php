<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class DynamicController extends Controller
{
    public function index(Request $request, $entity)
    {
        $tableName = str_replace('-', '_', $entity);
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 10);
        $search = $request->input('search', '');
        $filters = $request->except(['page', 'limit', 'search']);

        $query = DB::table($tableName);

        if ($search) {
            // Fetch schema to find searchable columns
            $schema = $this->getSchemaData();
            $tableConfig = $schema['table'][$entity] ?? null;
            if ($tableConfig) {
                $searchableCols = collect($tableConfig['table']['cols'])
                    ->filter(fn($c) => $c['searchable'] ?? false)
                    ->map(fn($c) => $c['col'])
                    ->toArray();

                if (!empty($searchableCols)) {
                    $query->where(function ($q) use ($searchableCols, $search) {
                        foreach ($searchableCols as $col) {
                            $q->orWhere($col, 'like', "%{$search}%");
                        }
                    });
                }
            }
        }

        foreach ($filters as $key => $value) {
            if ($value !== 'all' && $value !== null) {
                $query->where($key, $value);
            }
        }

        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')
                       ->skip(($page - 1) * $limit)
                       ->take($limit)
                       ->get();

        return response()->json([
            $entity => $items,
            'total' => $total,
            'page' => (int)$page,
            'limit' => (int)$limit,
            'totalPages' => ceil($total / $limit)
        ]);
    }

    public function show($entity, $id)
    {
        $tableName = str_replace('-', '_', $entity);
        $item = DB::table($tableName)->where('id', $id)->first();

        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($item);
    }

    public function store(Request $request, $entity)
    {
        $tableName = str_replace('-', '_', $entity);
        $data = $request->except(['id', 'created_at', 'save']);
        
        $prefix = strtoupper(substr($tableName, 0, 3));
        $id = $prefix . '-' . time();

        if ($tableName === 'users' && isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Handle JSON fields
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = json_encode($value);
            }
        }

        $data['id'] = $id;
        $data['created_at'] = now();

        DB::table($tableName)->insert($data);
        $item = DB::table($tableName)->where('id', $id)->first();

        return response()->json($item, 201);
    }

    public function update(Request $request, $entity, $id)
    {
        $tableName = str_replace('-', '_', $entity);
        $data = $request->except(['id', 'created_at', 'save']);

        if ($tableName === 'users') {
            if (isset($data['password']) && !empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }
        }

        // Handle JSON fields
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = json_encode($value);
            }
        }

        DB::table($tableName)->where('id', $id)->update($data);
        $item = DB::table($tableName)->where('id', $id)->first();

        return response()->json($item);
    }

    public function destroy($entity, $id)
    {
        $tableName = str_replace('-', '_', $entity);
        $deleted = DB::table($tableName)->where('id', $id)->delete();

        if ($deleted) {
            return response()->json(['success' => true, 'message' => 'Deleted']);
        }

        return response()->json(['message' => 'Not found'], 404);
    }

    public function bulkDelete(Request $request, $entity)
    {
        $tableName = str_replace('-', '_', $entity);
        $ids = $request->input('ids', []);
        DB::table($tableName)->whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => count($ids) . ' items deleted']);
    }

    // Helper methods for JSON data
    public function getSidebar() { return $this->getJsonData('sidebar.json'); }
    public function getSchema() { return $this->getJsonData('schema.json'); }
    public function getRoutes() { return $this->getJsonData('routes.json'); }
    public function getDashboard() { return $this->getJsonData('dashboard.json'); }
    public function getAvailablePermissions() { return $this->getJsonData('available-permissions.json'); }

    public function getRolesList()
    {
        $roles = DB::table('user_roles')->orderBy('name', 'asc')->get(['name']);
        return response()->json($roles->map(fn($r) => [
            'value' => $r->name,
            'label' => ucfirst($r->name)
        ]));
    }

    private function getJsonData($filename)
    {
        $path = base_path('server/data/' . $filename);
        if (File::exists($path)) {
            return response()->json(json_decode(File::get($path), true));
        }
        return response()->json(['message' => 'File not found'], 404);
    }

    private function getSchemaData()
    {
        $path = base_path('server/data/schema.json');
        return File::exists($path) ? json_decode(File::get($path), true) : [];
    }
}
