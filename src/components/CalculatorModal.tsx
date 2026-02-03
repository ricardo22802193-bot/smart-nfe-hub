import { useReducer } from "react";
import { X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalculatorModalProps {
  onClose: () => void;
}

interface CalcState {
  display: string;
  firstOperand: number | null;
  operator: string | null;
  waitingForSecond: boolean;
}

const normalizeOperator = (op: string) => {
  if (op === "x" || op === "X" || op === "*") return "×";
  if (op === "/") return "÷";
  return op;
};

type CalcAction =
  | { type: "DIGIT"; digit: string }
  | { type: "DECIMAL" }
  | { type: "OPERATOR"; operator: string }
  | { type: "EQUALS" }
  | { type: "PERCENT" }
  | { type: "NEGATE" }
  | { type: "CLEAR" }
  | { type: "BACKSPACE" };

const initialState: CalcState = {
  display: "0",
  firstOperand: null,
  operator: null,
  waitingForSecond: false,
};

const calculate = (a: number, b: number, op: string): number => {
  switch (normalizeOperator(op)) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b !== 0 ? a / b : 0;
    default: return b;
  }
};

const formatResult = (num: number): string => {
  if (!isFinite(num)) return "Erro";
  if (Number.isInteger(num)) return num.toString();
  // Limit decimal places and remove trailing zeros
  const formatted = num.toPrecision(10);
  return parseFloat(formatted).toString();
};

function calcReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "DIGIT": {
      if (state.waitingForSecond) {
        return {
          ...state,
          display: action.digit,
          waitingForSecond: false,
        };
      }
      return {
        ...state,
        display: state.display === "0" ? action.digit : state.display + action.digit,
      };
    }

    case "DECIMAL": {
      if (state.waitingForSecond) {
        return { ...state, display: "0.", waitingForSecond: false };
      }
      if (!state.display.includes(".")) {
        return { ...state, display: state.display + "." };
      }
      return state;
    }

    case "OPERATOR": {
      const currentValue = parseFloat(state.display);
      const nextOperator = normalizeOperator(action.operator);
      
      if (state.firstOperand === null) {
        return {
          ...state,
          firstOperand: currentValue,
          operator: nextOperator,
          waitingForSecond: true,
        };
      }
      
      if (state.waitingForSecond) {
        // Just change the operator
        return { ...state, operator: nextOperator };
      }
      
      // Calculate pending operation
      const result = calculate(state.firstOperand, currentValue, state.operator!);
      return {
        display: formatResult(result),
        firstOperand: result,
        operator: nextOperator,
        waitingForSecond: true,
      };
    }

    case "EQUALS": {
      if (state.firstOperand === null || state.operator === null) {
        return state;
      }
      const currentValue = parseFloat(state.display);
      const result = calculate(state.firstOperand, currentValue, state.operator);
      return {
        display: formatResult(result),
        firstOperand: null,
        operator: null,
        waitingForSecond: true,
      };
    }

    case "PERCENT": {
      const currentValue = parseFloat(state.display);

      if (state.firstOperand !== null && state.operator) {
        // Contextual percent (finance-style)
        // 10 + 20% => 12
        // 10 - 20% => 8
        // 10 × 20% => 2
        // 10 ÷ 20% => 50
        const base = state.firstOperand;
        const ratio = currentValue / 100;
        const op = normalizeOperator(state.operator);

        let result = base;
        switch (op) {
          case "+":
            result = base + base * ratio;
            break;
          case "-":
            result = base - base * ratio;
            break;
          case "×":
            result = base * ratio;
            break;
          case "÷":
            result = ratio !== 0 ? base / ratio : 0;
            break;
          default:
            result = base;
        }

        return {
          display: formatResult(result),
          firstOperand: null,
          operator: null,
          waitingForSecond: true,
        };
      }

      // No operator: just divide by 100
      return { ...state, display: formatResult(currentValue / 100) };
    }

    case "NEGATE": {
      const currentValue = parseFloat(state.display);
      return { ...state, display: formatResult(currentValue * -1) };
    }

    case "CLEAR":
      return initialState;

    case "BACKSPACE": {
      if (state.waitingForSecond) return state;
      if (state.display.length === 1 || (state.display.length === 2 && state.display[0] === "-")) {
        return { ...state, display: "0" };
      }
      return { ...state, display: state.display.slice(0, -1) };
    }

    default:
      return state;
  }
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [state, dispatch] = useReducer(calcReducer, initialState);

  const buttons = [
    ["C", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["±", "0", ".", "="],
  ];

  const handleButton = (btn: string) => {
    switch (btn) {
      case "C":
        dispatch({ type: "CLEAR" });
        break;
      case "⌫":
        dispatch({ type: "BACKSPACE" });
        break;
      case "±":
        dispatch({ type: "NEGATE" });
        break;
      case ".":
        dispatch({ type: "DECIMAL" });
        break;
      case "=":
        dispatch({ type: "EQUALS" });
        break;
      case "+":
      case "-":
      case "×":
      case "÷":
        dispatch({ type: "OPERATOR", operator: btn });
        break;
      case "%":
        dispatch({ type: "PERCENT" });
        break;
      default:
        dispatch({ type: "DIGIT", digit: btn });
    }
  };

  const getButtonStyle = (btn: string) => {
    if (btn === "=") {
      return "gradient-primary text-primary-foreground hover:opacity-90";
    }
    if (["+", "-", "×", "÷", "%"].includes(btn)) {
      return "bg-accent text-accent-foreground hover:bg-accent/80";
    }
    if (["C", "⌫", "±"].includes(btn)) {
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
    }
    return "bg-card text-card-foreground hover:bg-muted";
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-background rounded-2xl shadow-lg w-full max-w-xs overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Calculadora</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Display */}
        <div className="p-4 bg-muted/50">
          <div className="text-right">
            {state.firstOperand !== null && state.operator && (
              <p className="text-sm text-muted-foreground mb-1">
                {state.firstOperand} {state.operator}
              </p>
            )}
            <p className="text-3xl font-bold text-foreground truncate">
              {state.display}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 grid grid-cols-4 gap-2">
          {buttons.flat().map((btn, index) => (
            <button
              key={index}
              onClick={() => handleButton(btn)}
              className={`h-14 rounded-xl font-semibold text-lg transition-all active:scale-95 ${getButtonStyle(btn)}`}
            >
              {btn === "⌫" ? <Delete className="w-5 h-5 mx-auto" /> : btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;
