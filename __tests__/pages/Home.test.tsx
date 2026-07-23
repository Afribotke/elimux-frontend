import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the main heading", () => {
    render(<HomePage />);
    expect(screen.getByText(/Discover Your Perfect Education/i)).toBeInTheDocument();
  });

  it("renders search bar", () => {
    render(<HomePage />);
    expect(screen.getByPlaceholderText(/Search programs/i)).toBeInTheDocument();
  });

  it("renders featured programs section", () => {
    render(<HomePage />);
    expect(screen.getByText(/Featured Programs/i)).toBeInTheDocument();
  });
});
