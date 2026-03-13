<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateCrud extends Command
{
    protected $signature = 'generate:crud {name} {--model} {--m|migration}';
    protected $description = 'Generate Controller CRUD. Tambah --model untuk buat Model, --migration untuk Migration.';

    public function handle()
    {
        $name       = $this->argument('name');
        $model      = Str::studly(str_replace('Controller', '', $name));
        $controller = $model . 'Controller';
        $table      = Str::snake(Str::plural($model));

        // ── 1. Buat Model (opsional) ───────────────────────────────
        if ($this->option('model')) {
            $this->call('make:model', ['name' => $model]);
        }

        // ── 2. Buat Migration (opsional, independen dari --model) ──
        if ($this->option('migration')) {
            $this->call('make:migration', [
                'name'     => "create_{$table}_table",
                '--create' => $table,
            ]);
        }

        // ── 3. Buat Controller ─────────────────────────────────────
        $controllerPath = app_path("Http/Controllers/{$controller}.php");

        if (file_exists($controllerPath)) {
            $this->error("{$controller} sudah ada!");
            return;
        }

        $template = <<<PHP
<?php

namespace App\Http\Controllers;

use App\Models\\{$model};
use Illuminate\Http\Request;

class {$controller} extends Controller
{
    public function index()
    {
        \$data = {$model}::all();

        return response()->json([
            'status'  => true,
            'message' => 'Data {$model} berhasil diambil',
            'data'    => \$data,
        ]);
    }

    public function store(Request \$request)
    {
        \$item = {$model}::create(\$request->all());

        return response()->json([
            'status'  => true,
            'message' => '{$model} berhasil dibuat',
            'data'    => \$item,
        ], 201);
    }

    public function show(string \$id)
    {
        \$item = {$model}::findOrFail(\$id);

        return response()->json([
            'status'  => true,
            'message' => 'Data {$model} ditemukan',
            'data'    => \$item,
        ]);
    }

    public function update(Request \$request, string \$id)
    {
        \$item = {$model}::findOrFail(\$id);
        \$item->update(\$request->all());

        return response()->json([
            'status'  => true,
            'message' => '{$model} berhasil diperbarui',
            'data'    => \$item,
        ]);
    }

    public function destroy(string \$id)
    {
        {$model}::findOrFail(\$id)->delete();

        return response()->json([
            'status'  => true,
            'message' => '{$model} berhasil dihapus',
            'data'    => null,
        ]);
    }
}
PHP;

        file_put_contents($controllerPath, $template);
        $this->info("{$controller} berhasil dibuat.");

        // ── 4. Summary ─────────────────────────────────────────────
        $rows = [
            ['Controller', "app/Http/Controllers/{$controller}.php"],
        ];

        if ($this->option('model')) {
            $rows[] = ['Model', "app/Models/{$model}.php"];
        }

        if ($this->option('migration')) {
            $rows[] = ['Migration', "database/migrations/..._create_{$table}_table.php"];
        }

        $this->newLine();
        $this->table(['File', 'Path'], $rows);
    }
}
