const isEnter = (e: KeyboardEvent) => e.key === "Enter";

export const ifIsEnter =
  (fn: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
    if (isEnter(e)) {
      fn(e);
    }
  };

export const ifIsEscape =
  (fn: (e: KeyboardEvent) => void) => (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      fn(e);
    }
  };
