import "./styles.css";
import { useEffect, useRef, useState, useMemo } from "react";

/**
 * A reusable hook for executing expensive computations in a Web Worker.
 * @param workerFunction - The function to be executed inside the worker.
 */
export function useBlobWorker<TInput, TOutput>(
  workerFunction: (input: TInput) => TOutput
) {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<TOutput | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const workerScript = useMemo(() => {
    const functionString = workerFunction.toString();
    return `
      self.onmessage = function(event) {
        const input = event.data;
        const workerFunction = ${functionString};
        
  
        const output = workerFunction(input);
        self.postMessage(output);
      };
    `;
  }, []);

  useEffect(() => {
    const blob = new Blob([workerScript], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (event) => {
      setResult(event.data);
      setIsWorking(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerScript]);

  const runWorker = (input: TInput) => {
    if (workerRef.current) {
      setIsWorking(true);
      setResult(null);
      workerRef.current.postMessage(input);
    }
  };

  return { result, isWorking, runWorker };
}

// Sorting function with artificial delay
const sortArray = (arr: number[]) => {
  let i = 0;
  while (i < 10000000000) {
    i++;
  }
  return Array.from(new Set<number>(arr.sort((a, b) => a - b))).filter(
    (n) => n % 2 === 0
  );
};

export default function App() {
  const [color, setColor] = useState("white");
  const [counter, setCounter] = useState(0);
  const { result, isWorking, runWorker } = useBlobWorker(sortArray);

  const largeArray = useMemo(
    () =>
      Array.from({ length: 50000 }, () => Math.floor(Math.random() * 100000)),
    []
  );

  return (
    <div style={{ background: color, padding: "20px" }}>
      <h2>Sort Large Array</h2>
      <button onClick={() => setCounter((prev) => prev + 1)}>Increment</button>
      <button onClick={() => setCounter((prev) => prev - 1)}>Decrement</button>
      <button
        onClick={() => setColor((prev) => (prev === "white" ? "red" : "white"))}
      >
        Change Background
      </button>
      <button onClick={() => runWorker(largeArray)} disabled={isWorking}>
        {isWorking ? "Sorting..." : "Sort Now"}
      </button>
      <p>{counter}</p>
      <p>First 10 Numbers: {result?.join(", ")}</p>
    </div>
  );
}
