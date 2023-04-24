<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Review Queue') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            @if (session('success'))
                <div class="mb-4 rounded-md bg-green-50 p-4">
                    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">

                    @if ($articles->isEmpty())
                        <p class="text-gray-500">{{ __('No articles awaiting review.') }}</p>
                    @else
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                    <th class="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                @foreach ($articles as $article)
                                    <tr>
                                        <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{{ $article->reference() }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-900">{{ Str::limit($article->title, 50) }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{{ $article->user->name }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{{ $article->journal->name ?? '—' }}</td>
                                        <td class="px-4 py-3 whitespace-nowrap">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                {{ $article->status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800' }}">
                                                {{ ucfirst(str_replace('_', ' ', $article->status)) }}
                                            </span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{{ $article->created_at->format('M d, Y') }}</td>
                                        <td class="px-4 py-3 text-sm text-right">
                                            <a href="{{ route('review.show', $article) }}" class="text-indigo-600 hover:text-indigo-900">Review</a>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>

                        <div class="mt-4">
                            {{ $articles->links() }}
                        </div>
                    @endif

                </div>
            </div>
        </div>
    </div>
</x-app-layout>
