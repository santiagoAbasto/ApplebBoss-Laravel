<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Google_Client;
use Google_Service_Drive;
use Illuminate\Support\Facades\Session;

class GoogleDriveController extends Controller
{
    public function redirectToGoogle()
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->addScope(Google_Service_Drive::DRIVE_FILE);

        $authUrl = $client->createAuthUrl();
        return redirect($authUrl);
    }

    public function handleGoogleCallback(Request $request)
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));

        $client->fetchAccessTokenWithAuthCode($request->code);

        $accessToken = $client->getAccessToken();

        // Guarda el token en archivo
        file_put_contents(storage_path('app/google/token.json'), json_encode($accessToken));

        // También en sesión si lo deseas
        Session::put('google_access_token', $accessToken);

        return redirect()->route('admin.cotizaciones.index')->with('success', 'Autenticación con Google Drive exitosa.');
    }
}
