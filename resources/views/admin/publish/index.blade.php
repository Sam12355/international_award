<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Publish Articles') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">

            @if (session('success'))
                <div class="mb-4 rounded-md bg-green-50 p-4">
                    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
                </div>
            @endif

            @if (session('warning'))
                <div class="mb-4 rounded-md bg-yellow-50 p-4">
                    <p class="text-sm font-medium text-yellow-800">{{ session('warning') }}</p>
                </div>
            @endif

            @if (session('error'))
                <div class="mb-4 rounded-md bg-red-50 p-4">
                    <p class="text-sm font-medium text-red-800">{{ session('error') }}</p>
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">

                    @if ($articles->isEmpty())
                        <p class="text-gray-500">{{ __('No approved articles awaiting publication.') }}</p>
                    @else
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
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
                                        <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{{ $article->updated_at->format('M d, Y') }}</td>
                                        <td class="px-4 py-3 text-sm text-right">
                                            <form method="POST" action="{{ route('admin.publish.publish', $article) }}"
                                                  onsubmit="return confirm('Publish this article? This will register a DOI and submit for indexing.')">
                                                @csrf
                                                <button type="submit"
                                                        class="inline-flex items-center px-3 py-1.5 bg-indigo-600 border border-transparent rounded-md text-xs font-semibold text-white uppercase hover:bg-indigo-500">
                                                    Publish
                                                </button>
                                            </form>
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
