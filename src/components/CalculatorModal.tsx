import { useState } from "react";
import { X, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalculatorModalProps {
  onClose: () => void;
}

const CalculatorModal = ({ onClose }: CalculatorModalProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay("0.");
      setNewNumber(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && !newNumber) {
      const result = calculate(previousValue, current, operation!);
      setDisplay(formatResult(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 ? a / b : 0;
      case "%":
        return a * (b / 100);
      default:
        return b;
    }
  };

  const formatResult = (num: number): string => {
    if (num === Math.floor(num)) {
      return num.toString();
    }
    return num.toFixed(4).replace(/\.?0+$/, "");
  };

  const handleEquals = () => {
    if (previousValue === null || operation === null) return;
    
    const current = parseFloat(display);
    const result = calculate(previousValue, current, operation);
    setDisplay(formatResult(result));
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length === 1 || (display.length === 2 && display[0] === "-")) {
      setDisplay("0");
      setNewNumber(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

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
        handleClear();
        break;
      case "⌫":
        handleBackspace();
        break;
      case "±":
        setDisplay((parseFloat(display) * -1).toString());
        break;
      case ".":
        handleDecimal();
        break;
      case "=":
        handleEquals();
        break;
      case "+":
      case "-":
      case "×":
      case "÷":
      case "%":
        handleOperation(btn);
        break;
      default:
        handleNumber(btn);
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
            {previousValue !== null && operation && (
              <p className="text-sm text-muted-foreground mb-1">
                {previousValue} {operation}
              </p>
            )}
            <p className="text-3xl font-bold text-foreground truncate">
              {display}
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
