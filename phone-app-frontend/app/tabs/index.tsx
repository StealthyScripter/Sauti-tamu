// app/index.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";

export default function DialerScreen() {
  const router = useRouter();
  const [number, setNumber] = useState("");

  const addDigit = (digit: string) => {
    setNumber((prev) => prev + digit);
  };

  const makeCall = () => {
    if (number) {
      router.push('/active-call');
      setTimeout(() => {
        setNumber("");
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartConnect</Text>
      <Text style={styles.subtitle}>AI-Powered Calling</Text>

      <View style={styles.display}>
        <Text style={styles.number}>{number || "Enter number"}</Text>
      </View>

      <View style={styles.keypad}>
        {"123456789*0#".split("").map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.key}
            onPress={() => addDigit(digit)}
          >
            <Text style={styles.keyText}>{digit}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={makeCall}>
        <Text style={styles.callText}>📞 Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0f23",
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 40,
  },
  subtitle: {
    color: "#00ff88",
    fontSize: 14,
    marginBottom: 20,
  },
  display: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  number: {
    color: "#fff",
    fontSize: 24,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  key: {
    width: 80,
    height: 80,
    backgroundColor: "#1a1a2e",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  keyText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  callBtn: {
    backgroundColor: "#00ff88",
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 40,
    marginTop: 20,
  },
  callText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
});
