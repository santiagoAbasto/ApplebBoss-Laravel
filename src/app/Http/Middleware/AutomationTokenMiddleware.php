<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutomationTokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) $request->header('X-AUTOMATION-TOKEN');
        $expected = (string) config('automation.token');

        if ($token === '' || $expected === '' || ! hash_equals($expected, $token)) {
            return response()->json([
                'message' => 'Unauthorized automation request'
            ], 401);
        }

        return $next($request);
    }
}
