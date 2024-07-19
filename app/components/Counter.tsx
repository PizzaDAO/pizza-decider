import { useState } from "react";
import usePartySocket from "partysocket/react";

export default function Counter() {
  const [count, setCount] = useState<number | null>(null);

  const socket = usePartySocket({
    room: "example-room",
    onMessage(evt) {
      const data = JSON.parse(evt.data);
      if (data.type === "count") {
        setCount(data.count);
      }
    },
  });

  const increment = () => {
    setCount((prev) => (prev ?? 0) + 1);
    socket.send(JSON.stringify({ type: "increment" }));
  };

  const styles = {
    backgroundColor: "#ff0f0f",
    borderRadius: "9999px",
    border: "none",
    color: "white",
    fontSize: "0.95rem",
    cursor: "pointer",
    padding: "1rem 3rem",
    margin: "1rem 0rem",
  };

  return (
    <button style={styles} onClick={increment}>
      Increment me! {count !== null && <>Count: {count}</>}
    </button>
  );
}
