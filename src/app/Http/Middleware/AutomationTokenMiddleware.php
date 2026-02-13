<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutomationTokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-AUTOMATION-TOKEN');

        if (!$token || $token !== config('automation.token')) {
            return response()->json([
                'message' => 'Unauthorized automation request'
            ], 401);
        }

        return $next($request);
    }
}
