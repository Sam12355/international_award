<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when an external API call (CrossRef, Scholar, etc.) fails.
 */
class ExternalApiException extends RuntimeException
{
}
