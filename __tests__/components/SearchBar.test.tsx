import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SemanticSearchBar } from "@/components/search/SemanticSearchBar";

describe("SemanticSearchBar", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("renders search input and button", () => {
    render(<SemanticSearchBar />);
    expect(screen.getByPlaceholderText(/Search programs/i)).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("updates query on input change", () => {
    render(<SemanticSearchBar />);
    const input = screen.getByPlaceholderText(/Search programs/i);
    fireEvent.change(input, { target: { value: "computer science" } });
    expect(input).toHaveValue("computer science");
  });

  it("calls search API on submit", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suggestions: [] }),
    });
    global.fetch = mockFetch;

    render(<SemanticSearchBar />);
    const input = screen.getByPlaceholderText(/Search programs/i);
    fireEvent.change(input, { target: { value: "test query" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/search/suggestions?q=test%20query")
      );
    });
  });
});
