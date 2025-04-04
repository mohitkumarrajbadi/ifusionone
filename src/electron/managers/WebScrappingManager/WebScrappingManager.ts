import { search, SafeSearchType } from 'duck-duck-scrape';

export async function searchDuckDuckGo(query: string){
    try {
        console.log("Inside the search-duck-duck-go");
        const searchResults = await search(query, {
            safeSearch: SafeSearchType.OFF
        });
        console.log("DuckDuckGo search results:", searchResults);
        return searchResults;
    } catch (error) {
        console.error("Error fetching search results:", error);
        throw new Error("Failed to fetch search results");
    }
}
