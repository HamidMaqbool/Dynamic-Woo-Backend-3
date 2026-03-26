<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\File;

class SettingsController extends Controller
{
    public function index()
    {
        $setting = Setting::where('key', 'app_settings')->first();

        if ($setting) {
            return response()->json($setting->value);
        }

        // Fallback to file if not in DB
        $settingsPath = base_path('server/data/settings.json');
        if (File::exists($settingsPath)) {
            $data = json_decode(File::get($settingsPath), true);
            return response()->json($data);
        }

        return response()->json(['message' => 'Settings not found'], 404);
    }

    public function update(Request $request)
    {
        $data = $request->all();

        Setting::updateOrCreate(
            ['key' => 'app_settings'],
            ['value' => $data]
        );

        return response()->json($data);
    }
}
