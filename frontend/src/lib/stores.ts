import { writable, type Writable } from 'svelte/store';

export interface Page {
	url: URL;
	params: Record<string, string>;
	query: Record<string, string>;
}

export const page: Writable<Page> = writable({
	url: new URL(location.href),
	params: {},
	query: {}
});