import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import Home from "./page"

describe("Calculator page", () => {
    it("рендерит заголовок", () => {
        render(<Home />)
        const main = within(screen.getByRole("main"))
        expect(main.getByRole("heading", { name: /calculator/i, level: 1 })).toBeDefined()
    })

    it("складывает 2 и 3 = 5", async () => {
        render(<Home />)
        fireEvent.change(screen.getByLabelText("Число A"), { target: { value: "2" } })
        fireEvent.change(screen.getByLabelText("Число B"), { target: { value: "3" } })
        fireEvent.change(screen.getByLabelText("Операция"), { target: { value: "+" } })
        fireEvent.click(screen.getByText("Посчитать"))
        expect(await screen.findByText(/Результат:\s*5/)).toBeInTheDocument()
    })

    it("умножает 2 и 4 = 8", async () => {
        render(<Home />)
        fireEvent.change(screen.getByLabelText("Число A"), { target: { value: "2" } })
        fireEvent.change(screen.getByLabelText("Число B"), { target: { value: "4" } })
        fireEvent.change(screen.getByLabelText("Операция"), { target: { value: "*" } })
        fireEvent.click(screen.getByText("Посчитать"))
        expect(await screen.findByText(/Результат:\s*8/)).toBeInTheDocument()
    })

    it("показывает ошибку при строковом вводе", async () => {
        render(<Home />)
        fireEvent.change(screen.getByLabelText("Число A"), { target: { value: "abc" } })
        fireEvent.change(screen.getByLabelText("Число B"), { target: { value: "1" } })
        fireEvent.click(screen.getByText("Посчитать"))
        expect(await screen.findByRole("alert")).toHaveTextContent(/Ошибка/i)
        expect(screen.queryByText(/Результат:/)).toBeNull()
    })

    it("ошибка при делении на ноль", async () => {
        render(<Home />)
        fireEvent.change(screen.getByLabelText("Число A"), { target: { value: "10" } })
        fireEvent.change(screen.getByLabelText("Число B"), { target: { value: "0" } })
        fireEvent.change(screen.getByLabelText("Операция"), { target: { value: "/" } })
        fireEvent.click(screen.getByText("Посчитать"))
        expect(await screen.findByRole("alert")).toHaveTextContent(/ошибка при делении на ноль/i)
    })
})
