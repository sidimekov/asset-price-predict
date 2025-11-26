// Container.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Container } from '@/shared/ui/Container';

describe('Container', () => {
  it('renders children correctly', () => {
    const testText = 'Test content';

    render(
      <Container>
        <div>{testText}</div>
      </Container>,
    );

    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Container>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </Container>,
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  it('renders string children', () => {
    const textContent = 'Simple text content';

    render(<Container>{textContent}</Container>);

    expect(screen.getByText(textContent)).toBeInTheDocument();
  });

  it('renders number children', () => {
    const numberContent = 42;

    render(<Container>{numberContent}</Container>);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    const testId = 'container-test';

    render(
      <Container>
        <div data-testid={testId}>Content</div>
      </Container>,
    );

    const container = screen.getByTestId(testId).parentElement;

    expect(container).toHaveClass('max-w-7xl');
    expect(container).toHaveClass('mx-auto');
    expect(container).toHaveClass('px-4');
    expect(container).toHaveClass('sm:px-6');
    expect(container).toHaveClass('lg:px-8');
  });

  it('applies responsive padding classes', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>,
    );

    const divElement = container.firstChild as HTMLElement;

    expect(divElement).toHaveClass('px-4'); // mobile
    expect(divElement).toHaveClass('sm:px-6'); // small screens
    expect(divElement).toHaveClass('lg:px-8'); // large screens
  });

  it('applies max-width and auto margin', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>,
    );

    const divElement = container.firstChild as HTMLElement;

    expect(divElement).toHaveClass('max-w-7xl');
    expect(divElement).toHaveClass('mx-auto');
  });

  it('renders with complex JSX children', () => {
    render(
      <Container>
        <header>
          <h1>Title</h1>
          <nav>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </nav>
        </header>
        <main>
          <section>
            <p>Section content</p>
          </section>
        </main>
      </Container>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders with null and undefined children', () => {
    render(
      <Container>
        {null}
        <div>Visible content</div>
        {undefined}
      </Container>,
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
    // Should not throw errors with null/undefined children
  });
});
