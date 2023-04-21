<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Submit New Article') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-gray-900">

                    <form method="POST" action="{{ route('articles.store') }}" enctype="multipart/form-data">
                        @csrf

                        {{-- Title --}}
                        <div class="mb-4">
                            <x-input-label for="title" :value="__('Title')" />
                            <x-text-input id="title" name="title" type="text" class="mt-1 block w-full"
                                          :value="old('title')" required autofocus />
                            <x-input-error :messages="$errors->get('title')" class="mt-2" />
                        </div>

                        {{-- Journal --}}
                        <div class="mb-4">
                            <x-input-label for="journal_id" :value="__('Journal')" />
                            <select id="journal_id" name="journal_id"
                                    class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">
                                <option value="">— Select a journal —</option>
                                @foreach ($journals as $journal)
                                    <option value="{{ $journal->id }}" @selected(old('journal_id') == $journal->id)>
                                        {{ $journal->name }}
                                    </option>
                                @endforeach
                            </select>
                            <x-input-error :messages="$errors->get('journal_id')" class="mt-2" />
                        </div>

                        {{-- Abstract --}}
                        <div class="mb-4">
                            <x-input-label for="abstract" :value="__('Abstract')" />
                            <textarea id="abstract" name="abstract" rows="6"
                                      class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                      required>{{ old('abstract') }}</textarea>
                            <x-input-error :messages="$errors->get('abstract')" class="mt-2" />
                        </div>

                        {{-- Keywords --}}
                        <div class="mb-4">
                            <x-input-label for="keywords" :value="__('Keywords')" />
                            <x-text-input id="keywords" name="keywords" type="text" class="mt-1 block w-full"
                                          :value="old('keywords')" placeholder="e.g. crop yield, soil health, irrigation" />
                            <x-input-error :messages="$errors->get('keywords')" class="mt-2" />
                        </div>

                        {{-- Manuscript file --}}
                        <div class="mb-6">
                            <x-input-label for="manuscript" :value="__('Manuscript (PDF, DOC, or DOCX — max 10 MB)')" />
                            <input id="manuscript" name="manuscript" type="file" accept=".pdf,.doc,.docx"
                                   class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                   required />
                            <x-input-error :messages="$errors->get('manuscript')" class="mt-2" />
                        </div>

                        <div class="flex items-center gap-4">
                            <x-primary-button>{{ __('Submit Article') }}</x-primary-button>
                            <a href="{{ route('articles.index') }}" class="text-sm text-gray-600 hover:text-gray-900">Cancel</a>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    </div>
</x-app-layout>
