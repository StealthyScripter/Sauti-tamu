import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { mobileStyles } from "../../styles/mobileStyles";

export default function DialerScreen() {
  const router = useRouter();
  const [number, setNumber] = useState("");

  const addDigit = (digit:unknown) => {
    setNumber((prev) => prev + digit);
  };

  const deleteDigit = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const makeCall = () => {
    if (number) {
      router.push("/active-call");
      setTimeout(() => {
        setNumber("");
      }, 2000);
    }
  };

  const handleLongPressZero = () => {
    setNumber((prev) => prev + "+");
  };

  // Always maintain 3 columns: 123, 456, 789, *0#
  const keypadRows = [
    [{ digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' }],
    [{ digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' }],
    [{ digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' }],
    [{ digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' }],
  ];

  return (
    <View style={mobileStyles.containerWithSafeArea}>
      <Text style={mobileStyles.title}>SmartConnect</Text>
      <Text style={mobileStyles.subtitle}>AI-Powered Calling</Text>

      <View style={mobileStyles.numberDisplay}>
        <Text style={mobileStyles.numberText} numberOfLines={1} adjustsFontSizeToFit>
          {number || "Enter number"}
        </Text>
        {number ? (
          <TouchableOpacity style={mobileStyles.deleteButton} onPress={deleteDigit}>
            <Text style={mobileStyles.deleteText}>⌫</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={mobileStyles.keypad}>
        {keypadRows.map((row, rowIndex) => (
          <View key={rowIndex} style={mobileStyles.keypadRow}>
            {row.map((button) => (
              <TouchableOpacity
                key={button.digit}
                style={mobileStyles.keypadButton}
                onPress={() => addDigit(button.digit)}
                onLongPress={button.digit === '0' ? handleLongPressZero : undefined}
              >
                <Text style={mobileStyles.keyText}>{button.digit}</Text>
                {button.letters ? (
                  <Text style={mobileStyles.keyLetters}>{button.letters}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={[
          mobileStyles.callButton,
          !number && { backgroundColor: '#02e67f' }
        ]} 
        onPress={makeCall}
        disabled={!number}
      >
        <Text style={[
          { color: '#000', fontWeight: 'bold', fontSize: 18 },
          !number && { color: '#666' }
        ]}>
          📞 Call
        </Text>
      </TouchableOpacity>
    </View>
  );
}