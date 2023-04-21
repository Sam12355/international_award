<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Article;

class ArticleStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Article $article,
        private readonly string $previousStatus,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Article Status Updated - ' . $this->article->reference())
            ->greeting('Dear ' . $notifiable->name . ',')
            ->line('The status of your article "' . $this->article->title . '" has been updated.')
            ->line('Previous status: ' . $this->previousStatus)
            ->line('New status: ' . $this->article->status)
            ->action('View Article', url('/articles/' . $this->article->id));

        if ($this->article->reviewer_notes) {
            $mail->line('Reviewer notes: ' . $this->article->reviewer_notes);
        }

        return $mail;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'article_id'      => $this->article->id,
            'title'           => $this->article->title,
            'previous_status' => $this->previousStatus,
            'new_status'      => $this->article->status,
        ];
    }
}
