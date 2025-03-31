class HttpService {
    constructor(private baseUrl: string) {}

    // Method to perform a GET request
    public async get<T>(path: string): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url);

        // Check if the response was successful
        if (!response.ok) {
            // log error details
            const j = await response.json();
            console.log(j);

            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json() as Promise<T>;
    }
}

export default HttpService;
