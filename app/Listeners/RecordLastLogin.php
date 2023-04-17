<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Auth\Events\Login;

class RecordLastLogin
{
    /**
     * Update the user's last_login_at timestamp on successful login.
     */
    public function handle(Login $event): void
    {
        $event->user->forceFill([
            'last_login_at' => now(),
        ])->saveQuietly();
    }
}
