<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class GenericApiController extends Controller
{
    public function index(Request $request, $entity)
    {
        $tableName = str_replace('-', '_', $entity);
        $page = $request->query('page', 1);
        $limit = $request->query('limit', 10);
        $search = $request->query('search', '');
        
        $query = DB::table($tableName);

        // Handle filters
        foreach ($request->all() as $key => $value) {
            if (in_array($key, ['page', 'limit', 'search'])) continue;
            if ($value !== 'all' && $value !== null) {
                $query->where($key, $value);
            }
        }

        // Handle search (simplified, in production you'd use specific columns)
        if ($search) {
            // This is a bit naive, ideally you'd have searchable columns defined
            $query->where(function($q) use ($search) {
                $q->where('id', 'like', "%$search%")
                  ->orWhere('title', 'like', "%$search%")
                  ->orWhere('name', 'like', "%$search%");
            });
        }

        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')
                       ->offset(($page - 1) * $limit)
                       ->limit($limit)
                       ->get();

        // Map response key to plural label if needed
        $responseKey = $entity; // Or pluralize it

        return response()->json([
            $responseKey => $items,
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
        $data = $request->all();
        
        $prefix = strtoupper(substr($tableName, 0, 3));
        $id = $prefix . '-' . time();
        $data['id'] = $id;
        $data['created_at'] = now();
        $data['updated_at'] = now();

        if ($tableName === 'users' && isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Handle JSON fields
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $data[$key] = json_encode($value);
            }
        }

        DB::table($tableName)->insert($data);
        $item = DB::table($tableName)->where('id', $id)->first();

        return response()->json($item, 201);
    }

    public function update(Request $request, $entity, $id)
    {
        $tableName = str_replace('-', '_', $entity);
        $data = $request->all();
        $data['updated_at'] = now();

        if ($tableName === 'users' && isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Handle JSON fields
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $data[$key] = json_encode($value);
            }
        }

        DB::table($tableName)->where('id', $id)->update($data);
        $item = DB::table($tableName)->where('id', $id)->first();

        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }

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

    public function bulkDestroy(Request $request, $entity)
    {
        $tableName = str_replace('-', '_', $entity);
        $ids = $request->input('ids', []);
        
        DB::table($tableName)->whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => count($ids) . ' items deleted']);
    }

    public function health()
    {
        try {
            $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            return response()->json([
                'status' => 'ok',
                'tables' => array_map(fn($r) => $r->table_name, $tables)
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function sidebar()
    {
        // In Laravel, you'd typically store these in resources/data or storage/app
        $path = resource_path('data/sidebar.json');
        if (!file_exists($path)) return response()->json(['message' => 'Not found'], 404);
        return response()->json(json_decode(file_get_contents($path), true));
    }

    public function dashboard()
    {
        $path = resource_path('data/dashboard.json');
        if (!file_exists($path)) return response()->json(['message' => 'Not found'], 404);
        return response()->json(json_decode(file_get_contents($path), true));
    }

    public function schema()
    {
        $path = resource_path('data/schema.json');
        if (!file_exists($path)) return response()->json(['message' => 'Not found'], 404);
        return response()->json(json_decode(file_get_contents($path), true));
    }

    public function routes()
    {
        $path = resource_path('data/routes.json');
        if (!file_exists($path)) return response()->json(['message' => 'Not found'], 404);
        return response()->json(json_decode(file_get_contents($path), true));
    }

    public function settings()
    {
        $settings = DB::table('settings')->where('key', 'app_settings')->first();
        if ($settings) {
            return response()->json(json_decode($settings->value, true));
        }

        // Fallback to file
        $path = resource_path('data/settings.json');
        if (!file_exists($path)) return response()->json(['message' => 'Not found'], 404);
        return response()->json(json_decode(file_get_contents($path), true));
    }

    public function updateSettings(Request $request)
    {
        $data = $request->all();
        DB::table('settings')->updateOrInsert(
            ['key' => 'app_settings'],
            [
                'id' => 'SET-' . time(),
                'value' => json_encode($data),
                'updated_at' => now()
            ]
        );
        return response()->json($data);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        $user = DB::table('users')->where('email', $credentials['email'])->first();

        if ($user && Hash::check($credentials['password'], $user->password)) {
            // In a real Laravel app with Sanctum, you'd do:
            // $token = $user->createToken('auth_token')->plainTextToken;
            $token = "auro-parts-secret-token-123"; // Mocking your Node.js token
            
            return response()->json([
                'success' => true,
                'user' => [
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $user->role
                ],
                'token' => $token
            ]);
        }

        return response()->json(['success' => false, 'message' => 'Invalid email or password'], 401);
    }
}
