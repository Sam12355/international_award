<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('Review') }} — {{ $article->reference() }}
            </h2>
            <a href="{{ route('review.index') }}" class="text-sm text-indigo-600 hover:text-indigo-900">&larr; Back to queue</a>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

            @if (session('success'))
                <div class="rounded-md bg-green-50 p-4">
                    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                </div>
            @endif

            {{-- Article metadata --}}
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $article->title }}</h3>

                <dl class="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3 mb-4 text-sm">
                    <div>
                        <dt class="font-medium text-gray-500">Author</dt>
                        <dd class="text-gray-900">{{ $article->user->name }}</dd>
                    </div>
                    <div>
                        <dt class="font-medium text-gray-500">Journal</dt>
                        <dd class="text-gray-900">{{ $article->journal->name ?? '—' }}</dd>
                    </div>
                    <div>
                        <dt class="font-medium text-gray-500">Current Status</dt>
                        <dd>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                @switch($article->status)
                                    @case('submitted') bg-yellow-100 text-yellow-800 @break
                                    @case('under_review') bg-blue-100 text-blue-800 @break
                                    @case('approved') bg-green-100 text-green-800 @break
                                    @case('rejected') bg-red-100 text-red-800 @break
                                    @default bg-gray-100 text-gray-800
                                @endswitch
                            ">
                                {{ ucfirst(str_replace('_', ' ', $article->status)) }}
                            </span>
                        </dd>
                    </div>
                </dl>

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

            {{-- Existing reviewer notes --}}
            @if ($article->reviewer_notes)
                <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                    <h4 class="text-sm font-medium text-gray-500 mb-1">Previous Reviewer Notes</h4>
                    <p class="text-sm text-gray-700 whitespace-pre-line">{{ $article->reviewer_notes }}</p>
                </div>
            @endif

            {{-- Status change form --}}
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                <h4 class="font-medium text-gray-900 mb-4">{{ __('Update Status') }}</h4>

                <form method="POST" action="{{ route('review.updateStatus', $article) }}">
                    @csrf
                    @method('PATCH')

                    <div class="mb-4">
                        <x-input-label for="status" :value="__('New Status')" />
                        <select id="status" name="status"
                                class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                            <option value="under_review" @selected(old('status', $article->status) === 'under_review')>Under Review</option>
                            <option value="approved" @selected(old('status') === 'approved')>Approved</option>
                            <option value="rejected" @selected(old('status') === 'rejected')>Rejected</option>
                        </select>
                        <x-input-error :messages="$errors->get('status')" class="mt-2" />
                    </div>

                    <div class="mb-6">
                        <x-input-label for="reviewer_notes" :value="__('Notes (visible to author)')" />
                        <textarea id="reviewer_notes" name="reviewer_notes" rows="4"
                                  class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        >{{ old('reviewer_notes') }}</textarea>
                        <x-input-error :messages="$errors->get('reviewer_notes')" class="mt-2" />
                    </div>

                    <x-primary-button>{{ __('Update Status') }}</x-primary-button>
                </form>
            </div>

        </div>
    </div>
</x-app-layout>
