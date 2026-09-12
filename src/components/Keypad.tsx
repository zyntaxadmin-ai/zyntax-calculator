// ============================================================
// Keypad.tsx — the button grid.
// Layout (4 columns):
//   small scientific row : (  )  √  x²  π
//   row 1                : AC ⌫  %  ÷
//   rows 2-4             : 7 8 9 × / 4 5 6 − / 1 2 3 +
//   row 5                : 0 (wide)  .  =
// ============================================================

import { Delete } from "lucide-react";
import type { CalculatorApi } from "../hooks/useCalculator";
import CalcButton from "./CalcButton";

interface KeypadProps {
  calc: CalculatorApi;
}

export default function Keypad({ calc }: KeypadProps) {
  const { activeOperator } = calc;

  // Small helper so the JSX grid below stays easy to read.
  const isActive = (op: string) => activeOperator === op;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Scientific row — small keys */}
      <div className="grid grid-cols-5 gap-2">
        <CalcButton variant="sci" ariaLabel="Open parenthesis" onPress={calc.pressLeftParen} className="h-11 text-lg">
          {"("}
        </CalcButton>
        <CalcButton variant="sci" ariaLabel="Close parenthesis" onPress={calc.pressRightParen} className="h-11 text-lg">
          {")"}
        </CalcButton>
        <CalcButton variant="sci" ariaLabel="Square root" onPress={calc.pressSqrt} className="h-11 text-lg">
          {"√"}
        </CalcButton>
        <CalcButton variant="sci" ariaLabel="Square" onPress={calc.pressSquare} className="h-11 text-lg">
          {"x²"}
        </CalcButton>
        <CalcButton variant="sci" ariaLabel="Pi" onPress={calc.pressPi} className="h-11 text-lg">
          {"π"}
        </CalcButton>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-4 gap-2.5">
        <CalcButton variant="util" ariaLabel="All clear" onPress={calc.clearAll} className="h-16 text-xl font-semibold text-rose-300 md:h-[68px]">
          AC
        </CalcButton>
        <CalcButton variant="util" ariaLabel="Backspace" onPress={calc.pressBackspace} className="h-16 md:h-[68px]">
          <Delete size={22} strokeWidth={2.2} />
        </CalcButton>
        <CalcButton variant="util" ariaLabel="Percent" onPress={calc.pressPercent} className="h-16 md:h-[68px]">
          %
        </CalcButton>
        <CalcButton variant="op" active={isActive("/")} ariaLabel="Divide" onPress={() => calc.pressOperator("/")} className="h-16 text-2xl md:h-[68px]">
          ÷
        </CalcButton>

        {["7", "8", "9"].map((d) => (
          <CalcButton key={d} ariaLabel={d} onPress={() => calc.pressDigit(d)} className="h-16 text-2xl md:h-[68px]">
            {d}
          </CalcButton>
        ))}
        <CalcButton variant="op" active={isActive("*")} ariaLabel="Multiply" onPress={() => calc.pressOperator("*")} className="h-16 text-2xl md:h-[68px]">
          ×
        </CalcButton>

        {["4", "5", "6"].map((d) => (
          <CalcButton key={d} ariaLabel={d} onPress={() => calc.pressDigit(d)} className="h-16 text-2xl md:h-[68px]">
            {d}
          </CalcButton>
        ))}
        <CalcButton variant="op" active={isActive("-")} ariaLabel="Subtract" onPress={() => calc.pressOperator("-")} className="h-16 text-2xl md:h-[68px]">
          −
        </CalcButton>

        {["1", "2", "3"].map((d) => (
          <CalcButton key={d} ariaLabel={d} onPress={() => calc.pressDigit(d)} className="h-16 text-2xl md:h-[68px]">
            {d}
          </CalcButton>
        ))}
        <CalcButton variant="op" active={isActive("+")} ariaLabel="Add" onPress={() => calc.pressOperator("+")} className="h-16 text-2xl md:h-[68px]">
          +
        </CalcButton>

        <CalcButton ariaLabel="Zero" onPress={() => calc.pressDigit("0")} className="col-span-2 h-16 text-2xl md:h-[68px]">
          0
        </CalcButton>
        <CalcButton ariaLabel="Decimal point" onPress={calc.pressDot} className="h-16 text-2xl md:h-[68px]">
          .
        </CalcButton>
        <CalcButton variant="eq" ariaLabel="Equals" onPress={calc.pressEquals} className="h-16 text-2xl font-semibold md:h-[68px]">
          =
        </CalcButton>
      </div>
    </div>
  );
}
