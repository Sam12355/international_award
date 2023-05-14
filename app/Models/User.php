<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Platform user — can be an author, reviewer, or admin.
 *
 * Roles are stored as a simple string column (`author`, `reviewer`, `admin`).
 * Reviewers inherit all author capabilities; admins bypass all policy checks.
 *
 * @property int         $id
 * @property string      $name
 * @property string      $email
 * @property string      $role
 * @property string      $password
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property \Illuminate\Support\Carbon|null $last_login_at
 * @property \Illuminate\Support\Carbon      $created_at
 * @property \Illuminate\Support\Carbon      $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<Article>          $articles
 * @property-read \Illuminate\Database\Eloquent\Collection<ReviewAssignment> $reviewAssignments
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'password'          => 'hashed',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    /** Get all articles authored by this user. */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    /** Get review assignments where this user is the reviewer. */
    public function reviewAssignments(): HasMany
    {
        return $this->hasMany(ReviewAssignment::class, 'reviewer_id');
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

    /** Determine if the user has administrator privileges. */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Determine if the user can perform reviews.
     *
     * Admins implicitly have reviewer capabilities.
     */
    public function isReviewer(): bool
    {
        return $this->role === 'reviewer' || $this->isAdmin();
    }
}
