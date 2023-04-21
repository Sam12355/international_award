<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Article;

class ArticleSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Article $article,
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
        return (new MailMessage)
            ->subject('Article Submission Received - ' . $this->article->reference())
            ->greeting('Dear ' . $notifiable->name . ',')
            ->line('Your article "' . $this->article->title . '" has been received.')
            ->line('Submission ID: ' . $this->article->reference())
            ->line('Status: submitted')
            ->action('View Article', url('/articles/' . $this->article->id))
            ->line('You will be notified once a reviewer is assigned.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'article_id' => $this->article->id,
            'title'      => $this->article->title,
            'status'     => 'submitted',
        ];
    }
}
