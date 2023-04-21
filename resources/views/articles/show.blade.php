<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ $article->reference() }} — {{ Str::limit($article->title, 50) }}
            </h2>
            <div class="flex gap-2">
                @can('update', $article)
                    <a href="{{ route('articles.edit', $article) }}"
                       class="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 uppercase hover:bg-gray-50">
                        Edit
                    </a>
                @endcan
                @can('delete', $article)
                    <form method="POST" action="{{ route('articles.destroy', $article) }}"
                          onsubmit="return confirm('Are you sure you want to delete this article?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit"
                                class="inline-flex items-center px-3 py-1.5 bg-red-600 border border-transparent rounded-md text-xs font-semibold text-white uppercase hover:bg-red-500">
                            Delete
                        </button>
                    </form>
                @endcan
            </div>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

            @if (session('success'))
                <div class="rounded-md bg-green-50 p-4">
                    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                </div>
            @endif

            {{-- Status badge --}}
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <div>
                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                        <dd class="mt-1">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                @switch($article->status)
                                    @case('submitted') bg-yellow-100 text-yellow-800 @break
                                    @case('under_review') bg-blue-100 text-blue-800 @break
                                    @case('approved') bg-green-100 text-green-800 @break
                                    @case('rejected') bg-red-100 text-red-800 @break
                                    @case('published') bg-purple-100 text-purple-800 @break
                                    @default bg-gray-100 text-gray-800
                                @endswitch
                            ">
                                {{ ucfirst(str_replace('_', ' ', $article->status)) }}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-gray-500">Journal</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ $article->journal->name ?? '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-gray-500">Submitted</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ $article->created_at->format('F j, Y') }}</dd>
                    </div>
                </dl>
            </div>

            {{-- Metadata --}}
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $article->title }}</h3>

                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Abstract</h4>
                    <p class="text-sm text-gray-700 whitespace-pre-line">{{ $article->abstract }}</p>
                </div>

                @if ($article->keywords)
                    <div class="mb-4">
                        <h4 class="text-sm font-medium text-gray-500 mb-1">Keywords</h4>
                        <p class="text-sm text-gray-700">{{ $article->keywords }}</p>
                    </div>
                @endif

                @if ($article->file_path)
                    <div>
                        <h4 class="text-sm font-medium text-gray-500 mb-1">Manuscript</h4>
                        <p class="text-sm text-gray-700">
                            {{ $article->original_filename }}
                            <span class="text-gray-400">({{ number_format($article->file_size / 1024, 0) }} KB)</span>
                        </p>
                    </div>
                @endif
            </div>

            {{-- Reviewer notes --}}
            @if ($article->reviewer_notes)
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Reviewer Notes</h4>
                    <p class="text-sm text-gray-700 whitespace-pre-line">{{ $article->reviewer_notes }}</p>
                </div>
            @endif

            {{-- Review assignments --}}
            @if ($article->reviewAssignments->isNotEmpty())
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <h4 class="text-sm font-medium text-gray-500 mb-3">Review Assignments</h4>
                    <ul class="divide-y divide-gray-100">
                        @foreach ($article->reviewAssignments as $assignment)
                            <li class="py-2 flex items-center justify-between text-sm">
                                <span class="text-gray-900">{{ $assignment->reviewer->name ?? 'Unassigned' }}</span>
                                <span class="text-gray-500">{{ $assignment->status }} — due {{ $assignment->due_date?->format('M d, Y') ?? 'TBD' }}</span>
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endif

        </div>
    </div>
</x-app-layout>
